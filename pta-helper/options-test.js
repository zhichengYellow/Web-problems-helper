// 选项识别功能测试脚本
console.log('🔧 开始选项识别功能测试...');

// 模拟各种DOM结构来测试选项识别
function createTestCases() {
    const testCases = [];
    
    // 测试用例1: 标准单选按钮
    const case1 = document.createElement('div');
    case1.innerHTML = `
        <div class="question">
            <label><input type="radio" name="q1" value="A"> A. 这是选项A的内容</label><br>
            <label><input type="radio" name="q1" value="B"> B. 这是选项B的内容</label><br>
            <label><input type="radio" name="q1" value="C"> C. 这是选项C的内容</label>
        </div>
    `;
    testCases.push({
        name: '标准单选按钮',
        element: case1.firstChild,
        expected: 3
    });
    
    // 测试用例2: 分离的label和input
    const case2 = document.createElement('div');
    case2.innerHTML = `
        <div class="question">
            <input type="radio" name="q2" value="1" id="q2_1">
            <label for="q2_1">选项1的文本描述</label><br>
            <input type="radio" name="q2" value="2" id="q2_2">
            <label for="q2_2">选项2的文本描述</label>
        </div>
    `;
    testCases.push({
        name: '分离的label和input',
        element: case2.firstChild,
        expected: 2
    });
    
    // 测试用例3: 多选复选框
    const case3 = document.createElement('div');
    case3.innerHTML = `
        <div class="question">
            <div class="form-check">
                <input type="checkbox" name="q3" value="option1">
                <span class="form-check-label">复选框选项1</span>
            </div>
            <div class="form-check">
                <input type="checkbox" name="q3" value="option2">
                <span class="form-check-label">复选框选项2</span>
            </div>
        </div>
    `;
    testCases.push({
        name: '多选复选框',
        element: case3.firstChild,
        expected: 2
    });
    
    // 测试用例4: 纯文本选项
    const case4 = document.createElement('div');
    case4.innerHTML = `
        <div class="question">
            <p>A) 第一个文本选项的描述内容</p>
            <p>B) 第二个文本选项的描述内容</p>
            <p>C) 第三个文本选项的描述内容</p>
        </div>
    `;
    testCases.push({
        name: '纯文本选项',
        element: case4.firstChild,
        expected: 3
    });
    
    // 测试用例5: 复杂HTML结构
    const case5 = document.createElement('div');
    case5.innerHTML = `
        <div class="ant-radio-group">
            <div class="ant-radio-wrapper">
                <span class="ant-radio">
                    <input type="radio" name="q5" value="X">
                </span>
                <span>复杂选项X的描述</span>
            </div>
            <div class="ant-radio-wrapper">
                <span class="ant-radio">
                    <input type="radio" name="q5" value="Y">
                </span>
                <span>复杂选项Y的描述</span>
            </div>
        </div>
    `;
    testCases.push({
        name: '复杂HTML结构',
        element: case5.firstChild,
        expected: 2
    });
    
    // 测试用例6: 数字编号选项
    const case6 = document.createElement('div');
    case6.innerHTML = `
        <div class="question">
            <p>1. 第一个数字选项</p>
            <p>2. 第二个数字选项</p>
            <p>3. 第三个数字选项</p>
        </div>
    `;
    testCases.push({
        name: '数字编号选项',
        element: case6.firstChild,
        expected: 3
    });
    
    return testCases;
}

// 运行测试
async function runOptionsTests() {
    console.log('🧪 开始运行选项识别测试...');
    
    const testCases = createTestCases();
    let passed = 0;
    let total = testCases.length;
    
    for (const testCase of testCases) {
        console.log(`\n📋 测试: ${testCase.name}`);
        
        try {
            // 使用优化后的getQuestionOptions函数
            const options = getQuestionOptions(testCase.element);
            
            console.log(`✅ 识别到 ${options.length} 个选项 (预期: ${testCase.expected})`);
            console.log('📝 选项详情:', options.map(opt => ({
                text: opt.text.substring(0, 20) + '...',
                value: opt.value
            })));
            
            if (options.length >= testCase.expected) {
                passed++;
                console.log('✅ 测试通过');
            } else {
                console.log('❌ 测试失败: 选项数量不足');
            }
        } catch (error) {
            console.log('❌ 测试失败:', error.message);
        }
    }
    
    console.log(`\n🎯 测试完成: ${passed}/${total} 通过`);
    return passed === total;
}

// 导出测试函数（如果需要在其他文件中使用）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runOptionsTests };
}

// 如果直接在浏览器中运行，立即执行测试
if (typeof window !== 'undefined') {
    setTimeout(() => {
        runOptionsTests().then(success => {
            console.log(success ? '🎉 所有测试通过!' : '⚠️ 部分测试失败');
        });
    }, 1000);
}