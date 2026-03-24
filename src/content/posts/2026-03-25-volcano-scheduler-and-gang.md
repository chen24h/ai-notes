---
title: "Volcano 调度框架和 Gang 插件是怎么工作的"
summary: "从调度主循环、session 框架、action 流程讲到 gang 插件代码，理解 Volcano 为什么能做成组调度，以及它到底把约束嵌在了哪些环节里。"
publishedAt: 2026-03-25
updatedAt: 2026-03-25
status: published
tags:
  - volcano
  - kubernetes
  - scheduler
  - gang-scheduling
  - batch
category: theme
truthStandard: "本文只使用 Volcano 官方文档和官方仓库代码中的可核验信息；对代码意图的解释会明确标注为推断。"
thesis: "Volcano 的关键不只是支持 gang 调度，而是把 gang 约束拆进了调度生命周期的多个 extension point：入队、分配、排序、ready/pipelined 判定以及抢占/回收保护。"
sources:
  - title: "Actions"
    publisher: "Volcano Docs"
    url: "https://volcano.sh/en/docs/v1-12-0/actions/"
    accessedAt: "2026-03-25"
    note: "官方文档对 enqueue / allocate / backfill / preempt / reclaim 的职责说明。"
  - title: "Plugins"
    publisher: "Volcano Docs"
    url: "https://volcano.sh/en/docs/v1-11-0/plugins/"
    accessedAt: "2026-03-25"
    note: "官方文档对 gang 插件“all or nothing”语义的说明。"
  - title: "PodGroup"
    publisher: "Volcano Docs"
    url: "https://volcano.sh/en/docs/v1-7-0/podgroup/"
    accessedAt: "2026-03-25"
    note: "PodGroup、minMember、phase/inqueue 等字段的官方定义。"
  - title: "VolcanoJob"
    publisher: "Volcano Docs"
    url: "https://volcano.sh/en/docs/vcjob/"
    accessedAt: "2026-03-25"
    note: "VolcanoJob 中 minAvailable 和 tasks 的官方定义。"
  - title: "pkg/scheduler/scheduler.go"
    publisher: "volcano-sh/volcano"
    url: "https://github.com/volcano-sh/volcano/blob/master/pkg/scheduler/scheduler.go"
    accessedAt: "2026-03-25"
    note: "调度主循环 runOnce 和 OpenSession/CloseSession。"
  - title: "pkg/scheduler/framework/session.go"
    publisher: "volcano-sh/volcano"
    url: "https://github.com/volcano-sh/volcano/blob/master/pkg/scheduler/framework/session.go"
    accessedAt: "2026-03-25"
    note: "Session 结构体和插件扩展点注册容器。"
  - title: "pkg/scheduler/actions/factory.go"
    publisher: "volcano-sh/volcano"
    url: "https://github.com/volcano-sh/volcano/blob/master/pkg/scheduler/actions/factory.go"
    accessedAt: "2026-03-25"
    note: "Action 注册顺序。"
  - title: "pkg/scheduler/actions/enqueue/enqueue.go"
    publisher: "volcano-sh/volcano"
    url: "https://github.com/volcano-sh/volcano/blob/master/pkg/scheduler/actions/enqueue/enqueue.go"
    accessedAt: "2026-03-25"
    note: "Enqueue 动作如何将 Job 置为 Inqueue。"
  - title: "pkg/scheduler/actions/allocate/allocate.go"
    publisher: "volcano-sh/volcano"
    url: "https://github.com/volcano-sh/volcano/blob/master/pkg/scheduler/actions/allocate/allocate.go"
    accessedAt: "2026-03-25"
    note: "Allocate 的 queue->job->task->predicate->nodeorder 主流程。"
  - title: "pkg/scheduler/plugins/gang/gang.go"
    publisher: "volcano-sh/volcano"
    url: "https://github.com/volcano-sh/volcano/blob/master/pkg/scheduler/plugins/gang/gang.go"
    accessedAt: "2026-03-25"
    note: "Gang 插件注册的 JobValid / JobOrder / Ready / Pipelined / Preemptable 等钩子。"
  - title: "pkg/scheduler/api/job_info.go"
    publisher: "volcano-sh/volcano"
    url: "https://github.com/volcano-sh/volcano/blob/master/pkg/scheduler/api/job_info.go"
    accessedAt: "2026-03-25"
    note: "MinAvailable、CheckTaskValid/Ready/Pipelined、IsReady/IsPipelined/IsStarving 的实现。"
