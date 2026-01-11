// 后端冒烟测试（替代旧的前端签名测试）
// 需要：Java 后端已在 http://localhost:3001 启动

if (typeof fetch !== 'function') {
    console.error('❌ 当前 Node.js 不支持全局 fetch：请使用 Node 18+ 运行该脚本');
    process.exit(1);
}

async function run() {
    const backendChatUrl = process.env.BACKEND_URL || 'http://localhost:3001/api/chat';
    const healthUrl = (() => {
        try {
            const u = new URL(backendChatUrl);
            return `${u.origin}/health`;
        } catch (e) {
            return 'http://localhost:3001/health';
        }
    })();

    console.log('🏥 健康检查:', healthUrl);
    const healthRes = await fetch(healthUrl);
    console.log('status:', healthRes.status);
    console.log('body:', await healthRes.text());
    if (!healthRes.ok) process.exit(1);

    console.log('\n💬 调用 /api/chat:', backendChatUrl);
    const chatRes = await fetch(backendChatUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '测试：请只回答数字，1+1=?' })
    });
    console.log('status:', chatRes.status);
    console.log('body:', await chatRes.text());
    if (!chatRes.ok) process.exit(1);

    console.log('\n✅ 后端冒烟测试通过');
}

run().catch((e) => {
    console.error('❌ 后端冒烟测试失败:', e);
    process.exit(1);
});