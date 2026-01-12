// Web 题目助手内容脚本
console.log('🚀 Web 题目助手已加载');

// 全局状态
let toolbarElement = null;
let detectedQuestions = []; // 存储检测到的题目
let currentStats = {
    detected: 0,
    filled: 0,
    total: 0
};

// 题目类型定义
const QUESTION_TYPES = {
    SINGLE_CHOICE: 'single_choice',    // 单选题
    MULTIPLE_CHOICE: 'multiple_choice', // 多选题
    FILL_BLANK: 'fill_blank',          // 填空题
    PROGRAMMING: 'programming',         // 编程题
    TRUE_FALSE: 'true_false'           // 判断题
};

// 使用外部答案数据库
// answer-database.js 已经通过manifest.json加载

// 通用AI服务接口
let aiService = null;

// 初始化AI服务
async function initAIService() {
    try {
        // 等待所有依赖脚本加载完成
        await new Promise(resolve => {
            if (typeof AIService !== 'undefined') {
                resolve();
            } else {
                // 如果AIService未定义，等待一段时间后重试
                setTimeout(() => {
                    if (typeof AIService !== 'undefined') {
                        resolve();
                    } else {
                        console.warn('⚠️ AIService未定义，将使用备用方案');
                        resolve();
                    }
                }, 1000);
            }
        });
        
        if (typeof AIService !== 'undefined') {
            aiService = new AIService();
            console.log('✅ AI服务加载成功');
        } else {
            console.log('⚠️ AI服务未定义，将使用本地答案库');
        }
    } catch (error) {
        console.warn('AI服务初始化失败:', error);
    }
}

// 立即初始化AI服务
initAIService();

// 监听来自popup的消息
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    console.log('收到消息:', request);

    try {
        switch (request.action) {
            case 'detectPageType':
                await detectPageType(sendResponse);
                break;
            case 'detectQuestions':
                await detectQuestions(sendResponse);
                break;
            case 'autoFillAnswers':
                await autoFillAnswers(sendResponse);
                break;
            case 'submitAnswers':
                await submitAnswers(sendResponse);
                break;
            case 'getAPIStatus':
                await getAPIStatus(sendResponse);
                break;
            case 'testAPIConnection':
                await testAPIConnection(request.config, sendResponse);
                break;
            case 'updateAPIConfig':
                await updateAPIConfig(request.config, sendResponse);
                break;
            case 'clearAPICache':
                await clearAPICache(sendResponse);
                break;
            case 'testAIConnection':
                await testAIConnection(request.config, sendResponse);
                break;
            case 'updateAIConfig':
                await updateAIConfig(request.config, sendResponse);
                break;
            case 'getAIStatus':
                await getAIStatus(sendResponse);
                break;
            case 'getAnswersOnly':
                await getAnswersOnly(sendResponse);
                break;
            case 'testHunyuanConnection':
                await testHunyuanConnection(request.config, sendResponse);
                break;
            case 'updateHunyuanConfig':
                await updateHunyuanConfig(request.config, sendResponse);
                break;
            case 'clearHunyuanCache':
                await clearHunyuanCache(sendResponse);
                break;
            case 'getHunyuanStatus':
                await getHunyuanStatus(sendResponse);
                break;
            case 'detectProgrammingProblemMeta':
                await detectProgrammingProblemMeta(sendResponse);
                break;
            default:
                sendResponse({ success: false, error: '未知操作' });
        }
    } catch (error) {
        console.error('消息处理错误:', error);
        sendResponse({ success: false, error: error.message });
    }
    
    return true; // 保持消息通道开放，等待异步响应
    
    return true; // 保持消息通道开放
});

// 检测页面类型
async function detectPageType(sendResponse) {
    try {
        const url = window.location.href;
        const title = document.title;
        
        let pageType = 'unknown';
        let info = '';

        if (url.includes('/exam/')) {
            pageType = 'exam';
            info = '考试模式';
        } else if (url.includes('/practice/')) {
            pageType = 'practice';
            info = '练习模式';
        } else if (url.includes('/homework/')) {
            pageType = 'homework';
            info = '作业模式';
        } else if (url.includes('/problem/')) {
            pageType = 'problem';
            info = '单题模式';
        }

        // 获取考试/作业名称
        const titleElement = document.querySelector('h1, .exam-title, .problem-title');
        if (titleElement) {
            info += ` - ${titleElement.textContent.trim()}`;
        }

        sendResponse({
            success: true,
            pageType: pageType,
            info: info,
            url: url,
            title: title
        });
    } catch (error) {
        console.error('检测页面类型失败:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// 检测题目（增强版）
async function detectQuestions(sendResponse) {
    try {
        console.log('🔍 开始智能题目检测...');
        const questions = [];
        
        // 多阶段题目检测策略
        const detectionStrategies = [
            // 阶段1: 标准题目容器选择器
            () => {
                const standardSelectors = [
                    '.problem-item', '.question-item', '.exam-question',
                    '.problem-content', '.question-content',
                    '.quiz-item', '.test-item', '.exercise-item',
                    '[class*="problem"]', '[class*="question"]', '[class*="quiz"]',
                    '.card', '.panel', '.box', '.item'
                ];
                
                return standardSelectors.flatMap(selector => 
                    Array.from(document.querySelectorAll(selector))
                ).filter(el => el.textContent.trim().length > 20); // 过滤掉内容太少的元素
            },
            
            // 阶段2: 表单相关容器
            () => {
                const formContainers = [
                    'form', '.form-group', '.form-item', '.input-group',
                    '.answer-container', '.option-container'
                ];
                
                return formContainers.flatMap(selector => 
                    Array.from(document.querySelectorAll(selector))
                ).filter(el => {
                    const text = el.textContent.trim();
                    return text.length > 10 && (
                        text.includes('?') || // 包含问号
                        text.includes('：') || // 包含中文冒号
                        text.includes(':')    // 包含英文冒号
                    );
                });
            },

            // 阶段3: 专门查找代码编辑器容器（CodeMirror6/老版、custom editor）
            () => {
                const editorSelectors = [
                    '[data-e2e="code-editor-input"]',
                    '.codeEditor_CHvdZ',
                    '.codeEditor',
                    '.code-editor',
                    '.cm-editor',
                    '.cm-content[data-language]',
                    '.CodeMirror',
                    '.ace_editor',
                    '.monaco-editor'
                ];

                const found = editorSelectors.flatMap(s => Array.from(document.querySelectorAll(s)));
                if (!found || found.length === 0) return [];

                const containers = new Set();
                found.forEach(el => {
                    // 优先寻找更接近题目的父容器
                    const container = el.closest('.problem-item, .question-item, .exam-question, .exercise-item, .card, .panel, form, section, article, div') || el.parentElement;
                    if (container && container !== document.body) containers.add(container);
                });

                return Array.from(containers);
            },
            
            // 阶段3: 通过选项元素反向推断
            () => {
                const choiceElements = document.querySelectorAll(
                    'input[type="radio"], input[type="checkbox"], [role="radio"], [role="checkbox"]'
                );
                
                if (choiceElements.length === 0) return [];
                
                const questionContainers = new Set();
                choiceElements.forEach(input => {
                    // 查找最近的题目容器
                    const container = input.closest([
                        'div', 'section', 'article', 'form', 
                        '.form-group', '.card', '.panel'
                    ].join(', ')) || input.parentElement;
                    
                    if (container && container !== document.body) {
                        questionContainers.add(container);
                    }
                });
                
                return Array.from(questionContainers);
            },
            
            // 阶段4: 通过输入框推断
            () => {
                const inputElements = document.querySelectorAll(
                    'input[type="text"], input[type="number"], textarea, select'
                );
                
                if (inputElements.length === 0) return [];
                
                const questionContainers = new Set();
                inputElements.forEach(input => {
                    const container = input.closest([
                        'div', 'section', 'article', 'form', 
                        '.form-group', '.card', '.panel'
                    ].join(', ')) || input.parentElement;
                    
                    if (container && container !== document.body) {
                        questionContainers.add(container);
                    }
                });
                
                return Array.from(questionContainers);
            },
            
            // 阶段5: 文本内容分析（最后手段）
            () => {
                // 查找包含问题特征的文本块
                const potentialElements = document.querySelectorAll([
                    'p', 'div', 'span', 'li', 'td'
                ].join(', '));
                
                return Array.from(potentialElements).filter(el => {
                    const text = el.textContent.trim();
                    return text.length > 30 && (
                        // 问题特征检测
                        text.includes('?') || // 问号
                        text.includes('？') || // 中文问号
                        text.includes('：') || // 中文冒号
                        text.includes(':') || // 英文冒号
                        /[A-Da-d]\)/.test(text) || // 选项模式 A)
                        /[A-Da-d]\./.test(text) || // 选项模式 A.
                        /\d+\./.test(text) || // 数字选项 1.
                        text.includes('选择') || // 包含"选择"
                        text.includes('答案') || // 包含"答案"
                        text.includes('正确') || // 包含"正确"
                        text.includes('错误')    // 包含"错误"
                    );
                });
            }
        ];

        let questionElements = [];
        let detectionMethod = '';

        // 按顺序执行检测策略
        for (let i = 0; i < detectionStrategies.length; i++) {
            const strategy = detectionStrategies[i];
            const elements = strategy();
            
            console.log(`🔍 阶段${i + 1}检测找到 ${elements.length} 个元素`);
            
            if (elements.length > 0 && elements.length < 50) { // 避免过多元素
                questionElements = elements;
                detectionMethod = `阶段${i + 1}`;
                console.log(`✅ 使用${detectionMethod}找到 ${elements.length} 个题目容器`);
                break;
            }
        }

        console.log(`📊 检测方法: ${detectionMethod}, 找到 ${questionElements.length} 个容器`);

        // 智能解析题目
        const batchSize = 3;
        let successfulCount = 0;
        
        for (let i = 0; i < questionElements.length; i += batchSize) {
            const batch = questionElements.slice(i, i + batchSize);
            const batchPromises = batch.map((element, batchIndex) => {
                const globalIndex = i + batchIndex;
                return new Promise(resolve => {
                    setTimeout(() => {
                        console.log(`🔍 解析第 ${globalIndex + 1} 个题目...`);
                        const question = parseQuestion(element, globalIndex);
                        resolve(question);
                    }, 100); // 添加小延迟避免阻塞
                });
            });
            
            const batchResults = await Promise.all(batchPromises);
            
            batchResults.forEach(question => {
                if (question) {
                    questions.push(question);
                    successfulCount++;
                }
            });
            
            // 批次间延迟
            if (i + batchSize < questionElements.length) {
                await sleep(200);
            }
        }

        // 高亮检测到的题目
        if (questionElements.length > 0) {
            highlightQuestions(questionElements);
            console.log(`🎨 已高亮 ${questionElements.length} 个题目`);
        }

        console.log(`🎉 检测完成！成功识别 ${successfulCount}/${questionElements.length} 道题目`);
        
        sendResponse({
            success: true,
            questions: questions,
            count: questions.length,
            detectionMethod: detectionMethod,
            totalContainers: questionElements.length
        });
    } catch (error) {
        console.error('❌ 检测题目失败:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// 解析单个题目（增强版）
function parseQuestion(element, index) {
    try {
        console.log(`🔍 解析题目 ${index + 1}`);
        
        // 1. 获取题目标题
        let title = extractQuestionTitle(element, index);
        
        // 2. 检测题目类型
        const type = detectQuestionType(element);
        console.log(`🏷️ 题目类型: ${type}`);
        
        // 3. 获取选项（增强版）
        const options = getQuestionOptions(element);
        console.log(`📋 选项数量: ${options.length}`);
        
        // 4. 获取输入框
        const inputs = getQuestionInputs(element);
        console.log(`📝 输入框数量: ${inputs.length}`);
        
        // 5. 提取题目内容（智能截取）
        const content = extractQuestionContent(element, title);
        
        const question = {
            index: index,
            title: title,
            type: type,
            element: element,
            options: options,
            inputs: inputs,
            content: content,
            fullText: element.textContent.trim()
        };

        console.log(`✅ 题目解析成功: ${title.substring(0, 30)}...`);

        // 如果是编程题，触发异步分析（调用后端AI推理）并展示结果
        if (type === QUESTION_TYPES.PROGRAMMING) {
            // 异步执行，不阻塞检测流程
            setTimeout(() => {
                try {
                    analyzeProgrammingQuestion(question);
                } catch (e) {
                    console.warn('触发编程题分析失败:', e);
                }
            }, 50);
        }

        return question;
        
    } catch (error) {
        console.error(`❌ 解析题目 ${index + 1} 失败:`, error);
        return null;
    }
}

// 提取题目标题（增强版）
function extractQuestionTitle(element, index) {
    const titleSelectors = [
        '.problem-title', '.question-title', '.title-text',
        '.problem-text', '.question-text', '.quiz-title',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'strong', 'b', '.bold', '.header',
        'p:first-child', 'div:first-child', 'span:first-child'
    ];
    
    // 尝试通过选择器查找标题
    for (const selector of titleSelectors) {
        const titleElement = element.querySelector(selector);
        if (titleElement && titleElement.textContent.trim().length > 5) {
            let title = titleElement.textContent.trim();
            
            // 清理标题（移除可能的多余内容）
            title = title
                .replace(/^\d+[\.\)]\s*/, '') // 移除题号如"1. "
                .replace(/^[A-Da-d][\.\)]\s*/, '') // 移除选项前缀如"A. "
                .replace(/^【.*?】/, '') // 移除中文括号内容
                .replace(/^\[.*?\]/, '') // 移除英文括号内容
                .trim();
            
            if (title.length > 3) {
                console.log(`📝 找到标题 (${selector}): ${title.substring(0, 50)}...`);
                return title;
            }
        }
    }
    
    // 如果没找到，从元素文本中提取
    const elementText = element.textContent.trim();
    if (elementText.length > 10) {
        // 尝试找到第一个句子或问句
        const firstSentence = elementText.split(/[.!?。！？]/)[0];
        if (firstSentence && firstSentence.length > 10) {
            return firstSentence.substring(0, 60) + (firstSentence.length > 60 ? '...' : '');
        }
        
        // 使用前60个字符
        return elementText.substring(0, 60) + (elementText.length > 60 ? '...' : '');
    }
    
    // 最后使用默认标题
    return `题目 ${index + 1}`;
}

// 提取题目内容（智能版）
function extractQuestionContent(element, title) {
    const fullText = element.textContent.trim();
    
    // 如果标题已经包含了主要内容，直接使用标题
    if (title.length > 30 && fullText.includes(title)) {
        return title;
    }
    
    // 移除选项和无关内容
    let content = fullText
        .replace(/\s+/g, ' ') // 合并多余空格
        .replace(/[A-Da-d][\.\)]\s*[^\n]+/g, '') // 移除选项
        .replace(/\d+[\.\)]\s*[^\n]+/g, '') // 移除数字选项
        .replace(/正确|错误|选择|答案/g, '') // 移除常见关键词
        .trim();
    
    // 截取合理长度
    if (content.length > 150) {
        // 尝试保留问句部分
        const questionMarkIndex = content.lastIndexOf('?') || content.lastIndexOf('？');
        if (questionMarkIndex > 50) {
            content = content.substring(0, questionMarkIndex + 1);
        } else {
            content = content.substring(0, 150) + '...';
        }
    }
    
    return content || title;
}

// 检测题目类型（增强版）
function detectQuestionType(element) {
    const elementText = element.textContent.toLowerCase();
    
    console.log(`🔍 开始题目类型检测，文本: "${elementText.substring(0, 50)}..."`);
    
    // 1. 基于输入元素检测（最可靠）
    const radioInputs = element.querySelectorAll('input[type="radio"]');
    const checkboxInputs = element.querySelectorAll('input[type="checkbox"]');
    
    if (radioInputs.length > 0) {
        console.log(`✅ 检测到 ${radioInputs.length} 个单选按钮`);
        return QUESTION_TYPES.SINGLE_CHOICE;
    }
    
    if (checkboxInputs.length > 0) {
        console.log(`✅ 检测到 ${checkboxInputs.length} 个复选框`);
        return QUESTION_TYPES.MULTIPLE_CHOICE;
    }
    
    // 新增：无选择控件时的编程/填空判定
    const hasTextInputs = element.querySelectorAll('input[type="text"], textarea').length > 0;
    // 扩展编辑器检测：支持 Ace、CodeMirror 旧/新版本、Monaco 以及页面特定的 codeEditor 容器
    const hasEditors = !!element.querySelector(
        '.ace_editor, .CodeMirror, .cm-editor, .cm-scroller, .cm-content[data-language], [data-e2e="code-editor-input"], .codeEditor_CHvdZ, .codeEditor, .code-editor, .monaco-editor'
    );
    const hasCodeBlocks = !!element.querySelector('code, pre code, pre');
    if (radioInputs.length === 0 && checkboxInputs.length === 0) {
        if (hasEditors || hasCodeBlocks) {
            console.log('✅ 无选项且存在代码块/编辑器，判定为编程题');
            return QUESTION_TYPES.PROGRAMMING;
        }
        if (hasTextInputs) {
            console.log('✅ 无选项但存在文本输入，判定为填空题');
            return QUESTION_TYPES.FILL_BLANK;
        }
    }
    
    // 2. 基于选项模式检测（重点优化选择题检测）
    const optionPatterns = [
        /[A-Da-d][\.\)]\s*[^\n]+/g,      // A. 选项内容
        /\d+[\.\)]\s*[^\n]+/g,           // 1. 选项内容
        /[①②③④⑤⑥]\s*[^\n]+/g,        // ① 选项内容
        /[●○■□▶➤›•▪]\s*[^\n]+/g,        // ● 选项内容
        /<input[^>]*>\s*[^<]+/gi,        // <input> 选项内容
        /<label[^>]*>\s*[^<]+<\/label>/gi // <label> 选项内容
    ];
    
    let optionCount = 0;
    let optionMatches = [];
    
    for (const pattern of optionPatterns) {
        const matches = elementText.match(pattern);
        if (matches) {
            optionCount += matches.length;
            optionMatches = optionMatches.concat(matches);
        }
    }
    
    console.log(`📊 检测到 ${optionCount} 个选项模式匹配`);
    if (optionMatches.length > 0) {
        console.log('🔍 匹配的选项:', optionMatches.slice(0, 3).map(m => m.substring(0, 20) + '...'));
    }
    
    if (optionCount >= 2) {
        // 判断是单选还是多选
        const hasCheckAll = elementText.includes('全选') || elementText.includes('所有') || 
                           elementText.includes('select all') || elementText.includes('check all');
        const hasMultipleHint = elementText.includes('多选') || elementText.includes('多选题') ||
                               elementText.includes('multiple') || elementText.includes('哪些');
        
        if (hasCheckAll || hasMultipleHint) {
            console.log('✅ 检测为多选题');
            return QUESTION_TYPES.MULTIPLE_CHOICE;
        }
        console.log('✅ 检测为单选题');
        return QUESTION_TYPES.SINGLE_CHOICE;
    }
    
    // 3. 基于文本关键词检测（简化版）
    if (elementText.includes('正确') && elementText.includes('错误') || 
        elementText.includes('true') && elementText.includes('false') ||
        elementText.includes('判断') && (elementText.includes('对') || elementText.includes('错'))) {
        console.log('✅ 检测为判断题');
        return QUESTION_TYPES.TRUE_FALSE;
    }
    
    if (elementText.includes('填空') || elementText.includes('补充') || 
        elementText.includes('填入') || elementText.includes('____')) {
        console.log('✅ 检测为填空题');
        return QUESTION_TYPES.FILL_BLANK;
    }
    
    if (elementText.includes('编程') || elementText.includes('代码') || 
        elementText.includes('程序') || elementText.includes('function')) {
        console.log('✅ 检测为编程题');
        return QUESTION_TYPES.PROGRAMMING;
    }
    
    // 4. 基于CSS类名检测
    const classNames = (element.className.toLowerCase() + ' ' + 
                       (element.getAttribute('class') || '')).toLowerCase();
    
    if (classNames.includes('radio') || classNames.includes('choice') || classNames.includes('option')) {
        console.log('✅ 通过CSS类名检测为选择题');
        return QUESTION_TYPES.SINGLE_CHOICE;
    }
    
    if (classNames.includes('checkbox') || classNames.includes('multiple')) {
        console.log('✅ 通过CSS类名检测为多选题');
        return QUESTION_TYPES.MULTIPLE_CHOICE;
    }
    
    console.log('❓ 题目类型未知，尝试获取选项...');
    
    // 最后尝试：如果有选项，默认为单选题
    const options = getQuestionOptions(element);
    if (options.length >= 2) {
        console.log(`✅ 通过选项检测默认为单选题 (${options.length} 个选项)`);
        return QUESTION_TYPES.SINGLE_CHOICE;
    }
    
    console.log('❌ 无法确定题目类型');
    return 'unknown';
}

