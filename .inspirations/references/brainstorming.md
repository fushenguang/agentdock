Q1: 我们是一支偏前端的全栈工程团队（编程语言：TypeScript为主，Rust为辅，Python/Shell为第三优先级），目前团队开始全面使用AI Coding Agent编写代码，但在实践中遇到了很多问题（如：1. 每次创建一个应用或服务都要从零开始，AI写代码是很快，但是我们现在认为AI也需要“专注”，专注它们擅长的领域，而不是快速地造出无数“无用的垃圾（demo）”，这也是一种浪费，浪费可耻；2. 随着代码（新features）增加，代码质量变得“参差不齐”，维护也难（即使我们结合openspec做规范+TDD做限制），context很容易“塞满” 3. 其它问题），所以我们想构建一套面向AI Coding Agent的工程大环境和配置，这套工程大环境和配置的目标和要求如下：

- 1. （重点目标）不每次从零开始，只要用户的需求命中了工程中的模板，那么就直接从模板中拉取项目，项目已经是面向AI Coding Agent配置好了的，必须包括：仓库采用monorepo（采用turborepo）；针对不同的AI Coing环境，**遵循AI Coding的最佳实践,如：Claude Code的CLAUDE.md/Github Copilit的.github/copilot-instructions.md文件/Codex的AGENT.md**等等;强制使用TDD/DDD范式，需要配置好对应的环境；内置了openspec（https://github.com/Fission-AI/OpenSpec/tree/main）的配置;

- 2. (重点要求)Agent 训练语料和经验知识查询、沉淀库 - 文档库：2.1 使用如fumadocs（https://github.com/fuma-nama/fumadocs）这样开源文档方案，为每个应用或服务构建一个单独的docs应用；2.2 docs应用必须包含是应用或服务的roadmap，实时记录应用的和演化过程和开发记录（和openspec一一对应，openspec归档的changes作为Single Source of Truth）

- 3. （重点要求）要有借助AI自我迭代和升级机制：代码编写实践中解决问题的好思路、项目或业务独有的经验，要能沉淀成skills，这值得一套系统，而且不是可选，是必须的，LLM的发展速度和高度没有谁可以预测，每个构造者都需要认真思考既要“拥抱”LLM的高智能，又要对抗LLM越来越智能的冲击（即我们的服务、功能在6个月后还没有价值，有多少价值？），如何构建真正地护城河呢？

- 4. （重点要求）做好GEO（Genenative Engine Optimization）:需要让我们的仓库、工具被主流LLM采用，即需要做到可发现性、可理解性、权威性、即时可得性。

- 5. (可选)GTM（Go To Market）:对于要商业化的应用，需要主动提示是否安装https://github.com/twentyhq/twenty等商业化配套应用


现在第一步我们需要构建一个面向AI Coding Agent的应用模板库, 包含：

- Web（Next.js/React）
- API Services(Nest.js)  
- React Native（Expo）
- Tauri App
- Electron App （参考）
- Rust应用（面向高性能场景）
- 其它，逐步补充

仓库技术和实现细节包括但限于如下：

1. 从模版创建的任何项目必须是：

- monorepo + turborepo;
- TDD/DDD；
- 内置了openspec；
- 配置好了AI Coding的工程环境，**遵循AI Coding的最佳实践,如：Claude Code的CLAUDE.md/Github Copilit的.github/copilot-instructions.md文件/Codex的AGENT.md**等等
- 文档库：使用fumadocs（https://github.com/fuma-nama/fumadocs）创建文档应用，为什么需要？当代码生成的成本趋近于零时，代码本身不再是核心资产，真正的资产是“开发意图（Intent）”、“上下文（Context）”和“架构决策依据（ADR）”。将 Docs 作为一个独立且“与应用共同生长”的应用来建设，绝对是一个极其重要的战略决策。

2. 组件库和UI：web、Tauri App和Electron App默认使用shadcn-ui组件库及其block，业务组件也要基于它们进行封装，制定和设计好统一的CSS设计系统，如主题；

3. 所有应用默认做好基础功能，如：用户中心、登录、注册、验证码、帮助页、隐式页等所有基本的功能都内置好，参考shadcn-ui的block的做法，可以选

4. 默认支持中英双语，但是只做基础以及在快速开发的过程中只优先关注一种语言如英文，另一种占位即可，在上线时再统一适配其它语言（我们有过实践，使用AI Coding工具开发多语言时，如果同时维护多语言，经常出问题）
  
5. 数据层设计：优先使用supabase适配，其次使用drizzle

6. AI时代下的代码目录结构或功能契约，即面向AI Coding Agent的目录结构，更准确的说是契约，由于features的代码是AI编写的，所以迭代要很快，即「发现痛点/需求 -> 确定需求 -> 开发完成 -> 关键负责人和利益相关者发布前确认 -> 发布上线，所有功能加research preview标签 -> 收集用户反馈 -> 判断痛点/需求真伪，裁定feature的价值，有就保留，没有下架」，这样的流程要压缩到周/天进行验证，所以需要新的代码规范、范式或契约，即新功能要在AI的掌控下，快速上线，快速下架，同时不能影响代码的稳定性和变动核心架构

