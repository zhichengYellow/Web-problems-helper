// 兼容用 NodeJS 启动的薄代理（不再实现腾讯云签名/直连混元）
// 目的：避免与 Java 后端重复业务；Node 仅转发到 Java 的 /health /status /api/chat /api/batch。

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const https = require('https');

const app = express();

// 默认改为 3002，避免与 Java 后端默认 3001 冲突
const PORT = Number(process.env.PORT || 3002);
const JAVA_BACKEND_BASE = process.env.JAVA_BACKEND_BASE || 'http://localhost:3001';

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

function httpRequestJson(urlString, payload, extraHeaders = {}) {
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
                    'Content-Length': Buffer.byteLength(body),
                    ...extraHeaders
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
        req.on('timeout', () => {
            req.destroy(new Error('Request timeout'));
        });

        if (body) req.write(body);
        req.end();
    });
}

async function proxyGet(req, res, path) {
    try {
        const target = new URL(path, JAVA_BACKEND_BASE).toString();
        const url = new URL(target);
        const isHttps = url.protocol === 'https:';
        const client = isHttps ? https : http;

        const upstreamReq = client.request(
            {
                method: 'GET',
                hostname: url.hostname,
                port: url.port || (isHttps ? 443 : 80),
                path: url.pathname + url.search,
                timeout: 10_000
            },
            (upstreamRes) => {
                res.status(upstreamRes.statusCode || 500);
                res.setHeader('Content-Type', upstreamRes.headers['content-type'] || 'application/json');
                upstreamRes.pipe(res);
            }
        );
        upstreamReq.on('error', (e) => {
            res.status(502).json({ success: false, error: `Java backend unreachable: ${e.message}` });
        });
        upstreamReq.on('timeout', () => {
            upstreamReq.destroy(new Error('Request timeout'));
        });
        upstreamReq.end();
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
}

async function proxyPost(req, res, path) {
    try {
        const target = new URL(path, JAVA_BACKEND_BASE).toString();
        const { status, headers, bodyText } = await httpRequestJson(target, req.body);

        res.status(status);
        res.setHeader('Content-Type', headers['content-type'] || 'application/json');
        res.send(bodyText);
    } catch (e) {
        res.status(502).json({ success: false, error: `Java backend unreachable: ${e.message}` });
    }
}

// 透传端点
app.get('/health', (req, res) => proxyGet(req, res, '/health'));
app.get('/status', (req, res) => proxyGet(req, res, '/status'));
app.post('/api/chat', (req, res) => proxyPost(req, res, '/api/chat'));
app.post('/api/batch', (req, res) => proxyPost(req, res, '/api/batch'));

// 错误处理中间件
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
    });
});

// 404处理
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        code: 'NOT_FOUND'
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log('🚀 Node compatibility proxy started (no Tencent signing logic)');
    console.log('📍 Port:', PORT);
    console.log('📡 Endpoint:', `http://localhost:${PORT}`);
    console.log('➡️  Forwarding to Java backend:', JAVA_BACKEND_BASE);
    console.log('🏥 Health check:', `http://localhost:${PORT}/health`);
    console.log('💬 API endpoint:', `http://localhost:${PORT}/api/chat`);
});

module.exports = app;