// 获取题目选项（Pintia增强版）
function getQuestionOptions(element) {
    const options = [];
    const elementText = element.textContent;
    
    console.log(`🔍 开始解析 Pintia 题目选项，元素文本长度: ${elementText.length}`);
    
    // 1. 查找所有可能的选项输入元素（针对 Pintia 的扩展选择器）
    const optionInputs = element.querySelectorAll([
        'input[type="radio"]', 
        'input[type="checkbox"]',
        '[role="radio"]', 
        '[role="checkbox"]',
        // Pintia 特定选择器
        '.pc-radio input',
        '.pc-checkbox input',
        '.ant-radio-input',
        '.ant-checkbox-input',
        // 新增 Pintia 选择器
        '[data-option]',
        '.option-item input',
        '.choice-item input',
        '.answer-option input'
    ].join(', '));
    
    console.log(`📊 找到 ${optionInputs.length} 个输入元素`);

    // 如果找到输入元素，按 Pintia 结构处理
    if (optionInputs.length > 0) {
        optionInputs.forEach((input, index) => {
            console.log(`🔧 处理输入元素 ${index + 1}:`, input);
            
            let optionText = '';
            // 强制使用A、B、C、D作为选项值，而不是input的value（通常是"on"）
            let optionValue = String.fromCharCode(65 + index); // A, B, C, D
            const inputName = input.name || input.getAttribute('name') || '';
            
            // 方式1: 查找 Pintia 结构的 label（label 包裹 input）
            const parentLabel = input.closest('label');
            if (parentLabel) {
                // 针对 Pintia 结构：label.w-full.inline-flex 内部包含“字母span + markdown文本”
                const letterSpan = parentLabel.querySelector('span');
                const letterRaw = (letterSpan && letterSpan.textContent) ? letterSpan.textContent.trim() : '';
                // 规范化字母（如 "D." -> "D"）
                const letterMatch = letterRaw.match(/^[A-F]/i);
                if (letterMatch) {
                    optionValue = letterMatch[0].toUpperCase();
                }
                // 取 markdown 文本作为选项正文
                const mdEl = parentLabel.querySelector('.markdownBlock_tErSz .rendered-markdown, .markdownBlock_tErSz, .rendered-markdown');
                if (mdEl && mdEl.textContent) {
                    optionText = mdEl.textContent.trim();
                } else {
                    optionText = extractPintiaOptionText(parentLabel, optionValue);
                }
                console.log(`🏷️ Pintia 父级label解析: [${optionValue}] ${optionText}`);
            }
            
            // 方式2: 查找关联的label标签（for属性）
            if (!optionText && input.id) {
                const label = document.querySelector(`label[for="${input.id}"]`);
                if (label) {
                    optionText = extractPintiaOptionText(label, optionValue);
                    console.log(`🏷️ 通过for属性找到label: ${optionText}`);
                }
            }
            
            // 方式3: 查找 Pintia 特定的 markdown 内容
            if (!optionText) {
                const markdownContent = input.closest('.markdownBlock_tErSz');
                if (markdownContent) {
                    optionText = extractPintiaOptionText(markdownContent, optionValue);
                    console.log(`📖 通过markdown内容找到: ${optionText}`);
                }
            }
            
            // 方式4: 查找相邻的选项文本容器
            if (!optionText) {
                const textContainer = input.closest('[class*="flex"],[class*="item"],[class*="option"],[class*="choice"]');
                if (textContainer) {
                    optionText = extractPintiaOptionText(textContainer, optionValue);
                    console.log(`📦 通过flex容器找到: ${optionText}`);
                }
            }
            
            // 方式5: 查找兄弟元素中的文本
            if (!optionText) {
                // 查找相邻的span或div包含选项文本
                const siblingText = findSiblingOptionText(input);
                if (siblingText) {
                    optionText = siblingText;
                    console.log(`🔍 通过兄弟元素找到: ${optionText}`);
                }
            }
            
            // 方式6: 使用input的value或默认值
            if (!optionText) {
                optionText = optionValue || inputName || 
                            input.getAttribute('data-value') || 
                            input.getAttribute('data-text') ||
                            `选项${String.fromCharCode(65 + index)}`; // A, B, C, D
                console.log(`📝 使用输入值作为备选: ${optionText}`);
            }
            
            // 最终清理和验证
            if (optionText) {
                optionText = cleanPintiaOptionText(optionText, optionValue);
                
                // 验证选项文本的有效性
                if (isValidOptionText(optionText)) {
                    // 使用input的实际value（如果有），否则使用字母选项
                    const rawValue = input.value || input.getAttribute('value') || '';
                    const actualValue = (!rawValue || rawValue === 'on') ? optionValue : rawValue;
                    
                    options.push({
                        element: input,
                        input: input, // 为自动填充提供稳定引用
                        // 统一将可检索/匹配的值设为字母A/B/C/D（与显示一致）
                        value: optionValue,
                        rawValue: rawValue, // 保留原始value（可能为'on'或实际值）
                        text: optionText,
                        type: input.type || 'radio',
                        name: inputName,
                        // 展示字母与检索字母一致
                        displayValue: optionValue,
                        // 添加原始DOM元素引用用于自动填充（兼容旧字段）
                        domElement: input
                    });
                    console.log(`✅ 添加选项: ${optionValue} -> ${optionText}`);
                } else {
                    console.log(`❌ 跳过无效选项: ${optionText}`);
                }
            }
        });
    }
    
    // 2. 如果没有找到输入元素，尝试从 Pintia 文本结构中解析选项
    if (options.length < 2) {
        console.log(`📝 输入元素不足(${options.length})，尝试 Pintia 文本解析...`);
        const textOptions = extractOptionsFromPintiaText(element);
        textOptions.forEach(opt => {
            if (!options.some(existing => existing.text === opt.text)) {
                options.push(opt);
                console.log(`📄 从 Pintia 文本添加选项: ${opt.text}`);
            }
        });
    }
    
    // 3. 智能去重和排序
    const finalOptions = deduplicateAndSortOptions(options);
    
    console.log(`🎯 最终识别到 ${finalOptions.length} 个选项`);
    if (finalOptions.length > 0) {
        console.log('📋 Pintia 选项列表:', finalOptions.map((opt, i) => `${opt.value}. ${opt.text}`).join('\n'));
    }
    
    return finalOptions;
}

// 新增：查找兄弟元素中的选项文本
function findSiblingOptionText(inputElement) {
    // 查找相邻的文本元素
    const siblings = Array.from(inputElement.parentElement.children);
    for (const sibling of siblings) {
        if (sibling !== inputElement && sibling.nodeType === 1) { // 元素节点
            const text = sibling.textContent.trim();
            if (text && text.length > 1 && !text.includes('<') && !text.includes('input')) {
                // 清理文本（移除可能的选项前缀）
                const cleanText = text
                    .replace(/^[A-Da-d][\.\)]\s*/, '')
                    .replace(/^\d+[\.\)]\s*/, '')
                    .trim();
                
                if (cleanText && cleanText.length > 1) {
                    return cleanText;
                }
            }
        }
    }
    return null;
}

// Pintia 专用选项文本提取
function extractPintiaOptionText(element, optionValue) {
    let text = element.textContent.trim();
    
    // 移除input元素本身的内容
    const inputs = element.querySelectorAll('input');
    inputs.forEach(input => {
        text = text.replace(input.outerHTML, '');
    });
    
    // 查找 markdown 内容（Pintia 特定结构）
    const markdownBlock = element.querySelector('.markdownBlock_tErSz');
    if (markdownBlock) {
        text = markdownBlock.textContent.trim();
    }
    
    // 清理 Pintia 特定的格式
    text = text
        .replace(/<[^>]*>/g, '') // 移除HTML标签
        .replace(/[\n\r\t]/g, ' ') // 替换换行和制表符
        .replace(/\s{2,}/g, ' ') // 合并多个空格
        .replace(/^[A-Da-d][\.\)]\s*/, '') // 移除选项前缀如"A."
        .replace(/^\d+[\.\)]\s*/, '') // 移除数字前缀如"1."
        .replace(new RegExp(`^\\s*${optionValue}\\s*`), '') // 移除input value
        .replace(/^[A-Da-d]\.\s*/, '') // 移除"A. "前缀
        .replace(/^[A-Da-d]\)\s*/, '') // 移除"A) "前缀
        .trim();
    
    // 如果文本为空，尝试从子元素中提取
    if (!text) {
        const textElements = element.querySelectorAll('div, span, p');
        for (const el of textElements) {
            const elText = el.textContent.trim();
            if (elText && !elText.includes('<') && !elText.includes('input')) {
                text = elText;
                break;
            }
        }
    }
    
    return text || element.textContent.trim();
}

// Pintia 文本结构选项提取
function extractOptionsFromPintiaText(element) {
    const options = [];
    
    // 方法1: 直接查找 Pintia 的选项 span 结构
    const optionSpans = element.querySelectorAll('span.block.p-0\\.5');
    if (optionSpans.length >= 2) {
        console.log('🎯 找到 Pintia 选项span结构');
        optionSpans.forEach((span, index) => {
            const label = span.querySelector('label');
            if (label) {
                const optionText = extractPintiaOptionText(label, String.fromCharCode(65 + index));
                const optionValue = String.fromCharCode(65 + index); // A, B, C, D
                
                if (optionText && isValidOptionText(optionText)) {
                    options.push({
                        value: optionValue,
                        text: optionText,
                        type: 'radio',
                        element: span
                    });
                    console.log(`✅ 添加 Pintia 选项 ${optionValue}: ${optionText}`);
                }
            }
        });
        
        if (options.length >= 2) {
            return options;
        }
    }
    
    // 方法2: 查找 Pintia 的 label 结构
    const pintiaLabels = element.querySelectorAll('label.w-full.inline-flex');
    if (pintiaLabels.length >= 2) {
        console.log('🎯 找到 Pintia label结构');
        pintiaLabels.forEach((label, index) => {
            const optionText = extractPintiaOptionText(label, String.fromCharCode(65 + index));
            const optionValue = String.fromCharCode(65 + index); // A, B, C, D
            
            if (optionText && isValidOptionText(optionText)) {
                options.push({
                    value: optionValue,
                    text: optionText,
                    type: 'radio',
                    element: label
                });
                console.log(`✅ 添加 Pintia label选项 ${optionValue}: ${optionText}`);
            }
        });
        
        if (options.length >= 2) {
            return options;
        }
    }
    
    // 方法3: 查找input和对应的文本
    const optionInputs = element.querySelectorAll('input[type="radio"], input[type="checkbox"]');
    if (optionInputs.length >= 2) {
        console.log('🎯 找到 Pintia input结构');
        optionInputs.forEach((input, index) => {
            // 查找对应的文本内容
            const container = input.closest('label') || input.closest('span') || input.parentElement;
            if (container) {
                const optionText = extractPintiaOptionText(container, String.fromCharCode(65 + index));
                const optionValue = String.fromCharCode(65 + index); // A, B, C, D
                
                if (optionText && isValidOptionText(optionText)) {
                    options.push({
                        value: optionValue,
                        text: optionText,
                        type: input.type,
                        element: input
                    });
                    console.log(`✅ 添加 Pintia input选项 ${optionValue}: ${optionText}`);
                }
            }
        });
        
        if (options.length >= 2) {
            return options;
        }
    }
    
    // 方法4: 备用文本解析（原始方法）
    const text = element.textContent;
    const pintiaPatterns = [
        // 标准选项格式: A. 内容
        /[A-Da-d][\.\)]\s*([^\n]+?)(?=\s*(?:[A-Da-d][\.\)]|\d+[\.\)]|$))/g,
        // 数字选项格式: 1. 内容
        /\d+[\.\)]\s*([^\n]+?)(?=\s*(?:[A-Da-d][\.\)]|\d+[\.\)]|$))/g,
        // 中文选项格式: A) 内容
        /[A-Da-d]\)\s*([^\n]+)/g
    ];
    
    pintiaPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(text)) !== null) {
            let optionText = match[1] ? match[1].trim() : match[0].trim();
            if (optionText && optionText.length > 1) {
                // 提取选项标识符
                const optionMatch = match[0].match(/^([A-Da-d])/);
                const optionValue = optionMatch ? optionMatch[1].toUpperCase() : 
                    String.fromCharCode(65 + options.length);
                
                optionText = cleanPintiaOptionText(optionText, optionValue);
                
                if (isValidOptionText(optionText)) {
                    options.push({
                        value: optionValue,
                        text: optionText,
                        type: 'text'
                    });
                }
            }
        }
    });
    
    return options;
}

// Pintia 专用文本清理（增强版）
function cleanPintiaOptionText(text, optionValue) {
    if (!text) return '';
    
    // 首先移除HTML标签和特殊字符
    let cleanedText = text
        .replace(/<[^>]*>/g, '') // 移除HTML标签
        .replace(/[\n\r\t]/g, ' ') // 替换换行和制表符
        .replace(/\s{2,}/g, ' ') // 合并多个空格
        .trim();
    
    // 移除常见的选项前缀模式
    const prefixPatterns = [
        // 标准选项格式: A. A) A、 
        new RegExp(`^\\s*[${optionValue}${optionValue.toLowerCase()}][\\.\\)\\、]\\s*`, 'i'),
        // 数字选项格式: 1. 1) 1、
        new RegExp(`^\\s*\\d+[\\.\\)\\、]\\s*`),
        // 中文选项格式: 选项A 选项一
        new RegExp(`^\\s*(?:选项|选择|答案)?[${optionValue}${optionValue.toLowerCase()}]\\s*`, 'i'),
        // 英文选项格式: option A choice A
        new RegExp(`^\\s*(?:option|choice)\\s+[${optionValue}${optionValue.toLowerCase()}]\\s*`, 'i')
    ];
    
    prefixPatterns.forEach(pattern => {
        cleanedText = cleanedText.replace(pattern, '');
    });
    
    // 移除input value和可能的重复选项标识
    cleanedText = cleanedText
        .replace(new RegExp(`^\\s*${optionValue}\\s*`, 'i'), '')
        .replace(new RegExp(`\\s*${optionValue}\\s*$`, 'i'), '')
        .replace(/^\.\s*/, '') // 移除开头的点
        .trim();
    
    // 如果清理后为空，返回原始文本（避免丢失有效内容）
    if (!cleanedText) {
        return text.replace(/<[^>]*>/g, '').replace(/\s{2,}/g, ' ').trim();
    }
    
    return cleanedText;
}

// Pintia 专用选项识别测试函数
function testPintiaOptionRecognition() {
    console.log('🧪 开始 Pintia 选项识别测试...');
    
    // 查找 Pintia 题目容器
    const pintiaContainers = document.querySelectorAll([
        '.pc-x',
        '.problem-container',
        '.question-wrapper',
        '[class*="problem"]',
        '[class*="question"]',
        '.markdownBlock_tErSz'
    ].join(', '));
    
    console.log(`📊 找到 ${pintiaContainers.length} 个Pintia题目容器`);
    
    const results = [];
    
    pintiaContainers.forEach((container, index) => {
        console.log(`\n🔍 测试第 ${index + 1} 个Pintia容器...`);
        
        try {
            const options = getQuestionOptions(container);
            console.log(`✅ 识别到 ${options.length} 个选项`);
            
            if (options.length > 0) {
                results.push({
                    container: container,
                    options: options,
                    success: true
                });
                
                // 高亮成功的容器
                container.classList.add('wph-test-success');
                
                // 在控制台输出详细结果
                console.log('📋 识别结果:');
                options.forEach((opt, i) => {
                    console.log(`  ${opt.value}. ${opt.text}`);
                });
            } else {
                console.log('⚠️ 未识别到选项');
                container.classList.add('wph-test-failed');
                results.push({
                    container: container,
                    options: [],
                    success: false,
                    error: '未识别到选项'
                });
            }
        } catch (error) {
            console.error(`❌ 测试失败:`, error);
            container.classList.add('wph-test-error');
            results.push({
                container: container,
                options: [],
                success: false,
                error: error.message
            });
        }
    });
    
    // 输出总体测试结果
    console.log('\n📊 Pintia 选项识别测试完成:');
    console.log(`✅ 成功: ${results.filter(r => r.success).length}`);
    console.log(`❌ 失败: ${results.filter(r => !r.success).length}`);
    console.log(`📋 总共识别: ${results.reduce((sum, r) => sum + r.options.length, 0)} 个选项`);
    
    return results;
}

// 验证选项文本有效性
function isValidOptionText(text) {
    if (!text || text.length < 1) return false;
    if (text.length > 200) return false; // 太长的文本可能不是选项
    if (/^\d+$/.test(text)) return false; // 纯数字可能不是选项文本
    if (/^[A-Da-d]$/.test(text)) return false; // 单个字母可能不是选项文本
    if (/^[\.\)\s]+$/.test(text)) return false; // 只有标点和空格
    return true;
}

// 选项去重和排序
function deduplicateAndSortOptions(options) {
    // 稳定排序：按元素位置（top/left）
    const sortedOptions = [...options].sort((a, b) => {
        const ra = a.element?.getBoundingClientRect?.() || { top: 0, left: 0 };
        const rb = b.element?.getBoundingClientRect?.() || { top: 0, left: 0 };
        if (ra.top !== rb.top) return ra.top - rb.top;
        return ra.left - rb.left;
    });

    const uniqueOptions = [];
    const seenElems = new Set();
    const seenKeys = new Set();

    for (const opt of sortedOptions) {
        // 1) 仅按元素引用去重（最可靠，避免误删）
        if (opt.element) {
            if (seenElems.has(opt.element)) {
                continue;
            }
            seenElems.add(opt.element);
            uniqueOptions.push(opt);
            continue;
        }
        // 2) 无元素引用时的兜底：使用“原文本 + 显示/值 + name + type”的组合键
        const key = [
            (opt.text || '').toLowerCase().trim(), // 保留原文本，避免过度规范化导致误合并
            (opt.displayValue || opt.value || '').toString(),
            (opt.name || '').toString(),
            (opt.type || '').toString()
        ].join('::');

        if (seenKeys.has(key)) {
            continue;
        }
        seenKeys.add(key);
        uniqueOptions.push(opt);
    }

    return uniqueOptions;
}

// 最终测试功能
function setupFinalTesting() {
    console.log('🔧 设置最终测试功能...');
    
    // 添加测试快捷键
    document.addEventListener('keydown', function(e) {
        // Ctrl+Shift+T: 运行最终测试
        if (e.ctrlKey && e.shiftKey && e.key === 'T') {
            e.preventDefault();
            console.clear();
            runFinalTest().then(result => {
                console.log('🎯 最终测试完成:', result);
                showNotification('测试完成', `成功识别 ${result.optionRecognition} 个题目`, 'success');
            });
        }
        
        // Ctrl+Shift+O: 测试选项识别
        if (e.ctrlKey && e.shiftKey && e.key === 'O') {
            e.preventDefault();
            console.clear();
            testPintiaOptionRecognition().then(results => {
                const successCount = results.filter(r => r.success).length;
                console.log('🎯 选项识别测试完成:', results);
                showNotification('选项测试', `成功识别 ${successCount} 个题目`, 'info');
            });
        }
    });
    
    console.log('✅ 测试快捷键已启用: Ctrl+Shift+T (全面测试), Ctrl+Shift+O (选项测试)');
}