7. 部署，支持docker/docker compose/dokploy(https://github.com/Dokploy/dokploy)

在AI时代，发现所有的中小型团队都忽略了部署的重要性，**即：基础实施的重要性。**重点需要关注dokploy，我们团队目前使用它完成AI自动化部署。

**重点注意：我们是面向企业级的，在生产环境下使用，使用AI Coding Agent生成高质量，保障应用和系统的绝对安全和超级稳定性，始终是第一优先级的和最重要的原则。**

不要写代码，我们开始讨论：1. 从正面和反面（检查官）的视角审视下我的想法？帮我发现我忽略了什么（如： LLM快速的发展）？哪些东西基于一些假设才成立的，但这些假设其实不完全准确等等 2. 把我的想法再深化下、再扩展延伸下以及更具体化（对AI Coding Agent更加具备可执行性）

---

好的，这是一个很有深度的工程战略问题。在我给出详细分析之前，先问几个关键的澄清问题：
有几件事我需要先搞清楚，才能给出有价值的分析：You said: Q: 你们团队目前 AI Coding Agent 的使用深度是？Q: 你们团队目前 AI Coding Agent 的使用深度是？
A: 以上都有，混合使用Q: 这套「模板库 + 工程大环境」，你们的首要目标用户是谁？
A: 先内部验证，再考虑开源或商业化Q: 关于「技能沉淀（Skills）系统」，你们目前有没有已有的实践或雏形？
A: 有一套内部知识库，但没有和 AI Agent 集成May 31Claude responded: 好，信息足够了。让我做一次真正有深度的分析——既当建筑师，也当检察官。好，信息足够了。让我做一次真正有深度的分析——既当建筑师，也当检察官。

一、正面审视：你们想法里真正对的部分
"代码成本趋近于零，意图和上下文才是资产" — 这个判断是正确的，而且你们比大多数团队更早意识到这一点。把 Docs 作为一等公民（而不是事后补充）是少数真正有远见的决策之一。
模板库的核心价值不是"快"，而是"防退化" — AI Coding Agent 最大的问题不是写不快，是每次都在重新发明轮子，且质量不稳定。一个配置好的模板能把"AI 的随机性"锁定在业务逻辑层，而不是架构层。这个方向是对的。
Skills 沉淀系统的战略意义被低估了 — 你们文档里把它列为"重点要求"，但我认为它实际上是整套系统的护城河核心，后面会专门展开。

二、反面审视：你们忽略的问题和不成立的假设
假设 1：「TDD/DDD 能约束 AI 写出好代码」— 这个假设部分不成立
你们提到"强制 TDD/DDD"，但实践中遇到的真实问题是：

AI 写测试的习惯是先写实现，再补测试，它会让测试通过，但测试本身没有约束力
DDD 的概念（聚合根、领域事件、限界上下文）对 AI 来说是词汇层面的理解，不是结构层面的约束。AI 会在文件里写 // This is an aggregate root，然后把所有逻辑堆进去
真正能约束 AI 的不是范式，而是可机器验证的规则，比如：lint rules、architecture-level tests（用 dependency-cruiser 之类的工具）、PR 门禁脚本

你们需要的不是"教 AI 遵守 DDD"，而是"让 AI 违反 DDD 时 CI 直接挂掉"。

假设 2：「Monorepo + Turborepo 是默认最优解」— 依赖规模，可能是陷阱
Monorepo 在你们的场景下有一个被低估的风险：

AI Agent（尤其是 Claude Code）在 Monorepo 里的 context 消耗会指数级上升，因为它需要理解跨包依赖关系
Turborepo 的 task graph 配置本身需要维护，当 AI 在多个包之间修改代码时，它几乎必然会破坏 task graph，而且不知道自己破坏了
真正企业级的 Monorepo 需要有人专门维护，你们是一支"偏前端的全栈团队"，这个隐性成本你们算进去了吗？

建议：Monorepo 作为选项而不是强制默认，或者为 AI Agent 专门设计一套"Monorepo 感知"的 CLAUDE.md 规则，明确告诉它边界在哪里。

假设 3：「GEO 可以通过文档和规范来做」— 这个假设忽略了 LLM 的训练数据机制
你们想让仓库被主流 LLM 采用，但 GEO 的真实逻辑是：

LLM 的训练数据有截止日期，你们的仓库今天上线，最早可能 12-18 个月后才进入下一代模型的训练集
更快的路径是：在 LLM 的实时检索层（如 Claude 的 web search、Perplexity）建立存在感，而不是等待训练数据更新
GitHub 的 README 被 LLM 检索到的前提是有足够的 star/fork/引用，这是一个冷启动问题，不是技术问题

你们在 GEO 上的真正武器是：MCP Server。 如果你们把模板库封装成一个 MCP Server，任何人在 Claude Code / Cursor 里都可以直接调用你们的模板，这才是真正的"即时可得性"。文档再好，没人能 grep 出来。

假设 4：「Skills 系统 = 文档库」— 这是一个严重的降维理解
你们目前有内部知识库但没有和 AI Agent 集成，这个 gap 比想象的要大。
现有知识库的问题：它是人读的，AI 读它的方式是把全文塞进 context，然后随机遗忘。
真正面向 AI Agent 的 Skills 系统需要是结构化、可检索、有执行语义的：
# 现有知识库（人读）
"我们在处理 Supabase RLS 时遇到了 xxx 问题，解决方案是..."

# AI Agent Skills（机器读）
---
skill: supabase-rls-pattern
trigger: "需要给多租户表配置 RLS"
context: [supabase, multi-tenant, security]
solution: |
  1. 始终在 migration 里而不是 dashboard 里配置 RLS
  2. 使用 auth.uid() 而不是 current_user
  ...
test: "RLS 策略必须有对应的 integration test 覆盖"
---
这种结构才能被 AI Agent 在运行时精准检索和激活，而不是作为背景噪音。

假设 5：「Feature Flag 式的快速上下架能解决代码稳定性问题」— 没有解决根本矛盾
你们描述的流程（发现 -> 开发 -> 上线 research preview -> 收集反馈 -> 裁定 -> 下架）本质上是在用部署策略解决代码架构的问题。
真正的问题是：AI 写的新功能会不可避免地和现有代码产生耦合，即使加了 feature flag。下架一个功能时，AI 也未必能干净地删除所有相关代码，残留代码会慢慢腐化架构。
你们需要的是"物理隔离"而不是"逻辑隔离"：新功能模块在文件系统层面就是隔离的，有明确的"入口声明"和"出口协议"，删除时只需删整个目录，不需要全局搜索。这是一个需要专门设计的目录契约，不是 feature flag 能解决的。

三、你们忽略的关键问题
忽略点 1：Context 污染是比 Context 长度更严重的问题
你们提到"context 容易塞满"，但更危险的是 context 被错误信息污染。当 AI 在一个长期项目里工作时：

它会把早期的错误决策当作"约定"继续执行
CLAUDE.md 里的规则会被后续对话里的"临时指令"覆盖，且 AI 自己不会报警
每个 Agent Session 的独立性意味着没有跨 session 的一致性保障

你们需要一套"Session 隔离 + 决策归档"机制，每次 Agent Session 结束后，强制输出一份结构化的"决策日志"，作为下一个 Session 的冷启动输入，而不是依赖 AI 从代码里"反推"上下文。

忽略点 2：LLM 快速发展会让你们的"最佳实践"很快过时
这是最大的战略风险。你们花大力气配置的 CLAUDE.md 规则、Codex AGENT.md 规则，都是针对当前模型能力设计的。
6 个月后：

Claude 的 context window 再扩大，某些"拆分策略"变得多余
新模型可能原生支持更好的 DDD 理解，你们的约束变成了噪音
某个新的 Agent 框架（比如现在的 Claude Code 取代了 Cursor）让你们的配置文件格式失效

你们的 Skills 系统本身必须是可自我迭代的，能感知"这条规则是否还有效"。这要求每条 Skill 都有效力验证机制，而不仅仅是文档。

忽略点 3：安全边界在 AI 时代被完全重新定义了
你们把"安全和稳定"列为第一优先级，但 AI Coding Agent 引入了全新的安全威胁面，你们的文档里完全没有提到：

Prompt Injection via codebase：恶意依赖包的注释/README 可以操纵 Agent 的行为
供应链攻击的 AI 放大效应：AI 会建议安装第三方包，且不会像人一样怀疑"这个包为什么只有 3 个 star"
AI 生成代码的审计盲区：传统 SAST 工具不能有效检测 AI 生成代码里的逻辑漏洞（如权限绕过）
Secret 泄漏的新路径：AI 在处理 context 时可能把环境变量、API key 写入测试文件或注释

这些必须在模板层面就有防护，不能靠开发者自觉。

四、深化和扩展
更准确的系统模型
你们描述的不是一个"模板库"，而是一个 AI-Native Engineering Platform（ANEP），它的核心价值主张应该是：

把软件工程的"知识密集型"部分（架构决策、最佳实践、领域规则）从人的大脑里外化成机器可执行的约束，让 AI Agent 在这个约束框架内自由发挥。

这个平台有三层：
┌─────────────────────────────────────────────────────┐
│  Layer 3: 知识层（Skills / ADR / Intent）             │
│  → 人类经验的结构化沉淀，AI 可检索、可激活             │
├─────────────────────────────────────────────────────┤
│  Layer 2: 约束层（CI Gates / Arch Tests / Policies） │
│  → 机器可验证的规则，AI 违反时立即报错                │
├─────────────────────────────────────────────────────┤
│  Layer 1: 脚手架层（Templates / Monorepo / Tooling） │
│  → 最低摩擦的起点，不是"最佳实践"而是"唯一实践"        │
└─────────────────────────────────────────────────────┘
你们现在的规划主要在 Layer 1，Layer 2 很弱，Layer 3 还没有真正设计。护城河在 Layer 3，Layer 1 随时可以被 create-next-app 替代。

Skills 系统的真正设计方向
不是知识库，而是 Contextual Memory as Code（CMaC）：
每一条 Skill 是一个有完整生命周期的实体：

触发条件（什么场景下 AI 应该读这条）
内容（结构化的解决方案，不是散文）
验证指标（怎么知道这条 Skill 是否还有效）
过期机制（基于 LLM 版本或日期自动标记为"待验证"）
来源溯源（这条 Skill 从哪个真实问题里提炼出来的，附 PR 链接）

存储格式建议是 Markdown + YAML frontmatter，放在 Git 里，和代码一起版本化。这样 AI 可以在任何时候 git blame 一条规则，理解它的历史。

目录契约的真正设计方向
现有的目录结构设计通常是给"人"看的。面向 AI Agent，需要的是语义化目录：
src/
  core/          # 永远稳定，AI 只能读不能随意改
  features/      # AI 的主战场，每个 feature 是自包含的
    [feature-name]/
      __contract__.ts   # 对外暴露的接口声明（AI 必须维护）
      __tests__/        # 测试先于实现
      index.ts          # 唯一出口
  _experiments/  # research preview 功能，有明确生命周期标注
  infra/         # 基础设施，变更需要人工审批
关键是 __contract__.ts——这是 AI 在开发新功能时必须先写的文件，明确声明"这个 feature 对外暴露什么，依赖什么"，类似于 OpenAPI spec 但在代码层面。删除 feature 时，只需删除目录，__contract__.ts 的消失会自动让所有引用它的地方报错。

GEO 的正确打开方式
按优先级排：

MCP Server（最高优先级）：把你们的模板库和 Skills 封装成 MCP Server，让所有支持 MCP 的 Agent 工具可以直接调用。这是"即时可得性"的唯一真正解法
llms.txt 标准：在每个仓库根目录维护 llms.txt（类似 robots.txt，是正在形成中的 LLM 可读性标准），声明项目结构、核心约定、API 入口
高密度的 AI 可读 README：不是给人看的漂亮 README，而是包含完整上下文的机器友好文档，第一段就回答"这个项目是什么、不是什么、怎么用"


总结一句话：你们的方向是对的，但目前的设计停留在"给 AI 一个好的起点"，而真正的目标应该是"让 AI 在整个生命周期内都有可靠的约束和记忆"。Layer 2 的机器可验证约束和 Layer 3 的结构化 Skills 系统，才是这套东西真正的价值所在。
想深入哪个方向？我建议优先讨论 Layer 2 的约束层设计，或者 Skills 系统的数据模型。You said: 先讨论 Layer 2 的约束层设计 2.先讨论 Layer 2 的约束层设计 2. 我们想使用Fumadocs 落地 llms.txt 规范并作为当前仓库的知识库，面向AI Agent和利益相关者（主要是构建者），用它记录应用的演化和开发路径，与归档的openspec changes一一对应，openspec changes作为single source of turth，skills系统单独做May 31Claude responded: 好，继续澄清几个关键点再深入：好，继续澄清几个关键点再深入：You said: Q: Layer 2 约束层，你们目前 CI/CD 用的是什么？Q: Layer 2 约束层，你们目前 CI/CD 用的是什么？
A: 1和3Q: Fumadocs 作为知识库，你们期望它的主要「消费方式」是？ (Select all that apply)
A: 通过 MCP Server 被 Agent 实时检索, 生成静态 llms.txt 供 LLM 爬取, 开发者在浏览器里查阅, AI Agent 在任务开始前主动拉取（如 CLAUDE.md 里引用）Q: OpenSpec 在你们团队的落地程度如何？
A: 完整落地，是我们的 source of truthMay 31Claude responded: 好，信息非常清晰了。这两个主题我分开深入讨论。好，信息非常清晰了。这两个主题我分开深入讨论。

Part 1：Layer 2 约束层设计
核心设计原则：约束必须是"机器裁判"，不是"人工审查"
你们是 GitHub Actions + Dokploy 混合 CI。这个组合的关键问题是：Dokploy 负责部署，但它不是代码质量的守门员。所有 Layer 2 的约束门禁必须在 GitHub Actions 里完成，Dokploy 只接收"已通过所有门禁的产物"。

约束层的三条防线
防线 1：本地强制（Pre-commit / Pre-push）
这是最被低估的一层。AI Agent（尤其是 Claude Code）提交代码前，必须在本地就被拦截，不能等 CI。原因是：CI 的反馈循环太长，Agent 会在等待 CI 的过程中继续做别的事，上下文已经漂移。
工具链：lefthook（比 husky 更快，对 monorepo 更友好）
yaml# lefthook.yml — 放在 monorepo 根目录
pre-commit:
  parallel: true
  commands:
    type-check:
      run: pnpm turbo type-check --filter='[HEAD]'
    lint-staged:
      run: pnpm lint-staged
    contract-check:
      # 检查每个 feature 目录是否有 __contract__.ts
      run: node scripts/check-feature-contracts.js

pre-push:
  commands:
    arch-test:
      run: pnpm turbo arch-test --filter='[HEAD]'
    no-secrets:
      run: pnpm dlx secretlint '**/*'
关键点：--filter='[HEAD]' 让 Turborepo 只检查有变更的包，避免全量扫描拖慢 Agent 节奏。

防线 2：CI 门禁（GitHub Actions）
分两个 workflow，职责严格分离：
Workflow A：ci-fast.yml（每次 push，< 3 分钟）
这是给 AI Agent 的实时反馈，必须快：
┌─────────────────────────────────────┐
│  1. Type Check（tsc --noEmit）       │  ← 类型是最强的契约
│  2. Lint（ESLint + 架构规则）         │  ← 含 dependency-cruiser
│  3. Unit Tests（仅变更包）            │  ← turbo --filter=[HEAD~1]
│  4. Contract Integrity Check         │  ← 核心，见下
└─────────────────────────────────────┘
Workflow B：ci-full.yml（PR to main，可慢）
┌─────────────────────────────────────┐
│  1. Integration Tests                │
│  2. E2E（Playwright，关键路径）       │
│  3. Security Scan（SAST）            │
│  4. OpenSpec Diff Validation         │  ← 核心，见下
│  5. Docs Build Check                 │  ← Fumadocs 能否正常构建
└─────────────────────────────────────┘

防线 3：架构守卫（Architecture Tests）
这是 Layer 2 里最重要、最被忽视的部分。用 dependency-cruiser 把你们的架构规则写成可执行的代码：
javascript// .dependency-cruiser.cjs
module.exports = {
  forbidden: [
    {
      name: "core-不允许被features直接修改",
      comment: "core 层只能被 features 引用，不能反向依赖",
      severity: "error",
      from: { path: "^src/core" },
      to: { path: "^src/features" },
    },
    {
      name: "features-之间不能互相直接引用",
      comment: "feature 间通信只能通过 core/events 或 __contract__",
      severity: "error", 
      from: { path: "^src/features/([^/]+)/" },
      to: { 
        path: "^src/features/([^/]+)/",
        // 不能引用其他 feature 的非 __contract__ 文件
        pathNot: "^src/features/$1/__contract__"
      },
    },
    {
      name: "infra-变更需要人工确认",
      severity: "warn", // warn 而不是 error，触发 PR 特殊标签
      from: { path: "^src/features" },
      to: { path: "^src/infra" },
    },
  ],
};
这段配置做到的事是：AI 写的任何代码，只要违反了你们的分层约定，CI 直接 fail，不需要 code review 去发现。

Contract Integrity Check（最核心的门禁）
这是专门为 AI Coding 设计的门禁，传统项目没有这个概念。
每个 feature 目录必须有 __contract__.ts，CI 检查它的完整性：
typescript// scripts/check-feature-contracts.ts
// 这个脚本由 CI 执行，不是业务代码

import { glob } from 'glob'
import { parse } from '@typescript-eslint/parser'
import fs from 'fs'

const featureDirs = glob.sync('src/features/*/') 

for (const dir of featureDirs) {
  const contractPath = `${dir}__contract__.ts`
  const indexPath = `${dir}index.ts`
  
  // 规则 1：有 index.ts 就必须有 __contract__.ts
  if (fs.existsSync(indexPath) && !fs.existsSync(contractPath)) {
    console.error(`❌ Missing contract: ${contractPath}`)
    process.exit(1)
  }
  
  // 规则 2：__contract__.ts 必须导出 FeatureContract 类型
  if (fs.existsSync(contractPath)) {
    const content = fs.readFileSync(contractPath, 'utf-8')
    if (!content.includes('export type FeatureContract')) {
      console.error(`❌ Invalid contract format: ${contractPath}`)
      process.exit(1)
    }
  }
  
  // 规则 3：index.ts 只能导出 __contract__.ts 里声明的内容
  // ...AST 检查逻辑
}

OpenSpec Diff Validation（PR 门禁）
这是你们独有的优势——OpenSpec 已经完整落地，意味着可以做这件事：
yaml# .github/workflows/ci-full.yml 片段
- name: Validate OpenSpec Changes
  run: |
    # 检查：如果 src/ 有变更，openspec/changes/ 是否也有对应更新
    CHANGED_FEATURES=$(git diff --name-only HEAD~1 | grep '^src/features/' | cut -d'/' -f3 | sort -u)
    for feature in $CHANGED_FEATURES; do
      SPEC_FILE="openspec/changes/${feature}.md"
      if [ ! -f "$SPEC_FILE" ]; then
        echo "❌ Feature '$feature' changed but no OpenSpec entry found at $SPEC_FILE"
        exit 1
      fi
      # 检查 spec 文件的最后修改时间是否晚于代码变更
      # 确保"先写 spec，再写代码"的顺序
    done
这个门禁的意义：强制 AI 在修改代码之前必须更新 OpenSpec。不是靠规范文档约束，是 CI 物理拦截。

Security 门禁（AI 时代特有）
yaml# 专门针对 AI 生成代码的安全检查
- name: AI-Specific Security Scan
  run: |
    # 1. 检查 hardcoded secrets（AI 经常把 test key 留在代码里）
    pnpm dlx secretlint '**/*.{ts,tsx,js,json}'
    
    # 2. 检查新增依赖的健康度（AI 会装奇怪的包）
    node scripts/check-new-deps.js
    
    # 3. 检查 __tests__ 目录是否和 feature 同步存在
    node scripts/check-test-coverage-structure.js
check-new-deps.js 的逻辑：对比 git diff HEAD~1 package.json，对新增的每个依赖检查：npm 下载量、最后发布时间、是否有已知 CVE。这个检查在 AI 时代价值极高，因为 AI 会毫无顾虑地建议安装低质量包。

Layer 2 总体架构图
代码提交
    │
    ▼
[本地 lefthook]
  type-check ──── fail → 立即报错，不出本地
  lint
  contract-check
    │ pass
    ▼
[GitHub Actions: ci-fast]  < 3min
  type-check（全量）
  arch-test（dependency-cruiser）
  unit-test（变更包）
  secret-scan
    │ pass
    ▼
[PR to main: ci-full]
  integration-test
  e2e（关键路径）
  openspec-diff-validation ──── fail → 必须先更新 spec
  docs-build-check
    │ pass
    ▼
[Dokploy]  ← 只接收干净的产物
  deploy to staging/prod

Part 2：Fumadocs + llms.txt + OpenSpec 知识库设计
整体定位的再校准
你们想用 Fumadocs 同时服务四类消费者：AI Agent 实时检索、开发者浏览、CLAUDE.md 引用、llms.txt 爬取。这四类消费者的需求完全不同，必须在架构层面分开，而不是用一套文档格式试图同时满足。
┌─────────────────────────────────────────────────────────┐
│                    Fumadocs App                          │
│                                                          │
│  /docs/           → 人读，完整叙述，有导航               │
│  /changelog/      → 和 OpenSpec changes 一一对应         │
│  /llms.txt        → 机器读，极简索引（规范格式）          │
│  /llms-full.txt   → 机器读，完整内容压缩版               │
│  /api/search      → MCP Server 的数据源                  │
└─────────────────────────────────────────────────────────┘

llms.txt 的正确实现
llms.txt 是 Answer.AI 提出的规范（Jeremy Howard），目前被越来越多的项目采用。格式是严格的：
markdown# [Project Name]

> 一句话：这个项目是什么

[2-3 句背景，不超过 150 词]

## Docs

- [快速开始](https://your-docs.com/llms-full.txt): 完整文档（供 LLM 全量读取）
- [架构决策](https://your-docs.com/adr/llms.txt): 所有 ADR 的索引
- [API 参考](https://your-docs.com/api/llms.txt): 接口文档

## Changelog

- [最新变更](https://your-docs.com/changelog/latest/llms.txt): 最近 10 个 OpenSpec changes
- [完整历史](https://your-docs.com/changelog/llms.txt): 所有变更归档

## Optional

- [Roadmap](https://your-docs.com/roadmap/llms.txt): 当前迭代计划
关键设计决策：llms.txt 是索引，不是内容本身。它告诉 LLM "完整内容在哪里"，LLM 按需 fetch。这和把所有内容塞进一个文件的做法不同，后者会让 LLM context 爆炸。

Fumadocs 里的 OpenSpec Changes 集成
这是最重要的部分。你们的 OpenSpec changes 是 source of truth，Fumadocs 的 changelog 不是独立写的，而是从 OpenSpec 生成的。
目录结构设计
monorepo/
├── openspec/
│   └── changes/
│       ├── 2025-01-15-auth-redesign.md      ← source of truth
│       ├── 2025-01-20-payment-integration.md
│       └── _schema.md                        ← change 的 frontmatter schema
│
└── apps/
    └── docs/                                 ← Fumadocs app
        ├── content/
        │   └── changelog/                    ← 由脚本从 openspec/changes 同步
        │       └── (auto-generated, git-ignored)
        └── scripts/
            └── sync-openspec.ts             ← 同步脚本，CI 执行
OpenSpec Change 的 Frontmatter Schema
每个 OpenSpec change 文件的 frontmatter 需要扩展，以支持 Fumadocs 的消费：
yaml---
# 原有 OpenSpec 字段
id: "auth-redesign-2025-01-15"
version: "1.4.0"
status: "implemented"  # draft | review | implemented | deprecated
type: "breaking-change"  # feature | bugfix | breaking-change | deprecation

# 新增：面向 Docs 和 AI 消费的字段
affects:
  - feature: "auth"
  - feature: "user-profile"
intent: "将 JWT 替换为 session-based auth，原因是移动端 token 刷新问题频繁"
decision_basis: "https://github.com/your-org/your-repo/issues/123"
ai_context: |
  这次变更后，所有涉及 auth 的代码不应再直接操作 JWT token。
  应使用 useSession() hook，session 对象在 __contract__.ts 里有完整类型定义。
  这是一个不可逆的架构决策。
---
ai_context 字段是关键——这是专门写给 AI Agent 读的，人读的内容写在正文里，AI 需要的上下文（哪些模式是废弃的、哪些是强制的）写在这里。
同步脚本
typescript// apps/docs/scripts/sync-openspec.ts
// CI 执行，把 openspec/changes 同步到 docs/content/changelog

import { glob } from 'glob'
import matter from 'gray-matter'
import fs from 'fs'
import path from 'path'

const OPENSPEC_DIR = '../../openspec/changes'
const OUTPUT_DIR = './content/changelog'

async function sync() {
  const files = glob.sync(`${OPENSPEC_DIR}/*.md`)
  
  for (const file of files) {
    const raw = fs.readFileSync(file, 'utf-8')
    const { data: frontmatter, content } = matter(raw)
    
    // 为 Fumadocs 重新组装 frontmatter
    const docsFrontmatter = {
      title: frontmatter.id,
      description: frontmatter.intent,
      date: frontmatter.id.split('-').slice(0, 3).join('-'),
      version: frontmatter.version,
      status: frontmatter.status,
      type: frontmatter.type,
      // ai_context 保留，会出现在 llms-full.txt 里
      ai_context: frontmatter.ai_context,
    }
    
    const outputContent = matter.stringify(content, docsFrontmatter)
    const outputPath = path.join(OUTPUT_DIR, path.basename(file))
    fs.writeFileSync(outputPath, outputContent)
  }
  
  // 生成 llms.txt 的 changelog 部分
  generateChangelogLlmsTxt(files)
}

CLAUDE.md 里如何引用 Fumadocs
这是"AI Agent 在任务开始前主动拉取"的具体实现方式：
markdown<!-- CLAUDE.md 片段 -->

## 开始任务前的必读步骤

**在修改任何 feature 代码前，执行以下检查：**

1. 读取项目当前状态：
   `fetch https://your-docs.com/llms.txt`

2. 如果涉及特定 feature，读取对应的变更历史：
   `fetch https://your-docs.com/changelog/[feature-name]/llms.txt`

3. 检查该 feature 是否有 `deprecated` 状态的 OpenSpec change，
   如有，相关模式不得再使用。

## 写代码前的契约

任何新 feature 必须：
1. 先在 `openspec/changes/` 创建 change 文件（frontmatter 至少填 intent）
2. 再写 `__contract__.ts`
3. 最后写实现

顺序不可颠倒。CI 会验证这个顺序。

MCP Server 的定位
你们希望通过 MCP Server 被 Agent 实时检索。这里要做一个清晰的边界划分：
Fumadocs MCP Server 负责（只读，文档检索）：

搜索 changelog（"最近 auth 模块有什么变更？"）
获取某个 feature 的 ai_context
查询某个模式是否已 deprecated

Skills MCP Server 负责（另一个系统，你们说单独做）：

检索解决方案模式
激活特定领域的约束规则

这两个 MCP Server 在 CLAUDE.md 里会同时被引用，但不要合并，职责不同。
Fumadocs MCP Server 的最简实现：
typescript// apps/docs/src/mcp-server.ts
// 基于 Fumadocs 的搜索 API 封装

export const tools = [
  {
    name: "search_changelog",
    description: "搜索 OpenSpec changelog，查询某个 feature 的变更历史或架构决策",
    inputSchema: {
      query: { type: "string" },
      feature: { type: "string", optional: true },
      status: { 
        type: "string", 
        enum: ["draft", "review", "implemented", "deprecated"],
        optional: true 
      }
    },
    handler: async ({ query, feature, status }) => {
      // 调用 Fumadocs 内置的搜索 API
      const results = await searchDocs({ query, filters: { feature, status } })
      // 返回时只返回 ai_context + 关键 frontmatter，不返回人读的正文
      // 控制 context 消耗
      return results.map(r => ({
        id: r.frontmatter.id,
        intent: r.frontmatter.description,
        ai_context: r.frontmatter.ai_context,
        status: r.frontmatter.status,
        url: r.url,
      }))
    }
  }
]

整体数据流
[开发者 / AI Agent]
    写 OpenSpec Change（source of truth）
         │
         ▼
openspec/changes/*.md
         │
         ├──→ [CI: sync-openspec.ts]
         │           │
         │           ▼
         │    apps/docs/content/changelog/
         │           │
         │           ├──→ Fumadocs 渲染（人读 /changelog）
         │           ├──→ /llms.txt 生成（LLM 爬取）
         │           ├──→ /llms-full.txt 生成
         │           └──→ MCP Server 数据源（Agent 检索）
         │
         └──→ [CI: openspec-diff-validation]
                     │
                     ▼
              代码变更必须有对应 Change 文件
              否则 PR 被拒绝

一个需要提前解决的问题
Fumadocs 的搜索默认依赖 Orama（本地搜索）或 Algolia。你们是中国服务器，Algolia 在国内不稳定，建议：

优先用 Orama（纯本地，无外部依赖，Fumadocs 原生支持）
MCP Server 的搜索直接调用 Orama 的 Node.js API，不需要额外搜索服务

这个决定现在做，不要等到部署时才发现 Algolia 超时。

你们现在 OpenSpec 已完整落地，这实际上是最好的起点——很多团队在这一步就卡住了。下一步最关键的执行决策是：ai_context 字段的写作规范。它是整套系统里唯一需要"人写给机器看"的内容，质量直接决定 AI Agent 检索后是否真的做出正确决策。要不要专门讨论这个字段的设计规范？You said: Skills 系统的数据模型和Layer 3: 知识层（Skills / ADR / Intent） │ │ → 人类经验的结构化沉淀，AI 可检索、可激活Skills 系统的数据模型和Layer 3: 知识层（Skills / ADR / Intent） │ │ → 人类经验的结构化沉淀，AI 可检索、可激活May 31Claude responded: 好，在深入之前，几个关键问题：好，在深入之前，几个关键问题：You said: Q: Skills 系统的「主要激活环境」，你们团队实際使用哪个 Agent 最多？Q: Skills 系统的「主要激活环境」，你们团队实際使用哪个 Agent 最多？
A: 混合使用，没有主力工具Q: 你们内部知识库里沉淀的「知识类型」主要是哪些？ (Select all that apply)
A: 解决方案模式（How to solve X）, 架构决策记录（Why we chose X over Y）, 项目独有业务规则（Our domain rules）, 坑和反模式（What NOT to do）, 工具配置范式（How to configure X in our stack）Q: Skills 系统的「存储形态」，你们倒向哪种？
A: 我们之前是使用的1，但是不确定有没有更好的方式May 31Claude responded: 五种知识类型都有，这是最复杂的情况，也是最值得认真设计的情况。让我直接给出完整的数据模型设计。五种知识类型都有，这是最复杂的情况，也是最值得认真设计的情况。让我直接给出完整的数据模型设计。

Skills 系统：完整数据模型设计
先解决存储形态的疑问
你们用 Git 存储是正确的，不需要换。但问题不在存储位置，在于现有知识库的格式是给人读的散文，不是给机器激活的结构。
真正需要改变的是：从"文档"思维 → "可执行知识单元"思维。
# 现状（人读的文档）
## Supabase RLS 踩坑记录
我们在做多租户时发现 RLS 有个问题，就是...
后来我们用了这个方法解决...

# 目标（机器可激活的 Skill）
---触发条件、置信度、验证机制都是元数据---
当 Agent 遇到"多租户 + Supabase"时，这个 Skill 自动注入 context
存储仍在 Git，但格式完全不同。

核心概念：Skill 不是文档，是"有生命周期的知识单元"
一个 Skill 需要回答六个问题：
1. WHEN   → 什么情况下我应该被激活？（触发条件）
2. WHO    → 我适用于哪些 Agent / 哪些场景？（适用范围）
3. WHAT   → 我的内容是什么？（知识本体）
4. HOW    → Agent 怎么用我？（执行语义）
5. VERIFY → 怎么知道我还有效？（验证机制）
6. WHY    → 我从哪里来？（溯源）
传统知识库只回答了第 3 个问题。

数据模型：五种知识类型 × 统一 Schema
所有 Skill 共用一个基础 Schema，不同知识类型用 kind 字段区分，再各自扩展专有字段。
基础 Schema（所有 Skill 共有）
yaml# skills/[domain]/[skill-id].skill.md
---
# ── 身份 ──────────────────────────────────
id: "supabase-rls-multi-tenant"
kind: "pattern"          # pattern | adr | domain-rule | anti-pattern | config
version: "1.2.0"         # Skill 自己的版本，独立于项目版本
status: "active"         # draft | active | deprecated | superseded

# ── 触发系统（核心）──────────────────────────
triggers:
  keywords:              # 出现这些词时 MCP Server 返回此 Skill
    - "supabase"
    - "RLS"
    - "多租户"
    - "row level security"
  contexts:              # 代码上下文特征（可选，供高级检索）
    files: ["*.sql", "supabase/migrations/**"]
    imports: ["@supabase/supabase-js"]
  situations:            # 自然语言描述的触发场景（供语义检索）
    - "需要给不同用户隔离数据访问权限"
    - "配置 Supabase 的行级安全策略"
  anti_triggers:         # 明确不适用的场景
    - "单租户应用"
    - "public 数据不需要隔离"

# ── 适用范围 ──────────────────────────────
applies_to:
  agents: ["claude-code", "cursor", "codex", "all"]
  stack: ["supabase", "typescript"]
  project_types: ["web", "api"]   # 来自你们的模板类型

# ── 置信度和优先级 ────────────────────────
priority: "critical"     # critical | high | medium | low
# critical = Agent 必须遵守；high = 强烈建议；medium = 参考；low = 备选

# ── 验证机制 ──────────────────────────────
validation:
  last_verified: "2025-01-15"
  verified_by: "human"   # human | ci | auto-test
  expires_after: "90d"   # 90天后标记为"待验证"
  verify_command: "pnpm test --filter=supabase-rls"
  # CI 会定期执行这个命令，失败则自动将 status 改为 deprecated

# ── 溯源 ──────────────────────────────────
provenance:
  origin: "incident"     # incident | adr | experiment | external
  source_link: "https://github.com/your-org/repo/issues/234"
  openspec_change: "auth-redesign-2025-01-15"  # 关联 OpenSpec change
  author: "team"
  created: "2024-11-20"
---

[正文：Skill 的具体内容，格式因 kind 而不同]

Kind 1：pattern（解决方案模式）
yaml---
id: "supabase-rls-multi-tenant"
kind: "pattern"
# ... 基础字段 ...
---

## Context（为什么需要这个模式）
多租户应用中，每个用户只能访问自己 org 下的数据。
直接在应用层过滤不够安全，必须在数据库层强制隔离。

## Pattern（怎么做）

### 强制约定
1. RLS 策略**必须**在 migration 文件里定义，不在 Supabase Dashboard 手动配置
2. 使用 `auth.uid()` 而不是 `current_user`（后者在 Supabase 语境下行为不符合预期）
3. 每张需要隔离的表**必须**有对应的 integration test

### 代码模板
```sql
-- migration: enable_rls_for_[table_name].sql
ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;

CREATE POLICY "[table_name]_isolation" ON [table_name]
  FOR ALL
  USING (org_id = (
    SELECT org_id FROM user_profiles 
    WHERE id = auth.uid()
  ));
```

### 验证模板
```typescript
// __tests__/rls-[table_name].test.ts
it('should not return rows from other orgs', async () => {
  const { data } = await supabaseAsUser(otherOrgUser)
    .from('[table_name]')
    .select()
  expect(data).toHaveLength(0)
})
```

## Pitfalls（这个模式里的坑）
- `USING` 和 `WITH CHECK` 的区别：`USING` 控制读，`WITH CHECK` 控制写，两个都要配
- service_role 会绕过 RLS，测试时注意使用普通用户 client

## Related Skills
- `supabase-migration-workflow`（如何写 migration）
- `anti-pattern:supabase-dashboard-manual-config`（为什么不能手动配）

Kind 2：adr（架构决策记录）
ADR 的特殊性：它记录的是决策过程，不是解决方案。Agent 读 ADR 的目的是"理解为什么现在是这个样子，不要去改它"。
yaml---
id: "adr-auth-session-over-jwt"
kind: "adr"
status: "active"
priority: "critical"

triggers:
  keywords: ["JWT", "token", "auth strategy", "认证方案"]
  situations:
    - "考虑修改认证方式"
    - "实现 token 刷新逻辑"
  # ADR 的 anti_trigger 特别重要：
  # 当 Agent 想"优化"一个已有决策时，必须先读相关 ADR
  anti_triggers: []

# ADR 专有字段
decision:
  chosen: "session-based auth via Supabase Auth"
  alternatives_considered:
    - option: "custom JWT"
      rejected_because: "移动端 token 刷新在弱网环境下失败率高，且我们没有资源维护 refresh token 轮转逻辑"
    - option: "third-party (Auth0)"
      rejected_because: "成本和数据出境合规问题"
  reversibility: "hard"   # easy | medium | hard | irreversible
  decision_date: "2024-10-01"
---

## Decision
使用 Supabase Auth 的 session-based 认证，不自行实现 JWT。

## Status
**Active — 不得在未经团队讨论的情况下修改此决策。**

## Consequences
- ✅ 移动端 session 管理由 Supabase SDK 处理，无需自行维护
- ✅ RLS 策略可直接使用 `auth.uid()`
- ⚠️  强依赖 Supabase Auth，迁移成本高
- ⚠️  自定义 claims 需要通过 Supabase 的 JWT hook 实现，有学习成本

## Agent 指令
> **如果你正在考虑引入自定义 JWT 逻辑或替换认证方案：**
> 停止。先阅读此 ADR，然后在 OpenSpec 里创建一个 `type: proposal` 的 change，
> 经团队评审后再动代码。

Kind 3：domain-rule（业务规则）
业务规则是最容易被 AI 破坏的一类知识，因为它们不体现在代码结构里，只体现在业务逻辑里。
yaml---
id: "billing-rule-proration"
kind: "domain-rule"
priority: "critical"
status: "active"

triggers:
  keywords: ["billing", "subscription", "upgrade", "downgrade", "proration", "计费"]
  files: ["**/billing/**", "**/subscription/**"]
  situations:
    - "处理订阅升降级"
    - "计算费用"

# domain-rule 专有字段
domain: "billing"
enforced_by: "code"      # code | test | process | honor-system
# code = 有对应的 validation 代码；test = 有专门测试覆盖；
# process = 流程约束；honor-system = 只靠人遵守（最弱，需要升级）
---

## Rule
订阅升级时，按剩余天数比例计算差价（proration），**当天生效**。
订阅降级时，差价以 credit 形式存入账户，**下个计费周期生效**。

## 为什么这样规定
升级立即生效是用户期望，降级不立即退款是防止套利（用户在月末升级用完额度后立即降级）。

## 边界条件（AI 必须处理）
- 试用期内的升降级：不计算 proration，直接切换
- 年付转月付：不允许，必须等年付到期
- 同一天多次变更：只计算最终状态和起始状态的差值

## Violation 示例（反例）
```typescript
// ❌ 错误：降级立即退款
const refund = calculateProration(oldPlan, newPlan, daysRemaining)
await stripe.refund(refund)  // 绝对不能这样做

// ✅ 正确：降级存 credit
const credit = calculateProration(oldPlan, newPlan, daysRemaining)
await creditService.add(userId, credit)
```

Kind 4：anti-pattern（坑和反模式）
反模式是一种特殊的 Skill，它的激活逻辑是检测到某种代码模式时主动警告，而不是被动查询。
yaml---
id: "anti-pattern:direct-db-in-feature"
kind: "anti-pattern"
priority: "high"
status: "active"

triggers:
  keywords: ["prisma", "drizzle", "supabase.from", "db.query"]
  # 关键：这些 keywords 出现在 features/ 目录下时才触发
  files: ["src/features/**/*.ts"]
  situations:
    - "在 feature 层直接写数据库查询"

# anti-pattern 专有字段
severity: "error"         # error | warning | info
detection:
  type: "pattern-match"   # pattern-match | ast | lint-rule
  lint_rule: "no-direct-db-in-features"  # 对应 ESLint 规则
---

## 反模式描述
在 `src/features/` 下的文件里直接调用数据库客户端（Prisma/Drizzle/Supabase）。

## 为什么禁止
Feature 层直接操作数据库会：
1. 破坏分层架构，让 feature 测试必须依赖真实数据库
2. 导致相同查询逻辑散落在多个 feature 里，无法统一优化
3. 让 AI 在后续迭代中不断复制这个模式，雪球越滚越大

## 正确做法
```typescript
// ❌ 禁止：feature 直接操作 DB
// src/features/user-profile/index.ts
import { db } from '@/infra/db'
const user = await db.query.users.findFirst(...)

// ✅ 正确：通过 repository 接口
// src/features/user-profile/index.ts  
import { userRepository } from '@/core/repositories/user'
const user = await userRepository.findById(userId)
```

## 自动检测
此反模式已配置 ESLint 规则（`no-direct-db-in-features`），
违反时 CI 直接 fail，**不需要 Agent 记住这条规则，违反时 CI 会提醒。**

## 例外情况
`src/features/_experiments/` 下的实验性功能可以临时豁免，
但在从 `_experiments/` 毕业前必须重构。

Kind 5：config（工具配置范式）
yaml---
id: "config:nextjs-middleware-auth"
kind: "config"
priority: "high"
status: "active"

triggers:
  keywords: ["middleware", "Next.js", "auth", "protected routes"]
  files: ["middleware.ts", "src/middleware.ts"]
  situations:
    - "配置 Next.js 路由保护"
    - "实现需要认证的页面"

# config 专有字段  
tool: "next.js"
tool_version_range: ">=14.0.0"
# 版本范围很关键：过期的配置比没有配置更危险
tested_on: "14.2.0"
---

## 配置模板

```typescript
// middleware.ts（项目根目录，不在 src/ 下）
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  const { data: { session } } = await supabase.auth.getSession()
  
  // 未登录且访问保护路由 → 重定向到登录页
  if (!session && req.nextUrl.pathname.startsWith('/app')) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  
  return res
}

export const config = {
  matcher: ['/app/:path*']  // 只保护 /app 下的路由
}
```

## 注意事项
- `matcher` 必须排除 `/_next/`、`/api/auth/` 等，否则会造成死循环
- `createMiddlewareClient` 必须同时传 `req` 和 `res`，缺一不可
- Edge Runtime 下不能使用 Node.js API，middleware 里不能用 fs、crypto 等

## 版本变更提醒
Next.js 15 的 middleware API 有变化，如果升级需要重新验证此配置。

目录结构
skills/
├── _schema/
│   ├── base.schema.yaml        # 基础 Schema 定义（CI 验证用）
│   └── kinds/
│       ├── pattern.schema.yaml
│       ├── adr.schema.yaml
│       ├── domain-rule.schema.yaml
│       ├── anti-pattern.schema.yaml
│       └── config.schema.yaml
│
├── _index.yaml                 # 所有 Skill 的索引（自动生成）
│
├── infra/
│   ├── supabase-rls-multi-tenant.skill.md      # pattern
│   ├── supabase-migration-workflow.skill.md    # pattern
│   └── anti-pattern:supabase-dashboard.skill.md
│
├── auth/
│   ├── adr:auth-session-over-jwt.skill.md      # adr
│   └── config:nextjs-middleware-auth.skill.md  # config
│
├── billing/
│   └── domain-rule:proration.skill.md          # domain-rule
│
└── architecture/
    ├── anti-pattern:direct-db-in-features.skill.md
    └── adr:monorepo-boundary.skill.md

激活机制：三种模式
Skills 系统的真正价值在激活机制，不在存储。针对你们混合使用多种 Agent 的情况：
模式 A：MCP Server 实时检索（最强）
typescript// skills-mcp-server/src/tools.ts

export const tools = [
  {
    name: "get_relevant_skills",
    description: `在开始任何编码任务前调用此工具。
    输入你的任务描述和将要修改的文件路径，
    返回所有相关的 Skills，包含必须遵守的规则和推荐模式。`,
    inputSchema: {
      task: { type: "string", description: "任务描述" },
      files: { type: "array", items: { type: "string" }, description: "将要修改的文件" },
      domain: { type: "string", optional: true }
    },
    handler: async ({ task, files, domain }) => {
      // 1. 关键词匹配
      const keywordMatches = await matchByKeywords(task, files)
      
      // 2. 语义检索（用 Orama 的向量搜索）
      const semanticMatches = await semanticSearch(task)
      
      // 3. 文件路径匹配
      const fileMatches = await matchByFilePaths(files)
      
      // 合并、去重、按 priority 排序
      const results = rankAndDedupe([...keywordMatches, ...semanticMatches, ...fileMatches])
      
      // 关键：critical 级别的 Skill 永远放在最前面，且标记为 MUST
      return {
        must_follow: results.filter(s => s.priority === 'critical'),
        recommended: results.filter(s => s.priority === 'high'),
        reference: results.filter(s => ['medium', 'low'].includes(s.priority)),
        // 返回精简版，控制 context 消耗
        // Agent 可以用 get_skill_detail 获取完整内容
      }
    }
  },
  {
    name: "get_skill_detail", 
    description: "获取某个 Skill 的完整内容",
    inputSchema: { skill_id: { type: "string" } },
    handler: async ({ skill_id }) => getSkillById(skill_id)
  },
  {
    name: "report_skill_issue",
    description: "报告某个 Skill 过时或有问题，触发人工复核",
    inputSchema: { 
      skill_id: { type: "string" },
      issue: { type: "string" }
    },
    handler: async ({ skill_id, issue }) => {
      // 在 skills/ 目录创建一个 GitHub Issue
      // 或者直接修改 Skill 的 status 为 'needs-review'
    }
  }
]
模式 B：CLAUDE.md 静态注入（保底）
MCP 不可用时的降级方案，把最关键的 critical Skills 直接内联：
markdown<!-- CLAUDE.md -->

## 任务开始前（如果 MCP 可用）
调用 `get_relevant_skills` 工具，传入任务描述和目标文件。

## 任务开始前（MCP 不可用时的降级）
阅读以下必读规则（所有 critical Skills 的摘要）：

### [CRITICAL] 认证
- 不得自行实现 JWT。使用 Supabase Auth session。
- 详情：skills/auth/adr:auth-session-over-jwt.skill.md

### [CRITICAL] 数据库访问
- Feature 层不得直接使用 DB 客户端。通过 repository 层访问。
- 详情：skills/architecture/anti-pattern:direct-db-in-features.skill.md

### [CRITICAL] 计费
- 降级操作存 credit，不直接退款。
- 详情：skills/billing/domain-rule:proration.skill.md
模式 C：CI 自动验证（兜底）
Skills 系统的最后一道防线——即使 Agent 没有读 Skills，CI 也会验证：
typescript// scripts/validate-skills-compliance.ts
// 对照 anti-pattern Skills，检查代码是否有违反

async function validateAntiPatterns() {
  const antiPatterns = await loadSkillsByKind('anti-pattern')
  
  for (const skill of antiPatterns) {
    if (skill.detection.type === 'lint-rule') {
      // 已由 ESLint 处理，跳过
      continue
    }
    if (skill.detection.type === 'pattern-match') {
      // 用 grep/AST 检查
      const violations = await detectPattern(skill.detection.pattern)
      if (violations.length > 0) {
        console.error(`❌ Anti-pattern detected: ${skill.id}`)
        console.error(violations)
        process.exit(1)
      }
    }
  }
}

Skills 的生命周期管理
这是整套系统能否持续运转的关键，也是最容易被忽视的部分。
创建 Skill                    验证/更新                    归档
   │                              │                          │
   ▼                              ▼                          ▼
[draft]  ──人工审核──→  [active]  ──CI定期验证──→  [needs-review]
                            │                          │
                            │         问题修复 ─────────┘
                            │
                        新 Skill 替代
                            │
                            ▼
                       [superseded] → 指向新 Skill ID
                            │
                        确认废弃
                            ▼
                       [deprecated] → 归档，不再检索
CI 定期任务（每周一次）：
yaml# .github/workflows/skills-health-check.yml
- name: Check skill expiration
  run: |
    node scripts/check-skill-expiry.js
    # 找出所有 expires_after 已过期的 active Skills
    # 自动创建 GitHub Issue，指定 owner 复核
    # 如果 30 天内无人处理，自动改为 needs-review 状态

总体架构
┌─────────────────────────────────────────────────────────────┐
│                      Skills 系统                             │
│                                                              │
│  skills/                    ← Git 存储，和代码共同版本化      │
│  ├── *.skill.md             ← 五种 Kind 的结构化知识单元      │
│  └── _index.yaml            ← 自动生成的检索索引             │
│            │                                                 │
│            ├──→ MCP Server  ← Agent 实时检索（主路径）        │
│            │       └── get_relevant_skills                   │
│            │       └── get_skill_detail                      │
│            │       └── report_skill_issue                    │
│            │                                                 │
│            ├──→ CLAUDE.md   ← critical Skills 静态内联（降级）│
│            │                                                 │
│            ├──→ CI 验证      ← anti-pattern 自动检测（兜底）  │
│            │                                                 │
│            └──→ Fumadocs    ← 人读界面（和 Changelog 分离）  │
│                                                              │
│  生命周期：draft → active → needs-review → deprecated        │
│  健康检查：每周 CI 自动扫描过期 Skills，创建 Issue            │
└─────────────────────────────────────────────────────────────┘

和上两层的接驳点
Layer 3 Skills 系统
    ↕  (Skills 里的 anti-pattern 生成 ESLint 规则)
Layer 2 约束层
    ↕  (代码变更触发 CI，CI 验证 OpenSpec change 存在)
Layer 1 模板层（OpenSpec + 目录结构）
三层不是独立的，是互锁的。Skills 系统里的 anti-pattern Kind 如果 detection.type 是 lint-rule，对应的 ESLint 规则就是 Layer 2 的一部分——Skills 是规则的源定义，ESLint 是规则的执行器。

现在这三层的设计逻辑已经完整。你们最快的落地路径是：先把现有内部知识库里最重要的 10 条经验，按这个数据模型重新整理成 .skill.md 文件，放进 Git，配一个最简单的 MCP Server 做关键词检索。不要一次做完整系统，先让 Agent 能读到结构化的 Skills，验证它确实改变了 Agent 的输出质量，再投入更多。
要继续讨论模板库的具体结构，还是先深入 MCP Server 的最简实现？You said: 继续讨论模板库的具体结构继续讨论模板库的具体结构May 31Claude responded: 几个关键问题先确认：几个关键问题先确认：You said: Q: 模板库本身的仓库组织形式，你们倾向哪种？Q: 模板库本身的仓库组织形式，你们倾向哪种？
A: 单一 Git 仓库，所有模板都在里面Q: 从模板创建新项目的「交付方式」，优先级是？
A: 以上都支持Q: 在你们实际业务里，哪类模板会被最频繁使用？
A: 各类型都差不多May 31Claude responded: 好，信息足够了。直接进入完整设计。好，信息足够了。直接进入完整设计。

模板库完整结构设计
先解决一个根本性的架构决策
单一 Git 仓库 + 所有交付方式都支持，这两个条件合在一起，意味着这个仓库本身就是一个产品，不是一堆文件夹的集合。它需要自己的 CI、自己的版本管理、自己的测试。
这个仓库的名字建议叫 forge（或你们自己的品牌名），后续讨论都用这个名字。

仓库顶层结构
forge/
├── templates/               # 所有模板的源码
│   ├── _shared/             # 跨模板共享的"原子块"
│   ├── web-nextjs/
│   ├── api-nestjs/
│   ├── mobile-expo/
│   ├── desktop-tauri/
│   ├── desktop-electron/
│   └── rust-service/
│
├── packages/                # forge 自身的工具包（monorepo）
│   ├── cli/                 # create-forge CLI
│   ├── scaffold/            # 模板渲染引擎（CLI 和脚本共用）
│   ├── validator/           # 模板健康度检查
│   └── sync/                # _shared 同步工具
│
├── skills/                  # Layer 3，forge 级别的 Skills
├── docs/                    # Fumadocs app（forge 自身的文档）
│
├── .github/
│   ├── workflows/
│   │   ├── ci-templates.yml      # 验证所有模板能正常构建
│   │   ├── ci-packages.yml       # forge 工具包的 CI
│   │   └── release.yml           # 版本发布
│   └── copilot-instructions.md
│
├── CLAUDE.md                # forge 仓库自身的 AI 指令
├── turbo.json
├── pnpm-workspace.yaml
└── package.json

_shared/：最重要的设计决策
_shared/ 是整套系统的核心资产，也是防止模板之间"配置漂移"的唯一机制。
它不是"公共代码库"，而是原子配置块（Atomic Config Blocks）——每个块是一个独立的、可组合的配置单元，模板通过声明依赖来组合它们，不是通过复制粘贴。
_shared/
├── ai-config/               # AI Coding 配置块
│   ├── claude/
│   │   ├── CLAUDE.md        # 基础模板（变量占位符）
│   │   └── CLAUDE.partial.md # 可被具体模板 extend 的片段
│   ├── copilot/
│   │   └── copilot-instructions.md
│   └── codex/
│       └── AGENT.md
│
├── ci/                      # CI 配置块
│   ├── github-actions/
│   │   ├── ci-fast.yml
│   │   ├── ci-full.yml
│   │   ├── release.yml
│   │   └── skills-health-check.yml
│   └── dokploy/
│       ├── dokploy.yml.template
│       └── docker-compose.yml.template
│
├── tooling/                 # 工具链配置块
│   ├── typescript/
│   │   ├── tsconfig.base.json
│   │   ├── tsconfig.nextjs.json
│   │   └── tsconfig.node.json
│   ├── eslint/
│   │   ├── base.js
│   │   ├── nextjs.js
│   │   ├── react.js
│   │   └── rules/
│   │       ├── no-direct-db-in-features.js   # ← Layer 2 规则
│   │       └── require-feature-contract.js
│   ├── lefthook/
│   │   └── lefthook.base.yml
│   └── dependency-cruiser/
│       └── .dependency-cruiser.base.cjs
│
├── openspec/                # OpenSpec 配置块
│   ├── _schema.md           # change frontmatter schema
│   ├── _template.md         # 新 change 的写作模板
│   └── scripts/
│       └── validate-changes.ts
│
├── docker/                  # Docker 配置块
│   ├── node.Dockerfile
│   ├── rust.Dockerfile
│   └── .dockerignore
│
├── docs-template/           # Fumadocs 文档应用模板块
│   ├── app/
│   ├── content/
│   │   ├── index.mdx
│   │   └── changelog/      # 由 openspec sync 填充
│   └── scripts/
│       └── sync-openspec.ts
│
└── skills-template/         # Skills 目录初始结构
    ├── _schema/
    ├── _index.yaml
    └── README.md
_shared/ 的同步机制
这是最容易出问题的地方。_shared/ 更新后，如何让所有已从模板创建的项目也能更新？
两种策略，选其一：
策略 A：Copy-on-create（简单，但下游项目无法自动更新）
  创建项目时，_shared/ 的内容被复制进去
  之后 _shared/ 更新，下游项目需要手动同步
  适合：团队规模小，项目数量可控

策略 B：Package-based（复杂，但可自动更新）
  _shared/ 的内容发布为 npm 包（私有或公开）
  下游项目通过 package.json 依赖这些包
  _shared/ 发版后，下游项目 pnpm update 即可
  适合：项目数量多，需要统一治理
建议：先用策略 A 启动，在 packages/sync/ 里实现一个同步检查工具，当下游项目的 _shared/ 配置落后于 forge 时，给出 diff 提示。不要一开始就做策略 B，过度工程化。

单个模板的内部结构
以 web-nextjs 为例，这是最复杂的模板，其他模板是它的子集。
templates/web-nextjs/
│
├── template.config.yaml          # 模板元数据（CLI 用）
│
├── apps/
│   ├── web/                      # Next.js 应用
│   │   ├── src/
│   │   │   ├── core/             # 永远稳定，AI 只读
│   │   │   │   ├── repositories/ # 数据访问接口（抽象层）
│   │   │   │   ├── events/       # 跨 feature 通信
│   │   │   │   ├── types/        # 全局类型
│   │   │   │   └── utils/        # 纯函数工具
│   │   │   │
│   │   │   ├── features/         # AI 主战场
│   │   │   │   ├── auth/
│   │   │   │   │   ├── __contract__.ts
│   │   │   │   │   ├── __tests__/
│   │   │   │   │   └── index.ts
│   │   │   │   ├── user-profile/
│   │   │   │   │   ├── __contract__.ts
│   │   │   │   │   ├── __tests__/
│   │   │   │   │   └── index.ts
│   │   │   │   └── _experiments/ # research preview 功能
│   │   │   │       └── .gitkeep
│   │   │   │
│   │   │   ├── infra/            # 基础设施，变更需人工审批
│   │   │   │   ├── db/           # Supabase / Drizzle 客户端
│   │   │   │   ├── auth/         # Auth 客户端封装
│   │   │   │   └── storage/
│   │   │   │
│   │   │   └── app/              # Next.js App Router
│   │   │       ├── (public)/     # 无需登录
│   │   │       │   ├── page.tsx
│   │   │       │   ├── login/
│   │   │       │   └── register/
│   │   │       ├── (app)/        # 需要登录
│   │   │       │   ├── layout.tsx
│   │   │       │   └── dashboard/
│   │   │       └── api/
│   │   │           └── [...route]/
│   │   │
│   │   ├── components/
│   │   │   ├── ui/               # shadcn/ui 原始组件（不修改）
│   │   │   ├── blocks/           # shadcn/ui blocks（不修改）
│   │   │   └── composed/         # 业务组合组件（AI 可写）
│   │   │
│   │   ├── middleware.ts
│   │   ├── next.config.ts
│   │   └── package.json
│   │
│   └── docs/                     # Fumadocs 文档应用（从 _shared/docs-template 初始化）
│       ├── app/
│       ├── content/
│       │   ├── index.mdx         # 项目介绍
│       │   ├── roadmap.mdx       # 路线图（手动维护）
│       │   ├── adr/              # 架构决策（手动维护）
│       │   └── changelog/        # 从 openspec/changes 自动同步
│       └── package.json
│
├── packages/
│   └── ui/                       # 共享 UI 组件包（如果需要跨 app 共享）
│       ├── src/
│       │   └── components/
│       └── package.json
│
├── openspec/
│   ├── changes/                  # OpenSpec changes（source of truth）
│   │   └── _template.md
│   └── _schema.md
│
├── skills/                       # 项目级 Skills
│   ├── _schema/                  # 从 _shared/skills-template 复制
│   └── _index.yaml
│
├── .github/
│   ├── workflows/                # 从 _shared/ci 复制
│   │   ├── ci-fast.yml
│   │   ├── ci-full.yml
│   │   └── skills-health-check.yml
│   └── copilot-instructions.md   # 从 _shared/ai-config/copilot 复制
│
├── CLAUDE.md                     # 从 _shared/ai-config/claude 渲染
├── AGENT.md                      # 从 _shared/ai-config/codex 复制
│
├── docker/
│   ├── web.Dockerfile
│   └── docker-compose.yml
│
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── lefthook.yml
├── .eslintrc.js
└── tsconfig.json

template.config.yaml：模板的元数据
这个文件是 CLI 和 scaffold 引擎的输入：
yaml# templates/web-nextjs/template.config.yaml
id: "web-nextjs"
name: "Web App (Next.js)"
description: "全栈 Web 应用，Next.js App Router + Supabase + shadcn/ui"
version: "1.0.0"

# CLI 交互式问答
prompts:
  - id: "project_name"
    message: "项目名称？"
    type: "text"
    validate: "^[a-z][a-z0-9-]*$"

  - id: "enable_billing"
    message: "是否启用计费模块？"
    type: "confirm"
    default: false

  - id: "db_strategy"
    message: "数据层策略？"
    type: "select"
    options:
      - value: "supabase"
        label: "Supabase（推荐）"
      - value: "drizzle"
        label: "Drizzle + PostgreSQL"

  - id: "enable_gtm"
    message: "是否需要 GTM（Go-To-Market）配套？建议安装 Twenty CRM"
    type: "confirm"
    default: false
    # 对应原始需求里的 GTM 可选项

# 条件文件：根据 prompts 的答案决定是否包含某些文件
conditional_includes:
  - condition: "enable_billing === true"
    include:
      - "apps/web/src/features/billing/**"
      - "skills/billing/**"
      - "openspec/changes/billing-initial.md"

  - condition: "db_strategy === 'drizzle'"
    include: ["apps/web/src/infra/db/drizzle/**"]
    exclude: ["apps/web/src/infra/db/supabase/**"]

  - condition: "enable_gtm === true"
    include: ["apps/gtm/**"]  # Twenty CRM 集成配置

# _shared 依赖声明
shared_blocks:
  - "ai-config/claude"
  - "ai-config/copilot"
  - "ai-config/codex"
  - "ci/github-actions"
  - "ci/dokploy"
  - "tooling/typescript"
  - "tooling/eslint"
  - "tooling/lefthook"
  - "tooling/dependency-cruiser"
  - "openspec"
  - "docker"
  - "docs-template"
  - "skills-template"

# 模板变量（在文件内容里用 {{variable}} 占位）
variables:
  - "project_name"      # 来自 prompts
  - "project_name_pascal"  # scaffold 引擎自动派生
  - "forge_version"     # 来自 forge 仓库版本
  - "created_at"        # 创建时间

CLAUDE.md 的渲染设计
CLAUDE.md 是最重要的文件，不能是静态的，需要根据模板类型和项目配置渲染。
_shared/ai-config/claude/CLAUDE.md 是基础模板：
markdown# {{project_name}} — AI Coding 指南
> 由 forge v{{forge_version}} 生成于 {{created_at}}
> 本文件是 AI Agent 在此项目工作的唯一权威指南

## 项目概览
- **类型**：{{template_type}}
- **技术栈**：{{tech_stack}}
- **数据层**：{{db_strategy}}

## 任务开始前（必须执行）

### Step 1：获取相关 Skills
如果 Skills MCP Server 可用：
\```
调用 get_relevant_skills({ task: "<你的任务描述>", files: ["<目标文件>"] })
\```
如果不可用，阅读本文件末尾的「核心约束速查」。

### Step 2：确认 OpenSpec Change 存在
修改任何 feature 前，检查 `openspec/changes/` 是否有对应的 change 文件。
没有则先创建（使用 `openspec/_template.md`），再写代码。

### Step 3：读取相关 Changelog
\```
fetch https://{{docs_url}}/llms.txt
\```

## 目录契约（不可违反）

### `src/core/` — 禁止随意修改
这是架构稳定层。修改前必须：
1. 在 OpenSpec 创建 `type: breaking-change` 的 change
2. 等待人工审批（在 GitHub PR 里标注 `needs-human-review`）

### `src/features/` — AI 的主战场
每个 feature 必须包含：
- `__contract__.ts`：对外接口声明，**第一个写**
- `__tests__/`：测试，**第二个写**
- `index.ts`：实现，**最后写**

Feature 之间不得直接互相引用，只能通过 `core/events` 通信。

### `src/features/_experiments/` — 实验区
- 所有文件必须有 `@experiment` JSDoc 标注
- 不受架构约束，但不得被 `_experiments/` 外的代码引用
- 每个实验有生命周期：创建时在 OpenSpec 记录预期验证时间

### `src/infra/` — 需要人工审批
变更此目录下的任何文件，必须在 PR 里添加 `infra-change` 标签。

## 代码生成规则

### 禁止事项（CI 会拦截）
- Feature 层直接使用 DB 客户端 → 使用 `core/repositories`
- 硬编码 API keys 或 secrets → 使用环境变量
- 跨 feature 直接引用 → 通过 `core/events`

### 必须事项
- 新 feature 必须有 `__contract__.ts`
- 业务组件放 `components/composed/`，不修改 `components/ui/`
- 类型定义优先放 `core/types/`，feature 专有类型放 feature 内

## i18n 约定
默认语言：**英文**（优先开发）
中文占位：使用 `t('key')` 但 value 暂时等于 key，上线前统一补全。
不要在快速迭代中同时维护两种语言的完整翻译。

## 核心约束速查（MCP 不可用时读此节）
{{#each critical_skills}}
### [CRITICAL] {{this.domain}}
{{this.summary}}
→ 详情：`skills/{{this.path}}`
{{/each}}
{{#each critical_skills}} 这段在脚手架引擎生成项目时，从 skills/ 目录里读取所有 priority: critical 的 Skills，自动填充。CLAUDE.md 的核心约束部分永远和 Skills 系统保持同步，不需要手动维护。

各模板的差异矩阵
所有模板共享同一套骨架，差异只在这几个维度：
模板               core/ 结构  features/ 约束  infra/ 内容      特有配置
─────────────────────────────────────────────────────────────────────────
web-nextjs         完整        最严格          Supabase+Auth    middleware.ts
                                                               App Router

api-nestjs         完整        严格            DB+Queue         modules/
                                               (无前端 infra)   guards/
                                                               decorators/

mobile-expo        简化        中等            Supabase         app.json
                   (无 SSR)    (无 SSR 约束)   (无 Server)      eas.json

desktop-tauri      完整        中等            本地 DB+IPC      src-tauri/
                   (前端同 web)                                 tauri.conf.json

desktop-electron   完整        中等            本地 DB+IPC      electron/
                   (前端同 web)                                 forge.config.ts

rust-service       Rust 版     Rust 版         无前端           Cargo.toml
                   (mod 代替   (mod 边界代替    只有 infra/db    clippy.toml
                   目录结构)   feature 目录)
NestJS 模板的特殊约定
NestJS 的 Module 系统天然就是 feature 隔离，不需要手动做 __contract__.ts，但需要对应的约束：
apps/api/src/
├── core/
│   ├── database/         # TypeORM / Drizzle 配置
│   ├── guards/           # 全局 Guard
│   └── interceptors/     # 全局 Interceptor
│
├── modules/              # 对应 web 的 features/
│   ├── auth/
│   │   ├── auth.module.ts       # ← 这就是 __contract__
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── __tests__/
│   └── _experiments/
│
└── main.ts
NestJS 的 *.module.ts 的 exports 数组就是对外契约，CI 检查 exports 里只能导出 Service，不能导出 Repository 或内部实现。

CLI 工具：create-forge
packages/cli/
├── src/
│   ├── index.ts              # CLI 入口
│   ├── commands/
│   │   ├── create.ts         # create 命令
│   │   ├── sync.ts           # 同步 _shared 更新
│   │   └── validate.ts       # 检查项目健康度
│   └── utils/
│       ├── prompt.ts         # 交互式问答（基于 @clack/prompts）
│       ├── scaffold.ts       # 文件渲染（来自 packages/scaffold）
│       └── git.ts            # git init + 初始 commit
└── package.json
使用体验：
bash# 方式 1：CLI
pnpm dlx create-forge

# 交互流程：
◆ 选择模板类型
│  ● Web App (Next.js)
│  ○ API Service (NestJS)
│  ○ Mobile (Expo)
│  ○ Desktop (Tauri)
│  ○ Desktop (Electron)
│  ○ Rust Service
│
◆ 项目名称
│  my-app
│
◆ 数据层策略
│  ● Supabase（推荐）
│  ○ Drizzle + PostgreSQL
│
◆ 是否启用计费模块？
│  No
│
◆ 是否需要 GTM 配套（Twenty CRM）？
│  No
│
◇ 正在生成项目结构...
◇ 渲染 CLAUDE.md（注入 3 条 critical Skills）...
◇ 初始化 Git 仓库...
◇ 执行 pnpm install...
◇ 创建初始 OpenSpec change...
✓ 完成！

  cd my-app
  pnpm dev
  
  文档：https://forge.your-org.com/templates/web-nextjs

# 方式 2：GitHub Template（直接 Use this template）
# 但需要在仓库 Actions 里跑一个 init.yml，
# 做变量替换（project_name 等），替代 CLI 的交互步骤

# 方式 3：脚本拉取
curl -fsSL https://forge.your-org.com/install | bash

模板健康度验证（packages/validator）
forge 的 CI 要持续验证每个模板的健康度，不能让模板"腐烂"：
typescript// packages/validator/src/checks.ts

export const templateChecks = [
  {
    id: "builds-successfully",
    run: async (templatePath: string) => {
      // pnpm install + pnpm build，必须 0 exit code
    }
  },
  {
    id: "all-shared-blocks-present",
    run: async (templatePath: string) => {
      // 读取 template.config.yaml 的 shared_blocks
      // 检查每个块对应的文件都存在
    }
  },
  {
    id: "claude-md-renders-correctly",
    run: async (templatePath: string) => {
      // 渲染 CLAUDE.md，检查所有变量都被替换
      // 检查 critical Skills 注入是否成功
    }
  },
  {
    id: "feature-contracts-exist",
    run: async (templatePath: string) => {
      // 检查每个内置 feature 都有 __contract__.ts
    }
  },
  {
    id: "openspec-changes-exist",
    run: async (templatePath: string) => {
      // 每个内置 feature 在 openspec/changes/ 里有对应记录
    }
  },
  {
    id: "ci-workflows-valid",
    run: async (templatePath: string) => {
      // 用 actionlint 验证 GitHub Actions workflow 语法
    }
  },
  {
    id: "no-placeholder-secrets",
    run: async (templatePath: string) => {
      // secretlint 扫描，确保模板里没有真实 key
    }
  },
]

三层系统在模板里的接驳
forge/templates/web-nextjs/
│
├── [Layer 1] 脚手架层
│   ├── 目录结构（core/features/infra/_experiments）
│   ├── __contract__.ts 约定
│   └── template.config.yaml
│
├── [Layer 2] 约束层（从 _shared/ 复制）
│   ├── .eslintrc.js（含 no-direct-db-in-features 等规则）
│   ├── .dependency-cruiser.cjs（架构守卫）
│   ├── lefthook.yml（本地门禁）
│   └── .github/workflows/（CI 门禁）
│
└── [Layer 3] 知识层（初始化后由项目自己填充）
    ├── skills/（从 _shared/skills-template 初始化）
    ├── openspec/changes/（初始 change 记录模板创建）
    ├── CLAUDE.md（渲染时注入 critical Skills）
    └── apps/docs/（Fumadocs，记录演化历史）

落地优先级建议
不要同时开发所有模板。按这个顺序：
Week 1-2：_shared/ 的骨架 + web-nextjs 模板
  → 这是最高频的模板，用真实业务验证整套设计

Week 3：packages/cli 的基础版（只支持 web-nextjs）
  → 让团队能用 create-forge 创建项目，收集反馈

Week 4：api-nestjs 模板
  → 大多数 web-nextjs 项目都需要配套 API

Week 5+：mobile-expo / desktop-tauri / rust-service
  → 按实际需求排期，不要提前做
最关键的原则：_shared/ 里的每一个配置块，在被第一个模板使用之前，必须在真实项目里验证过。不要在模板里做假设。

现在三层设计、Fumadocs 知识库、Skills 系统、模板库结构都已经完整。你们下一步最实际的执行问题是：_shared/ai-config/claude/CLAUDE.md 的基础模板怎么写才能让不同 Agent（Claude Code / Cursor / Codex）都能正确理解？ 要不要展开这个？You said: 展开这个，另外补充下GitHub copilot，我们团队目前主要使用这个工具展开这个，另外补充下GitHub copilot，我们团队目前主要使用这个工具May 31Claude responded: 好，重要信息。几个快速确认：好，重要信息。几个快速确认：You said: Q: Copilot 具体用哪种模式最多？Q: Copilot 具体用哪种模式最多？
A: Copilot Edits（多文件编辑）为主Q: 团队主力 IDE 是？
A: VS CodeQ: 主要仓库是放在 GitHub 上？
A: GitHub 仓库，可以用 .github/ 目录May 31Claude responded: 好，信息完整了。直接展开。好，信息完整了。直接展开。

AI Coding 配置文件完整设计
先理解四个工具的本质差异
这是整个设计的基础。四个工具读取指令的机制完全不同，不能用同一套思路：
工具              指令文件                    读取时机              上下文窗口
────────────────────────────────────────────────────────────────────────────
GitHub Copilot   .github/copilot-            每次请求自动注入       小（~4k tokens）
                 instructions.md             无需用户触发

Claude Code      CLAUDE.md                   Session 开始时读取     大（支持长文档）
                 （支持层级 import）          + 子目录有子 CLAUDE.md

Cursor           .cursorrules 或             项目打开时加载         中
                 .cursor/rules/*.mdc         支持按文件路径激活

Codex            AGENT.md                    Task 开始前读取        中
                 （OpenAI Codex CLI）        强调 task 粒度
核心矛盾：Copilot 的指令文件 context 窗口最小，但它是你们主力工具。这意味着 Copilot 的配置文件必须是极度精炼的约束清单，不能是叙述性文档。Claude Code 可以接受长文档，Copilot 不行。

_shared/ai-config/ 完整目录
_shared/ai-config/
├── copilot/
│   ├── copilot-instructions.md        # 主文件（精炼版，~500 tokens）
│   └── _partials/                     # 按领域拆分的片段（按需 append）
│       ├── auth.md
│       ├── billing.md
│       ├── database.md
│       └── testing.md
│
├── claude/
│   ├── CLAUDE.md                      # 根级（项目总览 + 规则索引）
│   ├── CLAUDE.core.md                 # core/ 目录专属规则
│   ├── CLAUDE.features.md             # features/ 目录专属规则
│   └── CLAUDE.infra.md                # infra/ 目录专属规则
│
├── cursor/
│   └── rules/
│       ├── 000-project-overview.mdc
│       ├── 100-architecture.mdc
│       ├── 200-features.mdc           # 按文件路径激活
│       ├── 300-testing.mdc
│       └── 400-anti-patterns.mdc
│
└── codex/
    └── AGENT.md

一、GitHub Copilot：.github/copilot-instructions.md
Copilot Edits 模式下，这个文件是每次请求都注入的系统提示前缀。原则只有一个：每个字都必须值得占用 token。
markdown# {{project_name}} Copilot Instructions

## Stack
- Next.js 14 App Router · TypeScript strict · Supabase · shadcn/ui · Tailwind
- Monorepo: Turborepo · pnpm workspaces
- Test: Vitest (unit) · Playwright (e2e)

## Directory Contract
src/core/       → READ ONLY. Changes need human approval + OpenSpec entry.
src/features/   → YOUR WORK AREA. Each feature is self-contained.
src/infra/      → READ ONLY unless PR has infra-change label.
src/features/_experiments/ → Free zone. No arch rules. No cross-imports.

## Feature Structure (non-negotiable)
Every feature MUST have these files in this order:
1. `__contract__.ts`  — export type FeatureContract = {...}  ← write FIRST
2. `__tests__/`       — tests                               ← write SECOND  
3. `index.ts`         — implementation                      ← write LAST

## Hard Rules (CI will reject violations)
- NEVER import db client in `src/features/`. Use `src/core/repositories/`.
- NEVER import across features directly. Use `src/core/events/`.
- NEVER hardcode secrets. Use `process.env.` with type in `env.d.ts`.
- NEVER modify `src/components/ui/`. Compose in `src/components/composed/`.

## Before Writing Code
1. Check `openspec/changes/` — does a change entry exist for this task?
   If not, create one from `openspec/_template.md` first.
2. Check `skills/` for relevant patterns before inventing solutions.

## i18n
English first. Use `t('key')` placeholder for Chinese. Do NOT translate inline.

## Auth
Session-based via Supabase Auth. NO custom JWT. NO token refresh logic.
Use `useSession()` hook. See `skills/auth/adr:auth-session-over-jwt.skill.md`.

## Testing
- Unit: test behavior, not implementation. Mock at repository boundary.
- Every `__contract__.ts` change needs a corresponding contract test update.
- NO tests that require real DB connection in `src/features/`.
为什么这么短？ Copilot Edits 每次编辑请求都会重新注入这个文件。如果文件过长，真正重要的规则会被稀释，模型会"遗忘"后半段的内容。当前版本约 350 tokens，留给代码上下文足够的空间。
条件追加 _partials/
当项目启用了 billing 模块，scaffold 引擎在生成项目时自动 append 对应 partial：
markdown<!-- _partials/billing.md — 仅在 enable_billing=true 时 append -->

## Billing Rules (CRITICAL)
- Upgrade: proration charged immediately, apply same day.
- Downgrade: proration stored as CREDIT, apply next cycle. NEVER refund directly.
- Trial period changes: NO proration, switch immediately.
- Annual-to-monthly: NOT allowed before expiry.
See: `skills/billing/domain-rule:proration.skill.md`
Scaffold 引擎在渲染时：
typescript// packages/scaffold/src/render-copilot-instructions.ts
async function renderCopilotInstructions(config: ProjectConfig) {
  let content = await readTemplate('ai-config/copilot/copilot-instructions.md', config)
  
  // 条件追加 partials
  if (config.enable_billing) {
    content += '\n' + await readPartial('billing.md')
  }
  if (config.db_strategy === 'drizzle') {
    content += '\n' + await readPartial('database.md')
  }
  
  // 从 skills/ 注入 critical skills 摘要
  const criticalSkills = await loadSkillsByPriority('critical')
  content += renderCriticalSkillsSummary(criticalSkills)
  
  // 最终 token 检查：超过 600 tokens 报警
  const tokens = estimateTokens(content)
  if (tokens > 600) {
    console.warn(`⚠️  copilot-instructions.md is ${tokens} tokens, consider trimming`)
  }
  
  return content
}

二、Claude Code：层级 CLAUDE.md 系统
Claude Code 支持子目录 CLAUDE.md，这是它最强大的特性，也是最容易被浪费的特性。正确的设计是：根级 CLAUDE.md 做索引，子目录 CLAUDE.md 做深度规则。
根级 CLAUDE.md
markdown# {{project_name}}
> forge v{{forge_version}} · Created {{created_at}}

## 读取顺序（Session 开始时必须按序执行）

### Step 1：获取任务相关 Skills
\```bash
# 如果 Skills MCP Server 已配置（见 .mcp.json）
mcp: get_relevant_skills({ task: "<描述>", files: ["<目标文件路径>"] })
\```
MCP 不可用时，跳到本文件末尾「核心约束速查」。

### Step 2：确认 OpenSpec Change
修改任何 feature 前检查 `openspec/changes/` 是否有对应记录。
无则先创建：复制 `openspec/_template.md`，至少填写 `intent` 字段。

### Step 3：定位子目录规则
根据工作目录，读取对应的 CLAUDE.md：
- `src/core/`    → 见 `src/core/CLAUDE.md`
- `src/features/`→ 见 `src/features/CLAUDE.md`
- `src/infra/`   → 见 `src/infra/CLAUDE.md`

## 项目概览
- **模板**：{{template_type}} · **版本**：{{project_version}}
- **数据层**：{{db_strategy}}
- **文档**：{{docs_url}}
- **Changelog**：`openspec/changes/` → 同步至 `apps/docs/content/changelog/`

## 全局禁止事项
这些规则 CI 会物理拦截，违反无法合并：

| 禁止 | 原因 | 替代方案 |
|------|------|----------|
| Feature 层 import DB 客户端 | 破坏分层 | `core/repositories/` |
| Feature 间直接 import | 产生耦合 | `core/events/` |
| 修改 `components/ui/` | shadcn 组件不能定制 | `components/composed/` |
| hardcode secrets | 安全风险 | `process.env` + `env.d.ts` |
| 自行实现 JWT | ADR 决策 | Supabase Auth session |

## 工作流约定
\```
发现需求
  → openspec/changes/ 创建 change（intent 字段描述意图）
  → features/[name]/__contract__.ts（声明对外接口）
  → features/[name]/__tests__/（先写测试）
  → features/[name]/index.ts（最后实现）
  → PR → CI 验证 → 人工确认 → 合并
\```

## 核心约束速查（MCP 不可用时）
{{#each critical_skills}}
**[{{this.domain}}]** {{this.summary}}
`skills/{{this.path}}`
{{/each}}

## 扩展阅读
- 架构决策：`skills/architecture/`
- 反模式清单：`skills/**/*anti-pattern*`
- 项目演化历史：`openspec/changes/`
子目录 src/features/CLAUDE.md
markdown# Features 层规则
> 本文件仅在操作 `src/features/` 时生效

## 你在这里能做什么
这是 AI 的主战场。可以自由创建、修改、删除 feature。
但每个 feature 必须是**完全自包含的**。

## Feature 创建清单（按序执行）

\```
□ 1. 创建目录 src/features/[feature-name]/
□ 2. 写 __contract__.ts
      必须包含：export type FeatureContract = { ... }
      声明所有对外暴露的函数签名和类型
□ 3. 写 __tests__/[feature-name].test.ts
      测试覆盖 __contract__.ts 里的每一个公开接口
      使用 mock，不依赖真实 DB
□ 4. 写 index.ts
      只导出 __contract__.ts 里声明的内容
      不导出内部实现细节
□ 5. 在 openspec/changes/ 确认有对应 change 文件
\```

## Feature 删除清单
\```
□ 1. 在 openspec/changes/ 创建 type: deprecation 的 change
□ 2. 删除整个 features/[feature-name]/ 目录
□ 3. 搜索并清理所有引用：grep -r "from.*features/[name]" src/
□ 4. 运行 pnpm type-check 确认无残留引用
\```

## `_experiments/` 特殊规则
- 文件必须有 `/** @experiment expires: YYYY-MM-DD */` 注释
- 可以直接使用 DB 客户端（豁免架构约束）
- **不得被 `_experiments/` 外的任何文件 import**
- 到期日由 openspec/changes/ 里的 research preview change 决定

## 跨 Feature 通信
\```typescript
// ❌ 错误
import { userService } from '../user-profile'

// ✅ 正确
import { eventBus } from '@/core/events'
eventBus.emit('user:profile-updated', payload)
\```

## 测试边界
- Unit test：mock `core/repositories/`，不 mock `core/events/`
- 测试文件命名：`[feature-name].test.ts`（行为测试）
                `[feature-name].contract.test.ts`（契约测试）
子目录 src/core/CLAUDE.md
markdown# Core 层规则
> ⚠️ 高度敏感区域。错误修改会影响所有 features。

## 默认行为：只读

除非满足以下所有条件，否则不得修改此目录：
1. `openspec/changes/` 存在 `type: breaking-change` 的对应记录
2. PR 包含 `needs-human-review` 标签
3. 该 change 的 `status` 已被人工更新为 `review`（不是 `draft`）

## 如果你认为需要修改 core/

停止写代码。执行以下步骤：
1. 在 `openspec/changes/` 创建新 change，type: breaking-change
2. 在 intent 字段详细描述为什么需要改 core
3. 在 PR 描述里 @mention 负责人
4. 等待人工决策

## core/ 各子目录职责

\```
repositories/   → 数据访问接口（抽象，不含实现）
                  实现在 infra/db/ 里
events/         → 跨 feature 通信的事件总线
                  新增事件类型需要更新 events/types.ts
types/          → 全局共享类型
                  feature 专有类型不要放这里
utils/          → 纯函数，无副作用，100% 单元测试覆盖
\```
子目录 src/infra/CLAUDE.md
markdown# Infra 层规则
> 基础设施层。变更影响所有应用，需要人工审批。

## 变更流程
任何修改必须：
1. PR 添加 `infra-change` 标签（CI 检查此标签）
2. 描述清楚：变更什么、为什么、影响范围
3. 等待有 infra 权限的成员 review

## 各子目录
\```
db/             → Supabase 客户端 + Drizzle schema
                  migration 文件在 supabase/migrations/，不在这里
auth/           → Supabase Auth 封装
                  不要在这里加业务逻辑，只做纯粹的 client 封装
storage/        → 文件存储客户端
\```

## Supabase Migration 规则
- Migration 文件只能用 supabase CLI 生成，不能手写
- 文件名格式：YYYYMMDDHHMMSS_description.sql
- 每个 migration 必须有对应的 down migration
- RLS 策略必须在 migration 里，不在 Dashboard 手动配置

三、Cursor：.cursor/rules/ 按路径激活
Cursor 的 .mdc 格式支持 globs 字段——只有当编辑的文件匹配 glob 时，这条规则才注入。这是最精准的上下文控制机制。
.cursor/rules/
├── 000-project-overview.mdc      # 始终激活
├── 100-architecture.mdc          # 始终激活
├── 200-features.mdc              # 仅 src/features/** 激活
├── 210-experiments.mdc           # 仅 src/features/_experiments/** 激活
├── 300-core.mdc                  # 仅 src/core/** 激活
├── 400-testing.mdc               # 仅 **/__tests__/** 激活
├── 500-openspec.mdc              # 仅 openspec/changes/** 激活
└── 600-infra.mdc                 # 仅 src/infra/** 激活
markdown<!-- .cursor/rules/000-project-overview.mdc -->
---
description: Project overview, always active
globs: []
alwaysApply: true
---

# {{project_name}}
Stack: Next.js 14 · TypeScript · Supabase · shadcn/ui · Turborepo

Key constraint: `src/core/` is READ ONLY.
Work happens in `src/features/`.
Every feature needs `__contract__.ts` → `__tests__/` → `index.ts` in that order.
markdown<!-- .cursor/rules/200-features.mdc -->
---
description: Rules for working in src/features/
globs: ["src/features/**/*.ts", "src/features/**/*.tsx"]
alwaysApply: false
---

## Active: Features Layer

You are working in the features layer.

MUST have before writing implementation:
- `__contract__.ts` with `export type FeatureContract`
- `__tests__/` directory with at least one test file

NEVER:
- Import db client directly → use `@/core/repositories/`
- Import from other features → use `@/core/events/`
- Export internal implementation details from `index.ts`

Check `skills/` for existing patterns before writing new solutions.
markdown<!-- .cursor/rules/400-testing.mdc -->
---
description: Testing rules, active when editing test files
globs: ["**/__tests__/**", "**/*.test.ts", "**/*.spec.ts"]
alwaysApply: false
---

## Active: Test File

Testing conventions:
- Test BEHAVIOR not implementation
- Mock boundary: `core/repositories/` level (not DB)
- Test file mirrors source: `features/auth/__tests__/auth.test.ts`
- Required: contract test for every public interface in `__contract__.ts`
- FORBIDDEN: `describe('internal function')` — only test public API

Naming: `it('should [behavior] when [condition]')`
markdown<!-- .cursor/rules/500-openspec.mdc -->
---
description: Rules when writing OpenSpec changes
globs: ["openspec/changes/**/*.md"]
alwaysApply: false
---

## Active: OpenSpec Change File

You are writing an OpenSpec change entry.
This is the SOURCE OF TRUTH for this project's evolution.

Required frontmatter fields:
- `id`: kebab-case, include date (e.g., `auth-redesign-2025-01-15`)
- `intent`: ONE sentence — why this change exists (for humans AND AI)
- `ai_context`: what patterns are now deprecated / what is now mandatory
- `status`: start as `draft`
- `type`: feature | bugfix | breaking-change | deprecation

The `ai_context` field is READ BY AI AGENTS in future sessions.
Write it as direct instructions: "After this change, do X. Never do Y."

四、Codex：AGENT.md
Codex CLI 的特点是任务导向——它接收一个明确的 task，执行完退出。指令文件应该围绕"如何完成一个完整任务"而不是"项目是什么"。
markdown# {{project_name}} — Agent Task Guide

## Environment Setup
\```bash
pnpm install          # install deps
pnpm build            # verify build passes
pnpm test             # run unit tests
pnpm type-check       # TypeScript validation
\```

## Before Starting Any Task

1. **Read relevant Skills**
   \```bash
   cat skills/_index.yaml | grep -i "<task-keyword>"
   # Then read the matched skill file
   \```

2. **Check OpenSpec**
   \```bash
   ls openspec/changes/ | grep "<feature-name>"
   # If none exists, create from template first
   cp openspec/_template.md openspec/changes/$(date +%Y-%m-%d)-<task>.md
   \```

3. **Understand the contract**
   \```bash
   cat src/features/<target-feature>/__contract__.ts
   \```

## Task Execution Order
\```
1. Create/update openspec/changes/ entry
2. Write/update __contract__.ts
3. Write/update __tests__/
4. Write implementation
5. Run: pnpm test --filter=<package>
6. Run: pnpm type-check
7. Run: pnpm lint
\```

## Completion Checklist
Before marking task complete, verify:
\```bash
# All must pass:
pnpm turbo type-check lint test --filter='[HEAD]'

# Contract integrity:
node scripts/check-feature-contracts.js

# No secrets:
pnpm dlx secretlint '**/*'
\```

## Hard Constraints
- Do NOT modify `src/core/` without explicit instruction
- Do NOT modify `src/infra/` without `infra-change` label in PR description  
- Do NOT write new DB queries in `src/features/`
- Do NOT install new packages without checking `scripts/check-new-deps.js`

## If You're Stuck
Check in order:
1. `skills/` directory for patterns
2. `openspec/changes/` for historical context
3. `apps/docs/content/` for architecture docs
Do NOT invent solutions that contradict existing Skills or ADRs.

五份文件的关系和分工
文件                      读取者        窗口    核心职责
──────────────────────────────────────────────────────────────────
copilot-instructions.md   Copilot       小      规则清单，每次请求注入
                          Edits         (~350t) 必须极度精炼

CLAUDE.md (根级)          Claude Code   大      索引 + 全局规则 + 工作流
CLAUDE.md (子目录)        Claude Code   大      区域专属深度规则
                                               按目录自动激活

.cursor/rules/*.mdc       Cursor        中      按文件路径精准激活
                                               最细粒度的上下文控制

AGENT.md                  Codex         中      任务导向
                                               强调执行步骤和验收标准

_shared/ 的同步检查机制
这五份文件都来自 _shared/ai-config/，当 forge 更新了 _shared/ 后，已创建的项目需要知道自己落后了多少。
typescript// packages/sync/src/check-ai-config.ts
// 用法：pnpm forge sync:check（在已创建的项目里运行）

async function checkAiConfigDrift() {
  const forgeVersion = await getForgeVersion()  // 从 forge registry 获取
  const localVersion = readLocalForgeVersion()   // 从 .forge-version 文件读取
  
  if (forgeVersion === localVersion) {
    console.log('✓ AI config is up to date')
    return
  }
  
  // 对比每个 AI 配置文件的 diff
  const diffs = await compareAiConfigs(localVersion, forgeVersion)
  
  for (const diff of diffs) {
    console.log(`\n⚠️  ${diff.file} has updates:`)
    console.log(diff.summary)  // 只显示摘要，不是完整 diff
    console.log(`   Run: pnpm forge sync:apply --file=${diff.file}`)
  }
}

一个容易忽视的细节：文件的"自我声明"
每个 AI 配置文件的第一行应该声明它自己的元信息，因为 AI Agent 在读取多个文件时需要知道"我现在读的是哪个文件，它多久没更新了"：
markdown<!-- 每个 AI 配置文件的头部 -->
> forge: {{forge_version}} · updated: {{last_updated}} · project: {{project_name}}
> ⚠️ This file is generated. Manual edits will be overwritten on `pnpm forge sync`.
> To customize, edit `forge.local.yaml` and re-run sync.
forge.local.yaml 是项目的本地覆盖层——允许项目在不修改生成文件的前提下，追加项目特有的规则，pnpm forge sync 时会把本地覆盖和最新模板合并，不会丢失本地定制。

现在四个工具的配置文件设计完整了，并且它们之间有清晰的分工：Copilot 管高频小任务、Claude Code 管深度架构任务、Cursor 管精准文件级编辑、Codex 管完整任务执行。
下一个自然的问题是 forge.local.yaml 的设计——它决定了团队如何在不破坏 _shared/ 同步机制的前提下做项目级定制。要继续这个，还是转向讨论整个 forge 仓库的 CI 和发版策略？2 / 2You said: 深入展开说明下「Copilot 管高频小任务、Claude Code 管深度架构任务、Cursor 管精准文件级编辑、Codex 管完整任务执行」，为什么这么区分？跟它们各自的设计架构和机制有关吗？对AI Coding新手来说，如何更好的选择它们？深入展开说明下「Copilot 管高频小任务、Claude Code 管深度架构任务、Cursor 管精准文件级编辑、Codex 管完整任务执行」，为什么这么区分？跟它们各自的设计架构和机制有关吗？对AI Coding新手来说，如何更好的选择它们？forge.local.yaml 的设计9:30 AMClaude responded: 两个问题方向不同，分开深入。先回答第一个，因为它影响第二个的设计。两个问题方向不同，分开深入。先回答第一个，因为它影响第二个的设计。

一、四个工具的本质区别
从架构机制理解，不是从功能列表理解
这四个工具的差异不是"功能多少"的问题，而是它们在软件开发流程中介入的位置和深度根本不同。理解这个，选择就自然清晰了。

一个统一的分析框架：四个维度
维度 1：触发方式    → 谁发起这次 AI 交互？
维度 2：上下文范围  → AI 能"看到"多少代码？
维度 3：输出粒度    → AI 的输出是什么单位？
维度 4：人的介入度  → 人在循环里扮演什么角色？
用这四个维度分析四个工具：
工具          触发方式        上下文范围      输出粒度        人的介入度
────────────────────────────────────────────────────────────────────────
Copilot       被动（光标位置  当前文件        单行 / 单块     极高
              触发补全）      + 少量相邻文件  补全            (接受/拒绝每行)
              主动（Chat/
              Edits 提问）

Claude Code   主动（对话）    整个仓库        完整功能        中
                              + 可执行命令    （多文件修改）   (Review 结果)

Cursor        主动（选中      选中范围        文件级别        高
              + 指令）        + 相关文件      的精准修改      (逐文件确认)

Codex         主动（任务描述  整个仓库        完整任务        低
              一次性输入）    + 可执行命令    （从头到尾）     (只看结果)

逐个解剖架构机制
GitHub Copilot：编辑器原生的预测引擎
Copilot 的核心设计哲学是零摩擦——它不应该打断你的思维流，而是顺着你的思维流补全。
你的工作流：
  打开文件 → 开始打字 → Copilot 预测下一行 → 接受/拒绝 → 继续打字

Copilot 的"看法"：
  当前光标位置的 ±N 行
  + 当前文件
  + 同一目录下的少量相邻文件（启发式选择）
  + copilot-instructions.md（系统提示）

它不知道的：
  整个仓库的架构
  你上一个 session 做了什么
  这次修改的"目的"是什么
Copilot Edits 模式（你们主要用的）在这个基础上做了扩展——可以指定多个文件，但本质仍然是"给定文件范围内的精准编辑"，不是自主探索仓库。
机制决定边界：Copilot 适合的任务是"我知道要改哪里，我知道大致怎么改，需要 AI 帮我快速写出来"。它不适合"帮我想清楚应该怎么做"。

Claude Code：有仓库级理解的对话伙伴
Claude Code 的核心设计哲学是深度理解优先——它可以在回答之前主动读取任意文件、执行命令、理解项目结构。
你的工作流：
  描述任务 → Claude Code 自主探索仓库 → 提出方案 → 你确认 → 执行

Claude Code 的"看法"：
  可以读取任意文件（按需）
  可以执行 bash 命令（ls, grep, git log 等）
  可以看到 git 历史
  上下文窗口大（200k tokens）
  CLAUDE.md 层级系统提供架构指导

它的特点：
  会主动问"我需要先读哪些文件？"
  会在执行前解释它的计划
  会在遇到约束（如 CLAUDE.md 里的规则）时主动停下来询问
机制决定边界：Claude Code 适合的任务是"我有一个模糊的目标，需要 AI 帮我把它变成具体的、符合架构的实现"。它是思考伙伴 + 执行者的组合。

Cursor：IDE 深度集成的精准手术刀
Cursor 的核心设计哲学是上下文精准控制——它的 .mdc 规则系统让你可以精确控制"哪种文件用哪套规则"，它的 Composer 模式让你可以在看到 diff 的同时决定接受哪些改动。
你的工作流：
  选中代码 / 指定文件 → 描述修改 → 看到 diff → 逐文件/逐块接受

Cursor 的"看法"：
  你明确指定的文件
  + 自动检测的相关文件（import 关系）
  + 按 glob 激活的 .mdc 规则（精准上下文）
  
它的特点：
  diff 视图是一等公民（你能看清楚每一行改动）
  规则按文件路径激活（不同目录不同规则）
  Composer 支持多文件协调修改
  不会主动"探索"你没指定的文件
机制决定边界：Cursor 适合的任务是"我知道要改哪几个文件，需要 AI 协调这些文件之间的修改，同时我要精确控制每个改动"。它是精准外科手术，而不是探索。

Codex（OpenAI Codex CLI）：全自动任务执行器
Codex 的核心设计哲学是任务完整性——你给一个完整的任务描述，它从头到尾执行，包括写代码、运行测试、修复错误、提交，不需要人在中间介入。
你的工作流：
  写任务描述 → 提交给 Codex → 去做别的事 → 回来看结果

Codex 的"看法"：
  整个仓库（类似 Claude Code）
  可以执行任意命令
  有明确的"任务完成"定义（测试通过 = done）
  
它的特点：
  强调 sandbox 执行（在隔离环境里跑）
  以"任务"而不是"对话"为单位
  适合有明确验收标准的任务（测试通过、lint 通过）
  人不在循环里，直到任务结束
机制决定边界：Codex 适合的任务是"这个任务有明确的完成标准，我可以完全交给 AI，不需要中间介入"。是无人值守的工厂，不是协作。

用一个具体例子感受差异
任务：为 user-profile feature 新增"修改邮箱"功能
用 Copilot Edits：
  你已经想好了：要改 user-profile/index.ts，加一个 updateEmail 函数
  你已经打开了文件，开始写函数签名
  Copilot 帮你补全函数体、参数类型、错误处理
  你接受/拒绝每一行补全
  → 适合：你主导，AI 是打字员

用 Claude Code：
  你说："user-profile 需要支持修改邮箱，帮我评估怎么做最合适"
  Claude Code 先读 __contract__.ts、现有 index.ts、相关 Skills
  然后说："我发现邮箱修改涉及 Supabase Auth，根据 ADR xxx，
           应该通过 auth infra 层而不是直接调 Supabase，
           我的计划是：1... 2... 3...，你确认吗？"
  你确认后它执行，遇到问题再来问你
  → 适合：目标清晰但实现路径不确定

用 Cursor：
  你打开 user-profile/__contract__.ts 和 user-profile/index.ts
  你说："在这两个文件里加 updateEmail，类型安全，错误处理完整"
  Cursor 给你看 diff，你逐行确认
  → 适合：你知道改哪里，需要精准控制每行改动

用 Codex：
  你写任务："为 user-profile feature 添加 updateEmail 功能，
             接口定义在 __contract__.ts，实现在 index.ts，
             需要有对应测试且 pnpm test 通过"
  提交，去开会，回来看 PR
  → 适合：任务定义清晰，有明确验收标准，不想中间介入

给 AI Coding 新手的选择框架
不要问"哪个工具更好"，要问**"我现在处于哪种状态"**：
我现在的状态                              用这个工具
──────────────────────────────────────────────────────
我知道改哪里，知道怎么改，                 Copilot
需要 AI 帮我快速写出来                     （补全/Edits）

我有目标，但不确定最佳实现路径，           Claude Code
需要 AI 帮我想清楚再执行

我知道改哪几个文件，需要精准控制           Cursor
每个改动，不想有意外

任务定义明确，有验收标准，                 Codex
我不想中间介入，直接要结果
新手最常犯的错误：把所有任务都交给 Copilot Chat，然后抱怨 AI 不理解项目架构。这不是 AI 的问题，是工具选错了——Copilot 没有能力理解你的整个仓库。
最佳实践的工具链（你们团队的混合使用场景）：
任务进入
  │
  ├── 目标模糊 / 涉及架构判断
  │   └── Claude Code 先探索和规划
  │         │ 计划确认后
  │         ├── 小范围精准修改 → Cursor 执行
  │         └── 有明确验收标准的子任务 → Codex 执行
  │
  └── 目标清晰 / 局部修改
      ├── 知道改哪个文件 → Copilot Edits
      └── 需要多文件协调 → Cursor Composer

二、forge.local.yaml 设计
理解了工具分工，forge.local.yaml 的设计目标就清晰了：它必须同时服务四个工具，允许项目在不破坏 _shared/ 同步的前提下做定制，且定制内容要在 pnpm forge sync 时被正确合并而不是被覆盖。

核心设计原则
_shared/ai-config/    → forge 官方内容（不可修改，sync 时覆盖）
forge.local.yaml      → 项目定制层（sync 时保留并合并）
生成的配置文件         → 两者合并的结果（不要手动修改）
类似 CSS 的 cascade——local 总是覆盖 base，但 base 的更新不会抹掉 local。

完整 Schema 设计
yaml# forge.local.yaml
# 放在项目根目录，纳入 Git 版本管理
# pnpm forge sync 时，此文件内容优先级高于 _shared/

# ── 元信息 ────────────────────────────────────────────────
forge:
  base_version: "1.2.0"        # 创建时的 forge 版本，sync 时更新
  template: "web-nextjs"
  last_synced: "2025-01-15"

# ── 项目基本信息（变量替换用）────────────────────────────
project:
  name: "my-app"
  display_name: "My App"
  docs_url: "https://docs.my-app.com"
  db_strategy: "supabase"
  features:
    billing: true
    gtm: false
    i18n: true

# ── 各工具的定制层 ────────────────────────────────────────
ai_config:

  # Copilot 定制
  copilot:
    # 追加到 copilot-instructions.md 末尾的内容
    # 不会覆盖 _shared 的内容，只追加
    append: |
      ## Project-Specific Rules
      - Payment provider: Stripe (not Paddle, not Lemon Squeezy)
      - Primary currency: USD. CNY as secondary.
      - Date format: ISO 8601 everywhere. No locale-specific formats in DB.
    
    # 从 _shared/_partials/ 激活哪些 partial
    # 不在此列表的 partial 不会被 append
    partials:
      - billing
      - database
    
    # token 预算（超出时 forge sync 报警）
    token_budget: 600

  # Claude Code 定制
  claude:
    # 根级 CLAUDE.md 的项目特有追加内容
    root_append: |
      ## Domain Context
      This is a B2B SaaS for construction project management.
      Key domain concepts: Project, Milestone, Contractor, BOM (Bill of Materials).
      Domain rules: see `skills/domain/`.
    
    # 子目录 CLAUDE.md 的额外规则
    # key 是目录路径，value 是追加内容
    directory_rules:
      "src/features/billing":
        append: |
          ## Billing-Specific
          Always check `skills/billing/` before writing any billing logic.
          Proration rules are non-negotiable, see domain-rule:proration.
      "src/features/_experiments":
        append: |
          ## Current Experiments
          - feature-flags-v2: expires 2025-03-01
          - ai-search: expires 2025-02-15
    
    # 覆盖根级 CLAUDE.md 里的某些变量
    variables:
      critical_skills_limit: 5    # 默认注入 3 条 critical skills，这里改为 5

  # Cursor 定制
  cursor:
    # 追加额外的 .mdc 规则文件
    # 文件内容直接写在这里，forge sync 会在 .cursor/rules/ 创建对应文件
    extra_rules:
      - filename: "700-domain.mdc"
        globs: ["src/features/**"]
        always_apply: false
        content: |
          ## Domain Rules Active
          Key entities: Project, Milestone, Contractor, BOM.
          Never use generic names like 'item' or 'record' for domain objects.
          See `skills/domain/` for naming conventions.

  # Codex 定制
  codex:
    # 追加到 AGENT.md 的项目特有内容
    append: |
      ## Project-Specific Completion Criteria
      Beyond the standard checklist, also verify:
      - [ ] No hardcoded currency symbols (use CURRENCY_CONFIG)
      - [ ] Date handling uses dayjs, not native Date
      - [ ] New API endpoints have rate limiting configured

# ── Skills 定制 ───────────────────────────────────────────
skills:
  # 声明项目启用了哪些 skills 目录
  # forge sync 会检查这些目录是否存在，不存在则从 _shared 初始化
  enabled_domains:
    - auth
    - billing
    - database
    - domain          # 项目特有，不来自 _shared
    - architecture
  
  # critical skills 的本地覆盖
  # 某条 skill 在 forge 里是 high，但在本项目里要 critical
  priority_overrides:
    "billing/domain-rule:proration": "critical"
    "domain/domain-rule:bom-calculation": "critical"

# ── CI 定制 ───────────────────────────────────────────────
ci:
  # 额外的 OpenSpec 验证规则
  openspec:
    # 除了默认的 feature 变更必须有 change 外，额外的规则
    required_for_paths:
      - "src/infra/**"        # infra 变更也必须有 change
      - "supabase/migrations/**"  # migration 必须有 change
  
  # 额外的架构守卫规则（追加到 dependency-cruiser 配置）
  arch_rules:
    - name: "billing-不能依赖-experiments"
      severity: "error"
      from: { path: "^src/features/billing" }
      to: { path: "^src/features/_experiments" }

# ── 部署定制 ──────────────────────────────────────────────
deploy:
  provider: "dokploy"
  environments:
    staging:
      branch: "develop"
      auto_deploy: true
    production:
      branch: "main"
      auto_deploy: false    # 生产需要手动触发
      require_approval: true

Sync 引擎的合并逻辑
pnpm forge sync 时，合并算法处理三种情况：
typescript// packages/sync/src/merger.ts

type MergeStrategy =
  | 'overwrite'     // _shared 内容完全覆盖（用于工具链配置）
  | 'append'        // local 内容追加到 _shared 内容之后
  | 'deep-merge'    // 递归合并（用于 YAML 配置）
  | 'local-wins'    // local 存在则保留，否则用 _shared（用于业务文件）

const FILE_STRATEGIES: Record<string, MergeStrategy> = {
  // AI 配置文件：append 模式
  'CLAUDE.md':                          'append',
  '.github/copilot-instructions.md':    'append',
  'AGENT.md':                           'append',
  
  // 工具链配置：overwrite（保持和 forge 同步最重要）
  '.eslintrc.js':                       'overwrite',
  '.dependency-cruiser.cjs':            'overwrite',
  'turbo.json':                         'overwrite',
  
  // CI workflows：overwrite（安全配置不允许本地随意改）
  '.github/workflows/ci-fast.yml':      'overwrite',
  '.github/workflows/ci-full.yml':      'overwrite',
  
  // Cursor rules：local-wins（项目会有自己的规则文件）
  '.cursor/rules/':                     'local-wins',
  
  // 业务文件：local-wins（创建后由项目自己维护）
  'src/':                               'local-wins',
  'openspec/':                          'local-wins',
  'skills/':                            'local-wins',
}

async function sync(forgeLocalConfig: ForgeLocalConfig) {
  const sharedFiles = await getSharedFiles(forgeLocalConfig.forge.template)
  
  for (const file of sharedFiles) {
    const strategy = getStrategy(file.path)
    
    switch (strategy) {
      case 'overwrite':
        await writeFile(file.path, file.sharedContent)
        break
        
      case 'append':
        const localAppend = getLocalAppend(forgeLocalConfig, file.path)
        const rendered = await renderTemplate(file.sharedContent, forgeLocalConfig)
        await writeFile(file.path, rendered + '\n\n' + localAppend)
        break
        
      case 'deep-merge':
        const merged = deepMerge(file.sharedContent, file.localContent)
        await writeFile(file.path, merged)
        break
        
      case 'local-wins':
        if (!await fileExists(file.path)) {
          // 只在文件不存在时从 _shared 初始化
          await writeFile(file.path, file.sharedContent)
        }
        // 已存在则不动
        break
    }
  }
  
  // 更新 forge.local.yaml 里的 base_version 和 last_synced
  await updateSyncMetadata(forgeLocalConfig)
  
  // 生成同步报告
  await generateSyncReport()
}

Sync 的输出报告
pnpm forge sync 完成后输出：
forge sync — v1.2.0 → v1.3.0

✓ Overwritten (security/tooling updates):
  .eslintrc.js                 — added rule: no-floating-promises
  .github/workflows/ci-fast.yml — updated Node version to 22

✓ Appended (your local additions preserved):
  CLAUDE.md                    — _shared updated, local append preserved
  .github/copilot-instructions.md — 347 tokens (budget: 600 ✓)

⚠  Review recommended:
  .dependency-cruiser.cjs      — _shared added new rule: no-barrel-files
                                 Your forge.local.yaml has arch_rules that
                                 may conflict. Review: line 23

✓ Skipped (local-wins, already exist):
  src/                         — 0 files touched
  skills/                      — 0 files touched

◆ New in v1.3.0:
  _shared/ai-config/claude/CLAUDE.infra.md — new file, created
  
Run `pnpm forge validate` to verify everything is consistent.

forge validate：健康度检查
bashpnpm forge validate

Checking forge.local.yaml consistency...
✓ forge.base_version matches installed forge
✓ All enabled skill domains exist in skills/
✓ copilot-instructions.md token count: 347/600
✓ All critical skills injected in CLAUDE.md: 5/5
✓ cursor rules match forge.local.yaml declarations

Checking project health...
✓ All features have __contract__.ts
✓ All features have __tests__/ directory  
⚠  skills/billing/domain-rule:proration.skill.md — expires in 12 days
   Run: pnpm forge skill:verify billing/domain-rule:proration

Overall: healthy (1 warning)

现在整个系统的设计已经完整：三层架构、Fumadocs 知识库、Skills 数据模型、模板库结构、四个 AI 工具的配置文件、forge.local.yaml 定制层和同步机制都有了清晰的设计。
你们下一步最务实的执行路径是：用一个真实业务项目作为试验田，先落地 web-nextjs 模板 + Copilot 配置 + 5 条 critical Skills，验证它确实改变了 Copilot Edits 的输出质量，再投入 forge 的工具链建设。要不要讨论这个最小可行版本（MVP）的具体范围？You said: 补充一个Copilot CLI补充一个Copilot CLI10:03 AMClaude responded: 快速确认一个问题：快速确认一个问题：You said: Q: 你说的 Copilot CLI 指的是哪个？Q: 你说的 Copilot CLI 指的是哪个？
A: 两个都有在用10:03 AMClaude responded: 好，两个都要覆盖，但它们的定位完全不同，分开设计。好，两个都要覆盖，但它们的定位完全不同，分开设计。

Copilot CLI 两个工具的完整设计
先理清两个工具的本质
工具                    本质                      主要场景
────────────────────────────────────────────────────────────────
gh copilot             命令翻译器                 "我想做 X，帮我想出
(GitHub Copilot CLI)   Shell/Git 命令助手         正确的命令"
                       无代码库感知               纯终端操作

Copilot in the CLI     代码库感知的               "在这个仓库里，帮我
(Agent 模式)           自主任务执行器             完成一个完整任务"
                       类似 Claude Code           可读文件、执行命令
这两个工具加入后，完整的分工图变成：
任务类型                              推荐工具
────────────────────────────────────────────────────────────────
Shell/Git 命令不记得怎么写             gh copilot (explain/suggest)
终端操作自动化（脚本、CI 调试）         gh copilot
                                      
代码库内自主完整任务                   Copilot in the CLI (Agent)
有明确验收标准、不想中间介入            或 Codex（两者定位相近）

目标模糊、需要架构判断                 Claude Code
多文件精准编辑、要看 diff              Cursor / Copilot Edits
局部补全、打字加速                     Copilot (Editor)

一、gh copilot：命令翻译器
机制解析
gh copilot explain <command>   → 解释一个命令是什么意思
gh copilot suggest <task>      → 根据描述生成命令

它的上下文：
  - 当前 shell 环境（$PWD、$SHELL 等）
  - 你输入的自然语言描述
  - 没有代码库感知，不读你的文件
  - 没有持久化配置文件（不像 CLAUDE.md）
gh copilot 没有专属的配置文件，这是它和其他工具最大的区别。它的"指令"通过两种方式注入：

shell alias：把常用的 suggest 模式封装成别名
gh 的 ~/.config/gh/ 配置：设置默认行为

在 _shared/ai-config/ 里的位置
_shared/ai-config/
├── copilot-cli/                    # 新增
│   ├── shell-aliases.sh            # 团队统一的 alias 配置
│   ├── shell-aliases.fish          # Fish shell 版本
│   └── suggest-contexts.md        # 给团队成员看的使用指南
shell-aliases.sh
这是 gh copilot 最重要的配置——把它和项目上下文结合起来：
bash# _shared/ai-config/copilot-cli/shell-aliases.sh
# 安装：在 ~/.bashrc 或 ~/.zshrc 里 source 此文件
# 或者：echo "source /path/to/shell-aliases.sh" >> ~/.zshrc

# ── 基础封装 ──────────────────────────────────────────────

# 解释命令（带管道支持）
alias gce='gh copilot explain'

# 建议命令（默认 shell 模式）
alias gcs='gh copilot suggest'

# 建议 Git 命令（最高频）
alias gcsg='gh copilot suggest -t git'

# 建议 Shell 命令
alias gcss='gh copilot suggest -t shell'

# ── 项目工作流封装 ────────────────────────────────────────
# 把 forge 工程规范注入到 suggest 的 prompt 前缀里

# 创建符合 OpenSpec 规范的 commit message
# 用法：forge-commit "feat: add email update to user-profile"
forge-commit() {
  local msg="$1"
  # 检查 openspec/changes/ 是否有对应记录
  if [ -z "$(ls openspec/changes/ 2>/dev/null | grep -v _template)" ]; then
    echo "⚠️  No OpenSpec changes found. Create one first:"
    echo "   cp openspec/_template.md openspec/changes/$(date +%Y-%m-%d)-<feature>.md"
    return 1
  fi
  git commit -m "$msg"
}

# 生成符合团队规范的 branch 名
# 用法：forge-branch "add email update feature"
forge-branch() {
  gh copilot suggest -t git \
    "Create a new branch for: $1. \
     Use format: feat/description or fix/description or chore/description. \
     Use kebab-case. Max 5 words."
}

# 快速查看哪些 feature 没有 OpenSpec change 记录
forge-check-spec() {
  echo "Features without OpenSpec changes:"
  for dir in src/features/*/; do
    feature=$(basename "$dir")
    if [ "$feature" = "_experiments" ]; then continue; fi
    if ! ls openspec/changes/ | grep -q "$feature"; then
      echo "  ⚠️  $feature"
    fi
  done
}

# 调试 CI 失败（最高频场景）
# 用法：forge-debug-ci
forge-debug-ci() {
  local log=$(gh run list --limit 1 --json databaseId -q '.[0].databaseId')
  gh run view "$log" --log-failed | \
    gh copilot explain "This is our CI failure log. Explain what went wrong and suggest fixes:"
}

# 生成 Dokploy 部署命令
forge-deploy() {
  gh copilot suggest -t shell \
    "Deploy to Dokploy. Environment: $1. \
     We use docker compose. Config is in docker/docker-compose.yml."
}
suggest-contexts.md：团队使用规范
markdown# gh copilot 使用规范

## 适用场景（用这个，别去问 ChatGPT）
- Git 操作不确定：`gcsg "如何撤销最近 3 个 commit 但保留改动"`
- Shell 命令忘了：`gcss "找出所有大于 10MB 的文件"`  
- CI 报错看不懂：`forge-debug-ci`
- 正则表达式：`gcss "提取 nginx 日志里的 IP 地址"`

## 不适用场景（换其他工具）
- 需要读代码库文件 → 用 Claude Code 或 Copilot Agent
- 需要修改代码 → 用 Copilot Edits 或 Cursor
- 需要理解架构 → 用 Claude Code

## 团队统一 Alias 安装
\```bash
echo "source $(pwd)/.ai-config/copilot-cli/shell-aliases.sh" >> ~/.zshrc
source ~/.zshrc
\```

## 使用技巧
gh copilot suggest 默认会问你确认再执行，
按 Enter 执行，按 Ctrl+C 取消，按 e 先编辑命令。

二、Copilot in the CLI（Agent 模式）
机制解析
这个工具是 2025 年 GitHub 推出的，定位是终端里的自主 Agent，有代码库感知：
copilot-agent（或通过 gh extension 调用）

上下文：
  - 整个仓库（可读文件）
  - 可执行终端命令
  - 有会话记忆（单次 session 内）
  - 读取 .github/copilot-instructions.md（和编辑器 Copilot 共用）

特点：
  - 在终端里运行，不依赖 VS Code
  - 适合服务器环境、CI 环境、无 GUI 场景
  - 比 gh copilot 有代码库感知
  - 比 Claude Code 更轻量，启动更快Searched the webSearched the web好，现在有了最新的官方信息。Copilot CLI 支持 AGENTS.md 和 Agent Skills 来定义自定义指令和工具访问权限，确保跨模型、跨 session、跨委托任务的行为一致性。自定义 Agent 通过在仓库的 .github/agents/ 目录下放置配置文件来定义，也可以放在 {org}/.github 仓库里作为组织级 Agent，同时在 ~/.copilot/agents/ 下的配置会在所有项目里生效。 GitHub
这意味着 Copilot CLI 的配置体系比我之前描述的更完整，直接按最新机制设计。

Copilot CLI 的配置文件体系（2025 最新）
配置文件                          作用范围        优先级
────────────────────────────────────────────────────────
.github/copilot-instructions.md  仓库级，始终激活  基础规则（编辑器+CLI共用）
.github/agents/*.agent.md        仓库级，按需调用  专项 Agent（CLI+GitHub.com）
~/.copilot/agents/*.agent.md     全局，按需调用    个人 Agent（所有项目）
AGENTS.md                        仓库级，始终激活  CLI 专属的补充指令
关键区别：Agent 文件是你按需调用的"专家"，而指令文件是始终激活的"团队规则"。 GitHub

在 _shared/ai-config/ 里的完整位置
_shared/ai-config/
├── copilot/
│   ├── copilot-instructions.md     # 已有，编辑器+CLI共用
│   └── _partials/                  # 已有
│
├── copilot-cli/                    # 新增，CLI专属
│   ├── AGENTS.md                   # CLI补充指令
│   ├── agents/                     # 自定义 Agent 定义
│   │   ├── forge-architect.agent.md
│   │   ├── forge-reviewer.agent.md
│   │   ├── forge-spec-writer.agent.md
│   │   └── forge-debug.agent.md
│   ├── shell-aliases.sh
│   └── shell-aliases.fish

AGENTS.md：CLI 专属补充指令
这个文件和 copilot-instructions.md 的关系是补充而不是重复。copilot-instructions.md 已经覆盖了代码规则，AGENTS.md 专注于 CLI 环境下的执行行为：
markdown# {{project_name}} — Copilot CLI Instructions

> 补充 `.github/copilot-instructions.md`，专注于 CLI 执行行为。
> forge v{{forge_version}} · {{created_at}}

## CLI 执行权限边界

### 允许自主执行（无需确认）
- `pnpm` 相关命令（install, build, test, lint, type-check）
- `git` 只读命令（status, log, diff, branch -l）
- 读取任意文件
- 在 `src/features/_experiments/` 里创建文件

### 必须暂停确认
- 任何 `git commit` 或 `git push`
- 修改 `src/core/` 或 `src/infra/` 的文件
- 安装新的 npm 依赖（`pnpm add`）
- 修改 `.github/workflows/` 下的任何文件
- 执行数据库 migration

### 禁止执行
- `git push --force`
- 删除 `openspec/changes/` 下的文件
- 修改 `forge.local.yaml`

## 任务开始前的标准流程

\```bash
# 1. 确认 OpenSpec change 存在
ls openspec/changes/ | grep "<feature-keyword>"

# 2. 读取相关 Skills
cat skills/_index.yaml | grep -A3 "<keyword>"

# 3. 检查 feature contract
cat src/features/<target>/__contract__.ts 2>/dev/null || echo "No contract yet"

# 4. 确认测试能跑通（基线）
pnpm turbo test --filter=<package> -- --passWithNoTests
\```

## 任务完成的验收标准

以下全部通过才能标记任务完成：
\```bash
pnpm turbo type-check lint test --filter='[HEAD]'
node scripts/check-feature-contracts.js
pnpm dlx secretlint '**/*'
\```

## Autopilot 模式注意事项

使用 Shift+Tab 进入 Autopilot 模式时：
- 仍然遵守上述权限边界
- 遇到需要确认的操作，**必须停下来等待人工输入**，不得跳过
- 每完成一个重要步骤，输出简短的进度说明

## /delegate 任务委托规范

使用 `/delegate` 把任务交给后台 Coding Agent 时，
任务描述必须包含：
1. 明确的验收标准（测试通过 / 类型检查通过）
2. 禁止修改的文件范围
3. 对应的 OpenSpec change ID

示例：
\```
/delegate 为 user-profile feature 添加 updateEmail 功能。
验收标准：pnpm test 通过，pnpm type-check 通过。
禁止修改：src/core/, src/infra/。
对应 OpenSpec：openspec/changes/2025-01-15-user-profile-email-update.md
\```

.github/agents/：四个专项 Agent
每个自定义 Agent 由一个 .agent.md 扩展名的 Markdown 文件定义，description 字段是必填的，其他字段如 name、tools、model 是可选的。 GitHub
forge-architect.agent.md
处理涉及架构判断的任务，在 CLI 里替代"问 Claude Code 架构问题"的场景：
markdown---
name: Forge Architect
description: >
  处理架构级别的任务：评估新功能的实现方案、
  判断是否需要修改 core 层、分析跨 feature 依赖问题。
  当任务涉及架构决策或需要读取 Skills/ADR 时自动激活。
model: claude-3-7-sonnet
tools:
  - read_file
  - list_directory
  - search_files
  # 不给写文件权限，只分析不执行
---

# Forge Architect Agent

你是这个项目的架构顾问，不是代码执行者。

## 你的职责
1. 读取相关 Skills（`skills/` 目录）和 ADR，理解现有架构决策
2. 分析任务是否涉及 `src/core/` 或 `src/infra/` 的变更
3. 给出实现方案，明确说明：
   - 应该在哪一层实现
   - 需要修改哪些文件
   - 是否需要先创建 OpenSpec change
   - 风险和注意事项

## 你不做的事
- 不直接修改任何文件
- 不执行任何命令
- 不绕过架构约束给出"快捷方案"

## 输出格式
\```
## 方案评估
[分析任务的架构影响]

## 推荐实现路径
1. [步骤]
2. [步骤]

## 需要创建 OpenSpec Change？
[是/否，原因]

## 风险提示
[如有]
\```

读取项目上下文前，先执行：
- `cat skills/_index.yaml`
- `cat openspec/changes/` 最新的 3 个文件
- `cat src/features/<相关 feature>/__contract__.ts`

forge-reviewer.agent.md
PR 前的自动化 review，聚焦于 forge 规范的合规性：
markdown---
name: Forge Reviewer
description: >
  在提交 PR 前执行 forge 规范合规检查。
  检查 feature contracts、OpenSpec 记录、Skills 合规、
  安全问题。当用户说"帮我 review"或"检查一下"时激活。
model: claude-3-7-sonnet
tools:
  - read_file
  - list_directory
  - run_command
---

# Forge Reviewer Agent

你是代码审查专家，专注于 forge 工程规范合规性。
不评价代码风格，只检查工程契约是否被遵守。

## 执行顺序

### Step 1：获取变更范围
\```bash
git diff --name-only HEAD~1
\```

### Step 2：契约完整性检查
对每个变更的 feature 目录：
- `__contract__.ts` 是否存在？
- `__contract__.ts` 是否有 `export type FeatureContract`？
- `__tests__/` 是否存在且非空？

### Step 3：OpenSpec 对应检查
\```bash
node scripts/check-feature-contracts.js
\```
变更的 feature 是否在 `openspec/changes/` 有对应记录？

### Step 4：架构约束检查
\```bash
pnpm exec dependency-cruiser --validate .dependency-cruiser.cjs src/
\```

### Step 5：安全检查
\```bash
pnpm dlx secretlint '**/*.{ts,tsx,js,json}'
\```

### Step 6：新依赖检查
\```bash
git diff HEAD~1 -- package.json | grep '^+' | grep -v '^\+\+\+'
\```
对每个新增依赖，检查其 npm 周下载量和最后发布时间。

## 输出格式
\```
## Forge Review Report

### ✅ 通过
- [检查项]

### ❌ 必须修复（阻塞合并）
- [问题]：[位置]：[如何修复]

### ⚠️ 建议修复（不阻塞）
- [问题]

### 📋 OpenSpec 状态
- Change 文件：[存在/缺失]
- Status：[draft/review/implemented]
\```

forge-spec-writer.agent.md
OpenSpec change 写作助手，确保 ai_context 字段质量：
markdown---
name: Forge Spec Writer
description: >
  帮助创建高质量的 OpenSpec change 文件。
  当用户需要记录新功能、架构变更或弃用决策时激活。
  特别关注 ai_context 字段的质量，这是 AI Agent 的关键输入。
tools:
  - read_file
  - write_file
  - list_directory
---

# Forge Spec Writer Agent

你帮助编写 OpenSpec change 文件。
这些文件是项目演化的 source of truth，也是未来 AI Agent 的上下文来源。

## 工作流

1. 读取 `openspec/_template.md` 和 `openspec/_schema.md`
2. 询问用户：这次变更的核心意图是什么？（一句话）
3. 读取相关 feature 的现有代码，理解上下文
4. 起草 change 文件，重点是 `ai_context` 字段

## `ai_context` 字段的写作标准

这个字段是写给**未来的 AI Agent** 读的，不是写给人读的。

必须包含：
- 这次变更后，哪些模式是**禁止**的（明确列出废弃的方式）
- 这次变更后，哪些模式是**强制**的（新的正确方式）
- 影响哪些文件或目录

格式要求：
- 用祈使句，不用描述句
  - ✅ "使用 useSession() hook，不得直接操作 JWT token"
  - ❌ "这次变更将 JWT 替换为 session-based auth"
- 每条规则独立成行
- 不超过 150 字

## 写完后执行
\```bash
# 验证 frontmatter 格式
node scripts/validate-openspec.js openspec/changes/<新文件>.md
\```

forge-debug.agent.md
CI/本地环境调试专家：
markdown---
name: Forge Debug
description: >
  调试 CI 失败、构建错误、类型错误、测试失败。
  当用户遇到报错、CI 挂了、或命令执行失败时激活。
tools:
  - read_file
  - run_command
  - search_files
---

# Forge Debug Agent

你是 forge 工程环境的调试专家。

## 调试优先级
1. 先理解错误，再执行修复
2. 优先查 Skills（可能已有已知解决方案）
3. 修复要最小化变更，不要顺手"优化"无关代码

## 标准调试流程

### 收集信息
\```bash
# 完整错误信息
pnpm turbo type-check lint test 2>&1 | tail -50

# Git 状态
git diff --stat HEAD~1

# 相关 Skill 检查
grep -r "$(error关键词)" skills/ 2>/dev/null
\```

### CI 失败专项
\```bash
# 获取最新失败的 CI run
gh run list --limit 5 --json status,databaseId,name
gh run view <id> --log-failed
\```

### 修复后验证
\```bash
pnpm turbo type-check lint test --filter='[HEAD]'
\```

## 修复完成后
如果发现了新的坑或解决方案，提示用户：
"这个问题值得记录为 Skill，要创建 `skills/[domain]/pattern:xxx.skill.md` 吗？"

LSP 配置（TypeScript 增强）
Copilot CLI 支持 Language Server Protocol（LSP）提供增强的代码智能，包括跳转定义、悬停信息和诊断。LSP Server 需要单独安装和配置。 GitHub
在 _shared/ai-config/copilot-cli/ 里加入：
json// _shared/ai-config/copilot-cli/lsp-config.json
// 放到项目根目录，Copilot CLI 自动读取
{
  "servers": {
    "typescript": {
      "command": "node",
      "args": [
        "./node_modules/typescript-language-server/lib/cli.mjs",
        "--stdio"
      ],
      "filetypes": ["typescript", "typescriptreact"]
    }
  }
}
这让 Copilot CLI Agent 在读取代码时有真正的类型感知，而不只是文本匹配。

MCP 配置
MCP Server 的配置存储在 ~/.copilot/mcp-config.json 里（可通过 COPILOT_HOME 环境变量修改位置）。 GitHub
在 forge.local.yaml 里新增 MCP 配置段：
yaml# forge.local.yaml 新增段

copilot_cli:
  mcp_servers:
    # Skills MCP Server（本地启动）
    - name: "forge-skills"
      command: "node"
      args: ["./skills-mcp-server/dist/index.js"]
      description: "forge Skills 检索"
    
    # Fumadocs 文档检索
    - name: "forge-docs"
      url: "{{docs_url}}/mcp"
      description: "项目文档和 Changelog 检索"
    
    # GitHub 原生 MCP（PR、Issue 操作）
    - name: "github"
      url: "https://api.githubcopilot.com/mcp/"
      description: "GitHub 操作"
  
  # 安装脚本会把以上配置写入 ~/.copilot/mcp-config.json

更新后的完整分工图
加入 Copilot CLI 两个工具后：
我的状态                              用这个
────────────────────────────────────────────────────────────────
Shell/Git 命令不记得                   gh copilot suggest/explain
终端操作自动化                         gh copilot suggest -t shell

代码库内，需要架构判断                 Copilot CLI + forge-architect agent
代码库内，PR 前检查合规                Copilot CLI + forge-reviewer agent
代码库内，写 OpenSpec change           Copilot CLI + forge-spec-writer agent
CI/构建失败调试                        Copilot CLI + forge-debug agent

代码库内，自主完整任务（有验收标准）    Copilot CLI Autopilot 模式
                                      或 /delegate（后台异步）

目标模糊，需要深度对话                  Claude Code
多文件精准编辑，要看每行 diff           Cursor / Copilot Edits
局部补全，打字加速                      Copilot（编辑器）

_shared/ai-config/ 最终目录
_shared/ai-config/
├── copilot/
│   ├── copilot-instructions.md        # 编辑器 + CLI 共用基础规则
│   └── _partials/
│       ├── auth.md
│       ├── billing.md
│       ├── database.md
│       └── testing.md
│
├── copilot-cli/                       # CLI 专属
│   ├── AGENTS.md                      # CLI 补充指令（权限、验收标准）
│   ├── lsp-config.json                # TypeScript LSP 配置
│   ├── agents/
│   │   ├── forge-architect.agent.md   # 架构评估
│   │   ├── forge-reviewer.agent.md    # PR 前合规检查
│   │   ├── forge-spec-writer.agent.md # OpenSpec 写作
│   │   └── forge-debug.agent.md       # 调试
│   ├── shell-aliases.sh
│   └── shell-aliases.fish
│
├── claude/
│   ├── CLAUDE.md
│   ├── CLAUDE.core.md
│   ├── CLAUDE.features.md
│   └── CLAUDE.infra.md
│
├── cursor/
│   └── rules/
│       └── *.mdc
│
└── codex/
    └── AGENT.md

四个 Agent 的设计核心是"专项"而不是"全能"——forge-architect 只分析不执行，forge-reviewer 只检查不修复，forge-spec-writer 只写 OpenSpec，forge-debug 只调试。这和 Copilot CLI 的设计理念一致：主 Agent 负责高层规划和协调，专项 Agent 作为子 Agent 处理特定任务，避免污染主 Agent 的 context window。 GitHub
下一步建议：这四个 Agent 里，forge-reviewer 是最容易出价值的——把它接入 PR 流程（在 ci-full.yml 里加一步 copilot --agent forge-reviewer 自动运行），让每个 PR 都有一份 forge 合规报告，不依赖人工记住所有规则。要展开这个集成吗？You said: 展开这个集成展开这个集成10:06 AMClaude responded: 先确认一个关键细节：先确认一个关键细节：You said: Q: 你们的 GitHub Actions 用的是哪种 runner？Q: 你们的 GitHub Actions 用的是哪种 runner？
A: 两种都有Q: forge-reviewer 集成进 PR 流程，期望的行为是？
A: 采用你的建议，遵循最佳实践就好，这里我们没有偏好Q: 触发范围？
A: 采用你的建议10:08 AMClaude responded: 好，直接给出完整设计和实现。好，直接给出完整设计和实现。

forge-reviewer PR 集成完整方案
先做一个关键的架构决策
Copilot CLI 在 CI 环境里有一个根本限制：它是交互式工具，不是为无人值守的 CI 设计的。在 GitHub Actions 里直接调用 copilot --agent forge-reviewer 会遇到认证、交互式 prompt、输出格式不稳定等问题。
正确的做法是：用 Anthropic/OpenAI API 直接实现 forge-reviewer 的逻辑，forge-reviewer.agent.md 作为 prompt 的来源，但执行层用 API 调用，不依赖 Copilot CLI 的 runtime。
错误思路：
  GitHub Actions → 调用 copilot CLI → 等待输出
  问题：copilot CLI 不是为 CI 设计的，认证和输出都不稳定

正确思路：
  GitHub Actions → 调用 review 脚本 → 脚本调用 LLM API
                                    → 脚本执行 shell 检查
                → 输出结构化报告
                → 发 PR comment + 设置 check status
forge-reviewer.agent.md 的价值在于：它定义了 review 的逻辑，这个逻辑既可以在 Copilot CLI 里交互式使用，也可以被 CI 脚本读取作为 prompt。一份定义，两种执行方式。

整体架构
PR 创建 / 更新
      │
      ▼
[GitHub Actions: pr-forge-review.yml]
      │
      ├── Job 1: forge-static-review（快速，< 1min）
      │   ├── 契约完整性检查（node scripts）
      │   ├── OpenSpec 对应检查
      │   ├── 架构守卫（dependency-cruiser）
      │   └── 安全检查（secretlint）
      │   输出：structured JSON report
      │
      └── Job 2: forge-ai-review（较慢，依赖 Job 1 结果）
          ├── 读取 Job 1 的报告
          ├── 读取变更的代码 diff
          ├── 调用 LLM API（使用 forge-reviewer.agent.md 作为 system prompt）
          └── 综合输出最终报告
                │
                ├── → PR Comment（可见性）
                └── → GitHub Check（强制性）
                      ├── static violations → FAIL（阻塞合并）
                      └── ai suggestions → WARN（不阻塞）

文件结构
.github/
├── workflows/
│   ├── ci-fast.yml              # 已有
│   ├── ci-full.yml              # 已有
│   └── pr-forge-review.yml      # 新增
│
└── agents/
    └── forge-reviewer.agent.md  # 已有，同时作为 CI 的 prompt 来源

scripts/
├── forge-review/
│   ├── static-check.ts          # 静态检查逻辑
│   ├── ai-review.ts             # AI review 逻辑
│   ├── comment-builder.ts       # PR comment 格式化
│   └── types.ts                 # 共享类型

pr-forge-review.yml
yaml# .github/workflows/pr-forge-review.yml

name: Forge PR Review

on:
  pull_request:
    types: [opened, synchronize, ready_for_review]
    branches: [main, develop]
    # 只 target main 和 develop 的 PR
    # dependabot 和 bot PR 通过下面的 if 过滤

concurrency:
  group: forge-review-${{ github.event.pull_request.number }}
  cancel-in-progress: true
  # 同一个 PR 有新 push 时，取消旧的 review，跑新的

jobs:
  # ── Job 1：静态检查（快速，不依赖 LLM）──────────────────
  forge-static-review:
    name: Forge Static Review
    runs-on: ubuntu-latest

    # 过滤掉 bot PR
    if: |
      github.event.pull_request.draft == false &&
      github.actor != 'dependabot[bot]' &&
      github.actor != 'github-actions[bot]'

    permissions:
      contents: read
      pull-requests: write  # 发 comment 需要
      checks: write         # 创建 check run 需要

    outputs:
      report: ${{ steps.static-check.outputs.report }}
      has-violations: ${{ steps.static-check.outputs.has-violations }}

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # 需要完整 git history 做 diff

      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile

      - name: Run Static Checks
        id: static-check
        run: |
          node --loader ts-node/esm scripts/forge-review/static-check.ts \
            --base ${{ github.event.pull_request.base.sha }} \
            --head ${{ github.event.pull_request.head.sha }} \
            --output-file /tmp/static-report.json

          # 把报告传给下一个 Job
          REPORT=$(cat /tmp/static-report.json | base64 -w 0)
          echo "report=$REPORT" >> $GITHUB_OUTPUT

          # 判断是否有阻塞性问题
          HAS_VIOLATIONS=$(cat /tmp/static-report.json | \
            node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); \
                     console.log(d.violations.length > 0 ? 'true' : 'false')")
          echo "has-violations=$HAS_VIOLATIONS" >> $GITHUB_OUTPUT

      - name: Create Static Check Run
        uses: actions/github-script@v7
        with:
          script: |
            const report = JSON.parse(
              Buffer.from('${{ steps.static-check.outputs.report }}', 'base64').toString()
            )
            
            await github.rest.checks.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              name: 'Forge: Contract & Spec Compliance',
              head_sha: context.payload.pull_request.head.sha,
              status: 'completed',
              conclusion: report.violations.length > 0 ? 'failure' : 'success',
              output: {
                title: report.violations.length > 0
                  ? `${report.violations.length} violation(s) found`
                  : 'All checks passed',
                summary: report.summary,
                annotations: report.annotations  // 直接在代码行上标注
              }
            })

  # ── Job 2：AI Review（依赖静态检查结果）────────────────
  forge-ai-review:
    name: Forge AI Review
    runs-on: ubuntu-latest
    needs: forge-static-review

    # 即使静态检查失败也要跑 AI review（提供完整报告）
    if: always()

    permissions:
      contents: read
      pull-requests: write
      checks: write

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile

      - name: Run AI Review
        id: ai-review
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          PR_NUMBER: ${{ github.event.pull_request.number }}
          BASE_SHA: ${{ github.event.pull_request.base.sha }}
          HEAD_SHA: ${{ github.event.pull_request.head.sha }}
          STATIC_REPORT: ${{ needs.forge-static-review.outputs.report }}
        run: |
          node --loader ts-node/esm scripts/forge-review/ai-review.ts

      - name: Post PR Comment
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs')
            const comment = fs.readFileSync('/tmp/pr-comment.md', 'utf8')
            
            // 查找已有的 forge review comment，更新而不是新建
            const { data: comments } = await github.rest.issues.listComments({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.payload.pull_request.number,
            })
            
            const existingComment = comments.find(c =>
              c.user.login === 'github-actions[bot]' &&
              c.body.includes('<!-- forge-review-comment -->')
            )
            
            if (existingComment) {
              await github.rest.issues.updateComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                comment_id: existingComment.id,
                body: comment,
              })
            } else {
              await github.rest.issues.createComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: context.payload.pull_request.number,
                body: comment,
              })
            }

      - name: Create AI Review Check
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs')
            const aiReport = JSON.parse(fs.readFileSync('/tmp/ai-report.json', 'utf8'))
            
            // AI review 只能是 neutral（warning），不阻塞合并
            // 阻塞由静态检查决定
            await github.rest.checks.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              name: 'Forge: AI Review',
              head_sha: context.payload.pull_request.head.sha,
              status: 'completed',
              conclusion: 'neutral',  // 永远不阻塞
              output: {
                title: `AI Review: ${aiReport.risk_level} risk`,
                summary: aiReport.summary,
              }
            })

scripts/forge-review/static-check.ts
typescript// scripts/forge-review/static-check.ts
// 纯静态检查，不依赖 LLM，结果可以直接作为 CI 阻塞标准

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { parseArgs } from 'util'
import type { StaticReport, Violation, Annotation } from './types'

const { values } = parseArgs({
  options: {
    base: { type: 'string' },
    head: { type: 'string' },
    'output-file': { type: 'string' },
  }
})

const BASE_SHA = values['base']!
const HEAD_SHA = values['head']!
const OUTPUT_FILE = values['output-file']!

// ── 获取变更文件列表 ──────────────────────────────────────

function getChangedFiles(): string[] {
  const output = execSync(
    `git diff --name-only ${BASE_SHA}...${HEAD_SHA}`
  ).toString().trim()
  return output ? output.split('\n') : []
}

function getChangedFeatures(files: string[]): string[] {
  return [...new Set(
    files
      .filter(f => f.startsWith('src/features/') && !f.includes('/_experiments/'))
      .map(f => f.split('/')[2])
      .filter(Boolean)
  )]
}

// ── 检查 1：Feature Contract 完整性 ──────────────────────

function checkFeatureContracts(features: string[]): Violation[] {
  const violations: Violation[] = []

  for (const feature of features) {
    const featureDir = `src/features/${feature}`
    const contractPath = `${featureDir}/__contract__.ts`
    const indexPath = `${featureDir}/index.ts`
    const testsDir = `${featureDir}/__tests__`

    // index.ts 存在但没有 __contract__.ts
    if (fs.existsSync(indexPath) && !fs.existsSync(contractPath)) {
      violations.push({
        type: 'missing-contract',
        severity: 'error',
        file: contractPath,
        message: `Feature '${feature}' has index.ts but missing __contract__.ts`,
        fix: `Create ${contractPath} with: export type FeatureContract = { ... }`,
        annotation: {
          path: indexPath,
          start_line: 1,
          end_line: 1,
          annotation_level: 'failure',
          message: `Missing __contract__.ts for feature '${feature}'`,
          title: 'Missing Feature Contract',
        }
      })
    }

    // __contract__.ts 存在但格式不对
    if (fs.existsSync(contractPath)) {
      const content = fs.readFileSync(contractPath, 'utf-8')
      if (!content.includes('export type FeatureContract')) {
        violations.push({
          type: 'invalid-contract',
          severity: 'error',
          file: contractPath,
          message: `${contractPath} must export 'FeatureContract' type`,
          fix: `Add: export type FeatureContract = { ... }`,
          annotation: {
            path: contractPath,
            start_line: 1,
            end_line: 1,
            annotation_level: 'failure',
            message: "Missing 'export type FeatureContract' in contract file",
            title: 'Invalid Contract Format',
          }
        })
      }
    }

    // 有 index.ts 但没有 __tests__/
    if (fs.existsSync(indexPath) && !fs.existsSync(testsDir)) {
      violations.push({
        type: 'missing-tests',
        severity: 'error',
        file: testsDir,
        message: `Feature '${feature}' has no __tests__/ directory`,
        fix: `Create ${testsDir}/ with at least one test file`,
        annotation: {
          path: indexPath,
          start_line: 1,
          end_line: 1,
          annotation_level: 'failure',
          message: `Missing __tests__/ for feature '${feature}'`,
          title: 'Missing Tests Directory',
        }
      })
    }
  }

  return violations
}

// ── 检查 2：OpenSpec Change 对应 ──────────────────────────

function checkOpenSpecChanges(features: string[]): Violation[] {
  const violations: Violation[] = []
  const changesDir = 'openspec/changes'

  if (!fs.existsSync(changesDir)) return violations

  const existingChanges = fs.readdirSync(changesDir)
    .filter(f => f.endsWith('.md') && f !== '_template.md')

  for (const feature of features) {
    const hasChange = existingChanges.some(f =>
      f.toLowerCase().includes(feature.toLowerCase())
    )

    if (!hasChange) {
      violations.push({
        type: 'missing-openspec',
        severity: 'error',
        file: `openspec/changes/`,
        message: `Feature '${feature}' changed but no OpenSpec entry found`,
        fix: `Create openspec/changes/$(date +%Y-%m-%d)-${feature}.md from template`,
        annotation: null  // 没有具体文件行，不能 annotate
      })
    }
  }

  return violations
}

// ── 检查 3：架构守卫 ──────────────────────────────────────

function checkArchitecture(): Violation[] {
  const violations: Violation[] = []

  try {
    execSync(
      'pnpm exec dependency-cruiser --validate .dependency-cruiser.cjs src/ --output-type json',
      { stdio: 'pipe' }
    )
  } catch (e: any) {
    // dependency-cruiser 把 violations 输出到 stdout，exit code 非 0
    try {
      const output = JSON.parse(e.stdout?.toString() || '{}')
      const archViolations = output.violations || []

      for (const v of archViolations) {
        violations.push({
          type: 'arch-violation',
          severity: v.rule?.severity === 'error' ? 'error' : 'warning',
          file: v.from?.source || '',
          message: `Architecture violation: ${v.rule?.name} — ${v.from?.source} → ${v.to?.source}`,
          fix: `See .dependency-cruiser.cjs rule: ${v.rule?.name}`,
          annotation: v.from?.source ? {
            path: v.from.source,
            start_line: 1,
            end_line: 1,
            annotation_level: v.rule?.severity === 'error' ? 'failure' : 'warning',
            message: `Arch violation: ${v.rule?.name}`,
            title: 'Architecture Constraint Violated',
          } : null
        })
      }
    } catch {
      // dependency-cruiser 不可用，跳过
      console.warn('⚠️  dependency-cruiser check skipped')
    }
  }

  return violations
}

// ── 检查 4：Secret 扫描 ───────────────────────────────────

function checkSecrets(): Violation[] {
  const violations: Violation[] = []

  try {
    execSync('pnpm dlx secretlint "**/*.{ts,tsx,js,json}" --format json', {
      stdio: 'pipe'
    })
  } catch (e: any) {
    try {
      const results = JSON.parse(e.stdout?.toString() || '[]')
      for (const result of results) {
        for (const msg of result.messages || []) {
          violations.push({
            type: 'secret-detected',
            severity: 'error',
            file: result.filePath,
            message: `Potential secret detected: ${msg.message}`,
            fix: 'Move to environment variable',
            annotation: {
              path: result.filePath,
              start_line: msg.line || 1,
              end_line: msg.line || 1,
              annotation_level: 'failure',
              message: msg.message,
              title: 'Potential Secret Detected',
            }
          })
        }
      }
    } catch {
      console.warn('⚠️  secretlint check skipped')
    }
  }

  return violations
}

// ── 检查 5：新增依赖健康度 ────────────────────────────────

async function checkNewDependencies(files: string[]): Promise<Violation[]> {
  const violations: Violation[] = []

  const packageJsonChanged = files.some(f =>
    f === 'package.json' || f.endsWith('/package.json')
  )
  if (!packageJsonChanged) return violations

  try {
    const diff = execSync(
      `git diff ${BASE_SHA}...${HEAD_SHA} -- package.json`
    ).toString()

    const newDeps = diff
      .split('\n')
      .filter(l => l.startsWith('+') && !l.startsWith('+++'))
      .filter(l => l.includes('"') && !l.includes('version'))
      .map(l => {
        const match = l.match(/"([^"@][^"]*)":\s*"/)
        return match?.[1]
      })
      .filter(Boolean) as string[]

    for (const dep of newDeps) {
      try {
        const res = await fetch(`https://registry.npmjs.org/${dep}`)
        const data = await res.json() as any

        const downloadRes = await fetch(
          `https://api.npmjs.org/downloads/point/last-week/${dep}`
        )
        const downloadData = await downloadRes.json() as any
        const weeklyDownloads = downloadData.downloads || 0

        if (weeklyDownloads < 1000) {
          violations.push({
            type: 'suspicious-dependency',
            severity: 'warning',
            file: 'package.json',
            message: `New dependency '${dep}' has low weekly downloads (${weeklyDownloads.toLocaleString()})`,
            fix: 'Verify this package is legitimate before merging',
            annotation: {
              path: 'package.json',
              start_line: 1,
              end_line: 1,
              annotation_level: 'warning',
              message: `Low-traffic package: ${dep} (${weeklyDownloads}/week downloads)`,
              title: 'Suspicious Dependency',
            }
          })
        }
      } catch {
        // npm registry 不可达，跳过
      }
    }
  } catch {
    console.warn('⚠️  Dependency check skipped')
  }

  return violations
}

// ── 主流程 ────────────────────────────────────────────────

async function main() {
  const changedFiles = getChangedFiles()
  const changedFeatures = getChangedFeatures(changedFiles)

  console.log(`Changed files: ${changedFiles.length}`)
  console.log(`Changed features: ${changedFeatures.join(', ') || 'none'}`)

  const allViolations: Violation[] = [
    ...checkFeatureContracts(changedFeatures),
    ...checkOpenSpecChanges(changedFeatures),
    ...checkArchitecture(),
    ...checkSecrets(),
    ...(await checkNewDependencies(changedFiles)),
  ]

  const errors = allViolations.filter(v => v.severity === 'error')
  const warnings = allViolations.filter(v => v.severity === 'warning')
  const annotations = allViolations
    .map(v => v.annotation)
    .filter(Boolean)

  const report: StaticReport = {
    changed_files: changedFiles,
    changed_features: changedFeatures,
    violations: allViolations,
    error_count: errors.length,
    warning_count: warnings.length,
    annotations,
    summary: errors.length > 0
      ? `❌ ${errors.length} error(s), ${warnings.length} warning(s) — merge blocked`
      : warnings.length > 0
        ? `⚠️  ${warnings.length} warning(s) — review recommended`
        : '✅ All static checks passed',
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(report, null, 2))
  console.log(report.summary)

  // errors 导致 exit 1，触发 CI 失败
  if (errors.length > 0) process.exit(1)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})

scripts/forge-review/ai-review.ts
typescript// scripts/forge-review/ai-review.ts
// 调用 LLM API 做深度 review，使用 forge-reviewer.agent.md 作为 system prompt

import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import { execSync } from 'child_process'
import type { AIReport } from './types'

const client = new Anthropic()  // 读取 ANTHROPIC_API_KEY 环境变量

// ── 读取 forge-reviewer 的 system prompt ──────────────────

function loadReviewerPrompt(): string {
  const agentFile = fs.readFileSync(
    '.github/agents/forge-reviewer.agent.md',
    'utf-8'
  )
  // 去掉 frontmatter（--- 之间的部分）
  return agentFile.replace(/^---[\s\S]*?---\n/, '').trim()
}

// ── 收集 review 所需的上下文 ──────────────────────────────

function collectContext(): string {
  const BASE_SHA = process.env.BASE_SHA!
  const HEAD_SHA = process.env.HEAD_SHA!

  const sections: string[] = []

  // 1. 代码 diff（限制大小，避免 context 爆炸）
  try {
    const diff = execSync(
      `git diff ${BASE_SHA}...${HEAD_SHA} -- src/ ` +
      `| head -c 30000`  // 最多 30KB 的 diff
    ).toString()
    sections.push(`## Code Diff\n\`\`\`diff\n${diff}\n\`\`\``)
  } catch { /* skip */ }

  // 2. 静态检查报告（如果存在）
  const staticReport = process.env.STATIC_REPORT
  if (staticReport) {
    try {
      const report = JSON.parse(
        Buffer.from(staticReport, 'base64').toString()
      )
      sections.push(`## Static Check Results\n${report.summary}\n\nViolations:\n${
        report.violations.map((v: any) =>
          `- [${v.severity.toUpperCase()}] ${v.message}`
        ).join('\n')
      }`)
    } catch { /* skip */ }
  }

  // 3. 变更的 __contract__.ts 文件
  try {
    const changedContracts = execSync(
      `git diff --name-only ${BASE_SHA}...${HEAD_SHA} | grep '__contract__.ts'`
    ).toString().trim().split('\n').filter(Boolean)

    for (const contract of changedContracts.slice(0, 3)) {  // 最多 3 个
      if (fs.existsSync(contract)) {
        sections.push(
          `## Contract: ${contract}\n\`\`\`typescript\n${
            fs.readFileSync(contract, 'utf-8')
          }\n\`\`\``
        )
      }
    }
  } catch { /* skip */ }

  // 4. 相关 OpenSpec changes
  try {
    const changedFeatures = execSync(
      `git diff --name-only ${BASE_SHA}...${HEAD_SHA} | ` +
      `grep '^src/features/' | cut -d'/' -f3 | sort -u`
    ).toString().trim().split('\n').filter(Boolean)

    for (const feature of changedFeatures.slice(0, 2)) {
      const specFiles = fs.readdirSync('openspec/changes/')
        .filter(f => f.toLowerCase().includes(feature.toLowerCase()))
        .slice(-1)  // 最新的一个

      for (const specFile of specFiles) {
        const content = fs.readFileSync(`openspec/changes/${specFile}`, 'utf-8')
        sections.push(`## OpenSpec: ${specFile}\n${content}`)
      }
    }
  } catch { /* skip */ }

  // 5. 相关 critical Skills（摘要）
  try {
    if (fs.existsSync('skills/_index.yaml')) {
      const index = fs.readFileSync('skills/_index.yaml', 'utf-8')
      const criticalSkills = index
        .split('\n')
        .filter(l => l.includes('priority: critical'))
        .slice(0, 5)
      if (criticalSkills.length) {
        sections.push(`## Critical Skills (reference)\n${criticalSkills.join('\n')}`)
      }
    }
  } catch { /* skip */ }

  return sections.join('\n\n')
}

// ── 调用 LLM ─────────────────────────────────────────────

async function runAIReview(systemPrompt: string, context: string): Promise<AIReport> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 2048,
    system: systemPrompt + `

## Output Format (STRICT)
Respond with a JSON object only, no markdown:
{
  "risk_level": "low" | "medium" | "high",
  "summary": "one sentence summary",
  "issues": [
    {
      "severity": "error" | "warning" | "suggestion",
      "category": "architecture" | "contract" | "testing" | "security" | "domain-rule" | "openspec",
      "title": "short title",
      "description": "what the issue is",
      "suggestion": "how to fix it",
      "file": "optional file path"
    }
  ],
  "positive_observations": ["what was done well"],
  "skill_recommendations": ["skill IDs that should be consulted for this PR"]
}`,
    messages: [
      {
        role: 'user',
        content: `Please review this PR:\n\n${context}`
      }
    ]
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : '{}'

  try {
    return JSON.parse(text) as AIReport
  } catch {
    // LLM 输出不是合法 JSON，返回降级报告
    return {
      risk_level: 'medium',
      summary: 'AI review completed but output parsing failed',
      issues: [],
      positive_observations: [],
      skill_recommendations: [],
    }
  }
}

// ── 主流程 ────────────────────────────────────────────────

async function main() {
  console.log('Starting AI review...')

  const systemPrompt = loadReviewerPrompt()
  const context = collectContext()
  const aiReport = await runAIReview(systemPrompt, context)

  // 保存报告供后续 step 使用
  fs.writeFileSync('/tmp/ai-report.json', JSON.stringify(aiReport, null, 2))

  // 生成 PR comment
  const comment = buildComment(aiReport)
  fs.writeFileSync('/tmp/pr-comment.md', comment)

  console.log(`AI Review complete: ${aiReport.risk_level} risk`)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})

