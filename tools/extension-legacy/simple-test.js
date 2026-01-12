// 简单测试本地智能答案生成功能
const { APIService } = require('./api-service');

console.log('🧪 测试本地智能答案生成功能...\n');

// 创建测试实例，禁用所有API调用
const testService = new APIService();
testService.isEnabled = false;

// 测试题目
const testCases = [
    {
        question: "在数据结构中，从逻辑上可以把数据结构分成（ ）。",
        type: "single_choice",
        options: [
            { value: "A", text: "动态结构和静态结构" },
            { value: "B", text: "顺序结构和链式结构" },
            { value: "C", text: "线性结构和非线性结构" },
            { value: "D", text: "内部结构和外部结构" }
        ]
    },
    {
        question: "二叉树是一种树形结构。",
        type: "true_false"
    },
    {
        question: "快速排序的时间复杂度不是O(nlogn)。",
        type: "true_false"
    }
];

// 直接调用本地智能答案生成方法
testCases.forEach((testCase, index) => {
    console.log(`📝 测试 ${index + 1}: ${testCase.question}`);
    
    const answer = testService.generateLocalAnswer(
        testCase.question,
        testCase.type,
        testCase.options || []
    );
    
    console.log(`✅ 生成的答案: ${answer}`);
    
    if (testCase.type === 'single_choice' && testCase.options) {
        const selectedOption = testCase.options.find(opt => opt.value === answer);
        console.log(`   📋 选项内容: ${selectedOption?.text || '未知'}`);
    }
    
    console.log('---');
});

console.log('🎉 本地智能答案生成测试完成！');