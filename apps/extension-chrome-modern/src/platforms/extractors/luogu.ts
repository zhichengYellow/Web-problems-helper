import type { PlatformExtractor } from '../types'
import { firstNonEmptyText, isLikelyProblemPage, readableContentText } from '../dom'
import { isLikelyProblemUrl } from '../detect'

export const luoguExtractor: PlatformExtractor = {
  id: 'luogu',
  match: (loc) => /(^|\.)luogu\.com\.cn$/i.test(loc.hostname),
  async extract() {
    if (!isLikelyProblemUrl('luogu', location.href)) return []

    const u = new URL(location.href)
    const m = u.pathname.match(/^\/(?:problem|problemnew\/show)\/([^/?#]+)/)
    const pid = m?.[1]
    const stableId = pid ? `luogu:${pid}` : `luogu:${u.pathname}`

    const title = firstNonEmptyText([
      'h1',
      '.problem-title',
      '.card-title'
    ])

    // Luogu typically has markdown-rendered content
    const md = document.querySelector('.markdown')
    const content = md ? (md.textContent || '').replace(/\s+/g, ' ').trim() : readableContentText()

    if (!isLikelyProblemPage(title || document.title || '', content)) return []

    return [
      {
        id: stableId,
        platform: 'luogu',
        url: location.href,
        source: 'public-page',
        title: title || document.title,
        type: 'programming',
        difficulty: 'medium',
        content
      }
    ]
  }
}