scripts/forge-review/comment-builder.ts
typescript// PR comment 的格式，这是开发者每天都会看到的东西
// 格式要清晰、可操作，不要冗长

export function buildComment(
  staticReport: StaticReport,
  aiReport: AIReport
): string {
  const timestamp = new Date().toISOString()
  const riskEmoji = { low: '🟢', medium: '🟡', high: '🔴' }[aiReport.risk_level]

  const sections: string[] = []

  // 标记，用于 update-or-create 逻辑
  sections.push('<!-- forge-review-comment -->')

  // 头部
  sections.push(`## ${riskEmoji} Forge Review — ${aiReport.summary}`)
  sections.push(`<sub>Updated: ${timestamp}</sub>`)

  // 静态检查结果（最重要，放最前面）
  if (staticReport.error_count > 0 || staticReport.warning_count > 0) {
    sections.push(`### 🔍 Static Checks`)
    sections.push(staticReport.summary)

    if (staticReport.violations.length > 0) {
      const errors = staticReport.violations.filter(v => v.severity === 'error')
      const warnings = staticReport.violations.filter(v => v.severity === 'warning')

      if (errors.length > 0) {
        sections.push(`\n**Must fix before merging:**`)
        sections.push(errors.map(v =>
          `- ❌ **${v.type}** in \`${v.file}\`: ${v.message}\n  → ${v.fix}`
        ).join('\n'))
      }

      if (warnings.length > 0) {
        sections.push(`\n**Warnings:**`)
        sections.push(warnings.map(v =>
          `- ⚠️ ${v.message}`
        ).join('\n'))
      }
    }
  } else {
    sections.push(`### ✅ Static Checks — All passed`)
  }

  // AI review 问题（按 severity 分组）
  const aiErrors = aiReport.issues.filter(i => i.severity === 'error')
  const aiWarnings = aiReport.issues.filter(i => i.severity === 'warning')
  const aiSuggestions = aiReport.issues.filter(i => i.severity === 'suggestion')

  if (aiReport.issues.length > 0) {
    sections.push(`\n### 🤖 AI Review`)

    if (aiErrors.length > 0) {
      sections.push(`**Issues found:**`)
      sections.push(aiErrors.map(i =>
        `- **${i.title}** (${i.category})\n  ${i.description}\n  → ${i.suggestion}` +
        (i.file ? `\n  📄 \`${i.file}\`` : '')
      ).join('\n\n'))
    }

    if (aiWarnings.length > 0) {
      sections.push(`\n**Worth checking:**`)
      sections.push(aiWarnings.map(i =>
        `- **${i.title}**: ${i.description}`
      ).join('\n'))
    }

    if (aiSuggestions.length > 0) {
      sections.push(`\n<details><summary>💡 Suggestions (${aiSuggestions.length})</summary>\n`)
      sections.push(aiSuggestions.map(i =>
        `- **${i.title}**: ${i.suggestion}`
      ).join('\n'))
      sections.push('</details>')
    }
  }

  // 做得好的地方（保留正向反馈，避免 review 只有负面）
  if (aiReport.positive_observations.length > 0) {
    sections.push(`\n### 👍 Looks Good`)
    sections.push(aiReport.positive_observations.map(o => `- ${o}`).join('\n'))
  }

  // Skills 推荐（如果 AI 觉得有相关 Skills 没被使用）
  if (aiReport.skill_recommendations.length > 0) {
    sections.push(`\n<details><summary>📚 Relevant Skills</summary>\n`)
    sections.push(aiReport.skill_recommendations.map(s =>
      `- \`skills/${s}\``
    ).join('\n'))
    sections.push('</details>')
  }

  return sections.join('\n\n')
}

