/**
 * CodeMirror 编辑器专用填充器
 * 针对 Pintia 等平台的现代化答题界面进行优化
 */

class WPHCodeMirrorFiller {
    constructor() {
        this.editorSelectors = {
            // CodeMirror 6 编辑器选择器
            codemirror6: '.cm-editor',
            codemirrorContent: '.cm-content',
            codemirrorScroller: '.cm-scroller',
            
            // 答题区域选择器
            answerInput: '.answerInput_g2YSk',
            codingForm: '.CodingProblemAnswerForm_Qp8cD',
            codeEditor: '.codeEditor_CHvdZ',
            
            // 语言选择器
            languageSelect: '.select__control',
            languageValue: '.select__single-value',
            
            // 工具栏按钮
            settingsBtn: 'button[aria-label="设置"]',
            helpBtn: 'button[aria-label="帮助"]',
            saveBtn: 'button[aria-label="保存答题草稿"]',
            testBtn: 'button[aria-label="展开测试区"]',
            fullscreenBtn: 'button[aria-label="全屏"]'
        };
        
        this.fillStrategies = [
            this.fillCodeMirror6.bind(this),
            this.fillCodeMirrorLegacy.bind(this),
            this.fillTextarea.bind(this),
            this.fillContentEditable.bind(this),
            this.fillExecCommand.bind(this) // 新增：使用 execCommand 作为通用回退策略
        ];
        
        // 检测编辑器类型
        this.editorType = this.detectEditorType();
        
        console.log('🎯 CodeMirror填充器已初始化，编辑器类型:', this.editorType);
    }

    /**
     * 检测编辑器类型
     */
    detectEditorType() {
        if (document.querySelector('.cm-editor.ͼ1.ͼ2')) {
            return 'codemirror6';
        } else if (document.querySelector('.CodeMirror')) {
            return 'codemirror5';
        } else if (document.querySelector('textarea')) {
            return 'textarea';
        } else if (document.querySelector('[contenteditable="true"]')) {
            return 'contenteditable';
        }
        return 'unknown';
    }

    /**
     * 主填充方法
     */
    async fillCode(code, options = {}) {
        console.log('🔄 开始填充代码到编辑器...');
        
        try {
            // 预处理代码
            const processedCode = this.preprocessCode(code, options);
            
            // 尝试各种填充策略
            for (const strategy of this.fillStrategies) {
                try {
                    const result = await strategy(processedCode, options);
                    if (result.success) {
                        console.log(`✅ 填充成功，使用策略: ${result.method}`);
                        
                        // 后处理
                        await this.postFillProcess(result.element, options);
                        
                        return {
                            success: true,
                            method: result.method,
                            element: result.element,
                            editorType: this.editorType
                        };
                    }
                } catch (error) {
                    console.warn(`填充策略失败:`, error);
                    continue;
                }
            }
            
            return {
                success: false,
                error: '所有填充策略都失败了',
                editorType: this.editorType
            };
            
        } catch (error) {
            console.error('❌ 代码填充失败:', error);
            return {
                success: false,
                error: error.message,
                editorType: this.editorType
            };
        }
    }

    /**
     * 填充策略1: CodeMirror 6 (最新版本)
     */
    async fillCodeMirror6(code, options = {}) {
        const editor = document.querySelector(this.editorSelectors.codemirror6);
        if (!editor) {
            return { success: false, method: 'codemirror6' };
        }

        console.log('🎯 尝试填充CodeMirror 6编辑器...');

        try {
            // 方法1: 通过CodeMirror 6的视图API
            if (editor.view && editor.view.dispatch) {
                const view = editor.view;
                const transaction = view.state.update({
                    changes: {
                        from: 0,
                        to: view.state.doc.length,
                        insert: code
                    }
                });
                view.dispatch(transaction);
                
                return {
                    success: true,
                    method: 'codemirror6-view-api',
                    element: editor
                };
            }

            // 方法2: 通过内容区域直接设置
            const contentElement = editor.querySelector(this.editorSelectors.codemirrorContent);
            if (contentElement) {
                // 清空现有内容
                contentElement.innerHTML = '';
                
                // 创建代码行
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

                // 触发输入事件
                this.triggerInputEvents(contentElement);
                
                return {
                    success: true,
                    method: 'codemirror6-content-manipulation',
                    element: editor
                };
            }

            // 方法3: 通过模拟键盘输入
            if (contentElement && contentElement.isContentEditable) {
                contentElement.focus();
                
                // 选择所有内容
                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(contentElement);
                selection.removeAllRanges();
                selection.addRange(range);
                
                // 模拟粘贴
                const pasteEvent = new ClipboardEvent('paste', {
                    clipboardData: new DataTransfer()
                });
                pasteEvent.clipboardData.setData('text/plain', code);
                contentElement.dispatchEvent(pasteEvent);
                
                return {
                    success: true,
                    method: 'codemirror6-paste-simulation',
                    element: editor
                };
            }

            return { success: false, method: 'codemirror6' };

        } catch (error) {
            console.warn('CodeMirror 6填充失败:', error);
            return { success: false, method: 'codemirror6', error };
        }
    }

