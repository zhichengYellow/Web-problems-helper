// 腾讯云hunyuan-lite集成测试脚本
console.log('开始测试hunyuan-lite集成...');

// 检查hunyuan服务是否可用
if (typeof hunyuanService === 'undefined') {
    console.error('❌ hunyuanService未定义，请确保hunyuan-service.js已正确加载');
    process.exit(1);
}

// 测试配置设置
async function testHunyuanConfig() {
    console.log('🧪 测试配置设置...');
    
    try {
        // 设置测试配置
        await hunyuanService.setConfig('test-secret-id', 'test-secret-key');
        
        if (hunyuanService.isConfigured()) {
            console.log('✅ 配置设置成功');
            return true;
        } else {
            console.log('❌ 配置设置失败');
            return false;
        }
    } catch (error) {
        console.error('❌ 配置设置出错:', error.message);
        return false;
    }
}

// 测试答案搜索
async function testAnswerSearch() {
    console.log('🧪 测试答案搜索...');
    
    try {
        const questionText = "以下哪个不是数据结构的基本类型？";
        const questionType = "single_choice";
        const options = [
            { text: "线性结构", value: "A" },
            { text: "树形结构", value: "B" },
            { text: "图形结构", value: "C" },
            { text: "循环结构", value: "D" }
        ];
        
        const result = await hunyuanService.searchAnswer(questionText, questionType, options);
        
        if (result) {
            console.log('✅ 答案搜索成功:', result);
            return true;
        } else {
            console.log('❌ 答案搜索失败，返回null');
            return false;
        }
    } catch (error) {
        console.error('❌ 答案搜索出错:', error.message);
        return false;
    }
}

// 运行测试
async function runTests() {
    console.log('🚀 开始运行hunyuan-lite集成测试');
    
    const configTest = await testHunyuanConfig();
    const searchTest = await testAnswerSearch();
    
    if (configTest && searchTest) {
        console.log('🎉 所有测试通过！hunyuan-lite集成正常');
    } else {
        console.log('❌ 部分测试失败，请检查集成');
    }
}

// 如果在Node.js环境中运行
if (typeof module !== 'undefined' && module.exports) {
    // 模拟浏览器环境
    global.window = {};
    global.chrome = { storage: { local: { get: () => Promise.resolve({}), set: () => Promise.resolve() } } };
    
    // 加载hunyuan-service
    const { hunyuanService } = require('./hunyuan-service');
    global.hunyuanService = hunyuanService;
    
    runTests();
} else {
    // 在浏览器环境中直接运行
    document.addEventListener('DOMContentLoaded', runTests);
}