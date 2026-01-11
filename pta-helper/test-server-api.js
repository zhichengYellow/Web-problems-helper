// 直接测试服务器API端点
const http = require('http');

async function testServerAPI() {
  console.log('🧪 直接测试服务器API端点');
  
  // 从配置文件读取实际的API密钥
  const config = require('./config.js');
  
  const postData = JSON.stringify({
    secretId: config.secretId,
    secretKey: config.secretKey,
    message: '你好',
    region: 'ap-guangzhou'
  });

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/chat',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': postData.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

testServerAPI()
  .then(result => {
    console.log('✅ 服务器API测试成功:', JSON.stringify(result, null, 2));
  })
  .catch(error => {
    console.log('❌ 服务器API测试失败:', error.message);
  });