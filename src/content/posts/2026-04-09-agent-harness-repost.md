---
title: "转载｜Agent Harness：2026年AI架构师必须掌握的“操作系统级”技术"
summary: "转载自程序猿李巡天发布于 AtomGit 开源社区的长文，讨论 Agent Harness 的定义、核心组件、架构模式与工程实践。"
publishedAt: 2026-04-09
updatedAt: 2026-04-09
status: published
tags:
  - agent
  - agent-harness
  - reprint
  - runtime
category: essay
truthStandard: "本文为转载整理稿，保留原作者观点与表述；事实准确性与原始论断边界以原文及其引用来源为准。"
thesis: "转载一篇关于 Agent Harness 的系统性长文，核心观点是模型能力之外的文件系统、工具、内存、沙箱与验证机制共同决定了 Agent 能否从玩具走向生产级系统。"
sources:
  - title: "Agent Harness：2026年AI架构师必须掌握的“操作系统级“技术，万字长文深度解析！"
    publisher: "AtomGit 开源社区 / 程序猿李巡天"
    url: "https://gitcode.csdn.net/69c4cf0954b52172bc64aada.html"
    accessedAt: "2026-04-09"
    note: "转载原文出处。"
facts:
  - claim: "本文正文转载自程序猿李巡天于 2026-03-26 发布在 AtomGit 开源社区的文章。"
    evidence: "原始页面标题、作者署名和发布时间可见。"
    source: "https://gitcode.csdn.net/69c4cf0954b52172bc64aada.html"
    confidence: "high"
    boundary: "本站仅做格式化转载，不对原文内所有二级引用做额外背书。"
---

