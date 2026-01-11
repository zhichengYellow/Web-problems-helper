/**
 * PTA平台UI增强器
 * 为PTA平台添加专用的编程题辅助UI组件
 */

class PTAUIEnhancer {
    constructor() {
        this.isInitialized = false;
        this.toolbarAdded = false;
        this.shortcuts = {
            'Ctrl+Shift+P': 'detectProgramming',
            'Ctrl+Shift+T': 'insertTemplate',
            'Ctrl+Shift+S': 'searchAnswer',
            'Ctrl+Shift+F': 'fillAnswer',
            'Ctrl+Shift+C': 'clearEditor',
            'Ctrl+Shift+H': 'toggleHighlight'
        };
        
        this.init();
    }

    async init() {
        if (this.isInitialized) return;
        
        console.log('🎨 初始化PTA UI增强器...');
        
        // 等待页面加载完成
        await this.waitForPageLoad();
        
        // 添加自定义样式
        this.addCustomStyles();
        
        // 添加工具栏
        this.addFloatingToolbar();
        
        // 添加快捷键
        this.addKeyboardShortcuts();
        
        // 添加右键菜单
        this.addContextMenu();
        
        // 监听页面变化
        this.observePageChanges();
        
        this.isInitialized = true;
        console.log('✅ PTA UI增强器初始化完成');
    }

    /**
     * 等待页面加载完成
     */
    async waitForPageLoad() {
        return new Promise((resolve) => {
            if (document.readyState === 'complete') {
                resolve();
            } else {
                window.addEventListener('load', resolve);
            }
        });
    }

