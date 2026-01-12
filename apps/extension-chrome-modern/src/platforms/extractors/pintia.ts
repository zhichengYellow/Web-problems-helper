import type { PlatformExtractor } from '../types'
import { collectTexts, firstNonEmptyText, hashString, isLikelyProblemPage, readableContentText } from '../dom'
import { isLikelyProblemUrl } from '../detect'

export const pintiaExtractor: PlatformExtractor = {
  id: 'pintia',
  match: (loc) => /(^|\.)pintia\.cn$/i.test(loc.hostname),
  async extract() {
    if (!isLikelyProblemUrl('pintia', location.href)) return []

    const u = new URL(location.href)
    const problemSetProblemId = u.searchParams.get('problemSetProblemId')

    const title = firstNonEmptyText([
      'h1',
      'h2',
      '.problem-title',
      '.title'
    ])

    const contentRoot =
      document.querySelector('main') ||
      document.querySelector('[class*="problem"]') ||
      document.querySelector('#app')

    const content = contentRoot
      ? (contentRoot.textContent || '').replace(/\s+/g, ' ').trim()
      : readableContentText()

    const stableId = problemSetProblemId
      ? `pintia:psp:${problemSetProblemId}`
      : `pintia:${u.pathname}#${hashString(`${title}\n${content.slice(0, 800)}`)}`

    if (!isLikelyProblemPage(title || document.title || '', content)) return []

    const options = Array.from(new Set([
      ...collectTexts('.choices .choice', 20),
      ...collectTexts('.options .option', 20),
      ...collectTexts('label.option', 20),
      ...collectTexts('.ant-radio-wrapper', 20),
      ...collectTexts('.ant-checkbox-wrapper', 20)
    ])).filter(Boolean)

    return [
      {
        id: stableId,
        platform: 'pintia',
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