    /**
     * 填充策略2: CodeMirror 5 (传统版本)
     */
    async fillCodeMirrorLegacy(code, options = {}) {
        const editors = document.querySelectorAll('.CodeMirror');
        if (editors.length === 0) {
            return { success: false, method: 'codemirror5' };
        }

        console.log('🎯 尝试填充CodeMirror 5编辑器...');

        for (const editor of editors) {
            try {
                if (editor.CodeMirror) {
                    editor.CodeMirror.setValue(code);
                    editor.CodeMirror.refresh();
                    
                    return {
                        success: true,
                        method: 'codemirror5-api',
                        element: editor
                    };
                }
            } catch (error) {
                console.warn('CodeMirror 5 API填充失败:', error);
                continue;
            }
        }

        return { success: false, method: 'codemirror5' };
    }

    /**
     * 填充策略3: Textarea
     */
    async fillTextarea(code, options = {}) {
        const textareas = document.querySelectorAll('textarea');
        if (textareas.length === 0) {
            return { success: false, method: 'textarea' };
        }

        console.log('🎯 尝试填充Textarea...');

        for (const textarea of textareas) {
            try {
                // 检查是否在答题区域内
                const isInAnswerArea = textarea.closest(this.editorSelectors.answerInput) ||
                                     textarea.closest(this.editorSelectors.codingForm);
                
                if (isInAnswerArea || textareas.length === 1) {
                    textarea.value = code;
                    textarea.focus();
                    
                    // 触发各种事件
                    this.triggerInputEvents(textarea);
                    
                    return {
                        success: true,
                        method: 'textarea',
                        element: textarea
                    };
                }
            } catch (error) {
                console.warn('Textarea填充失败:', error);
                continue;
            }
        }

        return { success: false, method: 'textarea' };
    }

    /**
     * 填充策略4: ContentEditable
     */
    async fillContentEditable(code, options = {}) {
        const editables = document.querySelectorAll('[contenteditable="true"]');
        if (editables.length === 0) {
            return { success: false, method: 'contenteditable' };
        }

        console.log('🎯 尝试填充ContentEditable元素...');

        for (const editable of editables) {
            try {
                // 检查是否在答题区域内
                const isInAnswerArea = editable.closest(this.editorSelectors.answerInput) ||
                                     editable.closest(this.editorSelectors.codingForm) ||
                                     editable.classList.contains('cm-content');
                
                if (isInAnswerArea) {
                    editable.focus();
                    
                    // 清空内容
                    editable.innerHTML = '';
                    
                    // 设置代码内容
                    const lines = code.split('\n');
                    lines.forEach((line, index) => {
                        const lineDiv = document.createElement('div');
                        lineDiv.textContent = line || '';
                        if (line === '') {
                            lineDiv.appendChild(document.createElement('br'));
                        }
                        editable.appendChild(lineDiv);
                    });
                    
                    // 触发事件
                    this.triggerInputEvents(editable);
                    
                    return {
                        success: true,
                        method: 'contenteditable',
                        element: editable
                    };
                }
            } catch (error) {
                console.warn('ContentEditable填充失败:', error);
                continue;
            }
        }

        return { success: false, method: 'contenteditable' };
    }

