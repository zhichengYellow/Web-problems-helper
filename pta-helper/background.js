// 后台脚本 - Service Worker
console.log('Chrome插件后台脚本已启动');

// 插件安装时的处理
chrome.runtime.onInstalled.addListener((details) => {
    console.log('插件已安装/更新:', details.reason);
    
    if (details.reason === 'install') {
        // 首次安装时的初始化
        chrome.storage.local.set({
            installTime: new Date().toISOString(),
            version: chrome.runtime.getManifest().version
        });
        
        console.log('插件首次安装完成');
    }
});

// 监听来自content script或popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('后台脚本收到消息:', request);
    
    switch (request.action) {
        case 'getData':
            // 处理数据请求
            handleDataRequest(request, sendResponse);
            break;
        case 'saveData':
            // 处理数据保存
            handleDataSave(request, sendResponse);
            break;
        case 'apiRequest':
            // 处理API请求（解决CORS问题）
            handleAPIRequest(request, sendResponse);
            break;
        case 'hunyuanRequest':
            // 处理hunyuan API请求
            handleHunyuanRequest(request, sendResponse);
            break;
        case 'testHunyuanConnection':
            // 处理混元AI连接测试（后端托管模式）
            handleHunyuanTestWithBackend(request, sendResponse);
            break;
        case 'backendHealthCheck':
            // 检测本地后端服务连通性（例如 http://localhost:3001/health）
            handleBackendHealthCheck(request, sendResponse);
            break;
        case 'zhixunFallback':
            // 处理知寻题库备用方案
            handleZhixunFallback(request, sendResponse);
            break;
        default:
            sendResponse({ error: '未知的操作类型' });
    }
    
    return true; // 保持消息通道开放
});

