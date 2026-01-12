export function getText(el: Element | null | undefined): string {
  if (!el) return ''
  return (el.textContent || '').replace(/\s+/g, ' ').trim()
}

export function hashString(input: string): string {
  // Small, stable non-crypto hash for dedupe/IDs (avoid adding deps).
  let hash = 5381
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash) ^ input.charCodeAt(i)
  }
  // unsigned -> base36
  return (hash >>> 0).toString(36)
}

export function firstNonEmptyText(selectors: string[]): string {
  for (const selector of selectors) {
    const t = getText(document.querySelector(selector))
    if (t) return t
  }
  return ''
}

export function collectTexts(selector: string, limit: number = 20): string[] {
  const nodes = Array.from(document.querySelectorAll(selector)).slice(0, limit)
  return nodes.map(n => getText(n)).filter(Boolean)
}

export function mainLikeElement(): Element | null {
  return (
    document.querySelector('main') ||
    document.querySelector('article') ||
    document.querySelector('#app') ||
    document.body
  )
}

export function readableContentText(): string {
  const root = mainLikeElement()
  if (!root) return ''

  // Avoid pulling scripts/styles
  const clone = root.cloneNode(true) as Element
  for (const bad of Array.from(clone.querySelectorAll('script, style, noscript'))) {
    bad.remove()
  }

  const text = getText(clone)
  return text
}

export function isLikelyProblemPage(title: string, content: string): boolean {
  const t = title.trim()
  const c = content.trim()
  if (!t || t.length < 2) return false
  if (c.length < 80) return false

  // Heuristic: typical question cues
  const cues = ['题目', '输入', '输出', '样例', '选项', '解析', 'Constraints', 'Example', 'Input', 'Output']
  if (cues.some(k => c.includes(k))) return true

  // If it looks like a profile/settings page, skip
  const negative = ['设置', '隐私', '账号', '登录', '注册', '消息', '通知']
  if (negative.some(k => t.includes(k))) return false

  return true
}
