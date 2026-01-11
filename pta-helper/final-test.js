// PTA答题助手最终测试脚本
console.log('🚀 PTA答题助手最终测试开始');

// 测试PTA选项识别功能
async function runFinalTest() {
    console.log('🧪 开始最终功能测试...');
    
    try {
        // 1. 测试选项识别
        console.log('\n1. 📋 测试选项识别功能...');
        const testResults = await testPTAOptionRecognition();
        
        console.log(`📊 测试结果: ${testResults.length} 个题目容器`);
        const successCount = testResults.filter(r => r.success).length;
        const totalOptions = testResults.reduce((sum, r) => sum + r.options.length, 0);
        
        console.log(`✅ 成功识别: ${successCount}/${testResults.length}`);
        console.log(`📋 总共选项: ${totalOptions}`);
        
        // 2. 测试题目检测
        console.log('\n2. 🔍 测试题目检测功能...');
        const questions = await detectQuestionsSync();
        console.log(`📊 检测到 ${questions.length} 道题目`);
        
        if (questions.length > 0) {
            questions.forEach((q, i) => {
                console.log(`   ${i + 1}. ${q.title.substring(0, 40)}... (${q.type}, ${q.options.length} 选项)`);
            });
        }
        
        // 3. 测试API连接（如果配置了）
        console.log('\n3. 🌐 测试API连接状态...');
        const apiStatus = await getAPIStatusSync();
        console.log(`📡 API状态: ${apiStatus.enabled ? '已启用' : '未启用'}`);
        if (apiStatus.enabled) {
            console.log(`   🔑 API密钥: ${apiStatus.hasKey ? '已配置' : '未配置'}`);
            console.log(`   📦 缓存大小: ${apiStatus.cacheSize}`);
        }
        
        // 4. 总体评估
        console.log('\n4. 📈 总体评估:');
        if (successCount > 0 && questions.length > 0) {
            console.log('🎉 测试通过！PTA答题助手功能正常');
            console.log('💡 建议: 在真实的PTA网站上进一步测试');
        } else {
            console.log('⚠️  测试未完全通过，需要进一步优化');
            if (successCount === 0) {
                console.log('   ❌ 选项识别功能需要改进');
            }
            if (questions.length === 0) {
                console.log('   ❌ 题目检测功能需要改进');
            }
        }
        
        return {
            success: successCount > 0 && questions.length > 0,
            optionRecognition: successCount,
            questionDetection: questions.length,
            apiStatus: apiStatus,
            details: testResults
        };
        
    } catch (error) {
        console.error('❌ 最终测试失败:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// 同步版本的函数
function detectQuestionsSync() {
    return new Promise((resolve) => {
        detectQuestions((response) => {
            resolve(response.success ? response.questions : []);
        });
    });
}

function getAPIStatusSync() {
    return new Promise((resolve) => {
        getAPIStatus((response) => {
            resolve(response.success ? response.status : { enabled: false, hasKey: false, cacheSize: 0 });
        });
    });
}

// 添加测试快捷键
document.addEventListener('keydown', function(e) {
    // Ctrl+Shift+T: 运行最终测试
    if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        console.clear();
        runFinalTest().then(result => {
            console.log('🎯 最终测试完成:', result);
        });
    }
    
    // Ctrl+Shift+O: 测试选项识别
    if (e.ctrlKey && e.shiftKey && e.key === 'O') {
        e.preventDefault();
        console.clear();
        testPTAOptionRecognition().then(results => {
            console.log('🎯 选项识别测试完成:', results);
        });
    }
});

console.log('💡 测试快捷键:');
console.log('   Ctrl+Shift+T - 运行最终测试');
console.log('   Ctrl+Shift+O - 测试选项识别');
console.log('   Ctrl+Shift+D - 检测题目');
console.log('   Ctrl+Shift+F - 自动填充');

// 自动运行基础测试
setTimeout(() => {
    console.log('\n🔍 自动运行基础测试...');
    testPTAOptionRecognition().then(results => {
        const successCount = results.filter(r => r.success).length;
        console.log(`✅ 自动测试完成: ${successCount}/${results.length} 成功`);
    });
}, 2000);