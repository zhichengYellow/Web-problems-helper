// 测试配置加载
try {
  const config = require('./config.js');
  console.log('✅ 配置加载成功:');
  console.log('SecretId:', config.secretId ? '已配置' : '未配置');
  console.log('SecretKey:', config.secretKey ? '已配置' : '未配置');
  console.log('Region:', config.region || '未设置');
} catch (error) {
  console.error('❌ 配置加载失败:', error.message);
}