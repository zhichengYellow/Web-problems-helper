import { AnswerDatabase } from '../services/AnswerDatabase';
import { ProblemDetector } from '../services/ProblemDetector';
import { UIManager } from '../ui/UIManager';

export interface WebProblemsHelperConfig {
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
  platform?: string;
  url?: string;
  source?: string;
}

export class WebProblemsHelper {
  private config: WebProblemsHelperConfig;
  private isRunning: boolean = false;
  private scanTimer: number | null = null;
  private lastScanUrl: string = '';
  private lastSeenFingerprints = new Set<string>();

  constructor(config: WebProblemsHelperConfig) {
    this.config = config;
  }

  /**
   * 启动Web 题目助手
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('Web 题目助手已经在运行中');
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
      
      console.log('Web 题目助手启动成功');
    } catch (error) {
      console.error('Web 题目助手启动失败:', error);
      this.isRunning = false;
    }
  }

  /**
   * 停止Web 题目助手
   */
  stop(): void {
    this.isRunning = false;
    this.config.uiManager.cleanup();
    console.log('Web 题目助手已停止');
  }

  /**
   * 扫描当前页面的题目
   */
  private async scanCurrentPage(): Promise<void> {
    if (!this.isRunning) return;

    try {
      const problems = await this.config.problemDetector.detectProblems();
      
      const fresh = problems.filter(p => {
        const basis = `${p.id}|${p.title}|${(p.content || '').slice(0, 800)}`
        // keep a simple fingerprint; avoid repeated processing caused by frequent DOM mutations
        const fp = basis
        if (this.lastSeenFingerprints.has(fp)) return false
        this.lastSeenFingerprints.add(fp)
        // prevent unbounded growth
        if (this.lastSeenFingerprints.size > 300) {
          this.lastSeenFingerprints = new Set(Array.from(this.lastSeenFingerprints).slice(-200))
        }
        return true
      })

      if (fresh.length > 0) {
        console.log(`检测到 ${fresh.length} 个新题目`);
        
        // 为每个题目查找答案并显示UI
        for (const problem of fresh) {
          await this.handleProblem(problem);
        }
      }
    } catch (error) {
      console.error('扫描页面失败:', error);
    }
  }

  private scheduleScan(delayMs: number = 350): void {
    if (!this.isRunning) return
    if (this.scanTimer !== null) {
      window.clearTimeout(this.scanTimer)
    }
    this.scanTimer = window.setTimeout(() => {
      this.scanTimer = null
      // Avoid redundant scans when URL didn't change and we just scanned very recently;
      // the fingerprint dedupe above also protects us.
      void this.scanCurrentPage()
    }, delayMs)
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
        this.lastScanUrl = lastUrl
        this.scheduleScan(120);
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
        // DOM changes can be frequent in SPAs; debounce to avoid noisy rescans.
        this.scheduleScan(450);
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