---
title: "大模型推理平台方案怎么选"
summary: "从执行引擎、路由与调度、缓存、控制面和成本视角，讲清大模型推理平台真正的方案分歧，以及团队应该先把哪一层做重。"
publishedAt: 2026-03-26
updatedAt: 2026-03-26
status: published
tags:
  - llm-serving
  - ai-infra
  - inference-platform
  - vllm
  - tensorrt-llm
  - kserve
category: essay
truthStandard: "本文只使用 vLLM、SGLang、TensorRT-LLM、KServe 官方文档中的可核验信息；对平台层方案的抽象总结会和原始定义区分。"
thesis: "大模型推理平台的核心分歧，不是选哪个 serving engine，而是如何把执行层、路由层、资源层和控制面拼成一套能稳定运营的系统；不同阶段应选择不同复杂度的方案。"
sources:
  - title: "OpenAI-Compatible Server"
    publisher: "vLLM Docs"
    url: "https://docs.vllm.ai/en/stable/serving/openai_compatible_server/"
    accessedAt: "2026-03-26"
    note: "vLLM 在服务接口层的能力。"
  - title: "Automatic Prefix Caching"
    publisher: "vLLM Docs"
    url: "https://docs.vllm.ai/en/stable/features/automatic_prefix_caching/"
    accessedAt: "2026-03-26"
    note: "vLLM 在缓存层的能力。"
  - title: "SGLang Documentation"
    publisher: "SGLang"
    url: "https://docs.sglang.ai/index.html"
    accessedAt: "2026-03-26"
    note: "SGLang serving runtime 的能力总览。"
  - title: "SGLang Model Gateway"
    publisher: "SGLang"
    url: "https://docs.sglang.ai/advanced_features/router.html"
    accessedAt: "2026-03-26"
    note: "SGLang router / gateway 的独立能力。"
  - title: "TensorRT-LLM Overview"
    publisher: "TensorRT-LLM"
    url: "https://nvidia.github.io/TensorRT-LLM/overview.html"
    accessedAt: "2026-03-26"
    note: "TensorRT-LLM 的官方定位。"
  - title: "Disaggregated Serving"
    publisher: "TensorRT-LLM"
    url: "https://nvidia.github.io/TensorRT-LLM/1.2.0rc6/features/disagg-serving.html"
    accessedAt: "2026-03-26"
    note: "prefill/decode 解耦与 KV cache 传输。"
  - title: "Runtime Overview"
    publisher: "KServe"
    url: "https://kserve.github.io/website/docs/model-serving/generative-inference/overview"
    accessedAt: "2026-03-26"
    note: "KServe generative inference runtime 概览。"
  - title: "KServe Home"
    publisher: "KServe"
    url: "https://kserve.github.io/website/"
    accessedAt: "2026-03-26"
    note: "KServe 对 standardized inference platform 的官方定义。"
facts:
  - claim: "vLLM 官方文档明确提供 OpenAI-compatible HTTP server。"
    evidence: "OpenAI-Compatible Server 文档直接说明可以通过 `vllm serve` 启动 OpenAI-compatible server。"
    source: "https://docs.vllm.ai/en/stable/serving/openai_compatible_server/"
    confidence: "high"
    boundary: "兼容 OpenAI 接口不代表整个平台能力完整，更多还是执行层 + 服务暴露能力。"
  - claim: "vLLM 官方文档明确提供 Automatic Prefix Caching，用于共享前缀时复用 KV cache。"
    evidence: "Automatic Prefix Caching 文档说明可在共享前缀场景中直接复用已有 KV cache。"
    source: "https://docs.vllm.ai/en/stable/features/automatic_prefix_caching/"
    confidence: "high"
    boundary: "收益依赖 workload 是否存在高前缀复用。"
  - claim: "SGLang 官方文档将自身定义为高性能 serving framework，并列出 RadixAttention、zero-overhead CPU scheduler、prefill-decode disaggregation、continuous batching、structured outputs 等能力。"
    evidence: "SGLang 文档首页的 Fast Backend Runtime 部分逐项列出这些特性。"
    source: "https://docs.sglang.ai/index.html"
    confidence: "high"
    boundary: "这些是 runtime 层能力，不自动等于完整平台控制面。"
  - claim: "SGLang Router 是一个独立组件，可以作为 OpenAI API 的替代入口，并带有 cache-aware load balancing。"
    evidence: "SGLang Router 文档明确说明 router is an independent package and can be used as a drop-in replacement for the OpenAI API，并使用 cache-aware load-balancing algorithm。"
    source: "https://docs.sglang.ai/advanced_features/router.html"
    confidence: "high"
    boundary: "这是 SGLang 自带的路由能力，但是否足够替代企业平台网关要看多租户、鉴权、发布等诉求。"
  - claim: "TensorRT-LLM 官方将自己定义为在 NVIDIA GPU 上加速和优化 LLM 推理的开源库，并明确提供 Disaggregated Serving。"
    evidence: "Overview 页面说明 TensorRT-LLM is NVIDIA’s comprehensive open-source library for accelerating and optimizing inference performance；同时官方功能列表包含 Disaggregated Serving。"
    source: "https://nvidia.github.io/TensorRT-LLM/overview.html"
    confidence: "high"
    boundary: "这类优化天然更偏 NVIDIA 生态，通用性和硬件依赖需要与通用 serving engine 区分。"
  - claim: "TensorRT-LLM 的官方 Disaggregated Serving 文档明确支持把 context 和 generation server 分开部署，并支持 multi-gpu 和 multi-node。"
    evidence: "官方 FAQ 中明确回答 context/generation servers 可以同机或跨节点运行，并支持 multi-gpu and multi-node。"
    source: "https://nvidia.github.io/TensorRT-LLM/1.2.0rc6/features/disagg-serving.html"
    confidence: "high"
    boundary: "文档同时指出并非所有混合场景都已做最优调度，意味着收益伴随更高系统复杂度。"
  - claim: "KServe 官方将自己定义为标准化的 AI 推理平台，并在 generative inference runtime overview 中明确说明其 Hugging Face runtime 使用 vLLM backend。"
    evidence: "KServe 首页写明 standardized distributed generative and predictive AI inference platform；Runtime Overview 说明 Hugging Face runtime uses `vLLM` backend engine。"
    source: "https://kserve.github.io/website/docs/model-serving/generative-inference/overview"
    confidence: "high"
    boundary: "KServe 更像 Kubernetes 上的平台层封装，其底层执行能力仍依赖具体 backend。"
