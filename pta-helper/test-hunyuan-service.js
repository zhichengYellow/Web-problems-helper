// 测试hunyuan-service配置加载
const { HunyuanService } = require('./hunyuan-service.js');

async function testConfigLoading() {
  const service = new HunyuanService();
  
  // 等待配置加载完成
  await new Promise(resolve => setTimeout(resolve, 100));
  
  console.log('配置加载测试:');
  console.log('SecretId:', service.secretId ? '已配置' : '未配置');
  console.log('SecretKey:', service.secretKey ? '已配置' : '未配置');
  console.log('Region:', service.config.region);
  
  if (service.secretId && service.secretKey) {
    console.log('✅ hunyuan-service配置加载成功');
  } else {
    console.log('❌ hunyuan-service配置加载失败');
  }
}

testConfigLoading().catch(console.error);