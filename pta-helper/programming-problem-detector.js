/**
 * PTA编程题目专业检测模块
 * 专门针对PTA平台编程题的结构化信息提取
 * 支持题目元数据、输入输出格式、样例数据等完整信息解析
 */

class PTAProgrammingProblemDetector {
    constructor() {
        this.detectionStrategies = [
            this.detectByMarkdownStructure.bind(this),
            this.detectByTitleAndContent.bind(this),
            this.detectByCodeBlocks.bind(this),
            this.detectByProblemInfo.bind(this)
        ];
        
        // 编程题关键词库
        this.programmingKeywords = [
            '算法', '编程', '代码', '函数', '程序', '实现', '编写',
            '栈', '队列', '链表', '数组', '树', '图', '排序', '查找',
            'algorithm', 'function', 'implement', 'code', 'program'
        ];
        
        // 题目类型映射
        this.problemTypes = {
            '栈': 'stack',
            '队列': 'queue', 
            '链表': 'linked_list',
            '数组': 'array',
            '树': 'tree',
            '图': 'graph',
            '排序': 'sorting',
            '查找': 'search',
            '动态规划': 'dp',
            '贪心': 'greedy'
        };
    }

    /**
     * 主检测入口 - 检测当前页面的编程题信息
     * @returns {Object} 检测结果
     */
    async detectProgrammingProblem() {
        console.log('🔍 开始PTA编程题专业检测...');
        
        try {
            // 预检查：确认是编程题页面
            if (!this.isProgrammingProblemPage()) {
                return {
                    success: false,
                    error: '当前页面不是编程题页面',
                    type: 'not_programming'
                };
            }

            // 执行多策略检测
            let bestResult = null;
            let maxScore = 0;

            for (const strategy of this.detectionStrategies) {
                try {
                    const result = await strategy();
                    if (result && result.score > maxScore) {
                        maxScore = result.score;
                        bestResult = result;
                    }
                } catch (error) {
                    console.warn('检测策略执行失败:', error);
                }
            }

            if (bestResult && maxScore > 0.5) {
                // 后处理：补充和优化检测结果
                const enhancedResult = await this.enhanceDetectionResult(bestResult);
                
                console.log('✅ 编程题检测成功:', enhancedResult.metadata.title);
                return {
                    success: true,
                    ...enhancedResult,
                    detectionMethod: bestResult.method,
                    confidence: maxScore
                };
            } else {
                return {
                    success: false,
                    error: '未能成功检测到编程题结构',
                    type: 'detection_failed'
                };
            }

        } catch (error) {
            console.error('❌ 编程题检测失败:', error);
            return {
                success: false,
                error: error.message,
                type: 'exception'
            };
        }
    }

    /**
     * 策略1: 基于Markdown结构检测（最可靠）
     */
    async detectByMarkdownStructure() {
        const markdownBlock = document.querySelector('.markdownBlock_tErSz .rendered-markdown') ||
                             document.querySelector('.markdownBlock_tErSz') ||
                             document.querySelector('.rendered-markdown');
        
        if (!markdownBlock) {
            return { score: 0, method: 'markdown_structure' };
        }

        console.log('📖 使用Markdown结构检测策略...');

        // 提取结构化信息
        const metadata = this.extractProblemMetadata(markdownBlock);
        const ioFormats = this.extractIOFormats(markdownBlock);
        const examples = this.extractExamples(markdownBlock);
        const constraints = this.extractConstraints();
        const description = this.extractDescription(markdownBlock);

        // 计算检测置信度
        let score = 0.6; // 基础分
        
        if (metadata.title) score += 0.1;
        if (ioFormats.input || ioFormats.output) score += 0.1;
        if (examples.input && examples.output) score += 0.15;
        if (description) score += 0.05;

        return {
            score,
            method: 'markdown_structure',
            metadata,
            ioFormats,
            examples,
            constraints,
            description,
            element: markdownBlock
        };
    }