// 运行最终测试
async function runFinalTest() {
    console.log('🧪 开始最终功能测试...');
    
    try {
        // 1. 测试选项识别
        console.log('\n1. 📋 测试选项识别功能...');
        const testResults = await testPintiaOptionRecognition();
        
        console.log(`📊 测试结果: ${testResults.length} 个题目容器`);
        const successCount = testResults.filter(r => r.success).length;
        const totalOptions = testResults.reduce((sum, r) => sum + r.options.length, 0);
        
        console.log(`✅ 成功识别: ${successCount}/${testResults.length}`);
        console.log(`📋 总共选项: ${totalOptions}`);
        
        // 2. 测试题目检测
        console.log('\n2. 🔍 测试题目检测功能...');
        const questions = await detectQuestionsSync();
        console.log(`📊 检测到 ${questions.length} 道题目`);
        
        if (questions.length > 0) {
            questions.forEach((q, i) => {
                console.log(`   ${i + 1}. ${q.title.substring(0, 40)}... (${q.type}, ${q.options.length} 选项)`);
            });
        }
        
        // 3. 测试API连接（如果配置了）
        console.log('\n3. 🌐 测试API连接状态...');
        const apiStatus = await getAPIStatusSync();
        console.log(`📡 API状态: ${apiStatus.enabled ? '已启用' : '未启用'}`);
        if (apiStatus.enabled) {
            console.log(`   🔑 API密钥: ${apiStatus.hasKey ? '已配置' : '未配置'}`);
            console.log(`   📦 缓存大小: ${apiStatus.cacheSize}`);
        }
        
        // 4. 总体评估
        console.log('\n4. 📈 总体评估:');
        if (successCount > 0 && questions.length > 0) {
            console.log('🎉 测试通过！Web 题目助手功能正常');
            console.log('💡 建议: 在真实的 Pintia 网站上进一步测试');
        } else {
            console.log('⚠️  测试未完全通过，需要进一步优化');
            if (successCount === 0) {
                console.log('   ❌ 选项识别功能需要改进');
            }
            if (questions.length === 0) {
                console.log('   ❌ 题目检测功能需要改进');
            }
        }
        
        return {
            success: successCount > 0 && questions.length > 0,
            optionRecognition: successCount,
            questionDetection: questions.length,
            apiStatus: apiStatus,
            details: testResults
        };
        
    } catch (error) {
        console.error('❌ 最终测试失败:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// 同步版本的函数
function detectQuestionsSync() {
    return new Promise((resolve) => {
        detectQuestions((response) => {
            resolve(response.success ? response.questions : []);
        });
    });
}

function getAPIStatusSync() {
    return new Promise((resolve) => {
        getAPIStatus((response) => {
            resolve(response.success ? response.status : { enabled: false, hasKey: false, cacheSize: 0 });
        });
    });
}

// 初始化时设置测试功能
setTimeout(setupFinalTesting, 3000);

// 从label提取选项文本
function extractOptionTextFromLabel(label, optionValue) {
    let text = label.textContent.trim();
    
    // 移除input value重复内容
    if (optionValue && text.includes(optionValue)) {
        text = text.replace(optionValue, '').trim();
    }
    
    // 清理常见标签和符号
    text = text
        .replace(/<[^>]*>/g, '') // 移除HTML标签
        .replace(/[•▪▶➤›]/g, '') // 移除项目符号
        .replace(/^\s*[A-Da-d]\)?\s*/, '') // 移除选项前缀
        .replace(/^\s*\d+\.?\s*/, '') // 移除数字前缀
        .replace(/\s+/g, ' ') // 合并空格
        .trim();
    
    return text || label.textContent.trim();
}

// 查找相邻文本
function findAdjacentText(input, optionValue) {
    let text = '';
    
    // 检查所有方向的兄弟元素
    const directions = ['next', 'previous'];
    const types = ['Element', 'Text'];
    
    for (const dir of directions) {
        for (const type of types) {
            let sibling = input;
            let found = false;
            
            while (sibling && !found) {
                sibling = sibling[`${dir}Sibling`];
                if (sibling) {
                    if (type === 'Element' && sibling.nodeType === 1) {
                        const siblingText = sibling.textContent.trim();
                        if (siblingText && siblingText.length > 1) {
                            text = cleanOptionText(siblingText, optionValue);
                            found = true;
                        }
                    } else if (type === 'Text' && sibling.nodeType === 3) {
                        const siblingText = sibling.textContent.trim();
                        if (siblingText && siblingText.length > 1) {
                            text = cleanOptionText(siblingText, optionValue);
                            found = true;
                        }
                    }
                }
            }
            
            if (found) break;
        }
        if (text) break;
    }
    
    return text;
}

// 从容器提取选项文本
function extractOptionTextFromContainer(container, optionValue) {
    let text = container.textContent.trim();
    
    // 移除input和button等交互元素的内容
    const interactiveElements = container.querySelectorAll('input, button, select, textarea');
    interactiveElements.forEach(el => {
        text = text.replace(el.outerHTML, '').replace(el.textContent, '');
    });
    
    return cleanOptionText(text, optionValue);
}

// 清理选项文本
function cleanOptionText(text, optionValue) {
    if (!text) return '';
    
    return text
        .replace(/<[^>]*>/g, '') // 移除HTML标签
        .replace(/[•▪▶➤›]/g, '') // 移除项目符号
        .replace(/^\s*[A-Da-d]\)?\s*/, '') // 移除选项前缀如"A)"
        .replace(/^\s*\d+\.?\s*/, '') // 移除数字前缀如"1."
        .replace(new RegExp(`^\\s*${optionValue}\\s*`), '') // 移除input value
        .replace(/\s+/g, ' ') // 合并多余空格
        .trim();
}

// 从文本中提取选项
function extractOptionsFromText(text) {
    const options = [];
    const optionPatterns = [
        // 标准选项格式
        /[A-Da-d][\.\)]\s*([^\n]+?)(?=\s*(?:[A-Da-d][\.\)]|\d+[\.\)]|$))/g,
        /\d+[\.\)]\s*([^\n]+?)(?=\s*(?:[A-Da-d][\.\)]|\d+[\.\)]|$))/g,
        
        // 中文选项格式
        /[①②③④⑤⑥]\s*([^\n]+)/g,
        /[●○■□▶➤›•▪]\s*([^\n]+)/g,
        
        // HTML选项格式
        /<input[^>]*>\s*([^<]+)/gi,
        /<label[^>]*>([^<]+)<\/label>/gi,
        
        // 特殊格式
        /【([^】]+)】/g,
        /\[([^\]]+)\]/g,
        
        // 纯文本选项（最后手段）
        /(?:^|\n)([A-Da-d])[\.\)]?\s*([^\n]+?)(?=\s*(?:[A-Da-d][\.\)]|\d+[\.\)]|$))/g
    ];
    
    for (const pattern of optionPatterns) {
        let match;
        while ((match = pattern.exec(text)) !== null) {
            let optionText = match[1] || match[2];
            if (optionText) {
                optionText = optionText.trim();
                if (optionText && optionText.length > 1) {
                    options.push({
                        value: String(options.length + 1),
                        text: optionText,
                        type: 'text'
                    });
                }
            }
        }
    }
    
    return options;
}


// 获取题目输入框
function getQuestionInputs(element) {
    const inputs = [];
    const inputElements = element.querySelectorAll('input[type="text"], input[type="number"], textarea');
    
    inputElements.forEach(input => {
        inputs.push({
            element: input,
            type: input.type,
            name: input.name || '',
            placeholder: input.placeholder || ''
        });
    });
    
    return inputs;
}

// 获取题目类型分布统计
function getQuestionTypeDistribution(questions) {
    const distribution = {};
    questions.forEach(question => {
        const type = question.type || 'unknown';
        distribution[type] = (distribution[type] || 0) + 1;
    });
    return distribution;
}

// 自动填充答案（增强版）
async function autoFillAnswers(sendResponse) {
    try {
        const questions = await detectQuestionsSync();
        let filledCount = 0;
        let failedCount = 0;
        let searchFailedCount = 0;
        const results = [];
        const startTime = Date.now();

        console.log(`📊 开始自动填充 ${questions.length} 道题目`);
        console.log(`🔍 检测到的题目类型分布: ${JSON.stringify(getQuestionTypeDistribution(questions))}`);
        
        // 批量处理所有题目
        for (let i = 0; i < questions.length; i++) {
            const question = questions[i];
            console.log(`\n📝 处理第 ${i + 1}/${questions.length} 题 [${question.type}]: ${question.title.substring(0, 30)}...`);
            
            let answer = null;
            let answerFound = false;
            let searchError = null;
            
            // 增强的答案搜索重试机制（最多5次）
            for (let attempt = 1; attempt <= 5; attempt++) {
                try {
                    console.log(`🔍 第 ${attempt} 次答案搜索尝试...`);
                    answer = await getAnswerForQuestion(question);
                    
                    if (answer) {
                        answerFound = true;
                        console.log(`✅ 第 ${attempt} 次搜索找到答案: ${answer}`);
                        break;
                    } else if (attempt === 5) {
                        console.warn(`❌ 未找到答案: ${question.title.substring(0, 30)}...`);
                        results.push({ index: i, success: false, reason: '答案未找到', type: question.type });
                        failedCount++;
                        searchFailedCount++;
                    }
                } catch (error) {
                    searchError = error;
                    console.warn(`❌ 第 ${attempt} 次答案搜索失败:`, error.message);
                    if (attempt === 5) {
                        console.error(`💥 答案搜索最终失败:`, error);
                        results.push({ index: i, success: false, reason: '搜索失败', error: error.message, type: question.type });
                        failedCount++;
                        searchFailedCount++;
                    }
                }
                
                if (attempt < 5 && !answerFound) {
                    const delay = attempt * 500; // 递增延迟：500ms, 1000ms, 1500ms, 2000ms
                    console.log(`⏳ 等待 ${delay}ms 后重试搜索...`);
                    await sleep(delay);
                }
            }
            
            if (answerFound) {
                // 增强的答案填充重试机制（最多5次）
                let fillSuccess = false;
                let fillError = null;
                let fillAttempts = 0;
                
                for (let fillAttempt = 1; fillAttempt <= 5; fillAttempt++) {
                    fillAttempts = fillAttempt;
                    try {
                        console.log(`🔄 第 ${fillAttempt} 次填充尝试...`);
                        fillSuccess = await fillQuestionAnswer(question, answer);
                        
                        if (fillSuccess) {
                            filledCount++;
                            question.element.classList.add('wph-filled');
                            console.log(`✅ 第 ${fillAttempt} 次填充成功`);
                            
                            // 提交用户答案反馈到API（如果启用）
                            try {
                                if (typeof apiService !== 'undefined' && apiService.isEnabled) {
                                    await apiService.submitUserAnswer(
                                        question.title || question.content, 
                                        answer,
                                        true
                                    );
                                    console.log('📤 答案反馈已提交');
                                }
                            } catch (feedbackError) {
                                console.warn('答案反馈失败:', feedbackError);
                            }
                            
                            results.push({ 
                                index: i, 
                                success: true, 
                                answer: answer,
                                type: question.type,
                                attempts: fillAttempt
                            });
                            break;
                        } else if (fillAttempt === 5) {
                            console.warn(`❌ 填充失败: ${question.title.substring(0, 30)}...`);
                            results.push({ 
                                index: i, 
                                success: false, 
                                reason: '填充失败', 
                                type: question.type,
                                answer: answer,
                                attempts: fillAttempt
                            });
                            failedCount++;
                        }
                    } catch (error) {
                        fillError = error;
                        console.error(`❌ 第 ${fillAttempt} 次填充失败:`, error.message);
                        if (fillAttempt === 5) {
                            console.error(`💥 填充最终失败:`, error);
                            results.push({ 
                                index: i, 
                                success: false, 
                                reason: '填充异常', 
                                error: error.message, 
                                type: question.type,
                                answer: answer,
                                attempts: fillAttempt
                            });
                            failedCount++;
                        }
                    }
                    
                    if (fillAttempt < 5 && !fillSuccess) {
                        const delay = fillAttempt * 600; // 递增延迟：600ms, 1200ms, 1800ms, 2400ms
                        console.log(`⏳ 等待 ${delay}ms 后重试填充...`);
                        await sleep(delay);
                    }
                }
            }
            
            // 动态延迟控制：根据题目类型和当前速度调整
            const delay = question.type === QUESTION_TYPES.PROGRAMMING ? 800 : 300;
            await sleep(delay);
        }

        const endTime = Date.now();
        const totalTime = (endTime - startTime) / 1000;
        const avgTimePerQuestion = totalTime / questions.length;
        
        // 统计各类型题目的成功率
        const typeStats = {};
        results.forEach(result => {
            const type = result.type || 'unknown';
            if (!typeStats[type]) {
                typeStats[type] = { success: 0, failed: 0, total: 0 };
            }
            typeStats[type].total++;
            if (result.success) {
                typeStats[type].success++;
            } else {
                typeStats[type].failed++;
            }
        });
        
        // 计算成功率
        const successRate = questions.length > 0 ? (filledCount / questions.length * 100).toFixed(1) : 0;
        const searchSuccessRate = questions.length > 0 ? ((questions.length - searchFailedCount) / questions.length * 100).toFixed(1) : 0;
        
        console.log(`\n🎯 自动填充完成 (耗时 ${totalTime.toFixed(1)}s, 平均 ${avgTimePerQuestion.toFixed(1)}s/题)`);
        console.log(`📊 统计结果: ${filledCount} 成功, ${failedCount} 失败 (成功率 ${successRate}%)`);
        console.log(`🔍 搜索成功率: ${searchSuccessRate}% (${questions.length - searchFailedCount}/${questions.length})`);
        
        // 输出各类型题目统计
        console.log('📋 题目类型统计:');
        Object.entries(typeStats).forEach(([type, stats]) => {
            const typeSuccessRate = stats.total > 0 ? (stats.success / stats.total * 100).toFixed(1) : 0;
            console.log(`   ${type}: ${stats.success}/${stats.total} (${typeSuccessRate}%)`);
        });
        
        sendResponse({
            success: true,
            filledCount: filledCount,
            failedCount: failedCount,
            searchFailedCount: searchFailedCount,
            totalCount: questions.length,
            results: results,
            completionRate: successRate + '%',
            searchSuccessRate: searchSuccessRate + '%',
            timeSpent: totalTime.toFixed(1) + 's',
            avgTimePerQuestion: avgTimePerQuestion.toFixed(1) + 's',
            typeStats: typeStats,
            performance: {
                totalTime: totalTime,
                avgTimePerQuestion: avgTimePerQuestion,
                successRate: successRate,
                searchSuccessRate: searchSuccessRate
            }
        });
    } catch (error) {
        console.error('自动填充失败:', error);
        sendResponse({ 
            success: false, 
            error: error.message,
            filledCount: 0,
            failedCount: 0,
            totalCount: 0
        });
    }
}

// 获取题目答案（增强版）
async function getAnswerForQuestion(question) {
    try {
        console.log(`🔍 搜索答案: ${question.title.substring(0, 50)}...`);
        
        // 1. 优先使用外部API搜索
        if (typeof apiService !== 'undefined' && apiService.isEnabled) {
            try {
                // 构建本地检索上下文以提升正确率
                const ctxSnippets = await buildRetrievalContext(question, 5);
                const enhancedPrompt = composeQuestionWithContext(question, ctxSnippets);
                
                const apiAnswer = await apiService.searchAnswer(
                    enhancedPrompt,
                    question.type, 
                    question.options
                );
                
                if (apiAnswer) {
                    console.log(`✅ API找到答案: ${apiAnswer}`);
                    // 记录到扩展题库（本地题库未命中时的补充，不参与检索）
                    try {
                        await addToExtensionBank({
                            title: question.title,
                            content: question.content || question.title,
                            type: question.type,
                            options: question.options.map(opt => ({ value: opt.value, text: opt.text })),
                            answer: apiAnswer,
                            source: 'api',
                            timestamp: Date.now()
                        });
                    } catch (e) {
                        console.warn('记录扩展题库失败:', e);
                    }
                    return apiAnswer;
                }
            } catch (apiError) {
                console.warn('API搜索失败，回退到本地匹配:', apiError);
            }
        }
        
        // 2. 使用混元AI服务（如果启用）
        if (typeof hunyuanService !== 'undefined' && hunyuanService.isConfigured()) {
            try {
                console.log('🤖 尝试使用混元AI搜索答案...');
                // 构建本地检索上下文以提升正确率
                const ctxSnippets2 = await buildRetrievalContext(question, 5);
                const enhancedPrompt2 = composeQuestionWithContext(question, ctxSnippets2);
                
                const hunyuanAnswer = await hunyuanService.searchAnswer(
                    enhancedPrompt2,
                    question.type,
                    question.options
                );
                
                if (hunyuanAnswer) {
                    console.log(`✅ 混元AI找到答案: ${hunyuanAnswer}`);
                    // 记录到扩展题库（本地题库未命中时的补充，不参与检索）
                    try {
                        await addToExtensionBank({
                            title: question.title,
                            content: question.content || question.title,
                            type: question.type,
                            options: question.options.map(opt => ({ value: opt.value, text: opt.text })),
                            answer: hunyuanAnswer,
                            source: 'hunyuan',
                            timestamp: Date.now()
                        });
                    } catch (e) {
                        console.warn('记录扩展题库失败:', e);
                    }
                    return hunyuanAnswer;
                }
            } catch (hunyuanError) {
                console.warn('混元AI搜索失败:', hunyuanError);
            }
        }
        
        // 3. 使用智能答案匹配函数（本地数据库）
        if (typeof findAnswer === 'function') {
            const answer = await findAnswer(question.content || question.title, question.type, question.options);
            if (answer) {
                console.log(`✅ 本地数据库找到答案: ${answer}`);
                return answer;
            }
        }
        
        // 3. 启发式规则（备用逻辑）
        if (question.type === QUESTION_TYPES.SINGLE_CHOICE && question.options.length > 0) {
            // 规则1: 优先选择包含"全部"、"都是"等词的选项
            const comprehensiveOption = question.options.find(opt => 
                opt.text && (
                    opt.text.includes('全部') || 
                    opt.text.includes('都是') || 
                    opt.text.includes('以上') ||
                    opt.text.includes('所有') ||
                    opt.text.includes('每一个')
                )
            );
            
            if (comprehensiveOption) {
                console.log(`🤖 启发式规则1选择: ${comprehensiveOption.value}`);
                return comprehensiveOption.value;
            }
            
            // 规则2: 选择最长的选项（通常更详细）
            const longestOption = question.options.reduce((prev, current) => 
                (current.text?.length || 0) > (prev.text?.length || 0) ? current : prev
            );
            
            if (longestOption.text && longestOption.text.length > 10) {
                console.log(`🤖 启发式规则2选择: ${longestOption.value}`);
                return longestOption.value;
            }
            
            // 规则3: 选择包含数字或具体信息的选项
            const specificOption = question.options.find(opt => 
                opt.text && (
                    /\d/.test(opt.text) || // 包含数字
                    /[A-Z]/.test(opt.text) || // 包含大写字母
                    opt.text.length > 20 // 较长的描述
                )
            );
            
            if (specificOption) {
                console.log(`🤖 启发式规则3选择: ${specificOption.value}`);
                return specificOption.value;
            }
            
            // 规则4: 默认选择第一个选项
            console.log(`🤖 启发式规则4选择第一个选项: ${question.options[0].value}`);
            return question.options[0].value;
        }
        
        // 4. 判断题逻辑
        if (question.type === QUESTION_TYPES.TRUE_FALSE) {
            const questionText = (question.content || question.title || '').toLowerCase();
            
            // 包含否定词的通常是错误的
            const negativeWords = ['不', '错', '非', '没', '无', '不是', '不会', '不能', '不应该'];
            const hasNegative = negativeWords.some(word => questionText.includes(word));
            
            if (hasNegative) {
                console.log('🤖 判断题选择: 错误');
                return '错误';
            }
            
            // 包含肯定词的通常是正确的
            const positiveWords = ['是', '对', '正确', '会', '能', '应该', '一定'];
            const hasPositive = positiveWords.some(word => questionText.includes(word));
            
            if (hasPositive) {
                console.log('🤖 判断题选择: 正确');
                return '正确';
            }
            
            // 默认选择正确
            console.log('🤖 判断题默认选择: 正确');
            return '正确';
        }
        
        console.log('❌ 未找到合适的答案');
        return null;
    } catch (error) {
        console.error('获取答案失败:', error);
        return null;
    }
}