    /**
     * 填充策略5: execCommand (通用回退)
     * 适用于大多数 contenteditable 元素，模拟用户粘贴/输入
     */
    async fillExecCommand(code, options = {}) {
        console.log('🎯 尝试使用 execCommand 填充...');
        
        // 尝试找到焦点元素或可能的编辑器
        let target = document.activeElement;
        
        // 如果当前焦点不在编辑器内，尝试查找编辑器并聚焦
        if (!target || target === document.body || 
            (!target.isContentEditable && target.tagName !== 'TEXTAREA' && target.tagName !== 'INPUT')) {
            
            const possibleTargets = [
                document.querySelector(this.editorSelectors.codemirrorContent),
                document.querySelector('[contenteditable="true"]'),
                document.querySelector('textarea')
            ];
            
            for (const el of possibleTargets) {
                if (el) {
                    target = el;
                    target.focus();
                    break;
                }
            }
        }
        
        if (!target) return { success: false, method: 'execCommand' };
        
        try {
            // 选中所有内容
            if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
                target.select();
            } else if (target.isContentEditable) {
                document.execCommand('selectAll', false, null);
            }
            
            // 尝试插入文本
            const success = document.execCommand('insertText', false, code);
            
            if (success) {
                return {
                    success: true,
                    method: 'execCommand',
                    element: target
                };
            }
        } catch (error) {
            console.warn('execCommand 填充失败:', error);
        }
        
