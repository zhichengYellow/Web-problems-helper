// Web 题目助手弹出页面脚本
document.addEventListener('DOMContentLoaded', function() {
    const detectBtn = document.getElementById('detectBtn');
    const autoFillBtn = document.getElementById('autoFillBtn');
    const showAnswersBtn = document.getElementById('showAnswersBtn');
    const submitBtn = document.getElementById('submitBtn');
    const result = document.getElementById('result');
    const pageStatus = document.getElementById('pageStatus');
    const questionInfo = document.getElementById('questionInfo');
    const autoMode = document.getElementById('autoMode');
    const confirmSubmit = document.getElementById('confirmSubmit');
    const apiConfigBtn = document.getElementById('apiConfigBtn');
    const apiHelpBtn = document.getElementById('apiHelpBtn');
    const apiStatus = document.getElementById('apiStatus');

    let currentTab = null;
// 发送消息到content script
async function sendMessageToContent(action, data = {}) {
    return new Promise((resolve, reject) => {
        if (!currentTab || !currentTab.id) {
            reject(new Error('当前标签页不可用'));
            return;
        }
        
        chrome.tabs.sendMessage(currentTab.id, { action, ...data }, (response) => {
            if (chrome.runtime.lastError) {
                console.warn(`发送消息失败: ${chrome.runtime.lastError.message}`);
                // 尝试重新注入内容脚本
                injectContentScript().then(() => {
                    // 重新发送消息
                    chrome.tabs.sendMessage(currentTab.id, { action, ...data }, (response) => {
                        if (chrome.runtime.lastError) {
                            reject(new Error(chrome.runtime.lastError.message));
                        } else {
                            resolve(response);
                        }
                    });
                }).catch(err => {
                    reject(new Error(`无法注入内容脚本: ${err.message}`));
                });
            } else {
                resolve(response);
            }
        });
    });
}

// 注入内容脚本
async function injectContentScript() {
    return new Promise((resolve, reject) => {
        if (!currentTab || !currentTab.id) {
            reject(new Error('当前标签页不可用'));
            return;
        }
        
        chrome.scripting.executeScript({
            target: { tabId: currentTab.id },
            files: ['content.js']
        }, () => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else {
                console.log('✅ 内容脚本重新注入成功');
                resolve();
            }
        });
    });
}

// 检测页面状态
async function detectPageStatus() {
    try {
        const response = await sendMessageToContent('detectPageType');
        if (response && response.success) {
            questionInfo.textContent = `检测到: ${response.pageType}`;
            enableButtons();
        } else {
            questionInfo.textContent = '无法检测页面类型';
            disableButtons();
        }
    } catch (error) {
        console.error('检测页面状态失败:', error);
        questionInfo.textContent = '检测失败: ' + error.message;
        disableButtons();
    }
}

// 检测题目
async function detectQuestions() {
    try {
        result.textContent = '正在检测题目...';
        const response = await sendMessageToContent('detectQuestions');
        if (response && response.success) {
            result.textContent = `检测到 ${response.count} 道题目`;
            questionInfo.textContent = `题目类型: ${response.types.join(', ')}`;
        } else {
            result.textContent = '检测题目失败';
        }
    } catch (error) {
        console.error('检测题目失败:', error);
        result.textContent = '检测失败: ' + error.message;
    }
}
// 发送消息到content script
async function sendMessageToContent(action, data = {}) {
    return new Promise((resolve, reject) => {
        if (!currentTab || !currentTab.id) {
            reject(new Error('当前标签页不可用'));
            return;
        }
        
        chrome.tabs.sendMessage(currentTab.id, { action, ...data }, (response) => {
            if (chrome.runtime.lastError) {
                console.warn(`发送消息失败: ${chrome.runtime.lastError.message}`);
                // 尝试重新注入内容脚本
                injectContentScript().then(() => {
                    // 重新发送消息
                    chrome.tabs.sendMessage(currentTab.id, { action, ...data }, (response) => {
                        if (chrome.runtime.lastError) {
                            reject(new Error(chrome.runtime.lastError.message));
                        } else {
                            resolve(response);
                        }
                    });
                }).catch(err => {
                    reject(new Error(`无法注入内容脚本: ${err.message}`));
                });
            } else {
                resolve(response);
            }
        });
    });
}

// 注入内容脚本
async function injectContentScript() {
    return new Promise((resolve, reject) => {
        if (!currentTab || !currentTab.id) {
            reject(new Error('当前标签页不可用'));
            return;
        }
        
        chrome.scripting.executeScript({
            target: { tabId: currentTab.id },
            files: ['content.js']
        }, () => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else {
                console.log('✅ 内容脚本重新注入成功');
                resolve();
            }
        });
    });
}

