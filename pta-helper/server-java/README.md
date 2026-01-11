# Java 后端（Spring Boot）

这是一个与插件调用契约等价的 Java 实现（历史上存在 Node 后端 `pta-helper/server/`，现已收敛为兼容转发代理），用于：

- 解决浏览器/插件直连腾讯云混元 API 的 CORS 问题
- 将 `TENCENT_SECRET_ID` / `TENCENT_SECRET_KEY` 放在本地后端环境变量中，避免前端暴露

## 端口与接口

默认监听端口：`3001`（可用环境变量 `PORT` 覆盖）

- `GET /health`
- `GET /status`
- `POST /api/chat`
- `POST /api/batch`

（新增）Web 控制台（本地题库/错题/知识点统计）：

- `GET /console`：打开控制台页面
- `GET /api/console/info`
- `GET /api/console/questions` / `POST /api/console/questions`
- `GET /api/console/questions/{id}` / `PUT /api/console/questions/{id}` / `DELETE /api/console/questions/{id}`
- `POST /api/console/wrong/{questionId}` / `GET /api/console/wrong`
- `GET /api/console/analytics/knowledge`

（新增）Agent 风格端点（不影响插件现有链路）：

- `POST /api/agent/answer`：在后端完成“提示词构造 → 调用模型 → 结构化抽取/校验 → 失败重试”的流水线

插件侧默认调用：`http://localhost:3001/api/chat`（见 `pta-helper/config.js` 和 `pta-helper/hunyuan-service.js`）。

## 运行方式（本地）

1) 准备环境变量（终端里执行，或写入你的 shell profile）

```bash
export TENCENT_SECRET_ID=AKIDyour_secret_id_here
export TENCENT_SECRET_KEY=your_secret_key_here
export TENCENT_REGION=ap-guangzhou
```

2) 启动服务

```bash
cd pta-helper/server-java
./mvnw -q spring-boot:run
```

说明：如果你系统的 Maven 版本较旧（比如 3.6.1），直接 `mvn` 可能会因为插件版本要求而失败；使用 Maven Wrapper（`./mvnw`）最稳。

3) 验证

```bash
curl http://localhost:3001/health
curl http://localhost:3001/status
open http://localhost:3001/console
```

## Web 控制台数据存储

控制台使用本地 JSON 文件落盘（默认目录：`./data`，相对启动进程工作目录）。可用环境变量覆盖：

```bash
export PTA_CONSOLE_DATA_DIR=/abs/path/to/pta-console-data
```

默认会生成：

- `question-bank.json`：题库
- `wrong-stats.json`：错题统计

## 请求格式

### `POST /api/chat`

```json
{
  "message": "1+1等于几？",
  "options": { "Temperature": 0.1, "TopP": 0.9 },
  "region": "ap-guangzhou"
}
```

说明：默认从环境变量读取密钥；也兼容请求体里带 `secretId` / `secretKey`（更不安全，不推荐）。

### `POST /api/batch`

```json
{
  "messages": ["问题1", "问题2"],
  "options": { "Temperature": 0.1 },
  "region": "ap-guangzhou"
}
```

### `POST /api/agent/answer`

```json
{
  "questionText": "题目内容...",
  "questionType": "single_choice",
  "options": [
    {"text": "选项文本1", "value": "A"},
    {"text": "选项文本2", "value": "B"}
  ]
}
```

返回会包含 `answer`（已结构化/规范化后的答案）以及 `raw`（模型原文，方便调试）。

## Spring AI（Agent方向）

如果你希望在“稳定优先”的前提下获得 agent 开发经验（工具/记忆/规划等），建议先阅读：

- pta-helper/server-java/SPRING-AI-GUIDE.md


