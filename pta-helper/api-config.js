// 腾讯云混元AI配置页面脚本（修复版 - 解决CORS和扩展上下文问题）
document.addEventListener('DOMContentLoaded', function() {
    const apiEnabled = document.getElementById('apiEnabled');
    const apiEnabledLabel = document.getElementById('apiEnabledLabel');
    const secretId = document.getElementById('secretId');
    const secretKey = document.getElementById('secretKey');
    const region = document.getElementById('region');
    const togglePasswordBtn = document.querySelector('.toggle-password-btn');
    const testConnection = document.getElementById('testConnection');
    const apiTestResult = document.getElementById('apiTestResult');
    const saveConfig = document.getElementById('saveConfig');
    const clearCache = document.getElementById('clearCache');
    const resetConfig = document.getElementById('resetConfig');

    // 简单的加密/解密工具
    const CryptoUtils = {
        key: 'pta-helper-secure-v1',
        
        encrypt(text) {
            if (!text) return '';
            try {
                // 简单的XOR混淆 + Base64
                let result = '';
                for (let i = 0; i < text.length; i++) {
                    result += String.fromCharCode(text.charCodeAt(i) ^ this.key.charCodeAt(i % this.key.length));
                }
                return btoa(result);
            } catch (e) {
                console.error('加密失败:', e);
                return text;
            }
        },

        decrypt(text) {
            if (!text) return '';
            try {
                const decoded = atob(text);
                let result = '';
                for (let i = 0; i < decoded.length; i++) {
                    result += String.fromCharCode(decoded.charCodeAt(i) ^ this.key.charCodeAt(i % this.key.length));
                }
                return result;
            } catch (e) {
                // 如果解密失败，可能原本就是明文
                return text;
            }
        }
    };

    // 加载现有配置
    loadConfig();

    // 启用/禁用切换
    apiEnabled.addEventListener('change', function() {
        apiEnabledLabel.textContent = this.checked ? '启用' : '禁用';
        updateFormState();
    });

    // 密钥显示/隐藏切换
    togglePasswordBtn.addEventListener('click', function() {
        const isPassword = secretKey.type === 'password';
        secretKey.type = isPassword ? 'text' : 'password';
        togglePasswordBtn.textContent = isPassword ? '🙈' : '👁️';
    });

    // 测试连接
    testConnection.addEventListener('click', async function() {
        await testAPIConnection();
    });

    // 保存配置
    saveConfig.addEventListener('click', async function() {
        await saveAPIConfig();
    });

    // 清空缓存
    clearCache.addEventListener('click', async function() {
        await clearAPICache();
    });

    // 重置配置
    resetConfig.addEventListener('click', function() {
        if (confirm('确定要重置所有混元AI配置吗？此操作不可撤销。')) {
            resetAPIConfig();
        }
    });

    // 安全加载配置（支持多种存储方式）
    async function loadConfig() {
        try {
            let config = null;
            
            // 优先尝试Chrome存储
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                try {
                    const result = await chrome.storage.local.get(['hunyuanConfig']);
                    config = result.hunyuanConfig;
                    console.log('✅ 从Chrome存储加载配置');
                } catch (chromeError) {
                    console.warn('Chrome存储访问失败:', chromeError);
                }
            }
            
            // 备用localStorage
            if (!config) {
                try {
                    const localConfig = localStorage.getItem('hunyuan_config');
                    if (localConfig) {
                        config = JSON.parse(localConfig);
                        console.log('✅ 从localStorage加载配置');
                    }
                } catch (localError) {
                    console.warn('localStorage访问失败:', localError);
                }
            }
            
            if (config) {
                apiEnabled.checked = config.enabled || false;
                // 尝试解密，如果解密失败（或者是旧的明文），decrypt会返回原值
                secretId.value = CryptoUtils.decrypt(config.secretId) || '';
                secretKey.value = CryptoUtils.decrypt(config.secretKey) || '';
                region.value = config.region || 'ap-beijing';
                
                apiEnabledLabel.textContent = apiEnabled.checked ? '启用' : '禁用';
                updateFormState();
                
                console.log('✅ 混元AI配置加载成功');
            } else {
                console.log('📝 未找到现有配置，使用默认设置');
            }
        } catch (error) {
            console.error('加载配置失败:', error);
            showTestResult('配置加载失败: ' + error.message, 'error');
        }
    }

    // 更新表单状态
    function updateFormState() {
        const isEnabled = apiEnabled.checked;
        secretId.disabled = !isEnabled;
        secretKey.disabled = !isEnabled;
        region.disabled = !isEnabled;
        testConnection.disabled = !isEnabled;
        
        // 更新表单透明度
        const formGroups = document.querySelectorAll('.form-group:not(:first-child)');
        formGroups.forEach(group => {
            group.style.opacity = isEnabled ? '1' : '0.5';
        });
    }

    // 测试混元AI连接（修复版 - 通过background script避免CORS）
    async function testAPIConnection() {
        if (!apiEnabled.checked) {
            showTestResult('请先启用混元AI服务', 'warning');
            return;
        }

        if (!secretId.value.trim()) {
            showTestResult('请先输入SecretId', 'warning');
            return;
        }

        if (!secretKey.value.trim()) {
            showTestResult('请先输入SecretKey', 'warning');
            return;
        }

        showTestResult('正在测试混元AI连接...', 'info');
        testConnection.disabled = true;
        testConnection.textContent = '测试中...';

        try {
            // 通过background script测试连接（避免CORS问题）
            const testResult = await testHunyuanViaBackground({
                secretId: secretId.value.trim(),
                secretKey: secretKey.value.trim(),
                region: region.value
            });

            if (testResult.success) {
                showTestResult('✅ 混元AI连接测试成功！', 'success');
            } else {
                showTestResult('❌ ' + testResult.error, 'error');
            }
        } catch (error) {
            console.error('测试连接失败:', error);
            
            // 如果background script不可用，进行基础验证
            if (error.message.includes('Extension context invalidated') || 
                error.message.includes('不在Chrome扩展环境中')) {
                
                showTestResult('⚠️ 扩展环境不可用，进行基础配置验证...', 'warning');
                
                // 基础格式验证
                const basicValidation = validateConfigFormat({
                    secretId: secretId.value.trim(),
                    secretKey: secretKey.value.trim(),
                    region: region.value
                });
                
                if (basicValidation.valid) {
                    showTestResult('✅ 配置格式验证通过，请在PTA页面中测试实际功能', 'success');
                } else {
                    showTestResult('❌ ' + basicValidation.error, 'error');
                }
            } else {
                showTestResult('❌ 连接测试失败: ' + error.message, 'error');
            }
        } finally {
            testConnection.disabled = false;
            testConnection.textContent = '测试连接';
        }
    }

    // 通过background script测试混元AI连接
    async function testHunyuanViaBackground(config) {
        return new Promise((resolve, reject) => {
            // 检查Chrome扩展环境
            if (typeof chrome === 'undefined' || !chrome.runtime) {
                reject(new Error('不在Chrome扩展环境中'));
                return;
            }

            // 发送测试请求到background script
            chrome.runtime.sendMessage({
                action: 'testHunyuanConnection',
                config: config,
                testQuestion: '请回答：1+1等于几？只需要回答数字。'
            }, (response) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else if (response && response.success) {
                    resolve({
                        success: true,
                        message: '连接测试成功',
                        testResponse: response.data
                    });
                } else {
                    resolve({
                        success: false,
                        error: response?.error || '测试请求失败'
                    });
                }
            });
        });
    }

    // 基础配置格式验证
    function validateConfigFormat(config) {
        // SecretId格式验证（通常以AKID开头，长度36位）
        if (!config.secretId || config.secretId.length < 10) {
            return { valid: false, error: 'SecretId格式不正确，长度过短' };
        }
        
        if (!config.secretId.startsWith('AKID') && config.secretId.length !== 36) {
            return { valid: false, error: 'SecretId格式可能不正确，请检查是否完整' };
        }

        // SecretKey格式验证（通常长度40位）
        if (!config.secretKey || config.secretKey.length < 20) {
            return { valid: false, error: 'SecretKey格式不正确，长度过短' };
        }
        
        if (config.secretKey.length !== 40) {
            return { valid: false, error: 'SecretKey格式可能不正确，请检查是否完整' };
        }

        // 区域验证
        const validRegions = ['ap-beijing', 'ap-shanghai', 'ap-guangzhou', 'ap-chengdu'];
        if (!validRegions.includes(config.region)) {
            return { valid: false, error: '不支持的区域设置' };
        }

        return { valid: true };
    }

    // 安全保存配置（支持多种存储方式）
    async function saveAPIConfig() {
        // 验证必填字段
        if (apiEnabled.checked) {
            if (!secretId.value.trim()) {
                showTestResult('请输入SecretId', 'warning');
                return;
            }
            if (!secretKey.value.trim()) {
                showTestResult('请输入SecretKey', 'warning');
                return;
            }
        }

        try {
            const config = {
                enabled: apiEnabled.checked,
                // 保存时进行加密
                secretId: CryptoUtils.encrypt(secretId.value.trim()),
                secretKey: CryptoUtils.encrypt(secretKey.value.trim()),
                region: region.value,
                model: 'hunyuan-lite',
                lastUpdated: new Date().toISOString()
            };

            // 保存到多个存储位置
            await saveConfigToMultipleStorages(config);

            // 尝试通知PTA页面更新配置（如果可能）
            await notifyPTAPages(config);

            showTestResult('✅ 混元AI配置保存成功', 'success');
            
            // 延迟关闭页面
            setTimeout(() => {
                window.close();
            }, 1500);
            
        } catch (error) {
            console.error('保存配置失败:', error);
            showTestResult('❌ 保存失败: ' + error.message, 'error');
        }
    }

    // 保存配置到多个存储位置
    async function saveConfigToMultipleStorages(config) {
        let chromeSuccess = false;
        let localSuccess = false;

        // 尝试保存到Chrome存储
        try {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                await chrome.storage.local.set({ hunyuanConfig: config });
                chromeSuccess = true;
                console.log('✅ 配置已保存到Chrome存储');
            }
        } catch (chromeError) {
            console.warn('Chrome存储保存失败:', chromeError);
        }

        // 保存到localStorage作为备用
        try {
            localStorage.setItem('hunyuan_config', JSON.stringify(config));
            localSuccess = true;
            console.log('✅ 配置已保存到localStorage');
        } catch (localError) {
            console.warn('localStorage保存失败:', localError);
        }

        // 确保至少有一种存储方式成功
        if (!chromeSuccess && !localSuccess) {
            throw new Error('所有存储方式都失败了');
        }
    }

    // 通知PTA页面更新配置
    async function notifyPTAPages(config) {
        try {
            if (typeof chrome !== 'undefined' && chrome.tabs) {
                const tabs = await chrome.tabs.query({});
                const ptaTabs = tabs.filter(tab => tab.url && tab.url.includes('pintia.cn'));
                
                for (const tab of ptaTabs) {
                    try {
                        await chrome.tabs.sendMessage(tab.id, {
                            action: 'updateHunyuanConfig',
                            config: config
                        });
                    } catch (error) {
                        console.log(`PTA页面 ${tab.id} 未就绪，配置将在下次加载时生效`);
                    }
                }
            }
        } catch (error) {
            console.log('通知PTA页面时出错，但配置已保存:', error);
        }
    }

    // 清空缓存（安全版本）
    async function clearAPICache() {
        try {
            let chromeSuccess = false;
            let localSuccess = false;

            // 清空Chrome存储缓存
            try {
                if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                    await chrome.storage.local.remove(['hunyuanCache']);
                    chromeSuccess = true;
                    console.log('✅ Chrome存储缓存已清空');
                }
            } catch (chromeError) {
                console.warn('Chrome存储缓存清理失败:', chromeError);
            }

            // 清空localStorage缓存
            try {
                const keys = Object.keys(localStorage);
                const cacheKeys = keys.filter(key => key.startsWith('hunyuan_cache_'));
                cacheKeys.forEach(key => localStorage.removeItem(key));
                localSuccess = true;
                console.log('✅ localStorage缓存已清空');
            } catch (localError) {
                console.warn('localStorage缓存清理失败:', localError);
            }

            // 尝试通知PTA页面清空内存缓存
            await notifyPTAPagesClearCache();

            if (chromeSuccess || localSuccess) {
                showTestResult('✅ 混元AI缓存已清空', 'success');
            } else {
                showTestResult('⚠️ 缓存清理可能不完整', 'warning');
            }
        } catch (error) {
            console.error('清空缓存失败:', error);
            showTestResult('❌ 清空缓存失败: ' + error.message, 'error');
        }
    }

    // 通知PTA页面清空缓存
    async function notifyPTAPagesClearCache() {
        try {
            if (typeof chrome !== 'undefined' && chrome.tabs) {
                const tabs = await chrome.tabs.query({});
                const ptaTabs = tabs.filter(tab => tab.url && tab.url.includes('pintia.cn'));
                
                for (const tab of ptaTabs) {
                    try {
                        await chrome.tabs.sendMessage(tab.id, {
                            action: 'clearHunyuanCache'
                        });
                    } catch (error) {
                        console.log(`PTA页面 ${tab.id} 缓存清理跳过`);
                    }
                }
            }
        } catch (error) {
            console.log('通知PTA页面清理缓存时出错:', error);
        }
    }

    // 重置配置（安全版本）
    async function resetAPIConfig() {
        try {
            // 清空所有存储
            try {
                if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                    await chrome.storage.local.remove(['hunyuanConfig', 'hunyuanCache']);
                    console.log('✅ Chrome存储已重置');
                }
            } catch (chromeError) {
                console.warn('Chrome存储重置失败:', chromeError);
            }

            try {
                const keys = Object.keys(localStorage);
                const hunyuanKeys = keys.filter(key => key.startsWith('hunyuan_'));
                hunyuanKeys.forEach(key => localStorage.removeItem(key));
                console.log('✅ localStorage已重置');
            } catch (localError) {
                console.warn('localStorage重置失败:', localError);
            }
            
            // 重置表单
            apiEnabled.checked = false;
            secretId.value = '';
            secretKey.value = '';
            region.value = 'ap-beijing';
            apiEnabledLabel.textContent = '禁用';
            updateFormState();

            // 通知PTA页面重置配置
            await notifyPTAPages({
                enabled: false,
                secretId: '',
                secretKey: '',
                region: 'ap-beijing',
                model: 'hunyuan-lite'
            });

            showTestResult('✅ 混元AI配置已重置', 'success');
        } catch (error) {
            console.error('重置配置失败:', error);
            showTestResult('❌ 重置失败: ' + error.message, 'error');
        }
    }

    // 显示测试结果
    function showTestResult(message, type) {
        apiTestResult.textContent = message;
        apiTestResult.className = 'api-status ' + type;
        apiTestResult.style.display = 'block';
        
        // 自动隐藏成功消息
        if (type === 'success') {
            setTimeout(() => {
                apiTestResult.style.display = 'none';
            }, 3000);
        }
    }

    // 初始化表单状态
    updateFormState();
});