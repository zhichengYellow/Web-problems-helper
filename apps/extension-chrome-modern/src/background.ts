type CapturedProblem = {
  id: string
  title: string
  content: string
  type?: string
  difficulty?: string
  platform?: string
  url?: string
  source?: string
  options?: string[]
}

type ConsoleOptionDto = { label?: string; text: string }
type QuestionDto = {
  externalId?: string
  platform?: string
  url?: string
  type: string
  questionText: string
  options?: ConsoleOptionDto[]
  answer?: string
  knowledgePoints?: string[]
  tags?: string[]
  source?: string
}

const STORAGE_CAPTURED = 'wph:capture:problems'
const STORAGE_BACKEND_URL = 'wph:backend:url'
const DEFAULT_BACKEND_URL = 'http://localhost:3000'

function normalizeBaseUrl(url: string): string {
  const s = String(url || '').trim()
  return s.endsWith('/') ? s.slice(0, -1) : s
}

function toBackendQuestion(p: CapturedProblem): QuestionDto | null {
  const questionText = (p.content || p.title || '').trim()
  if (!questionText) return null

  const rawType = String(p.type || '').trim()
  const type = rawType || 'programming'

  const options: ConsoleOptionDto[] | undefined = Array.isArray(p.options)
    ? p.options
        .filter(Boolean)
        .map((text, idx) => ({
          label: String.fromCharCode('A'.charCodeAt(0) + idx),
          text: String(text)
        }))
    : undefined

  return {
    externalId: p.id,
    platform: p.platform,
    url: p.url,
    type,
    questionText,
    options,
    answer: '',
    knowledgePoints: [],
    tags: [],
    source: p.source || p.platform
  }
}

chrome.runtime.onInstalled.addListener(() => {
  console.log('Web 题目助手（Modern）已安装')
})

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'ping') {
    sendResponse({ ok: true })
    return true
  }

  if (message?.type === 'getCapturedProblems') {
    chrome.storage.local.get([STORAGE_CAPTURED]).then((res) => {
      const problems = Array.isArray(res[STORAGE_CAPTURED]) ? res[STORAGE_CAPTURED] : []
      sendResponse({ ok: true, problems })
    }).catch((err) => {
      sendResponse({ ok: false, error: String(err) })
    })
    return true
  }

  if (message?.type === 'getBackendConfig') {
    chrome.storage.local.get([STORAGE_BACKEND_URL]).then((res) => {
      const backendUrl = typeof res[STORAGE_BACKEND_URL] === 'string' && res[STORAGE_BACKEND_URL]
        ? res[STORAGE_BACKEND_URL]
        : DEFAULT_BACKEND_URL
      sendResponse({ ok: true, backendUrl })
    }).catch((err) => sendResponse({ ok: false, error: String(err) }))
    return true
  }

  if (message?.type === 'setBackendConfig') {
    const backendUrl = normalizeBaseUrl(String(message?.backendUrl || ''))
    chrome.storage.local.set({ [STORAGE_BACKEND_URL]: backendUrl || DEFAULT_BACKEND_URL }).then(() => {
      sendResponse({ ok: true })
    }).catch((err) => sendResponse({ ok: false, error: String(err) }))
    return true
  }

  if (message?.type === 'testBackend') {
    ;(async () => {
      const res = await chrome.storage.local.get([STORAGE_BACKEND_URL])
      const backendUrl = normalizeBaseUrl(String(res[STORAGE_BACKEND_URL] || DEFAULT_BACKEND_URL))
      const url = `${backendUrl}/actuator/health`
      try {
        const r = await fetch(url, { method: 'GET' })
        const text = await r.text()
        sendResponse({ ok: r.ok, status: r.status, body: text })
      } catch (e) {
        sendResponse({ ok: false, error: String(e) })
      }
    })()
    return true
  }

  if (message?.type === 'importCapturedProblems') {
    ;(async () => {
      try {
        const [{ [STORAGE_CAPTURED]: raw }, { [STORAGE_BACKEND_URL]: configured }] = await Promise.all([
          chrome.storage.local.get([STORAGE_CAPTURED]),
          chrome.storage.local.get([STORAGE_BACKEND_URL])
        ])
        const problems: CapturedProblem[] = Array.isArray(raw) ? raw : []
        const backendUrl = normalizeBaseUrl(String(configured || DEFAULT_BACKEND_URL))
        const endpoint = `${backendUrl}/api/console/questions/import`

        const items = problems
          .map(toBackendQuestion)
          .filter((x): x is QuestionDto => Boolean(x))

        const r = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(items)
        })
        const text = await r.text()
        sendResponse({ ok: r.ok, status: r.status, body: text, sent: items.length })
      } catch (e) {
        sendResponse({ ok: false, error: String(e) })
      }
    })()
    return true
  }

  sendResponse({ ok: false })
  return true
})
