/**
 * Pintia 平台配置
 */
export const PintiaConfig = {
  // Pintia 域名配置
  domains: {
    main: 'pintia.cn',
    subdomains: ['www.pintia.cn', 'pintia.cn']
  },

  // 页面路径模式
  pagePatterns: {
    // 题目页面
    problem: /\/problem-sets\/[^\/]+\/problems\/[^\/]+/,
    
    // 考试页面
    exam: /\/exam-sets\/[^\/]+\/exams\/[^\/]+/,
    
    // 练习页面
    practice: /\/problem-sets\/[^\/]+\/practices\/[^\/]+/,
    
    // 作业页面
    homework: /\/problem-sets\/[^\/]+\/homeworks\/[^\/]+/
  },

  // 题目类型配置
  problemTypes: {
    programming: '编程题',
    choice: '选择题',
    fill: '填空题',
    judge: '判断题'
  },

  // 难度级别
  difficultyLevels: {
    easy: '简单',
    medium: '中等',
    hard: '困难'
  },

  // 选择器配置
  selectors: {
    // 题目容器
    problemContainer: '.problem-content',
    
    // 题目标题
    problemTitle: '.problem-title',
    
    // 题目描述
    problemDescription: '.problem-description',
    
    // 代码编辑器
    codeEditor: '.code-editor',
    
    // 选择题选项
    choiceOptions: '.choice-options .option',
    
    // 填空题输入框
    fillInputs: '.fill-input',
    
    // 判断题选项
    judgeOptions: '.judge-options .option'
  }
};