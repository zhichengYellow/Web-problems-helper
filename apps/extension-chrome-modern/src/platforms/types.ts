import type { ProblemInfo } from '../core/WebProblemsHelper'

export type PlatformId = 'pintia' | 'leetcode' | 'luogu' | 'chaoxing' | 'fenbi' | 'unknown'

export type ExtractedProblem = ProblemInfo & {
  platform: PlatformId
  url: string
  source: 'public-page'
}

export type PlatformExtractor = {
  id: PlatformId
  match: (location: Location) => boolean
  extract: () => Promise<ExtractedProblem[]>
}