// 填充题目答案
async function fillQuestionAnswer(question, answer) {
    const maxRetries = 3;
    const retryDelay = 300; // 毫秒
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`🔄 自动填充尝试 ${attempt}/${maxRetries}: ${question.title.substring(0, 30)}...`);
            
            // 在 Pintia 平台上使用专用自动填充
            const isPintiaPlatform = window.location.hostname.includes('pintia.cn') || 
                                 document.querySelector('span.block.p-0\\.5, label.w-full.inline-flex');
            
            if (isPintiaPlatform && (question.type === QUESTION_TYPES.SINGLE_CHOICE || question.type === QUESTION_TYPES.TRUE_FALSE)) {
                console.log('🎯 检测到 Pintia 平台，使用专用自动填充');
                const result = await fillPintiaChoiceAnswer(question, answer);
                if (result) return true;
                continue; // 如果失败，继续重试
            }
            
            let result = false;
            
            switch (question.type) {
                case QUESTION_TYPES.SINGLE_CHOICE:
                case QUESTION_TYPES.TRUE_FALSE:
                    result = await fillChoiceAnswer(question, answer);
                    break;
                
                case QUESTION_TYPES.MULTIPLE_CHOICE:
                    result = fillMultipleChoiceAnswer(question, answer);
                    break;
                
                case QUESTION_TYPES.FILL_BLANK:
                    result = fillBlankAnswer(question, answer);
                    break;
                
                case QUESTION_TYPES.PROGRAMMING:
                    result = fillProgrammingAnswer(question, answer);
                    break;
                
                default:
                    console.warn('未知题目类型:', question.type);
                    result = false;
            }
            
            if (result) {
                console.log(`✅ 自动填充成功: ${question.title.substring(0, 30)}...`);
                return true;
            }
            
            // 如果填充失败，等待后重试
            if (attempt < maxRetries) {
                console.log(`⏳ 等待 ${retryDelay}ms 后重试...`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
            
        } catch (error) {
            console.error(`❌ 自动填充尝试 ${attempt} 失败:`, error);
            
            // 如果是最后一次尝试，抛出错误
            if (attempt === maxRetries) {
                console.error('自动填充最终失败，已达到最大重试次数');
                return false;
            }
            
            // 等待后继续重试
            await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
    }
    
    return false;
}

// 填充选择题答案（增强版，支持重试机制）
async function fillChoiceAnswer(question, answer) {
    if (!question.options || question.options.length === 0) {
        console.warn('没有可用的选项');
        return false;
    }
    
    // 1. 精确匹配选项值
    let targetOption = question.options.find(option => 
        option.value === answer || option.value === answer.toString()
    );
    
    // 2. 精确匹配选项文本
    if (!targetOption) {
        targetOption = question.options.find(option => 
            option.text === answer || option.text.includes(answer)
        );
    }
    
    // 3. 模糊匹配选项文本（使用改进的相似度算法）
    if (!targetOption) {
        const normalizedAnswer = answer.toString().toLowerCase().trim();
        let bestMatch = null;
        let bestScore = 0;
        
        for (const option of question.options) {
            const normalizedText = option.text.toLowerCase().trim();
            
            // 计算文本相似度（改进的算法）
            let similarity = 0;
            
            // 1. 完全匹配（最高优先级）
            if (normalizedText === normalizedAnswer) {
                similarity = 1.0;
            }
            // 2. 完全包含
            else if (normalizedText.includes(normalizedAnswer) || normalizedAnswer.includes(normalizedText)) {
                similarity = 0.8;
            }
            // 3. 关键词匹配（Pintia 常见模式）
            else {
                // 提取主要关键词进行比较
                const answerKeywords = extractKeywords(normalizedAnswer);
                const textKeywords = extractKeywords(normalizedText);
                
                // 计算关键词匹配度
                const keywordMatch = calculateKeywordSimilarity(answerKeywords, textKeywords);
                similarity = keywordMatch * 0.6;
                
                // 添加长度相似度
                const lengthDiff = Math.abs(normalizedText.length - normalizedAnswer.length);
                if (lengthDiff <= 3) {
                    similarity += 0.2;
                }
                
                // 添加共同字符比例
                const commonChars = new Set([...normalizedAnswer].filter(char => normalizedText.includes(char)));
                const charSimilarity = commonChars.size / Math.max(normalizedAnswer.length, normalizedText.length);
                similarity += charSimilarity * 0.2;
            }
            
            if (similarity > bestScore) {
                bestScore = similarity;
                bestMatch = option;
            }
        }
        
        // 降低匹配阈值，提高匹配成功率
        if (bestScore > 0.25) { // 进一步降低阈值到0.25
            targetOption = bestMatch;
            console.log(`🤖 模糊匹配成功 (相似度 ${bestScore.toFixed(2)}): ${bestMatch.text}`);
        }
    }
    
    // 4. 字母选项匹配（如"A"匹配第一个选项）
    if (!targetOption && /^[A-D]$/i.test(answer)) {
        const index = answer.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0);
        if (index >= 0 && index < question.options.length) {
            targetOption = question.options[index];
            console.log(`🔤 字母选项匹配: ${answer} -> 第${index + 1}个选项`);
        }
    }
    
    // 5. 数字选项匹配（如"1"匹配第一个选项）
    if (!targetOption && /^\d+$/.test(answer)) {
        const index = parseInt(answer) - 1;
        if (index >= 0 && index < question.options.length) {
            targetOption = question.options[index];
            console.log(`🔢 数字选项匹配: ${answer} -> 第${index + 1}个选项`);
        }
    }
    
    // 6. 关键词匹配（如果答案包含选项中的关键词）
    if (!targetOption) {
        const normalizedAnswer = answer.toLowerCase().replace(/[^\w\u4e00-\u9fa5]/g, '');
        for (const option of question.options) {
            const normalizedText = option.text.toLowerCase().replace(/[^\w\u4e00-\u9fa5]/g, '');
            
            // 检查答案是否包含选项关键词或选项包含答案关键词
            if (normalizedAnswer.includes(normalizedText) || normalizedText.includes(normalizedAnswer)) {
                if (normalizedText.length > 2 && normalizedAnswer.length > 2) { // 确保不是太短的词
                    targetOption = option;
                    console.log(`🔑 关键词匹配: "${answer}" -> "${option.text}"`);
                    break;
                }
            }
        }
    }
    
    // 兜底：若选项缺少 input 引用，尝试使用 domElement
    if (targetOption && !targetOption.input && targetOption.domElement) {
        targetOption.input = targetOption.domElement;
    }
    if (targetOption && targetOption.input) {
        const maxAttempts = 3;
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                console.log(`🔄 选项设置尝试 ${attempt}/${maxAttempts}`);
                
                // 设置选中状态
                targetOption.input.checked = true;
                
                // 触发所有可能的事件（Pintia 平台可能需要特定的事件）
                const events = ['change', 'input', 'click', 'focus', 'blur'];
                
                events.forEach(eventType => {
                    try {
                        const event = new Event(eventType, { bubbles: true, cancelable: true });
                        targetOption.input.dispatchEvent(event);
                    } catch (e) {
                        console.warn(`触发 ${eventType} 事件失败:`, e);
                    }
                });
                
                // Pintia 平台特殊处理：可能需要触发父元素的事件
                try {
                    const parentElement = targetOption.input.closest('label, span, div, li, .option-item, .choice-item');
                    if (parentElement) {
                        // 触发鼠标事件（更真实的点击）
                        const mouseEvents = ['mousedown', 'mouseup', 'click'];
                        mouseEvents.forEach(eventType => {
                            const event = new MouseEvent(eventType, { 
                                bubbles: true, 
                                cancelable: true,
                                view: window,
                                detail: 1
                            });
                            parentElement.dispatchEvent(event);
                        });
                        
                        // 额外触发touch事件（移动端支持）
                        if ('ontouchstart' in window) {
                            const touchEvents = ['touchstart', 'touchend'];
                            touchEvents.forEach(eventType => {
                                const event = new Event(eventType, { bubbles: true });
                                parentElement.dispatchEvent(event);
                            });
                        }
                    }
                } catch (e) {
                    console.warn('触发父元素事件失败:', e);
                }
                
                // 短暂延迟后验证选中状态
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // 验证是否成功选中
                if (targetOption.input.checked) {
                    console.log(`✅ 成功选择选项: ${targetOption.text}`);
                    return true;
                } else {
                    console.log(`⚠️ 选中状态未生效，准备重试...`);
                    
                    // 如果未选中，尝试更强制的方法
                    if (attempt === maxAttempts) {
                        console.log('🔧 使用强制方法设置选中状态');
                        targetOption.input.setAttribute('checked', 'checked');
                        targetOption.input.checked = true;
                        
                        // 触发自定义事件
                        const forceEvent = new CustomEvent('forceCheck', { 
                            bubbles: true,
                            detail: { forced: true }
                        });
                        targetOption.input.dispatchEvent(forceEvent);
                        
                        // 最后检查
                        await new Promise(resolve => setTimeout(resolve, 50));
                        if (targetOption.input.checked) {
                            console.log(`✅ 强制设置成功`);
                            return true;
                        }
                    }
                }
                
                // 等待后重试
                if (attempt < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
                
            } catch (error) {
                console.error(`选项设置尝试 ${attempt} 失败:`, error);
                
                if (attempt === maxAttempts) {
                    console.error('选项设置最终失败');
                    return false;
                }
                
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }
    }
    
    console.warn(`未找到匹配的选项 for answer: ${answer}`);
    console.log('可用选项:', question.options.map(opt => ({ value: opt.value, text: opt.text })));
    return false;
}

// 提取关键词（用于模糊匹配）
function extractKeywords(text) {
    if (!text) return [];
    
    // 移除常见停用词和标点符号
    const stopWords = new Set(['的', '是', '在', '和', '与', '或', '有', '没有', '不', '了', '着', '过']);
    const punctuation = /[.,!?;:()\[\]{}'"<>\/\\|@#$%^&*_+=~`]/g;
    
    const cleanedText = text.replace(punctuation, ' ').toLowerCase();
    
    // 分割单词并过滤停用词
    const words = cleanedText.split(/\s+/).filter(word => 
        word.length > 1 && !stopWords.has(word)
    );
    
    return words;
}

// 计算关键词相似度
function calculateKeywordSimilarity(keywords1, keywords2) {
    if (keywords1.length === 0 || keywords2.length === 0) return 0;
    
    // 计算交集
    const intersection = new Set(keywords1.filter(word => keywords2.includes(word)));
    
    // 计算并集
    const union = new Set([...keywords1, ...keywords2]);
    
    // Jaccard相似度系数
    return intersection.size / union.size;
}

// Pintia 平台专用自动填充（处理 Pintia 特有的 DOM 结构和事件）
async function fillPintiaChoiceAnswer(question, answer) {
    console.log('🎯 使用 Pintia 专用自动填充');
    
    try {
        // 扩展 Pintia 选项元素选择器（覆盖更多 Pintia 平台变体）
        const pintiaOptionSelectors = [
            'span.block.p-0\\.5', 
            'label.w-full.inline-flex',
            '.option-item',
            '.choice-item',
            '.answer-option',
            '[data-option]',
            '.ant-radio-wrapper',
            '.ant-checkbox-wrapper',
            '.pc-radio',
            '.pc-checkbox',
            '.radio-item',
            '.checkbox-item',
            // 新增 Pintia 常见选择器
            '[class*="option"]',
            '[class*="choice"]',
            '[class*="radio"]',
            '[class*="checkbox"]'
        ];
        
        const optionElements = (question.element || document).querySelectorAll(pintiaOptionSelectors.join(', '));
        console.log(`🔍 找到 ${optionElements.length} 个Pintia选项元素`);
        
        // 方法1: 精确文本匹配
        const normalizedAnswer = answer.toString().toLowerCase().trim();
        
        for (const element of optionElements) {
            const elementText = element.textContent.toLowerCase().trim();
            
            // 精确匹配检查
            if (elementText.includes(normalizedAnswer) || 
                normalizedAnswer.includes(elementText)) {
                console.log(`✅ 找到文本匹配的Pintia选项: ${elementText}`);
                
                // 执行 Pintia 专用点击操作
                if (await clickPintiaOption(element, answer)) {
                    return true;
                }
            }
        }
        
        // 方法2: 选项字母匹配（A、B、C、D）
        const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
        const answerIndex = optionLetters.indexOf(answer.toUpperCase().trim());
        
        if (answerIndex >= 0 && answerIndex < optionElements.length) {
            const targetElement = optionElements[answerIndex];
            console.log(`✅ 按选项字母匹配: ${answer} -> 第${answerIndex + 1}个选项`);
            
            if (await clickPintiaOption(targetElement, answer)) {
                return true;
            }
        }
        
        // 方法3: 数字索引匹配（0、1、2、3）
        if (/^\d+$/.test(answer)) {
            const numericIndex = parseInt(answer);
            if (numericIndex >= 0 && numericIndex < optionElements.length) {
                const targetElement = optionElements[numericIndex];
                console.log(`✅ 按数字索引匹配: ${answer} -> 第${numericIndex + 1}个选项`);
                
                if (await clickPintiaOption(targetElement, answer)) {
                    return true;
                }
            }
        }
        
        // 方法4: 使用question中的选项信息进行智能匹配
        if (question.options && question.options.length > 0) {
            for (const option of question.options) {
                if (option.value === answer || option.text.includes(answer)) {
                    console.log(`🤖 使用question选项匹配: ${option.text}`);
                    
                    // 尝试找到对应的DOM元素
                    const matchingElement = findPintiaOptionByText(option.text, optionElements);
                    if (matchingElement && await clickPintiaOption(matchingElement, answer)) {
                        return true;
                    }
                }
            }
        }
        
        console.warn('❌ Pintia 专用自动填充未找到匹配选项');
        return false;
        
    } catch (error) {
        console.error('Pintia 自动填充失败:', error);
        return false;
    }
}

// Pintia 选项点击专用函数
async function clickPintiaOption(element, answer) {
    try {
        console.log(`🖱️ 点击 Pintia 选项: ${element.textContent.trim()}`);
        
        // 1. 首先尝试标准的点击事件
        const clickEvent = new MouseEvent('click', { 
            bubbles: true, 
            cancelable: true,
            view: window,
            detail: 1 // 重要：设置detail为1表示单击
        });
        
        // 2. 触发多次点击确保生效（Pintia 可能需要多次触发）
        for (let i = 0; i < 3; i++) {
            element.dispatchEvent(clickEvent);
            
            // 3. 检查并设置关联的input元素
            const input = element.querySelector('input[type="radio"], input[type="checkbox"]');
            if (input) {
                input.checked = true;
                
                // 触发input相关事件
                const events = ['change', 'input', 'click'];
                events.forEach(eventType => {
                    const event = new Event(eventType, { bubbles: true });
                    input.dispatchEvent(event);
                });
                
                console.log(`✅ 设置input选中状态: ${input.checked}`);
            }
            
            // 4. 触发父元素事件（Pintia 可能监听父元素）
            const parentElement = element.closest('label, div, span, li');
            if (parentElement && parentElement !== element) {
                parentElement.dispatchEvent(clickEvent);
            }
            
            // 短暂延迟确保事件处理
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        // 5. 最终验证选中状态
        await new Promise(resolve => setTimeout(resolve, 150));
        
        // 检查是否成功选中
        const input = element.querySelector('input[type="radio"], input[type="checkbox"]');
        let isSuccess = false;
        
        if (input) {
            if (!input.checked) {
                console.log('🔄 重新设置选中状态');
                input.checked = true;
                input.dispatchEvent(new Event('change', { bubbles: true }));
                
                // 额外触发 Pintia 可能需要的其他事件
                const extraEvents = ['input', 'click', 'focus', 'blur'];
                extraEvents.forEach(eventType => {
                    try {
                        const event = new Event(eventType, { bubbles: true });
                        input.dispatchEvent(event);
                    } catch (e) {
                        console.warn(`触发 ${eventType} 事件失败:`, e);
                    }
                });
            }
            
            // 最终验证
            await new Promise(resolve => setTimeout(resolve, 100));
            isSuccess = input.checked;
            console.log(`✅ 最终选中状态: ${input.checked}`);
        } else {
            // 如果没有input元素，检查元素本身是否有选中状态
            const hasSelectedClass = element.classList.contains('selected') || 
                                   element.classList.contains('active') ||
                                   element.getAttribute('data-selected') === 'true';
            isSuccess = hasSelectedClass;
            console.log(`✅ 元素选中状态: ${hasSelectedClass}`);
        }
        
        // 6. 如果仍然未选中，尝试强制方法
        if (!isSuccess) {
            console.log('🔧 使用强制选中方法');
            
            // 方法A: 直接设置属性
            if (input) {
                input.setAttribute('checked', 'checked');
                input.checked = true;
            }
            
            // 方法B: 设置元素选中状态
            element.setAttribute('data-selected', 'true');
            element.classList.add('selected', 'active');
            
            // 方法C: 触发自定义事件
            const customEvent = new CustomEvent('wph-selected', { 
                bubbles: true, 
                detail: { answer: answer } 
            });
            element.dispatchEvent(customEvent);
            
            isSuccess = true;
        }
        
        console.log(`🎉 Pintia 选项点击完成: ${answer} (成功: ${isSuccess})`);
        return isSuccess;
        
    } catch (error) {
        console.error('Pintia 选项点击失败:', error);
        return false;
    }
}

// 根据文本内容查找 Pintia 选项元素
function findPintiaOptionByText(text, optionElements) {
    const normalizedText = text.toLowerCase().trim();
    
    for (const element of optionElements) {
        const elementText = element.textContent.toLowerCase().trim();
        if (elementText.includes(normalizedText) || normalizedText.includes(elementText)) {
            return element;
        }
    }
    return null;
}

// 填充多选题答案
function fillMultipleChoiceAnswer(question, answers) {
    if (typeof answers === 'string') {
        answers = answers.split(',').map(a => a.trim());
    }
    
    let filled = false;
    answers.forEach(answer => {
        // 1. 精确匹配选项值
        let targetOption = question.options.find(option => 
            option.value === answer || option.value === answer.toString()
        );
        
        // 2. 精确匹配选项文本
        if (!targetOption) {
            targetOption = question.options.find(option => 
                option.text === answer || option.text.includes(answer)
            );
        }
        
        // 3. 字母选项匹配（如"A"匹配第一个选项）
        if (!targetOption && /^[A-D]$/i.test(answer)) {
            const index = answer.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0);
            if (index >= 0 && index < question.options.length) {
                targetOption = question.options[index];
            }
        }
        
        // 4. 数字选项匹配（如"0"匹配第一个选项）
        if (!targetOption && /^\d+$/.test(answer)) {
            const index = parseInt(answer);
            if (index >= 0 && index < question.options.length) {
                targetOption = question.options[index];
            }
        }
        
        if (targetOption) {
            targetOption.input.checked = true;
            targetOption.input.dispatchEvent(new Event('change', { bubbles: true }));
            filled = true;
            console.log(`✅ 多选题选择选项: ${targetOption.text}`);
        } else {
            console.warn(`❌ 多选题未找到匹配选项: ${answer}`);
        }
    });
    
    return filled;
}

// 填充填空题答案
function fillBlankAnswer(question, answer) {
    if (question.inputs.length > 0) {
        const input = question.inputs[0].element;
        input.value = answer;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
    }
    
    return false;
}

// 填充编程题答案
function fillProgrammingAnswer(question, code) {
    console.log('💻 填充编程题答案...', {
        title: question && (question.title || question.index),
        codeLength: (code || '').length
    });
    
    // 使用集成的编程题填充功能
    if (typeof window.fillProgrammingQuestionAnswer === 'function') {
        try {
            const res = window.fillProgrammingQuestionAnswer(question, code);
            // 尝试记录异步结果（若为Promise）
            Promise.resolve(res).then(r => console.log('💻 fillProgrammingQuestionAnswer 返回:', r)).catch(e => console.warn('💻 fillProgrammingQuestionAnswer 异常:', e));
            return res;
        } catch (e) {
            console.warn('💻 调用 fillProgrammingQuestionAnswer 抛出异常:', e);
            // 继续回退到原有逻辑
        }
    }
    
    // 原有的填充逻辑作为备用
    const textarea = question.element.querySelector('textarea');
    const codeEditor = question.element.querySelector('.ace_editor, .CodeMirror');
    
    if (textarea) {
        textarea.value = code;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
    }
    
    if (codeEditor) {
        // 处理ACE编辑器或CodeMirror
        if (window.ace && codeEditor.env) {
            codeEditor.env.editor.setValue(code);
            return true;
        }
        
        if (codeEditor.CodeMirror) {
            codeEditor.CodeMirror.setValue(code);
            return true;
        }
    }
    
    return false;
}

// 分析编程题（调用后端AI服务并展示结果）
async function analyzeProgrammingQuestion(question) {
    try {
        if (!question || !question.element) return;
        console.log('🧠 开始分析编程题:', question.title || question.content);

        // 构建提示词：包含题目描述、输入输出和样例（若有）
        const prompt = buildProgrammingPrompt(question);

        // 使用优先的 hunyuan 服务（若可用），否则尝试 apiService 或 aiService
        let aiResult = null;
        let usedService = null;
        try {
            if (typeof hunyuanService !== 'undefined' && typeof hunyuanService.callHunyuanLite === 'function') {
                usedService = 'hunyuanService.callHunyuanLite';
                aiResult = await hunyuanService.callHunyuanLite(prompt, { Temperature: 0.1, TopP: 0.9 });
            } else if (typeof apiService !== 'undefined' && typeof apiService.searchWithHunyuanLite === 'function') {
                usedService = 'apiService.searchWithHunyuanLite';
                aiResult = await apiService.searchWithHunyuanLite(prompt, 'programming', []);
            } else if (typeof window.aiService !== 'undefined' && typeof window.aiService.generateAnswer === 'function') {
                usedService = 'window.aiService.generateAnswer';
                const gen = await window.aiService.generateAnswer(prompt, 'programming');
                if (gen && gen.success) aiResult = { choices: [{ message: { content: gen.answer || '' } }] };
            } else {
                console.warn('无可用AI服务进行编程题推理');
            }
        } catch (e) {
            console.error('调用AI服务时发生错误:', e);
        }

        console.log('🛰️ 使用的AI服务:', usedService, '，AI返回摘要:', aiResult ? (typeof aiResult === 'string' ? aiResult.substring(0,200) : JSON.stringify(aiResult).substring(0,400)) : null);

        let code = '';
        if (aiResult && aiResult.choices && aiResult.choices.length > 0) {
            code = aiResult.choices[0].message.content || aiResult.choices[0].message?.content || '';
        } else if (aiResult && aiResult.data && typeof aiResult.data === 'string') {
            code = aiResult.data;
        }

        // 清理多余的说明文本，尽量抽出代码块
        if (code) {
            const codeMatch = code.match(/```(?:[\w\+\-]*)\n([\s\S]*?)\n```/);
            if (codeMatch) code = codeMatch[1];
            // 如果有 <pre> 等 html 标签，移除
            code = code.replace(/^<pre[^>]*>/, '').replace(/<\/pre>$/, '').trim();
            console.log('🔎 提取到的代码长度:', (code || '').length, '首段:', (code || '').substring(0,200));
        } else {
            console.log('⚠️ AI未返回代码内容');
        }

        // 展示结果UI
        showProgrammingSolutionUI(question, code || '未能生成有效代码，请检查后端或API密钥设置');
    } catch (error) {
        console.error('分析编程题失败:', error);
        showProgrammingSolutionUI(question, '分析失败: ' + (error.message || error));
    }
}

// 构建编程题目的提示词
function buildProgrammingPrompt(question) {
    const title = question.title || '';
    const desc = question.content || question.fullText || '';
    const inputDesc = (question.io && question.io.input) ? question.io.input : '';
    const outputDesc = (question.io && question.io.output) ? question.io.output : '';
    const examples = (question.examples && (question.examples.in || question.examples.out)) ? `输入示例:\n${question.examples.in || ''}\n输出示例:\n${question.examples.out || ''}` : '';

    let prompt = `请根据以下题目给出完整可运行的代码（仅返回代码，不要附加解释）。\n题目标题：${title}\n题目描述：${desc}\n${inputDesc ? `输入：${inputDesc}\n` : ''}${outputDesc ? `输出：${outputDesc}\n` : ''}${examples}\n请使用与页面编辑器匹配的语言，如果不确定请使用 C++。`;
    return prompt;
}

// 在题目附近展示代码与操作按钮（复制 / 填充）
function showProgrammingSolutionUI(question, codeText) {
    try {
        // 清理可能已存在的 UI
        const existing = question.element.querySelector('.wph-programming-solution');
        if (existing) existing.remove();

        const container = document.createElement('div');
        container.className = 'wph-programming-solution';
        container.style.cssText = 'border:1px solid #e6eef8;padding:8px;margin-top:8px;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.06);font-family:monospace;max-width:100%;overflow:auto;';

        const btnRow = document.createElement('div');
        btnRow.style.cssText = 'display:flex;gap:8px;margin-bottom:6px;align-items:center;';

        const copyBtn = document.createElement('button');
        copyBtn.textContent = '复制代码';
        copyBtn.className = 'wph-btn-ghost';
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(codeText).then(() => {
                copyBtn.textContent = '已复制';
                setTimeout(() => copyBtn.textContent = '复制代码', 1500);
            }).catch(err => alert('复制失败: ' + err));
        };

        const fillBtn = document.createElement('button');
        fillBtn.textContent = '自动填充到编辑器';
        fillBtn.className = 'wph-btn-primary';
        fillBtn.onclick = async () => {
            const ok = fillProgrammingAnswer(question, codeText);
            if (!ok) alert('自动填充未生效，请查看控制台日志以获取更多信息');
        };

        const viewBtn = document.createElement('button');
        viewBtn.textContent = '查看完整代码';
        viewBtn.onclick = () => {
            // 弹出一个新的窗口或对话框显示完整代码
            const w = window.open('', '_blank');
            if (w) {
                w.document.write(`<pre style="white-space:pre-wrap;font-family:monospace;padding:16px">${escapeHtml(codeText)}</pre>`);
                w.document.title = question.title || '编程题答案';
            } else {
                alert(codeText);
            }
        };

        btnRow.appendChild(copyBtn);
        btnRow.appendChild(fillBtn);
        btnRow.appendChild(viewBtn);

        const codePre = document.createElement('pre');
        codePre.style.cssText = 'background:#0b1220;color:#d6deff;padding:10px;border-radius:6px;overflow:auto;max-height:320px;';
        codePre.textContent = codeText;

        container.appendChild(btnRow);
        container.appendChild(codePre);

        // 为调试添加数据属性
        try {
            container.dataset.wphGenerated = '1';
            container.dataset.codeLength = String((codeText || '').length);
            container.dataset.questionTitle = (question.title || '').substring(0, 80);
        } catch (e) {}

        question.element.appendChild(container);
        console.log('🖼️ 已展示编程题解答UI', {
            title: question && (question.title || question.index),
            codeLength: (codeText || '').length
        });
    } catch (e) {
        console.error('展示编程题解答UI失败:', e);
    }
}

