# PTA答题助手 - CORS问题修复方案

## 问题描述
PTA答题助手遇到了以下CORS（跨域资源共享）问题：

1. **知寻题库API CORS限制**：`api.wkexam.com` 阻止了来自 `pintia.cn` 的跨域请求
2. **腾讯云混元API CORS限制**：`hunyuan.tencentcloudapi.com` 需要服务器端调用
3. **Chrome扩展上下文失效**：扩展存储访问失败

## 修复方案

### 1. Background Script CORS代理
所有API请求现在统一通过background script处理，避免浏览器CORS限制：

```javascript
// 统一使用background script作为CORS代理
async makeAPIRequest(endpoint, options = {}) {
    try {
        return await this.makeAPIRequestViaBackground(url, options);
    } catch (error) {
        console.warn('Background API请求失败:', error);
        return this.tryFallbackAPI(endpoint, options);
    }
}
```

### 2. 知寻题库API特殊处理
针对知寻题库API添加了专门的请求头和处理逻辑：

```javascript
// 特殊处理知寻题库API请求
if (url.includes('api.wkexam.com')) {
    headers = {
        ...headers,
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://pintia.cn/',
        'Origin': 'https://pintia.cn'
    };
}
```

### 3. 多层回退机制
构建了完整的回退策略：

1. **第一层**：Background script CORS代理
2. **第二层**：知寻题库备用方案（CORS代理服务）
3. **第三层**：本地智能答案生成
4. **第四层**：启发式规则匹配

### 4. 本地智能答案生成
当所有API都失败时，使用本地智能逻辑生成答案：

```javascript
generateLocalAnswer(questionText, questionType, options) {
    // 选择题智能逻辑
    if (questionType === 'single_choice' && options.length > 0) {
        // 关键词匹配、选项长度分析、默认选择中间选项
    }
    
    // 判断题智能逻辑
    if (questionType === 'true_false') {
        // 否定词检测、默认选择"正确"
    }
}
```

## 使用说明

### 配置知寻题库API
在 `config.js` 中配置知寻题库API：

```javascript
export const zhixunConfig = {
    baseURL: 'https://api.wkexam.com/api/question',
    token: 'qqqqq', // 官方免费token
    endpoints: {
        search: '/search'
    }
};
```

### 测试修复
运行测试页面验证修复效果：

```bash
# 在浏览器中打开测试页面
open test-cors-fix.html
```

## 文件变更

### 修改的文件：
1. **api-service.js** - 主要修复CORS处理逻辑
2. **background.js** - 增强API请求处理能力
3. **config.js** - 添加知寻题库API配置

### 新增的文件：
1. **test-cors-fix.html** - CORS修复测试页面
2. **CORS-FIX-README.md** - 修复方案文档

## 注意事项

1. **Chrome扩展环境**：确保background script正常运行
2. **网络连接**：需要稳定的网络连接访问API
3. **API限制**：知寻题库API有速率限制，请合理使用
4. **本地存储**：扩展存储失败时会回退到localStorage

## 故障排除

如果仍然遇到CORS问题：

1. 检查Chrome扩展是否已正确安装和启用
2. 确认background script没有报错
3. 检查网络连接是否正常
4. 尝试刷新页面重新初始化API服务

## 性能优化

- 本地缓存机制减少API调用
- 智能答案匹配提高命中率
- 多层回退确保服务可用性
- 异步处理避免界面卡顿

## 版本历史

- **v1.0** - 初始CORS修复版本
- **v1.1** - 增强知寻题库API支持
- **v1.2** - 添加本地智能答案生成
- **v1.3** - 完善多层回退机制

## 技术支持

如有问题，请检查：
1. Chrome扩展控制台错误信息
2. Network面板中的API请求状态
3. Background script的运行状态

---
*最后更新: 2025-09-21*