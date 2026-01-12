import type { ProblemInfo } from '../core/PTAHelper'

export class AnswerDatabase {
  async findAnswer(_problem: ProblemInfo): Promise<string | null> {
    return null
  }
}
