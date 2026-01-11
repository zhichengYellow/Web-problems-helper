/**
 * 编程题功能完整集成模块
 * 将所有编程题相关功能整合到PTA助手中
 */

(function() {
    'use strict';
    
    console.log('🔧 开始集成编程题功能...');
    
    // 等待所有依赖加载完成
    function waitForDependencies() {
        return new Promise((resolve) => {
            const checkDependencies = () => {
                const hasDetector = typeof PTAProgrammingProblemDetector !== 'undefined';
                const hasEnhancer = typeof ProgrammingAnswerEnhancer !== 'undefined';
                const hasDatabase = typeof PTA_ANSWER_DATABASE !== 'undefined';
                
                if (hasDetector && hasEnhancer && hasDatabase) {
                    resolve();
                } else {
                    console.log('⏳ 等待编程题依赖加载...', {
                        detector: hasDetector,
                        enhancer: hasEnhancer,
                        database: hasDatabase
                    });
                    setTimeout(checkDependencies, 100);
                }
            };
            checkDependencies();
        });
    }
    
    // 初始化编程题功能
    async function initializeProgrammingFeatures() {
        try {
            await waitForDependencies();
            
            // 创建全局实例
            window.programmingDetector = new PTAProgrammingProblemDetector();
            window.programmingAnswerEnhancer = new ProgrammingAnswerEnhancer();
            
            console.log('✅ 编程题检测器和答案增强器已初始化');
            
            // 增强现有功能
            enhanceExistingFunctions();
            
            // 添加编程题专用功能
            addProgrammingSpecificFeatures();
            
            // 添加快捷键支持
            addKeyboardShortcuts();
            
            console.log('🎉 编程题功能集成完成！');
            
        } catch (error) {
            console.error('❌ 编程题功能初始化失败:', error);
        }
    }
    
    /**
     * 增强现有函数
     */
    function enhanceExistingFunctions() {
        // 1. 增强 detectProgrammingProblemMeta
        const originalDetectProgrammingProblemMeta = window.detectProgrammingProblemMeta;
        
        window.detectProgrammingProblemMeta = async function(sendResponse) {
            try {
                console.log('🔍 使用增强的编程题检测功能...');
                
                const result = await window.programmingDetector.detectProgrammingProblem();
                
                if (result.success) {
                    const compatibleResult = {
                        success: true,
                        meta: {
                            id: result.metadata.id,
                            title: result.metadata.title,
                            type: result.metadata.type,
                            language: result.metadata.language,
                            difficulty: result.metadata.difficulty,
                            score: result.metadata.score,
                            author: result.metadata.author,
                            organization: result.metadata.organization,
                            tags: result.metadata.tags,
                            io: {
                                input: result.ioFormats?.input || '',
                                output: result.ioFormats?.output || ''
                            },
                            examples: {
                                in: result.examples?.input || '',
                                out: result.examples?.output || ''
                            },
                            constraints: result.constraints || {},
                            description: result.description || '',
                            hints: result.hints || [],
                            relatedTopics: result.relatedTopics || [],
                            codeTemplate: result.codeTemplate || '',
                            detectionMethod: result.detectionMethod,
                            confidence: result.confidence,
                            raw: {
                                url: window.location.href,
                                timestamp: Date.now(),
                                hasMarkdown: !!document.querySelector('.markdownBlock_tErSz')
                            }
                        }
                    };
                    
                    console.log('✅ 增强编程题检测成功:', compatibleResult.meta.title);
                    sendResponse(compatibleResult);
                } else {
                    console.log('⚠️ 增强检测失败，回退到原有方法...');
                    if (originalDetectProgrammingProblemMeta) {
                        await originalDetectProgrammingProblemMeta(sendResponse);
                    } else {
                        sendResponse({
                            success: false,
                            error: result.error || '编程题检测失败'
                        });
                    }
                }
                
            } catch (error) {
                console.error('❌ 增强编程题检测失败:', error);
                if (originalDetectProgrammingProblemMeta) {
                    await originalDetectProgrammingProblemMeta(sendResponse);
                } else {
                    sendResponse({
                        success: false,
                        error: error.message
                    });
                }
            }
        };
        
        // 2. 增强 parseQuestion 函数
        const originalParseQuestion = window.parseQuestion;
        
        window.parseQuestion = function(element, index) {
            try {
                // 首先尝试原有的解析方法
                const originalResult = originalParseQuestion ? originalParseQuestion(element, index) : null;
                
                // 如果原有方法成功且不是编程题，直接返回
                if (originalResult && originalResult.type !== 'programming' && originalResult.type !== 'unknown') {
                    return originalResult;
                }
                
                // 检查是否为编程题容器
                if (isProgrammingQuestionElement(element)) {
                    console.log(`🔍 检测到编程题容器，使用专业解析 (第${index + 1}题)`);
                    return parseProgrammingQuestion(element, index);
                }
                
                return originalResult;
                
            } catch (error) {
                console.error(`解析题目失败 (第${index + 1}题):`, error);
                return null;
            }
        };
        
        // 3. 增强 fillQuestionAnswer 函数
        const originalFillQuestionAnswer = window.fillQuestionAnswer;
        
        window.fillQuestionAnswer = async function(question, answer) {
            try {
                // 如果是编程题，使用专门的填充方法
                if (question.type === 'programming') {
                    return await fillProgrammingQuestionAnswer(question, answer);
                }
                
                // 否则使用原有方法
                if (originalFillQuestionAnswer) {
                    return await originalFillQuestionAnswer(question, answer);
                }
                
                return false;
                
            } catch (error) {
                console.error('填充答案失败:', error);
                return false;
            }
        };
        
        // 4. 增强答案搜索功能
        const originalGetAnswerFromDatabase = window.getAnswerFromDatabase;
        
        window.getAnswerFromDatabase = async function(questionText, questionType = null, questionMeta = null) {
            try {
                // 如果是编程题，使用增强搜索
                if (questionType === 'programming' || 
                    (questionMeta && questionMeta.type === 'programming') ||
                    isProgrammingQuestion(questionText)) {
                    
                    console.log('🔍 使用编程题增强搜索...');
                    const enhancedResult = await window.programmingAnswerEnhancer.enhanceAnswerSearch(
                        questionText, 
                        questionMeta
                    );
                    
                    if (enhancedResult.success) {
                        return {
                            hasAnswer: true,
                            answer: enhancedResult.answer,
                            type: 'programming',
                            method: enhancedResult.method,
                            confidence: enhancedResult.confidence,
                            source: 'enhanced_programming_search'
                        };
                    }
                }
                
                // 回退到原有搜索方法
                if (originalGetAnswerFromDatabase) {
                    return await originalGetAnswerFromDatabase(questionText, questionType, questionMeta);
                }
                
                return { hasAnswer: false };
                
            } catch (error) {
                console.error('答案搜索失败:', error);
                return { hasAnswer: false };
            }
        };
        
        console.log('✅ 现有函数增强完成');
    }
    
    /**
     * 添加编程题专用功能
     */
    function addProgrammingSpecificFeatures() {
        // 添加编程题工具栏按钮
        addProgrammingToolbarButtons();
        
        // 添加编程题高亮功能
        addProgrammingHighlight();
        
        // 添加代码模板功能
        addCodeTemplateFeature();
        
        console.log('✅ 编程题专用功能添加完成');
    }
    
    /**
     * 添加编程题工具栏按钮
     */
    function addProgrammingToolbarButtons() {
        // 等待工具栏加载
        const addButtons = () => {
            const toolbar = document.querySelector('.pta-helper-toolbar');
            if (!toolbar) {
                setTimeout(addButtons, 1000);
                return;
            }
            
            const buttonsContainer = toolbar.querySelector('.pta-helper-buttons');
            if (!buttonsContainer) {
                setTimeout(addButtons, 1000);
                return;
            }
            
            // 检查是否已添加
            if (buttonsContainer.querySelector('.prog-detect-btn')) {
                return;
            }
            
            // 添加编程题检测按钮
            const progDetectBtn = document.createElement('button');
            progDetectBtn.className = 'pta-helper-btn secondary prog-detect-btn';
            progDetectBtn.innerHTML = '🔍 检测编程题';
            progDetectBtn.title = '快捷键: Ctrl+Shift+P';
            progDetectBtn.addEventListener('click', handleProgrammingDetection);
            
            // 添加代码模板按钮
            const templateBtn = document.createElement('button');
            templateBtn.className = 'pta-helper-btn secondary template-btn';
            templateBtn.innerHTML = '📝 插入答案';
            templateBtn.title = '快捷键: Ctrl+Shift+T';
            templateBtn.addEventListener('click', handleInsertTemplate);
            
            // 添加答案搜索按钮
            const searchBtn = document.createElement('button');
            searchBtn.className = 'pta-helper-btn secondary search-btn';
            searchBtn.innerHTML = '🔎 搜索答案';
            searchBtn.title = '快捷键: Ctrl+Shift+S';
            searchBtn.addEventListener('click', handleSearchProgrammingAnswer);
            
            buttonsContainer.appendChild(progDetectBtn);
            buttonsContainer.appendChild(templateBtn);
            buttonsContainer.appendChild(searchBtn);
            
            console.log('✅ 编程题工具栏按钮已添加');
        };
        
        // 延迟添加，确保工具栏已加载
        setTimeout(addButtons, 2000);
    }
    
    /**
     * 添加编程题高亮功能
     */
    function addProgrammingHighlight() {
        const highlightProgrammingQuestions = () => {
            const questionElements = document.querySelectorAll('.markdownBlock_tErSz, .question-container, .problem-container');
            
            questionElements.forEach((element, index) => {
                if (isProgrammingQuestionElement(element) && !element.classList.contains('pta-helper-programming-highlight')) {
                    element.classList.add('pta-helper-programming-highlight');
                    
                    // 检测代码编辑器
                    const hasCodeEditor = element.querySelector('textarea, .ace_editor, .CodeMirror');
                    if (hasCodeEditor) {
                        element.classList.add('pta-helper-code-editor-detected');
                    }
                }
            });
        };
        
        // 初始高亮
        setTimeout(highlightProgrammingQuestions, 1000);
        
        // 监听DOM变化
        const observer = new MutationObserver(() => {
            highlightProgrammingQuestions();
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    /**
     * 添加代码模板功能
     */
    function addCodeTemplateFeature() {
        // 在代码编辑器上添加右键菜单
        document.addEventListener('contextmenu', (e) => {
            const target = e.target;
            const isCodeEditor = target.tagName === 'TEXTAREA' || 
                                target.closest('.ace_editor') || 
                                target.closest('.CodeMirror');
            
            if (isCodeEditor) {
                e.preventDefault();
                showCodeTemplateMenu(e.pageX, e.pageY, target);
            }
        });
    }
    
    /**
     * 添加快捷键支持
     */
    function addKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+P: 检测编程题
            if (e.ctrlKey && e.shiftKey && e.key === 'P') {
                e.preventDefault();
                handleProgrammingDetection();
            }
            
            // Ctrl+Shift+T: 插入模板
            if (e.ctrlKey && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                handleInsertTemplate();
            }
            
            // Ctrl+Shift+S: 搜索答案
            if (e.ctrlKey && e.shiftKey && e.key === 'S') {
                e.preventDefault();
                handleSearchProgrammingAnswer();
            }
            
            // Ctrl+Shift+H: 高亮编程题
            if (e.ctrlKey && e.shiftKey && e.key === 'H') {
                e.preventDefault();
                toggleProgrammingHighlight();
            }
        });
        
        console.log('✅ 编程题快捷键已添加');
    }
    
    // ==================== 辅助函数 ====================
    
    /**
     * 判断元素是否为编程题容器
     */
    function isProgrammingQuestionElement(element) {
        const hasMarkdown = element.querySelector('.markdownBlock_tErSz') !== null;
        const hasCodeBlocks = element.querySelectorAll('pre, code').length >= 2;
        const hasProblemInfo = element.querySelector('.problemInfo_tfBoz') !== null;
        
        const text = element.textContent.toLowerCase();
        const programmingKeywords = ['算法', '编程', '实现', '栈', '队列', '输入格式', '输出格式', 'include', 'main', 'printf', 'scanf'];
        const hasKeywords = programmingKeywords.some(keyword => text.includes(keyword));
        
        return hasMarkdown || hasCodeBlocks || hasProblemInfo || hasKeywords;
    }
    
    /**
     * 判断题目文本是否为编程题
     */
    function isProgrammingQuestion(questionText) {
        const text = questionText.toLowerCase();
        const programmingIndicators = [
            '编程', '代码', '程序', '算法', '实现', '函数',
            '输入格式', '输出格式', '样例输入', '样例输出',
            'include', 'main', 'printf', 'scanf', 'return'
        ];
        
        return programmingIndicators.some(indicator => text.includes(indicator));
    }
    
    /**
     * 解析编程题
     */
    function parseProgrammingQuestion(element, index) {
        try {
            const title = extractProgrammingTitle(element, index);
            const description = extractProgrammingDescription(element);
            const examples = extractProgrammingExamples(element);
            
            return {
                index: index,
                title: title,
                type: 'programming',
                element: element,
                options: [],
                inputs: [],
                content: description,
                fullText: element.textContent.trim(),
                programmingMeta: {
                    examples: examples,
                    hasCodeEditor: element.querySelector('.ace_editor, .CodeMirror, textarea') !== null,
                    hasTextarea: element.querySelector('textarea') !== null
                }
            };
            
        } catch (error) {
            console.error('解析编程题失败:', error);
            return null;
        }
    }
    
    /**
     * 提取编程题标题
     */
    function extractProgrammingTitle(element, index) {
        const titleSelectors = [
            '.text-darkest.font-bold.text-lg',
            '.problem-title',
            'h1', 'h2', 'h3'
        ];
        
        for (const selector of titleSelectors) {
            const titleElement = element.querySelector(selector) || document.querySelector(selector);
            if (titleElement) {
                const title = titleElement.textContent.trim();
                if (title.length > 3) {
                    return title;
                }
            }
        }
        
        return `编程题 ${index + 1}`;
    }
    
    /**
     * 提取编程题描述
     */
    function extractProgrammingDescription(element) {
        const descSelectors = [
            '.markdownBlock_tErSz p:first-child',
            '.rendered-markdown p:first-child',
            'p'
        ];
        
        for (const selector of descSelectors) {
            const descElement = element.querySelector(selector);
            if (descElement && descElement.textContent.trim().length > 10) {
                return descElement.textContent.trim();
            }
        }
        
        return '';
    }
    
    /**
     * 提取编程题样例
     */
    function extractProgrammingExamples(element) {
        const examples = { input: '', output: '' };
        
        const inputCode = element.querySelector('code.language-in') || 
                         element.querySelector('pre code');
        if (inputCode) {
            examples.input = inputCode.textContent.trim();
        }
        
        const outputCode = element.querySelector('code.language-out') || 
                          Array.from(element.querySelectorAll('pre code'))[1];
        if (outputCode) {
            examples.output = outputCode.textContent.trim();
        }
        
        return examples;
    }
    
    /**
     * 填充编程题答案（增强版）
     */
    async function fillProgrammingQuestionAnswer(question, code) {
        try {
            console.log('💻 填充编程题答案...');
            
            // 优先使用PTA专用CodeMirror填充器
            if (typeof window.ptaCodeMirrorFiller !== 'undefined') {
                console.log('🎯 使用PTA专用CodeMirror填充器...');
                
                const result = await window.ptaCodeMirrorFiller.fillCode(code, {
                    autoSave: true,
                    setCursor: true,
                    cursorPosition: 'end'
                });
                
                if (result.success) {
                    console.log('✅ PTA专用填充成功');
                    return true;
                }
                
                console.log('⚠️ PTA专用填充失败，尝试传统方法...');
            }
            
            const element = question.element;
            
            // 1. 尝试填充CodeMirror 6 (PTA新版编辑器)
            const cm6Editor = document.querySelector('.cm-editor');
            if (cm6Editor) {
                try {
                    // 方法1: 通过视图API
                    if (cm6Editor.view && cm6Editor.view.dispatch) {
                        const view = cm6Editor.view;
                        const transaction = view.state.update({
                            changes: {
                                from: 0,
                                to: view.state.doc.length,
                                insert: code
                            }
                        });
                        view.dispatch(transaction);
                        console.log('✅ 已填充到CodeMirror 6 (视图API)');
                        return true;
                    }
                    
                    // 方法2: 通过内容区域
                    const contentElement = cm6Editor.querySelector('.cm-content');
                    if (contentElement && contentElement.isContentEditable) {
                        contentElement.focus();
                        contentElement.innerHTML = '';
                        
                        const lines = code.split('\n');
                        lines.forEach((line, index) => {
                            const lineDiv = document.createElement('div');
                            lineDiv.className = index === 0 ? 'cm-activeLine cm-line' : 'cm-line';
                            lineDiv.textContent = line || '';
                            if (line === '') {
                                lineDiv.appendChild(document.createElement('br'));
                            }
                            contentElement.appendChild(lineDiv);
                        });
                        
                        // 触发事件
                        contentElement.dispatchEvent(new Event('input', { bubbles: true }));
                        contentElement.dispatchEvent(new Event('change', { bubbles: true }));
                        
                        console.log('✅ 已填充到CodeMirror 6 (内容操作)');
                        return true;
                    }
                } catch (cm6Error) {
                    console.warn('CodeMirror 6填充失败:', cm6Error);
                }
            }
            
            // 2. 尝试填充textarea
            const textarea = element.querySelector('textarea') || document.querySelector('textarea');
            if (textarea) {
                textarea.value = code;
                textarea.focus();
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
                textarea.dispatchEvent(new Event('change', { bubbles: true }));
                console.log('✅ 已填充到textarea');
                return true;
            }
            
            // 3. 尝试填充ACE编辑器
            const aceEditor = element.querySelector('.ace_editor') || document.querySelector('.ace_editor');
            if (aceEditor && window.ace) {
                try {
                    const editor = window.ace.edit(aceEditor);
                    editor.setValue(code);
                    editor.clearSelection();
                    console.log('✅ 已填充到ACE编辑器');
                    return true;
                } catch (aceError) {
                    console.warn('ACE编辑器填充失败:', aceError);
                }
            }
            
            // 4. 尝试填充CodeMirror 5
            const codeMirror = element.querySelector('.CodeMirror') || document.querySelector('.CodeMirror');
            if (codeMirror && codeMirror.CodeMirror) {
                try {
                    codeMirror.CodeMirror.setValue(code);
                    console.log('✅ 已填充到CodeMirror 5');
                    return true;
                } catch (cmError) {
                    console.warn('CodeMirror 5填充失败:', cmError);
                }
            }
            
            // 5. 尝试填充ContentEditable元素
            const contentEditables = document.querySelectorAll('[contenteditable="true"]');
            for (const editable of contentEditables) {
                try {
                    const isInAnswerArea = editable.closest('.answerInput_g2YSk') ||
                                         editable.closest('.CodingProblemAnswerForm_Qp8cD') ||
                                         editable.classList.contains('cm-content');
                    
                    if (isInAnswerArea) {
                        editable.focus();
                        editable.innerHTML = '';
                        
                        const lines = code.split('\n');
                        lines.forEach((line, index) => {
                            const lineDiv = document.createElement('div');
                            lineDiv.textContent = line || '';
                            if (line === '') {
                                lineDiv.appendChild(document.createElement('br'));
                            }
                            editable.appendChild(lineDiv);
                        });
                        
                        editable.dispatchEvent(new Event('input', { bubbles: true }));
                        editable.dispatchEvent(new Event('change', { bubbles: true }));
                        
                        console.log('✅ 已填充到ContentEditable');
                        return true;
                    }
                } catch (editableError) {
                    console.warn('ContentEditable填充失败:', editableError);
                    continue;
                }
            }
            
            console.warn('❌ 未找到可填充的代码编辑器');
            return false;
            
        } catch (error) {
            console.error('填充编程题答案失败:', error);
            return false;
        }
    }
    
    // ==================== 事件处理函数 ====================
    
    /**
     * 处理编程题检测
     */
    async function handleProgrammingDetection() {
        try {
            console.log('🔍 开始编程题专业检测...');
            
            const result = await window.programmingDetector.detectProgrammingProblem();
            
            if (result.success) {
                showProgrammingDetectionResult(result);
                showNotification('检测成功', `成功检测编程题: ${result.metadata.title}`, 'success');
            } else {
                showNotification('检测失败', result.error || '未检测到编程题', 'error');
            }
            
        } catch (error) {
            console.error('编程题检测失败:', error);
            showNotification('检测失败', error.message, 'error');
        }
    }
    
    /**
     * 处理插入代码模板 -> 升级为智能插入答案
     */
    async function handleInsertTemplate() {
        try {
            console.log('📝 开始智能获取并插入答案...');
            
            let codeToInsert = '';
            let detectionResult = null;

            // 1. 优先检查是否有缓存的答案（来自"搜索答案"功能）
            if (window.ptaLastProgrammingAnswer) {
                console.log('✅ 检测到已有搜索结果，直接使用缓存答案');
                codeToInsert = window.ptaLastProgrammingAnswer;
                showNotification('准备插入', '正在插入上次搜索到的答案...', 'info');
            } else {
                // 2. 没有缓存，执行完整的检测和搜索流程
                detectionResult = await window.programmingDetector.detectProgrammingProblem();
                
                if (!detectionResult.success) {
                     showNotification('检测失败', detectionResult.error || '无法检测到编程题', 'error');
                     return;
                }
    
                showNotification('正在搜索', '正在智能搜索最佳答案...', 'info');
    
                // 2.1 尝试增强搜索
                let searchResult = await window.programmingAnswerEnhancer.enhanceAnswerSearch(
                    detectionResult.metadata.title,
                    detectionResult.metadata
                );
    
                // 2.2 AI 搜索兜底
                const isLowConfidence = !searchResult.success || 
                                       searchResult.method === 'template_generation' || 
                                       searchResult.method === 'keyword_match' ||
                                       searchResult.method === 'pattern_match';
                
                if (isLowConfidence && 
                    typeof window.hunyuanService !== 'undefined' && 
                    window.hunyuanService.isConfigured()) {
                    
                    console.log('🤖 调用AI生成答案...');
                    try {
                        const prompt = `编程题：${detectionResult.metadata.title}\n\n` +
                                     `描述：${detectionResult.metadata.description || ''}\n\n` +
                                     `输入格式：${detectionResult.metadata.io?.input || ''}\n\n` +
                                     `输出格式：${detectionResult.metadata.io?.output || ''}\n\n` +
                                     `请直接给出完整的C语言代码实现，不要包含Markdown标记。`;
                        
                        const aiAnswer = await window.hunyuanService.searchAnswer(
                            prompt,
                            'programming',
                            []
                        );
                        
                        if (aiAnswer) {
                            searchResult = {
                                success: true,
                                answer: aiAnswer,
                                method: 'hunyuan_ai',
                                confidence: 0.95
                            };
                        }
                    } catch (e) {
                        console.warn('AI生成失败:', e);
                    }
                }
    
                if (searchResult.success && searchResult.answer) {
                    codeToInsert = searchResult.answer;
                    window.ptaLastProgrammingAnswer = codeToInsert; // 缓存新找到的答案
                    console.log('✅ 找到答案，准备插入');
                } else if (detectionResult.codeTemplate) {
                    codeToInsert = detectionResult.codeTemplate;
                    console.log('⚠️ 未找到精确答案，使用模板兜底');
                    showNotification('未找到答案', '已使用基础模板兜底', 'warning');
                } else {
                    showNotification('失败', '无法生成答案或模板', 'error');
                    return;
                }
            }

            // 清理代码（移除markdown标记等）
            codeToInsert = codeToInsert.replace(/```c\s*/g, '').replace(/```\s*/g, '').trim();

            // 尝试直接插入
            let inserted = false;
            
            // 1. 使用 PTA 专用填充器
            if (typeof window.ptaCodeMirrorFiller !== 'undefined') {
                const res = await window.ptaCodeMirrorFiller.fillCode(codeToInsert, { autoSave: true });
                if (res && res.success) inserted = true;
            }
            
            // 2. 使用通用填充函数
            if (!inserted && typeof window.fillProgrammingQuestionAnswer === 'function') {
                inserted = await window.fillProgrammingQuestionAnswer({ element: document }, codeToInsert);
            }
            
            // 3. 兜底逻辑 (直接操作 DOM)
            if (!inserted) {
                const ta = document.querySelector('textarea');
                if (ta) {
                    ta.value = codeToInsert;
                    ta.dispatchEvent(new Event('input', { bubbles: true }));
                    inserted = true;
                }
            }

            if (inserted) {
                showNotification('插入成功', '答案已插入编辑器', 'success');
            } else {
                // 如果自动插入失败，回退到显示结果弹窗（让用户手动复制）
                showNotification('自动插入失败', '无法自动写入编辑器，请手动复制', 'warning');
                // 构造一个临时的 searchResult 用于显示
                const tempResult = {
                    success: true,
                    answer: codeToInsert,
                    method: 'cached_or_generated',
                    confidence: 1.0
                };
                // 如果没有detectionResult（因为走了缓存），需要重新检测一下以获取metadata用于显示
                if (!detectionResult) {
                    detectionResult = await window.programmingDetector.detectProgrammingProblem();
                }
                showProgrammingAnswerResult(tempResult, detectionResult);
            }
            
        } catch (error) {
            console.error('插入答案失败:', error);
            showNotification('插入失败', error.message, 'error');
        }
    }
    
    /**
     * 处理搜索编程题答案
     */
    async function handleSearchProgrammingAnswer() {
        try {
            console.log('🔎 开始搜索编程题答案...');
            
            // 检测当前编程题
            const detectionResult = await window.programmingDetector.detectProgrammingProblem();
            
            if (!detectionResult.success) {
                showNotification('搜索失败', '未检测到编程题', 'error');
                return;
            }
            
            // 1. 尝试使用增强搜索 (本地/模式匹配)
            let searchResult = await window.programmingAnswerEnhancer.enhanceAnswerSearch(
                detectionResult.metadata.title,
                detectionResult.metadata
            );
            
            // 2. 智能决策：是否需要调用AI API
            // 如果本地搜索失败，或者只是基于关键词/模板生成的（置信度较低），则尝试使用AI
            // exact_match 通常意味着在题库中找到了原题，置信度最高，不需要AI
            const isLowConfidence = !searchResult.success || 
                                   searchResult.method === 'template_generation' || 
                                   searchResult.method === 'keyword_match' ||
                                   searchResult.method === 'pattern_match'; // 即使是模式匹配，AI通常也能给出更好的具体代码
            
            if (isLowConfidence && 
                typeof window.hunyuanService !== 'undefined' && 
                window.hunyuanService.isConfigured()) {
                
                console.log('🤖 本地结果置信度不足，正在调用混元AI进行深度分析...');
                try {
                    // 构建更完整的提示词，包含题目类型提示
                    const prompt = `编程题：${detectionResult.metadata.title}\n\n` +
                                 `描述：${detectionResult.metadata.description || ''}\n\n` +
                                 `输入格式：${detectionResult.metadata.io?.input || ''}\n\n` +
                                 `输出格式：${detectionResult.metadata.io?.output || ''}\n\n` +
                                 `请根据上述信息，判断题目类型（如数据结构、算法类型），并给出完整的C语言代码实现。`;
                    
                    const aiAnswer = await window.hunyuanService.searchAnswer(
                        prompt,
                        'programming',
                        []
                    );
                    
                    if (aiAnswer) {
                        searchResult = {
                            success: true,
                            answer: aiAnswer,
                            method: 'hunyuan_ai',
                            confidence: 0.95, // AI生成的针对性代码置信度更高
                            source: 'ai_generation'
                        };
                    }
                } catch (e) {
                    console.warn('混元AI搜索失败，将使用本地结果:', e);
                }
            }
            
            if (searchResult.success) {
                // 缓存答案，供"插入答案"功能直接使用
                window.ptaLastProgrammingAnswer = searchResult.answer;

                // 核心需求：在控制台打印答案
                console.log('%c🔍 找到的编程题答案:', 'color: #2196F3; font-size: 14px; font-weight: bold;');
                console.log('%c' + searchResult.answer, 'color: #4CAF50; font-family: monospace; white-space: pre-wrap;');
                
                // 显示答案并询问是否填充
                showProgrammingAnswerResult(searchResult, detectionResult);
            } else {
                showNotification('未找到答案', '未找到匹配的编程题答案', 'warning');
            }
            
        } catch (error) {
            console.error('搜索编程题答案失败:', error);
            showNotification('搜索失败', error.message, 'error');
        }
    }
    
    /**
     * 切换编程题高亮
     */
    function toggleProgrammingHighlight() {
        const highlightedElements = document.querySelectorAll('.pta-helper-programming-highlight');
        
        if (highlightedElements.length > 0) {
            highlightedElements.forEach(el => {
                el.classList.remove('pta-helper-programming-highlight');
                el.classList.remove('pta-helper-code-editor-detected');
            });
            showNotification('高亮已关闭', '编程题高亮已关闭', 'info');
        } else {
            const questionElements = document.querySelectorAll('.markdownBlock_tErSz, .question-container, .problem-container');
            let count = 0;
            
            questionElements.forEach(element => {
                if (isProgrammingQuestionElement(element)) {
                    element.classList.add('pta-helper-programming-highlight');
                    
                    const hasCodeEditor = element.querySelector('textarea, .ace_editor, .CodeMirror');
                    if (hasCodeEditor) {
                        element.classList.add('pta-helper-code-editor-detected');
                    }
                    count++;
                }
            });
            
            showNotification('高亮已开启', `已高亮 ${count} 个编程题`, 'success');
        }
    }
    
    // ==================== UI 显示函数 ====================
    
    /**
     * 显示编程题检测结果
     */
    function showProgrammingDetectionResult(result) {
        // 这里可以复用之前创建的模态框代码
        if (typeof window.showProgrammingDetectionResult === 'function') {
            window.showProgrammingDetectionResult(result);
        } else {
            // 简化版显示
            console.log('编程题检测结果:', result);
            alert(`检测成功！\n标题: ${result.metadata.title}\n类型: ${result.metadata.type}\n置信度: ${(result.confidence * 100).toFixed(1)}%`);
        }
    }
    
    /**
     * 显示编程题答案结果
     */
    function showProgrammingAnswerResult(searchResult, detectionResult) {
        const modal = document.createElement('div');
        modal.className = 'pta-helper-programming-answer-modal';
        
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>🔎 编程题答案</h3>
                    <button class="close-btn">✕</button>
                </div>
                <div class="modal-body">
                    <div class="answer-info">
                        <p><strong>题目:</strong> ${detectionResult.metadata.title}</p>
                        <p><strong>匹配方法:</strong> ${searchResult.method}</p>
                        <p><strong>置信度:</strong> ${(searchResult.confidence * 100).toFixed(1)}%</p>
                    </div>
                    <div class="answer-code">
                        <h4>代码答案:</h4>
                        <pre><code>${searchResult.answer}</code></pre>
                    </div>
                    <div class="answer-actions">
                        <button class="fill-answer-btn">🔄 填充到编辑器</button>
                        <button class="copy-answer-btn">📋 复制答案</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 添加事件监听
        const closeBtn = modal.querySelector('.close-btn');
        const overlay = modal.querySelector('.modal-overlay');
        const fillBtn = modal.querySelector('.fill-answer-btn');
        const copyBtn = modal.querySelector('.copy-answer-btn');
        
        const closeModal = () => modal.remove();
        
        closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', closeModal);
        
        fillBtn.addEventListener('click', async () => {
            const textarea = document.querySelector('textarea');
            if (textarea) {
                textarea.value = searchResult.answer;
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
                showNotification('填充成功', '答案已填充到编辑器', 'success');
                closeModal();
            } else {
                showNotification('填充失败', '未找到代码编辑器', 'error');
            }
        });
        
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(searchResult.answer).then(() => {
                showNotification('复制成功', '答案已复制到剪贴板', 'success');
            });
        });
        
        // 显示动画
        setTimeout(() => modal.classList.add('show'), 100);
    }
    
    /**
     * 显示代码模板菜单
     */
    function showCodeTemplateMenu(x, y, target) {
        // 移除已存在的菜单
        const existingMenu = document.querySelector('.pta-code-template-menu');
        if (existingMenu) {
            existingMenu.remove();
        }
        
        const menu = document.createElement('div');
        menu.className = 'pta-code-template-menu';
        menu.style.cssText = `
            position: fixed;
            top: ${y}px;
            left: ${x}px;
            background: white;
            border: 1px solid #ccc;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 10000;
            min-width: 150px;
        `;
        
        const templates = [
            { name: '基础模板', key: 'basic' },
            { name: '栈操作', key: 'stack' },
            { name: '队列操作', key: 'queue' },
            { name: '链表操作', key: 'linkedList' },
            { name: '排序算法', key: 'sorting' }
        ];
        
        templates.forEach(template => {
            const item = document.createElement('div');
            item.className = 'menu-item';
            item.textContent = template.name;
            item.style.cssText = `
                padding: 8px 12px;
                cursor: pointer;
                border-bottom: 1px solid #eee;
            `;
            
            item.addEventListener('click', () => {
                insertTemplate(target, template.key);
                menu.remove();
            });
            
            item.addEventListener('mouseenter', () => {
                item.style.backgroundColor = '#f0f0f0';
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.backgroundColor = 'white';
            });
            
            menu.appendChild(item);
        });
        
        document.body.appendChild(menu);
        
        // 点击其他地方关闭菜单
        setTimeout(() => {
            document.addEventListener('click', function closeMenu() {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            });
        }, 100);
    }
    
    /**
     * 插入模板到编辑器
     */
    function insertTemplate(target, templateKey) {
        const templates = {
            basic: window.programmingAnswerEnhancer.getDefaultTemplate(),
            stack: window.programmingAnswerEnhancer.getStackTemplate(),
            queue: window.programmingAnswerEnhancer.getQueueTemplate(),
            linkedList: window.programmingAnswerEnhancer.getLinkedListTemplate(),
            sorting: window.programmingAnswerEnhancer.getBubbleSortTemplate()
        };
        
        const template = templates[templateKey];
        if (template && target) {
            if (target.tagName === 'TEXTAREA') {
                target.value = template;
                target.dispatchEvent(new Event('input', { bubbles: true }));
            }
            showNotification('模板插入成功', `${templateKey} 模板已插入`, 'success');
        }
    }
    
    /**
     * 显示通知
     */
    function showNotification(title, message, type = 'info') {
        // 简化版通知，可以后续完善
        console.log(`${type.toUpperCase()}: ${title} - ${message}`);
        
        // 如果存在现有的通知系统，使用它
        if (typeof window.showNotification === 'function') {
            window.showNotification(title, message, type);
        } else {
            // 创建简单的通知
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
                color: white;
                padding: 12px 20px;
                border-radius: 4px;
                z-index: 10001;
                max-width: 300px;
            `;
            notification.innerHTML = `<strong>${title}</strong><br>${message}`;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 3000);
        }
    }
    
    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeProgrammingFeatures);
    } else {
        initializeProgrammingFeatures();
    }
    
})();