facts:
  - claim: "Volcano 每个调度周期会在 runOnce 中打开一个 Session，顺序执行配置好的 actions，然后关闭 Session。"
    evidence: "`scheduler.go` 的 `runOnce` 中先 `framework.OpenSession(...)`，随后 `for _, action := range actions { action.Execute(ssn) }`，最后 `defer framework.CloseSession(ssn)`。"
    source: "https://github.com/volcano-sh/volcano/blob/master/pkg/scheduler/scheduler.go"
    confidence: "high"
    boundary: "具体 action 列表取决于当前 scheduler 配置，但一个 scheduling cycle 的整体框架就是 open session -> execute actions -> close session。"
  - claim: "Action 工厂默认注册了 reclaim、allocate、backfill、preempt、enqueue、shuffle 这些动作。"
    evidence: "`actions/factory.go` 的 `init()` 中显式调用 `framework.RegisterAction(...)` 注册这些 action。"
    source: "https://github.com/volcano-sh/volcano/blob/master/pkg/scheduler/actions/factory.go"
    confidence: "high"
    boundary: "注册过不等于一定执行，真正执行顺序仍由配置文件中的 actions 决定。"
  - claim: "Enqueue 动作的目标是把符合条件的作业从 Pending 推到 Inqueue；官方文档明确指出只有最小资源需求满足后，PodGroup 才能进入 Inqueue。"
    evidence: "官方 Actions 文档说明 Enqueue 负责将合格的 job 过滤入队；`enqueue.go` 中若 `job.PodGroup.Spec.MinResources == nil || ssn.JobEnqueueable(job)`，则将 `job.PodGroup.Status.Phase` 置为 `PodGroupInqueue`。"
    source: "https://volcano.sh/en/docs/v1-12-0/actions/"
    confidence: "high"
    boundary: "是否 enqueue 还会受 JobEnqueueable 相关插件投票影响，不能简化为只看一个字段。"
  - claim: "Allocate 是 Volcano 的核心分配动作，代码注释明确给出 queue -> job -> task -> predicate -> nodeorder 的主流程。"
    evidence: "`allocate.go` 在 `Execute` 的注释中列出 1) pick queue 2) pick job 3) pick task 4) predicate filter 5) node order best fit 的分配步骤。"
    source: "https://github.com/volcano-sh/volcano/blob/master/pkg/scheduler/actions/allocate/allocate.go"
    confidence: "high"
    boundary: "真实分配过程中还会穿插 topology、subJob、commit 等逻辑，但这条注释已经给出主骨架。"
  - claim: "Gang 插件不是单一的判定逻辑，而是在 Session 打开时注册了 JobValid、JobOrder、JobReady、JobPipelined、Preemptable/Reclaimable 等多个扩展点。"
    evidence: "`gang.go` 的 `OnSessionOpen` 里调用了 `AddJobValidFn`、`AddJobOrderFn`、`AddJobReadyFn`、`AddJobPipelinedFn`、`AddReclaimableFn`、`AddPreemptableFn` 等接口。"
    source: "https://github.com/volcano-sh/volcano/blob/master/pkg/scheduler/plugins/gang/gang.go"
    confidence: "high"
    boundary: "最终调度行为是多个插件共同作用的结果，但 gang 插件确实在多个 extension point 上持续施加约束。"
  - claim: "Gang 的核心判断基于 MinAvailable 以及 task/subJob 级别的最小成员校验；JobInfo 中的 IsReady/IsPipelined/IsStarving 都直接围绕 MinAvailable 计算。"
    evidence: "`job_info.go` 中 `CheckTaskValid`、`CheckTaskReady`、`CheckTaskPipelined` 会检查 task 级 min available；`IsReady` 定义为 `ReadyTaskNum + PendingBestEffortTaskNum >= MinAvailable`，`IsPipelined` 定义为 `WaitingTaskNum + ReadyTaskNum + PendingBestEffortTaskNum >= MinAvailable`。"
    source: "https://github.com/volcano-sh/volcano/blob/master/pkg/scheduler/api/job_info.go"
    confidence: "high"
    boundary: "文章聚焦 gang 主路径；Volcano 还支持 subJob、task role minimum 等更细粒度语义，具体行为要结合实际 Job 定义。"