<div class="callout reprint-note">
<p><strong>转载声明</strong>：本文转载自 <strong>程序猿李巡天</strong> 发布于 <strong>AtomGit 开源社区</strong> 的文章，仅做版式整理与图片本地化处理，版权归原作者所有。</p>
<p>原文链接：<a href="https://gitcode.csdn.net/69c4cf0954b52172bc64aada.html">https://gitcode.csdn.net/69c4cf0954b52172bc64aada.html</a></p>
</div>
<blockquote>
<p><strong>导读</strong>：2025年是Agent的元年，而2026年将是Agent Harness的爆发之年。为什么OpenAI、Anthropic等顶级AI公司都在疯狂投入Harness Engineering？为什么说不掌握Harness，你的Agent永远只能是个"玩具"？本文将从架构师视角，深度解析Agent Harness的底层原理、核心组件和实战应用。</p>
</blockquote>
<hr/>
<h3>一、颠覆认知：为什么模型再强，也需要Harness？</h3>
<h4><strong>1.1 一个令人震惊的事实</strong></h4>
<p>2026年2月，OpenAI公开了一个实验：一个仅3人的工程师团队，使用<strong>Harness Engineering</strong>方法，在5个月内构建了超过<strong>100万行代码</strong>的代码库，人均每天提交<strong>3.5个PR</strong>，且<strong>零手动编码</strong>。</p>
<p>这不是魔法，而是Harness的力量。</p>
<p>更令人深思的是：Anthropic的实验显示，即使是<strong>Opus 4.5</strong>这样的顶级模型，在没有Harness的情况下，也无法从零构建一个生产级的Web应用。</p>
<p><strong>为什么？</strong></p>
<h4><strong>1.2 模型的"先天缺陷"</strong></h4>
<p>让我们直面一个残酷现实：<strong>LLM本质上是 stateless（无状态）的</strong>。</p>
<p>每次调用，模型都是"失忆"的——它不记得上一次会话做了什么，不知道当前的项目进度，也无法持久化存储任何信息。</p>
<p>想象一下：你雇佣了一个超级聪明的工程师，但他每次开会前都会失忆，需要你重新介绍项目背景。这就是没有Harness的Agent。</p>
<p><strong>具体失败模式包括：</strong></p>
<ul>
<li>• <strong>Context Rot（上下文腐烂）</strong>：随着工具调用和历史记录的累积，上下文窗口被填满，模型逐渐"忘记"原始指令</li>
<li>• <strong>Hallucinated Tool Calls（工具调用幻觉）</strong>：模型调用不存在的API或传递错误参数类型，没有验证机制就会无限循环失败</li>
<li>• <strong>Lost State on Failure（失败时状态丢失）</strong>：任何网络超时或服务器重启都会导致进度清零</li>
<li>• <strong>Early Stopping（过早停止）</strong>：模型在任务未完成时就宣称成功，缺乏自验证机制</li>
</ul>
<h4><strong>1.3 Harness的价值主张</strong></h4>
<p><strong>Agent Harness就是解决这些问题的"操作系统"</strong>。</p>
<p>正如Philipp Schmid在《The importance of Agent Harness in 2026》中的经典比喻：</p>
<pre><code class="language-text">- 模型 = CPU：提供原始算力
- 上下文窗口 = RAM：有限的易失性工作内存
- Agent Harness = 操作系统：管理上下文、提供驱动、调度资源
- Agent = 应用程序：运行业务逻辑</code></pre>
<p>没有操作系统，CPU再强也无法运行应用。同理，没有Harness，模型再智能也无法完成长期复杂任务。</p>
<hr/>
<h3>二、核心定义：Agent Harness到底是什么？</h3>
<h4><strong>2.1 权威定义</strong></h4>
<p>LangChain在《The Anatomy of an Agent Harness》中给出了最简洁的定义：</p>
<blockquote>
<p><strong>“If you’re not the model, you’re the harness.”</strong></p>
<p>（如果你不是模型，那你就是Harness。）</p>
</blockquote>
<p><strong>Agent = Model + Harness</strong></p>
<p>Harness包含了<strong>除了模型本身之外的所有代码、配置和执行逻辑</strong>。</p>
<h4><strong>2.2 功能定义</strong></h4>
<p>Salesforce的定义更具体：</p>
<blockquote>
<p>“Agent Harness是包裹AI模型的软件基础设施，负责管理其生命周期、上下文、以及与外部世界的交互。”</p>
</blockquote>
<p><strong>核心职责包括：</strong></p>
<ul>
<li>• 工具执行（Tool Execution）</li>
<li>• 内存管理（Memory Management）</li>
<li>• 状态持久化（State Persistence）</li>
<li>• 错误恢复（Error Recovery）</li>
<li>• 上下文编排（Context Orchestration）</li>
</ul>
<h4><strong>2.3 与Framework的区别</strong></h4>
<p>这是最容易混淆的概念。让我们用一张图说明：</p>
<p><img alt="Agent Harness figure 1" src="/ai-notes/reposts/agent-harness/image-1.jpeg"/></p>
<p><strong>关键区别</strong>：</p>
<table>
<thead>
<tr>
<th>维度</th>
<th>Agent Framework</th>
<th>Agent Harness</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>抽象层级</strong></td>
<td>低层构建块</td>
<td>高层封装</td>
</tr>
<tr>
<td><strong>定位</strong></td>
<td>开发工具包（零件库）</td>
<td>运行时系统（操作系统）</td>
</tr>
<tr>
<td><strong>特点</strong></td>
<td>模块化、可组合、需自行组装</td>
<td>开箱即用、内置默认配置</td>
</tr>
<tr>
<td><strong>代表产品</strong></td>
<td>LangChain、LlamaIndex</td>
<td>Claude Code、OpenAI Codex、DeepAgents</td>
</tr>
<tr>
<td><strong>用户</strong></td>
<td>开发者</td>
<td>Agent本身</td>
</tr>
</tbody>
</table>
<p><strong>比喻</strong>：</p>
<ul>
<li>• <strong>Framework</strong>像是乐高积木，给你零件自己搭建</li>
<li>• <strong>Harness</strong>像是成品玩具，拿来就能用</li>
</ul>
<p>LangChain的DeepAgents就是一个典型的Harness，它构建在LangChain Framework之上，提供了预设提示词、文件系统、子代理管理等"电池 Included"功能。</p>
<hr/>
<h3>三、六大核心组件：构建生产级Harness的完整蓝图</h3>
<p>一个完整的Agent Harness包含以下核心组件。我们将逐一深入解析。</p>
<p><img alt="Agent Harness figure 2" src="/ai-notes/reposts/agent-harness/image-2.jpeg"/></p>
<h4><strong>3.1 文件系统（Filesystem）：持久化存储的基石</strong></h4>
<p><strong>为什么需要文件系统？</strong></p>
<p>模型只能在上下文窗口内操作信息。在此之前，用户需要手动复制粘贴内容——这对自主Agent来说完全不可行。</p>
<p><strong>文件系统的三大价值</strong>：</p>
<ol>
<li><strong>工作空间</strong>：Agent可以读取数据、代码和文档</li>
<li><strong>上下文卸载</strong>：将中间结果和状态持久化，避免占用宝贵的上下文窗口</li>
<li><strong>协作表面</strong>：多个Agent和人类可以通过共享文件协作</li>
</ol>
<p><strong>实践建议</strong>：</p>
<pre><code class="language-text"># 典型的 Harness 文件系统结构
project/
├── AGENTS.md      # Agent 指令文件（持续学习）
├── PLAN.md        # 任务计划
├── PROGRESS.json  # 进度追踪
├── src/           # 源代码
├── tests/         # 测试文件
└── .git/          # 版本控制</code></pre>
<p><strong>AGENTS.md模式</strong>：这是Harness Engineering的关键实践。每当发现一个Agent失败模式，就在此文件中添加一条规则。文件会随时间增长，形成组织的Agent知识库。</p>
<h4><strong>3.2 Bash + 代码执行：通用问题解决器</strong></h4>
<p><strong>核心理念</strong>：与其为每个可能的动作预定义工具，不如给Agent一个通用工具——Bash。</p>
<p><strong>为什么Bash如此强大？</strong></p>
<ul>
<li>• <strong>自主性</strong>：模型可以按需编写并执行代码，自行设计工具</li>
<li>• <strong>通用性</strong>：几乎可以完成任何任务</li>
<li>• <strong>生态</strong>：可以调用现有CLI工具、脚本和程序</li>
</ul>
<p><strong>Harness实现示例</strong>：</p>
<pre><code class="language-python">class AgentHarness:
    def execute_bash(self, command: str) -&gt; str:
        # 1. 验证命令（安全策略）
        if not self._is_allowed(command):
            raise SecurityError("Command not allowed")

        # 2. 在沙箱中执行
        result = self.sandbox.run(command)

        # 3. 清理输出并返回
        return self._sanitize_output(result)</code></pre>
