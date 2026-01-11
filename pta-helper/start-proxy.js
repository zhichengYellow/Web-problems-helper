// 启动腾讯云hunyuan代理服务器
const { exec } = require('child_process');
const path = require('path');

console.log('🚀 启动腾讯云hunyuan代理服务器...');

// 检查是否安装了依赖
let depsReady = true;
try {
    require('express');
    console.log('✅ 依赖已安装');
} catch (error) {
    depsReady = false;
    console.log('📦 安装依赖...');
    exec('npm install express', (err, stdout, stderr) => {
        if (err) {
            console.error('❌ 安装依赖失败:', err);
            return;
        }
        console.log('✅ 依赖安装完成');
        startServer();
    });
}

// 启动服务器
if (depsReady) {
    startServer();
}

function startServer() {
    const proxyServer = require('./hunyuan-proxy.js');
    console.log('✅ 代理服务器已启动');
    console.log('📝 健康检查: http://localhost:3000/health');
    console.log('🔗 API端点: http://localhost:3000/api/hunyuan');
    console.log('💡 请确保在浏览器扩展配置中使用代理服务器URL');
}