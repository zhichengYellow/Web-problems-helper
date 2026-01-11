# 腾讯云hunyuan-lite配置指南

## 配置选项

### 1. 代理服务器模式（推荐）
避免CORS问题，通过本地代理服务器调用腾讯云API。

**配置步骤：**
1. 启动代理服务器：
   ```bash
   node start-proxy.js
   ```

2. 在浏览器扩展中配置：
   - API类型：选择"代理服务器"
   - 服务器地址：`http://localhost:3000`
   - SecretId：您的腾讯云SecretId
   - SecretKey：您的腾讯云SecretKey

### 2. 直接调用模式（可能遇到CORS）
直接调用腾讯云API，但可能被CORS策略阻止。

**配置步骤：**
1. 在浏览器扩展中配置：
   - API类型：选择"直接调用"
   - SecretId：您的腾讯云SecretId  
   - SecretKey：您的腾讯云SecretKey
   - 区域：`ap-guangzhou`（默认）

### 3. 组合密钥格式
支持将SecretId和SecretKey组合成一个字符串：
```
SecretId:SecretKey
```

## 腾讯云API密钥获取

1. 登录[腾讯云控制台](https://console.cloud.tencent.com/)
2. 进入"访问管理" → "API密钥管理"
3. 创建或使用现有密钥对
4. 复制SecretId和SecretKey

## 常见问题解决

### CORS错误
**症状**：`Access to fetch at 'https://hunyuan.tencentcloudapi.com/' has been blocked by CORS policy`

**解决方案**：
1. 使用代理服务器模式
2. 或联系腾讯云技术支持启用CORS

### 签名验证失败
**症状**：`signature verification failed`

**解决方案**：
1. 检查SecretId和SecretKey是否正确
2. 确保时间同步（服务器时间与本地时间差不超过5分钟）

### 网络连接失败
**症状**：`Failed to fetch` 或 `NetworkError`

**解决方案**：
1. 检查网络连接
2. 确保代理服务器已启动（如果使用代理模式）
3. 检查防火墙设置

## 性能优化建议

1. **启用缓存**：减少重复API调用
2. **使用hunyuan-lite模型**：成本更低，响应更快
3. **批量处理**：一次性处理多个题目
4. **本地存档**：保存已搜索的题目答案

## 安全注意事项

1. 🔒 **不要泄露SecretKey**：密钥具有完全API访问权限
2. 🔒 **使用环境变量**：不要在代码中硬编码密钥
3. 🔒 **定期轮换密钥**：建议每3个月更换一次
4. 🔒 **限制API权限**：为密钥设置最小必要权限

## 故障排除

### 代理服务器无法启动
```bash
# 检查端口占用
netstat -an | grep 3000

# 使用其他端口
PORT=3005 node start-proxy.js
```

### API调用返回空结果
- 检查prompt格式是否正确
- 验证模型权限（确保有hunyuan-lite访问权限）
- 检查账户余额

### 响应时间过长
- 降低请求频率
- 增加超时时间设置
- 使用更简单的prompt

## 技术支持

如果遇到问题，请提供：
1. 错误信息和堆栈跟踪
2. 使用的配置模式
3. 腾讯云账户区域
4. 浏览器和控制台日志

## 版本更新

- v1.0: 初始版本，支持基本API调用
- v1.1: 添加代理服务器支持，解决CORS问题
- v1.2: 优化错误处理和缓存机制