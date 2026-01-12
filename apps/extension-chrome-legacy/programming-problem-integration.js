/**
 * 编程题检测功能集成模块
 * 将专业的编程题检测器集成到现有的 Web 题目助手 中
 */

// 扩展现有的content.js功能
(function() {
    'use strict';
    
    // 确保编程题检测器已加载
    if (typeof PintiaProgrammingProblemDetector === 'undefined') {
        console.warn('编程题检测器未加载，请先加载 programming-problem-detector.js');
        return;
    }
    
    // 创建全局检测器实例
    window.programmingDetector = new PintiaProgrammingProblemDetector();
    
    /**
     * 增强现有的detectProgrammingProblemMeta函数
     */
    const originalDetectProgrammingProblemMeta = window.detectProgrammingProblemMeta;
    
    window.detectProgrammingProblemMeta = async function(sendResponse) {
        try {
            console.log('🔍 使用增强的编程题检测功能...');
            
            // 使用专业检测器
            const result = await window.programmingDetector.detectProgrammingProblem();
            
            if (result.success) {
                // 转换为原有格式，保持兼容性
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
                        
                        // IO格式信息
                        io: {
                            input: result.ioFormats?.input || '',
                            output: result.ioFormats?.output || ''
                        },
                        
                        // 样例数据
                        examples: {
                            in: result.examples?.input || '',
                            out: result.examples?.output || ''
                        },
                        
                        // 约束条件
                        constraints: result.constraints || {},
                        
                        // 题目描述
                        description: result.description || '',
                        
                        // 增强信息
                        hints: result.hints || [],
                        relatedTopics: result.relatedTopics || [],
                        codeTemplate: result.codeTemplate || '',
                        
                        // 检测元信息
                        detectionMethod: result.detectionMethod,
                        confidence: result.confidence,
                        
                        // 原始数据
                        raw: {
                            url: window.location.href,
                            timestamp: Date.now(),
                            hasMarkdown: !!document.querySelector('.markdownBlock_tErSz')
                        }
                    }
                };
                
                console.log('✅ 编程题检测成功:', compatibleResult.meta.title);
                sendResponse(compatibleResult);
            } else {
                // 回退到原有方法
                console.log('⚠️ 专业检测失败，回退到原有方法...');
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
            
            // 回退到原有方法
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
    
    /**
     * 增强题目检测功能，支持编程题
     */
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
            
            // 返回原有结果或null
            return originalResult;
            
        } catch (error) {
            console.error(`解析题目失败 (第${index + 1}题):`, error);
            return null;
        }
    };
    
    /**
     * 判断元素是否为编程题容器
     */
    function isProgrammingQuestionElement(element) {
        // 检查是否包含编程题特征
        const hasMarkdown = element.querySelector('.markdownBlock_tErSz') !== null;
        const hasCodeBlocks = element.querySelectorAll('pre, code').length >= 2;
        const hasProblemInfo = element.querySelector('.problemInfo_tfBoz') !== null;
        
        // 检查文本内容
        const text = element.textContent.toLowerCase();
        const programmingKeywords = ['算法', '编程', '实现', '栈', '队列', '输入格式', '输出格式'];
        const hasKeywords = programmingKeywords.some(keyword => text.includes(keyword));
        
        return hasMarkdown || hasCodeBlocks || hasProblemInfo || hasKeywords;
    }
    
    /**
     * 解析编程题
     */
    function parseProgrammingQuestion(element, index) {
        try {
            // 使用专业检测器解析
            const detector = new PintiaProgrammingProblemDetector();
            
            // 临时设置检测范围为当前元素
            const originalDocument = document;
            const mockDocument = {
                querySelector: (selector) => element.querySelector(selector) || originalDocument.querySelector(selector),
                querySelectorAll: (selector) => {
                    const elementResults = Array.from(element.querySelectorAll(selector));
                    const documentResults = Array.from(originalDocument.querySelectorAll(selector));
                    return elementResults.length > 0 ? elementResults : documentResults;
                }
            };
            
            // 临时替换document对象进行检测
            const tempDocument = document;
            Object.defineProperty(window, 'document', { value: mockDocument, configurable: true });
            
            // 执行检测
            detector.detectByMarkdownStructure().then(result => {
                // 恢复document对象
                Object.defineProperty(window, 'document', { value: tempDocument, configurable: true });
                
                if (result.score > 0.3) {
                    return createProgrammingQuestionObject(result, element, index);
                }
                return null;
            });
            
            // 同步版本的简化解析
            const title = extractProgrammingTitle(element, index);
            const description = extractProgrammingDescription(element);
            const examples = extractProgrammingExamples(element);
            
            return {
                index: index,
                title: title,
                type: 'programming',
                element: element,
                options: [], // 编程题没有选项
                inputs: [], // 编程题通常没有输入框（使用代码编辑器）
                content: description,
                fullText: element.textContent.trim(),
                
                // 编程题特有属性
                programmingMeta: {
                    examples: examples,
                    hasCodeEditor: element.querySelector('.ace_editor, .CodeMirror') !== null,
                    hasTextarea: element.querySelector('textarea') !== null
                }
            };
            
        } catch (error) {
            console.error('解析编程题失败:', error);
            return null;
        }
    }
    
    /**
     * 创建编程题对象
     */
    function createProgrammingQuestionObject(detectionResult, element, index) {
        return {
            index: index,
            title: detectionResult.metadata?.title || `编程题 ${index + 1}`,
            type: 'programming',
            element: element,
            options: [],
            inputs: [],
            content: detectionResult.description || '',
            fullText: element.textContent.trim(),
            
            // 编程题特有属性
            programmingMeta: {
                id: detectionResult.metadata?.id,
                difficulty: detectionResult.metadata?.difficulty,
                score: detectionResult.metadata?.score,
                ioFormats: detectionResult.ioFormats,
                examples: detectionResult.examples,
                constraints: detectionResult.constraints,
                hints: detectionResult.hints,
                relatedTopics: detectionResult.relatedTopics,
                codeTemplate: detectionResult.codeTemplate,
                hasCodeEditor: element.querySelector('.ace_editor, .CodeMirror') !== null,
                hasTextarea: element.querySelector('textarea') !== null
            }
        };
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
        
        // 查找输入样例
        const inputCode = element.querySelector('code.language-in') || 
                         element.querySelector('pre code');
        if (inputCode) {
            examples.input = inputCode.textContent.trim();
        }
        
        // 查找输出样例
        const outputCode = element.querySelector('code.language-out') || 
                          Array.from(element.querySelectorAll('pre code'))[1];
        if (outputCode) {
            examples.output = outputCode.textContent.trim();
        }
        
        return examples;
    }
    
    /**
     * 增强自动填充功能，支持编程题
     */
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
    
    /**
     * 填充编程题答案
     */
    async function fillProgrammingQuestionAnswer(question, code) {
        try {
            console.log('💻 填充编程题答案...');
            
            // 查找代码编辑器
            const element = question.element;
            
            // 1. 尝试填充textarea
            const textarea = element.querySelector('textarea');
            if (textarea) {
                textarea.value = code;
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
                textarea.dispatchEvent(new Event('change', { bubbles: true }));
                console.log('✅ 已填充到textarea');
                return true;
            }
            
            // 2. 尝试填充ACE编辑器
            const aceEditor = element.querySelector('.ace_editor');
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
            
            // 3. 尝试填充CodeMirror编辑器
            const codeMirror = element.querySelector('.CodeMirror');
            if (codeMirror && codeMirror.CodeMirror) {
                try {
                    codeMirror.CodeMirror.setValue(code);
                    console.log('✅ 已填充到CodeMirror编辑器');
                    return true;
                } catch (cmError) {
                    console.warn('CodeMirror编辑器填充失败:', cmError);
                }
            }
            
            // 4. 查找页面上的任何文本输入区域
            const allTextareas = document.querySelectorAll('textarea');
            const allInputs = document.querySelectorAll('input[type="text"]');
            
            if (allTextareas.length > 0) {
                const target = allTextareas[allTextareas.length - 1]; // 使用最后一个
                target.value = code;
                target.dispatchEvent(new Event('input', { bubbles: true }));
                target.dispatchEvent(new Event('change', { bubbles: true }));
                console.log('✅ 已填充到页面textarea');
                return true;
            }
            
            console.warn('❌ 未找到可填充的代码编辑器');
            return false;
            
        } catch (error) {
            console.error('填充编程题答案失败:', error);
            return false;
        }
    }
    
    /**
     * 添加编程题专用的工具栏按钮
     */
    function addProgrammingToolbarButtons() {
        const toolbar = document.querySelector('.wph-toolbar');
        if (!toolbar) return;
        
        const buttonsContainer = toolbar.querySelector('.wph-buttons');
        if (!buttonsContainer) return;
        
        // 添加编程题检测按钮
        const progDetectBtn = document.createElement('button');
        progDetectBtn.className = 'wph-btn secondary prog-detect-btn';
        progDetectBtn.innerHTML = '🔍 检测编程题 (Ctrl+Shift+P)';
        progDetectBtn.addEventListener('click', handleProgrammingDetection);
        
        // 添加代码模板按钮
        const templateBtn = document.createElement('button');
        templateBtn.className = 'wph-btn secondary template-btn';
        templateBtn.innerHTML = '📝 插入模板';
        templateBtn.addEventListener('click', handleInsertTemplate);
        
        buttonsContainer.appendChild(progDetectBtn);
        buttonsContainer.appendChild(templateBtn);
    }
    
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
     * 处理插入代码模板
     */
    async function handleInsertTemplate() {
        try {
            console.log('📝 开始生成并插入代码模板...');
            const result = await window.programmingDetector.detectProgrammingProblem();
            
            if (result.success && result.codeTemplate) {
                const code = result.codeTemplate;
                
                // 尝试直接插入
                let inserted = false;
                
                // 1. 使用平台专用填充器
                if (typeof window.wphCodeMirrorFiller !== 'undefined') {
                    const res = await window.wphCodeMirrorFiller.fillCode(code, { autoSave: true });
                    if (res && res.success) inserted = true;
                }
                
                // 2. 使用通用填充函数
                if (!inserted && typeof window.fillProgrammingQuestionAnswer === 'function') {
                    // 构造一个伪造的 question 对象
                    const mockQuestion = { element: document, type: 'programming' };
                    inserted = await window.fillProgrammingQuestionAnswer(mockQuestion, code);
                }
                
                if (inserted) {
                    showNotification('模板插入成功', '代码模板已插入到编辑器', 'success');
                } else {
                    // 插入失败，回退到弹窗
                    showNotification('自动插入失败', '无法自动写入编辑器，请手动复制', 'warning');
                    showProgrammingDetectionResult(result);
                }
            } else {
                showNotification('模板生成失败', result.error || '无法生成代码模板', 'error');
            }
            
        } catch (error) {
            console.error('插入模板失败:', error);
            showNotification('插入失败', error.message, 'error');
        }
    }

    /**
     * 显示编程题检测结果弹窗
     */
    function showProgrammingDetectionResult(result) {
        // 移除现有弹窗
        const existing = document.querySelector('.wph-programming-result-modal');
        if (existing) existing.remove();

        // 创建弹窗
        const modal = document.createElement('div');
        modal.className = 'wph-programming-result-modal';
        
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>💻 编程题检测结果</h3>
                    <button class="close-btn" title="关闭">×</button>
                </div>
                <div class="modal-body">
                    <div class="result-section">
                        <h4>📌 基本信息</h4>
                        <p><strong>标题:</strong> ${result?.metadata?.title || result?.title || '未知'}</p>
                        ${result?.metadata?.id ? `<p><strong>ID:</strong> ${result.metadata.id}</p>` : ''}
                        ${result?.metadata?.language ? `<p><strong>语言:</strong> ${result.metadata.language}</p>` : ''}
                    </div>

                    ${result.codeTemplate ? `
                    <div class="result-section">
                        <h4>🧩 代码模板</h4>
                        <pre><code>${result.codeTemplate}</code></pre>
                    </div>
                    ` : ''}

                    ${result.ioFormats && (result.ioFormats.input || result.ioFormats.output) ? `
                    <div class="result-section">
                        <h4>🧾 输入输出格式</h4>
                        ${result.ioFormats.input ? `<p><strong>输入:</strong> ${result.ioFormats.input}</p>` : ''}
                        ${result.ioFormats.output ? `<p><strong>输出:</strong> ${result.ioFormats.output}</p>` : ''}
                    </div>
                    ` : ''}
                    
                    ${result.examples && (result.examples.input || result.examples.output) ? `
                    <div class="result-section">
                        <h4>🔢 样例数据</h4>
                        ${result.examples.input ? `
                        <div class="example-block">
                            <strong>输入样例:</strong>
                            <pre><code>${result.examples.input}</code></pre>
                        </div>
                        ` : ''}
                        ${result.examples.output ? `
                        <div class="example-block">
                            <strong>输出样例:</strong>
                            <pre><code>${result.examples.output}</code></pre>
                        </div>
                        ` : ''}
                    </div>
                    ` : ''}
                    
                    ${result.hints && result.hints.length > 0 ? `
                    <div class="result-section">
                        <h4>💡 解题提示</h4>
                        <ul>
                            ${result.hints.map(hint => `<li>${hint}</li>`).join('')}
                        </ul>
                    </div>
                    ` : ''}
                    
                    <div class="result-actions">
                        <button class="copy-template-btn">📝 复制代码模板</button>
                        <button class="insert-template-btn">🔄 插入模板到编辑器</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 添加事件监听
        const closeBtn = modal.querySelector('.close-btn');
        const overlay = modal.querySelector('.modal-overlay');
        const copyTemplateBtn = modal.querySelector('.copy-template-btn');
        const insertTemplateBtn = modal.querySelector('.insert-template-btn');
        
        const closeModal = () => modal.remove();
        
        closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', closeModal);
        
        if (copyTemplateBtn && result.codeTemplate) {
            copyTemplateBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(result.codeTemplate).then(() => {
                    showNotification('复制成功', '代码模板已复制到剪贴板', 'success');
                });
            });
        }
        
        if (insertTemplateBtn && result.codeTemplate) {
            insertTemplateBtn.addEventListener('click', async () => {
                try {
                    const code = result.codeTemplate;
                    console.log('尝试插入模板到编辑器, 长度=', (code||'').length);

                    // 优先使用已集成的填充器
                    if (typeof window.wphCodeMirrorFiller !== 'undefined' && window.wphCodeMirrorFiller.fillCode) {
                        const res = await window.wphCodeMirrorFiller.fillCode(code, { autoSave: true });
                        if (res && res.success) {
                            showNotification('插入成功', '代码模板已插入到编辑器（WPH填充器）', 'success');
                            closeModal();
                            return;
                        }
                    }

                    if (typeof window.fillProgrammingQuestionAnswer === 'function') {
                        const r = await Promise.resolve(window.fillProgrammingQuestionAnswer(null, code));
                        if (r) {
                            showNotification('插入成功', '代码模板已插入到编辑器', 'success');
                            closeModal();
                            return;
                        }
                    }

                    // 兜底尝试：查找常见编辑器
                    // 1) 文本域
                    const ta = document.querySelector('textarea');
                    if (ta) {
                        ta.focus();
                        ta.value = code;
                        ta.dispatchEvent(new Event('input', { bubbles: true }));
                        ta.dispatchEvent(new Event('change', { bubbles: true }));
                        showNotification('插入成功', '代码模板已插入到 textarea', 'success');
                        closeModal();
                        return;
                    }

                    // 2) CodeMirror 旧版
                    const cmOld = document.querySelector('.CodeMirror');
                    if (cmOld && cmOld.CodeMirror) {
                        try { cmOld.CodeMirror.setValue(code); showNotification('插入成功', '代码模板已插入到 CodeMirror', 'success'); closeModal(); return; } catch(e){}
                    }

                    // 3) Ace
                    const aceEl = document.querySelector('.ace_editor');
                    if (aceEl && window.ace) {
                        try { window.ace.edit(aceEl).setValue(code); showNotification('插入成功', '代码模板已插入到 Ace', 'success'); closeModal(); return; } catch(e){}
                    }

                    // 4) CodeMirror6 编辑器视图
                    const cm6 = document.querySelector('.cm-editor, .cm-content, .codeEditor_CHvdZ');
                    if (cm6) {
                        try {
                            // 尝试查找挂载的 EditorView
                            const view = (function findView(node){
                                let el = node;
                                while(el){
                                    for (const k in el) {
                                        try { const v = el[k]; if (v && v.constructor && v.constructor.name === 'EditorView') return v; } catch(e){}
                                    }
                                    el = el.parentElement;
                                }
                                for (const k in window) {
                                    try { const w = window[k]; if (w && w.constructor && w.constructor.name === 'EditorView') return w; } catch(e){}
                                }
                                return null;
                            })(cm6);

                            if (view && view.dispatch && view.state) {
                                const len = view.state.doc ? view.state.doc.length : 0;
                                view.dispatch({ changes: { from: 0, to: len, insert: code } });
                                showNotification('插入成功', '代码模板已插入到 CodeMirror6', 'success');
                                closeModal();
                                return;
                            }
                        } catch(e){console.warn('CodeMirror6 插入失败', e)}
                    }

                    // 最后回退到复制到剪贴板
                    await navigator.clipboard.writeText(code);
                    showNotification('模板已复制', '未能直接插入编辑器，代码已复制到剪贴板，可按粘贴使用', 'info');
                    closeModal();

                } catch (error) {
                    console.error('插入模板失败:', error);
                    showNotification('插入失败', error.message || String(error), 'error');
                }
            });
        }
        
        // 显示动画
        setTimeout(() => modal.classList.add('show'), 100);
    }
    
    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(addProgrammingToolbarButtons, 2000);
        });
    } else {
        setTimeout(addProgrammingToolbarButtons, 2000);
    }
    
    console.log('✅ 编程题检测功能集成完成');
    
})();