---

如果把“大模型推理平台”理解成“把 vLLM 跑起来，再挂一个 OpenAI 接口”，那大概率会把问题看小。

因为在真实系统里，平台真正解决的从来不只是“把模型推理起来”，而是：

- 请求从哪里进来，怎么鉴权，怎么限流
- 多个模型或多个版本之间怎么路由
- KV cache、prefix cache、LoRA、长上下文怎么管理
- GPU 怎么分池、怎么扩缩、怎么隔离 noisy neighbor
- 请求超时、OOM、版本回滚、租户配额、成本归因怎么处理

这也是为什么现在谈大模型推理平台，不能只盯某个 serving engine。  
更合理的视角应该是：

**执行引擎只是平台的发动机；真正的方案差异，在发动机之外。**

## 为什么大模型推理平台和传统模型服务不是一回事

传统在线推理平台当然也要做扩缩容、路由和观测，但大模型推理把几个变量放大了：

1. **prefill 和 decode 明显不对称**  
   同一个请求，前半段更吃算力，后半段更像长期占用状态。

2. **KV cache 变成核心资源**  
   很多时候，真正限制吞吐的不是“有没有 GPU”，而是“显存和 cache 能不能高效组织”。

3. **OpenAI-compatible API 变成事实标准**  
   平台不仅要提供推理，还要提供一种足够通用、能让应用快速迁移的接口形态。

4. **成本不再只看实例数，还要看 token、缓存、前缀复用和队列等待**

所以这类平台真正面临的问题，不是“模型服务怎么做”，而是：

**如何把推理执行、流量路由、缓存管理和控制面治理拼成一套系统。**

## 一张图先把平台分层讲清楚