<p><strong>安全注意事项</strong>：</p>
<ul>
<li>• 必须在<strong>沙箱环境</strong>中执行</li>
<li>• 实施命令白名单</li>
<li>• 网络隔离</li>
<li>• 资源限制（CPU、内存、时间）</li>
</ul>
<h4><strong>3.3 沙箱环境（Sandbox）：安全执行的保障</strong></h4>
<p><strong>问题</strong>：在本地执行Agent生成的代码极其危险。一个恶意或错误的命令就可能摧毁整个系统。</p>
<p><strong>解决方案</strong>：沙箱</p>
<p><strong>沙箱的核心能力</strong>：</p>
<ul>
<li>• 隔离的代码执行环境</li>
<li>• 预装运行时（Python、Node.js等）</li>
<li>• 预装工具链（git、测试框架、浏览器等）</li>
<li>• 按需创建和销毁</li>
<li>• 可扩展到大规模并行执行</li>
</ul>
<p><strong>架构示意图</strong>：</p>
<pre><code class="language-text">┌─────────────────────────────────────┐
│          Agent Harness             │
│  ┌──────────────────────────────┐  │
│  │  Tool Call Interceptor       │  │
│  └──────────┬───────────────────┘  │
│             │                      │
│             ▼                      │
│  ┌──────────────────────────────┐  │
│  │  Sandbox Orchestrator        │  │
│  └──────────┬───────────────────┘  │
│             │                      │
└─────────────┼──────────────────────┘
              │
              ▼
     ┌────────────────┐
     │  Sandbox #1    │  ← 按需创建
     ├────────────────┤
     │ - Python 3.11  │
     │ - Node.js 20   │
     │ - Git          │
     │ - Chrome       │
     └────────────────┘</code></pre>
<p><strong>主流沙箱方案</strong>：</p>
<ul>
<li>• Docker容器</li>
<li>• E2B沙箱</li>
<li>• Modal Labs</li>
<li>• AWS Firecracker</li>
</ul>
<h4><strong>3.4 工具集成层（Tool Integration）：连接外部世界</strong></h4>
<p>Harness需要为Agent提供丰富的工具集。根据LangChain的研究，核心工具包括：</p>
<p><strong>工具分类</strong>：</p>
<ol>
<li><strong>文件系统工具</strong>：读写文件、目录操作</li>
<li><strong>代码执行工具</strong>：Bash、Python REPL</li>
<li><strong>网络工具</strong>：Web搜索、API调用</li>
<li><strong>浏览器工具</strong>：自动化测试、截图、网页交互</li>
<li><strong>版本控制</strong>：Git操作</li>
<li><strong>数据库工具</strong>：SQL查询、ORM</li>
<li><strong>MCP（Model Context Protocol）服务器</strong>：标准化上下文访问</li>
</ol>
<p><strong>工具注册表模式</strong>：</p>
<pre><code class="language-python">class ToolRegistry:
    def __init__(self):
        self.tools = {
            "read_file": ReadFileTool(),
            "write_file": WriteFileTool(),
            "bash": BashTool(sandbox=self.sandbox),
            "web_search": FirecrawlTool(api_key="..."),
            "test_runner": TestRunnerTool(),
        }

    def execute(self, tool_name: str, args: dict):
        tool = self.tools[tool_name]
        # 验证参数
        tool.validate(args)
        # 执行
        return tool.run(args)</code></pre>
<p><strong>实战案例：Firecrawl集成</strong></p>
<p>Firecrawl是一个优秀的Web数据获取工具，完美解决了现代网页抓取的复杂性（JavaScript渲染、反机器人、动态内容）。</p>
<pre><code class="language-bash"># 一键安装并集成到所有主流 Agent Harness
npx -y firecrawl-cli@latest init --all --browser</code></pre>
<p>安装后，Agent可以直接使用：</p>
<pre><code class="language-python">def web_search(query: str) -&gt; list:
    """搜索并返回结构化数据"""
    return firecrawl.search(
        query,
        limit=5,
        scrape_options={"formats": ["markdown"]},
    )


def fetch_page(url: str) -&gt; str:
    """抓取网页并返回 Markdown"""
    return firecrawl.scrape(url, formats=["markdown"]).markdown</code></pre>
