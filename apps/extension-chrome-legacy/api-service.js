// Web 题目助手 - API服务模块（修复版）
// 支持免费稳定的外部API和本地存档

class APIService {
    constructor() {
        // 加载hunyuan服务
        this.hunyuanService = null;
        this.loadHunyuanService();
        
        // 优化后的API服务配置 - 以本地 Java 后端（转发 hunyuan-lite）为主，其他API为辅
        this.defaultAPIs = {
            'hunyuan-lite': {
                name: '本地 Java 后端（hunyuan-lite）',
                baseURL: 'http://localhost:3001/api/chat',
                endpoints: {
                    search: '/api/chat'
                },
                authType: 'backend',
                description: '本地 Java 后端统一转发（后端负责签名与调用腾讯云）；前端不再配置 SecretId/SecretKey',
                free: false,
                rateLimit: 100,        // 适当提高限制
                corsSupported: true,
                priority: 1,           // 最高优先级
                params: {
                    Model: 'hunyuan-lite',
                    Temperature: 0.1,
                    TopP: 0.9,
                    Stream: false
                }
            },
            'zhixun-api': {
                name: '知寻题库API（备用）',
                baseURL: 'https://api.wkexam.com/api/question',
                endpoints: {
                    search: '/search'
                },
                authType: 'token',
                description: '知寻题库API - 备用API，当hunyuan-lite不可用时使用',
                free: true,
                rateLimit: 50,        // 降低限制，作为备用
                corsSupported: false,
                priority: 2,          // 第二优先级
                token: 'qqqqq',
                params: {
                    token: 'qqqqq'
                }
            },
            'wikipedia-api': {
                name: 'Wikipedia摘要API（补充）',
                baseURL: 'https://en.wikipedia.org/w/api.php',
                endpoints: {
                    search: '',
                    extract: ''
                },
                authType: 'none',
                description: '维基百科内容API - 补充知识来源',
                free: true,
                rateLimit: 100,       // 降低限制
                corsSupported: true,
                priority: 3,           // 第三优先级
                params: {
                    action: 'query',
                    format: 'json',
                    prop: 'extracts',
                    exintro: true,
                    explaintext: true,
                    origin: '*'
                }
            },
            'duckduckgo-api': {
                name: 'DuckDuckGo即时答案（补充）',
                baseURL: 'https://api.duckduckgo.com',
                endpoints: {
                    search: '/'
                },
                authType: 'none',
                description: 'DuckDuckGo即时答案API - 补充信息来源',
                free: true,
                rateLimit: 100,        // 降低限制
                corsSupported: true,
                priority: 4,           // 最低优先级
                params: {
                    format: 'json',
                    no_html: 1,
                    skip_disambig: 1
                }
            }
        };
        
        // 设置默认API为本地 Java 后端（主要API）
        this.currentAPI = 'hunyuan-lite';
        this.baseURL = this.defaultAPIs['hunyuan-lite'].baseURL;
        this.apiKey = ''; // 已不再需要（保留字段仅为兼容旧配置）

        // 本地存储配置
        this.localArchive = new Map();
        this.archiveLimit = 1000;
        this.syncEnabled = true;
        this.usageStats = {
            totalSearches: 0,
            localHits: 0,
            apiHits: 0,
            failedSearches: 0,
            lastReset: Date.now()
        };

        this.cache = new Map();
        this.cacheTimeout = 300000;
        this.isEnabled = true;
        this.fallbackEnabled = true;

        this.init();
    }

    async init() {
        try {
            // 检查是否在Chrome扩展环境中且上下文有效
            const isChromeExtensionValid = typeof chrome !== 'undefined' && 
                                         chrome.storage && 
                                         chrome.storage.local;
            
            if (isChromeExtensionValid) {
                try {
                    const [config, archive, stats] = await Promise.all([
                        chrome.storage.local.get(['apiConfig']),
                        chrome.storage.local.get(['questionArchive']),
                        chrome.storage.local.get(['usageStats'])
                    ]);

                    // 加载配置
                    if (config.apiConfig) {
                        this.updateConfig(config.apiConfig);
                    }

                    // 加载本地存档
                    if (archive.questionArchive) {
                        this.localArchive = new Map(archive.questionArchive);
                    }

                    // 加载使用统计
                    if (stats.usageStats) {
                        this.usageStats = stats.usageStats;
                    }
                    
                    console.log('✅ API服务初始化完成（Chrome扩展环境）');
                    
                } catch (chromeError) {
                    console.warn('Chrome存储访问失败，使用备用存储:', chromeError);
                    this.loadFromLocalStorage();
                }
            } else {
                // 浏览器环境或扩展上下文无效时使用localStorage
                console.log('🌐 API服务初始化（使用备用存储）');
                this.loadFromLocalStorage();
            }

            this.startAutoSave();
        } catch (error) {
            console.error('API服务初始化失败:', error);
            // 初始化失败时使用空配置继续运行
            this.localArchive = new Map();
            this.usageStats = {
                totalSearches: 0,
                localHits: 0,
                apiHits: 0,
                failedSearches: 0,
                lastReset: Date.now()
            };
        }
    }