types.ts
typescript// scripts/forge-review/types.ts

export interface Violation {
  type: string
  severity: 'error' | 'warning'
  file: string
  message: string
  fix: string
  annotation: Annotation | null
}

export interface Annotation {
  path: string
  start_line: number
  end_line: number
  annotation_level: 'failure' | 'warning' | 'notice'
  message: string
  title: string
}

export interface StaticReport {
  changed_files: string[]
  changed_features: string[]
  violations: Violation[]
  error_count: number
  warning_count: number
  annotations: (Annotation | null)[]
  summary: string
}

export interface AIIssue {
  severity: 'error' | 'warning' | 'suggestion'
  category: 'architecture' | 'contract' | 'testing' | 'security' | 'domain-rule' | 'openspec'
  title: string
  description: string
  suggestion: string
  file?: string
}

export interface AIReport {
  risk_level: 'low' | 'medium' | 'high'
  summary: string
  issues: AIIssue[]
  positive_observations: string[]
  skill_recommendations: string[]
}

Branch Protection 配置
在 GitHub 仓库 Settings → Branches → main 里配置：
Required status checks:
  ✅ Forge: Contract & Spec Compliance    ← 静态检查，阻塞合并
  ✅ Forge: AI Review                     ← AI review，不阻塞（neutral）
  ✅ CI Fast (type-check, lint, test)     ← 已有的 CI

