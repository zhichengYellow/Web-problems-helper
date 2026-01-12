import type { ExtractedProblem, PlatformExtractor, PlatformId } from '../types'
import { collectTexts, firstNonEmptyText, hashString, isLikelyProblemPage, readableContentText } from '../dom'
import { isLikelyProblemUrl } from '../detect'

function makeProblem(platform: PlatformId, title: string, content: string, options?: string[]): ExtractedProblem {
  const basis = `${title}\n${content.slice(0, 800)}`
  const suffix = hashString(basis)
  return {
    id: `${platform}:${location.href}#${suffix}`,
    platform,
    url: location.href,
    source: 'public-page',
    title: title || document.title || location.hostname,
    type: options && options.length > 0 ? 'choice' : 'programming',
    difficulty: 'medium',
    content,
    options: options && options.length > 0 ? options : undefined
  }
}

export function createGenericExtractor(
  platform: PlatformId,
  match: (location: Location) => boolean,
  optionSelectors: string[] = [],
  urlGate: (url: string) => boolean = (url) => isLikelyProblemUrl(platform, url)
): PlatformExtractor {
  return {
    id: platform,
    match,
    async extract() {
      if (!urlGate(location.href)) return []

      const title = firstNonEmptyText(['h1', 'h2', '[data-cy="question-title"]', '.title', '.problem-title'])
      const content = readableContentText()

      if (!isLikelyProblemPage(title || document.title || '', content)) return []

      const options: string[] = []
      for (const sel of optionSelectors) {
        options.push(...collectTexts(sel, 20))
      }

      const uniqueOptions = Array.from(new Set(options)).filter(Boolean)
      return [makeProblem(platform, title, content, uniqueOptions)]
    }
  }
}
