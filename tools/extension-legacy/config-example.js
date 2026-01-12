// 腾讯云hunyuan-lite配置示例文件
// 请将本文件复制为 config.js 并填入您的实际密钥

const hunyuanConfig = {
    // 腾讯云API密钥 - 从腾讯云控制台获取
    secretId: '您的腾讯云SecretId',
    secretKey: '您的腾讯云SecretKey',
    
    // API配置
    region: 'ap-guangzhou', // 服务区域
    version: '2023-09-01',  // API版本
    
    // 可选配置
    timeout: 10000,        // 请求超时时间（毫秒）
    retryCount: 3,         // 重试次数
    cacheEnabled: true,    // 启用缓存
    cacheTimeout: 300000   // 缓存超时时间（5分钟）
};

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = hunyuanConfig;
} else {
    window.hunyuanConfig = hunyuanConfig;
}