Require branches to be up to date: ✅
Require conversation resolution: ✅
核心原则：静态检查决定能不能合并，AI review 决定合不合并的质量。这两件事不能混在一起，否则 AI 的不稳定性会变成工程流程的阻塞点。

Self-hosted Runner 的额外注意事项
你们两种 runner 都有，pr-forge-review.yml 里有一个隐患需要处理：
yaml# 静态检查：用 ubuntu-latest，安全隔离，公开 runner 即可
forge-static-review:
  runs-on: ubuntu-latest

# AI review：需要访问 Anthropic API
# 如果 API 访问在国内服务器，用 self-hosted
forge-ai-review:
  runs-on: ${{ vars.AI_RUNNER || 'ubuntu-latest' }}
  # 通过 repository variable 控制
  # 国内服务器设 AI_RUNNER = self-hosted
  # 国际服务器不设，默认 ubuntu-latest
同时在 self-hosted runner 上需要确认网络能访问 api.anthropic.com，或者通过代理。

PR comment 的实际效果
开发者推送代码后，大约 2-3 分钟会看到：
## 🟡 Forge Review — Auth feature updated, missing OpenSpec entry

Updated: 2025-01-15T10:23:45Z

### 🔍 Static Checks
❌ 1 error, 1 warning — merge blocked