---

很多人谈 Volcano，只会说一句“它支持 gang scheduling”。  
这句话不算错，但没说到重点。

真正值得看的不是“它支持不支持”，而是：

**Volcano 到底把 gang 约束放在了调度流程的哪些位置。**

如果只把 gang 理解成“调度前做一次 all-or-nothing 判断”，那会低估 Volcano 这套框架。它做得更系统：不仅在入队时看、分配时看，连排序、ready/pipelined 判定、抢占和资源回收时都还在看。

这篇文章就按这个顺序讲：

1. Volcano 的调度主循环和 action 框架长什么样  
2. Allocate 的主流程到底怎么跑  
3. gang 插件在代码里到底注册了哪些钩子  
4. `MinAvailable` 和 `JobInfo` 这些字段是怎么把 gang 语义落进实现里的

## 先把几个概念摆正

Volcano 自己的 gang 调度并不是悬在空中的算法，它落在几个核心对象上：

- `PodGroup`：把强关联的一组 Pod 绑成一个调度单元
- `spec.minMember`：PodGroup 至少要同时满足的最小成员数
- `VolcanoJob.spec.minAvailable`：Job 至少需要多少个 Pod 进入运行态

官方文档对这点讲得很直白：  
如果 `minMember` 或 `minAvailable` 不能满足，那这组 Pod 就不该被“零散地”启动。

这其实就是 gang 的基本语义：

**不是先把能跑的那几个 Pod 放出去，再说剩下的；而是先判断这一组工作负载能不能成组成立。**

## Volcano 调度器一轮调度到底怎么跑