    /**
     * 策略2: 基于标题和内容检测
     */
    async detectByTitleAndContent() {
        console.log('📝 使用标题内容检测策略...');

        // 查找题目标题
        const titleSelectors = [
            '.space-y-4 .text-darkest.font-bold.text-lg',
            '.problem-title',
            '.question-title', 
            'h1', 'h2', 'h3'
        ];

        let titleElement = null;
        let title = '';

        for (const selector of titleSelectors) {
            const elements = document.querySelectorAll(selector);
            for (const el of elements) {
                const text = el.textContent.trim();
                if (text && 
                    !text.includes('输入格式') && 
                    !text.includes('输出格式') && 
                    !text.includes('样例') && 
                    !text.includes('题目描述') &&
                    text.length > 3) {
                    titleElement = el;
                    title = text;
                    break;
                }
            }
            if (title) break;
        }

        if (!title) {
            return { score: 0, method: 'title_content' };
        }

        // 分析标题中的编程题特征
        const programmingScore = this.calculateProgrammingScore(title);
        
        if (programmingScore < 0.3) {
            return { score: 0, method: 'title_content' };
        }

        // 提取其他信息
        const metadata = { title, id: this.generateProblemId(title) };
        const description = this.extractDescriptionFromPage();
        
        return {
            score: 0.4 + programmingScore * 0.3,
            method: 'title_content',
            metadata,
            description,
            element: titleElement
        };
    }

    /**
     * 策略3: 基于代码块检测
     */
    async detectByCodeBlocks() {
        console.log('💻 使用代码块检测策略...');

        const codeBlocks = document.querySelectorAll('pre code, code, pre');
        
        if (codeBlocks.length < 2) {
            return { score: 0, method: 'code_blocks' };
        }

        // 分析代码块内容
        const examples = this.extractExamplesFromCodeBlocks(codeBlocks);
        
        if (!examples.input || !examples.output) {
            return { score: 0.2, method: 'code_blocks' };
        }

        return {
            score: 0.5,
            method: 'code_blocks',
            examples,
            metadata: { title: '编程题（通过代码块检测）' }
        };
    }

    /**
     * 策略4: 基于题目信息区域检测
     */
    async detectByProblemInfo() {
        console.log('ℹ️ 使用题目信息检测策略...');

        const problemInfo = document.querySelector('.problemInfo_tfBoz');
        
        if (!problemInfo) {
            return { score: 0, method: 'problem_info' };
        }

        const constraints = this.extractConstraintsFromInfo(problemInfo);
        
        // 编程题通常有代码长度、时间、内存限制
        const hasTypicalConstraints = constraints.codeLength || 
                                    constraints.timeLimit || 
                                    constraints.memoryLimit;

        if (!hasTypicalConstraints) {
            return { score: 0.1, method: 'problem_info' };
        }

        return {
            score: 0.3,
            method: 'problem_info',
            constraints,
            metadata: { title: '编程题（通过信息区域检测）' }
        };
    }

    /**
     * 预检查：判断是否为编程题页面
     */
    isProgrammingProblemPage() {
        // 检查URL特征
        const url = window.location.href;
        if (url.includes('/problem/') || url.includes('/programming/')) {
            return true;
        }

        // 检查页面特征
        const hasCodeBlocks = document.querySelectorAll('pre, code').length >= 2;
        const hasConstraints = document.querySelector('.problemInfo_tfBoz') !== null;
        const hasMarkdown = document.querySelector('.markdownBlock_tErSz') !== null;

        return hasCodeBlocks || hasConstraints || hasMarkdown;
    }