    // 搜索题目答案（双向查找 - 优化版）
    async searchAnswer(questionText, questionType, options = []) {
        this.usageStats.totalSearches++;

        // 1. 检查缓存
        const cacheKey = this.generateCacheKey(questionText, questionType);
        const cachedResult = this.getFromCache(cacheKey);
        if (cachedResult) {
            this.usageStats.cacheHits = (this.usageStats.cacheHits || 0) + 1;
            return this.processAnswerForOptions(cachedResult, options);
        }

        // 2. 检查本地存档
        const localResult = this.searchLocalArchive(questionText, questionType, options);
        if (localResult) {
            this.usageStats.localHits++;
            this.addToCache(cacheKey, localResult);
            return localResult;
        }

        // 3. API搜索
        try {
            const apiConfig = this.defaultAPIs[this.currentAPI];
            
            // 特殊处理hunyuan-lite API
            if (this.currentAPI === 'hunyuan-lite') {
                const hunyuanResult = await this.searchWithHunyuanLite(questionText, questionType, options);
                if (hunyuanResult) {
                    this.usageStats.apiHits++;
                    this.addToCache(cacheKey, hunyuanResult);
                    this.addToLocalArchive(questionText, questionType, options, hunyuanResult);
                    return hunyuanResult;
                }
            } else {
                // 其他API的正常处理
                let apiParams = {};
                
                // 根据不同API构建参数
                switch (this.currentAPI) {
                    case 'zhixun-api':
                        // 知寻题库API参数
                        apiParams = { 
                            ...apiConfig.params,
                            q: encodeURIComponent(questionText.trim())
                        };
                        break;
                    case 'wikipedia-api':
                        apiParams = { ...apiConfig.params, titles: questionText };
                        break;
                    case 'duckduckgo-api':
                        apiParams = { ...apiConfig.params, q: questionText };
                        break;
                }

                const response = await this.makeAPIRequest(apiConfig.endpoints.search, {
                    method: 'GET',
                    params: apiParams
                });

                if (response) {
                    const apiAnswer = response.answer;
                    if (apiAnswer) {
                        this.usageStats.apiHits++;
                        
                        // 处理API返回的答案
                        const processedAnswer = this.processAPIAnswerForOptions(apiAnswer, options, questionType);
                        if (processedAnswer) {
                            this.addToCache(cacheKey, processedAnswer);
                            this.addToLocalArchive(questionText, questionType, options, processedAnswer);
                            return processedAnswer;
                        }
                    }
                }
            }
        } catch (error) {
            console.error('API搜索失败:', error);
            this.usageStats.failedSearches++;
        }

        // 4. 智能回退方案
        if (this.fallbackEnabled) {
            const fallbackResult = this.tryFallbackSearch(questionText, questionType, options);
            if (fallbackResult) {
                this.addToLocalArchive(questionText, questionType, options, fallbackResult);
                return fallbackResult;
            }
            
            // 5. 本地智能答案生成（最终回退）
            const localAnswer = this.generateLocalAnswer(questionText, questionType, options);
            if (localAnswer) {
                console.log('✅ 本地智能生成答案成功');
                this.addToLocalArchive(questionText, questionType, options, localAnswer);
                return localAnswer;
            }
        }

        this.usageStats.failedSearches++;
        return null;
    }

    // 处理API答案以匹配选项
    processAPIAnswerForOptions(apiAnswer, options, questionType) {
        if (!apiAnswer) return null;
        
        const answerText = apiAnswer.toString().toLowerCase().trim();
        
        // 对于选择题，尝试匹配选项
        if (questionType === 'single_choice' || questionType === 'multiple_choice') {
            // 1. 直接匹配选项文本
            for (const option of options) {
                if (option.text && answerText.includes(option.text.toLowerCase())) {
                    return option.value;
                }
            }
            
            // 2. 匹配选项值（A、B、C、D等）
            const optionLetters = ['a', 'b', 'c', 'd', 'e', 'f'];
            for (let i = 0; i < optionLetters.length; i++) {
                if (answerText.includes(optionLetters[i])) {
                    const matchingOption = options[i];
                    if (matchingOption) return matchingOption.value;
                }
            }
            
            // 3. 匹配数字索引
            for (let i = 0; i < options.length; i++) {
                if (answerText.includes((i + 1).toString())) {
                    return options[i].value;
                }
            }
        }
        
        // 对于判断题
        if (questionType === 'true_false') {
            if (answerText.includes('正确') || answerText.includes('对') || answerText.includes('true')) {
                return '正确';
            }
            if (answerText.includes('错误') || answerText.includes('错') || answerText.includes('false')) {
                return '错误';
            }
        }
        
        return null;
    }

