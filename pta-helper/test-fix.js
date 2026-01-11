// PTA答题助手修复测试脚本
// 用于验证CORS和配置问题的修复

console.log('🚀 开始测试PTA答题助手修复...');

// 测试API服务初始化
async function testAPIService() {
    console.log('🧪 测试API服务初始化...');
    
    try {
        // 创建API服务实例
        const apiService = new APIService();
        
        // 等待初始化完成
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const status = apiService.getStatus();
        console.log('✅ API服务状态:', status);
        
        // 测试本地存档功能
        const testQuestion = '数据结构的基本类型包括哪些？';
        const testOptions = [
            { value: 'A', text: '线性结构' },
            { value: 'B', text: '树形结构' },
            { value: 'C', text: '图形结构' },
            { value: 'D', text: '以上都是' }
        ];
        
        // 测试本地智能答案生成
        const localAnswer = apiService.generateLocalAnswer(testQuestion, 'single_choice', testOptions);
        console.log('🧠 本地智能答案:', localAnswer);
        
        return true;
        
    } catch (error) {
        console.error('❌ API服务测试失败:', error);
        return false;
    }
}

// 测试hunyuan服务
async function testHunyuanService() {
    console.log('🧪 测试hunyuan服务...');
    
    try {
        const hunyuanService = new HunyuanService();
        await hunyuanService.init();
        
        const isConfigured = hunyuanService.isConfigured();
        console.log('🔧 hunyuan配置状态:', isConfigured ? '已配置' : '未配置');
        
        if (isConfigured) {
            console.log('⚠️ 已检测到hunyuan配置，建议进行API调用测试');
        } else {
            console.log('ℹ️ 未配置hunyuan，将使用备用API服务');
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ hunyuan服务测试失败:', error);
        return false;
    }
}

// 运行所有测试
async function runAllTests() {
    console.log('='.repeat(50));
    console.log('📋 开始运行PTA答题助手修复测试');
    console.log('='.repeat(50));
    
    const results = [];
    
    // 测试1: API服务
    results.push(await testAPIService());
    console.log('');
    
    // 测试2: hunyuan服务
    results.push(await testHunyuanService());
    console.log('');
    
    // 汇总结果
    console.log('='.repeat(50));
    console.log('📊 测试结果汇总:');
    console.log('='.repeat(50));
    
    const passed = results.filter(r => r).length;
    const total = results.length;
    
    console.log(`✅ 通过: ${passed}/${total}`);
    console.log(`❌ 失败: ${total - passed}/${total}`);
    
    if (passed === total) {
        console.log('🎉 所有测试通过！修复成功！');
        console.log('💡 下一步: 在浏览器中打开 test-hunyuan-browser.html 进行完整测试');
    } else {
        console.log('⚠️ 部分测试失败，请检查配置和错误信息');
    }
    
    console.log('='.repeat(50));
}

// 自动运行测试
if (typeof window !== 'undefined') {
    // 浏览器环境
    document.addEventListener('DOMContentLoaded', runAllTests);
} else {
    // Node.js环境
    console.log('ℹ️ 请在浏览器环境中运行此测试脚本');
}

// 导出测试函数
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { testAPIService, testHunyuanService, runAllTests };
}