<p>Harness会将这些函数注册到工具注册表，Agent就可以像调用本地函数一样使用它们。</p>
<h4><strong>3.5 内存与搜索（Memory &amp; Search）：持续学习系统</strong></h4>
<p><strong>内存的三层架构</strong>：</p>
<p><strong>1. 工作上下文（Working Context）</strong></p>
<ul>
<li>• 当前提示词和会话历史</li>
<li>• 易失性，每次调用重置</li>
</ul>
<p><strong>2. 会话状态（Session State）</strong></p>
<ul>
<li>• 当前任务的持久化日志</li>
<li>• 记录工具调用结果、完成的子任务</li>
</ul>
<p><strong>3. 长期记忆（Long-term Memory）</strong></p>
<ul>
<li>• 跨任务的知识积累</li>
<li>• 可以是向量数据库、结构化文件或专门的记忆层</li>
</ul>
<p><strong>记忆文件格式</strong>：</p>
<p>Anthropic实验发现，<strong>JSON比Markdown更适合状态追踪</strong>，因为模型不太可能意外覆盖或重新格式化JSON。</p>
<pre><code class="language-json">{
  "project": "Claude.ai Clone",
  "features": [
    {
      "id": 1,
      "name": "User Auth",
      "status": "completed",
      "commit": "abc123"
    },
    {
      "id": 2,
      "name": "Chat UI",
      "status": "in_progress",
      "notes": "..."
    }
  ],
  "learnings": [
    "Use NextAuth for authentication",
    "Avoid using useEffect for chat polling"
  ]
}</code></pre>
<p><strong>RAG（检索增强生成）模式</strong>：</p>
<p>Harness不应一次性加载所有知识，而应根据当前步骤<strong>按需检索</strong>相关文档，避免上下文污染。</p>
<h4><strong>3.6 上下文工程（Context Engineering）：对抗Context Rot</strong></h4>
<p><strong>问题</strong>：上下文窗口是有限的，随着任务推进，窗口会被工具输出、历史记录和推理填满，导致性能下降。</p>
<p><strong>Lost in the Middle现象</strong>：斯坦福大学Liu等人的研究发现，当关键内容埋没在长提示词中间时，LLM性能显著下降。</p>
<p><strong>Harness的三大策略</strong>：</p>
<p><strong>1. 压缩（Compaction）</strong></p>
<p>当上下文窗口接近满载时，Harness需要智能地压缩历史：</p>
<ul>
<li>• 将早期对话摘要为简短笔记</li>
<li>• 保留关键决策和结果</li>
<li>• 丢弃中间推理步骤</li>
</ul>
<pre><code class="language-python">def compact_context(self):
    """压缩上下文的策略"""
    # 1. 提取关键信息
    summary = self.llm.summarize(
        self.context.history,
        max_tokens=2000,
    )

    # 2. 保留最近 N 轮对话
    recent = self.context.history[-5:]

    # 3. 重建上下文
    self.context.rebuild(
        prefix=summary,
        recent=recent,
    )</code></pre>
<p><strong>2. 工具输出卸载（Tool Call Offloading）</strong></p>
<p>大型工具输出会噪音般充斥上下文窗口。Harness应：</p>
<ul>
<li>• 保留输出的头部和尾部（各N个token）</li>
<li>• 将完整输出写入文件系统</li>
<li>• 仅在Agent需要时检索</li>
</ul>
<p><strong>3. 技能（Skills）：渐进式披露</strong></p>
<p>问题：启动时加载过多工具/MCP服务器会降低性能。</p>
<p>解决方案：<strong>Skills</strong>机制</p>
<ul>
<li>• 初始阶段仅加载核心工具</li>
<li>• 当Agent需要特定能力时，Harness动态加载对应Skill</li>
<li>• Skill包含工具、提示词前缀和示例</li>
</ul>
<h4><strong>3.7 验证与防护（Verification &amp; Guardrails）：确保正确性</strong></h4>
<p><strong>核心原则</strong>：生产级Harness必须验证输出，而非盲目信任Agent。</p>
<p><strong>验证机制</strong>：</p>
<p><strong>1. 自验证循环（Self-Verification Loop）</strong></p>
<pre><code class="language-python">def execute_with_verification(self, task: Task):
    # 1. Agent 执行
    result = self.agent.execute(task)

    # 2. 运行测试
    test_result = self.test_runner.run(task.test_suite)

    # 3. 验证失败则循环
    if not test_result.passed:
        error_msg = f"Tests failed: {test_result.errors}"
        # 注入错误信息，要求修复
        self.context.inject(error_msg)
        return self.execute_with_verification(task)

    return result</code></pre>
<p><strong>2. Ralph Loops（持续工作循环）</strong></p>
<p>这是LangChain提出的一种模式：</p>
<p>当Agent尝试退出时，Harness通过钩子拦截，并在干净的上下文窗口中重新注入原始提示，强制Agent继续工作直到完成目标。</p>
<pre><code class="language-python">def ralph_loop(self):
    """Ralph Loop 实现长周期任务"""
    while not self.is_complete():
        # 1. 加载当前状态
        state = self.load_state()

        # 2. 在新鲜上下文中执行
        with fresh_context(state):
            result = self.agent.run(self.goal)

        # 3. 保存进度
        self.save_state()

        # 4. 检查是否完成
        if self.verify_completion(result):
            break</code></pre>
