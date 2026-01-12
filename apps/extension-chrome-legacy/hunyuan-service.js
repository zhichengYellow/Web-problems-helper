// 腾讯云 hunyuan-lite 模型集成服务
// 2026-01：已收敛为“只走本地 Java 后端”模式（默认 http://localhost:3001/api/chat）。
// 目的：避免前端持有密钥、避免浏览器直连腾讯云（CORS + 安全风险）。

class HunyuanService {
    constructor() {
        // 后端请求参数（由 Java 后端负责签名与请求）
        this.config = {
            region: 'ap-guangzhou'
        };
        
        // 缓存设置
        this.cache = new Map();
        this.cacheTimeout = 300000; // 5分钟
        
        this.init();
    }

    async init(config = null) {
        // 如果直接传入后端地址，优先使用
        if (config && config.backendUrl) {
            this.backendUrl = config.backendUrl;
            if (config.region) this.config.region = config.region;
            console.log('✅ 使用传入的后端服务地址:', this.backendUrl);
            return;
        }

        // 浏览器场景下，config.js 可能以脚本形式注入并导出到 window.hunyuanConfig
        try {
            if (typeof window !== 'undefined' && window.hunyuanConfig) {
                const cfg = window.hunyuanConfig;
                // 优先使用后端配置
                if (cfg.useBackend && cfg.backendUrl) {
                    this.backendUrl = cfg.backendUrl;
                    console.log('✅ 使用后端服务地址:', this.backendUrl);
                    return; // 找到后端配置直接返回，不再查找本地密钥
                }
            }
        } catch (e) {
            console.warn('读取 window.hunyuanConfig 失败:', e);
        }

        // 默认使用本地 Java 后端
        this.backendUrl = 'http://localhost:3001/api/chat';
        console.log('✅ 默认使用本地后端服务:', this.backendUrl);
    }

    // 从配置文件加载配置
    async loadFromConfigFile() {
        // 已废弃：不再从前端配置文件加载密钥
        return false;
    }

    // 检查配置是否完整
    isConfigured() {
        // 只要有后端URL，就视为已配置
        return !!this.backendUrl;
    }

    // 设置配置
    async setConfig(secretId, secretKey) {
        // 已禁用：不再支持前端持有密钥
        if (secretId || secretKey) {
            console.warn('⚠️ 已忽略前端密钥配置：当前版本仅支持本地 Java 后端模式');
        }
    }

