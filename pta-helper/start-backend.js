// 启动后端服务（Node 兼容模式）
// 默认不再启动：避免与 Java 后端重复业务/端口冲突。
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

if (process.env.USE_LEGACY_NODE_BACKEND !== 'true') {
    console.log('ℹ️ 已禁用 NodeJS 后端启动（与 Java 后端重复）。');
    console.log('✅ 请在 IDEA 中运行 server-java（默认 http://localhost:3001）。');
    console.log('💡 如确需启动 Node 兼容代理：USE_LEGACY_NODE_BACKEND=true node start-backend.js');
    process.exit(0);
}

console.log('🚀 启动 Node 兼容代理后端（转发到 Java 后端）...');

const serverDir = path.join(__dirname, 'server');

// 检查server目录是否存在
if (!fs.existsSync(serverDir)) {
    console.error('❌ server目录不存在，请确保项目结构正确');
    process.exit(1);
}

// 检查package.json是否存在
const packageJsonPath = path.join(serverDir, 'package.json');
if (!fs.existsSync(packageJsonPath)) {
    console.error('❌ server/package.json不存在');
    process.exit(1);
}

// 安装依赖
console.log('📦 安装后端服务依赖...');
exec('npm install', { cwd: serverDir }, (error, stdout, stderr) => {
    if (error) {
        console.error('❌ 依赖安装失败:', error);
        process.exit(1);
    }
    
    console.log('✅ 依赖安装完成');
    
    // 启动服务
    console.log('🌐 启动后端服务...');
    const serverProcess = exec('npm start', { cwd: serverDir });
    
    serverProcess.stdout.on('data', (data) => {
        console.log(`[后端服务] ${data}`);
    });
    
    serverProcess.stderr.on('data', (data) => {
        console.error(`[后端服务错误] ${data}`);
    });
    
    serverProcess.on('close', (code) => {
        console.log(`❌ 后端服务已退出，代码: ${code}`);
    });
    
    // 优雅关闭
    process.on('SIGINT', () => {
        console.log('\n🛑 正在关闭后端服务...');
        serverProcess.kill();
        process.exit(0);
    });
});

console.log('💡 提示: Node 兼容代理默认运行在 http://localhost:3002');
console.log('💡 它会转发请求到 Java 后端（默认 http://localhost:3001）');