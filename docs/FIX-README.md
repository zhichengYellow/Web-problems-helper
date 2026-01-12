# Web 题目助手问题修复说明

## 问题分析

根据错误信息，主要存在以下问题：

1. **配置文件加载失败** - 缺少有效的配置文件
2. **CORS策略阻止** - 腾讯云混元API不支持浏览器直接访问
3. **Chrome扩展上下文无效** - 存储访问失败

## 修复方案

### 1. 配置文件问题修复

已创建 `config.js` 文件，请按以下步骤配置：

1. 打开 `config.js` 文件
2. 将 `您的腾讯云SecretId` 替换为实际的SecretId
3. 将 `您的腾讯云SecretKey` 替换为实际的SecretKey
4. 保存文件

### 2. CORS问题修复

**腾讯云混元API不支持浏览器直接跨域访问**，已修改代码：

- 在 `api-service.js` 中强制对不支持CORS的API使用background script
- 在 `hunyuan-service.js` 中添加了通过background script调用的方法
- 优化了错误处理和回退机制

### 3. 存储访问问题修复

- 移除了对 `chrome.runtime?.lastError` 的严格检查
- 增强了错误处理，确保在存储访问失败时使用备用方案
- 添加了更详细的错误日志

## 使用说明

### 配置腾讯云密钥

1. 登录腾讯云控制台
2. 进入「访问管理」->「API密钥管理」
3. 创建或获取SecretId和SecretKey
4. 在 `config.js` 中填写密钥信息

### 测试hunyuan集成

1. 打开 `test-hunyuan-browser.html`
2. 输入腾讯云SecretId和SecretKey
3. 点击「保存配置」
4. 输入测试问题并点击「测试调用」

### 备用API方案

如果腾讯云API不可用，系统会自动使用以下免费API：

1. **知寻题库API** - 国内免费题库，支持CORS
2. **Wikipedia API** - 英文内容检索
3. **DuckDuckGo API** - 即时答案查询
4. **本地智能答案生成** - 最终回退方案

## 故障排除

### 常见问题

1. **CORS错误**：确保使用Chrome扩展环境，background script已正确配置
2. **配置加载失败**：检查 `config.js` 文件是否存在且格式正确
3. **存储访问失败**：检查Chrome扩展权限设置

### 调试方法

1. 打开Chrome开发者工具（F12）
2. 查看Console标签页的错误信息
3. 检查Network标签页的API请求情况

## 文件变更

- ✅ 创建 `config.js` - 配置文件模板
- ✅ 修改 `api-service.js` - 修复CORS处理和错误处理
- ✅ 修改 `hunyuan-service.js` - 添加background script支持
- ✅ 更新 `manifest.json` - 确保正确的API权限

## 注意事项

1. 腾讯云混元API需要有效的SecretId/SecretKey
2. 混元API调用会产生费用，请关注用量
3. 建议优先使用免费的知寻题库API
4. 确保Chrome扩展已正确安装和启用