    /**
     * 提取题目元数据
     */
    extractProblemMetadata(container = document) {
        // 1. 尝试在指定容器中查找标题
        let title = this.findTitleInContainer(container);
        
        // 2. 如果没找到，且容器不是document，尝试在全局查找
        if (!title && container !== document) {
            title = this.findTitleInContainer(document);
        }

        // 提取分数
        const scoreElement = container.querySelector('.pc-text-raw.text-xs') ||
                           document.querySelector('.pc-text-raw.text-xs');
        const scoreText = scoreElement ? scoreElement.textContent.trim() : '';
        const scoreMatch = scoreText.match(/分数\s*(\d+)/);
        const score = scoreMatch ? parseInt(scoreMatch[1]) : null;

        // 提取作者和单位信息
        const authorElements = document.querySelectorAll('.pc-color-lightest .pc-text-raw.text-xs');
        let author = '';
        let organization = '';
        
        authorElements.forEach(el => {
            const text = el.textContent.trim();
            if (text.startsWith('作者')) {
                author = text.replace('作者', '').trim();
            } else if (text.startsWith('单位')) {
                organization = text.replace('单位', '').trim();
            }
        });

        // 生成题目ID和类型
        const id = this.generateProblemId(title);
        const type = this.identifyProblemType(title); // 初始类型识别
        const difficulty = this.estimateDifficulty(title, score);

        return {
            id,
            title,
            type,
            score,
            author,
            organization,
            difficulty,
            language: 'C/C++', // PTA默认语言
            tags: this.extractTags(title)
        };
    }

    /**
     * 辅助方法：在容器中查找标题
     */
    findTitleInContainer(container) {
        const titleSelectors = [
            '.text-darkest.font-bold.text-lg',
            '.problem-title',
            '[data-e2e="problem-title"]',
            'div[class*="title"]',
            'h1', 'h2', 'h3'
        ];

        for (const selector of titleSelectors) {
            const elements = container.querySelectorAll(selector);
            for (const el of elements) {
                const text = el.textContent.trim();
                // 排除常见的非标题文本
                if (text && 
                    !text.includes('输入格式') && 
                    !text.includes('输出格式') && 
                    !text.includes('样例') && 
                    !text.includes('题目描述') &&
                    !text.includes('分数') &&
                    !text.includes('作者') &&
                    !text.includes('单位') &&
                    !text.match(/^\d+$/) && // 排除纯数字
                    text.length > 2) {
                    return text;
                }
            }
        }
        return '';
    }

    /**
     * 提取输入输出格式
     */
    extractIOFormats(container) {
        const formats = { input: '', output: '' };

        // 查找输入格式
        const inputHeaders = Array.from(container.querySelectorAll('h3')).filter(h =>
            h.textContent.includes('输入格式')
        );
        
        if (inputHeaders.length > 0) {
            formats.input = this.extractSectionContent(inputHeaders[0]);
        }

        // 查找输出格式
        const outputHeaders = Array.from(container.querySelectorAll('h3')).filter(h =>
            h.textContent.includes('输出格式')
        );
        
        if (outputHeaders.length > 0) {
            formats.output = this.extractSectionContent(outputHeaders[0]);
        }

        return formats;
    }

    /**
     * 提取样例数据
     */
    extractExamples(container) {
        const examples = { input: '', output: '' };

        // 查找输入样例
        const inputSampleHeaders = Array.from(container.querySelectorAll('h3')).filter(h =>
            h.textContent.includes('输入样例')
        );
        
        if (inputSampleHeaders.length > 0) {
            const codeBlock = this.findNextCodeBlock(inputSampleHeaders[0]);
            if (codeBlock) {
                examples.input = codeBlock.textContent.trim();
            }
        }

        // 查找输出样例
        const outputSampleHeaders = Array.from(container.querySelectorAll('h3')).filter(h =>
            h.textContent.includes('输出样例')
        );
        
        if (outputSampleHeaders.length > 0) {
            const codeBlock = this.findNextCodeBlock(outputSampleHeaders[0]);
            if (codeBlock) {
                examples.output = codeBlock.textContent.trim();
            }
        }

        // 备用方法：通过class查找
        if (!examples.input || !examples.output) {
            const inputCode = container.querySelector('code.language-in');
            const outputCode = container.querySelector('code.language-out');
            
            if (inputCode) examples.input = inputCode.textContent.trim();
            if (outputCode) examples.output = outputCode.textContent.trim();
        }

        return examples;
    }

