// Web 题目助手 - 工具函数库

// 延迟函数
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 随机延迟（模拟人类操作）
function randomDelay(min = 300, max = 800) {
    const delay = Math.random() * (max - min) + min;
    return sleep(delay);
}

// 性能监控器
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            initTime: 0,
            detectionTime: 0,
            fillTime: 0,
            domQueries: 0,
            errors: 0
        };
        this.startTime = performance.now();
    }
    
    startTimer(operation) {
        this[`${operation}StartTime`] = performance.now();
    }
    
    endTimer(operation) {
        const startTime = this[`${operation}StartTime`];
        if (startTime) {
            this.metrics[`${operation}Time`] = performance.now() - startTime;
            console.log(`⏱️ ${operation} 耗时: ${this.metrics[`${operation}Time`].toFixed(2)}ms`);
        }
    }
    
    incrementCounter(metric) {
        this.metrics[metric] = (this.metrics[metric] || 0) + 1;
    }
    
    getReport() {
        return {
            ...this.metrics,
            totalTime: performance.now() - this.startTime
        };
    }
}

// 全局性能监控实例
const performanceMonitor = new PerformanceMonitor();

// 智能DOM查询（带缓存和性能优化）
class SmartDOMQuery {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5000; // 5秒缓存
    }
    
    query(selector, useCache = true) {
        const cacheKey = selector;
        const now = Date.now();
        
        // 检查缓存
        if (useCache && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (now - cached.timestamp < this.cacheTimeout) {
                console.log(`📋 使用缓存查询: ${selector}`);
                return cached.elements;
            }
        }
        
        // 执行查询
        performanceMonitor.incrementCounter('domQueries');
        const elements = document.querySelectorAll(selector);
        
        // 缓存结果
        if (useCache) {
            this.cache.set(cacheKey, {
                elements: elements,
                timestamp: now
            });
        }
        
        console.log(`🔍 DOM查询: ${selector} -> ${elements.length} 个元素`);
        return elements;
    }
    
    clearCache() {
        this.cache.clear();
        console.log('🗑️ DOM查询缓存已清空');
    }
}

// 全局DOM查询实例
const smartDOM = new SmartDOMQuery();

// 节流函数
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// 防抖函数（改进版）
function debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
}

// 批处理执行器
class BatchProcessor {
    constructor(batchSize = 5, delay = 100) {
        this.batchSize = batchSize;
        this.delay = delay;
        this.queue = [];
        this.processing = false;
    }
    
    add(item) {
        this.queue.push(item);
        if (!this.processing) {
            this.process();
        }
    }
    
    async process() {
        this.processing = true;
        
        while (this.queue.length > 0) {
            const batch = this.queue.splice(0, this.batchSize);
            
            // 并行处理当前批次
            const promises = batch.map(item => {
                if (typeof item === 'function') {
                    return item();
                }
                return Promise.resolve(item);
            });
            
            try {
                await Promise.all(promises);
            } catch (error) {
                console.error('批处理执行失败:', error);
                performanceMonitor.incrementCounter('errors');
            }
            
            // 批次间延迟
            if (this.queue.length > 0) {
                await sleep(this.delay);
            }
        }
        
        this.processing = false;
    }
}

// 资源管理器
class ResourceManager {
    constructor() {
        this.observers = [];
        this.timers = [];
        this.eventListeners = [];
    }
    
    addObserver(observer) {
        this.observers.push(observer);
    }
    
    addTimer(timerId) {
        this.timers.push(timerId);
    }
    
    addEventListener(element, event, handler) {
        element.addEventListener(event, handler);
        this.eventListeners.push({ element, event, handler });
    }
    
    cleanup() {
        // 清理观察器
        this.observers.forEach(observer => {
            if (observer.disconnect) {
                observer.disconnect();
            }
        });
        
        // 清理定时器
        this.timers.forEach(timerId => {
            clearTimeout(timerId);
            clearInterval(timerId);
        });
        
        // 清理事件监听器
        this.eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        
        // 清空数组
        this.observers = [];
        this.timers = [];
        this.eventListeners = [];
        
        console.log('🧹 资源清理完成');
    }
}

// 全局资源管理器
const resourceManager = new ResourceManager();

// 文本相似度计算（简单版本）
function textSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
}

// 编辑距离计算
function levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    
    return matrix[str2.length][str1.length];
}

// 提取题目关键词
function extractKeywords(text) {
    // 移除标点符号和特殊字符
    const cleanText = text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, ' ');
    
    // 分词（简单按空格分割）
    const words = cleanText.split(/\s+/).filter(word => word.length > 1);
    
    // 移除常见停用词
    const stopWords = ['的', '是', '在', '有', '和', '与', '或', '但', '而', '了', '着', '过', 
                      'the', 'is', 'are', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'];
    
    return words.filter(word => !stopWords.includes(word.toLowerCase()));
}

