# PTA答题助手 - 重构版

基于 `monkey-scripts` 项目的技术栈和工程化思路重构的现代化 PTA 答题助手 Chrome 扩展。

## 🚀 技术栈

- **包管理**: pnpm + Lerna (Monorepo)
- **构建工具**: Vite + Father
- **前端框架**: React 18 + TypeScript
- **UI组件库**: Ant Design
- **测试框架**: Vitest
- **代码质量**: ESLint + Prettier + Husky
- **文档工具**: Dumi

## 📁 项目结构

```
pta-helper/
├── packages/                 # Monorepo 包目录
│   ├── core/                # 核心扩展包
│   │   ├── src/
│   │   │   ├── core/        # 核心逻辑
│   │   │   ├── services/    # 服务层
│   │   │   ├── ui/          # UI组件
│   │   │   └── manifest.json
│   │   └── package.json
│   ├── utils/               # 工具函数包
│   │   ├── src/
│   │   │   ├── dom/         # DOM操作工具
│   │   │   ├── page/        # 页面识别工具
│   │   │   ├── url/         # URL处理工具
│   │   │   └── ...
│   │   └── package.json
│   └── config/              # 配置包
│       ├── src/
│       │   ├── pta/         # PTA平台配置
│       │   ├── problem/     # 题目类型配置
│       │   ├── api/         # API配置
│       │   └── ...
│       └── package.json
├── .eslintrc.js            # ESLint配置
├── .prettierrc             # Prettier配置
├── lerna.json              # Lerna配置
├── pnpm-workspace.yaml     # pnpm工作区配置
└── tsconfig.json           # TypeScript配置
```

## 🛠️ 开发环境搭建

### 前置要求

- **Node.js**: v16 或更高版本（推荐 v18+）
- **pnpm**: 最新版本
- **nvm**: 推荐用于管理 Node.js 版本

### 0. 安装 Node.js 和包管理器

```bash
# 使用 nvm 安装 Node.js（推荐）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.nvm/nvm.sh
nvm install 22
nvm use 22
nvm alias default 22

# 安装 pnpm
npm install -g pnpm
```

### 1. 安装依赖

```bash
# 使用 pnpm 安装依赖
pnpm install
```

### 2. 开发模式

```bash
# 启动所有包的开发模式
pnpm start

# 或单独启动某个包
pnpm core:dev      # 启动核心包开发
pnpm utils:dev     # 启动工具包开发
pnpm config:dev    # 启动配置包开发
```

### 3. 构建项目

```bash
# 构建所有包
pnpm build

# 构建生产版本
pnpm build:prod
```

### 4. 代码质量检查

```bash
# 代码格式化
pnpm format

# 代码检查
pnpm lint

# 运行测试
pnpm test
```

### 5. 后端服务（腾讯云hunyuan代理）

如果需要使用腾讯云hunyuan-lite AI模型功能，需要启动后端服务：

```bash
# 进入后端目录
cd server

# 安装依赖（首次运行）
npm install

# 启动开发模式（自动重启）
npm run dev

# 启动生产模式
npm start
```

#### 后端服务端点

| 端点 | 说明 |
|------|------|
| http://localhost:3001/health | 健康检查 |
| http://localhost:3001/status | 服务状态 |
| http://localhost:3001/api/chat | 单条聊天请求 |
| http://localhost:3001/api/batch | 批量聊天请求 |

#### 配置环境变量

在 `server/.env` 中配置：

```bash
TENCENT_SECRET_ID=your_secret_id_here
TENCENT_SECRET_KEY=your_secret_key_here
PORT=3001
```

详见 `HUNYUAN-INTEGRATION.md`

## 📦 包功能说明

### @pta-helper/core (核心包)
- Chrome扩展主逻辑
- 内容脚本注入
- 题目检测和答案填充
- UI界面管理

### @pta-helper/utils (工具包)
- DOM操作工具函数
- 页面识别和解析
- 网络请求封装
- 本地存储管理

### @pta-helper/config (配置包)
- PTA平台配置
- 题目类型定义
- API接口配置
- UI样式配置

## 🔧 功能特性

### 1. 现代化架构
- 基于Monorepo的多包管理
- TypeScript类型安全
- 模块化设计，易于扩展

### 2. 工程化优势
- 完整的开发工具链
- 自动化代码检查和格式化
- 单元测试和集成测试

### 3. 用户体验
- 响应式UI设计
- 智能题目识别
- 快速答案匹配

### 4. 可维护性
- 清晰的代码结构
- 完善的文档
- 版本管理和发布流程

## 🚀 快速开始

### 1. 安装插件

1. 构建项目：`pnpm build`
2. 打开Chrome浏览器
3. 访问 `chrome://extensions/`
4. 开启"开发者模式"
5. 点击"加载已解压的扩展程序"
6. 选择 `packages/core/dist` 目录

### 2. 使用插件

1. 访问 https://pintia.cn
2. 进入考试/作业/练习页面
3. 插件自动识别题目并显示答案
4. 点击答案进行快速填充

## 📚 开发指南

### 添加新功能

1. 在相应的包中创建新模块
2. 编写TypeScript类型定义
3. 添加单元测试
4. 更新文档

### 自定义配置

修改 `packages/config/src/` 中的配置文件来自定义：
- 题目识别规则
- UI样式配置
- API接口地址

### 扩展题目类型

在 `packages/config/src/problem/ProblemTypes.ts` 中添加新的题目类型定义。

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支：`git checkout -b feature/新功能`
3. 提交更改：`git commit -m 'feat: 添加新功能'`
4. 推送到分支：`git push origin feature/新功能`
5. 提交 Pull Request

## 📄 许可证

MIT License
