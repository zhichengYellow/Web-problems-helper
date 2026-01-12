// 调试API调用过程
const { HunyuanService } = require('./hunyuan-service.js');

async function debugAPICall() {
  const service = new HunyuanService();
  
  // 等待配置加载完成
  await new Promise(resolve => setTimeout(resolve, 500));
  
  console.log('🔍 调试API调用过程');
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
    
    // 直接调用callHunyuanLite方法，避免searchAnswer的复杂逻辑
    const prompt = service.buildAnswerPrompt(testQuestion, '选择题', testOptions);
    console.log('Prompt:', prompt);
    
    // 设置超时
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('API调用超时 (15秒)')), 15000)
    );
    
    const apiPromise = service.callHunyuanLite(prompt, {});
    const result = await Promise.race([apiPromise, timeoutPromise]);
    
    console.log('✅ API调用成功，返回数据:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.log('❌ API调用失败:', error.message);
    console.log('错误详情:', error.stack);
    
    // 如果是无法识别的API响应格式，显示原始响应数据
    if (error.message.includes('无法识别的API响应格式')) {
      console.log('原始响应数据:', error.originalData);
    }
  }
}

debugAPICall().catch(console.error);