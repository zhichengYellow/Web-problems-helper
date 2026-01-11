import { AnswerDatabase } from '../services/AnswerDatabase';
import { ProblemDetector } from '../services/ProblemDetector';
import { UIManager } from '../ui/UIManager';

export interface PTAHelperConfig {
  answerDatabase: AnswerDatabase;
  problemDetector: ProblemDetector;
  uiManager: UIManager;
}

export interface ProblemInfo {
  id: string;
  title: string;
  type: 'programming' | 'choice' | 'fill' | 'judge';
  difficulty: 'easy' | 'medium' | 'hard';
  content: string;
  options?: string[];
}

export class PTAHelper {
  private config: PTAHelperConfig;
  private isRunning: boolean = false;

  constructor(config: PTAHelperConfig) {
    this.config = config;
  }

  /**
   * 启动PTA助手
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('PTA助手已经在运行中');
      return;
    }

    this.isRunning = true;
    
    try {
      // 初始化UI
      await this.config.uiManager.initialize();
      
      // 开始监控页面变化
      this.startPageMonitoring();
      
      // 初始扫描页面
      await this.scanCurrentPage();
      
      console.log('PTA助手启动成功');
    } catch (error) {
      console.error('PTA助手启动失败:', error);
      this.isRunning = false;
    }
  }

  /**
   * 停止PTA助手
   */
  stop(): void {
    this.isRunning = false;
    this.config.uiManager.cleanup();
    console.log('PTA助手已停止');
  }

  /**
   * 扫描当前页面的题目
   */
  private async scanCurrentPage(): Promise<void> {
    if (!this.isRunning) return;

    try {
      const problems = await this.config.problemDetector.detectProblems();
      
      if (problems.length > 0) {
        console.log(`检测到 ${problems.length} 个题目`);
        
        // 为每个题目查找答案并显示UI
        for (const problem of problems) {
          await this.handleProblem(problem);
        }
      }
    } catch (error) {
      console.error('扫描页面失败:', error);
    }
  }

  /**
   * 处理单个题目
   */
  private async handleProblem(problem: ProblemInfo): Promise<void> {
    try {
      // 查找答案
      const answer = await this.config.answerDatabase.findAnswer(problem);
      
      if (answer) {
        // 显示答案UI
        this.config.uiManager.showAnswer(problem, answer);
        
        console.log(`题目 "${problem.title}" 找到答案`);
      } else {
        console.log(`题目 "${problem.title}" 未找到答案`);
      }
    } catch (error) {
      console.error(`处理题目失败: ${problem.title}`, error);
    }
  }

  /**
   * 开始监控页面变化
   */
  private startPageMonitoring(): void {
    // 监听URL变化
    let lastUrl = location.href;
    
    const observer = new MutationObserver(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        setTimeout(() => this.scanCurrentPage(), 100);
      }
    });

    observer.observe(document, { subtree: true, childList: true });

    // 监听页面内容变化
    const contentObserver = new MutationObserver((mutations) => {
      if (!this.isRunning) return;
      
      const shouldRescan = mutations.some(mutation => {
        return mutation.type === 'childList' && 
               mutation.addedNodes.length > 0;
      });
      
      if (shouldRescan) {
        setTimeout(() => this.scanCurrentPage(), 200);
      }
    });

    contentObserver.observe(document.body, { 
      childList: true, 
      subtree: true 
    });
  }

  /**
   * 获取助手状态
   */
  getStatus(): { isRunning: boolean } {
    return {
      isRunning: this.isRunning
    };
  }
}