<p><strong>3. 人类介入（Human-in-the-Loop）</strong></p>
<p>对于敏感操作（生产数据库写入、外部通信），Harness应暂停并等待人类批准。</p>
<pre><code class="language-python">def execute_sensitive_action(self, action: str):
    # 暂停并请求批准
    approval = self.human_approval(action)

    if approval.granted:
        return self.execute(action)

    raise PermissionError("Action denied by human reviewer")</code></pre>
<hr/>
<h3>四、架构模式：三种主流Harness设计范式</h3>
<p>根据任务复杂度和需求，Harness有三种主流架构模式。</p>
<h4><strong>4.1 单代理监督者（Single-Agent Supervisor）</strong></h4>
<p><strong>适用场景</strong>：边界明确的任务（如客服机器人、数据录入）</p>
<p><strong>架构</strong>：</p>
<pre><code class="language-text">┌─────────────────────────────────┐
│            Harness              │
│  ┌───────────────────────────┐  │
│  │  Agent (LLM + Tools)      │  │
│  └───────────────────────────┘  │
│         │         │             │
│      Memory      Tools          │
└─────────────────────────────────┘</code></pre>
<p><strong>特点</strong>：</p>
<ul>
<li>• 一个模型在循环中</li>
<li>• Harness管理初始化、上下文注入、工具调度、状态持久化</li>
<li>• 简单直接</li>
</ul>
<h4><strong>4.2 初始化器-执行器分离（Initializer-Executor Split）</strong></h4>
<p><strong>适用场景</strong>：长期编码任务、复杂项目开发</p>
<p><strong>这是Anthropic推荐的模式</strong>。</p>
<p><strong>两阶段架构</strong>：</p>
<p><strong>阶段一：初始化器（运行一次）</strong></p>
<pre><code class="language-python">def initializer():
    """设置持久化项目环境"""
    # 1. 创建目录结构
    fs.create_structure([
        "src/",
        "tests/",
        "docs/",
    ])

    # 2. 编写功能列表
    fs.write("FEATURES.json", [
        {"id": 1, "status": "pending"},
        ...
    ])

    # 3. 初始化脚本
    fs.write("init.sh", """
        npm install
        npm run build
    """)

    # 4. 初始 Git 提交
    git.commit("Initial setup")</code></pre>
<p><strong>阶段二：执行器（多次运行）</strong></p>
<pre><code class="language-python">def executor():
    """增量完成单个任务"""
    # 1. 读取进度
    state = fs.read("FEATURES.json")
    next_task = state.find_next_pending()

    # 2. 执行任务
    agent.execute(next_task)

    # 3. 运行测试
    run_tests()

    # 4. 提交并更新进度
    git.commit(f"Complete {next_task}")
    state.mark_completed(next_task)
    fs.write("FEATURES.json", state)</code></pre>
<p><strong>关键优势</strong>：</p>
<ul>
<li>• 每个会话从持久化状态启动</li>
<li>• 无需记住历史会话</li>
<li>• 项目环境成为跨会话的共享记忆</li>
</ul>
<h4><strong>4.3 多代理协调（Multi-Agent Coordination）</strong></h4>
<p><strong>适用场景</strong>：超复杂项目、需要专业分工</p>
<p><strong>架构</strong>：</p>
<pre><code class="language-text">┌─────────────────────────────────────┐
│       Harness Orchestrator          │
│  ┌─────────┐      ┌─────────┐       │
│  │Research │      │ Writer  │       │
│  │ Agent   │ ───▶ │ Agent   │       │
│  └─────────┘      └─────────┘       │
│       ↓                ↓            │
│  ┌─────────────────────────────┐    │
│  │       Reviewer Agent        │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘</code></pre>
<p><strong>Harness职责</strong>：</p>
<ul>
<li>• 分派专业代理（研究员、写作者、审核员）</li>
<li>• 管理交接（确保每个代理获得相关上下文）</li>
<li>• 过滤无关历史</li>
</ul>
<p><strong>ICML 2025研究</strong>：在GPT-4级模型上测试了可分离的感知、记忆和推理模块。配备Harness的模型在所有测试游戏中 consistently 优于无Harness模型。</p>
<hr/>
<h3>五、Harness Engineering：从失败中提炼工程智慧</h3>
<h4><strong>5.1 什么是Harness Engineering？</strong></h4>
<p>Mitchell Hashimoto提出的核心理念：</p>
<blockquote>
<p><strong>“将每个Agent失败视为系统工程问题，而非提示词重试问题。”</strong></p>
</blockquote>
<p><strong>传统做法</strong>：Agent出错 → 调整提示词 → 重试</p>
<p><strong>Harness Engineering</strong>：Agent出错 → 分析失败模式 → 工程化修复 → 永久防止</p>
<h4><strong>5.2 两大核心实践</strong></h4>
<p><strong>实践一：渐进式规则文件</strong></p>
<p>维护一个<code>AGENTS.md</code>文件，每条规则对应一个观察到的失败：</p>
<pre><code class="language-markdown"># AGENTS.md
## Rules (accumulated from failures)
1. Always run tests after writing code
2. Use `firecrawl scrape` for web data, not curl
3. Check for existing functions before creating new ones
4. Commit to git after each completed feature
5. Use JSON for state files, not Markdown
...</code></pre>
<p>文件随时间增长，形成组织的Agent知识库。</p>
<p><strong>实践二：机械可验证工具</strong></p>
<p>如果Agent反复失败，就构建工具使其<strong>机械性地强制执行正确行为</strong>。</p>
<p><strong>案例</strong>：</p>
<ul>
<li>• 问题：Agent不测试UI交互</li>
<li>• 解决：构建截图工具，每次UI变更后自动截图</li>
<li>• 问题：Agent不验证API响应</li>
<li>• 解决：构建响应验证器，自动检查状态码和schema</li>
</ul>
<h4><strong>5.3 Harness Engineering vs Context Engineering</strong></h4>
<p><strong>关键区别</strong>：</p>
<table>
<thead>
<tr>
<th>维度</th>
<th>Context Engineering</th>
<th>Harness Engineering</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>焦点</strong></td>
<td>模型看到什么信息</td>
<td>模型在什么环境中运行</td>
</tr>
<tr>
<td><strong>手段</strong></td>
<td>优化输入</td>
<td>控制环境、工具、验证</td>
</tr>
<tr>
<td><strong>目标</strong></td>
<td>提供正确上下文</td>
<td>防止错误、强制执行</td>
</tr>
<tr>
<td><strong>示例</strong></td>
<td>RAG检索相关文档</td>
<td>构建测试工具强制验证</td>
</tr>
</tbody>
</table>
<p><strong>比喻</strong>：</p>
<ul>
<li>• Context Engineering：给司机提供清晰的地图</li>
<li>• Harness Engineering：给汽车安装安全带和气囊</li>
</ul>
<h4><strong>5.4 模型-Harness协同进化</strong></h4>
<p>OpenAI和Anthropic的产品（如Codex、Claude Code）采用<strong>模型与Harness协同训练</strong>。</p>
<p><strong>循环过程</strong>：</p>
<pre><code class="language-text">1. 发现原语（如 Skills、Compaction）
   ↓
