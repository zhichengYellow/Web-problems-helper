// PTA答题助手 - 简化版题目检测测试脚本
// 用于验证题目检测和选项匹配的优化效果

(function() {
    console.log('🚀 开始题目检测测试...');
    
    // 模拟测试环境
    const testCases = [
        {
            name: '标准选择题',
            html: `
                <div class="question-item">
                    <h3>1. 以下哪个不是编程语言？</h3>
                    <div class="options">
                        <label><input type="radio" name="q1" value="A"> A) Python</label>
                        <label><input type="radio" name="q1" value="B"> B) Java</label>
                        <label><input type="radio" name="q1" value="C"> C) HTML</label>
                        <label><input type="radio" name="q1" value="D"> D) CSS</label>
                    </div>
                </div>
            `,
            expected: {
                title: '以下哪个不是编程语言？',
                type: 'single_choice',
                options: 4
            }
        },
        {
            name: '复杂选择题',
            html: `
                <div class="problem-content">
                    <p><strong>2. 关于JavaScript的说法，正确的是：</strong></p>
                    <div class="form-check">
                        <input class="form-check-input" type="radio" name="q2" id="q2a" value="A">
                        <label class="form-check-label" for="q2a">A) 是一种编译型语言</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="radio" name="q2" id="q2b" value="B">
                        <label class="form-check-label" for="q2b">B) 只能在浏览器中运行</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="radio" name="q2" id="q2c" value="C">
                        <label class="form-check-label" for="q2c">C) 支持面向对象编程</label>
                    </div>
                </div>
            `,
            expected: {
                title: '关于JavaScript的说法，正确的是：',
                type: 'single_choice',
                options: 3
            }
        }
    ];

    // 运行测试
    let passed = 0;
    let failed = 0;

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function runTests() {
        for (let index = 0; index < testCases.length; index++) {
            const testCase = testCases[index];
            console.log(`\n📋 测试 ${index + 1}: ${testCase.name}`);
            
            // 创建测试元素
            const testContainer = document.createElement('div');
            testContainer.innerHTML = testCase.html;
            document.body.appendChild(testContainer);
            
            try {
                // 使用优化后的函数进行测试
                const question = parseQuestion(testContainer, index);
                
                if (!question) {
                    console.log('❌ 题目解析失败');
                    failed++;
                    continue;
                }
                
                console.log('📊 解析结果:', {
                    title: question.title,
                    type: question.type,
                    options: question.options.length,
                    inputs: question.inputs.length
                });
                
                // 验证结果
                let testPassed = true;
                
                if (question.title !== testCase.expected.title) {
                    console.log(`❌ 标题不匹配: 期望 "${testCase.expected.title}", 实际 "${question.title}"`);
                    testPassed = false;
                }
                
                if (question.type !== testCase.expected.type) {
                    console.log(`❌ 类型不匹配: 期望 "${testCase.expected.type}", 实际 "${question.type}"`);
                    testPassed = false;
                }
                
                if (question.options.length !== testCase.expected.options) {
                    console.log(`❌ 选项数量不匹配: 期望 ${testCase.expected.options}, 实际 ${question.options.length}`);
                    testPassed = false;
                }
                
                // 测试选项匹配
                if (question.options.length > 0) {
                    console.log('🔍 测试选项匹配...');
                    question.options.forEach((option, optIndex) => {
                        console.log(`  选项 ${optIndex + 1}:`, {
                            value: option.value,
                            text: option.text.substring(0, 20) + (option.text.length > 20 ? '...' : '')
                        });
                    });
                    
                    // 测试答案填充
                    if (question.type === 'single_choice' && question.options.length > 0) {
                        const testAnswer = question.options[0].value;
                        const fillResult = fillChoiceAnswer(question, testAnswer);
                        console.log(`🔄 填充测试: ${fillResult ? '✅ 成功' : '❌ 失败'}`);
                    }
                }
                
                if (testPassed) {
                    console.log('✅ 测试通过');
                    passed++;
                } else {
                    console.log('❌ 测试失败');
                    failed++;
                }
                
            } catch (error) {
                console.log('❌ 测试异常:', error);
                failed++;
            }
            
            // 清理
            document.body.removeChild(testContainer);
            
            // 添加延迟
            await sleep(100);
        }

        console.log(`\n🎯 测试完成！通过: ${passed}, 失败: ${failed}, 总计: ${testCases.length}`);
        
        if (failed === 0) {
            console.log('🎉 所有测试用例通过！题目检测优化成功。');
        } else {
            console.log('⚠️ 存在测试失败，需要进一步优化。');
        }
    }

    // 运行测试
    runTests();

})();

console.log('📝 检测测试脚本加载完成。');