import type { PlatformExtractor } from '../types'
import { collectTexts, firstNonEmptyText, isLikelyProblemPage, readableContentText } from '../dom'
import { isLikelyProblemUrl } from '../detect'

export const leetcodeExtractor: PlatformExtractor = {
  id: 'leetcode',
  match: (loc) => /(^|\.)leetcode\.cn$/i.test(loc.hostname),
  async extract() {
    if (!isLikelyProblemUrl('leetcode', location.href)) return []

    const u = new URL(location.href)
    const m = u.pathname.match(/^\/problems\/([^/]+)\//)
    const slug = m?.[1]
    const stableId = slug ? `leetcode:slug:${slug}` : `leetcode:${u.pathname}`

    const title = firstNonEmptyText([
      '[data-cy="question-title"]',
      'h1',
      'h2'
    ])

    // Prefer the description container when present
    const desc = document.querySelector('[data-track-load="description_content"]')
    const content = desc ? (desc.textContent || '').replace(/\s+/g, ' ').trim() : readableContentText()

    if (!isLikelyProblemPage(title || document.title || '', content)) return []

    // LeetCode choice options are uncommon; keep best-effort
    const options = Array.from(new Set([
      ...collectTexts('label', 30),
      ...collectTexts('.option', 30)
    ])).filter(Boolean)

    return [
      {
        id: stableId,
        platform: 'leetcode',
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