2. 添加到 Harness 并标准化
   ↓
3. 用 Harness 训练下一代模型
   ↓
4. 模型在 Harness 中表现提升
   ↓
5. 回到步骤 1</code></pre>
<p><strong>副作用</strong>：模型可能对特定Harness过拟合。例如，Codex对<code>apply_patch</code>工具逻辑高度依赖，更换工具逻辑会导致性能下降。</p>
<hr/>
<h3>六、实战案例：从零构建一个生产级Coding Agent Harness</h3>
<p>让我们实战构建一个完整的Harness。</p>
<h4><strong>6.1 需求分析</strong></h4>
<p>目标：构建一个能自主开发Web应用的Coding Agent Harness</p>
<p><strong>要求</strong>：</p>
<ul>
<li>• 长期运行（跨多个会话）</li>
<li>• 自主编写和测试代码</li>
<li>• 持久化进度</li>
<li>• 安全可靠</li>
</ul>
<h4><strong>6.2 架构设计</strong></h4>
<p>采用<strong>Initializer-Executor模式</strong>：</p>
<pre><code class="language-python">class CodingAgentHarness:
    def __init__(self, model: str = "gpt-4"):
        self.model = load_model(model)
        self.sandbox = create_sandbox()
        self.fs = VirtualFilesystem()
        self.git = GitInterface()
        self.tools = ToolRegistry()

    def initialize(self, project_spec: str):
        """初始化项目环境"""
        # 1. 创建目录结构
        self.fs.create_structure([
            "src/",
            "tests/",
            "docs/",
            "public/",
        ])

        # 2. 编写 AGENTS.md
        self.fs.write("AGENTS.md", """# Project Guidelines
## Rules
1. Always write tests for new features
2. Use TypeScript for all code
3. Run `npm test` before committing
4. Update PROGRESS.json after each task
""")

        # 3. 初始化 package.json
        self.fs.write("package.json", {
            "name": "agent-project",
            "scripts": {
                "test": "jest",
                "build": "tsc",
            },
        })

        # 4. 创建 PROGRESS.json
        self.fs.write("PROGRESS.json", {
            "tasks": parse_tasks(project_spec),
            "current": 0,
            "completed": [],
        })

        # 5. 初始提交
        self.git.commit("Initial project setup")

    def execute(self):
        """执行单个任务"""
        # 1. 加载状态
        progress = json.loads(self.fs.read("PROGRESS.json"))
        current_task = progress["tasks"][progress["current"]]

        # 2. 构建上下文
        context = self._build_context(
            task=current_task,
            progress=progress,
            agents_md=self.fs.read("AGENTS.md"),
        )

        # 3. Agent 执行
        result = self.model.generate(
            context=context,
            tools=self.tools.all(),
        )

        # 4. 运行测试
        test_result = self.sandbox.run("npm test")
        if not test_result.success:
            # 5. 测试失败，注入错误信息
            error_context = f"Tests failed:
{test_result.output}"
            return self._retry_with_error(context, error_context)

        # 6. 更新进度
        progress["completed"].append(current_task["id"])
        progress["current"] += 1
        self.fs.write("PROGRESS.json", json.dumps(progress))

        # 7. Git 提交
        self.git.commit(f"Complete: {current_task['name']}")
        return result</code></pre>