Volcano 的调度主循环在 [`pkg/scheduler/scheduler.go`](https://github.com/volcano-sh/volcano/blob/master/pkg/scheduler/scheduler.go)。

看 `runOnce()`，主线非常清楚：

1. 读取当前启用的 actions 和 plugin tiers
2. `OpenSession(cache, plugins, configurations)`
3. 按顺序执行每个 action 的 `Execute(ssn)`
4. `CloseSession(ssn)`，并把这轮调度的脏状态刷回 cache / status

也就是说，Volcano 不像“写死一个大调度函数”的实现。  
它更像一个分阶段执行的调度框架，`Session` 是这轮调度的上下文容器，`Action` 决定阶段，`Plugin` 通过 extension point 把策略注入进去。

![Volcano scheduler flow](https://chen24h.github.io/ai-notes/diagrams/volcano-scheduler-flow.svg)

*图：自绘示意。Volcano 每轮调度的主骨架是 `OpenSession -> actions -> CloseSession`，gang 等插件通过 session hooks 介入。*

## Action 框架：Volcano 为什么不是“只做绑定”

Volcano 官方文档对 actions 的分工写得很明确：

- `enqueue`：把符合条件的 job 送进可调度队列
- `allocate`：执行真正的资源分配
- `backfill`：处理 BestEffort 任务
- `preempt`：同队列内抢占
- `reclaim`：跨队列资源回收

这套动作的默认注册可以直接在 [`pkg/scheduler/actions/factory.go`](https://github.com/volcano-sh/volcano/blob/master/pkg/scheduler/actions/factory.go) 看到。

它的关键价值是：  
Volcano 把“调度”拆成了几个逻辑边界更清晰的阶段，而不是把所有事情都塞进一次 allocation 里。

这点对 batch、AI、MPI 这类工作负载特别重要，因为这些工作负载常常不是“来一个 Pod 就立刻找节点”这么简单，而是要先判断这组 Pod 有没有资格进场，再考虑怎么分配，再考虑抢占和回收是否会破坏已有 gang。

## Enqueue：为什么 Volcano 要先做一次“入队”动作

这是很多第一次看 Volcano 代码的人容易忽略的一步。

在官方文档里，`enqueue` 的定位很明确：  
**只有当 job 的最小资源诉求满足时，PodGroup 才应该从 `Pending` 进入 `Inqueue`。**

这一步的意义不是形式主义，而是非常务实：

- 如果资源根本不够，就不要提前把一堆 Pod 创建出来
- 减少集群里“注定调度不了”的 Pending Pod
- 让后续 action 不必在大量无效对象上空转

代码在 [`pkg/scheduler/actions/enqueue/enqueue.go`](https://github.com/volcano-sh/volcano/blob/master/pkg/scheduler/actions/enqueue/enqueue.go) 里也很直观：

- 遍历 Job，挑出 `job.IsPending()` 的作业
- 以 queue 为单位组织 pending jobs
- 如果 `job.PodGroup.Spec.MinResources == nil || ssn.JobEnqueueable(job)`，则调用 `ssn.JobEnqueued(job)`，并把 `job.PodGroup.Status.Phase` 改成 `PodGroupInqueue`

所以 `enqueue` 本质上是在做一次“资格检查”。  
Gang 语义在这里已经开始起作用了，因为一旦连入队资格都不满足，后面的 allocate 再聪明也没用。

## Allocate：Volcano 调度的主战场

真正要理解 Volcano 的流程框架，必须看 `allocate`。

在 [`pkg/scheduler/actions/allocate/allocate.go`](https://github.com/volcano-sh/volcano/blob/master/pkg/scheduler/actions/allocate/allocate.go) 的注释里，作者直接把主流程写出来了：

1. pick a queue
2. pick a job from queue
3. pick a task from job
4. 用 predicate 过滤不能落的节点
5. 用 node order 找到更合适的节点

这是理解 Volcano 的关键。  
它的基本分配骨架不是“Pod -> Node”，而是：

**Queue -> Job -> Task -> Node**

这非常符合 batch 调度器的思维方式。  
因为它首先要处理的不是单个 Pod 的局部最优，而是 job/queue 级别的整体调度语义。

更关键的是，`allocate` 在真正组织 worksheet 之前会先做一次：

```go
if vr := ssn.JobValid(job); vr != nil && !vr.Pass {
    continue
}
```

这句代码直接说明一件事：

**gang 插件并不是在 allocate 结束后做“补充说明”，而是在 allocate 入口就能把不满足 gang 条件的 job 拦掉。**

## Session：Volcano 的插件框架为什么很强

Volcano 的插件不是通过一个“统一 Filter 接口”完成全部逻辑，而是围绕 `Session` 提供了一大批扩展点。

看 [`pkg/scheduler/framework/session.go`](https://github.com/volcano-sh/volcano/blob/master/pkg/scheduler/framework/session.go)，`Session` 里面存了很多函数表：

- `jobOrderFns`
- `predicateFns`
- `nodeOrderFns`
- `jobReadyFns`
- `jobPipelinedFns`
- `jobValidFns`
- `preemptableFns`
- `reclaimableFns`

这意味着 Volcano 的插件不只是“给节点打分”这么简单，而是可以在一个完整调度周期的多个环节里持续影响决策。

所以理解 Volcano 的正确方式不是：

“它有很多插件。”

而是：

**它把调度生命周期拆成很多 extension point，插件在不同点上承担不同责任。**

这正是 gang 插件实现得这么稳的原因。

## Gang 插件到底做了什么

真正的核心代码在 [`pkg/scheduler/plugins/gang/gang.go`](https://github.com/volcano-sh/volcano/blob/master/pkg/scheduler/plugins/gang/gang.go)。

如果只看 `OnSessionOpen()`，就能看出这个插件不是“单函数算法”，而是一组钩子。

### 1. `AddJobValidFn`

这是最先该看的。

`gang` 注册的 `validJobFn` 做了三层检查：

1. `job.CheckTaskValid()`
2. `job.CheckSubJobValid()`
3. `job.ValidTaskNum() >= job.MinAvailable`

只要有一层不满足，就返回 `ValidateResult{Pass: false, ...}`。

这意味着什么？

意味着一个 job 如果连最基本的 gang 成立条件都不满足，根本进不了 allocate 的实质分配流程。

### 2. `AddJobOrderFn`

`gang` 还注册了 `jobOrderFn`。

它的逻辑很简单：ready 的 Job 优先于不 ready 的 Job。

表面上看只是排序，实际上它把 gang 语义塞进了 job 级优先级中。  
换句话说，gang 不只是“能不能调”，还会影响“谁先调”。

### 3. `AddJobReadyFn` 和 `AddJobPipelinedFn`

这两个钩子是理解 Volcano gang 语义非常关键的一步。

`AddJobReadyFn` 要求：

- `CheckTaskReady()`
- `CheckSubJobReady()`
- `IsReady()`

`AddJobPipelinedFn` 要求：

- `CheckTaskPipelined()`
- `CheckSubJobPipelined()`
- `IsPipelined()`

也就是说，Volcano 不只维护一个“ready / not ready”的二元状态。  
它还维护一个更宽松的 pipelined 概念，用来表示这个 Job 是否已经接近 gang 条件、是否值得继续推进。

### 4. `AddPreemptableFn` 和 `AddReclaimableFn`

这是很多文章都略过，但实际上非常关键的部分。

`gang` 注册了同一个 `preemptableFn` 作为：

- reclaimableFn
- preemptableFn

它的逻辑也很清楚：  
遍历潜在受害者任务时，只有当对应 job 在减掉这个 task 后，仍然满足 `ReadyTaskNum > MinAvailable`，才允许把这个 task 作为 victim。

这条约束极其重要。  
否则一个新的 job 为了满足 gang，把另一个已经成 gang 的 job 拆散，系统就会陷入来回打断、整体退化的状态。

![Volcano gang hooks](https://chen24h.github.io/ai-notes/diagrams/volcano-gang-plugin-hooks.svg)

*图：自绘示意。gang 插件不是一次性判定，而是在验证、排序、ready/pipelined 判定、抢占/回收保护等多个钩子上持续起作用。*

## gang.go 为什么必须和 job_info.go 一起看

只看 `gang.go`，很容易知道它“注册了什么”；但不知道这些判断真正落在什么定义上。

真正的语义在 [`pkg/scheduler/api/job_info.go`](https://github.com/volcano-sh/volcano/blob/master/pkg/scheduler/api/job_info.go)。

这里有几个最关键的函数：

### `CheckTaskValid()`

这一步主要看 task role 级别的最小成员是否满足。  
代码里会遍历 `TaskMinAvailable`，统计各 task role 当前有效任务数，只要某个角色的有效任务数小于最小值，就返回 false。

### `CheckTaskReady()`

它关注的不是“是否存在任务”，而是某个 task role 已经占住的资源是否达到最小要求。

### `CheckTaskPipelined()`

它比 ready 更宽松，会把 `Allocated`、`Succeeded`、`Pipelined` 等状态一起算进去，回答的问题是：

**这组任务是否已经足够接近 gang 成立，可以继续往前推。**

### `IsReady()` / `IsPipelined()` / `IsStarving()`

这三个函数是 gang 语义真正落地的简写：

- `IsReady()`：`ReadyTaskNum + PendingBestEffortTaskNum >= MinAvailable`
- `IsPipelined()`：`WaitingTaskNum + ReadyTaskNum + PendingBestEffortTaskNum >= MinAvailable`
- `IsStarving()`：`WaitingTaskNum + ReadyTaskNum < MinAvailable`

一旦把这三个函数看明白，`gang.go` 里很多判断就顺了。

因为 gang 插件做的事情，本质上不是“重新定义一套 gang 规则”，而是：

**在 session 的多个 extension point 上，反复调用 `JobInfo` 已经定义好的 ready / pipelined / starving 语义。**

## 用一句话总结 Volcano 的 gang 实现

Volcano 的 gang 调度，不是“进 allocate 前做一次 all-or-nothing 判断”这么简单。

它更像一套分层保护机制：

- `enqueue` 阶段先看有没有资格入场
- `allocate` 阶段先过 `JobValid`
- `jobOrder` 让已经 ready 的 job 有更高优先级
- `jobReady` / `jobPipelined` 维护 job 的 gang 状态
- `preempt/reclaim` 再保证已有 gang 不会被轻易拆散

这也是为什么 Volcano 的 gang 能做得比较完整。  
它不是一个孤立算法，而是嵌在整个调度框架里。

## 最后一个判断

如果只记一句话，我会这样概括 Volcano 的 gang：

**它不是把 Job 当成“一组必须一起调度的 Pod”这么简单，而是把 Job 变成一个在多个调度阶段持续被维护约束的调度实体。**

这正是 Volcano 相比默认 Kubernetes scheduler 更像 batch / AI / HPC 调度器的地方。

如果要继续深挖，下一步最值得看的不是概念，而是这 4 个点：

1. `Session` 里不同 extension point 的调用链是谁触发的  
2. `allocate` 里的 commit 机制如何决定“先算可行，再真正绑定”  
3. `gang` 和 `drf / proportion / binpack` 这类插件叠加时，优先级怎么交互  
4. `taskMinAvailable / subJob / network topology` 这些高级语义如何扩展基础 gang 模型
