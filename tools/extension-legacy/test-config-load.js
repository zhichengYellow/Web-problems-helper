// 测试配置加载脚本
const fs = require('fs');
const path = require('path');

// 模拟浏览器环境
global.window = {};
global.localStorage = {
    getItem: () => null,
    setItem: () => {}
};
global.HunyuanService = null;

// 加载hunyuan-service.js
const hunyuanServiceCode = fs.readFileSync('./hunyuan-service.js', 'utf8');

// 创建一个简单的测试环境
const testEnv = {
    console: {
        log: console.log,
        warn: console.warn,
        error: console.error
    },
    require: (modulePath) => {
        if (modulePath === './config.js') {
            return require('./config.js');
        }
        if (modulePath === './hunyuan-config.js') {
            throw new Error('Module not found');
        }
        if (modulePath === '../config.js') {
            return require('./config.js');
        }
        if (modulePath === '../hunyuan-config.js') {
            throw new Error('Module not found');
        }
        throw new Error(`Module not found: ${modulePath}`);
    },
    setTimeout: setTimeout,
    setInterval: setInterval,
    clearTimeout: clearTimeout,
    clearInterval: clearInterval
};

// 测试配置加载功能
console.log('🧪 测试配置加载功能...');

// 直接测试loadFromConfigFile方法
const loadFromConfigFile = async function() {
    try {
        const configPaths = [
            './config.js',
            './hunyuan-config.js',
            '../config.js',
            '../hunyuan-config.js'
        ];
        
        for (const path of configPaths) {
            try {
                if (typeof require !== 'undefined') {
                    // Node.js环境
                    const config = require(path);
                    if (config.secretId && config.secretKey) {
                        console.log(`✅ 从 ${path} 加载配置成功`);
                        console.log('secretId:', config.secretId);
                        console.log('secretKey:', '***' + config.secretKey.slice(-4));
                        return true;
                    }
                }
            } catch (e) {
                // 继续尝试下一个路径
                continue;
            }
        }
        
        throw new Error('未找到有效的配置文件');
        
    } catch (error) {
        console.warn('从配置文件加载失败:', error.message);
        return false;
    }
};

// 运行测试
loadFromConfigFile().then(success => {
    if (success) {
        console.log('🎉 配置加载测试成功！');
    } else {
        console.log('❌ 配置加载测试失败');
    }
}).catch(error => {
    console.error('测试失败:', error);
});