<h4><strong>6.3 工具集成示例</strong></h4>
<p>集成Firecrawl用于Web数据获取：</p>
<pre><code class="language-python">class FirecrawlTool:
    def __init__(self, api_key: str):
        self.client = Firecrawl(api_key=api_key)

    def search(self, query: str, limit: int = 5) -&gt; list:
        """搜索网络并返回结构化结果"""
        result = self.client.search(
            query=query,
            limit=limit,
            scrape_options={"formats": ["markdown"]},
        )
        return result.web

    def scrape(self, url: str) -&gt; str:
        """抓取网页并返回 Markdown"""
        result = self.client.scrape(
            url=url,
            formats=["markdown"],
        )
        return result.markdown

    def extract(self, prompt: str) -&gt; dict:
        """自主导航并提取数据"""
        result = self.client.agent(prompt=prompt)
        return result.data

# 注册到 Harness
tools.register("web_search", FirecrawlTool(api_key="...").search)
tools.register("fetch_page", FirecrawlTool(api_key="...").scrape)</code></pre>
<h4><strong>6.4 上下文管理</strong></h4>
<p>实现智能压缩：</p>
<pre><code class="language-python">def compact_context(self, context: Context) -&gt; Context:
    """压缩上下文策略"""
    # 1. 如果未超过阈值，直接返回
    if context.token_count &lt; self.max_tokens * 0.8:
        return context

    # 2. 提取关键决策
    decisions = context.extract_decisions()

    # 3. 摘要早期历史
    summary = self.model.summarize(
        context.history[:-5],  # 保留最近 5 轮
        max_tokens=1000,
    )

    # 4. 工具输出卸载
    for call in context.tool_calls:
        if len(call.output) &gt; 5000:
            # 保存到文件
            file_path = f".harness/tool_outputs/{call.id}.txt"
            self.fs.write(file_path, call.output)
            # 仅保留头部和尾部
            call.output = f"[Output truncated. See {file_path}]"

    # 5. 重建上下文
    return Context(
        system_prompt=context.system_prompt,
        prefix=summary,
        decisions=decisions,
        recent_history=context.history[-5:],
        current_task=context.current_task,
    )</code></pre>
<h4><strong>6.5 验证机制</strong></h4>
<p>实现自验证循环：</p>
<pre><code class="language-python">def execute_with_verification(self, task: Task) -&gt; Result:
    """执行并验证"""
    max_retries = 3

    for attempt in range(max_retries):
        # 1. 执行
        result = self.agent.execute(task)

        # 2. 运行测试套件
        test_output = self.sandbox.run("npm test")

        # 3. 验证
        if test_output.exit_code == 0:
            return result

        # 4. 测试失败，注入错误信息
        error_msg = f"""Tests failed on attempt {attempt + 1}:
```bash
{test_output.stdout}{test_output.stderr}
```"""
        self.context.inject(error_msg)

    raise MaxRetriesExceeded("Verification failed")</code></pre>
<pre><code class="language-python"># 超过重试次数，抛出异常
raise MaxRetriesExceeded(f"Failed after {max_retries} attempts")</code></pre>
<hr/>
<h3>七、未来趋势：Harness将如何重塑AI开发范式？</h3>
<h4><strong>7.1 Harness Engineering的崛起</strong></h4>
<p>2026年，Harness Engineering已成为AI开发的核心竞争力。</p>
<p><strong>趋势一：从Prompt Engineering到Harness Engineering</strong></p>
<ul>
<li>• <strong>Prompt Engineering</strong>：优化单次调用</li>
<li>• <strong>Harness Engineering</strong>：构建整个运行系统</li>
</ul>
<p>随着模型能力提升，简单的提示词调整收益递减，而系统工程优化收益递增。</p>
<p><strong>趋势二：Harness标准化</strong></p>
<p>类似Web开发的React/Vue，Agent开发将出现标准Harness：</p>
<ul>
<li>• OpenAI Codex Harness</li>
<li>• Anthropic Claude Code Harness</li>
<li>• LangChain DeepAgents</li>
<li>• Microsoft Agent Framework Harness</li>
</ul>
<p><strong>趋势三：Harness即产品</strong></p>
<p>公司将不再"构建Agent"，而是"配置Harness"：</p>
<ul>
<li>• 选择Harness（如选择操作系统）</li>
<li>• 配置工具和策略</li>
<li>• 注入领域知识</li>
<li>• 部署运行</li>
</ul>
<h4><strong>7.2 Harness的演进方向</strong></h4>
<p>根据LangChain的研究，未来Harness将聚焦：</p>
<p><strong>方向一：超大规模多Agent编排</strong></p>
<p>挑战：如何协调数百个Agent在共享代码库上并行工作？</p>
<p>方案：</p>
<ul>
<li>• 基于Git的分布式协作协议</li>
<li>• 智能冲突检测和解决</li>
<li>• 任务自动分解和分配</li>
</ul>
<p><strong>方向二：自诊断Harness</strong></p>
<p>Harness能够：</p>
<ul>
<li>• 分析自身追踪数据</li>
<li>• 识别失败模式</li>
<li>• 自动调整配置</li>
<li>• 生成新的规则</li>
</ul>
<pre><code class="language-python">def self_diagnose(self, trace: ExecutionTrace):
    """Harness 自诊断"""
    # 1. 分析失败模式
    failure_mode = self.analyzer.identify_pattern(trace)

    # 2. 生成修复策略
    fix = self.planner.generate_fix(failure_mode)

    # 3. 应用修复
    self.apply_fix(fix)

    # 4. 更新规则
    self.agents_md.add_rule(fix.rule)</code></pre>
