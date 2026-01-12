import type { ExtractedProblem, PlatformExtractor } from './types'
import { pintiaExtractor } from './extractors/pintia'
import { leetcodeExtractor } from './extractors/leetcode'
import { luoguExtractor } from './extractors/luogu'
import { chaoxingExtractor } from './extractors/chaoxing'
import { fenbiExtractor } from './extractors/fenbi'
import { createGenericExtractor } from './extractors/generic'

const unknownExtractor: PlatformExtractor = createGenericExtractor('unknown', () => true)

const extractors: PlatformExtractor[] = [
  pintiaExtractor,
  leetcodeExtractor,
  luoguExtractor,
  chaoxingExtractor,
  fenbiExtractor,
  unknownExtractor
]

export async function detectPublicProblems(): Promise<ExtractedProblem[]> {
  const extractor = extractors.find(e => e.match(window.location)) || unknownExtractor
  try {
    return await extractor.extract()
  } catch (e) {
    console.warn('[Modern] extract failed', extractor.id, e)
    return []
  }
}