// 检测题目难度（基于关键词和长度）
function assessQuestionDifficulty(questionText) {
    const keywords = extractKeywords(questionText);
    const textLength = questionText.length;
    
    // 困难关键词
    const hardKeywords = ['算法', '复杂度', '数据结构', '网络协议', '数据库设计', 
                         'algorithm', 'complexity', 'protocol', 'architecture'];
    
    // 中等关键词
    const mediumKeywords = ['编程', '函数', '循环', '条件', '数组', 
                           'programming', 'function', 'loop', 'array'];
    
    let difficulty = 'easy';
    let score = 0;
    
    // 基于关键词评分
    keywords.forEach(keyword => {
        if (hardKeywords.some(hard => keyword.includes(hard))) {
            score += 3;
        } else if (mediumKeywords.some(medium => keyword.includes(medium))) {
            score += 2;
        } else {
            score += 1;
        }
    });
    
    // 基于文本长度调整
    if (textLength > 200) score += 2;
    else if (textLength > 100) score += 1;
    
    // 确定难度等级
    if (score >= 10) difficulty = 'hard';
    else if (score >= 5) difficulty = 'medium';
    
    return {
        difficulty: difficulty,
        score: score,
        keywords: keywords
    };
}

// 格式化代码
function formatCode(code, language = 'c') {
    // 简单的代码格式化
    let formatted = code;
    
    // 添加适当的缩进
    const lines = formatted.split('\n');
    let indentLevel = 0;
    const indentSize = 4;
    
    const formattedLines = lines.map(line => {
        const trimmed = line.trim();
        
        if (trimmed.includes('}')) {
            indentLevel = Math.max(0, indentLevel - 1);
        }
        
        const indentedLine = ' '.repeat(indentLevel * indentSize) + trimmed;
        
        if (trimmed.includes('{')) {
            indentLevel++;
        }
        
        return indentedLine;
    });
    
    return formattedLines.join('\n');
}

// 生成常见编程题模板
function generateCodeTemplate(questionText) {
    const text = questionText.toLowerCase();
    
    // Hello World
    if (text.includes('hello world')) {
        return `#include <stdio.h>
int main() {
    printf("Hello World\\n");
    return 0;
}`;
    }
    
    // 求和
    if (text.includes('求和') || text.includes('sum')) {
        return `#include <stdio.h>
int main() {
    int a, b;
    scanf("%d %d", &a, &b);
    printf("%d\\n", a + b);
    return 0;
}`;
    }
    
    // 循环
    if (text.includes('循环') || text.includes('loop')) {
        return `#include <stdio.h>
int main() {
    int n;
    scanf("%d", &n);
    for (int i = 1; i <= n; i++) {
        printf("%d ", i);
    }
    printf("\\n");
    return 0;
}`;
    }
    
    // 数组
    if (text.includes('数组') || text.includes('array')) {
        return `#include <stdio.h>
int main() {
    int n;
    scanf("%d", &n);
    int arr[n];
    for (int i = 0; i < n; i++) {
        scanf("%d", &arr[i]);
    }
    // 处理数组
    for (int i = 0; i < n; i++) {
        printf("%d ", arr[i]);
    }
    printf("\\n");
    return 0;
}`;
    }
    
    // 默认模板
    return `#include <stdio.h>
int main() {
    // 在这里编写代码
    
    return 0;
}`;
}

// 日志记录
function logAction(action, details = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp: timestamp,
        action: action,
        details: details,
        url: window.location.href
    };
    
    console.log('[Web 题目助手]', logEntry);
    
    // 保存到本地存储
    chrome.storage.local.get(['actionLogs'], (result) => {
        const logs = result.actionLogs || [];
        logs.push(logEntry);
        
        // 只保留最近100条记录
        if (logs.length > 100) {
            logs.splice(0, logs.length - 100);
        }
        
        chrome.storage.local.set({ actionLogs: logs });
    });
}

// 错误处理
function handleError(error, context = '') {
    console.error(`[Web 题目助手错误] ${context}:`, error);
    
    // 记录错误日志
    logAction('error', {
        context: context,
        error: error.message,
        stack: error.stack
    });
    
    // 显示用户友好的错误信息
    showNotification(`操作失败: ${context}`, 'error');
}

// 显示通知
function showNotification(message, type = 'info', duration = 3000) {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `wph-notification ${type}`;
    notification.textContent = message;
    
    // 样式
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 20px',
        borderRadius: '4px',
        color: 'white',
        fontSize: '14px',
        zIndex: '10001',
        opacity: '0',
        transition: 'opacity 0.3s ease',
        maxWidth: '300px',
        wordWrap: 'break-word'
    });
    
    // 根据类型设置背景色
    switch (type) {
        case 'success':
            notification.style.backgroundColor = '#4caf50';
            break;
        case 'error':
            notification.style.backgroundColor = '#f44336';
            break;
        case 'warning':
            notification.style.backgroundColor = '#ff9800';
            break;
        default:
            notification.style.backgroundColor = '#2196f3';
    }
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 显示动画
    setTimeout(() => {
        notification.style.opacity = '1';
    }, 100);
    
    // 自动隐藏
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, duration);
}

// 导出函数
if (typeof window !== 'undefined') {
    window.WPHUtils = {
        sleep,
        randomDelay,
        textSimilarity,
        extractKeywords,
        assessQuestionDifficulty,
        formatCode,
        generateCodeTemplate,
        logAction,
        handleError,
        showNotification
    };
}