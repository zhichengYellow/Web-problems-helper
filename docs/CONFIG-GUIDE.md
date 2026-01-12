# Web 题目助手 - 配置指南

## 🎯 主要功能

本工具已针对腾讯云hunyuan-lite API进行优化，提供稳定的题目搜索服务。

## 🔑 API密钥配置

### 腾讯云hunyuan-lite配置

1. **获取API密钥**：
   - 访问腾讯云控制台：https://console.cloud.tencent.com/cam/capi
   - 创建新的SecretId和SecretKey
   - 确保开通了hunyuan-lite服务权限

2. **配置格式**：
   - SecretId: `AKIDyour_secret_id_here`
   - SecretKey: `your_secret_key_here`

3. **配置方法**：
   - 打开 `config-test.html` 页面
   - 输入您的SecretId和SecretKey
   - 选择"腾讯云hunyuan-lite"作为主要API
   - 点击"测试配置"验证连接
   - 点击"保存配置"使配置生效

## 🧪 配置测试

使用 `config-test.html` 页面可以：

1. **测试连接**：验证API密钥是否正确
2. **实时状态**：查看当前服务状态和统计信息
3. **一键保存**：配置立即生效，无需重启

## 🌐 备用API服务

如果hunyuan-lite不可用，系统会自动切换到备用API：

1. **知寻题库API**：国内免费题库，响应快速
2. **Wikipedia API**：知识补充来源
3. **DuckDuckGo API**：即时答案搜索

## 💾 数据存储

- **Chrome扩展**：使用chrome.storage.local持久化存储
- **浏览器环境**：使用localStorage作为备用
- **本地存档**：自动缓存已搜索的题目和答案

## 🚀 性能优化

- **智能缓存**：相同题目直接返回缓存结果
- **优先级系统**：按API优先级自动选择最佳服务
- **回退机制**：主API失败时自动切换到备用API
- **本地智能**：所有API都不可用时使用本地智能生成答案

## 🔧 故障排除

### 常见问题

1. **配置不生效**：
   - 确保点击了"保存配置"按钮
   - 检查浏览器控制台是否有错误信息

2. **API连接失败**：
   - 验证API密钥是否正确
   - 检查网络连接是否正常

3. **CORS错误**：
   - 系统已内置CORS代理处理，通常无需手动干预

### 调试方法

1. 打开浏览器开发者工具（F12）
2. 查看Console标签页的错误信息
3. 使用 `apiService.getStatus()` 查看当前状态
4. 使用 `apiService.testConfig()` 测试配置

## 📊 状态监控

系统提供完整的统计信息：
- 总搜索次数
- 本地命中率
- API命中率
- 当前服务状态

## 🔄 实时更新

配置修改后立即生效，无需重启服务：
- API密钥更新
- 服务开关
- API切换

## 📝 版本信息

- **当前版本**：v2.0 (hunyuan-lite优化版)
- **主要特性**：腾讯云hunyuan-lite集成、智能回退、实时配置更新
- **兼容性**：Chrome扩展、普通浏览器环境