**Must fix before merging:**
- ❌ missing-openspec in `openspec/changes/`: Feature 'auth' changed
  but no OpenSpec entry found
  → Create openspec/changes/2025-01-15-auth.md from template

**Warnings:**
- ⚠️ New dependency 'some-lib' has low weekly downloads (234)

### 🤖 AI Review

**Issues found:**
- **Direct DB access in feature layer** (architecture)
  Found `supabase.from('users')` in `src/features/auth/index.ts`
  → Use `core/repositories/userRepository` instead
  📄 `src/features/auth/index.ts`

**Worth checking:**
- **Test coverage**: New `updateEmail` function has no corresponding test

### 👍 Looks Good
- __contract__.ts properly exports FeatureContract type
- Error handling follows established patterns

📚 Relevant Skills
- `skills/auth/adr:auth-session-over-jwt.skill.md`
- `skills/architecture/anti-pattern:direct-db-in-features.skill.md`

这套集成的核心价值是：不依赖团队成员记住所有规范，每个 PR 都自动得到一份 forge 合规报告。静态检查保证基本工程契约，AI review 补充静态工具发现不了的逻辑问题。
两个可以继续深入的方向：一是把这套 review 逻辑反向用于 forge-spec-writer 的质量保障（OpenSpec change 提交时自动检查 ai_context 字段质量）；二是讨论整个 forge 仓库的发版策略——模板怎么版本化，已有项目如何按需升级。你们更想先做哪个？You said: 深度思考下粘贴文本中的观点、思考和方法论，是否还具有前瞻性（2个月前的内容）？是否可以采纳？有价值的话，如何融合和集成进我们的项目中，注意：上面的回复的内容中，我看到写了大量的代码，控制下，应该优先输出能被AI Coding Agent准确生成的指令Google Workspace CLI
理解了“代理优先 CLI”的底层逻辑后，再回头看 Google Workspace CLI（gws），你会发现它几乎是一个教科书级的样本：它不是在做 “Google API 的命令集合”，而是在做一个由 API 语义驱动、能持续演化的运行时平台——这恰好命中了前面提到的所有趋势：可预测、可自省、可投影、可治理。

