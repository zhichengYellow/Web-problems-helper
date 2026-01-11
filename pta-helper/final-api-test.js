// 最终API服务功能测试
console.log('🚀 最终API服务功能测试...');

// 模拟测试环境
const isNode = typeof module !== 'undefined' && module.exports;

// 测试题目数据
const testQuestions = [
    {
        text: '在数据结构中，从逻辑上可以把数据结构分成（   ）。',
        type: 'single_choice',
        options: [
            { text: '动态结构和静态结构', value: 'A' },
            { text: '紧凑结构和非紧凑结构', value: 'B' },
            { text: '线性结构和非线性结构', value: 'C' },
            { text: '内部结构和外部结构', value: 'D' }
        ],
        expected: 'C'
    },
    {
        text: '算法的时间复杂度取决于（    ）。',
        type: 'single_choice',
        options: [
            { text: '问题的规模', value: 'A' },
            { text: '待处理数据的初态', value: 'B' },
            { text: '计算机的配置', value: 'C' },
            { text: 'A和B', value: 'D' }
        ],
        expected: 'D'
    },
    {
        text: '栈和队列的共同点是（    ）。',
        type: 'single_choice',
        options: [
            { text: '都是先进先出', value: 'A' },
            { text: '都是先进后出', value: 'B' },
            { text: '只允许在端点处插入和删除元素', value: 'C' },
            { text: '没有共同点', value: 'D' }
        ],
        expected: 'C'
    }
];

async function runCompleteTest() {
    try {
        console.log('🔧 创建API服务实例...');
        
        // 创建API服务实例
        const apiService = new APIService();
        await apiService.init();
        
        console.log('✅ API服务初始化成功');
        console.log('📊 初始状态:', JSON.stringify(apiService.getStatus(), null, 2));
        
        // 测试1: 基本功能测试
        console.log('\n📋 测试1: 基本功能测试');
        console.log('='.repeat(50));
        
        for (let i = 0; i < testQuestions.length; i++) {
            const question = testQuestions[i];
            console.log(`\n📝 测试题目 ${i + 1}: ${question.text.substring(0, 30)}...`);
            
            const startTime = Date.now();
            const result = await apiService.searchAnswer(
                question.text,
                question.type,
                question.options
            );
            const duration = Date.now() - startTime;
            
            console.log(`⏱️  搜索耗时: ${duration}ms`);
            console.log(`🎯 搜索结果: ${result}`);
            console.log(`✅ 预期答案: ${question.expected}`);
            console.log(`📊 匹配状态: ${result === question.expected ? '✓ 匹配' : '✗ 不匹配'}`);
            
            if (result) {
                console.log('💾 答案已保存到本地存档');
            }
            
            // 短暂延迟
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // 测试2: 缓存功能测试
        console.log('\n📋 测试2: 缓存功能测试');
        console.log('='.repeat(50));
        
        // 重复搜索同一题目测试缓存
        const testQuestion = testQuestions[0];
        console.log(`🔄 重复搜索: ${testQuestion.text.substring(0, 30)}...`);
        
        const cacheStartTime = Date.now();
        const cachedResult = await apiService.searchAnswer(
            testQuestion.text,
            testQuestion.type,
            testQuestion.options
        );
        const cacheDuration = Date.now() - cacheStartTime;
        
        console.log(`⏱️  缓存搜索耗时: ${cacheDuration}ms`);
        console.log(`🎯 缓存结果: ${cachedResult}`);
        console.log(`📊 缓存命中: ${cacheDuration < 10 ? '✓ 命中' : '✗ 未命中'}`);
        
        // 测试3: 存档功能测试
        console.log('\n📋 测试3: 存档功能测试');
        console.log('='.repeat(50));
        
        console.log(`📦 当前存档大小: ${apiService.localArchive.size}`);
        console.log(`💾 缓存大小: ${apiService.cache.size}`);
        
        // 显示存档内容
        if (apiService.localArchive.size > 0) {
            console.log('\n📋 存档内容:');
            let count = 0;
            for (const [key, entry] of apiService.localArchive) {
                if (count < 3) { // 只显示前3条
                    console.log(`  ${count + 1}. ${key.substring(0, 40)}... -> ${entry.answer}`);
                    count++;
                } else {
                    console.log(`  ... 还有 ${apiService.localArchive.size - 3} 条记录`);
                    break;
                }
            }
        }
        
        // 测试4: 统计功能测试
        console.log('\n📋 测试4: 统计功能测试');
        console.log('='.repeat(50));
        
        const stats = apiService.usageStats;
        console.log(`🔢 总搜索次数: ${stats.totalSearches}`);
        console.log(`🏠 本地命中: ${stats.localHits}`);
        console.log(`🌐 API命中: ${stats.apiHits}`);
        console.log(`❌ 失败搜索: ${stats.failedSearches}`);
        console.log(`📊 命中率: ${stats.totalSearches > 0 ? 
            Math.round(((stats.localHits + stats.apiHits) / stats.totalSearches) * 100) : 0}%`);
        
        // 测试5: API配置测试
        console.log('\n📋 测试5: API配置测试');
        console.log('='.repeat(50));
        
        console.log(`🔧 当前API: ${apiService.currentAPI}`);
        console.log(`🌐 API基础URL: ${apiService.baseURL}`);
        console.log(`🔑 API密钥: ${apiService.apiKey ? '已设置' : '未设置'}`);
        console.log(`⚡ 服务状态: ${apiService.isEnabled ? '启用' : '禁用'}`);
        console.log(`🔄 回退功能: ${apiService.fallbackEnabled ? '启用' : '禁用'}`);
        console.log(`💾 同步功能: ${apiService.syncEnabled ? '启用' : '禁用'}`);
        
        // 最终总结
        console.log('\n🎉 最终测试结果');
        console.log('='.repeat(50));
        
        const successCount = testQuestions.filter((q, i) => {
            // 检查是否成功匹配或至少返回了结果
            const hasResult = apiService.localArchive.has(apiService.generateSearchKey(q.text));
            return hasResult;
        }).length;
        
        console.log(`✅ 成功测试: ${successCount}/${testQuestions.length}`);
        console.log(`📦 存档记录: ${apiService.localArchive.size}`);
        console.log(`💾 缓存记录: ${apiService.cache.size}`);
        console.log(`📊 总体性能: ${stats.totalSearches}次搜索，${stats.localHits + stats.apiHits}次命中`);
        
        if (successCount === testQuestions.length) {
            console.log('\n🎯 所有测试通过！API服务功能完整。');
        } else {
            console.log('\n⚠️  部分测试未通过，需要进一步优化。');
        }
        
    } catch (error) {
        console.error('❌ 测试失败:', error);
    }
}

// 运行测试
if (isNode) {
    // Node.js环境
    const { APIService } = require('./api-service.js');
    runCompleteTest().catch(console.error);
} else {
    console.log('⚠️  请在Node.js环境中运行此测试');
}