    // 调用hunyuan-lite模型
    async callHunyuanLite(prompt, options = {}) {
        if (!this.isConfigured()) {
            console.error('❌ 服务未配置: 未找到后端服务地址');
            throw new Error('请确保后端服务已启动');
        }
        
        console.log('🔧 调用hunyuan-lite，使用后端运行模式');

        const cacheKey = this.generateCacheKey(prompt);
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            // 使用专用后端服务避免CORS问题
            const backendURL = this.backendUrl || 'http://localhost:3001/api/chat';
            
            const response = await fetch(backendURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    // 不再发送前端密钥，由后端环境变量控制
                    // secretId: this.secretId,
                    // secretKey: this.secretKey,
                    message: prompt,
                    options: options,
                    region: this.config.region
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${await response.text()}`);
            }

            const result = await response.json();
            
            if (result.success) {
                const processedResult = this.processResponse(result.data);
                this.addToCache(cacheKey, processedResult);
                return processedResult;
            } else {
                // 直接抛出错误，不要缓存错误结果
                throw new Error(result.error || '后端服务请求失败');
            }

        } catch (error) {
            console.error('调用hunyuan-lite失败:', error);

            // 只保留后端模式：后端不可用时给出明确提示
            if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
                throw new Error(`后端服务不可用：请在 IDEA 启动 Java 后端并确保可访问 (${this.backendUrl})`);
            }

            throw error;
        }
    }

    // 处理题目答案查询（带重试和置信度评估）
    async searchAnswer(questionText, questionType, options = [], maxRetries = 2) {
        const prompt = this.buildAnswerPrompt(questionText, questionType, options);
        
        let bestAnswer = null;
        let highestConfidence = 0;
        let retryCount = 0;

        while (retryCount <= maxRetries) {
            try {
                const response = await this.callHunyuanLite(prompt, {
                    Temperature: retryCount > 0 ? 0.3 : 0.1, // 重试时稍微增加随机性
                    TopP: 0.9
                });

                const result = this.extractAnswerFromResponse(response, questionType, options);
                
                // 评估答案质量
                const confidence = this.evaluateAnswerConfidence(result, questionType, options, response);
                
                console.log(`📊 答案评估: ${result}, 置信度: ${confidence.toFixed(2)}`);
                
                // 如果置信度足够高，直接返回
                if (confidence >= 0.8) {
                    return result;
                }
                
                // 记录最佳答案
                if (confidence > highestConfidence) {
                    bestAnswer = result;
                    highestConfidence = confidence;
                }
                
                // 如果置信度太低且还有重试机会，继续重试
                if (confidence < 0.6 && retryCount < maxRetries) {
                    console.log(`🔄 置信度过低(${confidence.toFixed(2)}), 进行第${retryCount + 1}次重试`);
                    retryCount++;
                    await new Promise(resolve => setTimeout(resolve, 500)); // 添加小延迟
                    continue;
                }
                
                break;

            } catch (error) {
                console.error(`❌ 第${retryCount + 1}次尝试失败:`, error);
                if (retryCount < maxRetries) {
                    retryCount++;
                    await new Promise(resolve => setTimeout(resolve, 1000)); // 错误后等待更久
                    continue;
                }
                break;
            }
        }

        console.log(`🏁 最终选择: ${bestAnswer}, 最高置信度: ${highestConfidence.toFixed(2)}`);
        
        // 显式打印答案到控制台，方便用户查看
        if (bestAnswer) {
            console.log('%c🔍 找到的答案:', 'color: #2196F3; font-weight: bold; font-size: 14px;');
            console.log(bestAnswer);
            console.log('%c-----------------------------------', 'color: #ccc;');
        }
        
        return bestAnswer;
    }

    // 评估答案置信度
    evaluateAnswerConfidence(answer, questionType, options, response) {
        if (!answer) return 0;
        
        let confidence = 0.5; // 基础置信度
        
        // 选择题置信度评估
        if (questionType === 'single_choice' || questionType === 'multiple_choice') {
            // 格式正确性检查
            if (answer.includes(',')) {
                // 多选题：检查所有选项是否有效
                const answers = answer.split(',');
                const validCount = answers.filter(a => options.some(opt => opt.value === a)).length;
                confidence = validCount / answers.length * 0.8;
            } else {
                // 单选题：检查是否为有效选项
                const isValid = options.some(opt => opt.value === answer);
                confidence = isValid ? 0.8 : 0.3;
            }
            
            // 响应长度检查（太长的响应可能包含解释，降低置信度）
            const content = response.choices[0].message.content;
            if (content.length > 100) {
                confidence *= 0.7;
            }
        }
        
        // 判断题置信度评估
        else if (questionType === 'true_false') {
            const exactMatch = answer === '正确' || answer === '错误';
            confidence = exactMatch ? 0.9 : 0.6;
        }
        
        // 其他题型
        else {
            // 根据响应长度和确定性评估
            const content = response.choices[0].message.content;
            if (content.length < 50 && !content.includes('?')) {
                confidence = 0.7;
            }
        }
        
        return Math.min(Math.max(confidence, 0), 1); // 确保在0-1范围内
    }

    // 构建答案查询提示词（优化版）
    buildAnswerPrompt(questionText, questionType, options) {
        let prompt = `请仔细分析以下题目并给出最准确的答案：\n\n题目：${questionText}\n\n`;
        
        if (questionType === 'single_choice' || questionType === 'multiple_choice') {
            prompt += `选项：\n`;
            options.forEach((opt, index) => {
                prompt += `${String.fromCharCode(65 + index)}. ${opt.text}\n`;
            });
            prompt += `\n重要要求：
1. 请直接给出选项字母（如"A"或"A,B,C"）
2. 如果是单选题，只选一个最正确的答案
3. 如果是多选题，选择所有正确的选项
4. 不要添加任何解释或额外文字
5. 确保答案格式正确，便于机器识别`;
        } else if (questionType === 'true_false') {
            prompt += `请严格回答"正确"或"错误"，不要使用其他表述。`;
        } else {
            prompt += `请直接给出最准确的答案，保持简洁。`;
        }

        return prompt;
    }

    // 从响应中提取答案（优化版）
    extractAnswerFromResponse(response, questionType, options) {
        if (!response || !response.choices || response.choices.length === 0) {
            return null;
        }

        const content = response.choices[0].message.content.trim();
        console.log('🔍 原始AI响应:', content);
        
        // 处理选择题
        if (questionType === 'single_choice' || questionType === 'multiple_choice') {
            let extractedAnswer = null;
            let confidence = 0;
            
            // 方法1: 精确匹配选项字母（最高置信度）
            const optionMatch = content.match(/\b([A-Z])(?:\s*,\s*([A-Z]))*\b/);
            if (optionMatch) {
                const letters = optionMatch[0].split(/\s*,\s*/).filter(l => /^[A-Z]$/.test(l));
                if (letters.length > 0) {
                    const validOptions = letters.map(letter => {
                        const index = letter.charCodeAt(0) - 65;
                        return index >= 0 && index < options.length ? options[index]?.value : null;
                    }).filter(Boolean);
                    
                    if (validOptions.length > 0) {
                        extractedAnswer = validOptions.join(',');
                        confidence = 0.9;
                        console.log(`✅ 字母匹配成功: ${extractedAnswer}, 置信度: ${confidence}`);
                    }
                }
            }
            
            // 方法2: 括号内字母匹配（较高置信度）
            if (!extractedAnswer) {
                const bracketMatch = content.match(/[（(]([A-Z])[）)]/);
                if (bracketMatch) {
                    const letter = bracketMatch[1];
                    const index = letter.charCodeAt(0) - 65;
                    if (index >= 0 && index < options.length) {
                        extractedAnswer = options[index]?.value;
                        confidence = 0.8;
                        console.log(`✅ 括号匹配成功: ${extractedAnswer}, 置信度: ${confidence}`);
                    }
                }
            }
            
            // 方法3: 选项文本精确匹配（中等置信度）
            if (!extractedAnswer) {
                for (const option of options) {
                    // 精确匹配选项文本（避免部分匹配）
                    const exactMatch = new RegExp(`\\b${option.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
                    if (exactMatch.test(content)) {
                        extractedAnswer = option.value;
                        confidence = 0.7;
                        console.log(`✅ 文本精确匹配: ${extractedAnswer}, 置信度: ${confidence}`);
                        break;
                    }
                }
            }
            
            // 方法4: 选项文本包含匹配（较低置信度）
            if (!extractedAnswer) {
                for (const option of options) {
                    if (content.includes(option.text)) {
                        extractedAnswer = option.value;
                        confidence = 0.5;
                        console.log(`⚠️ 文本包含匹配: ${extractedAnswer}, 置信度: ${confidence}`);
                        break;
                    }
                }
            }
            
            // 方法5: 数字索引匹配（如"第一个选项"）
            if (!extractedAnswer) {
                const numberMatch = content.match(/(?:第)?([一二三四五六七八九十1234567890]+)(?:个?选项)?/);
                if (numberMatch) {
                    let num = parseInt(numberMatch[1]) || 
                             (['一','二','三','四','五','六','七','八','九','十'].indexOf(numberMatch[1]) + 1);
                    if (num > 0 && num <= options.length) {
                        extractedAnswer = options[num - 1]?.value;
                        confidence = 0.6;
                        console.log(`✅ 数字索引匹配: ${extractedAnswer}, 置信度: ${confidence}`);
                    }
                }
            }
            
            // 如果置信度较低，可以触发重试或返回null
            if (extractedAnswer && confidence < 0.6) {
                console.log(`⚠️ 低置信度答案: ${extractedAnswer}, 建议重试`);
                // 可以在这里添加重试逻辑
            }
            
            return extractedAnswer || content;
        }

