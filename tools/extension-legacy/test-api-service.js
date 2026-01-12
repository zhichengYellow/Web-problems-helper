// Web 题目助手API服务测试脚本（Node.js环境优化版）
const { APIService } = require('./api-service');

// 创建测试实例 - 禁用API调用，强制使用本地智能答案
const testService = new APIService();
testService.isEnabled = false;
testService.fallbackEnabled = true;

// 测试数据
const testQuestions = [
    {
        text: "在数据结构中，从逻辑上可以把数据结构分成（ ）。",
        type: "single_choice",
        options: [
            { value: "A", text: "动态结构和静态结构" },
            { value: "B", text: "顺序结构和链式结构" },
            { value: "C", text: "线性结构和非线性结构" },
            { value: "D", text: "内部结构和外部结构" }
        ]
    },
    {
        text: "与数据元素本身的形式、内容、相对位置、个数无关的是数据的（ ）。",
        type: "single_choice", 
        options: [
            { value: "A", text: "存储结构" },
            { value: "B", text: "逻辑结构" },
            { value: "C", text: "算法" },
            { value: "D", text: "操作" }
        ]
    },
    {
        text: "通常要求同一逻辑结构中的所有数据元素具有相同的特性，这意味着（ ）。",
        type: "single_choice",
        options: [
            { value: "A", text: "数据元素具有同一特点" },
            { value: "B", text: "不仅数据元素所包含的数据项的个数要相同，而且对应数据项的类型要一致" },
            { value: "C", text: "每个数据元素都一样" },
            { value: "D", text: "数据元素所包含的数据项的个数要相等" }
        ]
    },
    {
        text: "二叉树是一种树形结构。",
        type: "true_false"
    },
    {
        text: "快速排序的时间复杂度不是O(nlogn)。",
        type: "true_false"
    }
];

// 测试函数
async function runTests() {
    console.log('🧪 开始测试Web 题目助手API服务...\n');
    
    for (let i = 0; i < testQuestions.length; i++) {
        const question = testQuestions[i];
        console.log(`📝 测试题目 ${i + 1}: ${question.text}`);
        
        try {
            // 禁用API调用，强制使用本地智能答案
            testService.isEnabled = false;
            
            const answer = await testService.searchAnswer(
                question.text,
                question.type,
                question.options || []
            );
            
            console.log(`✅ 生成的答案: ${answer}`);
            
            if (question.type === 'single_choice') {
                const selectedOption = question.options.find(opt => opt.value === answer);
                console.log(`   📋 选项内容: ${selectedOption?.text || '未知'}`);
            }
            
        } catch (error) {
            console.log(`❌ 测试失败: ${error.message}`);
        }
        
        console.log('---');
    }
    
    // 测试状态统计
    const status = testService.getStatus();
    console.log('📊 服务状态统计:');
    console.log(`   总搜索次数: ${status.totalSearches}`);
    console.log(`   本地命中次数: ${status.localHits}`);
    console.log(`   本地存档大小: ${status.archiveSize}`);
    console.log(`   缓存大小: ${status.cacheSize}`);
    
    console.log('\n🎉 测试完成！');
}

// 运行测试
runTests().catch(console.error);