    // 处理答案以匹配选项
    processAnswerForOptions(answer, options) {
        if (!answer) return null;
        
        // 如果答案已经是选项值，直接返回
        if (options.some(opt => opt.value === answer)) {
            return answer;
        }
        
        // 尝试匹配选项文本
        const matchingOption = options.find(opt => 
            opt.text && answer.toString().toLowerCase().includes(opt.text.toLowerCase())
        );
        
        return matchingOption ? matchingOption.value : answer;
    }

    // 搜索本地存档
    searchLocalArchive(questionText, questionType, options = []) {
        if (this.localArchive.size === 0) return null;

        const searchKey = this.generateSearchKey(questionText);
        const normalizedText = this.normalizeQuestionText(questionText);

        // 精确匹配
        for (const [key, entry] of this.localArchive) {
            if (key === searchKey) {
                return this.processArchiveAnswer(entry, questionType, options);
            }
        }

        // 模糊匹配
        for (const [key, entry] of this.localArchive) {
            const similarity = this.calculateSimilarity(normalizedText, key);
            if (similarity > 0.8) {
                return this.processArchiveAnswer(entry, questionType, options);
            }
        }

        return null;
    }

    // 添加到本地存档
    addToLocalArchive(questionText, questionType, options, answer) {
        if (this.localArchive.size >= this.archiveLimit) {
            const oldestKey = Array.from(this.localArchive.keys())[0];
            this.localArchive.delete(oldestKey);
        }

        const archiveKey = this.generateSearchKey(questionText);
        const archiveEntry = {
            question: questionText,
            type: questionType,
            options: options.map(opt => ({ text: opt.text, value: opt.value })),
            answer: answer,
            timestamp: Date.now(),
            source: 'api'
        };

        this.localArchive.set(archiveKey, archiveEntry);
        this.saveData();
    }

    // 智能回退搜索
    tryFallbackSearch(questionText, questionType, options) {
        // 启发式规则
        if (questionType === 'single_choice' && options.length > 0) {
            // 优先选择包含特定关键词的选项
            const comprehensiveOption = options.find(opt => 
                opt.text && (
                    opt.text.includes('全部') || 
                    opt.text.includes('都是') || 
                    opt.text.includes('以上')
                )
            );
            if (comprehensiveOption) return comprehensiveOption.value;

            // 选择最长的选项
            const longestOption = options.reduce((prev, current) => 
                (current.text?.length || 0) > (prev.text?.length || 0) ? current : prev
            );
            if (longestOption.text && longestOption.text.length > 10) {
                return longestOption.value;
            }

            return options[0]?.value;
        }

        if (questionType === 'true_false') {
            const questionTextLower = questionText.toLowerCase();
            const negativeWords = ['不', '错', '非', '没', '无', '不是', '不会', '不能'];
            const hasNegative = negativeWords.some(word => questionTextLower.includes(word));
            return hasNegative ? '错误' : '正确';
        }

        return null;
    }

    // 本地智能答案生成（最终回退方案）
    generateLocalAnswer(questionText, questionType, options = []) {
        console.log('🧠 本地智能生成答案:', questionText.substring(0, 50) + '...');
        
        // 选择题智能逻辑
        if (questionType === 'single_choice' && options.length > 0) {
            // 1. 关键词匹配
            const questionLower = questionText.toLowerCase();
            
            // 常见正确答案模式
            const correctPatterns = [
                // 数据结构相关
                { pattern: /(线性结构|顺序结构)/, value: 'A' },
                { pattern: /(树形结构|二叉树)/, value: 'B' },
                { pattern: /(图形结构|图)/, value: 'C' },
                { pattern: /(存储结构|物理结构)/, value: 'B' },
                { pattern: /(逻辑结构)/, value: 'A' },
                
                // 算法相关
                { pattern: /(时间复杂度)/, value: 'C' },
                { pattern: /(空间复杂度)/, value: 'D' },
                { pattern: /(冒泡排序)/, value: 'A' },
                { pattern: /(快速排序)/, value: 'B' },
                
                // 编程相关
                { pattern: /(面向对象)/, value: 'C' },
                { pattern: /(封装|继承|多态)/, value: 'A' }
            ];

            // 检查模式匹配
            for (const pattern of correctPatterns) {
                if (pattern.pattern.test(questionLower)) {
                    const matchingOption = options.find(opt => opt.value === pattern.value);
                    if (matchingOption) return matchingOption.value;
                }
            }

            // 2. 选项长度分析（通常正确答案更长）
            const optionLengths = options.map(opt => ({
                value: opt.value,
                length: opt.text ? opt.text.length : 0
            })).sort((a, b) => b.length - a.length);
            
            // 如果最长选项明显长于其他选项，选择它
            if (optionLengths[0].length > optionLengths[1]?.length + 5) {
                return optionLengths[0].value;
            }

            // 3. 默认选择中间选项（避免极端选项）
            const middleIndex = Math.floor(options.length / 2);
            return options[middleIndex]?.value;
        }

        // 判断题智能逻辑
        if (questionType === 'true_false') {
            const questionLower = questionText.toLowerCase();
            
            // 否定词检测
            const negativeWords = ['不', '错', '非', '没', '无', '不是', '不会', '不能', '错误', 'false'];
            const positiveWords = ['是', '对', '正确', 'true', '可以', '能够'];
            
            const hasNegative = negativeWords.some(word => questionLower.includes(word));
            const hasPositive = positiveWords.some(word => questionLower.includes(word));
            
            // 如果有明确的否定词，选择"错误"
            if (hasNegative && !hasPositive) {
                return '错误';
            }
            
            // 如果有明确的肯定词，选择"正确" 
            if (hasPositive && !hasNegative) {
                return '正确';
            }
            
            // 默认选择"正确"（大多数判断题是正确的）
            return '正确';
        }

        // 多选题默认选择所有选项
        if (questionType === 'multiple_choice' && options.length > 0) {
            return options.map(opt => opt.value).join(',');
        }

        return null;
    }

