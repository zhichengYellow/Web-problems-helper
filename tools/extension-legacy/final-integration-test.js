// Web 题目助手 - 最终集成测试
// 验证API服务集成和所有功能

console.log('🎯 Web 题目助手 - 最终集成测试');
console.log('='.repeat(60));

async function runIntegrationTest() {
    try {
        console.log('🔧 初始化测试环境...');
        
        // 导入API服务
        const { APIService } = require('./api-service.js');
        const apiService = new APIService();
        await apiService.init();
        
        console.log('✅ API服务初始化成功');
        console.log('📊 初始状态:', JSON.stringify(apiService.getStatus(), null, 2));
        
        // 测试数据
        const testSuite = [
            {
                name: '数据结构分类题目',
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
                name: '算法时间复杂度题目',
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
                name: '栈和队列题目',
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
        
        console.log('\n🧪 开始功能测试...');
        console.log('-'.repeat(40));
        
        const results = [];
        let totalTime = 0;
        let successCount = 0;
        
        // 运行所有测试用例
        for (const testCase of testSuite) {
            console.log(`\n📝 测试: ${testCase.name}`);
            console.log(`  题目: ${testCase.text.substring(0, 40)}...`);
            
            try {
                const startTime = Date.now();
                const result = await apiService.searchAnswer(
                    testCase.text,
                    testCase.type,
                    testCase.options
                );
                const duration = Date.now() - startTime;
                totalTime += duration;
                
                const isSuccess = result === testCase.expected;
                if (isSuccess) successCount++;
                
                results.push({
                    name: testCase.name,
                    result: result,
                    expected: testCase.expected,
                    success: isSuccess,
                    duration: duration,
                    cached: duration < 10 // 假设10ms内为缓存命中
                });
                
                console.log(`  ⏱️  耗时: ${duration}ms`);
                console.log(`  🎯 结果: ${result || '无结果'}`);
                console.log(`  ✅ 预期: ${testCase.expected}`);
                console.log(`  📊 状态: ${isSuccess ? '✓ 成功' : '✗ 失败'}`);
                
                // 短暂延迟避免频繁请求
                await new Promise(resolve => setTimeout(resolve, 500));
                
            } catch (error) {
                console.log(`  ❌ 错误: ${error.message}`);
                results.push({
                    name: testCase.name,
                    error: error.message,
                    success: false,
                    duration: 0
                });
            }
        }
        
        // 统计结果
        const totalTests = testSuite.length;
        const successRate = (successCount / totalTests) * 100;
        const avgTime = totalTime / totalTests;
        
        console.log('\n📈 测试统计:');
        console.log('-'.repeat(40));
        console.log(`✅ 成功: ${successCount}/${totalTests}`);
        console.log(`📊 成功率: ${successRate.toFixed(1)}%`);
        console.log(`⏱️  平均耗时: ${avgTime.toFixed(1)}ms`);
        console.log(`💾 缓存命中: ${results.filter(r => r.cached).length}/${totalTests}`);
        
        // 详细结果
        console.log('\n📋 详细结果:');
        console.log('-'.repeat(40));
        results.forEach((result, index) => {
            console.log(`${index + 1}. ${result.name}`);
            if (result.error) {
                console.log(`   ❌ 错误: ${result.error}`);
            } else {
                console.log(`   🎯 结果: ${result.result || '无结果'}`);
                console.log(`   ✅ 预期: ${result.expected}`);
                console.log(`   ⏱️  耗时: ${result.duration}ms`);
                console.log(`   📊 状态: ${result.success ? '✓ 成功' : '✗ 失败'}`);
                if (result.cached) console.log(`   💾 缓存命中`);
            }
            console.log('   ---');
        });
        
        // 服务状态报告
        console.log('\n🔧 服务状态报告:');
        console.log('-'.repeat(40));
        const status = apiService.getStatus();
        console.log(`🌐 API服务: ${status.enabled ? '✅ 启用' : '❌ 禁用'}`);
        console.log(`🔑 API密钥: ${status.hasKey ? '✅ 已设置' : '❌ 未设置'}`);
        console.log(`📦 本地存档: ${status.archiveSize} 条记录`);
        console.log(`💾 缓存大小: ${status.cacheSize} 条记录`);
        console.log(`🔢 总搜索次数: ${status.totalSearches}`);
        console.log(`🏠 本地命中: ${status.localHits}`);
        console.log(`🌐 API命中: ${status.apiHits}`);
        console.log(`❌ 失败搜索: ${status.failedSearches}`);
        
        // 性能评估
        console.log('\n🚀 性能评估:');
        console.log('-'.repeat(40));
        if (avgTime < 50) {
            console.log('⭐ 性能优秀: 平均响应时间 < 50ms');
        } else if (avgTime < 100) {
            console.log('👍 性能良好: 平均响应时间 < 100ms');
        } else {
            console.log('⚠️  性能一般: 平均响应时间 > 100ms');
        }
        
        if (successRate >= 80) {
            console.log('🎯 准确率优秀: 成功率 > 80%');
        } else if (successRate >= 60) {
            console.log('✅ 准确率良好: 成功率 > 60%');
        } else {
            console.log('❌ 准确率不足: 成功率 < 60%');
        }
        
        // 最终建议
        console.log('\n💡 改进建议:');
        console.log('-'.repeat(40));
        if (successRate < 60) {
            console.log('1. 🔧 优化题目检测算法');
            console.log('2. 📚 扩展本地题库');
            console.log('3. 🌐 配置更多API服务');
        }
        
        if (avgTime > 100) {
            console.log('4. ⚡ 优化API请求性能');
            console.log('5. 💾 增加缓存命中率');
        }
        
        if (status.archiveSize < 10) {
            console.log('6. 💾 丰富本地存档内容');
        }
        
        console.log('\n🎉 集成测试完成！');
        console.log('='.repeat(60));
        
        return {
            success: true,
            stats: {
                totalTests: totalTests,
                successCount: successCount,
                successRate: successRate,
                avgTime: avgTime,
                totalSearches: status.totalSearches,
                localHits: status.localHits,
                apiHits: status.apiHits
            },
            results: results
        };
        
    } catch (error) {
        console.error('❌ 集成测试失败:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// 运行测试
if (require.main === module) {
    runIntegrationTest().then(result => {
        if (result.success) {
            console.log('✅ 所有测试完成！');
            process.exit(0);
        } else {
            console.log('❌ 测试失败');
            process.exit(1);
        }
    }).catch(error => {
        console.error('❌ 测试执行错误:', error);
        process.exit(1);
    });
}

module.exports = { runIntegrationTest };