📌 小插曲
Addy Osmani 发推介绍了 Google Workspace CLI（gws），称它同时面向人类与 agent，覆盖 Google Drive、Gmail、Calendar 等几乎所有 Workspace API，并内置pasted深度思考下粘贴文本中的观点、思考和方法论，是否还具有前瞻性（2个月前的内容）？是否可以采纳？有价值的话，如何融合和集成进我们的项目中，注意：上面的回复的内容中，我看到写了大量的代码，控制下，应该优先输出能被AI Coding Agent准确生成的指令10:24 AMClaude responded: 这篇文章的核心观点放在今天依然前瞻，甚至可以说它描述的趋势正在加速。让我先做思想层面的审视，再给出融合方案。这篇文章的核心观点放在今天依然前瞻，甚至可以说它描述的趋势正在加速。让我先做思想层面的审视，再给出融合方案。

一、思想审视：哪些观点经得住检验？
真正前瞻的部分
"一份语义，三种投影"是最有价值的核心观点。
gws 的架构解决了一个你们系统里同样存在的问题——你们现在的 forge-reviewer.agent.md 同时被 Copilot CLI 和 CI 脚本消费，这已经是"一份定义，两种执行"的雏形。但你们还没有把这个模式系统化。
gws 的答案：
  Discovery JSON（语义层）
    → CLI 命令（人类交互）
    → MCP tools（Agent 调用）
    → Skills（文档生态）

你们目前的现状：
  forge-reviewer.agent.md（定义层）
    → Copilot CLI 交互式使用      ← 已有
    → CI 脚本调用 LLM API         ← 已有
    → CLAUDE.md 引用              ← 已有
    → MCP Server 检索             ← 计划中
    → Skills 系统                 ← 独立设计中
  
  问题：这五种消费方式是各自独立维护的，没有统一的"语义层"驱动
"能力多投影而非多复制"对你们的警示意义很大。
你们的 _shared/ai-config/ 里，四个工具的配置文件（CLAUDE.md / copilot-instructions.md / .mdc / AGENT.md）目前是各自独立写的，有大量重复的规则内容。随着时间推移，这四份文件会发生漂移——某条规则在 CLAUDE.md 里更新了，copilot-instructions.md 忘了同步。这正是 gws 要解决的"历史偶然性"问题。
需要冷静看待的部分
"Discovery 文档驱动的运行时系统"这个方案对 gws 成立，对你们不能直接套用。
gws 面对的是 Google 提供了机器可读的 Discovery JSON 这个前提。你们的约束层（Layer 2）、Skills 系统（Layer 3）、模板结构（Layer 1）没有一个外部权威的"语义 AST"来源——这个语义层需要你们自己定义和维护。
"身份体系是织构而不是单点文件"——对你们的 forge 系统意义不大，但对你们用 Dokploy 做生产部署的场景值得借鉴。

二、核心融合思路：为 forge 建立语义层
gws 给的最重要启示是：你们缺少一个稳定的"中间语义层"，把规则的定义和规则的消费解耦。
现状的问题：
规则定义 → 直接写进消费文件
  CLAUDE.md 里写规则
  copilot-instructions.md 里重复写规则
  .mdc 里再写一遍
  Skills 里又写一遍
目标状态：
规则定义（forge-rules/）← 唯一 source of truth
    ↓ 投影
    ├── CLAUDE.md（Claude Code 消费格式）
    ├── copilot-instructions.md（Copilot 消费格式，token 受限）
    ├── .cursor/rules/*.mdc（文件路径激活格式）
    ├── AGENTS.md（CLI 执行格式）
    └── Skills（结构化知识格式）

三、融合方案：forge-rules 语义层
核心数据结构
这是整个方案的基础，用 YAML 定义，不写代码，写能让 AI Coding Agent 准确生成的规则结构。
yaml# forge-rules/rules/no-direct-db-in-features.rule.yaml

id: "no-direct-db-in-features"
version: "1.0.0"

# ── 语义定义（人类和机器共读）────────────────────────────
intent: |
  Feature 层不得直接使用数据库客户端。
  数据访问必须通过 core/repositories 抽象层。

rationale: |
  直接在 feature 里操作 DB 会导致：
  1. feature 测试必须依赖真实数据库，测试速度慢且不稳定
  2. 相同查询逻辑散落各处，无法统一优化
  3. AI 迭代时不断复制同一反模式

# ── 适用范围 ──────────────────────────────────────────────
scope:
  paths: ["src/features/**/*.ts", "src/features/**/*.tsx"]
  excludes: ["src/features/_experiments/**"]  # 实验区豁免

