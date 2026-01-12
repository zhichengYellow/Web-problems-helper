// 测试后端服务连接性
const https = require('https');

const testBackend = async () => {
    console.log('🧪 测试后端服务连接性...');
    
    try {
        // 测试健康检查
        const healthResponse = await fetch('http://localhost:3001/health');
        const healthData = await healthResponse.json();
        console.log('✅ 健康检查:', healthData);
        
        // 测试状态端点
        const statusResponse = await fetch('http://localhost:3001/status');
        const statusData = await statusResponse.json();
        console.log('✅ 服务状态:', statusData);
        
        console.log('🎉 后端服务连接测试成功！');
        console.log('💡 现在可以在浏览器扩展中使用 http://localhost:3001/api/chat');
        
    } catch (error) {
        console.error('❌ 连接测试失败:', error.message);
        console.log('💡 请确保后端服务正在运行: node server/index.js');
    }
};

// 简单的fetch polyfill (HTTP版本)
function fetch(url, options = {}) {
    return new Promise((resolve, reject) => {
        const { protocol, hostname, port, pathname } = new URL(url);
        const http = protocol === 'https:' ? require('https') : require('http');
        
        const req = http.request({
            hostname,
            port,
            path: pathname,
            method: options.method || 'GET',
            headers: options.headers || {}
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                resolve({
                    ok: res.statusCode >= 200 && res.statusCode < 300,
                    status: res.statusCode,
                    json: () => Promise.resolve(JSON.parse(data)),
                    text: () => Promise.resolve(data)
                });
            });
        });
        
        req.on('error', reject);
        if (options.body) req.write(options.body);
        req.end();
    });
}

testBackend();