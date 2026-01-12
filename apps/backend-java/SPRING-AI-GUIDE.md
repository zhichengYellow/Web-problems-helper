# Spring AI 可行性评估（稳定优先）

目标：在不破坏当前插件调用链（`http://localhost:3001/api/chat`）的前提下，把 Java 后端演进成一个更“agent 化”的服务，并尽量使用 Spring AI 的工程化能力（可测试、可配置、可扩展）。

## 现状（你这个项目的关键约束）

- 插件侧目前“硬依赖”等价后端：`POST /api/chat`（legacy 扩展见 `apps/extension-chrome-legacy/config.js`、`apps/extension-chrome-legacy/hunyuan-service.js`）。
- 腾讯混元 API 认证是 **TC3-HMAC-SHA256 签名**（不是简单 Bearer Token），并且是典型的服务端调用场景。
- 当前 Java 后端已经实现：
  - `/health` `/status` `/api/chat` `/api/batch`
  - TC3 签名 + 直连 `https://hunyuan.tencentcloudapi.com`

结论：
1) “稳定”来自于：插件接口契约不变 + 签名实现可控 + 失败路径清晰。
2) Spring AI 的价值主要在“上层编排”（prompt 模板、对话记忆、工具调用抽象、测试）而不是替代你对腾讯云的签名/HTTP 细节。

## Spring AI 能不能直接用来调腾讯混元？

分两种情况：

### 情况 A：腾讯混元提供 OpenAI 兼容接口（OpenAI-compatible）

如果（你确认）混元提供了完全兼容 OpenAI Chat Completions 的 HTTP 形式，并且鉴权也能用简单 Token/Key 方式，那么可以直接用 Spring AI 的 OpenAI 适配（最省事）。

但就当前你项目的实现来看：混元这里走的是 TC3 签名体系，通常 **不属于** OpenAI 兼容鉴权模式。

### 情况 B：仍然走 TC3 签名（你当前就是这种）

这时 Spring AI **不会**开箱即用帮你搞定签名/鉴权。

可行做法是：
- 继续保留你现在的“腾讯调用层”（签名 + HTTP），确保稳定；
- 在其上做一个“Spring AI 适配层”，把它包装成 Spring AI 能理解的 `ChatModel`/`ChatClient` 的实现。

一句话：
Spring AI 负责“怎么问、怎么规划、怎么记忆、怎么测”；你负责“怎么签名、怎么调腾讯”。

## 稳定优先的推荐落地路径（循序渐进）

### 第 0 阶段（已完成）：后端等价替换

- 目标：插件不改/少改，Java 后端可替代 Node。
- 你现在已经有了。

### 第 1 阶段：把“答题编排”做成确定性流水线（先不依赖 tool-calling）

目的：获得 agent 思维，但不把“稳定性”赌在模型的函数调用能力上。

建议新增一个独立端点（不影响插件现有链路）：
- `POST /api/agent/answer`

内部流程示例（强稳定）：
1) 规则/缓存/本地题库命中 → 直接返回
2) 未命中 → 调用 `/api/chat`
3) 对输出做结构化提取与校验（例如：单选必须返回 A/B/C/D；多选返回 `A,C` 这种）
4) 校验失败 → 用“再问一次”的纠错 prompt（固定次数）

这个阶段你就能练到：
- 规划/重试/校验/兜底
- 可观测性（每一步打点）
- 成本控制（缓存 + 限流）

### 第 2 阶段：引入 Spring AI，但只用于“提示词与编排工程化”

这里的稳定做法是：
- Spring AI 做 prompt 模板、上下文注入、memory（可选），以及测试；
- 实际大模型调用仍然走你已有的 `HunyuanProxyService.chat()`。

你会得到：
- Prompt 结构更清晰（模板化/参数化）
- 单测更容易写（把模型调用抽象成接口）

### 第 3 阶段：实现 Spring AI 的自定义 Model 适配（深入但可控）

把“混元调用”封装成一个 Spring AI `ChatModel`（或等价接口），对上层暴露统一的 `ChatClient`。

好处：
- 你可以复用 Spring AI 的一堆能力（advisors、memory、tool 抽象）
- 后续想切换模型（比如本地 Ollama / 其他云）更容易

风险：
- Spring AI 版本迭代较快，接口可能变化；需要你固定版本并写集成测试。

### 第 4 阶段：工具调用（Tools）与“真正的 agent”

稳定优先时，建议按两层来做：

1) **确定性工具层**（Java 实现，可靠）
   - `searchArchive(question)`
   - `getBackendHealth()`
   - `batchAsk(messages)`
   - `normalizeChoiceAnswer(raw, options)`

2) **模型决策层**（可变）
   - 让模型“建议”调用什么工具，但最终调用与校验由 Java 负责。

如果你的模型本身对 tool-calling 支持不稳定，也可以用 ReAct 风格文本协议 + 解析，但这类方案要更谨慎，必须配合严格的解析/超时/重试/回退。

## 关于“优先稳定”的版本与工程建议

- **先固定接口**：插件 → Java 后端的 `/api/chat` 契约不要动。
- **先做可观测性**：请求 id、耗时、失败原因、上游返回码。
- **先做成本控制**：缓存（按 prompt hash）、并发/速率限制、超时。
- **再引入 Spring AI**：作为上层编排工具，而不是一上来就重写模型调用。

## 我建议你下一步做什么（最稳、也最能练 agent）

1) 先加一个 `POST /api/agent/answer`（不改插件主链路），实现“规则 → LLM → 结构化提取 → 校验 → 重试”流水线。
2) 等这个稳定后，再把 prompt/记忆/工具抽象逐步迁移到 Spring AI。

如果你愿意，我可以在现有 `server-java` 里直接把第 1 步落地（新增端点 + 答案提取/校验 + 小型缓存），并给你一套后续演进到 Spring AI 的具体改动清单。