    /**
     * 提取约束条件
     */
    extractConstraints() {
        const constraints = {};
        const problemInfo = document.querySelector('.problemInfo_tfBoz');
        
        if (!problemInfo) return constraints;

        const items = problemInfo.querySelectorAll('.item_nmQAb');
        
        items.forEach(item => {
            const label = item.querySelector('.label_rmDHl .pc-text-raw');
            const value = item.querySelector('.pc-color-normal .pc-text-raw');
            
            if (label && value) {
                const labelText = label.textContent.trim();
                const valueText = value.textContent.trim();
                
                switch (labelText) {
                    case '代码长度限制':
                        constraints.codeLength = valueText;
                        break;
                    case '时间限制':
                        constraints.timeLimit = valueText;
                        break;
                    case '内存限制':
                        constraints.memoryLimit = valueText;
                        break;
                    case '栈限制':
                        constraints.stackLimit = valueText;
                        break;
                }
            }
        });

        return constraints;
    }

    /**
     * 提取题目描述
     */
    extractDescription(container) {
        // 查找第一个段落作为题目描述
        const firstParagraph = container.querySelector('p');
        if (firstParagraph) {
            return firstParagraph.textContent.trim();
        }

        // 备用：查找markdown内容的第一部分
        const textContent = container.textContent.trim();
        const lines = textContent.split('\n').filter(line => line.trim());
        
        // 找到第一个非标题行作为描述
        for (const line of lines) {
            if (!line.includes('输入格式') && 
                !line.includes('输出格式') && 
                !line.includes('样例') &&
                line.length > 10) {
                return line.trim();
            }
        }

        return '';
    }

    /**
     * 增强检测结果
     */
    async enhanceDetectionResult(result) {
        // 补充缺失的信息
        if (!result.metadata) {
            result.metadata = this.extractProblemMetadata();
        }

        if (!result.constraints) {
            result.constraints = this.extractConstraints();
        }

        if (!result.description && result.element) {
            result.description = this.extractDescription(result.element);
        }

        // 重新评估题目类型（结合标题和描述）
        if (result.metadata.type === 'general' || result.metadata.type === 'unknown') {
            result.metadata.type = this.identifyProblemType(result.metadata.title, result.description);
        }

        // 添加解题提示和相关信息
        result.hints = this.generateHints(result.metadata, result.description);
        result.relatedTopics = this.identifyRelatedTopics(result.metadata.title, result.description);
        result.estimatedDifficulty = this.estimateDifficulty(result.metadata.title, result.metadata.score);

        // 添加代码模板建议
        result.codeTemplate = this.generateCodeTemplate(result.metadata.type);

        return result;
    }

    /**
     * 辅助方法：提取章节内容
     */
    extractSectionContent(headerElement) {
        const content = [];
        let nextElement = headerElement.nextElementSibling;
        
        while (nextElement && nextElement.tagName !== 'H3') {
            if (nextElement.textContent.trim()) {
                content.push(nextElement.textContent.trim());
            }
            nextElement = nextElement.nextElementSibling;
        }
        
        return content.join('\n').trim();
    }

    /**
     * 辅助方法：查找下一个代码块
     */
    findNextCodeBlock(element) {
        let next = element.nextElementSibling;
        
        while (next) {
            const codeBlock = next.querySelector('code') || 
                            (next.tagName === 'CODE' ? next : null) ||
                            (next.tagName === 'PRE' ? next : null);
            
            if (codeBlock) return codeBlock;
            next = next.nextElementSibling;
        }
        
        return null;
    }

    /**
     * 辅助方法：计算编程题特征分数
     */
    calculateProgrammingScore(text) {
        let score = 0;
        const normalizedText = text.toLowerCase();
        
        this.programmingKeywords.forEach(keyword => {
            if (normalizedText.includes(keyword.toLowerCase())) {
                score += 0.1;
            }
        });
        
        return Math.min(score, 1.0);
    }

