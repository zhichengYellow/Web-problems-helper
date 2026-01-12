import type { ProblemInfo } from '../core/PTAHelper'

export class UIManager {
  async initialize(): Promise<void> {
    // 占位：后续接入 React UI 或 DOM 浮层
  }

  cleanup(): void {
    // 占位
  }

  showAnswer(problem: ProblemInfo, answer: string): void {
    console.log('[Modern UI] answer', { id: problem.id, title: problem.title, answer })
  }
}