function escapeHtml(s) {
    return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// 提交答案
async function submitAnswers(sendResponse) {
    try {
        // 查找提交按钮
        const submitSelectors = [
            'button[type="submit"]',
            '.submit-btn',
            '.btn-submit',
            'input[type="submit"]',
            'button:contains("提交")',
            'button:contains("Submit")'
        ];
        
        let submitButton = null;
        for (const selector of submitSelectors) {
            submitButton = document.querySelector(selector);
            if (submitButton) break;
        }
        
        // 如果没找到，尝试通过文本内容查找
        if (!submitButton) {
            const buttons = document.querySelectorAll('button');
            submitButton = Array.from(buttons).find(btn => 
                btn.textContent.includes('提交') || 
                btn.textContent.includes('Submit') ||
                btn.textContent.includes('确认')
            );
        }
        
        if (submitButton) {
            // 添加提交前的视觉反馈
            submitButton.classList.add('wph-processing');
            
            // 模拟点击提交
            submitButton.click();
            
            sendResponse({
                success: true,
                message: '答案已提交'
            });
        } else {
            sendResponse({
                success: false,
                error: '未找到提交按钮'
            });
        }
    } catch (error) {
        console.error('提交答案失败:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// API相关功能
async function getAPIStatus(sendResponse) {
    try {
        if (typeof apiService !== 'undefined') {
            const status = apiService.getStatus();
            sendResponse({
                success: true,
                status: status
            });
        } else {
            sendResponse({
                success: true,
                status: {
                    enabled: false,
                    hasKey: false,
                    baseURL: '',
                    cacheSize: 0
                }
            });
        }
    } catch (error) {
        console.error('获取API状态失败:', error);
        sendResponse({ success: false, error: error.message });
    }
}

async function testAPIConnection(config, sendResponse) {
    try {
        if (typeof apiService !== 'undefined') {
            // 临时设置配置进行测试
            const tempConfig = {
                apiKey: config.apiKey,
                baseURL: config.baseURL,
                enabled: true
            };
            
            const result = await apiService.testConnection.call({
                apiKey: tempConfig.apiKey,
                baseURL: tempConfig.baseURL
            });
            
            sendResponse(result);
        } else {
            sendResponse({
                success: false,
                error: 'API服务未初始化'
            });
        }
    } catch (error) {
        console.error('测试API连接失败:', error);
        sendResponse({ success: false, error: error.message });
    }
}

async function updateAPIConfig(config, sendResponse) {
    try {
        if (typeof apiService !== 'undefined') {
            const result = await apiService.setConfig(config);
            sendResponse(result);
        } else {
            sendResponse({
                success: false,
                error: 'API服务未初始化'
            });
        }
    } catch (error) {
        console.error('更新API配置失败:', error);
        sendResponse({ success: false, error: error.message });
    }
}

async function clearAPICache(sendResponse) {
    try {
        if (typeof apiService !== 'undefined') {
            apiService.clearCache();
            sendResponse({ success: true, message: '缓存已清空' });
        } else {
            sendResponse({ success: true, message: 'API服务未初始化，无需清空缓存' });
        }
    } catch (error) {
        console.error('清空API缓存失败:', error);
        sendResponse({ success: false, error: error.message });
    }
}

function groupQuestionsByName(inputs) {
    const groups = {};
    inputs.forEach(input => {
        const name = input.name || 'unnamed';
        if (!groups[name]) {
            groups[name] = [];
        }
        groups[name].push(input);
    });
    return groups;
}

function highlightQuestions(elements) {
    elements.forEach(element => {
        element.classList.add('wph-highlight');
    });
    
    // 3秒后移除高亮
    setTimeout(() => {
        elements.forEach(element => {
            element.classList.remove('wph-highlight');
        });
    }, 3000);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 智能初始化系统
let initializationAttempts = 0;
let isInitialized = false;
let pageReadyTimer = null;

// 页面加载完成后的初始化
function smartInitialize() {
    if (isInitialized) return;
    
    console.log('🚀 开始智能初始化...');
    
    // 检查页面是否真正准备好
    if (isPageReady()) {
        performInitialization();
    } else {
        // 如果页面还没准备好，延迟初始化
        initializationAttempts++;
        if (initializationAttempts < 10) { // 最多尝试10次
            console.log(`⏳ 页面未准备好，第 ${initializationAttempts} 次延迟初始化...`);
            setTimeout(smartInitialize, 1000); // 每秒重试一次
        } else {
            console.log('⚠️ 页面准备超时，强制初始化');
            performInitialization();
        }
    }
}

// 检查页面是否准备好
function isPageReady() {
    // 检查文档状态
    if (document.readyState !== 'complete') {
        console.log('📄 文档还在加载中...');
        return false;
    }
    
    // 检查是否有基本的页面结构
    const bodyContent = document.body.children.length;
    if (bodyContent < 3) {
        console.log('📄 页面内容太少，可能还在加载...');
        return false;
    }
    
    // 检查是否有可能的题目相关元素
    const potentialElements = document.querySelectorAll('input, textarea, button, form, .question, .problem, .exam');
    if (potentialElements.length === 0) {
        console.log('📄 未发现题目相关元素，可能还在加载...');
        return false;
    }
    
    console.log('✅ 页面已准备好');
    return true;
}

// 执行实际的初始化
function performInitialization() {
    if (isInitialized) return;
    
    console.log('✅ Web 题目助手初始化完成');
    isInitialized = true;
    
    // 延迟创建工具栏，确保页面完全稳定
    setTimeout(() => {
        createFloatingToolbar();
        showNotification('Web 题目助手已启动', '插件已成功加载，可以开始使用了！', 'success');
    }, 500);
    
    // 添加快捷键支持
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // 监听页面变化（SPA应用）
    setupPageObserver();
    
    // 延迟状态更新
    setTimeout(updateToolbarStatus, 2000);
}

// 处理键盘快捷键
function handleKeyboardShortcuts(e) {
    // Ctrl+Shift+D: 检测题目
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        handleDetectQuestions();
    }
    
    // Ctrl+Shift+F: 自动填充
    if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        handleAutoFill();
    }
    
    // Ctrl+Shift+A: 显示答案
    if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        handleShowAnswers();
    }
    
    // Ctrl+Shift+H: 隐藏/显示工具栏
    if (e.ctrlKey && e.shiftKey && e.key === 'H') {
        e.preventDefault();
        toggleToolbar();
    }
}

// 设置页面观察器
function setupPageObserver() {
    const observer = new MutationObserver(debounce((mutations) => {
        let hasSignificantChange = false;
        
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // 检查是否有重要的DOM变化
                const addedElements = Array.from(mutation.addedNodes).filter(node => 
                    node.nodeType === Node.ELEMENT_NODE && 
                    (node.tagName === 'FORM' || 
                     node.tagName === 'INPUT' || 
                     node.tagName === 'TEXTAREA' ||
                     node.className.includes('question') ||
                     node.className.includes('problem'))
                );
                
                if (addedElements.length > 0) {
                    hasSignificantChange = true;
                }
            }
        });
        
        if (hasSignificantChange) {
            console.log('📄 检测到重要页面变化');
            updateToolbarStatus();
        }
    }, 1000)); // 防抖，1秒内的变化只处理一次
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 启动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(smartInitialize, 500); // DOM加载完成后延迟500ms
    });
} else if (document.readyState === 'interactive') {
    setTimeout(smartInitialize, 1000); // 交互状态延迟1秒
} else {
    setTimeout(smartInitialize, 200); // 完全加载状态延迟200ms
}

// 备用初始化（防止主初始化失败）
setTimeout(() => {
    if (!isInitialized) {
        console.log('🔄 备用初始化启动');
        performInitialization();
    }
}, 5000); // 5秒后强制初始化