    /**
     * 添加自定义样式
     */
    addCustomStyles() {
        if (document.getElementById('pta-ui-enhancer-styles')) return;
        
        const styles = `
            /* PTA UI增强器样式 */
            .pta-floating-toolbar {
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                border: 1px solid #e0e0e0;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                padding: 12px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 8px;
                min-width: 200px;
                transition: all 0.3s ease;
                opacity: 0.9;
            }
            
            .pta-floating-toolbar:hover {
                opacity: 1;
                transform: translateY(-2px);
                box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
            }
            
            .pta-floating-toolbar.collapsed {
                width: 48px;
                height: 48px;
                padding: 8px;
            }
            
            .pta-floating-toolbar.collapsed .toolbar-content {
                display: none;
            }
            
            .pta-toolbar-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
                padding-bottom: 8px;
                border-bottom: 1px solid #f0f0f0;
            }
            
            .pta-toolbar-title {
                font-size: 14px;
                font-weight: 600;
                color: #333;
                margin: 0;
            }
            
            .pta-toolbar-toggle {
                background: none;
                border: none;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                color: #666;
                transition: all 0.2s ease;
            }
            
            .pta-toolbar-toggle:hover {
                background: #f0f0f0;
                color: #333;
            }
            
            .pta-toolbar-btn {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px 12px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 13px;
                font-weight: 500;
                transition: all 0.2s ease;
                text-align: left;
                width: 100%;
            }
            
            .pta-toolbar-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
            }
            
            .pta-toolbar-btn.secondary {
                background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
            }
            
            .pta-toolbar-btn.secondary:hover {
                box-shadow: 0 4px 12px rgba(72, 187, 120, 0.4);
            }
            
            .pta-toolbar-btn.danger {
                background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
            }
            
            .pta-toolbar-btn.danger:hover {
                box-shadow: 0 4px 12px rgba(245, 101, 101, 0.4);
            }
            
            .pta-toolbar-btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                transform: none;
            }
            
            .pta-toolbar-btn:disabled:hover {
                transform: none;
                box-shadow: none;
            }
            
            .pta-toolbar-shortcut {
                font-size: 11px;
                opacity: 0.8;
                margin-left: auto;
            }
            
            .pta-status-indicator {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 6px 10px;
                background: #f8f9fa;
                border-radius: 6px;
                font-size: 12px;
                color: #666;
            }
            
            .pta-status-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #28a745;
            }
            
            .pta-status-dot.warning {
                background: #ffc107;
            }
            
            .pta-status-dot.error {
                background: #dc3545;
            }
            
            /* 上下文菜单样式 */
            .pta-context-menu {
                position: fixed;
                background: white;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
                padding: 8px 0;
                z-index: 10001;
                min-width: 180px;
            }
            
            .pta-context-menu-item {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px 16px;
                cursor: pointer;
                font-size: 13px;
                color: #333;
                transition: background 0.2s ease;
            }
            
            .pta-context-menu-item:hover {
                background: #f8f9fa;
            }
            
            .pta-context-menu-separator {
                height: 1px;
                background: #e0e0e0;
                margin: 4px 0;
            }
            
            /* 通知样式 */
            .pta-notification {
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: white;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
                padding: 16px 20px;
                z-index: 10002;
                max-width: 400px;
                display: flex;
                align-items: center;
                gap: 12px;
                animation: slideInDown 0.3s ease;
            }
            
            .pta-notification.success {
                border-left: 4px solid #28a745;
            }
            
            .pta-notification.warning {
                border-left: 4px solid #ffc107;
            }
            
            .pta-notification.error {
                border-left: 4px solid #dc3545;
            }
            
            .pta-notification.info {
                border-left: 4px solid #17a2b8;
            }
            
            @keyframes slideInDown {
                from {
                    opacity: 0;
                    transform: translateX(-50%) translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
            }
            
            /* 编程题高亮样式 */
            .pta-programming-highlight {
                position: relative;
                border: 2px solid #667eea !important;
                border-radius: 8px !important;
                background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%) !important;
            }
            
            .pta-programming-highlight::before {
                content: '💻 编程题';
                position: absolute;
                top: -12px;
                left: 12px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
                z-index: 10;
            }
            
            /* 响应式设计 */
            @media (max-width: 768px) {
                .pta-floating-toolbar {
                    top: 10px;
                    right: 10px;
                    min-width: 160px;
                }
                
                .pta-toolbar-btn {
                    padding: 6px 10px;
                    font-size: 12px;
                }
                
                .pta-notification {
                    max-width: 90vw;
                    left: 5vw;
                    transform: none;
                }
            }
            
            /* 暗色主题支持 */
            @media (prefers-color-scheme: dark) {
                .pta-floating-toolbar {
                    background: rgba(30, 30, 30, 0.95);
                    border-color: #444;
                }
                
                .pta-toolbar-title {
                    color: #e0e0e0;
                }
                
                .pta-toolbar-toggle {
                    color: #ccc;
                }
                
                .pta-toolbar-toggle:hover {
                    background: #444;
                    color: #fff;
                }
                
                .pta-status-indicator {
                    background: #333;
                    color: #ccc;
                }
                
                .pta-context-menu {
                    background: #2d2d2d;
                    border-color: #444;
                }
                
                .pta-context-menu-item {
                    color: #e0e0e0;
                }
                
                .pta-context-menu-item:hover {
                    background: #444;
                }
                
                .pta-notification {
                    background: #2d2d2d;
                    border-color: #444;
                    color: #e0e0e0;
                }
            }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.id = 'pta-ui-enhancer-styles';
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
        
        console.log('✅ 自定义样式已添加');
    }

    /**
     * 检测是否为编程题页面
     */
    detectProgrammingPage() {
        // 检查页面中是否存在代码编辑器或编程题相关元素
        const codeEditors = document.querySelectorAll('[class*="code"], [class*="editor"], [class*="programming"], pre, code, textarea.monaco-editor');
        const hasCodeEditors = codeEditors.length > 0;
        
        // 检查页面URL或标题是否包含编程题关键词
        const pageText = document.body.innerText.toLowerCase();
        const hasProgrammingKeywords = pageText.includes('编程') || pageText.includes('代码') || 
                                     pageText.includes('程序') || pageText.includes('programming') ||
                                     pageText.includes('code') || pageText.includes('function');
        
        // 检查是否存在编程题特有的按钮或界面元素
        const programmingButtons = document.querySelectorAll('[class*="submit"], [class*="run"], [class*="compile"]');
        const hasProgrammingButtons = programmingButtons.length > 0;
        
        const isProgrammingPage = hasCodeEditors || hasProgrammingKeywords || hasProgrammingButtons;
        console.log(`🔍 编程题页面检测结果: ${isProgrammingPage} (编辑器:${hasCodeEditors}, 关键词:${hasProgrammingKeywords}, 按钮:${hasProgrammingButtons})`);
        
        return isProgrammingPage;
    }

    /**
     * 添加浮动工具栏（仅在检测到编程题时显示）
     */
    addFloatingToolbar() {
        if (this.toolbarAdded || document.getElementById('pta-floating-toolbar')) return;
        
        // 检查是否在编程题页面
        const isProgrammingPage = this.detectProgrammingPage();
        if (!isProgrammingPage) {
            console.log('📝 非编程题页面，不显示编程题工具栏');
            return;
        }
        
        const toolbar = document.createElement('div');
        toolbar.id = 'pta-floating-toolbar';
        toolbar.className = 'pta-floating-toolbar';
        
        toolbar.innerHTML = `
            <div class="pta-toolbar-header">
                <h3 class="pta-toolbar-title">PTA助手</h3>
                <button class="pta-toolbar-toggle" title="收起/展开">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 4l-4 4h8l-4-4z"/>
                    </svg>
                </button>
            </div>
            
            <div class="toolbar-content">
                <div class="pta-status-indicator">
                    <div class="pta-status-dot" id="pta-status-dot"></div>
                    <span id="pta-status-text">就绪</span>
                </div>
                
                <button class="pta-toolbar-btn" id="detect-programming-btn">
                    <span>🔍</span>
                    <span>检测编程题</span>
                    <span class="pta-toolbar-shortcut">Ctrl+Shift+P</span>
                </button>
                
                <button class="pta-toolbar-btn secondary" id="insert-template-btn">
                    <span>📝</span>
                    <span>插入模板</span>
                    <span class="pta-toolbar-shortcut">Ctrl+Shift+T</span>
                </button>
                
                <button class="pta-toolbar-btn secondary" id="search-answer-btn">
                    <span>🔎</span>
                    <span>搜索答案</span>
                    <span class="pta-toolbar-shortcut">Ctrl+Shift+S</span>
                </button>
                
                <button class="pta-toolbar-btn secondary" id="fill-answer-btn">
                    <span>🔄</span>
                    <span>填充答案</span>
                    <span class="pta-toolbar-shortcut">Ctrl+Shift+F</span>
                </button>
                
                <button class="pta-toolbar-btn danger" id="clear-editor-btn">
                    <span>🗑️</span>
                    <span>清空编辑器</span>
                    <span class="pta-toolbar-shortcut">Ctrl+Shift+C</span>
                </button>
            </div>
        `;
        
        document.body.appendChild(toolbar);
        
        // 添加事件监听
        this.addToolbarEventListeners(toolbar);
        
        // 使工具栏可拖拽
        this.makeToolbarDraggable(toolbar);
        
        this.toolbarAdded = true;
        console.log('✅ 浮动工具栏已添加');
    }

    /**
     * 添加工具栏事件监听
     */
    addToolbarEventListeners(toolbar) {
        // 收起/展开按钮
        const toggleBtn = toolbar.querySelector('.pta-toolbar-toggle');
        toggleBtn.addEventListener('click', () => {
            toolbar.classList.toggle('collapsed');
        });
        
        // 功能按钮
        const buttons = {
            'detect-programming-btn': () => this.handleDetectProgramming(),
            'insert-template-btn': () => this.handleInsertTemplate(),
            'search-answer-btn': () => this.handleSearchAnswer(),
            'fill-answer-btn': () => this.handleFillAnswer(),
            'clear-editor-btn': () => this.handleClearEditor()
        };
        
        Object.entries(buttons).forEach(([id, handler]) => {
            const btn = toolbar.querySelector(`#${id}`);
            if (btn) {
                btn.addEventListener('click', handler);
            }
        });
    }

    /**
     * 使工具栏可拖拽
     */
    makeToolbarDraggable(toolbar) {
        let isDragging = false;
        let startX, startY, startLeft, startTop;
        
        const header = toolbar.querySelector('.pta-toolbar-header');
        
        header.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = toolbar.offsetLeft;
            startTop = toolbar.offsetTop;
            
            header.style.cursor = 'grabbing';
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            toolbar.style.left = `${startLeft + deltaX}px`;
            toolbar.style.top = `${startTop + deltaY}px`;
            toolbar.style.right = 'auto';
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                header.style.cursor = 'grab';
            }
        });
        
        header.style.cursor = 'grab';
    }

    /**
     * 添加键盘快捷键
     */
    addKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            const key = this.getShortcutKey(e);
            const action = this.shortcuts[key];
            
            if (action && this[action]) {
                e.preventDefault();
                this[action]();
            }
        });
        
        console.log('✅ 键盘快捷键已添加');
    }

    /**
     * 获取快捷键字符串
     */
    getShortcutKey(e) {
        const parts = [];
        if (e.ctrlKey) parts.push('Ctrl');
        if (e.shiftKey) parts.push('Shift');
        if (e.altKey) parts.push('Alt');
        if (e.metaKey) parts.push('Meta');
        parts.push(e.key.toUpperCase());
        return parts.join('+');
    }

    /**
     * 添加右键菜单
     */
    addContextMenu() {
        document.addEventListener('contextmenu', (e) => {
            // 检查是否在代码编辑器区域
            const isInEditor = e.target.closest('.cm-editor') ||
                             e.target.closest('.CodeMirror') ||
                             e.target.closest('textarea') ||
                             e.target.closest('.codeEditor_CHvdZ');
            
            if (isInEditor) {
                e.preventDefault();
                this.showContextMenu(e.pageX, e.pageY);
            }
        });
        
        // 点击其他地方关闭菜单
        document.addEventListener('click', () => {
            this.hideContextMenu();
        });
    }

    /**
     * 显示右键菜单
     */
    showContextMenu(x, y) {
        this.hideContextMenu(); // 先隐藏已存在的菜单
        
        const menu = document.createElement('div');
        menu.id = 'pta-context-menu';
        menu.className = 'pta-context-menu';
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;
        
        menu.innerHTML = `
            <div class="pta-context-menu-item" data-action="insertTemplate">
                <span>📝</span>
                <span>插入代码模板</span>
            </div>
            <div class="pta-context-menu-item" data-action="searchAnswer">
                <span>🔎</span>
                <span>搜索答案</span>
            </div>
            <div class="pta-context-menu-separator"></div>
            <div class="pta-context-menu-item" data-action="clearEditor">
                <span>🗑️</span>
                <span>清空编辑器</span>
            </div>
            <div class="pta-context-menu-item" data-action="formatCode">
                <span>🎨</span>
                <span>格式化代码</span>
            </div>
        `;
        
        // 添加事件监听
        menu.addEventListener('click', (e) => {
            const item = e.target.closest('.pta-context-menu-item');
            if (item) {
                const action = item.dataset.action;
                this.handleContextMenuAction(action);
                this.hideContextMenu();
            }
        });
        
        document.body.appendChild(menu);
        
        // 调整位置，确保不超出屏幕
        const rect = menu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            menu.style.left = `${x - rect.width}px`;
        }
        if (rect.bottom > window.innerHeight) {
            menu.style.top = `${y - rect.height}px`;
        }
    }

    /**
     * 隐藏右键菜单
     */
    hideContextMenu() {
        const menu = document.getElementById('pta-context-menu');
        if (menu) {
            menu.remove();
        }
    }

    /**
     * 处理右键菜单动作
     */
    handleContextMenuAction(action) {
        switch (action) {
            case 'insertTemplate':
                this.handleInsertTemplate();
                break;
            case 'searchAnswer':
                this.handleSearchAnswer();
                break;
            case 'clearEditor':
                this.handleClearEditor();
                break;
            case 'formatCode':
                this.handleFormatCode();
                break;
        }
    }

    /**
     * 监听页面变化
     */
    observePageChanges() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    // 检查是否有新的编程题出现
                    this.checkForProgrammingQuestions();
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * 检查编程题
     */
    checkForProgrammingQuestions() {
        const programmingElements = document.querySelectorAll('.markdownBlock_tErSz, .CodingProblemAnswerForm_Qp8cD');
        
        programmingElements.forEach(element => {
            if (!element.classList.contains('pta-programming-highlight')) {
                const isProgramming = this.isProgrammingQuestion(element);
                if (isProgramming) {
                    element.classList.add('pta-programming-highlight');
                }
            }
        });
    }

    /**
     * 判断是否为编程题
     */
    isProgrammingQuestion(element) {
        const text = element.textContent.toLowerCase();
        const programmingKeywords = [
            '编程', '代码', '程序', '算法', '实现', '函数',
            '输入格式', '输出格式', '样例输入', '样例输出',
            'include', 'main', 'printf', 'scanf'
        ];
        
        return programmingKeywords.some(keyword => text.includes(keyword)) ||
               element.querySelector('.cm-editor') ||
               element.querySelector('.CodeMirror') ||
               element.querySelector('textarea');
    }

    /**
     * 显示通知
     */
    showNotification(title, message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `pta-notification ${type}`;
        
        const icons = {
            success: '✅',
            warning: '⚠️',
            error: '❌',
            info: 'ℹ️'
        };
        
        notification.innerHTML = `
            <span style="font-size: 18px;">${icons[type] || icons.info}</span>
            <div>
                <div style="font-weight: 600; margin-bottom: 4px;">${title}</div>
                <div style="font-size: 13px; opacity: 0.9;">${message}</div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // 自动移除
        setTimeout(() => {
            notification.style.animation = 'slideInDown 0.3s ease reverse';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, duration);
    }

    /**
     * 更新状态指示器
     */
    updateStatus(status, message) {
        const dot = document.getElementById('pta-status-dot');
        const text = document.getElementById('pta-status-text');
        
        if (dot && text) {
            dot.className = `pta-status-dot ${status}`;
            text.textContent = message;
        }
    }

    // ==================== 事件处理方法 ====================

    async detectProgramming() {
        this.updateStatus('', '检测中...');
        try {
            if (typeof window.programmingDetector !== 'undefined') {
                const result = await window.programmingDetector.detectProgrammingProblem();
                if (result.success) {
                    this.showNotification('检测成功', `发现编程题: ${result.metadata.title}`, 'success');
                    this.updateStatus('', '检测成功');
                } else {
                    this.showNotification('检测失败', result.error || '未检测到编程题', 'warning');
                    this.updateStatus('warning', '未检测到');
                }
            } else {
                this.showNotification('功能未就绪', '编程题检测器未加载', 'error');
                this.updateStatus('error', '功能未就绪');
            }
        } catch (error) {
            this.showNotification('检测失败', error.message, 'error');
            this.updateStatus('error', '检测失败');
        }
    }

    async handleDetectProgramming() {
        await this.detectProgramming();
    }

    async handleInsertTemplate() {
        this.updateStatus('', '插入模板...');
        try {
            if (typeof window.ptaCodeMirrorFiller !== 'undefined') {
                const template = `#include <stdio.h>

int main() {
    // TODO: 在这里实现具体功能
    
    return 0;
}`;
                const result = await window.ptaCodeMirrorFiller.fillCode(template);
                if (result.success) {
                    this.showNotification('模板插入成功', '基础C++模板已插入', 'success');
                    this.updateStatus('', '就绪');
                } else {
                    this.showNotification('插入失败', '未找到代码编辑器', 'error');
                    this.updateStatus('error', '插入失败');
                }
            } else {
                this.showNotification('功能未就绪', '代码填充器未加载', 'error');
                this.updateStatus('error', '功能未就绪');
            }
        } catch (error) {
            this.showNotification('插入失败', error.message, 'error');
            this.updateStatus('error', '插入失败');
        }
    }

    async handleSearchAnswer() {
        this.updateStatus('', '搜索答案...');
        try {
            // 这里可以集成答案搜索功能
            this.showNotification('搜索功能', '答案搜索功能开发中...', 'info');
            this.updateStatus('', '就绪');
        } catch (error) {
            this.showNotification('搜索失败', error.message, 'error');
            this.updateStatus('error', '搜索失败');
        }
    }

    async handleFillAnswer() {
        this.updateStatus('', '填充答案...');
        try {
            // 这里可以集成自动填充功能
            this.showNotification('填充功能', '自动填充功能开发中...', 'info');
            this.updateStatus('', '就绪');
        } catch (error) {
            this.showNotification('填充失败', error.message, 'error');
            this.updateStatus('error', '填充失败');
        }
    }

    async handleClearEditor() {
        this.updateStatus('', '清空编辑器...');
        try {
            if (typeof window.ptaCodeMirrorFiller !== 'undefined') {
                const result = await window.ptaCodeMirrorFiller.clearEditor();
                if (result.success) {
                    this.showNotification('清空成功', '编辑器已清空', 'success');
                    this.updateStatus('', '就绪');
                } else {
                    this.showNotification('清空失败', '未找到代码编辑器', 'error');
                    this.updateStatus('error', '清空失败');
                }
            } else {
                this.showNotification('功能未就绪', '代码填充器未加载', 'error');
                this.updateStatus('error', '功能未就绪');
            }
        } catch (error) {
            this.showNotification('清空失败', error.message, 'error');
            this.updateStatus('error', '清空失败');
        }
    }

    async handleFormatCode() {
        this.showNotification('格式化功能', '代码格式化功能开发中...', 'info');
    }

    // 快捷键处理方法
    insertTemplate() { this.handleInsertTemplate(); }
    searchAnswer() { this.handleSearchAnswer(); }
    fillAnswer() { this.handleFillAnswer(); }
    clearEditor() { this.handleClearEditor(); }
    toggleHighlight() {
        const highlighted = document.querySelectorAll('.pta-programming-highlight');
        if (highlighted.length > 0) {
            highlighted.forEach(el => el.classList.remove('pta-programming-highlight'));
            this.showNotification('高亮已关闭', '编程题高亮已关闭', 'info');
        } else {
            this.checkForProgrammingQuestions();
            const newHighlighted = document.querySelectorAll('.pta-programming-highlight');
            this.showNotification('高亮已开启', `已高亮 ${newHighlighted.length} 个编程题`, 'success');
        }
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PTAUIEnhancer;
} else if (typeof window !== 'undefined') {
    window.PTAUIEnhancer = PTAUIEnhancer;
}

// 创建全局实例
if (typeof window !== 'undefined') {
    // 等待页面加载后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.ptaUIEnhancer = new PTAUIEnhancer();
        });
    } else {
        window.ptaUIEnhancer = new PTAUIEnhancer();
    }
    
    console.log('✅ PTA UI增强器已加载');
}