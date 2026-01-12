// 测试完整的API调用流程
const { HunyuanService } = require('./hunyuan-service.js');

async function testAPICall() {
  const service = new HunyuanService();
  
  // 等待配置加载完成
  await new Promise(resolve => setTimeout(resolve, 200));
  
  console.log('🧪 测试API调用流程');
  console.log('SecretId:', service.secretId ? '已配置' : '未配置');
  console.log('SecretKey:', service.secretKey ? '已配置' : '未配置');
  
  if (!service.secretId || !service.secretKey) {
    console.log('❌ API密钥未配置，无法测试');
    return;
  }
  
  // 测试简单的API调用
  try {
    console.log('📡 尝试调用后端API...');
    
    // 使用一个简单的测试题目
    const testQuestion = '下列函数的时间复杂度是（     ）。[2017-1]';
    const testOptions = ['O(1)', 'O(n)', 'O(n²)', 'O(log n)'];
    
    const result = await service.searchAnswer(testQuestion, '选择题', testOptions, 0);
    
    console.log('✅ API调用成功');
    console.log('问题:', testQuestion);
    console.log('答案:', result.answer);
    console.log('置信度:', result.confidence);
    
  } catch (error) {
    console.log('❌ API调用失败:', error.message);
    console.log('错误详情:', error.stack);
  }
}

testAPICall().catch(console.error);