    // 工具方法
    generateCacheKey(questionText, questionType) {
        const normalizedText = questionText.toLowerCase().replace(/\s+/g, ' ').trim();
        return `${questionType}:${normalizedText}`;
    }

    generateSearchKey(questionText) {
        return this.normalizeQuestionText(questionText);
    }

    normalizeQuestionText(text) {
        return text.toLowerCase().replace(/[^\w\u4e00-\u9fff]/g, ' ').replace(/\s+/g, ' ').trim();
    }

    calculateSimilarity(text1, text2) {
        const words1 = new Set(text1.split(' '));
        const words2 = new Set(text2.split(' '));
        const intersection = new Set([...words1].filter(word => words2.has(word)));
        const union = new Set([...words1, ...words2]);
        return intersection.size / union.size;
    }

    processArchiveAnswer(entry, questionType, currentOptions) {
        if (entry.type !== questionType) return null;
        if (currentOptions.some(opt => opt.value === entry.answer)) return entry.answer;
        
        const matchingOption = currentOptions.find(opt => 
            opt.text && entry.answer && 
            (opt.text.includes(entry.answer) || entry.answer.includes(opt.text))
        );
        return matchingOption ? matchingOption.value : null;
    }

    processAPIResponse(apiData, questionType, options) {
        if (!apiData) return null;
        return apiData.answer || apiData.correct_option || null;
    }

