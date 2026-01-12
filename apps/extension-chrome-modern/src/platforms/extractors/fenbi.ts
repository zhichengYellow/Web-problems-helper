import type { PlatformExtractor } from '../types'
import { collectTexts, firstNonEmptyText, isLikelyProblemPage, readableContentText } from '../dom'
import { isLikelyProblemUrl } from '../detect'

// 粉笔（spa.fenbi.com）：优先只在 /ti/exam/exercise/... 这类答题页抽取
export const fenbiExtractor: PlatformExtractor = {
  id: 'fenbi',
  match: (loc) => /(^|\.)fenbi\.com$/i.test(loc.hostname),
  async extract() {
    if (!isLikelyProblemUrl('fenbi', location.href)) return []

    const u = new URL(location.href)
    const stableId = `fenbi:${u.pathname}`

    const title = firstNonEmptyText([
      'h1',
      'h2',
      '.title',
      '.question-title',
      '.stem'
    ])

    const contentRoot =
      document.querySelector('[class*="question"]') ||
      document.querySelector('[class*="stem"]') ||
      document.querySelector('main') ||
      document.querySelector('#app')

    const content = contentRoot
      ? (contentRoot.textContent || '').replace(/\s+/g, ' ').trim()
      : readableContentText()

    if (!isLikelyProblemPage(title || document.title || '', content)) return []

    const options = Array.from(new Set([
      ...collectTexts('.option', 30),
      ...collectTexts('.options .item', 30),
      ...collectTexts('label', 30)
    ])).filter(Boolean)

    return [
      {
        id: stableId,
        platform: 'fenbi',
        url: location.href,
        source: 'public-page',
        title: title || document.title,
        type: options.length > 0 ? 'choice' : 'programming',
        difficulty: 'medium',
        content,
        options: options.length > 0 ? options : undefined
      }
    ]
  }
}
