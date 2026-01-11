// PTA插件WebSocket错误处理器
// 专门处理vendor.99c919eb3e087f5259a1.chunk.js中的WebSocket连接失败问题

class PTAWebSocketErrorHandler {
    constructor() {
        this.errorCount = 0;
        this.maxErrorCount = 10;
        this.lastErrorTime = 0;
        this.errorThreshold = 5000; // 5秒内错误阈值
        this.isHandling = false;
    }

    // 监控特定的WebSocket错误
    monitorSpecificWebSocketErrors() {
        const originalConsoleError = console.error;
        
        console.error = function(...args) {
            const errorMessage = args.join(' ');
            
            // 检查是否是vendor.99c919eb3e087f5259a1.chunk.js中的WebSocket错误
            if (errorMessage.includes('vendor.99c919eb3e087f5259a1.chunk.js') && 
                errorMessage.includes('WebSocket connection to') && 
                errorMessage.includes('wss://live.pintia.cn/event')) {
                
                console.warn('[PTA WebSocket处理器] 检测到特定WebSocket错误:', errorMessage);
                
                // 触发错误处理
                window.dispatchEvent(new CustomEvent('pta-specific-websocket-error', {
                    detail: { 
                        error: errorMessage,
                        timestamp: Date.now(),
                        url: 'wss://live.pintia.cn/event'
                    }
                }));
            }
            
            // 调用原始console.error
            originalConsoleError.apply(console, args);
        };
    }

    // 处理WebSocket错误
    handleWebSocketError(event) {
        if (this.isHandling) return;
        
        this.isHandling = true;
        const now = Date.now();
        
        // 检查错误频率
        if (now - this.lastErrorTime < this.errorThreshold) {
            this.errorCount++;
        } else {
            this.errorCount = 1;
        }
        
        this.lastErrorTime = now;
        
        console.log(`[PTA WebSocket处理器] WebSocket错误计数: ${this.errorCount}/${this.maxErrorCount}`);
        
        // 如果错误过多，采取相应措施
        if (this.errorCount >= this.maxErrorCount) {
            console.warn('[PTA WebSocket处理器] WebSocket错误过多，采取降级措施');
            this.activateFallbackMode();
        }
        
        this.isHandling = false;
    }

    // 激活降级模式
    activateFallbackMode() {
        console.log('[PTA WebSocket处理器] 激活WebSocket降级模式');
        
        // 这里可以添加降级逻辑，比如：
        // - 禁用某些依赖WebSocket的功能
        // - 切换到轮询模式
        // - 显示用户提示
        
        // 发送降级通知
        window.dispatchEvent(new CustomEvent('pta-websocket-fallback', {
            detail: { 
                reason: 'too_many_errors',
                errorCount: this.errorCount
            }
        }));
    }

    // 尝试修复WebSocket连接
    attemptWebSocketFix() {
        console.log('[PTA WebSocket处理器] 尝试修复WebSocket连接...');
        
        // 这里可以添加修复逻辑，比如：
        // - 重新创建WebSocket连接
        // - 修改连接参数
        // - 使用备用服务器
        
        // 由于这是PTA服务器的WebSocket，我们无法直接修复
        // 但可以提供更好的用户体验
        this.showUserNotification();
    }

    // 显示用户通知
    showUserNotification() {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: #ff9800;
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            z-index: 10000;
            font-size: 14px;
            max-width: 300px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `;
        
        notification.innerHTML = `
            <strong>PTA连接提示</strong><br>
            WebSocket连接不稳定，但插件功能正常<br>
            <small>这是PTA服务器的问题，不影响答题功能</small>
        `;
        
        document.body.appendChild(notification);
        
        // 5秒后自动隐藏
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    // 初始化错误处理器
    init() {
        console.log('[PTA WebSocket处理器] 初始化WebSocket错误处理器');
        
        this.monitorSpecificWebSocketErrors();
        
        // 监听特定WebSocket错误
        window.addEventListener('pta-specific-websocket-error', (event) => {
            this.handleWebSocketError(event);
        });
        
        // 页面加载后开始监控
        window.addEventListener('load', () => {
            setTimeout(() => {
                console.log('[PTA WebSocket处理器] 开始监控PTA WebSocket连接');
            }, 1000);
        });
        
        // 每30秒检查一次错误状态
        setInterval(() => {
            if (this.errorCount > 0) {
                console.log(`[PTA WebSocket处理器] 当前错误状态: ${this.errorCount}次错误`);
            }
        }, 30000);
    }
}

// 导出错误处理器
if (typeof window !== 'undefined') {
    window.PTAWebSocketErrorHandler = PTAWebSocketErrorHandler;
}
