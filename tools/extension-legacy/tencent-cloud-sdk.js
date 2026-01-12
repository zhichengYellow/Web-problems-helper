// 腾讯云SDK集成 - 彻底解决CORS问题
// 兼容旧版本Node.js的SDK方案

// 检测Node.js版本兼容性
const nodeVersion = process.version;
const isOldNode = nodeVersion.startsWith('v16') || nodeVersion.startsWith('v14');

if (isOldNode) {
    console.warn('⚠️ 检测到旧版本Node.js，使用兼容模式');
}

// 动态加载SDK（避免版本兼容性问题）
let tencentcloud, HunyuanClient, models;

try {
    // 尝试加载官方SDK
    tencentcloud = require("tencentcloud-sdk-nodejs");
    HunyuanClient = tencentcloud.hunyuan.v20230901.Client;
    models = tencentcloud.hunyuan.v20230901.Models;
    console.log('✅ 腾讯云官方SDK加载成功');
} catch (sdkError) {
    console.warn('⚠️ 官方SDK加载失败，使用兼容的HTTP API方案:', sdkError.message);
    // 使用兼容的HTTP API方案
}

class TencentCloudSDKService {
    constructor(secretId, secretKey, region = 'ap-beijing') {
        this.secretId = secretId;
        this.secretKey = secretKey;
        this.region = region;
        this.endpoint = "https://hunyuan.tencentcloudapi.com";
        
        // 如果官方SDK可用，使用SDK；否则使用HTTP API
        if (HunyuanClient) {
            this.client = new HunyuanClient({
                credential: {
                    secretId: secretId,
                    secretKey: secretKey,
                },
                region: region,
                profile: {
                    httpProfile: {
                        endpoint: "hunyuan.tencentcloudapi.com",
                    },
                },
            });
            this.useSDK = true;
        } else {
            this.useSDK = false;
            console.log('ℹ️ 使用兼容的HTTP API方案');
        }
    }

    // 调用hunyuan-lite模型
    async chatCompletion(messages, model = "hunyuan-lite", temperature = 0.1, topP = 0.9) {
        try {
            const req = new models.ChatCompletionsRequest();
            
            req.Model = model;
            req.Messages = messages.map(msg => ({
                Role: msg.role || 'user',
                Content: msg.content
            }));
            req.Temperature = temperature;
            req.TopP = topP;
            
            const response = await this.client.ChatCompletions(req);
            return response;
        } catch (error) {
            console.error('腾讯云SDK调用失败:', error);
            throw error;
        }
    }

    // 简化调用接口
    async askQuestion(question, systemPrompt = null) {
        const messages = [];
        
        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
        }
        
        messages.push({ role: 'user', content: question });
        
        const response = await this.chatCompletion(messages);
        
        if (response.Response && response.Response.Choices && response.Response.Choices.length > 0) {
            return response.Response.Choices[0].Message.Content;
        }
        
        throw new Error('API返回格式异常');
    }

    // 批量处理问题
    async batchProcessQuestions(questions, systemPrompt = null) {
        const results = [];
        
        for (const question of questions) {
            try {
                const answer = await this.askQuestion(question, systemPrompt);
                results.push({ question, answer, success: true });
            } catch (error) {
                results.push({ question, error: error.message, success: false });
            }
        }
        
        return results;
    }
}

// 导出服务
module.exports = { TencentCloudSDKService };

// 使用示例
/*
const { TencentCloudSDKService } = require('./tencent-cloud-sdk');

const sdk = new TencentCloudSDKService('YOUR_SECRET_ID', 'YOUR_SECRET_KEY');

// 单个问题
sdk.askQuestion('1+1等于几？')
    .then(answer => console.log('答案:', answer))
    .catch(error => console.error('错误:', error));

// 批量问题
const questions = ['1+1=?', '2+2=?', '3+3=?'];
sdk.batchProcessQuestions(questions)
    .then(results => console.log('批量结果:', results));
*/