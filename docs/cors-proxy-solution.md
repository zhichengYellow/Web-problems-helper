# 腾讯云hunyuan API CORS问题解决方案

## 问题分析
腾讯云hunyuan API (`https://hunyuan.tencentcloudapi.com/`) 不支持浏览器直接访问，会触发CORS策略阻止。

## 解决方案

### 方案1: 使用服务器端代理（推荐）
```javascript
// 在您的服务器上创建代理端点
app.post('/api/hunyuan-proxy', async (req, res) => {
  try {
    const response = await fetch('https://hunyuan.tencentcloudapi.com/', {
      method: 'POST',
      headers: req.body.headers,
      body: req.body.payload
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 方案2: 使用腾讯云官方SDK
```bash
npm install tencentcloud-sdk-nodejs
```

### 方案3: 使用Cloudflare Workers代理
```javascript
// cloudflare-worker.js
export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === '/hunyuan-proxy') {
      const modifiedRequest = new Request('https://hunyuan.tencentcloudapi.com/', {
        method: 'POST',
        headers: request.headers,
        body: await request.text()
      });
      return fetch(modifiedRequest);
    }
    return new Response('Not Found', { status: 404 });
  }
};
```

## 临时测试方案
对于开发测试，可以暂时禁用浏览器CORS检查（不推荐生产环境）：
```bash
# Chrome启动时禁用安全策略
open -n -a "Google Chrome" --args --disable-web-security --user-data-dir=/tmp/chrome-test
```

## 最佳实践
1. **使用服务器端调用** - 最安全可靠的方式
2. **配置CORS代理** - 使用nginx或专用代理服务
3. **使用官方SDK** - 腾讯云提供的Node.js/Python SDK

## 注意事项
- 浏览器直接调用腾讯云API会受到CORS限制
- API密钥不应暴露在客户端代码中
- 建议所有API调用都通过服务器端进行