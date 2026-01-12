import type { PlatformId } from './types'

export type PlatformMeta = {
  id: PlatformId
  name: string
  badgeColor: string
}

const PLATFORM_META: Record<PlatformId, PlatformMeta> = {
  pintia: { id: 'pintia', name: 'Pintia', badgeColor: '#1677ff' },
  chaoxing: { id: 'chaoxing', name: '学习通', badgeColor: '#722ed1' },
  fenbi: { id: 'fenbi', name: '粉笔', badgeColor: '#fa8c16' },
  leetcode: { id: 'leetcode', name: '力扣', badgeColor: '#13c2c2' },
  luogu: { id: 'luogu', name: '洛谷', badgeColor: '#52c41a' },
  unknown: { id: 'unknown', name: '未知平台', badgeColor: '#8c8c8c' }
}

export function detectPlatformFromHostname(hostname: string): PlatformId {
  const host = hostname.toLowerCase()
  if (/(^|\.)pintia\.cn$/.test(host)) return 'pintia'
  if (/(^|\.)leetcode\.cn$/.test(host)) return 'leetcode'
  if (/(^|\.)luogu\.com\.cn$/.test(host)) return 'luogu'
  if (/(^|\.)chaoxing\.com$/.test(host)) return 'chaoxing'
  if (/(^|\.)fenbi\.com$/.test(host)) return 'fenbi'
  return 'unknown'
}

export function detectPlatformFromUrl(url: string | undefined | null): PlatformId {
  if (!url) return 'unknown'
  try {
    const u = new URL(url)
    return detectPlatformFromHostname(u.hostname)
  } catch {
    return 'unknown'
  }
}

export function getPlatformMeta(id: PlatformId): PlatformMeta {
  return PLATFORM_META[id] ?? PLATFORM_META.unknown
}

export function isLikelyProblemUrl(platform: PlatformId, url: string | undefined | null): boolean {
  if (!url) return false
  let u: URL
  try {
    u = new URL(url)
  } catch {
    return false
  }

  const path = u.pathname || '/'

  switch (platform) {
    case 'leetcode':
      // Typical statement pages:
      // - /problems/<slug>/
      // - /problems/<slug>/description/
      // Skip non-statement pages like /solution/ /submissions/ and other top-level sections.
      if (!/^\/problems\//.test(path)) return false
      if (/^\/problems\/[^/]+\/(solution|submissions|discuss)\//.test(path)) return false
      return /^\/problems\/[^/]+\/?$/.test(path) || /^\/problems\/[^/]+\/description\/?$/.test(path)
    case 'luogu':
      // Typical: /problem/P1000  or /problemnew/show/P1000
      return /^\/(problem|problemnew\/show)\//.test(path)
    case 'pintia':
      // Example: /problem-sets/<id>/exam/problems/type/6?problemSetProblemId=<id>
      // Keep conservative and rely on DOM heuristic as a second gate.
      if (/^\/problem-sets\//.test(path) && /\/(exam\/problems|problems)\//.test(path)) return true
      if (/^\/problems?\//.test(path)) return true
      return false
    case 'fenbi':
      // Example: https://spa.fenbi.com/ti/exam/exercise/...
      return /^\/ti\/exam\/(exercise|paper|report)\//.test(path) || /^\/ti\/exam\/exercise\//.test(path)
    case 'chaoxing':
      // Page shapes vary heavily; keep URL gate open and rely on DOM heuristic.
      return true
    default:
      return true
  }
}