    /**
     * 辅助方法：生成题目ID
     */
    generateProblemId(title) {
        if (!title) return 'unknown-problem';
        
        return title
            .toLowerCase()
            .replace(/[^\w\u4e00-\u9fa5]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 50);
    }

    /**
     * 辅助方法：识别题目类型
     */
    identifyProblemType(title, description = '') {
        if (!title && !description) return 'unknown';
        
        const text = (title + ' ' + description).toLowerCase();
        
        // 扩展的类型映射
        const extendedTypes = {
            ...this.problemTypes,
            '二叉树': 'tree',
            'binary tree': 'tree',
            '堆': 'heap',
            'heap': 'heap',
            '哈希': 'hash',
            'hash': 'hash',
            '递归': 'recursion',
            'recursion': 'recursion',
            '字符串': 'string',
            'string': 'string',
            '矩阵': 'matrix',
            'matrix': 'matrix'
        };
        
        for (const [keyword, type] of Object.entries(extendedTypes)) {
            if (text.includes(keyword.toLowerCase())) {
                return type;
            }
        }
        
        return 'general';
    }

    /**
     * 辅助方法：估算难度
     */
    estimateDifficulty(title, score) {
        // 基于分数估算
        if (score) {
            if (score <= 5) return 'easy';
            if (score <= 10) return 'medium';
            return 'hard';
        }
        
        // 基于标题关键词估算
        const hardKeywords = ['动态规划', '图算法', '复杂', '高级'];
        const easyKeywords = ['基础', '简单', '入门'];
        
        const titleLower = (title || '').toLowerCase();
        
        if (hardKeywords.some(k => titleLower.includes(k.toLowerCase()))) {
            return 'hard';
        }
        
        if (easyKeywords.some(k => titleLower.includes(k.toLowerCase()))) {
            return 'easy';
        }
        
        return 'medium';
    }

    /**
     * 辅助方法：提取标签
     */
    extractTags(title) {
        const tags = ['PTA', '编程题'];
        
        if (!title) return tags;
        
        const titleLower = title.toLowerCase();
        
        Object.keys(this.problemTypes).forEach(keyword => {
            if (titleLower.includes(keyword.toLowerCase())) {
                tags.push(keyword);
            }
        });
        
        return [...new Set(tags)];
    }

    /**
     * 辅助方法：生成解题提示
     */
    generateHints(metadata, description) {
        const hints = [];
        
        if (metadata.type === 'stack') {
            hints.push('考虑使用栈的LIFO特性');
            hints.push('注意栈的初始化、入栈、出栈操作');
        } else if (metadata.type === 'queue') {
            hints.push('考虑使用队列的FIFO特性');
            hints.push('注意队列的初始化、入队、出队操作');
        }
        
        if (description && description.includes('0表示结束')) {
            hints.push('注意输入结束条件的处理');
        }
        
        return hints;
    }

    /**
     * 辅助方法：识别相关主题
     */
    identifyRelatedTopics(title, description) {
        const topics = [];
        const text = `${title} ${description}`.toLowerCase();
        
        const topicMap = {
            '数据结构': ['栈', '队列', '链表', '数组', '树'],
            '算法': ['排序', '查找', '递归', '动态规划'],
            '基础操作': ['输入', '输出', '循环', '条件']
        };
        
        Object.entries(topicMap).forEach(([topic, keywords]) => {
            if (keywords.some(keyword => text.includes(keyword))) {
                topics.push(topic);
            }
        });
        
        return topics;
    }

