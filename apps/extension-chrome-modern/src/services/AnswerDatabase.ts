import type { ProblemInfo } from '../core/WebProblemsHelper'

export class AnswerDatabase {
  async findAnswer(_problem: ProblemInfo): Promise<string | null> {
    return null
  }
}