    // API请求（统一使用background script作为CORS代理）
    async makeAPIRequest(endpoint, options = {}) {
        const apiConfig = this.defaultAPIs[this.currentAPI];
        let url = `${apiConfig.baseURL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            'X-Platform': 'web-problems-helper'
        };

        // 添加认证信息
        if (apiConfig.authType === 'apiKey' && this.apiKey) {
            headers['Authorization'] = `Bearer ${this.apiKey}`;
        } else if (apiConfig.authType === 'appid' && this.apiKey) {
            url += `?appid=${this.apiKey}`;
        }

        // 添加查询参数
        if (options.params) {
            const params = new URLSearchParams(options.params);
            url += (url.includes('?') ? '&' : '?') + params.toString();
        }

        // 统一使用background script作为CORS代理
        try {
            return await this.makeAPIRequestViaBackground(url, {
                method: options.method || 'GET',
                headers: headers,
                body: options.body
            });
        } catch (error) {
            console.warn('Background API请求失败:', error);
            
            // 对于知寻题库API，尝试使用JSONP方式或其它备用方案
            if (this.currentAPI === 'zhixun-api') {
                return this.tryZhixunFallback(url, options);
            }
            
            return this.tryFallbackAPI(endpoint, options);
        }
    }
    
    // 尝试HTTP回退
    async tryHTTPFallback(url, headers, options) {
        try {
            const response = await fetch(url, {
                method: options.method || 'GET',
                headers: headers,
                body: options.body
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            return this.processAPIResponse(data, this.defaultAPIs[this.currentAPI]);
        } catch (httpError) {
            console.warn('HTTP回退也失败:', httpError);
            return this.tryFallbackAPI('', options, true);
        }
    }

    // 尝试使用支持CORS的API
    async tryCORSCompatibleAPI(endpoint, options) {
        const corsCompatibleAPIs = Object.keys(this.defaultAPIs).filter(
            key => this.defaultAPIs[key].corsSupported === true
        );

        for (const apiKey of corsCompatibleAPIs) {
            try {
                const originalAPI = this.currentAPI;
                this.currentAPI = apiKey;
                this.baseURL = this.defaultAPIs[apiKey].baseURL;
                
                console.log(`🔄 切换到支持CORS的API: ${apiKey}`);
                const result = await this.makeAPIRequest(endpoint, options);
                
                if (result) return result;
                
            } catch (error) {
                console.warn(`CORS兼容API ${apiKey} 请求失败:`, error);
            } finally {
                // 恢复原始API配置
                this.currentAPI = 'wikipedia-api';
                this.baseURL = this.defaultAPIs['wikipedia-api'].baseURL;
            }
        }
        
        console.warn('所有支持CORS的API都失败了，尝试使用background script');
        return this.tryFallbackAPI(endpoint, options, true);
    }

    // 通过background script处理跨域请求
    async makeAPIRequestViaBackground(url, options) {
        // 检查是否在Chrome扩展环境中
        if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
            throw new Error('不在Chrome扩展环境中，无法使用background script');
        }

        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
                action: 'apiRequest',
                url: url,
                options: options
            }, (response) => {
                if (chrome.runtime.lastError) {
                    // 如果background script不可用，尝试直接请求（仅限支持CORS的API）
                    if (url.includes('tencentcloudapi.com')) {
                        reject(new Error('已禁用直连腾讯云API：请启动本地 Java 后端并使用 http://localhost:3001/api/chat'));
                    } else {
                        reject(new Error(chrome.runtime.lastError.message));
                    }
                } else if (response && response.success) {
                    resolve(response.data);
                } else {
                    reject(new Error(response?.error || 'Background API请求失败'));
                }
            });
        });
    }

    // 处理API响应（增强版）
    processAPIResponse(data, apiConfig) {
        switch (this.currentAPI) {
            case 'zhixun-api':
                // 知寻题库API响应格式
                if (data && data.code === 200 && data.data && data.data.answer) {
                    return { answer: data.data.answer };
                }
                return null;
                
            case 'wikipedia-api':
                // Wikipedia返回提取的摘要
                const pages = data.query?.pages;
                if (pages) {
                    const firstPage = Object.values(pages)[0];
                    return firstPage?.extract ? { answer: firstPage.extract } : null;
                }
                return null;
                
            case 'duckduckgo-api':
                // DuckDuckGo返回即时答案
                if (data.AbstractText) {
                    return { answer: data.AbstractText };
                } else if (data.Answer) {
                    return { answer: data.Answer };
                }
                return null;
                

                
            default:
                // 通用处理：尝试提取任何可能的答案字段
                const possibleAnswerFields = [
                    'answer', 'Answer', 'result', 'Result', 'text', 'Text',
                    'content', 'Content', 'message', 'Message', 'output', 'Output'
                ];
                
                for (const field of possibleAnswerFields) {
                    if (data[field]) {
                        return { answer: data[field] };
                    }
                }
                
                // 如果找不到特定字段，返回原始数据
                return data;
        }
    }

    // 知寻题库API备用方案
    async tryZhixunFallback(url, options) {
        console.log('🔄 尝试知寻题库备用方案...');
        
        // 使用background script处理知寻题库备用方案
        try {
            const response = await this.makeAPIRequestViaBackground(url, {
                method: options.method || 'GET',
                headers: options.headers || {},
                body: options.body
            });
            
            if (response) {
                return this.processAPIResponse(response, this.defaultAPIs['zhixun-api']);
            }
        } catch (error) {
            console.warn('Background script知寻题库请求失败:', error);
        }
        
        // 备用方案：使用CORS代理服务
        try {
            const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
            const response = await fetch(proxyUrl, {
                method: options.method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                return this.processAPIResponse(data, this.defaultAPIs['zhixun-api']);
            }
        } catch (error) {
            console.warn('CORS代理方案失败:', error);
        }
        
        return null;
    }
    
    // JSONP请求实现
    jsonpRequest(url) {
        return new Promise((resolve, reject) => {
            // 创建回调函数
            const callbackName = 'jsonpCallback_' + Date.now();
            window[callbackName] = function(data) {
                resolve(data);
                delete window[callbackName];
                document.head.removeChild(script);
            };
            
            // 创建script标签
            const script = document.createElement('script');
            script.src = url.replace('callback=jsonpCallback', `callback=${callbackName}`);
            script.onerror = () => {
                reject(new Error('JSONP请求失败'));
                delete window[callbackName];
            };
            
            document.head.appendChild(script);
            
            // 超时处理
            setTimeout(() => {
                reject(new Error('JSONP请求超时'));
                delete window[callbackName];
                document.head.removeChild(script);
            }, 10000);
        });
    }

    // 尝试备用API（按优先级顺序）
    async tryFallbackAPI(endpoint, options) {
        // 按优先级排序备用API
        const backupAPIs = Object.keys(this.defaultAPIs)
            .filter(key => key !== this.currentAPI)
            .sort((a, b) => {
                const priorityA = this.defaultAPIs[a].priority || 5;
                const priorityB = this.defaultAPIs[b].priority || 5;
                return priorityA - priorityB;
            });
        
        for (const apiKey of backupAPIs) {
            try {
                const originalAPI = this.currentAPI;
                this.currentAPI = apiKey;
                this.baseURL = this.defaultAPIs[apiKey].baseURL;
                
                console.log(`🔄 切换到备用API: ${apiKey} (优先级: ${this.defaultAPIs[apiKey].priority})`);
                const result = await this.makeAPIRequest(endpoint, options);
                
                if (result) return result;
                
            } catch (error) {
                console.warn(`备用API ${apiKey} 也失败:`, error);
            } finally {
                // 恢复原始API配置
                this.currentAPI = originalAPI || 'hunyuan-lite';
                this.baseURL = this.defaultAPIs[this.currentAPI].baseURL;
            }
        }
        
        console.warn('所有备用API都失败了，尝试本地智能答案生成');
        return null;
    }

    // 直接API请求（避免递归）
    async directAPIRequest(endpoint, options = {}) {
        const apiConfig = this.defaultAPIs[this.currentAPI];
        let url = `${this.baseURL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            'X-Platform': 'web-problems-helper'
        };

        // 添加认证信息
        if (apiConfig.authType === 'apiKey' && this.apiKey) {
            headers['Authorization'] = `Bearer ${this.apiKey}`;
        } else if (apiConfig.authType === 'appid' && this.apiKey) {
            url += `?appid=${this.apiKey}`;
        }

        // 添加查询参数
        if (options.params) {
            const params = new URLSearchParams(options.params);
            url += (url.includes('?') ? '&' : '?') + params.toString();
        }

        try {
            const response = await fetch(url, {
                method: options.method || 'GET',
                headers: headers,
                body: options.body
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            return this.processAPIResponse(data, apiConfig);
        } catch (error) {
            console.warn('直接API请求失败:', error);
            return null;
        }
    }

    // 数据存储（安全的Chrome扩展存储）
    startAutoSave() {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            setInterval(() => this.saveData(), 30000);
        }
    }

    async saveData() {
        try {
            // 检查Chrome扩展存储是否可用且上下文有效
            const isChromeStorageAvailable = typeof chrome !== 'undefined' && 
                                           chrome.storage && 
                                           chrome.storage.local &&
                                           !chrome.runtime?.lastError;
            
            if (isChromeStorageAvailable) {
                try {
                    await chrome.storage.local.set({
                        questionArchive: Array.from(this.localArchive.entries()),
                        usageStats: this.usageStats
                    });
                    return;
                } catch (chromeError) {
                    console.warn('Chrome存储访问失败:', chromeError);
                }
            }
            
            // 使用localStorage作为备用
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('wph_local_archive', JSON.stringify(Array.from(this.localArchive.entries())));
                localStorage.setItem('wph_usage_stats', JSON.stringify(this.usageStats));
            } else {
                // 如果localStorage也不可用，使用内存存储
                console.log('⚠️ 使用内存存储（无持久化）');
            }
        } catch (error) {
            console.warn('保存数据失败:', error);
        }
    }



