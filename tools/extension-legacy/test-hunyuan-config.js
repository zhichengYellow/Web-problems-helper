// 测试hunyuan-service配置加载
const fs = require('fs');

// 模拟浏览器环境
global.window = {
    HunyuanService: null
};
global.localStorage = {
    getItem: () => null,
    setItem: () => {}
};
global.HunyuanService = null;

// 读取hunyuan-service.js内容
const hunyuanServiceCode = fs.readFileSync('./hunyuan-service.js', 'utf8');

// 创建一个简单的测试环境
const testEnv = {
    console: console,
    require: (modulePath) => {
        if (modulePath === './config.js') return require('./config.js');
        if (modulePath === './hunyuan-config.js') throw new Error('Module not found');
        if (modulePath === '../config.js') return require('./config.js');
        if (modulePath === '../hunyuan-config.js') throw new Error('Module not found');
        throw new Error(`Module not found: ${modulePath}`);
    },
    setTimeout: setTimeout,
    setInterval: setInterval,
    clearTimeout: clearTimeout,
    clearInterval: clearInterval
};

// 执行hunyuan-service.js代码
const vm = require('vm');
const context = vm.createContext(testEnv);

try {
    vm.runInContext(hunyuanServiceCode, context);
    
    // 创建HunyuanService实例
    const HunyuanService = context.HunyuanService;
    const service = new HunyuanService();
    
    // 等待初始化完成
    service.init().then(() => {
        console.log('配置加载结果:');
        console.log('secretId:', service.secretId);
        console.log('secretKey:', service.secretKey ? '***' + service.secretKey.slice(-4) : 'null');
        console.log('配置状态:', service.isConfigured() ? '✅ 已配置' : '❌ 未配置');
        
        if (service.isConfigured()) {
            console.log('🎉 hunyuan-service配置加载成功！');
        } else {
            console.log('❌ hunyuan-service配置加载失败');
        }
    }).catch(error => {
        console.error('初始化失败:', error);
    });
} catch (error) {
    console.error('测试失败:', error);
}