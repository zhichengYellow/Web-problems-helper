// 腾讯云hunyuan-lite专用配置文件
// 专门针对hunyuan-lite模型优化的配置

const hunyuanConfig = {
    // 腾讯云API密钥 - 已移至后端服务配置 (.env文件)
    // 前端不再直接持有密钥，提高安全性
    secretId: '',
    secretKey: '',
    
    // 后端服务配置
    backendUrl: 'http://localhost:3001/api/chat',
    useBackend: true,
    
    // hunyuan-lite专用配置
    model: 'hunyuan-lite',  // 指定使用hunyuan-lite模型
    region: 'ap-guangzhou', // 服务区域（推荐）
    version: '2023-09-01',  // API版本
    
    // hunyuan-lite优化参数
    temperature: 0.1,       // 低温度值，确保答案确定性
    topP: 0.9,             // 较高的topP，保持一定的创造性
    maxTokens: 1024,        // 最大输出长度
    
    // 性能优化配置
    timeout: 15000,        // 适当延长超时时间（毫秒）
    retryCount: 2,         // 减少重试次数（避免重复扣费）
    cacheEnabled: true,    // 启用缓存提高性能
    cacheTimeout: 600000,  // 缓存超时时间（10分钟）
    
    // 题目回答优化配置
    examMode: true,        // 考试模式，提供更精确的答案
    conciseAnswer: true,   // 简洁答案模式，直接输出选项
    
    // 费用控制配置
    enableUsageStats: true, // 启用使用统计
    maxMonthlyCalls: 1000   // 每月最大调用次数限制
};

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = hunyuanConfig;
} else {
    window.hunyuanConfig = hunyuanConfig;
}

// hunyuan-lite模型能力说明
/*
hunyuan-lite是腾讯云推出的轻量级大语言模型，特别适合：
1. 选择题和判断题的答案推理
2. 教育类题目的精确回答  
3. 成本敏感的批量题目处理
4. 需要快速响应的实时答题场景

优势：
- 成本低廉：相比标准模型费用降低80%
- 响应快速：平均响应时间<2秒
- 答案精确：针对教育内容优化
- 支持中文：完美支持中文题目和答案
*/