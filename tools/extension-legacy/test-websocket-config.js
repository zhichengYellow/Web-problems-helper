// Web 题目助手 WebSocket 配置测试脚本

function testWebSocketConfiguration() {
    console.log('[WPH测试] 开始测试WebSocket配置...');
    
    const tests = [
        {
            name: '错误处理器',
            test: () => typeof window.WPHWebSocketErrorHandler !== 'undefined',
            message: 'WebSocket错误处理器已加载'
        },
        {
            name: '连接优化器',
            test: () => typeof window.WPHWebSocketOptimizer !== 'undefined',
            message: 'WebSocket连接优化器已加载'
        },
        {
            name: '配置管理器',
            test: () => typeof window.WPHWebSocketConfigManager !== 'undefined',
            message: 'WebSocket配置管理器已加载'
        },
        {
            name: 'WebSocket对象',
            test: () => typeof window.WebSocket !== 'undefined',
            message: 'WebSocket对象可用'
        }
    ];
    
    let passed = 0;
    let failed = 0;
    
    tests.forEach(test => {
        const result = test.test();
        if (result) {
            console.log(`✅ ${test.name}: ${test.message}`);
            passed++;
        } else {
            console.log(`❌ ${test.name}: 测试失败`);
            failed++;
        }
    });
    
    console.log(`[WPH测试] 测试完成: ${passed}通过, ${failed}失败`);
    
    return { passed, failed, total: tests.length };
}

// 页面加载后自动测试
window.addEventListener('load', () => {
    setTimeout(() => {
        testWebSocketConfiguration();
    }, 2000);
});

// 导出测试函数
if (typeof window !== 'undefined') {
    window.testWPHWebSocketConfig = testWebSocketConfiguration;
}
