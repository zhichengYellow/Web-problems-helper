// PTA答题助手 - AI服务统一接口
// 修复AIService未定义的问题

class AIService {
    constructor() {
        this.hunyuanService = null;
        this.apiService = null;
        this.isConfigured = false;
        this.currentConfig = null;
        
        this.init();
    }

    async init() {
        try {
            // 动态加载hunyuan-service
            if (typeof HunyuanService !== 'undefined') {
                this.hunyuanService = new HunyuanService();
                console.log('✅ hunyuan-service加载成功');
            }
            
            // 动态加载api-service
            if (typeof APIService !== 'undefined') {
                this.apiService = new APIService();
                console.log('✅ api-service加载成功');
            }
            
            // 尝试从存储加载配置
            await this.loadConfigFromStorage();
            
        } catch (error) {
            console.warn('AI服务初始化警告:', error);
        }
    }

    // 从存储加载配置
    async loadConfigFromStorage() {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                const result = await chrome.storage.local.get(['hunyuanConfig']);
                if (result.hunyuanConfig) {
                    await this.updateConfig(result.hunyuanConfig);
                    console.log('✅ 从存储加载配置成功');
                }
            }
        } catch (error) {
            console.warn('从存储加载配置失败:', error);
        }
    }

    // 更新配置
    async updateConfig(config) {
        this.currentConfig = config;
        
        if (this.hunyuanService && config.secretId && config.secretKey) {
            await this.hunyuanService.init(config);
            this.isConfigured = true;
            console.log('✅ AI服务配置更新成功');
        } else {
            this.isConfigured = false;
            console.warn('⚠️ AI服务配置不完整，将使用本地答案库');
        }
        
        // 保存配置到存储
        if (typeof chrome !== 'undefined' && chrome.storage) {
            try {
                await chrome.storage.local.set({ hunyuanConfig: config });
            } catch (error) {
                console.warn('保存配置到存储失败:', error);
            }
        }
    }

    // 生成答案（主要接口）
    async generateAnswer(question, questionType, options = null) {
        console.log('🤖 AI服务生成答案:', { question, questionType, options });
        
        // 优先使用hunyuan服务
        if (this.isConfigured && this.hunyuanService) {
            try {
                const result = await this.hunyuanService.generateAnswer(question, questionType, options);
                if (result.success) {
                    return {
                        success: true,
                        answer: result.answer,
                        confidence: result.confidence,
                        source: 'hunyuan-lite',
                        reasoning: result.reasoning
                    };
                }
            } catch (error) {
                console.warn('hunyuan服务调用失败:', error);
            }
        }
        
        // 备用方案：使用api-service
        if (this.apiService) {
            try {
                const result = await this.apiService.searchAnswer(question, questionType, options);
                if (result.success) {
                    return {
                        success: true,
                        answer: result.answer,
                        confidence: result.confidence,
                        source: 'api-service',
                        reasoning: result.reasoning
                    };
                }
            } catch (error) {
                console.warn('api-service调用失败:', error);
            }
        }
        
        // 最后使用本地答案库
        return this.getLocalAnswer(question, questionType, options);
    }

    // 本地答案库查询
    getLocalAnswer(question, questionType, options = null) {
        console.log('📚 使用本地答案库查询:', { question, questionType });
        
        // 使用answer-database.js中的答案库
        if (typeof answerDatabase !== 'undefined') {
            const result = answerDatabase.searchAnswer(question, questionType);
            if (result.found) {
                return {
                    success: true,
                    answer: result.answer,
                    confidence: 0.8, // 本地答案库置信度
                    source: 'local-database',
                    reasoning: '从本地答案库匹配'
                };
            }
        }
        
        // 简单规则匹配（备用）
        const simpleAnswer = this.getSimpleRuleAnswer(question, questionType, options);
        if (simpleAnswer) {
            return {
                success: true,
                answer: simpleAnswer,
                confidence: 0.6,
                source: 'rule-based',
                reasoning: '基于简单规则匹配'
            };
        }
        
        return {
            success: false,
            error: '未找到匹配的答案',
            confidence: 0
        };
    }

    // 简单规则匹配
    getSimpleRuleAnswer(question, questionType, options) {
        const lowerQuestion = question.toLowerCase();
        
        // 常见选择题规则
        if (questionType === 'single_choice' || questionType === 'multiple_choice') {
            // 长度规则：通常最长的选项可能是正确答案
            if (options && options.length > 0) {
                const longestOption = options.reduce((longest, current) => 
                    current.text.length > longest.text.length ? current : longest
                );
                return longestOption.value;
            }
            
            // 关键词匹配规则
            if (lowerQuestion.includes('正确') || lowerQuestion.includes('对的')) {
                return 'A';
            }
            if (lowerQuestion.includes('错误') || lowerQuestion.includes('错的')) {
                return 'B';
            }
        }
        
        // 判断题规则
        if (questionType === 'true_false') {
            if (lowerQuestion.includes('正确') || lowerQuestion.includes('是') || 
                lowerQuestion.includes('对') || lowerQuestion.includes('真')) {
                return 'true';
            }
            if (lowerQuestion.includes('错误') || lowerQuestion.includes('不是') || 
                lowerQuestion.includes('错') || lowerQuestion.includes('假')) {
                return 'false';
            }
        }
        
        return null;
    }

    // 测试连接
    async testConnection() {
        if (!this.isConfigured) {
            return {
                success: false,
                error: 'AI服务未配置',
                configured: false
            };
        }
        
        try {
            const testQuestion = "请回答：1+1等于几？只需要回答数字。";
            const result = await this.generateAnswer(testQuestion, 'single_choice', [
                { value: 'A', text: '1' },
                { value: 'B', text: '2' },
                { value: 'C', text: '3' },
                { value: 'D', text: '4' }
            ]);
            
            if (result.success) {
                return {
                    success: true,
                    configured: true,
                    responseTime: result.responseTime,
                    testResult: result
                };
            } else {
                return {
                    success: false,
                    error: result.error || '测试调用失败',
                    configured: true
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message,
                configured: true
            };
        }
    }

    // 获取服务状态
    getStatus() {
        return {
            configured: this.isConfigured,
            hunyuanAvailable: !!this.hunyuanService,
            apiServiceAvailable: !!this.apiService,
            config: this.currentConfig ? {
                hasSecretId: !!this.currentConfig.secretId,
                hasSecretKey: !!this.currentConfig.secretKey,
                model: this.currentConfig.model || 'hunyuan-lite'
            } : null
        };
    }
}

// 全局导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIService;
} else {
    // 浏览器环境
    window.AIService = AIService;
}