        return { success: false, method: 'execCommand' };
    }

    /**
     * 预处理代码
     */
    preprocessCode(code, options = {}) {
        let processedCode = code;

        // 处理换行符
        processedCode = processedCode.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

        // 处理制表符
        if (options.convertTabs !== false) {
            processedCode = processedCode.replace(/\t/g, '    '); // 转换为4个空格
        }

        // 处理编码问题
        processedCode = processedCode.replace(/\\n/g, '\n');

        // 确保代码以换行符结尾
        if (!processedCode.endsWith('\n')) {
            processedCode += '\n';
        }

        return processedCode;
    }

    /**
     * 触发输入事件
     */
    triggerInputEvents(element) {
        const events = [
            new Event('input', { bubbles: true, cancelable: true }),
            new Event('change', { bubbles: true, cancelable: true }),
            new KeyboardEvent('keyup', { bubbles: true, cancelable: true }),
            new Event('blur', { bubbles: true, cancelable: true }),
            new Event('focus', { bubbles: true, cancelable: true })
        ];

        events.forEach(event => {
            try {
                element.dispatchEvent(event);
            } catch (error) {
                console.warn('事件触发失败:', error);
            }
        });
    }

    /**
     * 后处理
     */
    async postFillProcess(element, options = {}) {
        try {
            // 等待一小段时间让编辑器处理
            await new Promise(resolve => setTimeout(resolve, 100));

            // 设置光标位置
            if (options.setCursor !== false) {
                this.setCursorPosition(element, options.cursorPosition || 'end');
            }

            // 触发保存草稿（如果需要）
            if (options.autoSave) {
                this.triggerAutoSave();
            }

            // 格式化代码（如果需要）
            if (options.autoFormat) {
                this.triggerAutoFormat();
            }

        } catch (error) {
            console.warn('后处理失败:', error);
        }
    }

    /**
     * 设置光标位置
     */
    setCursorPosition(element, position = 'end') {
        try {
            if (element.tagName === 'TEXTAREA') {
                if (position === 'end') {
                    element.selectionStart = element.selectionEnd = element.value.length;
                } else if (position === 'start') {
                    element.selectionStart = element.selectionEnd = 0;
                }
                element.focus();
            } else if (element.isContentEditable || element.querySelector('[contenteditable="true"]')) {
                const contentElement = element.isContentEditable ? element : element.querySelector('[contenteditable="true"]');
                const selection = window.getSelection();
                const range = document.createRange();
                
                if (position === 'end') {
                    range.selectNodeContents(contentElement);
                    range.collapse(false);
                } else if (position === 'start') {
                    range.selectNodeContents(contentElement);
                    range.collapse(true);
                }
                
                selection.removeAllRanges();
                selection.addRange(range);
                contentElement.focus();
            }
        } catch (error) {
            console.warn('设置光标位置失败:', error);
        }
    }

    /**
     * 触发自动保存
     */
    triggerAutoSave() {
        try {
            const saveBtn = document.querySelector(this.editorSelectors.saveBtn);
            if (saveBtn) {
                saveBtn.click();
                console.log('✅ 已触发自动保存');
            }
        } catch (error) {
            console.warn('触发自动保存失败:', error);
        }
    }

    /**
     * 触发自动格式化
     */
    triggerAutoFormat() {
        try {
            // 尝试触发格式化快捷键
            const formatEvent = new KeyboardEvent('keydown', {
                key: 'f',
                ctrlKey: true,
                shiftKey: true,
                bubbles: true
            });
            document.dispatchEvent(formatEvent);
            console.log('✅ 已触发自动格式化');
        } catch (error) {
            console.warn('触发自动格式化失败:', error);
        }
    }

    /**
     * 获取当前编辑器内容
     */
    getCurrentCode() {
        try {
            // CodeMirror 6
            const cm6Editor = document.querySelector(this.editorSelectors.codemirror6);
            if (cm6Editor && cm6Editor.view) {
                return cm6Editor.view.state.doc.toString();
            }

            // CodeMirror 6 内容区域
            const cm6Content = document.querySelector(this.editorSelectors.codemirrorContent);
            if (cm6Content) {
                return Array.from(cm6Content.querySelectorAll('.cm-line'))
                    .map(line => line.textContent || '')
                    .join('\n');
            }

            // CodeMirror 5
            const cm5Editor = document.querySelector('.CodeMirror');
            if (cm5Editor && cm5Editor.CodeMirror) {
                return cm5Editor.CodeMirror.getValue();
            }

            // Textarea
            const textarea = document.querySelector('textarea');
            if (textarea) {
                return textarea.value;
            }

            return '';
        } catch (error) {
            console.warn('获取编辑器内容失败:', error);
            return '';
        }
    }

    /**
     * 检查编辑器是否为空
     */
    isEditorEmpty() {
        const content = this.getCurrentCode().trim();
        return content === '' || content === '\n';
    }

    /**
     * 获取编辑器信息
     */
    getEditorInfo() {
        const info = {
            type: this.editorType,
            isEmpty: this.isEditorEmpty(),
            content: this.getCurrentCode(),
            language: this.getCurrentLanguage(),
            element: null
        };

        // 获取编辑器元素
        if (this.editorType === 'codemirror6') {
            info.element = document.querySelector(this.editorSelectors.codemirror6);
        } else if (this.editorType === 'codemirror5') {
            info.element = document.querySelector('.CodeMirror');
        } else if (this.editorType === 'textarea') {
            info.element = document.querySelector('textarea');
        }

        return info;
    }

    /**
     * 获取当前选择的编程语言
     */
    getCurrentLanguage() {
        try {
            const languageElement = document.querySelector(this.editorSelectors.languageValue);
            if (languageElement) {
                return languageElement.textContent.trim();
            }
            return 'C++ (clang++)'; // 默认语言
        } catch (error) {
            console.warn('获取编程语言失败:', error);
            return 'Unknown';
        }
    }

    /**
     * 设置编程语言
     */
    async setLanguage(language) {
        try {
            const languageSelect = document.querySelector(this.editorSelectors.languageSelect);
            if (languageSelect) {
                languageSelect.click();
                
                // 等待下拉菜单出现
                await new Promise(resolve => setTimeout(resolve, 200));
                
                // 查找对应的语言选项
                const options = document.querySelectorAll('.select__option');
                for (const option of options) {
                    if (option.textContent.includes(language)) {
                        option.click();
                        console.log(`✅ 已设置编程语言为: ${language}`);
                        return true;
                    }
                }
            }
            return false;
        } catch (error) {
            console.warn('设置编程语言失败:', error);
            return false;
        }
    }

    /**
     * 清空编辑器
     */
    async clearEditor() {
        return await this.fillCode('', { setCursor: false });
    }

    /**
     * 在当前位置插入代码
     */
    async insertCode(code, position = 'cursor') {
        try {
            const currentCode = this.getCurrentCode();
            let newCode;

            if (position === 'start') {
                newCode = code + '\n' + currentCode;
            } else if (position === 'end') {
                newCode = currentCode + '\n' + code;
            } else {
                // 在光标位置插入（简化实现）
                newCode = currentCode + '\n' + code;
            }

            return await this.fillCode(newCode);
        } catch (error) {
            console.error('插入代码失败:', error);
            return { success: false, error: error.message };
        }
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WPHCodeMirrorFiller;
} else if (typeof window !== 'undefined') {
    window.WPHCodeMirrorFiller = WPHCodeMirrorFiller;
}