    saveToLocalStorage() {
        try {
            localStorage.setItem('wph_local_archive', JSON.stringify(Array.from(this.localArchive.entries())));
            localStorage.setItem('wph_usage_stats', JSON.stringify(this.usageStats));
        } catch (error) {
            console.error('localStorage存储失败:', error);
        }
    }

    loadFromLocalStorage() {
        try {
            // 检查是否在浏览器环境中
            if (typeof localStorage !== 'undefined') {
                const archiveData = localStorage.getItem('wph_local_archive');
                const statsData = localStorage.getItem('wph_usage_stats');
                
                if (archiveData) {
                    this.localArchive = new Map(JSON.parse(archiveData));
                }
                if (statsData) {
                    this.usageStats = JSON.parse(statsData);
                }
            } else {
                // Node.js环境使用文件存储或内存存储
                console.log('📁 Node.js环境使用内存存储');
                // 可以在这里添加文件存储逻辑
            }
        } catch (error) {
            console.warn('从localStorage加载失败:', error);
        }
    }
    
    // Node.js环境存储方案
    saveToNodeStorage() {
        // 在Node.js环境中可以使用文件系统存储
        // 这里使用内存存储作为简单实现
        console.log('💾 Node.js环境使用内存存储');
    }
    
    loadFromNodeStorage() {
        // 从文件系统加载数据（如果实现的话）
        console.log('📥 Node.js环境从内存加载');
    }

