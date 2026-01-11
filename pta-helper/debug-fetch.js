// 已废弃：前端直连腾讯云签名逻辑已移除（统一走本地 Java 后端）
console.log('ℹ️ debug-fetch.js 已废弃：不再在前端拼装腾讯云直连请求。');
console.log('✅ 请用 Java 后端的 /api/chat 进行调试：');
console.log('   curl -s http://localhost:3001/health | cat');
console.log('   curl -s -X POST http://localhost:3001/api/chat -H "Content-Type: application/json" -d "{\"message\":\"1+1=?\"}" | cat');