// 创建全局实例
if (typeof window !== 'undefined') {
    window.wphCodeMirrorFiller = new WPHCodeMirrorFiller();
    
    // 如果页面未提供通用的 fillProgrammingQuestionAnswer，则注入一个尽量通用的实现
    if (typeof window.fillProgrammingQuestionAnswer !== 'function') {
        window.fillProgrammingQuestionAnswer = async function(question, code) {
            try {
                console.log('🔌 通用编程题填充器尝试插入代码...');

                // 优先使用 question.element 内的 textarea 或编辑器
                const container = question && question.element ? question.element : document;

                // 1) 直接 textarea
                const ta = container.querySelector('textarea');
                if (ta) {
                    ta.focus();
                    ta.value = code;
                    ta.dispatchEvent(new Event('input', { bubbles: true }));
                    ta.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log('✅ 已通过 textarea 填充代码');
                    return true;
                }

                // 2) CodeMirror (老版) - 尝试找到 .CodeMirror 并使用其 API
                const cmOld = container.querySelector('.CodeMirror');
                if (cmOld) {
                    const cmInstance = cmOld.CodeMirror || (cmOld.nextSibling && cmOld.nextSibling.CodeMirror) || null;
                    if (cmInstance && typeof cmInstance.setValue === 'function') {
                        cmInstance.setValue(code);
                        console.log('✅ 已通过老版 CodeMirror API 填充代码');
                        return true;
                    }
                    // 有时实例挂载在 DOM 节点上
                    if (cmOld.__cm && typeof cmOld.__cm.setValue === 'function') {
                        cmOld.__cm.setValue(code);
                        console.log('✅ 已通过 CodeMirror DOM 挂载实例填充代码');
                        return true;
                    }
                }

                // 3) CodeMirror6 / 新版：查找 .cm-content 或 .cm-editor，尝试设置可编辑区域或 textarea
                const cm6 = container.querySelector('.cm-content, .cm-editor, [data-e2e="code-editor-input"], .codeEditor_CHvdZ, .codeEditor, .code-editor');
                if (cm6) {
                    // 尝试查找 CodeMirror6 的 EditorView 实例（更可靠的注入方式）
                    try {
                        // 从节点及其父节点尝试寻找挂载的 EditorView 实例
                        function findEditorView(node) {
                            let el = node;
                            while (el) {
                                // 检查常见挂载属性
                                const candidateProps = Object.keys(el).concat(['cmView','__cm_view','__cm','EditorView','view']);
                                for (const prop of candidateProps) {
                                    try {
                                        const val = el[prop];
                                        if (val && val.constructor && val.constructor.name === 'EditorView') return val;
                                    } catch (e) {
                                        // ignore
                                    }
                                }

                                // 检查元素上可迭代的属性，寻找 EditorView 实例
                                try {
                                    for (const k in el) {
                                        try {
                                            const v = el[k];
                                            if (v && v.constructor && v.constructor.name === 'EditorView') return v;
                                        } catch (e) {}
                                    }
                                } catch (e) {}

                                el = el.parentElement;
                            }

                            // 如果上面没找到，扫描 window 全局对象中可能存在的 EditorView 实例
                            try {
                                for (const key in window) {
                                    try {
                                        const w = window[key];
                                        if (w && w.constructor && w.constructor.name === 'EditorView') return w;
                                        // 有些项目会把 view 集合放在全局变量
                                        if (Array.isArray(w)) {
                                            for (const item of w) {
                                                if (item && item.constructor && item.constructor.name === 'EditorView') return item;
                                            }
                                        }
                                    } catch (e) {}
                                }
                            } catch (e) {}

                            return null;
                        }

                        const editorView = findEditorView(cm6);
                        if (editorView && typeof editorView.dispatch === 'function' && editorView.state) {
                            // 使用 CM6 的事务替换全部内容
                            try {
                                const length = editorView.state.doc ? editorView.state.doc.length : 0;
                                editorView.dispatch({ changes: { from: 0, to: length, insert: code } });
                                console.log('✅ 已通过 CodeMirror6 EditorView API 填充代码');
                                return true;
                            } catch (e) {
                                console.warn('使用 EditorView API 填充失败:', e);
                            }
                        }
                    } catch (e) {
                        console.warn('查找 EditorView 过程异常:', e);
                    }
                    // 尝试找到隐藏 textarea
                    const innerTa = cm6.querySelector('textarea');
                    if (innerTa) {
                        innerTa.focus();
                        innerTa.value = code;
                        innerTa.dispatchEvent(new Event('input', { bubbles: true }));
                        innerTa.dispatchEvent(new Event('change', { bubbles: true }));
                        console.log('✅ 已通过 CodeMirror6 隐藏 textarea 填充代码');
                        return true;
                    }

                    // 尝试直接设置文本内容（对于 simple editors）
                    const editable = cm6.querySelector('[contenteditable="true"]') || cm6;
                    if (editable) {
                        // 使用 innerText 可能不足以更新编辑器状态，但作为兜底尝试
                        editable.focus && editable.focus();
                        editable.innerText = code;
                        editable.dispatchEvent && editable.dispatchEvent(new Event('input', { bubbles: true }));
                        console.log('✅ 已通过 contenteditable/innerText 填充代码（兜底）');
                        return true;
                    }
                }

                // 4) Ace 编辑器
                const aceEl = container.querySelector('.ace_editor');
                if (aceEl && typeof window.ace !== 'undefined') {
                    try {
                        const aceInstance = window.ace.edit(aceEl);
                        if (aceInstance && typeof aceInstance.setValue === 'function') {
                            aceInstance.setValue(code, -1);
                            console.log('✅ 已通过 Ace Editor API 填充代码');
                            return true;
                        }
                    } catch (e) {
                        console.warn('尝试使用 Ace API 填充失败:', e);
                    }
                }

                // 5) Monaco 编辑器（尽力尝试：查找 textarea 或 .view-lines）
                const monacoEl = container.querySelector('.monaco-editor');
                if (monacoEl && window.monaco) {
                    // 无可靠全局 editor 实例时，尝试找到 textarea
                    const monTa = monacoEl.querySelector('textarea');
                    if (monTa) {
                        monTa.focus();
                        monTa.value = code;
                        monTa.dispatchEvent(new Event('input', { bubbles: true }));
                        console.log('✅ 已通过 Monaco textarea 填充代码');
                        return true;
                    }
                }

                // 6) 全局回退：页面上任何 textarea
                const anyTa = document.querySelector('textarea');
                if (anyTa) {
                    anyTa.focus();
                    anyTa.value = code;
                    anyTa.dispatchEvent(new Event('input', { bubbles: true }));
                    anyTa.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log('✅ 通过页面任意 textarea 回退填充代码');
                    return true;
                }

                console.warn('⚠️ 未能识别支持的编辑器以插入代码');
                return false;
            } catch (error) {
                console.error('通用填充器执行异常:', error);
                return false;
            }
        };
    }

    // 添加到现有的编程题填充功能中（如果已有实现，则基于 wphCodeMirrorFiller 做一次包装以优先使用本模块）
    if (typeof window.fillProgrammingQuestionAnswer === 'function') {
        const originalFillProgrammingQuestionAnswer = window.fillProgrammingQuestionAnswer;
        
        window.fillProgrammingQuestionAnswer = async function(question, code) {
            try {
                console.log('🎯 使用专用CodeMirror填充器...');
                
                const result = await window.wphCodeMirrorFiller.fillCode(code, {
                    autoSave: true,
                    setCursor: true,
                    cursorPosition: 'end'
                });
                
                if (result.success) {
                    console.log('✅ 专用填充成功');
                    return true;
                } else {
                    console.log('⚠️ 专用填充失败，回退到通用方法');
                    return await originalFillProgrammingQuestionAnswer(question, code);
                }
            } catch (error) {
                console.error('专用填充器失败:', error);
                return await originalFillProgrammingQuestionAnswer(question, code);
            }
        };
    }
    
    console.log('✅ CodeMirror填充器已加载并集成');
}