// 处理数据请求
async function handleDataRequest(request, sendResponse) {
    try {
        const data = await chrome.storage.local.get(request.keys || null);
        sendResponse({ success: true, data: data });
    } catch (error) {
        console.error('获取数据失败:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// 检测本地后端服务连通性
async function handleBackendHealthCheck(request, sendResponse) {
    try {
        const url = request.url;
        if (!url) {
            sendResponse({ success: false, error: 'Missing url' });
            return;
        }

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        const contentType = response.headers.get('content-type') || '';
        const body = contentType.includes('application/json')
            ? await response.json()
            : await response.text();

        if (!response.ok) {
            sendResponse({
                success: false,
                error: `HTTP ${response.status}: ${response.statusText}`,
                data: body
            });
            return;
        }

        sendResponse({
            success: true,
            data: body
        });
    } catch (error) {
        sendResponse({
            success: false,
            error: error.message || 'Failed to fetch'
        });
    }
}

// 处理数据保存
async function handleDataSave(request, sendResponse) {
    try {
        await chrome.storage.local.set(request.data);
        sendResponse({ success: true });
    } catch (error) {
        console.error('保存数据失败:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// 处理API请求（通过background script解决CORS问题）
async function handleAPIRequest(request, sendResponse) {
    try {
        console.log('处理API请求:', request.url);
        
        // 特殊处理知寻题库API请求
        let url = request.url;
        let headers = request.options?.headers || {};
        let method = request.options?.method || 'GET';
        let body = request.options?.body;

        // 安全收敛：禁用扩展侧直连腾讯云（应统一走本地 Java 后端）
        if (typeof url === 'string' && url.includes('tencentcloudapi.com')) {
            sendResponse({
                success: false,
                error: '已禁用直连腾讯云API：请启动本地 Java 后端并使用 http://localhost:3001/api/chat'
            });
            return;
        }
        
        // 如果是知寻题库API，添加必要的请求头
        if (url.includes('api.wkexam.com')) {
            headers = {
                ...headers,
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://pintia.cn/',
                'Origin': 'https://pintia.cn'
            };
            
            // 知寻题库API可能需要特定的Content-Type
            if (method === 'POST') {
                headers['Content-Type'] = 'application/json';
            }
        }
        
        const response = await fetch(url, {
            method: method,
            headers: headers,
            body: body
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // 根据Content-Type处理响应
        const contentType = response.headers.get('content-type');
        let data;
        
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        sendResponse({ success: true, data: data });
    } catch (error) {
        console.error('API请求失败:', error);
        
        // 特殊处理知寻题库API的错误
        let errorMessage = error.message;
        let details = '请检查网络连接和API配置';
        
        if (request.url.includes('api.wkexam.com')) {
            if (error.message.includes('CORS') || error.message.includes('Origin')) {
                errorMessage = '知寻题库API CORS策略阻止了请求';
                details = '建议使用服务器端代理或联系知寻题库API提供商启用CORS';
            } else if (error.message.includes('403')) {
                errorMessage = '知寻题库API访问被拒绝';
                details = '请检查token是否有效或已过期';
            }
        }
        
        sendResponse({ 
            success: false, 
            error: errorMessage,
            details: details
        });
    }
}

// 处理 hunyuan API 请求（已禁用直连腾讯云）
async function handleHunyuanRequest(request, sendResponse) {
    try {
        console.warn('已禁用 hunyuanRequest：请使用本地 Java 后端 /api/chat');
        sendResponse({
            success: false,
            error: '已禁用浏览器端直连腾讯云混元 API，请启动本地 Java 后端并使用 http://localhost:3001/api/chat'
        });
    } catch (error) {
        console.error('hunyuan API请求失败:', error);
        sendResponse({ 
            success: false, 
            error: error.message
        });
    }
}

// 处理混元AI连接测试（后端托管模式）
async function handleHunyuanTestWithBackend(request, sendResponse) {
    try {
        const cfg = request.config || {};
        const backendUrl = cfg.backendUrl || 'http://localhost:3001/api/chat';

        let healthUrl;
        try {
            const u = new URL(backendUrl);
            healthUrl = `${u.origin}/health`;
        } catch (e) {
            healthUrl = 'http://localhost:3001/health';
        }

        const response = await fetch(healthUrl, { method: 'GET', headers: { Accept: 'application/json' } });
        const data = await response.json().catch(() => null);
        if (!response.ok) {
            sendResponse({ success: false, error: `HTTP ${response.status}: ${response.statusText}`, data });
            return;
        }

        sendResponse({
            success: true,
            message: '后端服务连接成功',
            result: data
        });
        
    } catch (error) {
        console.error('混元AI测试失败:', error);
        sendResponse({ success: false, error: error.message || 'Failed to fetch' });
    }
}

// 知寻题库API备用方案处理
async function handleZhixunFallback(request, sendResponse) {
    try {
        console.log('处理知寻题库备用方案请求:', request.url);
        
        // 方案1: 使用CORS代理服务
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(request.url)}`;
        const response = await fetch(proxyUrl, {
            method: request.options?.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        sendResponse({ success: true, data: data });
        
    } catch (error) {
        console.error('知寻题库备用方案失败:', error);
        
        // 方案2: 尝试JSONP方式（如果支持）
        try {
            if (request.url.includes('?')) {
                const jsonpUrl = request.url + '&callback=jsonpCallback';
                const jsonpResponse = await fetch(jsonpUrl);
                const text = await jsonpResponse.text();
                
                // 尝试解析JSONP响应
                if (text.startsWith('jsonpCallback(')) {
                    const jsonData = JSON.parse(text.substring(14, text.length - 1));
                    sendResponse({ success: true, data: jsonData });
                    return;
                }
            }
        } catch (jsonpError) {
            console.warn('JSONP方案也失败:', jsonpError);
        }
        
        sendResponse({ 
            success: false, 
            error: '知寻题库API所有备用方案都失败',
            details: '请检查网络连接或联系知寻题库API提供商'
        });
    }
}


// 标签页更新监听
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        console.log('页面加载完成:', tab.url);
        // 在这里可以执行页面加载完成后的操作
    }
});

// 插件图标点击处理（如果需要的话）
chrome.action.onClicked.addListener((tab) => {
    console.log('插件图标被点击，当前标签页:', tab.url);
    // 这里可以添加图标点击的处理逻辑
});