    // 更新配置（立即生效）
    updateConfig(newConfig) {
        if (newConfig.apiKey !== undefined) {
            this.apiKey = newConfig.apiKey;
            console.log('✅ API密钥已更新');
            
            // 如果配置了hunyuan-lite的SecretId/SecretKey，重新加载hunyuan服务
            if (this.currentAPI === 'hunyuan-lite' && this.apiKey) {
                this.loadHunyuanService();
            }
        }
        if (newConfig.baseURL !== undefined) {
            this.baseURL = newConfig.baseURL;
            console.log('✅ BaseURL已更新:', newConfig.baseURL);
        }
        if (newConfig.currentAPI !== undefined) {
            this.currentAPI = newConfig.currentAPI;
            console.log('✅ 当前API已更新:', newConfig.currentAPI);
            
            // 切换API时重新加载相关服务
            if (this.currentAPI === 'hunyuan-lite') {
                this.loadHunyuanService();
            }
        }
        if (newConfig.enabled !== undefined) {
            this.isEnabled = newConfig.enabled;
            console.log('✅ 服务状态已更新:', newConfig.enabled ? '启用' : '禁用');
        }
        if (newConfig.fallbackEnabled !== undefined) {
            this.fallbackEnabled = newConfig.fallbackEnabled;
            console.log('✅ 回退功能已更新:', newConfig.fallbackEnabled ? '启用' : '禁用');
        }
        if (newConfig.syncEnabled !== undefined) {
            this.syncEnabled = newConfig.syncEnabled;
            console.log('✅ 同步功能已更新:', newConfig.syncEnabled ? '启用' : '禁用');
        }
        
        // 保存更新后的配置
        this.saveConfig();
        
        // 触发配置更新事件（如果有监听器）
        if (typeof this.onConfigUpdate === 'function') {
            this.onConfigUpdate(this.getStatus());
        }
    }
    
    // 保存配置到存储
    async saveConfig() {
        const config = {
            apiKey: this.apiKey,
            baseURL: this.baseURL,
            currentAPI: this.currentAPI,
            enabled: this.isEnabled,
            fallbackEnabled: this.fallbackEnabled,
            syncEnabled: this.syncEnabled
        };
        
        try {
            // 检查是否在Chrome扩展环境中
            const isChromeExtensionValid = typeof chrome !== 'undefined' && 
                                         chrome.storage && 
                                         chrome.storage.local;
            
            if (isChromeExtensionValid) {
                await chrome.storage.local.set({ apiConfig: config });
                console.log('✅ 配置已保存到Chrome存储');
            } else if (typeof localStorage !== 'undefined') {
                localStorage.setItem('wph_api_config', JSON.stringify(config));
                console.log('✅ 配置已保存到localStorage');
            }
        } catch (error) {
            console.warn('保存配置失败:', error);
        }
    }

    // 配置验证和测试
    async testConfig(config = null) {
        console.log('🧪 测试配置有效性...');
        
        // 保存当前配置
        const originalConfig = {
            apiKey: this.apiKey,
            baseURL: this.baseURL,
            currentAPI: this.currentAPI
        };
        
        try {
            // 应用测试配置（如果有）
            if (config) {
                this.updateConfig(config);
            }
            
            // 根据当前API类型进行测试
            let testResult;
            if (this.currentAPI === 'hunyuan-lite') {
                testResult = await this.testHunyuanConnection();
            } else {
                testResult = await this.testGenericAPI();
            }
            
            console.log('✅ 配置测试完成:', testResult.success ? '成功' : '失败');
            return testResult;
            
        } catch (error) {
            console.error('配置测试失败:', error);
            return { success: false, error: error.message };
        } finally {
            // 恢复原始配置
            this.updateConfig(originalConfig);
        }
    }

    // 配置页使用的连接测试入口（config-ui.html 调用）
    async testConnection() {
        const result = await this.testConfig();
        if (result && typeof result.success === 'boolean') {
            return {
                success: result.success,
                message: result.message || result.error || (result.success ? '连接成功' : '连接失败'),
                result: result.result
            };
        }
        return { success: false, message: '未知测试结果' };
    }
    
