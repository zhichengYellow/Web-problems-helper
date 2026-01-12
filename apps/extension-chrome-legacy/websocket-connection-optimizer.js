// Web 题目助手 WebSocket 连接优化器
// 优化 wss://live.pintia.cn/event 连接

class WPHWebSocketOptimizer {
    constructor() {
        this.originalWebSocket = null;
        this.optimizedConnections = new Map();
        this.connectionAttempts = 0;
        this.maxAttempts = 3;
    }

    // 优化WebSocket构造函数
    optimizeWebSocketConstructor() {
        this.originalWebSocket = window.WebSocket;
        
        const self = this;
        
        window.WebSocket = function(url, protocols) {
            const ws = new self.originalWebSocket(url, protocols);
            
            // 如果是 Pintia 的特定 WebSocket 连接
            if (url === 'wss://live.pintia.cn/event') {
                console.log('[Web 题目助手 WebSocket优化器] 优化 WebSocket 连接:', url);
                
                // 存储连接信息
                const connectionId = self.connectionAttempts++;
                self.optimizedConnections.set(connectionId, {
                    ws: ws,
                    url: url,
                    createdAt: Date.now(),
                    status: 'connecting'
                });
                
                // 添加优化的事件监听器
                self.addOptimizedEventListeners(ws, connectionId);
            }
            
            return ws;
        };
        
        // 保持原型链
        window.WebSocket.prototype = this.originalWebSocket.prototype;
    }

    // 添加优化的事件监听器
    addOptimizedEventListeners(ws, connectionId) {
        const connection = this.optimizedConnections.get(connectionId);
        if (!connection) return;
        
        // 优化open事件
        ws.addEventListener('open', (event) => {
            connection.status = 'connected';
            console.log('[Web 题目助手 WebSocket优化器] WebSocket连接成功');
            
            // 发送连接成功事件
            window.dispatchEvent(new CustomEvent('wph-websocket-connected', {
                detail: { connectionId, url: connection.url }
            }));
        });
        
        // 优化error事件
        ws.addEventListener('error', (error) => {
            connection.status = 'error';
            console.warn('[Web 题目助手 WebSocket优化器] WebSocket连接错误:', error);
            
            // 发送连接错误事件
            window.dispatchEvent(new CustomEvent('wph-websocket-error-optimized', {
                detail: { 
                    connectionId, 
                    url: connection.url, 
                    error: error 
                }
            }));
            
            // 尝试自动恢复
            this.attemptRecovery(connectionId);
        });
        
        // 优化close事件
        ws.addEventListener('close', (event) => {
            connection.status = 'closed';
            console.log('[Web 题目助手 WebSocket优化器] WebSocket连接关闭:', event.code, event.reason);
            
            // 清理连接记录
            setTimeout(() => {
                this.optimizedConnections.delete(connectionId);
            }, 5000);
        });
        
        // 添加心跳检测
        this.addHeartbeat(ws, connectionId);
    }

    // 添加心跳检测
    addHeartbeat(ws, connectionId) {
        let heartbeatInterval;
        
        ws.addEventListener('open', () => {
            // 每30秒发送一次心跳
            heartbeatInterval = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    try {
                        ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
                    } catch (error) {
                        console.warn('[Web 题目助手 WebSocket优化器] 心跳发送失败:', error);
                        clearInterval(heartbeatInterval);
                    }
                }
            }, 30000);
        });
        
        ws.addEventListener('close', () => {
            if (heartbeatInterval) {
                clearInterval(heartbeatInterval);
            }
        });
    }

    // 尝试恢复连接
    attemptRecovery(connectionId) {
        const connection = this.optimizedConnections.get(connectionId);
        if (!connection || connection.recoveryAttempts >= this.maxAttempts) return;
        
        connection.recoveryAttempts = (connection.recoveryAttempts || 0) + 1;
        
        console.log(`[Web 题目助手 WebSocket优化器] 尝试恢复连接 (${connection.recoveryAttempts}/${this.maxAttempts})`);
        
        // 延迟重连
        setTimeout(() => {
            if (connection.ws.readyState === WebSocket.CLOSED) {
                console.log('[Web 题目助手 WebSocket优化器] 执行重连...');
                // 这里可以添加重连逻辑
            }
        }, connection.recoveryAttempts * 2000); // 指数退避
    }

    // 获取连接状态
    getConnectionStatus() {
        const status = {
            totalConnections: this.optimizedConnections.size,
            connected: 0,
            connecting: 0,
            error: 0,
            closed: 0
        };
        
        for (const connection of this.optimizedConnections.values()) {
            status[connection.status]++;
        }
        
        return status;
    }

    // 初始化优化器
    init() {
        console.log('[Web 题目助手 WebSocket优化器] 初始化WebSocket连接优化器');
        
        this.optimizeWebSocketConstructor();
        
        // 定期报告连接状态
        setInterval(() => {
            const status = this.getConnectionStatus();
            if (status.totalConnections > 0) {
                console.log('[Web 题目助手 WebSocket优化器] 连接状态报告:', status);
            }
        }, 60000); // 每分钟报告一次
        
        // 页面卸载时清理
        window.addEventListener('beforeunload', () => {
            this.optimizedConnections.clear();
        });
    }
}

// 导出优化器
if (typeof window !== 'undefined') {
    window.WPHWebSocketOptimizer = WPHWebSocketOptimizer;
}
