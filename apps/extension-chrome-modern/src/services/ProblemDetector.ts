import type { ProblemInfo } from '../core/WebProblemsHelper'
import { detectPublicProblems } from '../platforms'
import { CapturedProblemStore } from './CapturedProblemStore'

export class ProblemDetector {
  async detectProblems(): Promise<ProblemInfo[]> {
    const problems = await detectPublicProblems()
    await new CapturedProblemStore().append(problems)
    // Keep WebProblemsHelper API stable (ProblemInfo[])
    return problems
  }
}