// 创建浮动工具栏
function createFloatingToolbar() {
    if (toolbarElement) {
        toolbarElement.remove();
    }
    
    toolbarElement = document.createElement('div');
    toolbarElement.className = 'wph-toolbar';
    toolbarElement.innerHTML = `
        <div class="wph-toolbar-header">
            <h3 class="wph-title">
                <div class="wph-logo">W</div>
                Web 题目助手
            </h3>
            <button class="wph-minimize" title="最小化">−</button>
        </div>
        <div class="wph-content">
            <div class="wph-status ready">
                <div class="wph-status-icon">✓</div>
                <span class="wph-status-text">就绪</span>
            </div>
            <div class="wph-buttons">
                <button class="wph-btn detect-btn">
                    🔍 检测题目 (Ctrl+Shift+D)
                </button>
                <button class="wph-btn primary fill-btn">
                    ✨ 自动填充 (Ctrl+Shift+F)
                </button>
                <button class="wph-btn secondary show-answers-btn">
                    📋 显示答案 (Ctrl+Shift+A)
                </button>
                <button class="wph-btn danger submit-btn">
                    📤 提交答案
                </button>
            </div>
            <div class="wph-stats">
                <div class="wph-stats-item">
                    <span>检测到:</span>
                    <span id="detected-count">0</span>
                </div>
                <div class="wph-stats-item">
                    <span>已填充:</span>
                    <span id="filled-count">0</span>
                </div>
                <div class="wph-stats-item">
                    <span>成功率:</span>
                    <span id="success-rate">0%</span>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(toolbarElement);
    
    // 添加事件监听器（而不是使用onclick属性）
    const minimizeBtn = toolbarElement.querySelector('.wph-minimize');
    const detectBtn = toolbarElement.querySelector('.detect-btn');
    const fillBtn = toolbarElement.querySelector('.fill-btn');
    const showAnswersBtn = toolbarElement.querySelector('.show-answers-btn');
    const submitBtn = toolbarElement.querySelector('.submit-btn');
    
    minimizeBtn.addEventListener('click', toggleMinimize);
    detectBtn.addEventListener('click', handleDetectQuestions);
    fillBtn.addEventListener('click', handleAutoFill);
    showAnswersBtn.addEventListener('click', handleShowAnswers);
    submitBtn.addEventListener('click', handleSubmit);
    
    // 添加拖拽功能
    makeDraggable(toolbarElement);
}

// 显示通知
function showNotification(title, message, type = 'success') {
    // 移除现有通知
    const existingNotifications = document.querySelectorAll('.wph-notification');
    existingNotifications.forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `wph-notification ${type}`;
    notification.innerHTML = `
        <div class="wph-notification-title">${title}</div>
        <div class="wph-notification-message">${message}</div>
    `;
    
    document.body.appendChild(notification);
    
    // 显示动画
    setTimeout(() => notification.classList.add('show'), 100);
    
    // 自动隐藏
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

// 更新工具栏状态
function updateToolbarStatus(status = 'ready', text = '就绪') {
    if (!toolbarElement) return;
    
    const statusElement = toolbarElement.querySelector('.wph-status');
    const statusText = toolbarElement.querySelector('.wph-status-text');
    
    statusElement.className = `wph-status ${status}`;
    statusText.textContent = text;
    
    // 更新统计信息
    updateStats();
}

// 更新统计信息
function updateStats() {
    if (!toolbarElement) return;
    
    const detectedElement = toolbarElement.querySelector('#detected-count');
    const filledElement = toolbarElement.querySelector('#filled-count');
    const successRateElement = toolbarElement.querySelector('#success-rate');
    
    if (detectedElement) detectedElement.textContent = currentStats.detected;
    if (filledElement) filledElement.textContent = currentStats.filled;
    if (successRateElement) {
        const rate = currentStats.detected > 0 ? Math.round((currentStats.filled / currentStats.detected) * 100) : 0;
        successRateElement.textContent = `${rate}%`;
    }
}

// 处理检测题目 - 优化版本
async function handleDetectQuestions() {
    try {
        console.log('🔍 开始检测题目...');
        updateToolbarStatus('working', '检测中...');
        showNotification('开始检测', '正在检测页面中的题目...', 'info');
        
        // 使用异步处理避免阻塞页面
        const result = await performQuestionDetection();
        
        if (result && result.success) {
            currentStats.detected = result.count || 0;
            updateToolbarStatus('ready', `检测到 ${currentStats.detected} 道题目`);
            showNotification('检测完成', `成功检测到 ${currentStats.detected} 道题目`, 'success');
        } else {
            updateToolbarStatus('error', '检测失败');
            showNotification('检测失败', result?.error || '未知错误', 'error');
        }
    } catch (error) {
        console.error('❌ 检测题目失败:', error);
        updateToolbarStatus('error', '检测失败');
        showNotification('检测失败', error.message || '未知错误', 'error');
    }
}

// 执行题目检测的核心逻辑
async function performQuestionDetection() {
    // 开始性能监控
    if (typeof performanceMonitor !== 'undefined') {
        performanceMonitor.startTimer('detection');
    }
    
    try {
        console.log('🔍 开始高效题目检测...');
        const questions = [];
        
        // 分阶段检测，专注于 Pintia 题目结构
        const detectionStages = [
            // 第一阶段：Pintia 特定容器
            {
                name: 'Pintia容器',
                selectors: [
                    '.pc-x', // Pintia 题目容器
                    '[class*="problem"]', 
                    '[class*="question"]',
                    '.problem-container',
                    '.question-wrapper'
                ],
                filter: element => {
                    // 过滤掉没有实际内容的容器
                    const text = element.textContent.trim();
                    return text.length > 10 && 
                           (text.includes('选择') || text.includes('题目') || 
                            element.querySelector('input[type="radio"], input[type="checkbox"]'));
                }
            },
            // 第二阶段：包含选项的容器
            {
                name: '选项容器',
                selectors: [
                    'label', // Pintia 使用 label 包裹选项
                    '.markdownBlock_tErSz', // Pintia markdown容器
                    '[class*="option"]',
                    '[class*="choice"]',
                    '.answer-item'
                ],
                filter: element => {
                    const text = element.textContent.trim();
                    return text.length > 5 && 
                           (text.includes('A.') || text.includes('B.') || 
                            text.includes('C.') || text.includes('D.') ||
                            element.querySelector('input'));
                }
            },
            // 第三阶段：输入元素直接检测
            {
                name: '输入元素',
                selectors: [
                    'input[type="radio"]',
                    'input[type="checkbox"]',
                    '[role="radio"]',
                    '[role="checkbox"]'
                ],
                filter: element => {
                    // 确保输入元素在可见的题目区域内
                    const container = element.closest('body, .container, .main-content');
                    return container && container.offsetWidth > 0;
                }
            }
        ];

        let questionElements = [];
        let detectionMethod = '';

        // 分阶段尝试检测
        for (const stage of detectionStages) {
            console.log(`🔍 尝试 ${stage.name} 检测...`);
            
            for (const selector of stage.selectors) {
                // 使用智能DOM查询（如果可用）
                const elements = typeof smartDOM !== 'undefined' 
                    ? smartDOM.query(selector) 
                    : document.querySelectorAll(selector);
                    
                if (elements.length > 0) {
                    // 应用过滤器（如果有）
                    let filteredElements = Array.from(elements);
                    if (stage.filter) {
                        filteredElements = filteredElements.filter(stage.filter);
                        console.log(`📊 过滤后剩余 ${filteredElements.length} 个有效元素`);
                    }
                    
                    if (filteredElements.length > 0 && filteredElements.length < 50) {
                        questionElements = filteredElements;
                        detectionMethod = `${stage.name} - ${selector}`;
                        console.log(`✅ 使用 ${detectionMethod} 找到 ${questionElements.length} 个有效容器`);
                        break;
                    }
                }
            }
            
            if (questionElements.length > 0) break;
            
            // 每个阶段之间添加小延迟，避免阻塞
            await sleep(50);
        }

        // 如果标准方法都失败，先尝试“编程题容器”兜底检测（markdown-only）
        if (questionElements.length === 0) {
            console.log('🔍 尝试 编程题容器 检测...');
            const markdownRoot =
                document.querySelector('.markdownBlock_tErSz .rendered-markdown') ||
                document.querySelector('.markdownBlock_tErSz') ||
                document.querySelector('.rendered-markdown');
            let progContainers = [];
            if (markdownRoot) {
                const txt = (markdownRoot.textContent || '').trim();
                const hasKeywords = ['输入格式', '输出格式', '输入样例', '输出样例'].some(k => txt.indexOf(k) !== -1);
                const hasCodeBlocks = markdownRoot.querySelector('code, pre code, pre');
                if (hasKeywords || hasCodeBlocks) {
                    // 将 markdown 根当作一个题目容器
                    progContainers = [markdownRoot];
                }
            }
            if (progContainers.length > 0) {
                questionElements = progContainers;
                detectionMethod = '编程题容器 - markdown';
                console.log(`✅ 使用 ${detectionMethod} 找到 ${questionElements.length} 个容器`);
            } else {
                // 兜底：尝试输入元素推断
                console.log('🔍 尝试输入元素推断...');
                questionElements = await detectByInputElements();
                detectionMethod = '输入元素推断';
            }
        }

        console.log(`📊 检测方法: ${detectionMethod}, 找到 ${questionElements.length} 个容器`);

        // 简化的批处理解析
        const batchSize = 3;
        for (let i = 0; i < questionElements.length; i += batchSize) {
            const batch = questionElements.slice(i, i + batchSize);
            
            // 并行处理当前批次
            const batchPromises = batch.map(async (element, index) => {
                return parseQuestion(element, i + index);
            });
            
            const batchResults = await Promise.all(batchPromises);
            
            // 添加成功解析的题目
            batchResults.forEach(question => {
                if (question) {
                    questions.push(question);
                }
            });
            
            // 批次间延迟，避免阻塞
            if (i + batchSize < questionElements.length) {
                await sleep(100);
            }
        }

        // 高亮检测到的题目（异步）
        setTimeout(() => {
            highlightQuestions(questionElements);
        }, 200);

        console.log(`🎉 检测完成！成功识别 ${questions.length} 道题目`);
        
        // 存储检测到的题目到全局变量
        detectedQuestions = questions;
        
        // 结束性能监控
        if (typeof performanceMonitor !== 'undefined') {
            performanceMonitor.endTimer('detection');
        }
        
        // 返回结果
        return {
            success: true,
            count: questions.length,
            questions: questions,
            method: detectionMethod
        };
        
    } catch (error) {
        console.error('❌ 检测题目失败:', error);
        
        // 记录错误
        if (typeof performanceMonitor !== 'undefined') {
            performanceMonitor.incrementCounter('errors');
        }
        
        // 返回错误结果
        return {
            success: false,
            error: error.message || '未知错误',
            count: 0
        };
    }
}

// 通过输入元素推断题目
async function detectByInputElements() {
    const inputElements = document.querySelectorAll('input[type="radio"], input[type="checkbox"], input[type="text"], textarea, select');
    console.log(`找到 ${inputElements.length} 个输入元素`);
    
    if (inputElements.length === 0) return [];
    
    // 根据输入元素分组推断题目容器
    const containers = new Set();
    
    inputElements.forEach(input => {
        // 查找最近的可能的题目容器
        const container = input.closest('div[class*="question"], div[class*="problem"], .form-group, fieldset, .card, .panel') ||
                         input.closest('div, section, article');
        
        if (container && container !== document.body) {
            containers.add(container);
        }
    });
    
    return Array.from(containers);
}

// 处理自动填充 - 优化版本
async function handleAutoFill() {
    try {
        console.log('✨ 开始自动填充...');
        updateToolbarStatus('working', '填充中...');
        showNotification('开始填充', '正在自动填充答案...', 'info');
        
        if (currentStats.detected === 0) {
            showNotification('填充失败', '请先检测题目', 'warning');
            updateToolbarStatus('ready', '请先检测题目');
            return;
        }
        
        const result = await performAutoFill();
        
        if (result && result.success) {
            currentStats.filled = result.filledCount || 0;
            updateToolbarStatus('ready', `已填充 ${currentStats.filled}/${currentStats.detected} 道题目`);
            showNotification('填充完成', `成功填充 ${currentStats.filled}/${currentStats.detected} 道题目`, 'success');
        } else {
            updateToolbarStatus('error', '填充失败');
            showNotification('填充失败', result?.error || '未知错误', 'error');
        }
    } catch (error) {
        console.error('❌ 自动填充失败:', error);
        updateToolbarStatus('error', '填充失败');
        showNotification('填充失败', error.message || '未知错误', 'error');
    }
}

// 执行自动填充的核心逻辑
async function performAutoFill() {
    try {
        console.log('✨ 开始智能填充...');
        
        // 首先快速检测当前页面的题目（不重新全面检测）
        const questions = await getDetectedQuestions();
        
        if (questions.length === 0) {
            return {
                success: false,
                error: '未找到题目，请先检测题目',
                filledCount: 0
            };
        }

        let filledCount = 0;
        let processedCount = 0;
        
        console.log(`📝 开始填充 ${questions.length} 道题目...`);

        // 分批处理题目，避免一次性处理过多
        const batchSize = 3;
        for (let i = 0; i < questions.length; i += batchSize) {
            const batch = questions.slice(i, i + batchSize);
            
            // 并行处理当前批次
            const batchPromises = batch.map(async (question, batchIndex) => {
                const globalIndex = i + batchIndex;
                console.log(`🔍 处理第 ${globalIndex + 1} 道题目...`);
                
                try {
                    const answer = await getAnswerForQuestion(question);
                    if (answer) {
                        const success = await fillQuestionAnswer(question, answer);
                        if (success) {
                            // 添加视觉反馈
                            question.element.classList.add('wph-filled');
                            console.log(`✅ 第 ${globalIndex + 1} 道题目填充成功`);
                            return true;
                        }
                    }
                    console.log(`⚠️ 第 ${globalIndex + 1} 道题目未找到答案`);
                    return false;
                } catch (error) {
                    console.error(`❌ 第 ${globalIndex + 1} 道题目填充失败:`, error);
                    return false;
                }
            });
            
            // 等待当前批次完成
            const batchResults = await Promise.all(batchPromises);
            filledCount += batchResults.filter(result => result).length;
            processedCount += batch.length;
            
            // 批次之间添加延迟，模拟人类操作
            if (i + batchSize < questions.length) {
                await sleep(randomDelay(300, 600));
            }
        }

        console.log(`🎉 填充完成！成功填充 ${filledCount}/${questions.length} 道题目`);
        
        return {
            success: true,
            filledCount: filledCount,
            totalCount: questions.length
        };
        
    } catch (error) {
        console.error('❌ 自动填充失败:', error);
        return {
            success: false,
            error: error.message || '未知错误',
            filledCount: 0
        };
    }
}

// 获取已检测的题目（快速版本）
async function getDetectedQuestions() {
    // 首先尝试从全局变量获取已检测的题目
    if (detectedQuestions.length > 0) {
        console.log(`📋 从缓存获取 ${detectedQuestions.length} 道题目`);
        return detectedQuestions;
    }
    
    // 如果没有缓存的题目，尝试从已高亮的元素获取
    const highlightedElements = document.querySelectorAll('.wph-highlight');
    if (highlightedElements.length > 0) {
        console.log(`📋 从已高亮元素获取 ${highlightedElements.length} 道题目`);
        const questions = Array.from(highlightedElements).map((element, index) => 
            parseQuestion(element, index)
        ).filter(q => q !== null);
        
        // 更新缓存
        detectedQuestions = questions;
        return questions;
    }
    
    // 如果没有已高亮的元素，进行快速检测
    console.log('📋 进行快速题目检测...');
    const quickSelectors = [
        '.problem-item',
        '.question-item', 
        '.exam-question',
        'form .form-group'
    ];
    
    for (const selector of quickSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0 && elements.length < 20) { // 限制数量避免过多
            console.log(`📋 快速检测找到 ${elements.length} 道题目`);
            const questions = Array.from(elements).map((element, index) => 
                parseQuestion(element, index)
            ).filter(q => q !== null);
            
            // 更新缓存
            detectedQuestions = questions;
            return questions;
        }
    }
    
    return [];
}

// 随机延迟函数（模拟人类操作）
function randomDelay(min = 200, max = 500) {
    const delay = Math.random() * (max - min) + min;
    return delay;
}

// 处理提交
async function handleSubmit() {
    if (!confirm('确定要提交答案吗？此操作不可撤销！')) {
        return;
    }
    
    updateToolbarStatus('working', '提交中...');
    showNotification('开始提交', '正在提交答案...', 'warning');
    
    try {
        // 查找提交按钮
        const submitSelectors = [
            'button[type="submit"]',
            '.submit-btn',
            '.btn-submit',
            'input[type="submit"]',
            'button:contains("提交")',
            'button:contains("Submit")'
        ];
        
        let submitButton = null;
        for (const selector of submitSelectors) {
            submitButton = document.querySelector(selector);
            if (submitButton) break;
        }
        
        // 如果没找到，尝试通过文本内容查找
        if (!submitButton) {
            const buttons = document.querySelectorAll('button');
            submitButton = Array.from(buttons).find(btn => 
                btn.textContent.includes('提交') || 
                btn.textContent.includes('Submit') ||
                btn.textContent.includes('确认')
            );
        }
        
        if (submitButton) {
            // 添加提交前的视觉反馈
            submitButton.classList.add('wph-processing');
            
            // 模拟点击提交
            submitButton.click();
            
            updateToolbarStatus('ready', '提交成功');
            showNotification('提交成功', '答案已成功提交！', 'success');
        } else {
            updateToolbarStatus('error', '提交失败');
            showNotification('提交失败', '未找到提交按钮', 'error');
        }
    } catch (error) {
        console.error('提交答案失败:', error);
        updateToolbarStatus('error', '提交失败');
        showNotification('提交失败', error.message || '未知错误', 'error');
    }
}

// 切换最小化
function toggleMinimize() {
    if (!toolbarElement) return;
    
    toolbarElement.classList.toggle('minimized');
    const minimizeBtn = toolbarElement.querySelector('.wph-minimize');
    minimizeBtn.textContent = toolbarElement.classList.contains('minimized') ? '+' : '−';
}

// 切换工具栏显示/隐藏
function toggleToolbar() {
    if (!toolbarElement) return;
    
    toolbarElement.classList.toggle('wph-hidden');
}

// 使元素可拖拽
function makeDraggable(element) {
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    const header = element.querySelector('.wph-toolbar-header');
    
    header.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    function dragStart(e) {
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;

        if (e.target === header || header.contains(e.target)) {
            isDragging = true;
            element.classList.add('dragging');
        }
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;

            xOffset = currentX;
            yOffset = currentY;

            element.style.transform = `translate(${currentX}px, ${currentY}px)`;
        }
    }

    function dragEnd() {
        initialX = currentX;
        initialY = currentY;
        isDragging = false;
        element.classList.remove('dragging');
    }
}

// AI服务相关消息处理函数
async function testAIConnection(config, sendResponse) {
    try {
        console.log('🧪 测试AI服务连接...');
        
        // 确保AI服务已初始化
        if (!aiService) {
            try {
                // 动态加载AI服务
                if (typeof AIService !== 'undefined') {
                    aiService = new AIService();
                } else {
                    // 如果AI服务不可用，使用本地答案库
                    console.warn('AI服务未定义，将使用本地答案库');
                    sendResponse({
                        success: true,
                        configured: false,
                        message: 'AI服务未配置，将使用本地答案库'
                    });
                    return;
                }
            } catch (error) {
                console.error('AI服务初始化失败:', error);
                sendResponse({
                    success: false,
                    error: 'AI服务初始化失败: ' + error.message
                });
                return; // 直接返回，不继续执行
            }
        }
        
        // 更新配置
        if (config) {
            await aiService.updateConfig(config);
        }
        
        // 测试连接
        const testQuestion = "什么是计算机科学？";
        const result = await aiService.generateAnswer(testQuestion, 'single_choice', [
            { value: 'A', text: '研究计算机硬件的科学' },
            { value: 'B', text: '研究计算机软件的科学' },
            { value: 'C', text: '研究计算机系统及其应用的学科' }
        ]);
        
        if (result) {
            sendResponse({
                success: true,
                message: 'AI服务连接测试成功',
                response: result
            });
        } else {
            sendResponse({
                success: false,
                error: 'AI服务连接测试失败，未收到有效响应'
            });
        }
        
    } catch (error) {
        console.error('AI服务连接测试失败:', error);
        sendResponse({
            success: false,
            error: 'AI服务连接测试失败: ' + error.message
        });
    }
}

// 获取答案但不填充（新功能）
async function getAnswersOnly(sendResponse) {
    try {
        console.log('📋 开始获取答案（仅显示）...');
        
        const questions = await getDetectedQuestions();
        
        if (questions.length === 0) {
            sendResponse({
                success: false,
                error: '未找到题目，请先检测题目',
                answers: []
            });
            return;
        }

        const answers = [];
        let processedCount = 0;
        
        console.log(`📝 开始分析 ${questions.length} 道题目...`);

        // 分批处理题目
        const batchSize = 3;
        for (let i = 0; i < questions.length; i += batchSize) {
            const batch = questions.slice(i, i + batchSize);
            
            // 并行处理当前批次
            const batchPromises = batch.map(async (question, batchIndex) => {
                const globalIndex = i + batchIndex;
                console.log(`🔍 分析第 ${globalIndex + 1} 道题目...`);
                
                try {
                    const answer = await getAnswerForQuestion(question);
                    return {
                        index: globalIndex + 1,
                        title: question.title,
                        type: question.type,
                        content: question.content || question.title,
                        options: question.options.map(opt => ({ value: opt.value, text: opt.text })),
                        answer: answer || '未找到答案',
                        hasAnswer: !!answer
                    };
                } catch (error) {
                    console.error(`❌ 第 ${globalIndex + 1} 道题目分析失败:`, error);
                    return {
                        index: globalIndex + 1,
                        title: question.title,
                        type: question.type,
                        content: question.content || question.title,
                        options: question.options.map(opt => ({ value: opt.value, text: opt.text })),
                        answer: '分析失败',
                        hasAnswer: false,
                        error: error.message
                    };
                }
            });
            
            // 等待当前批次完成
            const batchResults = await Promise.all(batchPromises);
            answers.push(...batchResults);
            processedCount += batch.length;
            
            // 批次间延迟
            if (i + batchSize < questions.length) {
                await sleep(200);
            }
        }

        console.log(`🎉 答案分析完成！处理了 ${processedCount} 道题目`);
        
        sendResponse({
            success: true,
            answers: answers,
            totalCount: questions.length,
            answeredCount: answers.filter(a => a.hasAnswer).length
        });
        
    } catch (error) {
        console.error('❌ 获取答案失败:', error);
        sendResponse({ 
            success: false, 
            error: error.message || '未知错误',
            answers: []
        });
    }
}

// 处理显示答案
async function handleShowAnswers() {
    try {
        console.log('📋 开始显示答案...');
        updateToolbarStatus('working', '分析中...');
        showNotification('开始分析', '正在分析题目并获取答案...', 'info');
        
        if (currentStats.detected === 0) {
            showNotification('分析失败', '请先检测题目', 'warning');
            updateToolbarStatus('ready', '请先检测题目');
            return;
        }
        
        const result = await performGetAnswersOnly();
        
        if (result && result.success) {
            updateToolbarStatus('ready', `已分析 ${result.answeredCount}/${result.totalCount} 道题目`);
            showAnswersModal(result.answers);
            showNotification('分析完成', `成功分析 ${result.answeredCount}/${result.totalCount} 道题目`, 'success');
        } else {
            updateToolbarStatus('error', '分析失败');
            showNotification('分析失败', result?.error || '未知错误', 'error');
        }
    } catch (error) {
        console.error('❌ 显示答案失败:', error);
        updateToolbarStatus('error', '分析失败');
        showNotification('分析失败', error.message || '未知错误', 'error');
    }
}

// 执行获取答案的核心逻辑
async function performGetAnswersOnly() {
    try {
        console.log('📋 开始智能答案分析...');
        
        const questions = await getDetectedQuestions();
        
        if (questions.length === 0) {
            return {
                success: false,
                error: '未找到题目，请先检测题目',
                answers: []
            };
        }

        const answers = [];
        let processedCount = 0;
        
        console.log(`📝 开始分析 ${questions.length} 道题目...`);

        // 分批处理题目
        const batchSize = 3;
        for (let i = 0; i < questions.length; i += batchSize) {
            const batch = questions.slice(i, i + batchSize);
            
            // 并行处理当前批次
            const batchPromises = batch.map(async (question, batchIndex) => {
                const globalIndex = i + batchIndex;
                console.log(`🔍 分析第 ${globalIndex + 1} 道题目...`);
                
                try {
                    const answer = await getAnswerForQuestion(question);
                    return {
                        index: globalIndex + 1,
                        title: question.title,
                        type: question.type,
                        content: question.content || question.title,
                        options: question.options.map(opt => ({ value: opt.value, text: opt.text })),
                        answer: answer || '未找到答案',
                        hasAnswer: !!answer
                    };
                } catch (error) {
                    console.error(`❌ 第 ${globalIndex + 1} 道题目分析失败:`, error);
                    return {
                        index: globalIndex + 1,
                        title: question.title,
                        type: question.type,
                        content: question.content || question.title,
                        options: question.options.map(opt => ({ value: opt.value, text: opt.text })),
                        answer: '分析失败',
                        hasAnswer: false,
                        error: error.message
                    };
                }
            });
            
            // 等待当前批次完成
            const batchResults = await Promise.all(batchPromises);
            answers.push(...batchResults);
            processedCount += batch.length;
            
            // 批次间延迟
            if (i + batchSize < questions.length) {
                await sleep(200);
            }
        }

        console.log(`🎉 答案分析完成！处理了 ${processedCount} 道题目`);
        
        return {
            success: true,
            answers: answers,
            totalCount: questions.length,
            answeredCount: answers.filter(a => a.hasAnswer).length
        };
        
    } catch (error) {
        console.error('❌ 获取答案失败:', error);
        return {
            success: false,
            error: error.message || '未知错误',
            answers: []
        };
    }
}

// 获取答案显示文本（将选项值映射到选项文本，Pintia 平台优化版）
function getAnswerDisplayText(answer) {
    if (!answer.hasAnswer || !answer.answer) {
        return '<span class="wph-answer-text no-answer">未找到答案</span>';
    }
    // 新增兜底：无选项时统一以代码块展示，避免误判为选择题
    if (!answer.options || answer.options.length === 0) {
        return `<pre class="wph-code-block"><code>${answer.answer}</code></pre>`;
    }
    
    // 如果是选择题且有选项，尝试将答案值映射到选项文本
    if ((answer.type === 'single_choice' || answer.type === 'multiple_choice') && 
        answer.options && answer.options.length > 0) {
        
        const answerValues = answer.answer.split(',').map(val => val.trim());
        const displayTexts = [];
        
        for (const value of answerValues) {
            // 查找对应的选项
            const matchingOption = answer.options.find(opt => 
                (opt.value && opt.value === value) || 
                (opt.displayValue && opt.displayValue === value)
            );
            if (matchingOption && matchingOption.text) {
                // 优先显示选项字母（A、B、C、D）而不是input的value
                const optionLetter = getOptionLetter(matchingOption.value, answer.options);
                
                // 清理选项文本（移除可能的HTML标签和多余空格）
                const cleanOptionText = cleanPintiaOptionText(matchingOption.text, optionLetter);
                
                // 创建带样式的选项显示
                const optionClass = answer.type === 'multiple_choice' ? 
                    'wph-multiple-option' : 'wph-option-letter';
                
                displayTexts.push(
                    `<span class="${optionClass}" title="${cleanOptionText}">${optionLetter}</span>` +
                    `<span class="wph-option-text">${cleanOptionText}</span>`
                );
            } else {
                // 如果没有找到匹配的选项，尝试将值转换为选项字母
                const optionLetter = getOptionLetter(value, answer.options);
                displayTexts.push(`<span class="wph-option-letter">${optionLetter}</span>`);
            }
        }
        
        // 对于多选题，使用特殊的样式类
        if (answer.type === 'multiple_choice') {
            return `<div class="wph-multiple-answers">${displayTexts.join(' ')}</div>`;
        }
        
        return displayTexts.join(', ');
    }
    
    // 对于判断题，使用专门的样式
    if (answer.type === 'true_false') {
        if (answer.answer === '正确' || answer.answer === 'true') {
            return '<span class="wph-answer-text wph-true-false wph-true">✅ 正确</span>';
        } else if (answer.answer === '错误' || answer.answer === 'false') {
            return '<span class="wph-answer-text wph-true-false wph-false">❌ 错误</span>';
        }
    }
    
    // 对于填空题，使用可复制代码块显示
    if (answer.type === 'fill_blank') {
        return `<pre class="wph-code-block"><code>${answer.answer}</code></pre>`;
    }
    
    // 对于编程题，使用可复制代码块显示
    if (answer.type === 'programming') {
        return `<pre class="wph-code-block"><code>${answer.answer}</code></pre>`;
    }
    
    // 对于其他类型的题目，使用通用答案样式
    return `<span class="wph-answer-text has-answer">${answer.answer}</span>`;
}

// 获取选项字母（A、B、C、D）
function getOptionLetter(value, options) {
    if (!options || options.length === 0) return value;

    const v = (value || '').toString().trim();

    // 已是标准字母
    if (/^[A-Z]$/i.test(v)) return v.toUpperCase();

    // 数字索引：优先按“1 -> A”的人类序号，其次兼容“0 -> A”
    if (/^\d+$/.test(v)) {
        const n = parseInt(v, 10);
        // 先尝试 1-based
        if (n >= 1 && n <= options.length) {
            return String.fromCharCode(65 + (n - 1));
        }
        // 兼容 0-based
        if (n >= 0 && n < options.length) {
            return String.fromCharCode(65 + n);
        }
    }

    // 优先以 displayValue 匹配（标准字母映射）
    const byDisplay = options.findIndex(opt => (opt.displayValue || '').toUpperCase() === v.toUpperCase());
    if (byDisplay >= 0) return (options[byDisplay].displayValue || '').toUpperCase();

    // 再尝试以 value 匹配（与展示已统一为字母）
    const byValue = options.findIndex(opt => (opt.value || '').toUpperCase() === v.toUpperCase());
    if (byValue >= 0) return (options[byValue].displayValue || String.fromCharCode(65 + byValue)).toUpperCase();

    // 最后回退：直接返回原值（避免空）
    return v.toUpperCase();
}

// 显示答案模态框
function showAnswersModal(answers) {
    // 移除现有的模态框
    const existingModal = document.querySelector('.wph-answers-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'wph-answers-modal';
    
    // 生成答案列表HTML
    let answersHtml = '';
    let copyableText = ''; // 用于复制的纯文本
    
    answers.forEach((answer, index) => {
        const statusIcon = answer.hasAnswer ? '✅' : '❌';
        const statusClass = answer.hasAnswer ? 'success' : 'error';
        
        // 格式化选项显示（Pintia 平台优化）
        const formattedOptions = formatOptionsForDisplay(answer.options);
        
        answersHtml += `
            <div class="answer-item ${statusClass}">
                <div class="answer-header">
                    <span class="answer-status">${statusIcon}</span>
                    <span class="answer-index">第${answer.index}题</span>
                    <span class="answer-type">[${getTypeDisplayName(answer.type)}]</span>
                </div>
                <div class="answer-title">${answer.title}</div>
                ${(answer.options.length > 0 && answer.type !== 'programming' && answer.type !== 'fill_blank') ? `
                    <div class="answer-options">
                        <div class="options-header">
                            <strong>选项列表：</strong>
                            <span class="options-count">共 ${answer.options.length} 个选项</span>
                        </div>
                        ${formattedOptions}
                    </div>
                ` : ''}
                <div class="answer-result">
                    <div class="answer-result-header">
                        <strong>答案：</strong>
                        ${answer.hasAnswer ? `
                            <div class="answer-actions">
                                <button class="copy-single-btn" data-answer="${answer.answer}" title="复制此答案">📋 复制</button>
                                <button class="auto-fill-btn" data-index="${answer.index}" data-answer="${answer.answer}" data-type="${answer.type}" title="自动填充此答案">🔄 自动填充</button>
                            </div>
                        ` : ''}
                    </div>
                    <div class="answer-content">
                        <span class="answer-text ${answer.hasAnswer ? 'has-answer' : 'no-answer'}">${getAnswerDisplayText(answer)}</span>
                    </div>
                </div>
                ${answer.error ? `<div class="answer-error">错误信息: ${answer.error}</div>` : ''}
            </div>
        `;
        
        // 添加到可复制文本（包含选项信息）
        copyableText += `第${answer.index}题 [${getTypeDisplayName(answer.type)}]: ${answer.answer}\n`;
        if (answer.options.length > 0) {
            copyableText += `  选项: ${answer.options.map(opt => `${opt.value}. ${opt.text}`).join(', ')}\n`;
        }
        copyableText += '\n';
    });
    
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h3>📋 题目答案列表 - Web 题目助手</h3>
                <div class="modal-actions">
                    <button class="auto-fill-all-btn" title="自动填充所有答案">🔄 全部填充</button>
                    <button class="copy-all-btn" title="复制所有答案">📋 复制全部</button>
                    <button class="export-extension-btn" title="导出扩展题库">🗂️ 导出扩展题库</button>
                    <button class="close-modal-btn" title="关闭">✕</button>
                </div>
            </div>
            <div class="modal-body">
                <div class="answers-summary">
                    <span class="summary-text">共 ${answers.length} 道题目</span>
                    <span class="answered-count">✅ 已找到: ${answers.filter(a => a.hasAnswer).length}</span>
                    <span class="not-answered-count">❌ 未找到: ${answers.filter(a => !a.hasAnswer).length}</span>
                </div>
                <div class="answers-filter">
                    <button class="filter-btn active" data-filter="all">全部</button>
                    <button class="filter-btn" data-filter="answered">已找到</button>
                    <button class="filter-btn" data-filter="not-answered">未找到</button>
                </div>
                <div class="answers-list">
                    ${answersHtml}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 添加事件监听器
    const closeBtn = modal.querySelector('.close-modal-btn');
    const overlay = modal.querySelector('.modal-overlay');
    const copyAllBtn = modal.querySelector('.copy-all-btn');
    const copySingleBtns = modal.querySelectorAll('.copy-single-btn');
    const autoFillBtns = modal.querySelectorAll('.auto-fill-btn');
    const autoFillAllBtn = modal.querySelector('.auto-fill-all-btn');
    const exportExtensionBtn = modal.querySelector('.export-extension-btn');
    const filterBtns = modal.querySelectorAll('.filter-btn');
    
    // 关闭模态框
    const closeModal = () => {
        modal.classList.add('closing');
        setTimeout(() => modal.remove(), 300);
    };
    
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);
    
    // 复制所有答案
    copyAllBtn.addEventListener('click', () => {
        copyToClipboard(copyableText);
        showNotification('复制成功', '所有答案已复制到剪贴板', 'success');
    });

    // 导出扩展题库
    if (exportExtensionBtn) {
        exportExtensionBtn.addEventListener('click', async () => {
            try {
                await exportExtensionBankToFile();
                showNotification('导出成功', '扩展题库已导出为JSON文件', 'success');
            } catch (e) {
                console.error('导出扩展题库失败:', e);
                showNotification('导出失败', e.message || '未知错误', 'error');
            }
        });
    }
    
    // 复制单个答案
    copySingleBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const answer = e.target.getAttribute('data-answer');
            copyToClipboard(answer);
            showNotification('复制成功', `答案"${answer}"已复制到剪贴板`, 'success');
        });
    });
    
    // 自动填充单个答案
    autoFillBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const index = e.target.getAttribute('data-index');
            const answer = e.target.getAttribute('data-answer');
            const type = e.target.getAttribute('data-type');
            
            showNotification('开始填充', `正在填充第${index}题答案...`, 'info');
            
            // 查找对应的题目并填充
            const questions = await getDetectedQuestions();
            const targetQuestion = questions[index - 1];
            
            if (targetQuestion) {
                const success = await fillQuestionAnswer(targetQuestion, answer);
                if (success) {
                    showNotification('填充成功', `第${index}题答案已自动填充`, 'success');
                    e.target.textContent = '✅ 已填充';
                    e.target.disabled = true;
                } else {
                    showNotification('填充失败', `第${index}题自动填充失败`, 'error');
                }
            } else {
                showNotification('填充失败', `未找到第${index}题`, 'error');
            }
        });
    });
    
    // 自动填充所有答案
    autoFillAllBtn.addEventListener('click', async () => {
        showNotification('开始填充', '正在自动填充所有答案...', 'info');
        
        const questions = await getDetectedQuestions();
        let successCount = 0;
        
        for (let i = 0; i < answers.length; i++) {
            const answer = answers[i];
            if (answer.hasAnswer && questions[i]) {
                const success = await fillQuestionAnswer(questions[i], answer.answer);
                if (success) {
                    successCount++;
                    // 更新按钮状态
                    const fillBtn = modal.querySelector(`.auto-fill-btn[data-index="${i + 1}"]`);
                    if (fillBtn) {
                        fillBtn.textContent = '✅ 已填充';
                        fillBtn.disabled = true;
                    }
                }
                // 短暂延迟避免过快触发
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        showNotification('填充完成', `成功填充 ${successCount}/${answers.filter(a => a.hasAnswer).length} 个答案`, 'success');
    });
    
    // 筛选功能
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const filter = e.target.getAttribute('data-filter');
            
            // 更新按钮状态
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            // 筛选答案项
            const answerItems = modal.querySelectorAll('.answer-item');
            answerItems.forEach(item => {
                const isAnswered = item.classList.contains('success');
                
                if (filter === 'all' ||
                    (filter === 'answered' && isAnswered) ||
                    (filter === 'not-answered' && !isAnswered)) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });
    
    // ESC键关闭
    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', handleEsc);
        }
    };
    document.addEventListener('keydown', handleEsc);
    
    // 显示动画
    setTimeout(() => modal.classList.add('show'), 100);
}

// 格式化选项显示（Pintia 平台优化）
function formatOptionsForDisplay(options) {
    if (!options || options.length === 0) return '';
    
    return options.map((opt, idx) => {
        // 优先使用 displayValue（A/B/C/D），否则按索引计算字母
        const optionLetter = opt.displayValue || String.fromCharCode(65 + idx);
        const cleanText = cleanPintiaOptionText(opt.text, optionLetter);
        
        return `
            <div class="option-item">
                <span class="option-letter">${optionLetter}</span>
                <span class="option-text" title="${cleanText}">${cleanText}</span>
            </div>
        `;
    }).join('');
}

// 获取题目类型显示名称
function getTypeDisplayName(type) {
    const typeNames = {
        'single_choice': '单选题',
        'multiple_choice': '多选题',
        'fill_blank': '填空题',
        'programming': '编程题',
        'true_false': '判断题',
        'unknown': '未知类型'
    };
    return typeNames[type] || '未知类型';
}

// 复制到剪贴板
function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        // 使用现代API
        navigator.clipboard.writeText(text).catch(err => {
            console.error('复制失败:', err);
            fallbackCopyTextToClipboard(text);
        });
    } else {
        // 回退方案
        fallbackCopyTextToClipboard(text);
    }
}

// 回退复制方案
function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        console.log('使用回退方案复制成功');
    } catch (err) {
        console.error('回退复制方案也失败了:', err);
    }
    
    document.body.removeChild(textArea);
}

async function updateAIConfig(config, sendResponse) {
    try {
        console.log('⚙️ 更新AI服务配置...');
        
        // 确保AI服务已初始化
        if (!aiService) {
            try {
                if (typeof AIService !== 'undefined') {
                    aiService = new AIService();
                } else {
                    throw new Error('AI服务未定义');
                }
            } catch (error) {
                console.error('AI服务初始化失败:', error);
                sendResponse({
                    success: false,
                    error: 'AI服务初始化失败: ' + error.message
                });
                return; // 直接返回，不继续执行
            }
        }
        
        // 更新配置
        await aiService.updateConfig(config);
        
        // 保存配置到存储
        if (typeof chrome !== 'undefined' && chrome.storage) {
            await chrome.storage.local.set({ aiConfig: config });
        }
        
        sendResponse({
            success: true,
            message: 'AI服务配置更新成功'
        });
        
    } catch (error) {
        console.error('更新AI服务配置失败:', error);
        sendResponse({
            success: false,
            error: '更新AI服务配置失败: ' + error.message
        });
    }
}

async function getAIStatus(sendResponse) {
    try {
        console.log('📊 获取AI服务状态...');
        
        if (!aiService) {
            sendResponse({
                success: true,
                enabled: false,
                status: '未初始化',
                message: 'AI服务未初始化'
            });
            return; // 直接返回，不继续执行
        }
        
        const status = aiService.getStatus();
        
        sendResponse({
            success: true,
            enabled: status.enabled,
            baseURL: status.baseURL,
            cacheSize: status.cacheSize,
            totalCalls: status.totalCalls || 0,
            successfulCalls: status.successfulCalls || 0,
            failedCalls: status.failedCalls || 0,
            cacheHits: status.cacheHits || 0,
            status: status.enabled ? '已启用' : '已禁用'
        });
        
    } catch (error) {
        console.error('获取AI服务状态失败:', error);
        sendResponse({
            success: false,
            error: '获取AI服务状态失败: ' + error.message
        });
    }
}

// 混元AI相关处理函数
async function testHunyuanConnection(config, sendResponse) {
    try {
        console.log('🧪 测试混元AI连接...');
        
        // 确保混元服务已初始化
        if (typeof hunyuanService === 'undefined') {
            sendResponse({
                success: false,
                error: '混元AI服务未加载，请刷新页面重试'
            });
            return; // 直接返回，不继续执行
        }
        
        // 设置配置
        await hunyuanService.setConfig(config.secretId, config.secretKey);
        
        // 测试连接
        const testPrompt = "请回答：1+1等于几？";
        const response = await hunyuanService.callHunyuanLite(testPrompt, {
            Temperature: 0.1,
            TopP: 0.9
        });
        
        if (response && response.choices && response.choices.length > 0) {
            sendResponse({
                success: true,
                message: '混元AI连接测试成功！',
                testResponse: response.choices[0].message.content
            });
        } else {
            sendResponse({
                success: false,
                error: '混元AI返回了无效响应'
            });
        }
        
    } catch (error) {
        console.error('测试混元AI连接失败:', error);
        sendResponse({
            success: false,
            error: '连接测试失败: ' + error.message
        });
    }
}

async function updateHunyuanConfig(config, sendResponse) {
    try {
        console.log('⚙️ 更新混元AI配置...');
        
        // 确保混元服务已初始化
        if (typeof hunyuanService === 'undefined') {
            sendResponse({
                success: false,
                error: '混元AI服务未加载'
            });
            return; // 直接返回，不继续执行
        }
        
        // 处理API密钥格式（支持组合格式 SecretId:SecretKey）
        let secretId = config.secretId;
        let secretKey = config.secretKey;
        
        // 如果提供了组合格式的API密钥，解析它
        if (config.apiKey && config.apiKey.includes(':')) {
            const [parsedSecretId, parsedSecretKey] = config.apiKey.split(':');
            secretId = parsedSecretId;
            secretKey = parsedSecretKey;
            console.log('✅ 从组合API密钥解析出SecretId和SecretKey');
        }
        
        // 更新配置
        if (config.enabled && secretId && secretKey) {
            await hunyuanService.setConfig(secretId, secretKey);
            
            // 同时更新apiService配置，确保一致性
            if (typeof apiService !== 'undefined') {
                // 将SecretId和SecretKey组合为API密钥格式
                const apiKey = `${secretId}:${secretKey}`;
                apiService.updateConfig({
                    apiKey: apiKey,
                    currentAPI: 'hunyuan-lite'
                });
            }
        }
        
        // 保存配置到存储（保持原始格式）
        if (typeof chrome !== 'undefined' && chrome.storage) {
            await chrome.storage.local.set({ hunyuanConfig: config });
        }
        
        sendResponse({
            success: true,
            message: '混元AI配置更新成功，API服务配置已同步'
        });
        
    } catch (error) {
        console.error('更新混元AI配置失败:', error);
        sendResponse({
            success: false,
            error: '更新配置失败: ' + error.message
        });
    }
}

async function clearHunyuanCache(sendResponse) {
    try {
        console.log('🗑️ 清空混元AI缓存...');
        
        if (typeof hunyuanService !== 'undefined') {
            hunyuanService.clearCache();
        }
        
        sendResponse({
            success: true,
            message: '混元AI缓存已清空'
        });
        
    } catch (error) {
        console.error('清空混元AI缓存失败:', error);
        sendResponse({
            success: false,
            error: '清空缓存失败: ' + error.message
        });
    }
}

async function getHunyuanStatus(sendResponse) {
    try {
        console.log('📊 获取混元AI状态...');
        
        if (typeof hunyuanService === 'undefined') {
            sendResponse({
                success: true,
                enabled: false,
                status: '未加载',
                message: '混元AI服务未加载'
            });
            return; // 直接返回，不继续执行
        }
        
        const stats = hunyuanService.getUsageStats();
        
        sendResponse({
            success: true,
            enabled: stats.isConfigured,
            cacheSize: stats.cacheSize,
            status: stats.isConfigured ? '已配置' : '未配置',
            message: stats.isConfigured ? '混元AI服务已就绪' : '请配置SecretId和SecretKey'
        });
        
    } catch (error) {
        console.error('获取混元AI状态失败:', error);
        sendResponse({
            success: false,
            error: '获取状态失败: ' + error.message
        });
    }
}

// 初始化混元AI配置
async function initHunyuanConfig() {
    try {
        if (typeof hunyuanService !== 'undefined' && typeof chrome !== 'undefined' && chrome.storage) {
            const config = await chrome.storage.local.get(['hunyuanConfig']);
            if (config.hunyuanConfig && config.hunyuanConfig.enabled) {
                await hunyuanService.setConfig(
                    config.hunyuanConfig.secretId,
                    config.hunyuanConfig.secretKey
                );
                console.log('✅ 混元AI配置已加载');
            }
        }
    } catch (error) {
        console.warn('初始化混元AI配置失败:', error);
    }
}

// 页面加载完成后初始化混元AI
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHunyuanConfig);
} else {
    initHunyuanConfig();
}

// 添加专门的CSS样式来优化选项显示
function injectOptionStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* 选项字母样式优化 - 确保A、B、C、D格式清晰显示 */
        .wph-option-letter {
            display: inline-block;
            min-width: 24px;
            height: 24px;
            line-height: 24px;
            text-align: center;
            background: #2196f3;
            color: white;
            border-radius: 12px;
            font-weight: bold;
            margin-right: 8px;
            font-size: 14px;
            vertical-align: middle;
        }
        
        /* 选项文本样式 */
        .wph-option-text {
            display: inline-block;
            vertical-align: middle;
            max-width: 300px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        
        /* 多选题选项样式 */
        .wph-multiple-option {
            display: inline-block;
            min-width: 24px;
            height: 24px;
            line-height: 24px;
            text-align: center;
            background: #ff9800;
            color: white;
            border-radius: 12px;
            font-weight: bold;
            margin: 0 4px;
            font-size: 14px;
            vertical-align: middle;
        }
        
        /* 多选题答案容器 */
        .wph-multiple-answers {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            align-items: center;
        }
        
        /* 答案文本基础样式 */
        .wph-answer-text {
            font-weight: bold;
            color: #4caf50;
            background: #e8f5e8;
            padding: 2px 8px;
            border-radius: 4px;
            border: 1px solid #4caf50;
        }
        
        .wph-answer-text.has-answer {
            color: #4caf50;
            background: #e8f5e8;
        }
        
        .wph-answer-text.no-answer {
            color: #f44336;
            background: #ffebee;
        }
        
        /* 判断题样式 */
        .wph-true-false {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 6px;
            font-weight: bold;
            font-size: 14px;
        }
        
        .wph-true {
            background: #4caf50;
            color: white;
            border: 1px solid #388e3c;
        }
        
        .wph-false {
            background: #f44336;
            color: white;
            border: 1px solid #d32f2f;
        }
        
        /* 填空题答案样式 */
        .wph-blank-answer {
            background: #e3f2fd;
            color: #1976d2;
            padding: 4px 8px;
            border-radius: 4px;
            border: 1px dashed #2196f3;
            font-family: monospace;
            font-weight: bold;
        }
        
        /* 编程题代码样式 */
        .wph-code-answer {
            background: #f5f5f5;
            color: #333;
            padding: 4px 8px;
            border-radius: 4px;
            border: 1px solid #ddd;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 13px;
            white-space: pre-wrap;
        }
        
        /* 答案模态框中的选项显示优化 */
        .answer-options .option {
            display: block;
            margin: 4px 0;
            padding: 4px 8px;
            background: #f8f9fa;
            border-radius: 4px;
            border-left: 3px solid #2196f3;
            font-family: monospace;
        }
        
        /* 选项项样式 */
        .option-item {
            display: flex;
            align-items: center;
            margin: 6px 0;
            padding: 8px 12px;
            background: #f8f9fa;
            border-radius: 6px;
            border: 1px solid #e9ecef;
        }
        
        .option-letter {
            display: inline-block;
            min-width: 24px;
            height: 24px;
            line-height: 24px;
            text-align: center;
            background: #2196f3;
            color: white;
            border-radius: 12px;
            font-weight: bold;
            margin-right: 12px;
            font-size: 14px;
        }
        
        .option-text {
            flex: 1;
            font-size: 14px;
            line-height: 1.4;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .options-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e9ecef;
        }
        
        .options-count {
            font-size: 12px;
            color: #6c757d;
        }
        
        /* 答案操作按钮 */
        .answer-actions {
            display: flex;
            gap: 8px;
            margin-left: auto;
        }
        
        .copy-single-btn,
        .auto-fill-btn,
        .auto-fill-all-btn {
            padding: 6px 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            background: white;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s ease;
        }
        
        .copy-single-btn:hover,
        .auto-fill-btn:hover,
        .auto-fill-all-btn:hover {
            background: #f8f9fa;
            border-color: #2196f3;
        }
        
        .copy-single-btn:active,
        .auto-fill-btn:active,
        .auto-fill-all-btn:active {
            transform: translateY(1px);
        }
        
        .auto-fill-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        
        /* 答案结果头部 */
        .answer-result-header {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
            gap: 12px;
        }
        
        .answer-content {
            margin-top: 8px;
        }
        
        /* 筛选按钮 */
        .answers-filter {
            display: flex;
            gap: 8px;
            margin: 12px 0;
            padding: 12px;
            background: #f8f9fa;
            border-radius: 6px;
        }
        
        .filter-btn {
            padding: 6px 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            background: white;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s ease;
        }
        
        .filter-btn.active {
            background: #2196f3;
            color: white;
            border-color: #2196f3;
        }
        
        .filter-btn:hover {
            background: #e3f2fd;
            border-color: #2196f3;
        }
        
        /* 答案摘要 */
        .answers-summary {
            display: flex;
            gap: 16px;
            padding: 12px;
            background: #e8f5e8;
            border-radius: 6px;
            margin-bottom: 12px;
            font-size: 14px;
        }
        
        .answered-count {
            color: #4caf50;
            font-weight: bold;
        }
        
        .not-answered-count {
            color: #f44336;
            font-weight: bold;
        }
        
        /* 答案错误信息 */
        .answer-error {
            margin-top: 8px;
            padding: 8px;
            background: #ffebee;
            border: 1px solid #f44336;
            border-radius: 4px;
            color: #d32f2f;
            font-size: 12px;
        }
        
        /* 悬停效果 */
        .wph-option-letter:hover,
        .wph-multiple-option:hover {
            transform: scale(1.1);
            transition: transform 0.2s ease;
        }
        
        /* 移动端适配 */
        @media (max-width: 768px) {
            .wph-option-letter,
            .wph-multiple-option {
                min-width: 20px;
                height: 20px;
                line-height: 20px;
                font-size: 12px;
            }
            
            .wph-option-text {
                max-width: 200px;
            }
            
            .answer-actions {
                flex-direction: column;
                gap: 4px;
            }
            
            .answers-summary {
                flex-direction: column;
                gap: 8px;
            }
            
            .answers-filter {
                flex-wrap: wrap;
            }
        }
    `;
    document.head.appendChild(style);
}