    /**
     * 辅助方法：生成代码模板
     */
    generateCodeTemplate(type) {
        const templates = {
            stack: `#include <stdio.h>
#include <stdlib.h>

#define MAXSIZE 100

typedef struct {
    int data[MAXSIZE];
    int top;
} Stack;

// 初始化栈
void initStack(Stack *s) {
    s->top = -1;
}

// 入栈
int push(Stack *s, int x) {
    if (s->top >= MAXSIZE - 1) return 0;
    s->data[++s->top] = x;
    return 1;
}

// 出栈
int pop(Stack *s, int *x) {
    if (s->top < 0) return 0;
    *x = s->data[s->top--];
    return 1;
}

int main() {
    Stack s;
    initStack(&s);
    
    // TODO: 实现具体逻辑
    
    return 0;
}`,
            general: `#include <stdio.h>
#include <stdlib.h>

int main() {
    // TODO: 实现题目要求的功能
    
    return 0;
}`
        };
        
        return templates[type] || templates.general;
    }

    /**
     * 从代码块提取样例
     */
    extractExamplesFromCodeBlocks(codeBlocks) {
        const examples = { input: '', output: '' };
        const blocks = Array.from(codeBlocks);
        
        // 尝试通过class识别
        blocks.forEach(block => {
            const className = block.className || '';
            if (className.includes('language-in')) {
                examples.input = block.textContent.trim();
            } else if (className.includes('language-out')) {
                examples.output = block.textContent.trim();
            }
        });
        
        // 如果没有找到，使用位置推断
        if (!examples.input && blocks.length >= 1) {
            examples.input = blocks[0].textContent.trim();
        }
        if (!examples.output && blocks.length >= 2) {
            examples.output = blocks[1].textContent.trim();
        }
        
        return examples;
    }

    /**
     * 从信息区域提取约束
     */
    extractConstraintsFromInfo(problemInfo) {
        const constraints = {};
        const items = problemInfo.querySelectorAll('.item_nmQAb');
        
        items.forEach(item => {
            const labelEl = item.querySelector('.label_rmDHl');
            const valueEl = item.querySelector('.pc-color-normal');
            
            if (labelEl && valueEl) {
                const label = labelEl.textContent.trim();
                const value = valueEl.textContent.trim();
                
                if (label.includes('代码长度')) constraints.codeLength = value;
                if (label.includes('时间')) constraints.timeLimit = value;
                if (label.includes('内存')) constraints.memoryLimit = value;
                if (label.includes('栈')) constraints.stackLimit = value;
            }
        });
        
        return constraints;
    }

    /**
     * 从页面提取描述
     */
    extractDescriptionFromPage() {
        const selectors = [
            '.markdownBlock_tErSz p:first-child',
            '.rendered-markdown p:first-child',
            'p'
        ];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim().length > 10) {
                return element.textContent.trim();
            }
        }
        
        return '';
    }
}

// 导出检测器类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PTAProgrammingProblemDetector;
} else if (typeof window !== 'undefined') {
    window.PTAProgrammingProblemDetector = PTAProgrammingProblemDetector;
}

// 使用示例和测试函数
if (typeof window !== 'undefined') {
    /**
     * 快速测试函数
     */
    window.testProgrammingDetection = async function() {
        console.log('🧪 开始编程题检测测试...');
        
        const detector = new PTAProgrammingProblemDetector();
        const result = await detector.detectProgrammingProblem();
        
        console.log('📊 检测结果:', result);
        
        if (result.success) {
            console.log('✅ 检测成功!');
            console.log('📝 题目信息:', result.metadata);
            console.log('📥 输入格式:', result.ioFormats?.input);
            console.log('📤 输出格式:', result.ioFormats?.output);
            console.log('🔢 输入样例:', result.examples?.input);
            console.log('🔢 输出样例:', result.examples?.output);
            console.log('⚙️ 约束条件:', result.constraints);
            console.log('💡 解题提示:', result.hints);
        } else {
            console.log('❌ 检测失败:', result.error);
        }
        
        return result;
    };
    
    /**
     * 添加快捷键测试
     */
    document.addEventListener('keydown', function(e) {
        // Ctrl+Shift+P: 测试编程题检测
        if (e.ctrlKey && e.shiftKey && e.key === 'P') {
            e.preventDefault();
            window.testProgrammingDetection();
        }
    });
    
    console.log('🔧 编程题检测器已加载，按 Ctrl+Shift+P 进行测试');
}