<p><strong>方向三：即时工具组装（Just-in-Time Tool Assembly）</strong></p>
<p>当前Harness预配置工具集。未来Harness将：</p>
<ul>
<li>• 根据任务动态组装工具</li>
<li>• 按需加载MCP服务器</li>
<li>• 最小化上下文污染</li>
</ul>
<h4><strong>7.3 Harness会消失吗？</strong></h4>
<p><strong>问题</strong>：随着模型变强，Harness是否会变得不必要？</p>
<p><strong>答案</strong>：不会，但会演进。</p>
<p><strong>理由</strong>：</p>
<ol>
<li><strong>模型永远需要接口</strong>：即使模型内置规划和验证能力，仍需要Harness提供文件系统、沙箱、工具等基础设施</li>
<li><strong>Harness能力会被吸收</strong>：当前Harness中的原语（如Skills、Compaction）会被吸收到模型训练中，但这会释放Harness去解决更高层次问题</li>
<li><strong>类比Prompt Engineering</strong>：尽管模型越来越强，Prompt Engineering仍然有价值。Harness Engineering同理。</li>
</ol>
<p><strong>未来Harness工程师的核心技能</strong>：</p>
<ul>
<li>• 系统设计</li>
<li>• 上下文架构</li>
<li>• 工具编排</li>
<li>• 验证策略</li>
<li>• 失败分析</li>
</ul>
<hr/>
<h3>八、资源清单：工具、框架与学习路径</h3>
<h4><strong>8.1 主流Harness产品</strong></h4>
<p><strong>生产级Harness</strong>：</p>
<ol>
<li><strong>OpenAI Codex</strong>：OpenAI内部使用的Coding Agent Harness</li>
<li><strong>Claude Code</strong>：Anthropic的通用Coding Harness</li>
<li><strong>Manus</strong>：专注于长期任务的Harness</li>
<li><strong>LangChain DeepAgents</strong>：开源Harness，batteries included</li>
</ol>
<h4><strong>8.2 开发工具和框架</strong></h4>
<p><strong>Framework层</strong>：</p>
<ul>
<li>• LangChain（Python/JS）</li>
<li>• LlamaIndex（Python）</li>
<li>• Microsoft Semantic Kernel（C#/Python）</li>
<li>• CrewAI（Python）</li>
</ul>
<p><strong>Harness层</strong>：</p>
<ul>
<li>• LangChain DeepAgents</li>
<li>• Anthropic Claude Agent SDK</li>
<li>• OpenAI Agents SDK</li>
<li>• Microsoft Agent Framework</li>
</ul>
<p><strong>工具集成</strong>：</p>
<ul>
<li>• <strong>Firecrawl</strong>：Web数据获取（CLI一键集成）</li>
<li>• <strong>E2B</strong>：沙箱环境</li>
<li>• <strong>MCP Servers</strong>：标准化上下文协议</li>
<li>• <strong>Docker</strong>：容器化执行</li>
</ul>
<h3><strong>结语：Harness——AI时代的"操作系统革命"</strong></h3>
<p>回顾计算机发展史：</p>
<ul>
<li>• <strong>1960s-70s</strong>：硬件为王（CPU）</li>
<li>• <strong>1980s-90s</strong>：操作系统为王（Windows、Linux）</li>
<li>• <strong>2000s-10s</strong>：应用为王（iPhone App）</li>
<li>• <strong>2020s</strong>：模型为王（LLM）</li>
<li>• <strong>2026+</strong>：Harness为王（Agent OS）</li>
</ul>
<p><strong>Harness Engineering的本质</strong>：我们不再编写确定性的程序，而是设计围绕非确定性智能体的系统。</p>
<p><strong>最后的话</strong>：</p>
<blockquote>
<p>“模型是马，Harness是缰绳。没有缰绳的马会失控，没有Harness的模型是玩具。”</p>
<p>—— Harness Engineering的核心理念</p>
</blockquote>
<p>2026年，Harness不是可选项，而是必选项。</p>
<p><strong>现在，开始构建你的Harness吧！</strong></p>
</https:>