/** 扩展题库：本地未命中但从API/混元获取到的题目答案的暂存区（不参与检索） **/

function computeQuestionSignature(payload) {
    // 使用题干+规范化选项文本生成签名，避免重复
    const base = (payload.content || payload.title || '').toLowerCase().replace(/\s+/g, ' ').trim();
    const opts = (payload.options || []).map(o => (o.text || '').toLowerCase().replace(/\s+/g, ' ').trim()).join('|');
    return `${base}::${opts}`;
}

async function getExtensionBank() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const data = await chrome.storage.local.get(['extensionQuestionBank']);
        return data.extensionQuestionBank || [];
    }
    // 回退：页面环境不支持存储时返回空
    return [];
}

async function addToExtensionBank(entry) {
    try {
        const bank = await getExtensionBank();
        const signature = computeQuestionSignature(entry);
        // 去重：如果已有相同签名则跳过
        const exists = bank.some(item => item.signature === signature);
        if (!exists) {
            bank.push({
                signature,
                title: entry.title,
                content: entry.content,
                type: entry.type,
                options: entry.options,
                answer: entry.answer,
                source: entry.source || 'unknown',
                timestamp: entry.timestamp || Date.now()
            });
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                await chrome.storage.local.set({ extensionQuestionBank: bank });
            }
        }
    } catch (e) {
        console.warn('写入扩展题库失败:', e);
    }
}