// 检测页面状态
async function detectPageStatus() {
    try {
        const response = await sendMessageToContent('detectPageType');
        if (response && response.success) {
            questionInfo.textContent = `检测到: ${response.pageType}`;
            enableButtons();
        } else {
            questionInfo.textContent = '无法检测页面类型';
            disableButtons();
        }
    } catch (error) {
        console.error('检测页面状态失败:', error);
        questionInfo.textContent = '检测失败: ' + error.message;
        disableButtons();
    }
}

// 检测题目
async function detectQuestions() {
    try {
        result.textContent = '正在检测题目...';
        const response = await sendMessageToContent('detectQuestions');
        if (response && response.success) {
            result.textContent = `检测到 ${response.count} 道题目`;
            questionInfo.textContent = `题目类型: ${response.types.join(', ')}`;
        } else {
            result.textContent = '检测题目失败';
        }
    } catch (error) {
        console.error('检测题目失败:', error);
        result.textContent = '检测失败: ' + error.message;
    }
}

    // 初始化
    init();

    async function init() {
        try {
            // 获取当前标签页
            [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // 检查是否在 Pintia 页面
            if (isPintiaPage(currentTab.url)) {
                pageStatus.textContent = '✅ 已检测到 Pintia 页面';
                pageStatus.style.color = '#4caf50';
                
                // 检测页面状态
                await detectPageStatus();
            } else {
                pageStatus.textContent = '❌ 请在 Pintia 页面使用此插件';
                pageStatus.style.color = '#f44336';
                disableButtons();
            }

            // 加载设置
            await loadSettings();
        } catch (error) {
            console.error('初始化失败:', error);
            pageStatus.textContent = '❌ 初始化失败';
        }
    }

    // 检测题目按钮
    detectBtn.addEventListener('click', async function() {
        await detectQuestions();
    });

    // 自动填充按钮
    autoFillBtn.addEventListener('click', async function() {
        await autoFillAnswers();
    });

    // 显示答案按钮
    showAnswersBtn.addEventListener('click', async function() {
        await showAnswersOnly();
    });

    // 提交答案按钮
    submitBtn.addEventListener('click', async function() {
        await submitAnswers();
    });

    // 设置变更监听
    autoMode.addEventListener('change', saveSettings);
    confirmSubmit.addEventListener('change', saveSettings);
    apiConfigBtn.addEventListener('click', openAPIConfig);
    apiHelpBtn.addEventListener('click', showHelpModal);

    // 检测页面状态
    async function detectPageStatus() {
        try {
            const response = await chrome.tabs.sendMessage(currentTab.id, {
                action: 'detectPageType'
            });

            if (response.success) {
                updatePageStatus(response.pageType, response.info);
            }
        } catch (error) {
            console.error('检测页面状态失败:', error);
        }
    }

    // 检测题目
    async function detectQuestions() {
        showResult('正在检测题目...', 'info');
        
        try {
            const response = await chrome.tabs.sendMessage(currentTab.id, {
                action: 'detectQuestions'
            });

            if (response.success) {
                showResult(`检测到 ${response.questions.length} 道题目`, 'success');
                displayQuestionInfo(response.questions);
            } else {
                showResult('未检测到题目', 'error');
            }
        } catch (error) {
            console.error('检测题目失败:', error);
            showResult('检测题目失败', 'error');
        }
    }

    // 自动填充答案
    async function autoFillAnswers() {
        showResult('正在自动填充答案...', 'info');
        
        try {
            const response = await chrome.tabs.sendMessage(currentTab.id, {
                action: 'autoFillAnswers'
            });

            if (response.success) {
                showResult(`已填充 ${response.filledCount} 道题目`, 'success');
            } else {
                showResult('自动填充失败: ' + response.error, 'error');
            }
        } catch (error) {
            console.error('自动填充失败:', error);
            showResult('自动填充失败', 'error');
        }
    }

    // 显示答案（不填充）
    async function showAnswersOnly() {
        showResult('正在分析题目...', 'info');
        
        try {
            const response = await chrome.tabs.sendMessage(currentTab.id, {
                action: 'getAnswersOnly'
            });

            if (response.success) {
                showResult(`已分析 ${response.answeredCount}/${response.totalCount} 道题目`, 'success');
                // 答案将在content script中以模态框形式显示
            } else {
                showResult('分析失败: ' + response.error, 'error');
            }
        } catch (error) {
            console.error('分析题目失败:', error);
            showResult('分析题目失败', 'error');
        }
    }

    // 提交答案
    async function submitAnswers() {
        if (confirmSubmit.checked) {
            if (!confirm('确定要提交答案吗？')) {
                return;
            }
        }

        showResult('正在提交答案...', 'info');
        
        try {
            const response = await chrome.tabs.sendMessage(currentTab.id, {
                action: 'submitAnswers'
            });

            if (response.success) {
                showResult('答案提交成功！', 'success');
            } else {
                showResult('提交失败: ' + response.error, 'error');
            }
        } catch (error) {
            console.error('提交答案失败:', error);
            showResult('提交答案失败', 'error');
        }
    }

    // 工具函数
    function isPintiaPage(url) {
        return url && url.includes('pintia.cn');
    }

    function disableButtons() {
        detectBtn.disabled = true;
        autoFillBtn.disabled = true;
        submitBtn.disabled = true;
    }

    function updatePageStatus(pageType, info) {
        let statusText = '';
        let statusIcon = '';
        
        switch (pageType) {
            case 'exam':
                statusText = '考试页面';
                statusIcon = '📝';
                break;
            case 'practice':
                statusText = '练习页面';
                statusIcon = '💡';
                break;
            case 'homework':
                statusText = '作业页面';
                statusIcon = '📚';
                break;
            case 'problem':
                statusText = '单题页面';
                statusIcon = '📄';
                break;
            default:
                statusText = 'Pintia 页面';
                statusIcon = '🌐';
        }
        
        if (info) {
            statusText += ` - ${info}`;
        }
        
        // 添加状态指示器
        const indicator = document.createElement('span');
        indicator.className = 'status-indicator ready';
        
        pageStatus.innerHTML = '';
        pageStatus.appendChild(indicator);
        pageStatus.appendChild(document.createTextNode(`${statusIcon} ${statusText}`));
    }

    function displayQuestionInfo(questions) {
        if (questions.length === 0) {
            questionInfo.style.display = 'none';
            return;
        }

        let infoHtml = '<strong>检测到的题目:</strong><br>';
        questions.forEach((q, index) => {
            infoHtml += `${index + 1}. ${q.type}: ${q.title.substring(0, 30)}...<br>`;
        });

        questionInfo.innerHTML = infoHtml;
        questionInfo.classList.add('show');
    }

    function showResult(message, type) {
        result.textContent = message;
        result.className = 'result show';
        
        // 添加状态指示器
        const indicator = document.createElement('span');
        indicator.className = `status-indicator ${type}`;
        result.insertBefore(indicator, result.firstChild);
        
        if (type === 'success') {
            result.style.backgroundColor = '#e8f5e8';
            result.style.color = '#2e7d32';
            result.style.borderLeftColor = '#4caf50';
        } else if (type === 'error') {
            result.style.backgroundColor = '#ffebee';
            result.style.color = '#c62828';
            result.style.borderLeftColor = '#f44336';
        } else {
            result.style.backgroundColor = '#e3f2fd';
            result.style.color = '#1976d2';
            result.style.borderLeftColor = '#2196f3';
        }
        
        // 自动隐藏结果
        setTimeout(() => {
            result.classList.remove('show');
        }, 5000);
    }

    async function loadSettings() {
        const settings = await chrome.storage.local.get(['autoMode', 'confirmSubmit', 'apiConfig']);
        autoMode.checked = settings.autoMode || false;
        confirmSubmit.checked = settings.confirmSubmit !== false; // 默认为true
        
        // 加载API状态
        await updateAPIStatus();
    }

    async function saveSettings() {
        await chrome.storage.local.set({
            autoMode: autoMode.checked,
            confirmSubmit: confirmSubmit.checked
        });
    }
    
    // 更新API状态显示
    async function updateAPIStatus() {
        try {
            const response = await chrome.tabs.sendMessage(currentTab.id, {
                action: 'getAPIStatus'
            });
            
            if (response && response.success) {
                const status = response.status;
                apiStatus.textContent = status.enabled ? 
                    `✅ API已启用 (${status.hasKey ? '密钥有效' : '无密钥'})` : 
                    '❌ API未启用';
                apiStatus.style.color = status.enabled ? '#4caf50' : '#f44336';
            }
        } catch (error) {
            console.error('获取API状态失败:', error);
            apiStatus.textContent = '❌ 状态未知';
            apiStatus.style.color = '#ff9800';
        }
    }
    
    // 打开API配置页面
    function openAPIConfig() {
        try {
            chrome.tabs.create({
                url: chrome.runtime.getURL('api-config.html')
            });
        } catch (error) {
            console.error('打开API配置页面失败:', error);
            showResult('无法打开配置页面', 'error');
        }
    }
    
    // 显示新手指南模态框
    function showHelpModal() {
        // 移除现有的模态框
        const existingModal = document.querySelector('.help-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // 创建新手指南模态框
        const modal = document.createElement('div');
        modal.className = 'help-modal';
        modal.innerHTML = `
            <div class="help-content">
                <div class="help-header">
                    <h2>🚀 新手指南</h2>
                    <p>快速上手Web 题目助手的AI服务</p>
                </div>
                
                <div class="help-steps">
                    <div class="help-step">
                        <div class="step-number">1</div>
                        <div class="step-content">
                            <h4>获取API密钥</h4>
                            <p>访问支持的AI服务商（如OpenAI、Claude等）官网，注册账号并获取API密钥。推荐使用免费的API服务。</p>
                        </div>
                    </div>
                    
                    <div class="help-step">
                        <div class="step-number">2</div>
                        <div class="step-content">
                            <h4>配置API服务</h4>
                            <p>点击"配置AI服务"按钮，输入您的API密钥和服务地址，然后测试连接是否正常。</p>
                        </div>
                    </div>
                    
                    <div class="help-step">
                        <div class="step-number">3</div>
                        <div class="step-content">
                            <h4>开始使用</h4>
                            <p>配置完成后，在 Pintia 页面使用"检测题目"和"显示答案"功能，AI将为您提供更准确的答案。</p>
                        </div>
                    </div>
                    
                    <div class="help-step">
                        <div class="step-number">💡</div>
                        <div class="step-content">
                            <h4>小贴士</h4>
                            <p>• 首次使用建议先测试连接<br>
                               • AI答案仅供参考，请结合实际情况<br>
                               • 可随时在设置中关闭AI服务</p>
                        </div>
                    </div>
                </div>
                
                <div class="help-footer">
                    <button class="btn-close-help">我知道了</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 添加事件监听器
        const closeBtn = modal.querySelector('.btn-close-help');
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        });
        
        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
                setTimeout(() => modal.remove(), 300);
            }
        });
        
        // 显示模态框
        setTimeout(() => modal.classList.add('show'), 100);
    }
});