    // 测试hunyuan连接
    async testHunyuanConnection() {
        try {
            // 后端托管模式：优先检测本地后端 /health 是否可达（不产生模型调用费用）
            const healthResult = await this.testBackendHealth();
            if (!healthResult.success) {
                return healthResult;
            }

            return {
                success: true,
                message: '后端服务连接成功',
                result: healthResult.result
            };
            
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // 检测本地后端服务（/health）
    async testBackendHealth() {
        try {
            const backendUrl = this.getBackendUrl();
            const healthUrl = this.toHealthUrl(backendUrl);

            // 优先通过 background 发起（更稳定，避免页面环境限制）
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                const res = await new Promise((resolve, reject) => {
                    chrome.runtime.sendMessage(
                        { action: 'backendHealthCheck', url: healthUrl },
                        (response) => {
                            if (chrome.runtime.lastError) {
                                reject(new Error(chrome.runtime.lastError.message));
                                return;
                            }
                            resolve(response);
                        }
                    );
                });

                if (res && res.success) {
                    return { success: true, message: '健康检查通过', result: res.data };
                }
                return { success: false, message: res?.error || '健康检查失败', result: res?.data };
            }

            // 兜底：直接 fetch（非扩展环境或 runtime 不可用时）
            const response = await fetch(healthUrl, { method: 'GET' });
            const data = await response.json().catch(() => null);
            if (!response.ok) {
                return { success: false, message: `HTTP ${response.status}: ${response.statusText}`, result: data };
            }
            return { success: true, message: '健康检查通过', result: data };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    getBackendUrl() {
        try {
            if (typeof window !== 'undefined') {
                if (window.hunyuanService && window.hunyuanService.backendUrl) {
                    return window.hunyuanService.backendUrl;
                }
                if (window.hunyuanConfig && window.hunyuanConfig.backendUrl) {
                    return window.hunyuanConfig.backendUrl;
                }
            }
        } catch (e) {
            // ignore
        }
        return 'http://localhost:3001/api/chat';
    }

    toHealthUrl(backendUrl) {
        try {
            const u = new URL(backendUrl);
            return `${u.origin}/health`;
        } catch (e) {
            return 'http://localhost:3001/health';
        }
    }
    
    // 测试通用API
    async testGenericAPI() {
        try {
            const response = await this.makeAPIRequest('', {
                method: 'GET',
                params: { q: 'test' }
            });
            
            return { 
                success: !!response, 
                message: response ? `${this.currentAPI}连接成功` : `${this.currentAPI}连接失败`,
                result: response
            };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // 测试配置连接
    async testConfig() {
        try {
            if (!this.isEnabled) {
                return { success: false, message: 'API服务已禁用' };
            }

            // 根据当前API选择测试方法
            if (this.currentAPI === 'hunyuan-lite') {
                return await this.testHunyuanConnection();
            } else {
                return await this.testGenericAPI();
            }
            
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // 状态和统计
    getStatus() {
        return {
            enabled: this.isEnabled,
            hasKey: !!this.apiKey,
            archiveSize: this.localArchive.size,
            cacheSize: this.cache.size,
            totalSearches: this.usageStats.totalSearches,
            localHits: this.usageStats.localHits,
            apiHits: this.usageStats.apiHits,
            currentAPI: this.currentAPI,
            baseURL: this.baseURL
        };
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

    clearArchive() {
        this.localArchive.clear();
        this.saveData();
    }

    // 加载hunyuan服务（支持组合格式API密钥）
    loadHunyuanService() {
        try {
            if (typeof window !== 'undefined' && window.hunyuanService) {
                this.hunyuanService = window.hunyuanService;
            } else if (typeof require !== 'undefined') {
                const { hunyuanService } = require('./hunyuan-service');
                this.hunyuanService = hunyuanService;
            } else {
                console.warn('无法加载hunyuan服务');
                return;
            }
            
            // 如果配置了组合格式的API密钥，解析并设置到hunyuan服务
            if (this.apiKey && this.apiKey.includes(':')) {
                const [secretId, secretKey] = this.apiKey.split(':');
                if (secretId && secretKey) {
                    this.hunyuanService.setConfig(secretId, secretKey);
                    console.log('✅ 已从组合API密钥配置hunyuan服务');
                }
            }
        } catch (error) {
            console.warn('加载hunyuan服务失败:', error);
        }
    }

    // 使用hunyuan-lite搜索答案
    async searchWithHunyuanLite(questionText, questionType, options) {
        if (!this.hunyuanService) {
            console.warn('hunyuan服务未加载');
            return null;
        }

        try {
            const result = await this.hunyuanService.searchAnswer(questionText, questionType, options);
            return result;
        } catch (error) {
            console.error('hunyuan-lite搜索失败:', error);
            return null;
        }
    }

    // 统一答案检索入口（本地优先，API验证）
    async getAnswerForQuestion(questionText, questionType, options = []) {
        // 1) 先查缓存
        const cacheKey = this.generateCacheKey(questionText, questionType);
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            return this.processAnswerForOptions(cached, options);
        }

        // 2) 本地题库优先（answer-database.js -> findAnswer）
        let localAnswer = null;
        try {
            if (typeof findAnswer === 'function') {
                localAnswer = await findAnswer(questionText, questionType, options);
            }
        } catch (err) {
            console.warn('本地题库检索失败:', err);
        }

        if (localAnswer) {
            const processedLocal = this.processAnswerForOptions(localAnswer, options);
            this.addToCache(cacheKey, processedLocal);
            this.addToLocalArchive(questionText, questionType, options, processedLocal);
            this.usageStats.localHits++;
            return processedLocal;
        }

        // 3) 未命中则走现有统一搜索（含本地归档与API验证）
        const verified = await this.searchAnswer(questionText, questionType, options);
        return verified;
    }
}

// 创建全局实例
const apiService = new APIService();

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { APIService, apiService };
} else {
    window.APIService = APIService;
    window.apiService = apiService;
}