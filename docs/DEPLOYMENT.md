# 本地开发与后续部署方案

## 本地开发（Docker 容器化初始方案）

目标端口：
- Web（Nginx 反代入口）：`http://localhost:3000`
- 后端（Spring Boot）：`http://localhost:8080`
- MySQL：`localhost:3306`（仅本机调试需要）
- Redis：`localhost:6379`（仅本机调试需要）

启动：

```bash
docker compose up --build
```

验证：
- 控制台：`http://localhost:3000/console/`
- API：`http://localhost:3000/api/console/questions`

数据：
- MySQL 表结构初始化脚本在 `docker/mysql/init/001_schema.sql`
- 容器数据通过 `mysql_data` / `redis_data` volume 持久化

## 环境变量（后端）

- `PORT`：默认 8080
- `SPRING_DATASOURCE_URL` / `SPRING_DATASOURCE_USERNAME` / `SPRING_DATASOURCE_PASSWORD`
- `SPRING_REDIS_HOST` / `SPRING_REDIS_PORT`

备注：后端目前使用 MyBatis-Plus（非 JPA），数据库结构由初始化 SQL/迁移脚本管理。

## 后续服务器部署方案（建议）

### 方案 A：仍用 Docker Compose（轻量服务器）

适用：单机 VPS/家用服务器。
- 保留 Nginx + backend-java 容器
- MySQL/Redis 可继续容器化，但建议：
  - 定期备份 MySQL：`mysqldump` + 定时任务
  - Redis 作为缓存，可无备份或使用 AOF
- 增加 HTTPS：
  - Nginx 终止 TLS（Let’s Encrypt）
  - 仅对外开放 80/443（本项目示例本地用 3000）

### 方案 B：托管 MySQL/Redis（更稳）

适用：云上正式环境。
- 后端容器仍可自建（Docker/K8s）
- MySQL 用云数据库，Redis 用托管缓存
- 好处：备份、监控、扩缩容更省心

### 迁移/升级建议

- 数据库 schema 用脚本版本化（例如后续引入 Flyway/Liquibase）
- 缓存策略：
  - 只缓存读多写少的查询（如按 id / externalId 获取）
  - 写入/导入后统一 `cache evict`，避免脏读
