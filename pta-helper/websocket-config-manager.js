// PTA插件WebSocket配置管理器
// 管理WebSocket相关配置和自动拉取

class PTAWebSocketConfigManager {
    constructor() {
        this.config = {
            enabled: true,
            maxRetries: 3,
            retryDelay: 2000,
            heartbeatInterval: 30000,
            errorThreshold: 5,
            fallbackEnabled: true
        };
        this.isInitialized = false;
    }

    // 拉取配置
    async pullConfiguration() {
        console.log('[PTA配置管理器] 开始拉取WebSocket配置...');
        
        try {
            // 尝试从本地存储获取配置
            const savedConfig = await this.getSavedConfig();
            if (savedConfig) {
                this.config = { ...this.config, ...savedConfig };
                console.log('[PTA配置管理器] 已加载保存的配置');
            }
            
            // 应用配置
            this.applyConfiguration();
            
            console.log('[PTA配置管理器] 配置拉取完成:', this.config);
            
            return this.config;
        } catch (error) {
            console.error('[PTA配置管理器] 配置拉取失败:', error);
            return this.config; // 返回默认配置
        }
    }

    // 获取保存的配置
    async getSavedConfig() {
        return new Promise((resolve) => {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                chrome.storage.local.get(['ptaWebSocketConfig'], (result) => {
                    resolve(result.ptaWebSocketConfig);
                });
            } else {
                // 使用localStorage作为备选
                const saved = localStorage.getItem('ptaWebSocketConfig');
                resolve(saved ? JSON.parse(saved) : null);
            }
        });
    }

    // 保存配置
    async saveConfiguration(config) {
        try {
            this.config = { ...this.config, ...config };
            
            if (typeof chrome !== 'undefined' && chrome.storage) {
                await new Promise((resolve) => {
                    chrome.storage.local.set({ ptaWebSocketConfig: this.config }, resolve);
                });
            } else {
                localStorage.setItem('ptaWebSocketConfig', JSON.stringify(this.config));
            }
            
            console.log('[PTA配置管理器] 配置已保存:', this.config);
        } catch (error) {
            console.error('[PTA配置管理器] 配置保存失败:', error);
        }
    }

    // 应用配置
    applyConfiguration() {
        console.log('[PTA配置管理器] 应用WebSocket配置...');
        
        // 这里可以应用配置到各个组件
        // 例如：设置重试次数、延迟时间等
        
        // 发送配置更新事件
        window.dispatchEvent(new CustomEvent('pta-websocket-config-updated', {
            detail: { config: this.config }
        }));
    }

    // 自动优化配置
    autoOptimize() {
        console.log('[PTA配置管理器] 开始自动优化配置...');
        
        // 根据错误频率自动调整配置
        this.adaptiveConfiguration();
        
        // 定期重新拉取配置
        setInterval(async () => {
            await this.pullConfiguration();
        }, 300000); // 每5分钟重新拉取一次
    }

    // 自适应配置
    adaptiveConfiguration() {
        // 监听错误事件来自动调整配置
        window.addEventListener('pta-specific-websocket-error', (event) => {
            // 根据错误频率调整配置
            this.adjustConfigBasedOnErrors();
        });
    }

    // 根据错误调整配置
    adjustConfigBasedOnErrors() {
        // 这里可以实现根据错误频率自动调整配置的逻辑
        // 例如：增加重试延迟、启用降级模式等
        
        console.log('[PTA配置管理器] 根据错误情况调整配置...');
    }

    // 初始化配置管理器
    async init() {
        if (this.isInitialized) return;
        
        console.log('[PTA配置管理器] 初始化WebSocket配置管理器');
        
        await this.pullConfiguration();
        this.autoOptimize();
        
        this.isInitialized = true;
        
        // 发送初始化完成事件
        window.dispatchEvent(new CustomEvent('pta-websocket-config-ready', {
            detail: { config: this.config }
        }));
    }
}

// 导出配置管理器
if (typeof window !== 'undefined') {
    window.PTAWebSocketConfigManager = PTAWebSocketConfigManager;
}
