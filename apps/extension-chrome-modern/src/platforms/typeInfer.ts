export type ClassicQuestionType =
  | 'single_choice'
  | 'multiple_choice'
  | 'true_false'
  | 'fill_blank'
  | 'function'
  | 'programming'

function normText(s: unknown): string {
  return String(s || '')
    .replace(/\s+/g, ' ')
    .trim()
}

function looksLikeFillBlank(text: string): boolean {
  // Common blank patterns: ____ , （ ）, ( ), 【 】, 空格/填空提示
  if (/_{3,}/.test(text)) return true
  if (/[（(]\s*[）)]/.test(text)) return true
  if (/[【\[]\s*[】\]]/.test(text)) return true
  if (/(填空|补全|空格|空白处|在\s*\(\s*\)\s*处|在\s*（\s*）\s*处)/.test(text)) return true
  return false
}

function looksLikeTrueFalse(text: string, options?: string[]): boolean {
  if (/(判断题|对错题|正误题|true\s*\/\s*false|true\b|false\b)/i.test(text)) return true

  const opts = (options || []).map((x) => normText(x)).filter(Boolean)
  if (opts.length === 2) {
    const joined = opts.join('|')
    if (/(^|\|)(对|正确|是|true)(\||$)/i.test(joined) && /(^|\|)(错|错误|否|false)(\||$)/i.test(joined)) {
      return true
    }
  }
  return false
}

function looksLikeFunctionDesign(text: string): boolean {
  return /(函数|function\b|实现\s*函数|补全\s*函数|完成\s*函数|函数设计|func\b)/i.test(text)
}

function looksLikeMultipleChoice(text: string): boolean {
  return /(多选|不定项|不定选|可多选|选出所有|选择多项|多项选择)/.test(text)
}

export function inferQuestionType(input: {
  title?: string
  content: string
  options?: string[]
}): ClassicQuestionType {
  const title = normText(input.title)
  const content = normText(input.content)
  const text = `${title}\n${content}`

  const options = (input.options || []).map((x) => normText(x)).filter(Boolean)
  const hasOptions = options.length >= 2

  if (hasOptions) {
    if (looksLikeTrueFalse(text, options)) return 'true_false'
    if (looksLikeMultipleChoice(text)) return 'multiple_choice'
    return 'single_choice'
  }

  if (looksLikeTrueFalse(text, options)) return 'true_false'
  if (looksLikeFillBlank(text)) return 'fill_blank'
  if (looksLikeFunctionDesign(text)) return 'function'

  return 'programming'
}

export function normalizeOptions(raw?: string[]): string[] | undefined {
  if (!raw || raw.length === 0) return undefined
  const uniq = new Set<string>()
  for (const it of raw) {
    const t = normText(it)
    if (!t) continue
    // avoid accidentally grabbing whole-page labels
    if (t.length > 200) continue
    uniq.add(t)
    if (uniq.size >= 30) break
  }
  const out = Array.from(uniq)
  return out.length >= 2 ? out : undefined
}