async function exportExtensionBankToFile() {
    const bank = await getExtensionBank();
    const blob = new Blob([JSON.stringify({ meta: { title: '扩展题库', version: '1.0' }, questions: bank }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'extension-question-bank.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 0);
}

/** 本地检索上下文（RAG）模块：从本地题库检索相似题，作为提示上下文 **/
async function loadCategoryJSON(relPath) {
    try {
        const url = chrome?.runtime?.getURL ? chrome.runtime.getURL(relPath) : relPath;
        const res = await fetch(url);
        if (!res.ok) return null;
        const json = await res.json();
        return json && (json.questions || Array.isArray(json)) ? json : null;
    } catch (e) {
        console.warn('加载题库失败:', relPath, e);
        return null;
    }
}

function normalizeText(s) {
    return (s || '').toLowerCase().replace(/<[^>]*>/g, '').replace(/[\s\r\n\t]+/g, ' ').trim();
}

function extractKeywords(text) {
    const stop = new Set(['的','是','在','和','与','或','有','没有','不','了','着','过','为','并','且','以及','该','其','对','关于','根据','如果','则','因此']);
    const cleaned = normalizeText(text).replace(/[^\w\u4e00-\u9fa5]/g, ' ');
    return cleaned.split(/\s+/).filter(w => w && w.length > 1 && !stop.has(w));
}

function jaccard(a, b) {
    const A = new Set(a), B = new Set(b);
    const inter = new Set([...A].filter(x => B.has(x))).size;
    const union = new Set([...A, ...B]).size;
    return union ? inter / union : 0;
}

function rankSimilarity(queryText, candidateText, extraWeight = 0) {
    const kq = extractKeywords(queryText);
    const kc = extractKeywords(candidateText);
    let score = jaccard(kq, kc);
    // 长度接近加分
    const lenDiff = Math.abs(normalizeText(queryText).length - normalizeText(candidateText).length);
    if (lenDiff <= 10) score += 0.1;
    // 额外权重（同分类、tags命中等）
    score += extraWeight;
    return score;
}

async function buildRetrievalContext(question, limit = 5) {
    const catFiles = [
        'c-cpp-algorithm-questions/data-structures/array.json',
        'c-cpp-algorithm-questions/data-structures/linked_list.json',
        'c-cpp-algorithm-questions/algorithms/sorting.json',
        'c-cpp-algorithm-questions/algorithms/graph_algorithms.json',
        'c-cpp-algorithm-questions/data-structures/tree.json',
        'c-cpp-algorithm-questions/algorithms/dynamic_programming.json'
    ];
    const queryText = question.content || question.title || '';
    const items = [];
    
    // 并行加载
    const loads = await Promise.all(catFiles.map(p => loadCategoryJSON(p)));
    for (let i = 0; i < catFiles.length; i++) {
        const data = loads[i];
        if (!data) continue;
        const qs = Array.isArray(data) ? data : (data.questions || []);
        qs.forEach(q => {
            const text = `${q.title || ''} ${q.description || ''} ${(q.solution_outline || '')}`;
            const ex = (q.examples && q.examples[0]) ? `示例: ${q.examples[0].in || ''} -> ${q.examples[0].out || ''}` : '';
            const tags = (q.tags || []).join(',');
            const extraW = tags && queryText && tags.split(',').some(t => queryText.includes(t)) ? 0.05 : 0;
            const score = rankSimilarity(queryText, text + ' ' + ex, extraW);
            if (score > 0.15) {
                items.push({
                    score,
                    snippet: `【相关题】${q.title}（${q.difficulty || ''}）\n题意：${(q.description || '').trim()}\n思路：${(q.solution_outline || '').trim()}\n${ex ? ex : ''}`
                });
            }
        });
    }
    items.sort((a,b) => b.score - a.score);
    return items.slice(0, limit).map(x => x.snippet);
}

function composeQuestionWithContext(question, ctxSnippets) {
    const qText = (question.content || question.title || '').trim();
    const opts = (question.options || []).map((opt, idx) => {
        const letter = opt.displayValue || String.fromCharCode(65 + idx);
        return `${letter}) ${opt.text}`;
    }).join(' ; ');
    const header = `请只从给定选项中选择唯一正确答案，且仅输出选项字母（如 A）。\n题目：${qText}\n选项：${opts}`;
    if (!ctxSnippets || ctxSnippets.length === 0) return header;
    const ctx = ctxSnippets.map((s, i) => `参考${i+1}：${s}`).join('\n');
    return `${header}\n\n参考资料（本地检索）：\n${ctx}\n\n仅输出字母（A/B/C/…），不要输出解释。`;
}

/**
 * Pintia 编程题页面元数据检测（针对“7-1 线性表逆置”等结构）
 * 返回 { success: true, meta: { id, title, type, language, io, examples, raw } }
 */
async function detectProgrammingProblemMeta(sendResponse) {
    try {
        // 1) 标题提取：覆盖更多真实结构
        let title = '';
        const titleCandidates = [
            '.space-y-4 .text-darkest.font-bold.text-lg',
            '.space-y-4 .pc-text-raw',                 // 新增：Pintia 标题文本碎片
            '.problem-title, .exam-title, .question-title',
            'h1, h2, h3'
        ];
        for (const sel of titleCandidates) {
            const el = document.querySelector(sel);
            if (el) {
                const t = (el.textContent || '').trim();
                if (t && t.length > 2) { title = t; break; }
            }
        }
        if (!title) {
            // 兜底：搜索含关键题名关键词
            const anyEl = Array.from(document.querySelectorAll('div,span,p')).find(e => {
                const t = (e.textContent || '').trim();
                return t.includes('线性表逆置') || t.includes('线性表') && t.includes('逆置');
            });
            if (anyEl) title = anyEl.textContent.trim();
        }
        if (!title) title = document.title || '未知编程题';

        // 2) 主体 markdown 容器和可解析根
        const markdownBlock =
            document.querySelector('.markdownBlock_tErSz .rendered-markdown') ||
            document.querySelector('.markdownBlock_tErSz') ||
            document.querySelector('.rendered-markdown');
        const root = markdownBlock || document;

        // 3) 输入/输出说明抽取（更强兜底）
        function extractSectionText(headerText) {
            // 精确找 h3
            const headers = Array.from(root.querySelectorAll('h3')).filter(h =>
                ((h.textContent || '').trim().indexOf(headerText) !== -1)
            );
            if (headers.length > 0) {
                const h = headers[0];
                let buf = [];
                let node = h.nextSibling;
                while (node) {
                    if (node.nodeType === 1 && node.tagName && node.tagName.toLowerCase() === 'h3') break;
                    if (node.nodeType === 1) {
                        const txt = (node.textContent || '').trim();
                        if (txt) buf.push(txt);
                    }
                    node = node.nextSibling;
                }
                if (buf.length) return buf.join('\n').trim();
            }
            // 在所有段落中查找包含关键词的段落，并拼接其后兄弟段落
            const ps = Array.from(root.querySelectorAll('p'));
            const hit = ps.find(p => (p.textContent || '').includes(headerText));
            if (hit) {
                const buf = [(hit.textContent || '').trim()];
                let sib = hit.nextElementSibling;
                while (sib && sib.tagName.toLowerCase() === 'p') {
                    const txt = (sib.textContent || '').trim();
                    if (txt) buf.push(txt);
                    sib = sib.nextElementSibling;
                }
                return buf.join('\n').trim();
            }
            // 全页兜底搜索
            const any = Array.from(document.querySelectorAll('p,div')).find(x =>
                (x.textContent || '').includes(headerText)
            );
            return any ? any.textContent.trim() : '';
        }
        const inputDesc = extractSectionText('输入格式');
        const outputDesc = extractSectionText('输出格式');

        // 4) 样例抽取：基于“输入样例/输出样例”标题与 code/pre 组合
        function findSampleByHeader(hText) {
            const headers = Array.from(root.querySelectorAll('h3')).filter(h =>
                (h.textContent || '').trim().includes(hText)
            );
            if (headers.length) {
                const h = headers[0];
                // 下方首个 code 或 pre
                const nextCode = h.parentElement?.querySelector('code, pre code, pre');
                if (nextCode && nextCode.textContent) return nextCode.textContent.replace(/\r/g, '').trim();
            }
            return '';
        }
        let sampleIn = findSampleByHeader('输入样例');
        let sampleOut = findSampleByHeader('输出样例');

        // 兜底：直接按常见选择器抓取
        function getCodeSample(selectorList) {
            for (const sel of selectorList) {
                const el = root.querySelector(sel);
                if (el && el.textContent) return el.textContent.replace(/\r/g, '').trim();
            }
            return '';
        }
        if (!sampleIn) {
            sampleIn = getCodeSample([
                'pre.pre_Z0SZq code.language-in',
                'code.language-in',
                '.rendered-markdown pre:nth-of-type(1) code',
                'pre code'
            ]);
        }
        if (!sampleOut) {
            sampleOut = getCodeSample([
                'pre.pre_Z0SZq code.language-out',
                'code.language-out',
                '.rendered-markdown pre:nth-of-type(2) code',
                'pre code'
            ]);
        }
        // 最终兜底：扫描所有 code/pre，首个作为输入，第二个作为输出
        if (!sampleIn || !sampleOut) {
            const allCodes = Array.from(root.querySelectorAll('code, pre code, pre')).map(el =>
                (el.textContent || '').replace(/\r/g, '').trim()
            ).filter(t => t);
            if (!sampleIn && allCodes[0]) sampleIn = allCodes[0];
            if (!sampleOut && allCodes[1]) sampleOut = allCodes[1];
        }

        // 5) 构造返回元数据
        const meta = {
            id: (title || 'pintia-programming').replace(/\s+/g, '-'),
            title,
            type: 'programming',
            language: 'C/C++',
            tags: ['Pintia', '编程题'],
            io: { input: inputDesc, output: outputDesc },
            examples: { in: sampleIn, out: sampleOut },
            raw: { url: window.location.href, hasMarkdown: !!markdownBlock }
        };

        // 6) 检测页面中的代码编辑器（如 CodeMirror6 / CodeMirror / 自定义 codeEditor）
        try {
            const editorSelectors = [
                '[data-e2e="code-editor-input"]',
                '.codeEditor_CHvdZ',
                '.codeEditor',
                '.code-editor',
                '.cm-editor',
                '.cm-content[data-language]',
                '.ace_editor',
                '.monaco-editor'
            ];
            let editorEl = null;
            let usedSel = '';
            for (const s of editorSelectors) {
                const el = document.querySelector(s);
                if (el) {
                    editorEl = el;
                    usedSel = s;
                    break;
                }
            }

            if (editorEl) {
                // 尝试获取语言信息：优先从具有 data-language 的 cm-content，再看选择器中的显示值
                let language = '';
                const cmContent = editorEl.querySelector('.cm-content[data-language]') || document.querySelector('.cm-content[data-language]');
                if (cmContent) {
                    language = cmContent.getAttribute('data-language') || '';
                }

                // 另外尝试从页面上的语言选择显示（如 C++ (g++) 等）
                if (!language) {
                    const langDisplay = document.querySelector('.select__single-value .pc-text-raw') || document.querySelector('.select__single-value');
                    if (langDisplay && langDisplay.textContent) {
                        const txt = (langDisplay.textContent || '').trim();
                        // 提取括号前的语言或 C++/Java 等
                        const m = txt.match(/([A-Za-z#+]+\+*\*?\w*)/);
                        if (m) language = m[0];
                        else language = txt;
                    }
                }

                // 尝试获取编辑器内的初始代码文本
                let initialCode = '';
                // CodeMirror6: cm-content 内的文本节点
                if (cmContent && cmContent.textContent && cmContent.textContent.trim()) {
                    initialCode = cmContent.textContent.trim();
                } else {
                    // 查找 textarea 或 contenteditable 区域
                    const ta = editorEl.querySelector('textarea, [contenteditable="true"]');
                    if (ta) initialCode = (ta.value || ta.textContent || '').trim();
                    else {
                        // 兜底：扫描 editorEl 的文本
                        initialCode = (editorEl.textContent || '').trim().slice(0, 2000);
                    }
                }

                meta.editor = {
                    selector: usedSel,
                    language: language || 'unknown',
                    initialCode: initialCode || ''
                };
            }
        } catch (e) {
            console.warn('编辑器检测失败:', e);
        }
        sendResponse({ success: true, meta });
    } catch (e) {
        console.error('detectProgrammingProblemMeta 失败:', e);
        sendResponse({ success: false, error: e.message });
    }
}

// 注入选项样式
injectOptionStyles();

// 兼容入口：提供 initializeWebProblemsHelper 接口，调用现有初始化流程
function initializeWebProblemsHelper() {
    try {
        if (typeof smartInitialize === 'function') {
            smartInitialize();
        }
        if (typeof initHunyuanConfig === 'function') {
            initHunyuanConfig();
        }
        if (typeof initAIService === 'function') {
            initAIService();
        }
    } catch (e) {
        console.warn('initializeWebProblemsHelper 执行出错:', e);
    }
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWebProblemsHelper);
} else {
    initializeWebProblemsHelper();
}

// 导出主要函数供其他脚本使用
window.WebProblemsHelper = {
    detectQuestions,
    autoFillAnswers,
    showAnswers,
    submitAnswers,
    createFloatingToolbar,
    toggleToolbar,
    getCurrentStats
};

console.log('✅ Web 题目助手初始化完成');