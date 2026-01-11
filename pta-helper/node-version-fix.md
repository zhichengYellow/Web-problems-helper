# Node.js版本兼容性解决方案

## 问题分析
当前Node.js版本: v16.17.0
- 官方SDK可能不支持此版本
- npm存在兼容性问题

## 解决方案

### 方案1: 升级Node.js（推荐）
```bash
# 使用nvm升级Node.js
nvm install 18
nvm use 18

# 或者使用n升级
sudo n 18
```

### 方案2: 使用兼容的HTTP API方案
如果无法升级Node.js，可以使用兼容的HTTP API调用方式：

```javascript
// 兼容旧版本Node.js的HTTP API调用
const https = require('https');

async function callHunyuanAPI(secretId, secretKey, payload) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'hunyuan.tencentcloudapi.com',
            port: 443,
            path: '/',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': generateAuthHeader(secretId, secretKey, payload)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        });

        req.on('error', reject);
        req.write(JSON.stringify(payload));
        req.end();
    });
}
```

### 方案3: 使用Docker容器
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["node", "server.js"]
```

## 临时解决方案
对于开发测试，可以使用较旧的SDK版本：
```bash
npm install tencentcloud-sdk-nodejs@3.0.0 --legacy-peer-deps
```

## 版本要求
- **推荐**: Node.js 18+ 
- **最低**: Node.js 14+（部分功能受限）
- **不推荐**: Node.js 12及以下

## 检查当前版本
```bash
node --version
npm --version
```

## 升级指南
1. **备份项目**: 确保代码已提交或备份
2. **安装nvm**: `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash`
3. **安装Node 18**: `nvm install 18`
4. **切换版本**: `nvm use 18`
5. **验证**: `node --version`