# ── 投影配置（决定这条规则如何出现在各消费文件里）────────
projections:

  # 给 Claude Code / CLAUDE.md 的格式
  claude:
    priority: must       # must | should | avoid
    format: |
      - NEVER import db client in `src/features/`.
        Use `src/core/repositories/` instead.

  # 给 Copilot 的格式（极简，token 优先）
  copilot:
    include: true
    token_weight: high   # high = 尽量保留；low = token 紧张时可省略
    format: |
      NEVER import db client in `src/features/`. Use `core/repositories/`.

  # 给 Cursor .mdc 的格式
  cursor:
    globs: ["src/features/**/*.ts"]
    format: |
      Do NOT use db client directly. Use `@/core/repositories/` instead.

  # 给 Skills 系统的格式
  skill:
    kind: "anti-pattern"
    domain: "architecture"
    detection:
      type: "lint-rule"
      rule_id: "no-direct-db-in-features"

  # 给 AGENTS.md / Codex 的格式
  agents:
    category: "forbidden"
    format: |
      Do NOT import db client in src/features/. Use core/repositories/.

# ── 机器执行层（Layer 2 对应）────────────────────────────
enforcement:
  eslint_rule: "no-direct-db-in-features"
  ci_check: true
  pre_commit: true
每条规则一个文件，结构统一。规则的"意图"只写一次，如何呈现给不同工具，由 projections 字段控制。

规则目录结构
forge-rules/
├── _schema.yaml              # rule 文件的 schema 定义（CI 验证用）
├── _index.yaml               # 自动生成的索引
│
├── rules/                    # 规则定义
│   ├── architecture/
│   │   ├── no-direct-db-in-features.rule.yaml
│   │   ├── no-cross-feature-import.rule.yaml
│   │   └── core-is-readonly.rule.yaml
│   ├── security/
│   │   ├── no-hardcoded-secrets.rule.yaml
│   │   └── no-low-traffic-deps.rule.yaml
│   ├── contract/
│   │   ├── feature-must-have-contract.rule.yaml
│   │   └── feature-must-have-tests.rule.yaml
│   └── openspec/
│       └── feature-change-needs-spec.rule.yaml
│
└── projector/                # 投影脚本（由 AI Agent 生成）
    ├── to-claude.ts
    ├── to-copilot.ts
    ├── to-cursor.ts
    ├── to-agents.ts
    └── to-skills.ts

投影脚本的规格说明
这里不写具体代码，而是写让 AI Coding Agent 能准确生成这些脚本的规格。
projector/to-claude.ts 规格
yaml# forge-rules/projector/_specs/to-claude.spec.md
---
purpose: >
  读取 forge-rules/rules/**/*.rule.yaml，
  生成追加到 CLAUDE.md 末尾的「核心约束速查」章节。

inputs:
  - 所有 .rule.yaml 文件
  - 过滤条件：projections.claude 字段存在

output_format: |
  ## 核心约束（自动生成，勿手动修改）
  > 由 forge-rules 投影，更新请运行 pnpm forge rules:sync

  ### Must（违反即 CI fail）
  [priority=must 的规则]

  ### Should（强烈建议）
  [priority=should 的规则]

ordering: "must 在前，should 在后，按 scope.paths 分组"
token_limit: none   # CLAUDE.md 不限 token

generation_command: "pnpm forge rules:sync --target claude"
output_marker:
  start: "<!-- forge-rules:start -->"
  end: "<!-- forge-rules:end -->"
  # 只替换 marker 之间的内容，marker 外的手写内容保留
---
projector/to-copilot.ts 规格
yaml# forge-rules/projector/_specs/to-copilot.spec.md
---
purpose: >
  生成 copilot-instructions.md 里的规则章节，
  严格控制 token 预算。

inputs:
  - 所有 .rule.yaml 文件
  - 过滤条件：projections.copilot.include = true

token_strategy:
  budget: 300              # 规则部分预算 300 tokens
  overflow_action: |
    1. 先丢弃 token_weight=low 的规则
    2. 还超则截断 format 内容到 50 字符以内
    3. 仍超则报错，要求人工裁剪

output_format: |
  ## Rules (auto-generated)
  [token_weight=high 的规则]
  [token_weight=medium 的规则（如有预算）]

generation_command: "pnpm forge rules:sync --target copilot"
---
projector/to-cursor.ts 规格
yaml# forge-rules/projector/_specs/to-cursor.spec.md
---
purpose: >
  为每个独特的 scope.paths glob 组合，
  生成或更新对应的 .cursor/rules/*.mdc 文件。

grouping_logic: |
  相同 globs 的规则合并到同一个 .mdc 文件。
  文件名格式：{三位数字}-{主要 glob 的简化名}.mdc
  例：globs=["src/features/**"] → 200-features.mdc

output_format: |
  ---
  description: Auto-generated from forge-rules
  globs: {globs}
  alwaysApply: false
  ---
  
  ## Active Rules for {glob description}
  {rules 的 cursor.format 内容}

generation_command: "pnpm forge rules:sync --target cursor"
---

pnpm forge rules:sync 的行为规格
这是触发整个投影系统的命令，让 AI Agent 知道它应该生成什么：
markdown# forge-rules/projector/SYNC.md
# 这是 `pnpm forge rules:sync` 的完整行为规格

## 输入
- forge-rules/rules/**/*.rule.yaml（所有规则定义）
- forge.local.yaml（项目配置，决定哪些规则生效）

## 执行步骤

1. 验证所有 .rule.yaml 符合 _schema.yaml
2. 加载所有规则，按 id 去重
3. 对每个 target 执行投影：
   - claude：替换 CLAUDE.md 里 marker 之间的内容
   - copilot：替换 copilot-instructions.md 里 marker 之间的内容
   - cursor：更新 .cursor/rules/ 下的自动生成文件
   - agents：替换 AGENTS.md 里 marker 之间的内容
   - skills：在 skills/ 下生成对应的 anti-pattern skill 文件
4. 检查 token 预算（copilot target）
5. 输出同步报告

## 同步报告格式
Rules synced: {n} rules → {targets}
Token check: copilot-instructions.md {actual}/{budget} tokens
New files: {list}
Updated: {list}
Skipped (local-wins): {list}
Warnings: {list}

## marker 格式（所有目标文件通用）
<!-- forge-rules:start -->
[自动生成内容]
<!-- forge-rules:end -->
marker 外的内容永远不被覆盖。

对现有设计的影响（最小化变动）
融合进来不需要重写之前的内容，只需要：
变动 1：在 _shared/ai-config/ 的各配置文件里加 marker
  CLAUDE.md 里加：
    <!-- forge-rules:start -->（规则自动注入这里）
    <!-- forge-rules:end -->
  
  手写内容（工作流约定、目录契约叙述）保留在 marker 外，不受影响。

变动 2：把现有的硬编码规则迁移为 .rule.yaml
  现在写在 CLAUDE.md 里的"禁止事项表格"
  → 迁移到 forge-rules/rules/ 下的 .rule.yaml 文件
  → 通过 rules:sync 重新生成回来

变动 3：forge.local.yaml 增加一个字段
  rules:
    disabled: []         # 全局禁用某条规则（几乎不用）
    overrides:
      no-direct-db-in-features:
        projections:
          copilot:
            token_weight: low   # 本项目 copilot 空间紧张，降低权重

与 gws 架构对应关系
gws                          forge 对应物
────────────────────────────────────────────────────────
Discovery JSON               forge-rules/*.rule.yaml
（外部权威语义源）            （内部自定义语义源）

RestDescription AST          rules:sync 加载后的内存模型
（稳定中间表示）              （YAML 反序列化结果）

commands.rs（CLI 投影）       to-claude.ts / to-copilot.ts
mcp_server.rs（MCP 投影）    to-cursor.ts / to-agents.ts
generate_skills.rs            to-skills.ts
（Skills 投影）               

executor.rs（统一执行层）     ESLint rules + CI scripts
（所有交互面共享）            （Layer 2 不变）

两阶段解析                   forge.local.yaml 的 overrides
（动态但有治理边界）          （定制但不破坏投影系统）

四、对 AI Coding Agent 的执行指令
基于以上设计，给 Agent 的完整任务描述应该是：
markdown# Task: 实现 forge-rules 语义层

## 你需要生成的文件清单

### Step 1：Schema 和示例规则
- forge-rules/_schema.yaml
  参考：forge-rules/projector/_specs/ 下的所有 spec 文件
  内容：.rule.yaml 的完整 JSON Schema 定义

- forge-rules/rules/architecture/no-direct-db-in-features.rule.yaml
  参考：上方的示例 YAML 结构
  
- forge-rules/rules/contract/feature-must-have-contract.rule.yaml
- forge-rules/rules/security/no-hardcoded-secrets.rule.yaml
  （从现有 copilot-instructions.md 的 Hard Rules 提取并转换格式）

### Step 2：投影脚本
生成 forge-rules/projector/to-{target}.ts，共 5 个文件。
每个脚本的行为规格在对应的 _specs/*.spec.md 里，严格按规格实现。

### Step 3：更新配置文件，加入 marker
在以下文件里找到规则相关段落，替换为 marker：
- _shared/ai-config/claude/CLAUDE.md
- _shared/ai-config/copilot/copilot-instructions.md
- _shared/ai-config/copilot-cli/AGENTS.md

### Step 4：在 package.json 里注册命令
"forge:rules:sync": "tsx forge-rules/projector/sync.ts"
"forge:rules:validate": "tsx forge-rules/projector/validate.ts"

## 验收标准
- pnpm forge:rules:validate 对所有 .rule.yaml 验证通过
- pnpm forge:rules:sync 运行后，CLAUDE.md 的 marker 之间有内容
- copilot-instructions.md 的规则部分 token 数 < 300
- 所有已有的手写内容（marker 外）保持不变

gws 的最大贡献是给了一个名字和验证案例，让你们原本分散的直觉——"规则不应该复制三份"——变成了一个有架构依据的设计决策。融合的边界很清晰：语义层（forge-rules）是新增的，Layer 1/2/3 和所有已有的文件结构不变，只是它们的"规则内容"从手写变成了从语义层投影生成。
这个设计值不值得现在做？判断标准是：你们的规则是否已经开始在不同工具的配置文件里出现漂移。如果是，现在是引入语义层的最佳时机；如果还没有，可以等第一次"发现漂移"的时候再做。You said: 讨论整个 forge 仓库的 CI 和发版策略，注意：优先使用能被AI Coding Agent准确生成（复原）的指令，而不是大量的代码，这里我们主要目标是讨论架构和设计讨论整个 forge 仓库的 CI 和发版策略，注意：优先使用能被AI Coding Agent准确生成（复原）的指令，而不是大量的代码，这里我们主要目标是讨论架构和设计10:29 AMClaude responded: 好，明确原则后直接进入讨论。先对齐一个认知：好，明确原则后直接进入讨论。先对齐一个认知：
forge 仓库的 CI 和发版，本质上是在管理两类完全不同的"产品"：
产品 A：模板本身（templates/）
  消费者：从模板创建新项目的团队
  关心：模板能不能用、内置的配置对不对

产品 B：forge 工具链（packages/）
  消费者：已创建项目的 sync/validate 命令
  关心：工具链版本兼容性、升级不破坏已有项目
这两类产品的发版节奏、验证方式、破坏性影响完全不同。把它们混在一个发版流程里，是 forge CI 设计的最大陷阱。

一、先讨论版本化策略
forge 有三个独立的版本维度
维度 1：forge 工具链版本（packages/cli、packages/scaffold 等）
  → 语义化版本（SemVer）
  → 影响：create-forge 命令的行为

维度 2：模板版本（templates/web-nextjs 等）
  → 独立版本，每个模板独立
  → 影响：从模板创建的项目的初始状态

维度 3：_shared 版本（_shared/ai-config、_shared/ci 等）
  → 独立版本
  → 影响：已有项目执行 pnpm forge sync 时拉取的内容
关键设计决策：这三个维度必须解耦，不能绑定在一起发版。
原因：_shared/ai-config/claude/CLAUDE.md 里某条规则措辞改了，不应该触发 CLI 工具的版本升级，更不应该要求所有模板重新测试。

版本号的物理载体
forge/
├── package.json                    # CLI 工具链版本（根级）
│
├── templates/
│   ├── web-nextjs/
│   │   └── template.config.yaml   # version: "1.2.0"（模板独立版本）
│   └── api-nestjs/
│       └── template.config.yaml   # version: "0.8.0"
│
└── _shared/
    └── VERSION                    # _shared 的独立版本（纯文本）
                                   # 格式：2025.01.15-3（日期+当日序号）
_shared 用**日历版本（CalVer）**而不是 SemVer，原因：

_shared 的变更大多是配置更新，语义化版本（major/minor/patch）的区分对它没有意义
日历版本让下游项目的 .forge-version 文件一眼可读（"我上次同步是 1 月 15 日"）
不需要维护 changelog 里的版本号递增


二、CI 流水线设计
分层触发，不是单一流水线
触发条件                      运行的 CI
────────────────────────────────────────────────────────────────
任何 push                     lint + type-check（< 1min，快速反馈）

PR to main                    根据变更路径，按需触发：
  _shared/ 有变更           → ci-shared.yml
  templates/ 有变更         → ci-templates.yml（只跑变更的模板）
  packages/ 有变更          → ci-packages.yml
  forge-rules/ 有变更       → ci-rules.yml

merge to main                 全量验证 + 发版准备

定时任务（每周一）             模板健康度巡检
核心原则：路径感知（path-based）触发，避免一次 _shared 的小改动触发所有模板的全量构建。

各 CI Job 的职责规格
ci-shared.yml 规格
markdown触发条件：PR 中 _shared/**/* 有变更

Job 1 - validate-shared-blocks
  目标：每个 shared block 的配置文件格式正确
  检查项：
  - ai-config/ 下所有 .md 文件有 marker（forge-rules:start/end）
  - copilot-instructions.md token 数 < 600
  - CLAUDE.md 层级结构完整（根级 + 子目录文件都存在）
  - lsp-config.json 格式有效

Job 2 - simulate-sync
  目标：模拟一次 pnpm forge sync，验证不会破坏现有项目
  方法：
    取一个"参考项目快照"（git submodule 或 fixtures/）
    对它跑 forge sync，检查 local-wins 文件没有被覆盖
    检查 marker 外的手写内容没有被修改
  
Job 3 - rules-projection-check
  目标：forge-rules 的投影结果和 _shared 里的文件一致
  方法：
    运行 pnpm forge:rules:sync --dry-run
    diff 输出和现有文件，不一致则 fail
    意义：防止有人手动修改了投影结果而没有更新 .rule.yaml
ci-templates.yml 规格
markdown触发条件：PR 中 templates/{name}/** 有变更
策略：只运行有变更的模板的 CI（turborepo filter）

对每个变更的模板执行：

Job 1 - template-build
  进入模板目录，执行 scaffold 生成一个临时项目
  使用 default 配置（不交互）
  验证：pnpm install 成功、pnpm build 成功

Job 2 - template-contract-check
  验证 validator package 的所有 checks 全部通过
  （见之前设计的 packages/validator/src/checks.ts 规格）

Job 3 - template-ai-config-render
  模拟渲染 CLAUDE.md / copilot-instructions.md
  验证所有 {{variable}} 都被替换
  验证 critical skills 被正确注入（≥ 1 条）
  验证 copilot token 数 < 600

Job 4 - template-ci-lint
  用 actionlint 验证模板内置的 workflow 文件语法正确

注意：不跑 e2e，不跑业务测试
模板 CI 只验证"模板本身是否健康"，不验证业务逻辑
ci-packages.yml 规格
markdown触发条件：PR 中 packages/**/* 有变更

Job 1 - unit-test
  pnpm turbo test --filter='[HEAD]'
  覆盖：cli / scaffold / validator / sync

Job 2 - integration-test
  用 packages/scaffold 实际生成一个 web-nextjs 项目
  验证生成的项目结构符合预期（快照测试）

Job 3 - cli-smoke-test
  create-forge --template web-nextjs --name smoke-test --defaults
  验证命令能跑完、目录结构存在
  不验证内容细节（内容由 ci-templates 负责）
ci-rules.yml 规格
markdown触发条件：PR 中 forge-rules/**/* 有变更

Job 1 - schema-validate
  验证所有 .rule.yaml 符合 _schema.yaml

Job 2 - projection-simulate
  运行 pnpm forge:rules:sync --dry-run --all-targets
  输出每个 target 的预期变更
  如果有 target 超出 token 预算，fail

Job 3 - enforcement-check
  对每条 enforcement.eslint_rule 不为空的规则
  验证对应的 ESLint rule 文件存在
  意义：防止规则定义了但执行层没有对应实现

三、发版策略
发版的两个独立通道
通道 A：_shared 发版（高频，自动）
  触发：merge to main，且 _shared/ 有变更
  流程：更新 _shared/VERSION → 推送 git tag → 无需 npm publish
  下游感知：已有项目运行 pnpm forge sync 时拉取新 tag

通道 B：CLI + 模板发版（低频，半自动）
  触发：人工触发 GitHub Actions workflow_dispatch
  需要选择：发版类型（patch/minor/major）+ 哪些模板发版
  流程：更新版本号 → npm publish → 推送 git tag → 生成 release notes
为什么 _shared 不走 npm？
因为 _shared 的消费方式是 pnpm forge sync 拉取 git tag 的内容，不是通过 require() 加载。npm 的版本管理在这里是不必要的复杂度，git tag 已经足够。

_shared 的发版流程规格
markdown# .github/workflows/release-shared.yml 规格

触发：push to main，路径过滤 _shared/**

步骤：

1. 读取 _shared/VERSION 的当前值
2. 生成新版本号：$(date +%Y.%m.%d)-$(当日已发版次数+1)
   示例：2025.01.15-1，2025.01.15-2
3. 写入 _shared/VERSION
4. git commit "chore: bump _shared to {version}"
5. git tag "shared-{version}"
6. git push + git push --tags

下游项目的感知方式：
  forge.local.yaml 里的 forge.base_version 记录上次同步的版本
  pnpm forge sync 拉取最新 tag，和 base_version 做 diff
  输出：哪些 _shared 文件有变更，变更摘要是什么

CLI 工具链的发版流程规格
markdown# .github/workflows/release-cli.yml 规格

触发：workflow_dispatch（手动）
输入参数：
  - bump_type: patch | minor | major
  - templates_to_release: 多选（web-nextjs, api-nestjs, ...）
  - release_notes: 文本输入

步骤：

1. 全量验证（等同于 merge 时的全量 CI）

2. 版本号更新
   - 根 package.json 按 bump_type 更新
   - 被选中的 template.config.yaml 同步更新

3. Changelog 生成
   - 从上次 release tag 到现在的 commit，过滤出有意义的变更
   - 分类：breaking changes / new features / fixes
   - 特别标注：涉及 AI 配置文件的变更（因为下游需要关注）

4. npm publish（packages/cli）
   注：templates 不 publish 到 npm，通过 git 分发

5. 推送 git tag
   格式：v{version}（CLI）、template-{name}-v{version}（模板）

6. 创建 GitHub Release
   内容：自动生成的 changelog + 手动输入的 release_notes
   特别章节：「对已有项目的影响」（标注是否需要运行 forge sync）

破坏性变更的处理规格
这是发版策略里最容易被忽视的部分，对你们尤其重要——因为已有项目执行 forge sync 时可能拉到破坏性的 _shared 更新。
markdown# 破坏性变更定义（对 forge 来说）

Level 1 - 安全更新（下游无感）
  _shared/ai-config/ 里的措辞调整
  新增 .rule.yaml 规则
  CI workflow 的非破坏性更新
  → 通道 A 自动发版，forge sync 策略：overwrite

Level 2 - 需要关注（下游需要运行 forge sync）
  _shared/ 新增文件（下游项目不存在该文件）
  _shared/ci/ 的结构性变更
  ESLint 规则新增（会让现有代码 fail）
  → 通道 A 发版，但 release notes 标注「建议同步」
  → forge sync 策略：overwrite + 输出 diff 摘要

Level 3 - 破坏性（下游项目需要人工操作）
  目录结构变更（如 _shared/ai-config/ 改名）
  forge.local.yaml schema 变更
  CLI 命令接口变更
  → 通道 B 发版，major bump
  → forge sync 拒绝自动执行，输出迁移指南
  → 提供 forge migrate 命令
Level 3 的处理规格：
markdown# forge migrate 命令规格

当下游项目的 base_version 落后于当前 major 版本时
pnpm forge sync 应该：

1. 检测到 major 版本差距
2. 拒绝执行 sync
3. 输出：
   "This project uses forge _shared v{old}. 
    Current version is v{new} (breaking changes).
    Run: pnpm forge migrate to see what needs to change."

pnpm forge migrate 应该：
1. 列出所有破坏性变更（从 release notes 的结构化数据读取）
2. 对每个变更，说明：影响哪些文件、需要做什么操作
3. 对能自动处理的变更，提供 --apply 选项
4. 对需要人工处理的变更，给出具体指引

四、发版的依赖关系图
代码变更进入 main
       │
       ├── _shared/ 有变更
       │       │
       │       ▼
       │   release-shared.yml
       │   自动发版 _shared tag
       │   下游项目 forge sync 感知
       │
       ├── packages/ 有变更
       │       │
       │       ▼
       │   等待人工触发 release-cli.yml
       │   （packages 变更不自动发版，需要人工确认影响）
       │
       └── templates/ 有变更
               │
               ▼
           随 CLI 一起发版，或独立发版
           （template.config.yaml 的版本独立管理）

五、一个容易忽视的设计：forge 的"自我记录"
forge 仓库本身也需要符合它自己推广的工程规范——它自己也有 Fumadocs 文档站、自己的 OpenSpec changes、自己的 Skills。
这不是递归的玩笑，而是一个真实的工程价值：
forge 自身的 openspec/changes/ 记录了：
  - 每次 _shared 的重要变更的 intent 和 ai_context
  - 这些记录同步到 forge 的 Fumadocs 文档站
  - 下游项目执行 forge sync 时，可以拉取这些记录
    作为"为什么这次 sync 会改变你的 CLAUDE.md"的解释

实际效果：
  开发者运行 pnpm forge sync 后，不只看到"哪些文件变了"
  还能看到"为什么变，这个变更的 intent 是什么"
  → 这让 AI Agent 在下次 session 里能理解"为什么规则变了"

六、给 AI Coding Agent 的整体执行顺序指令
markdown# forge CI 和发版系统的实现顺序

## Phase 1：CI 基础（优先级最高）
目标：让 forge 仓库自身的代码质量有保障

实现 .github/workflows/ 下的 4 个文件：
  ci-shared.yml    → 按 ci-shared.yml 规格章节实现
  ci-templates.yml → 按 ci-templates.yml 规格章节实现
  ci-packages.yml  → 按 ci-packages.yml 规格章节实现
  ci-rules.yml     → 按 ci-rules.yml 规格章节实现

每个 workflow 的 on.paths 过滤是关键，必须正确配置。
参考上方「分层触发」章节的路径映射。

## Phase 2：_shared 自动发版（次优先）
实现 .github/workflows/release-shared.yml
按「_shared 发版流程规格」章节实现
重点：CalVer 格式、git tag 推送

## Phase 3：CLI 手动发版
实现 .github/workflows/release-cli.yml
按「CLI 工具链发版流程规格」章节实现
重点：workflow_dispatch 输入参数、changelog 生成

## Phase 4：forge migrate（破坏性变更支持）
在 packages/cli/src/commands/ 下实现 migrate.ts
按「forge migrate 命令规格」章节实现
这个可以后做，先用 README 的迁移指南替代

## 验收标准
- 修改 _shared/ 里任意文件并推送 PR，ci-shared.yml 触发且仅触发
- 修改 templates/web-nextjs/ 里任意文件，ci-templates.yml 触发
  且 ci-shared.yml 不触发
- merge to main 后，_shared/VERSION 自动更新且有新 git tag
- 手动触发 release-cli.yml，能完整走完流程并创建 GitHub Release

整个 CI 和发版设计的核心思想只有一句话：forge 管理的不是代码，是"工程规范的版本"，所以它的发版策略必须比普通 npm 包更细心地处理下游影响。
现在 forge 的完整架构设计已经覆盖了三层（Layer 1/2/3）、四个 AI 工具配置、模板结构、forge-rules 语义层、CI 和发版策略。下一个自然的问题是：forge 仓库的 MVP 范围——哪些必须在第一个可用版本里，哪些可以后做。要不要讨论这个？

