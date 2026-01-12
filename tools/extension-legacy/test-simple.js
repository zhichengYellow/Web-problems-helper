// 简化的 Pintia 题目检测测试
console.log('🔧 开始 Pintia 题目检测测试...');

// 创建测试函数
async function testPintiaDetection() {
    console.log('1. 测试容器检测...');
    
    // 测试 Pintia 特定选择器
    const pintiaSelectors = [
        '.pc-x',
        '[class*="problem"]',
        '[class*="question"]',
        'label',
        '.markdownBlock_tErSz'
    ];
    
    for (const selector of pintiaSelectors) {
        const elements = document.querySelectorAll(selector);
        console.log(`选择器 "${selector}": 找到 ${elements.length} 个元素`);
        
        if (elements.length > 0) {
            // 检查元素是否有内容
            const validElements = Array.from(elements).filter(el => {
                const text = el.textContent.trim();
                return text.length > 10 || el.querySelector('input');
            });
            
            console.log(`有效元素: ${validElements.length}`);
            
            if (validElements.length > 0) {
                console.log('✅ 找到有效题目容器');
                return true;
            }
        }
    }
    
    console.log('❌ 未找到有效题目容器');
    return false;
}

// 运行测试
testPintiaDetection().then(result => {
    console.log(`测试结果: ${result ? '成功' : '失败'}`);
});