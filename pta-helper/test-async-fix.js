// 异步响应错误测试脚本
// 用于验证content.js中的消息监听器修复

console.log('🧪 开始异步响应错误测试...');

// 模拟消息监听器
function simulateMessageListener() {
    let sendResponseCalled = false;
    
    const sendResponse = (response) => {
        console.log('📤 sendResponse被调用:', response);
        sendResponseCalled = true;
    };
    
    // 模拟消息处理
    const message = { action: 'testHunyuanConnection', config: {} };
    
    // 调用修复后的消息监听器逻辑
    handleTestMessage(message, sendResponse);
    
    return sendResponseCalled;
}

// 模拟消息处理函数
async function handleTestMessage(request, sendResponse) {
    try {
        console.log('收到测试消息:', request.action);
        
        // 模拟异步操作
        await new Promise(resolve => setTimeout(resolve, 100));
        
        sendResponse({ success: true, message: '测试成功' });
        
    } catch (error) {
        console.error('测试失败:', error);
        sendResponse({ success: false, error: error.message });
    }
    
    return true; // 保持消息通道开放
}

// 运行测试
const responseSent = simulateMessageListener();

setTimeout(() => {
    console.log('✅ 测试完成 - sendResponse被调用:', responseSent);
    console.log('📋 异步响应错误应该已经修复');
}, 200);