![LLM inference platform stack](https://chen24h.github.io/ai-notes/diagrams/llm-inference-platform-stack.svg)

*图：自绘示意。真正的平台通常至少要同时考虑接入层、路由层、执行层、资源层和控制面。*

如果按平台职责来拆，一套完整的大模型推理平台通常至少有 5 层：

| 层次 | 典型职责 | 关键词 |
| --- | --- | --- |
| 接入层 | 统一 API、鉴权、SDK、限流 | OpenAI-compatible API、Gateway、Auth |
| 路由层 | 模型路由、版本路由、fallback、租户隔离 | Model routing、traffic policy |
| 执行层 | 真正把请求送进推理引擎执行 | vLLM、SGLang、TensorRT-LLM |
| 资源层 | GPU 池、节点拓扑、扩缩容、池化 | autoscaling、placement、topology |
| 控制面 | 发布、观测、配额、成本、审计 | rollout、quota、observability、cost |

这张表里最关键的一点是：

**执行层不是平台的全部。**

很多团队的第一版系统之所以很快碰到瓶颈，不是因为 vLLM 不够快，而是因为：

- 没有好的路由层
- 没有多租户治理
- 没有成本和容量视角
- 没有应对真实故障的控制面

## 先看执行层：不同 engine 到底代表什么路线

如果把大模型推理平台拆开看，最容易被先讨论的是 serving engine。  
这没问题，但要把它放在正确位置上。

### 1. vLLM：通用型执行引擎

vLLM 的优势在于非常“平台友好”：

- 有 OpenAI-compatible server
- 有 continuous batching
- 有 prefix caching
- 社区接受度高，接入门槛低

这类特征决定了它很适合当：

- 私有化 OpenAI 网关背后的执行引擎
- 企业内部统一模型后端
- 通用推理平台的第一版默认引擎

它的边界也很清楚：

- 它更像执行层，不是完整平台
- 路由、发布、租户、计费这些事情，仍然要靠外层系统补齐

所以如果团队目标是“先搭一个可用的平台底座”，vLLM 往往是默认优先项。

### 2. SGLang：更像 runtime + router 的组合

SGLang 官方文档把自己的定位说得很直接：高性能 serving framework。  
但它和纯粹的“推理后端”相比，味道更重一些。

因为它在官方文档里不仅强调：

- continuous batching
- prefix caching
- prefill-decode disaggregation
- parallelism

还强调：

- structured outputs
- reasoning / tool call 相关能力
- 独立的 router / gateway

这意味着 SGLang 的平台价值不只在“执行得快”，还在于：

**它天然更靠近 runtime 语义和复杂请求编排。**

如果平台服务的重点是：

- agent workload
- 结构化生成
- reasoning 场景
- 需要 cache-aware 路由

那 SGLang 不只是一个 backend 选项，甚至可能影响路由层的设计。

### 3. TensorRT-LLM：性能优先、硬件绑定更深

TensorRT-LLM 官方定位非常清楚：  
它是 NVIDIA 生态里用来加速和优化 LLM inference 的开源库。

这类路线最适合的场景通常是：

- NVIDIA GPU 是确定前提
- 追求极致性能
- 愿意接受更高工程复杂度

尤其值得注意的是它官方对 **Disaggregated Serving** 的支持。  
这意味着它不只是一个“单实例高性能 engine”，而是开始把：

- context 阶段
- generation 阶段

做更细粒度的系统拆分。

这条路线的上限很高，但也意味着平台复杂度更高。  
因为一旦把 prefill/decode 分开，后面就会自然引出：

- KV cache 传输
- 多实例协同
- 更复杂的路由和资源调度

所以 TensorRT-LLM 更像一条：

**为高性能平台预留上限的路线。**

## 真正拉开平台差距的，不是 engine 名字，而是 5 个设计点

只讨论 vLLM、SGLang、TensorRT-LLM 谁更强，很容易陷入“组件比较”。  
但平台方案真正的分歧，大多出在下面 5 个地方。

### 1. 路由怎么做

最轻的做法，就是把请求直接扔给一个 engine。  
再往上一步，会出现：

- 模型级路由
- 版本级路由
- 负载级路由
- cache-aware 路由
- fallback / retry

路由层越强，平台越像平台；但复杂度也越快上升。

这里一个很实用的判断是：

**如果平台已经进入多模型、多版本、多租户阶段，路由层基本就不能继续“顺带做”。**

### 2. Cache 怎么做

大模型推理平台和传统模型服务最不一样的一点，就是 cache 不是附属能力，而是核心能力。

这里至少要区分三件事：

- KV cache
- prefix cache
- model weight / adapter cache

vLLM 官方文档已经说明 prefix caching 在共享前缀场景里很有价值；  
TensorRT-LLM 官方文档又进一步把 KV cache 传输和 disaggregated serving 绑定到一起。

这就说明：

**cache 不只是“本地小优化”，而是会反过来影响平台架构。**

### 3. Prefill / Decode 要不要拆

这几乎是大模型推理平台讨论里最容易高估、也最值得认真讨论的一点。

拆开 `prefill` 和 `decode` 的直觉很强，因为两者资源形态不同：

- prefill 更偏计算密集
- decode 更偏状态保持和长期占用

所以从系统角度看，拆开它们很诱人。  
但一旦拆开，平台马上就会引入更难的问题：

- 请求如何在两类实例间传递
- KV cache 如何传输和复用
- 路由如何感知 context/generation 拓扑
- 故障如何恢复

所以这条路线通常不是“第一版平台就该做的默认选项”，而是：

**当吞吐、延迟、GPU 利用率已经成为硬瓶颈时，再投入的复杂优化。**

### 4. 多租户和配额怎么做

这是平台和单机服务的分水岭。

一个能在团队内部稳定跑起来的平台，最终都会遇到：

- 某个租户打满 GPU
- 某个模型长上下文拖慢全局
- 某个版本灰度时影响其它服务
- 某个团队要求独占配额

所以租户隔离、token 级限流、配额和优先级，迟早会成为平台能力，而不是“外围小功能”。

### 5. 观测和成本怎么做

如果只有 QPS 和 P99，就还不算大模型推理平台。

更关键的指标通常包括：

- TTFT
- tokens/s
- queue wait
- cache hit
- GPU 利用率
- request mix
- 租户 / 模型 / 版本粒度的成本归因

这是因为大模型平台的性能问题，很多时候不是“服务挂了”，而是：

- cache 命中下降
- 某个模型拖累全局
- prefix 复用没达到预期
- prefill / decode 比例变化了

没有这层观测，平台基本没法做长期优化。

## 三种典型方案：从轻到重

实际工程里，常见的不是“唯一正确架构”，而是三种成熟度形态。

![LLM platform maturity](https://chen24h.github.io/ai-notes/diagrams/llm-platform-maturity.svg)

*图：自绘示意。平台通常会沿着轻量 -> 平台化 -> 重型优化三段演进，而不是一开始就做终局架构。*

### 方案一：轻量方案

典型形态：

- 一个执行引擎
- 一个简单 API 网关
- 基本鉴权和限流

这类方案的目标只有一个：

**先跑起来。**

优点：

- 工程成本最低
- 最适合验证模型和业务需求

缺点：

- 路由能力弱
- 多租户治理弱
- 观测和成本能力弱

适用阶段：

- 团队早期
- 模型种类不多
- 主要目标是上线验证而不是平台复用

### 方案二：平台化方案

典型形态：

- 执行引擎仍然是 vLLM / SGLang / TRT-LLM 之一
- 外层引入 KServe 或自建 Kubernetes 控制层
- 增加模型生命周期、扩缩容、发布、基础观测

这类方案开始具备“平台”味道。  
KServe 在这里很有代表性：它官方就把自己定义成标准化的推理平台，并且在 generative inference runtime 中明确把 vLLM 作为 backend。

优点：

- 更适合团队内部复用
- 更容易和 Kubernetes 生态结合
- 控制面能力开始成形

缺点：

- 配置和运维复杂度显著上升
- 平台层和执行层的边界需要设计清楚

适用阶段：

- 已经不是单模型、单团队
- 需要模型生命周期和发布能力
- 需要平台化复用

### 方案三：重型方案

典型形态：

- 更强路由层
- prefill/decode 解耦
- 更复杂的缓存和 GPU 资源调度
- 多租户和成本控制真正做深

这类方案不是为了“能用”，而是为了：

- 更高性能上限
- 更高 GPU 利用率
- 更复杂租户场景
- 更可控的成本结构

优点：

- 上限最高
- 最适合高并发、多模型、多租户

缺点：

- 最难做对
- 对组织工程能力要求最高

适用阶段：

- 已有真实规模流量
- 性能 / 成本已成为一线问题
- 团队有能力运营复杂控制面

## 选型不是问“哪个好”，而是问“你先卡在哪”

如果把上面的东西压成一个选型表，可以这样看：

| 场景 | 更合适的方向 | 原因 |
| --- | --- | --- |
| 最快上线一个私有化 LLM 服务 | vLLM + 轻量网关 | 能力成熟、接入成本低 |
| 重点是复杂 agent / reasoning workload | SGLang 路线 | runtime / router 能力更强 |
| 重点是 NVIDIA 上的极致性能 | TensorRT-LLM 路线 | 更深的硬件优化和 disaggregated serving 能力 |
| 重点是团队复用和 Kubernetes 平台化 | KServe + backend engine | 控制面和平台化能力更完整 |
| 重点是多租户、高并发、成本治理 | 重型方案 | 需要更强路由、缓存和资源调度 |

所以真正该问的问题，不是：

“vLLM、SGLang、TensorRT-LLM 谁最好？”

而是：

- 现在瓶颈在执行层，还是控制面？
- 问题是推理性能，还是平台治理？
- 目标是先上线，还是先做长期平台？

这三个问题想清楚后，方案通常会自己收敛。

## 最后一句话

如果只记一句话，我会这样总结：

**大模型推理平台的方案差异，不是某个 engine 的名字，而是你愿意把多少复杂度投入到路由、缓存、资源调度和控制面。**

执行引擎决定下限，平台设计决定上限。

所以更合理的建设顺序通常不是“直接做终局平台”，而是：

1. 先选一个足够成熟的执行引擎，把服务跑顺
2. 再把路由、观测、配额、发布这些平台能力补齐
3. 只有在真实流量证明值得时，再投入 prefill/decode 解耦、复杂缓存和更重的调度系统

这条路虽然不激进，但通常更对。
