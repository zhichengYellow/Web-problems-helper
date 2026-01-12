import { WebProblemsHelper } from './core/WebProblemsHelper';
import { AnswerDatabase } from './services/AnswerDatabase';
import { ProblemDetector } from './services/ProblemDetector';
import { UIManager } from './ui/UIManager';

// 初始化 Web 题目助手
class WebProblemsContentScript {
  private helper: WebProblemsHelper;
  private detector: ProblemDetector;
  private uiManager: UIManager;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      // 初始化服务
      const answerDb = new AnswerDatabase();
      this.detector = new ProblemDetector();
      this.uiManager = new UIManager();
      
      // 创建主助手实例
      this.helper = new WebProblemsHelper({
        answerDatabase: answerDb,
        problemDetector: this.detector,
        uiManager: this.uiManager
      });

      // 启动助手
      await this.helper.start();
      
      console.log('Web 题目助手初始化成功');
    } catch (error) {
      console.error('Web 题目助手初始化失败:', error);
    }
  }
}

// 页面加载完成后启动
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new WebProblemsContentScript();
  });
} else {
  new WebProblemsContentScript();
}