        // 处理判断题
        if (questionType === 'true_false') {
            // 精确匹配
            if (/^正确$/.test(content) || /^对$/.test(content) || content === 'true') {
                return '正确';
            }
            if (/^错误$/.test(content) || /^错$/.test(content) || content === 'false') {
                return '错误';
            }
            
            // 包含匹配
            if (content.includes('正确') || content.includes('对') || content.includes('是') || content.includes('true')) {
                return '正确';
            }
            if (content.includes('错误') || content.includes('错') || content.includes('否') || content.includes('false')) {
                return '错误';
            }
            
            return content;
        }

        // 其他题型直接返回内容
        return content;
    }

    // 处理API响应（支持多种响应格式）
    processResponse(data) {
        // 首先检查是否是错误响应
        if (data.Response && data.Response.Error) {
            const error = data.Response.Error;
            throw new Error(`API错误: ${error.Message} (代码: ${error.Code})`);
        }
        
        // 格式1: 腾讯云标准响应格式（Response.Choices）
        if (data.Response && data.Response.Choices) {
            return {
                choices: data.Response.Choices.map(choice => ({
                    message: {
                        role: choice.Message.Role,
                        content: choice.Message.Content
                    },
                    finish_reason: choice.FinishReason
                })),
                usage: data.Response.Usage ? {
                    prompt_tokens: data.Response.Usage.PromptTokens,
                    completion_tokens: data.Response.Usage.CompletionTokens,
                    total_tokens: data.Response.Usage.TotalTokens
                } : null
            };
        }
        
        // 格式1b: 腾讯云标准响应格式变体（Response.Choices[0].Message）
        if (data.Response && data.Response.Choices && data.Response.Choices[0] && data.Response.Choices[0].Message) {
            return {
                choices: data.Response.Choices.map(choice => ({
                    message: {
                        role: choice.Message.Role || 'assistant',
                        content: choice.Message.Content || ''
                    },
                    finish_reason: choice.FinishReason || 'stop'
                })),
                usage: data.Response.Usage ? {
                    prompt_tokens: data.Response.Usage.PromptTokens || 0,
                    completion_tokens: data.Response.Usage.CompletionTokens || 0,
                    total_tokens: data.Response.Usage.TotalTokens || 0
                } : null
            };
        }
        
        // 格式1c: 腾讯云标准响应格式变体（Response.Choices[0].message）
        if (data.Response && data.Response.Choices && data.Response.Choices[0] && data.Response.Choices[0].message) {
            return {
                choices: data.Response.Choices.map(choice => ({
                    message: {
                        role: choice.message?.role || 'assistant',
                        content: choice.message?.content || ''
                    },
                    finish_reason: choice.finish_reason || 'stop'
                })),
                usage: data.Response.Usage ? {
                    prompt_tokens: data.Response.Usage.PromptTokens || 0,
                    completion_tokens: data.Response.Usage.CompletionTokens || 0,
                    total_tokens: data.Response.Usage.TotalTokens || 0
                } : null
            };
        }
        
        // 格式1d: 腾讯云标准响应格式变体（Response.choices）
        if (data.Response && data.Response.choices) {
            return {
                choices: data.Response.choices.map(choice => ({
                    message: {
                        role: choice.message?.role || 'assistant',
                        content: choice.message?.content || choice.content || ''
                    },
                    finish_reason: choice.finish_reason || 'stop'
                })),
                usage: data.Response.usage || null
            };
        }
        
        // 格式1e: 腾讯云标准响应格式变体（Response.choices[0].message）
        if (data.Response && data.Response.choices && data.Response.choices[0] && data.Response.choices[0].message) {
            return {
                choices: data.Response.choices.map(choice => ({
                    message: {
                        role: choice.message?.role || 'assistant',
                        content: choice.message?.content || ''
                    },
                    finish_reason: choice.finish_reason || 'stop'
                })),
                usage: data.Response.usage || null
            };
        }
        
        // 格式1f: 腾讯云标准响应格式变体（Response.choices[0].Message）
        if (data.Response && data.Response.choices && data.Response.choices[0] && data.Response.choices[0].Message) {
            return {
                choices: data.Response.choices.map(choice => ({
                    message: {
                        role: choice.Message?.Role || 'assistant',
                        content: choice.Message?.Content || ''
                    },
                    finish_reason: choice.FinishReason || 'stop'
                })),
                usage: data.Response.usage || null
            };
        }
        
        // 格式1g: 腾讯云标准响应格式变体（Response对象直接包含内容）
        if (data.Response && typeof data.Response === 'object') {
            // 尝试从Response对象中提取可能的响应格式
            const response = data.Response;
            
            // 检查是否有content字段
            if (response.Content) {
                return {
                    choices: [{
                        message: {
                            role: 'assistant',
                            content: response.Content
                        },
                        finish_reason: 'stop'
                    }],
                    usage: response.Usage || null
                };
            }
            
            // 检查是否有Message字段
            if (response.Message) {
                return {
                    choices: [{
                        message: {
                            role: response.Message.Role || 'assistant',
                            content: response.Message.Content || ''
                        },
                        finish_reason: response.FinishReason || 'stop'
                    }],
                    usage: response.Usage || null
                };
            }
            
            // 检查是否有choices字段
            if (response.choices && Array.isArray(response.choices)) {
                return {
                    choices: response.choices.map(choice => ({
                        message: {
                            role: choice.message?.role || 'assistant',
                            content: choice.message?.content || choice.content || ''
                        },
                        finish_reason: choice.finish_reason || 'stop'
                    })),
                    usage: response.usage || null
                };
            }
            
            // 检查是否有Choices字段（腾讯云标准格式）
            if (response.Choices && Array.isArray(response.Choices)) {
                return {
                    choices: response.Choices.map(choice => ({
                        message: {
                            role: choice.Message?.Role || 'assistant',
                            content: choice.Message?.Content || ''
                        },
                        finish_reason: choice.FinishReason || 'stop'
                    })),
                    usage: response.Usage || null
                };
            }
            
            // 检查是否有Message字段（腾讯云标准格式变体）
            if (response.Message && typeof response.Message === 'object') {
                return {
                    choices: [{
                        message: {
                            role: response.Message.Role || 'assistant',
                            content: response.Message.Content || ''
                        },
                        finish_reason: response.FinishReason || 'stop'
                    }],
                    usage: response.Usage || null
                };
            }
        }
        
        // 格式1h: 后端服务返回的包装格式（data.data包含腾讯云响应）
        if (data.data && data.data.Response) {
            return this.processResponse(data.data);
        }
        
        // 格式1i: 后端服务返回的成功格式
        if (data.success === true && data.data) {
            return this.processResponse(data.data);
        }
        
        // 格式1j: 腾讯云错误响应格式
        if (data.Response && data.Response.Error) {
            // 对于错误响应，返回一个包含错误信息的标准格式
            return {
                choices: [{
                    message: {
                        role: 'assistant',
                        content: `API错误: ${data.Response.Error.Message || '未知错误'} (代码: ${data.Response.Error.Code || '未知'})`
                    },
                    finish_reason: 'error'
                }],
                usage: null,
                error: data.Response.Error
            };
        }
        
        // 格式1k: 后端服务错误格式
        if (data.success === false && data.error) {
            return {
                choices: [{
                    message: {
                        role: 'assistant',
                        content: `后端错误: ${data.error}`
                    },
                    finish_reason: 'error'
                }],
                usage: null,
                error: data
            };
        }
        
        // 格式2: 直接choices格式（后端服务可能返回的格式）
        if (data.choices && Array.isArray(data.choices)) {
            return {
                choices: data.choices.map(choice => ({
                    message: {
                        role: choice.message?.role || 'assistant',
                        content: choice.message?.content || choice.content || ''
                    },
                    finish_reason: choice.finish_reason || 'stop'
                })),
                usage: data.usage || null
            };
        }
        
        // 格式3: 简化的响应格式
        if (data.content || data.message) {
            return {
                choices: [{
                    message: {
                        role: 'assistant',
                        content: data.content || data.message || ''
                    },
                    finish_reason: 'stop'
                }],
                usage: null
            };
        }
        
        // 格式4: 字符串格式的直接响应
        if (typeof data === 'string') {
            return {
                choices: [{
                    message: {
                        role: 'assistant',
                        content: data
                    },
                    finish_reason: 'stop'
                }],
                usage: null
            };
        }
        
        console.warn('无法识别的API响应格式:', data);
        throw new Error('无效的API响应格式');
    }

    // 缓存管理
    generateCacheKey(prompt) {
        return prompt.toLowerCase().replace(/\s+/g, ' ').trim();
    }

    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.value;
        }
        return null;
    }

    addToCache(key, value) {
        this.cache.set(key, {
            value: value,
            timestamp: Date.now()
        });
    }

    clearCache() {
        this.cache.clear();
    }

    // 获取使用统计
    getUsageStats() {
        return {
            cacheSize: this.cache.size,
            isConfigured: this.isConfigured()
        };
    }

}

// 创建全局实例
const hunyuanService = new HunyuanService();

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HunyuanService, hunyuanService };
} else if (typeof window !== 'undefined') {
    window.HunyuanService = HunyuanService;
    window.hunyuanService = hunyuanService;
}