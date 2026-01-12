// 兼容用代理端点 /api/hunyuan 的 Node 服务
// 说明：不再在 Node 里实现腾讯云签名/直连混元（与 Java 后端重复）。
// 现在仅把请求映射并转发到 Java 后端的 /api/chat。

const express = require('express');
const http = require('http');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;
const JAVA_BACKEND_CHAT_URL = process.env.JAVA_BACKEND_CHAT_URL || 'http://localhost:3001/api/chat';

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS中间件
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    next();
});

function httpRequestJson(urlString, payload) {
    const url = new URL(urlString);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    const body = payload == null ? '' : JSON.stringify(payload);

    return new Promise((resolve, reject) => {
        const req = client.request(
            {
                method: 'POST',
                hostname: url.hostname,
                port: url.port || (isHttps ? 443 : 80),
                path: url.pathname + url.search,
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(body)
                },
                timeout: 30_000
            },
            (res) => {
                let responseData = '';
                res.on('data', (chunk) => (responseData += chunk));
                res.on('end', () => {
                    resolve({
                        status: res.statusCode || 500,
                        headers: res.headers,
                        bodyText: responseData
                    });
                });
            }
        );

        req.on('error', reject);
        req.on('timeout', () => req.destroy(new Error('Request timeout')));

        if (body) req.write(body);
        req.end();
    });
}

// 代理 /api/hunyuan -> Java /api/chat
app.post('/api/hunyuan', async (req, res) => {
    try {
        const {
            prompt,
            message,
            options = {},
            region,
            secretId,
            secretKey
        } = req.body || {};

        const msg = prompt || message;
        if (!msg) {
            return res.status(400).json({ success: false, error: '缺少 prompt/message 参数' });
        }

        const payload = {
            message: msg,
            options,
            region
        };

        // 兼容旧调用：如果调用方仍传 secretId/secretKey，则一并透传
        if (secretId) payload.secretId = secretId;
        if (secretKey) payload.secretKey = secretKey;

        const { status, headers, bodyText } = await httpRequestJson(JAVA_BACKEND_CHAT_URL, payload);
        res.status(status);
        res.setHeader('Content-Type', headers['content-type'] || 'application/json');
        res.send(bodyText);

    } catch (error) {
        console.error('代理请求失败:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 健康检查端点
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 hunyuan代理服务器运行在端口 ${PORT}`);
    console.log(`📝 健康检查: http://localhost:${PORT}/health`);
    console.log(`🔗 API端点: http://localhost:${PORT}/api/hunyuan`);
    console.log(`➡️  转发到 Java 后端: ${JAVA_BACKEND_CHAT_URL}`);
});

module.exports = app;