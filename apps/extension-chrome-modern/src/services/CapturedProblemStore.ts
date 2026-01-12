import type { ProblemInfo } from '../core/WebProblemsHelper'

const STORAGE_KEY = 'wph:capture:problems'
const DEFAULT_LIMIT = 200

export class CapturedProblemStore {
  async append(problems: ProblemInfo[], limit: number = DEFAULT_LIMIT): Promise<void> {
    if (!problems.length) return

    if (typeof chrome === 'undefined' || !chrome.storage?.local) {
      // Non-extension environment (tests/dev)
      return
    }

    const current = await chrome.storage.local.get([STORAGE_KEY])
    const existing: ProblemInfo[] = Array.isArray(current[STORAGE_KEY]) ? current[STORAGE_KEY] : []

    const byId = new Map<string, ProblemInfo>()
    for (const p of existing) byId.set(p.id, p)
    for (const p of problems) byId.set(p.id, p)

    const merged = Array.from(byId.values())
      // Keep newest-ish at end: stable but deterministic
      .slice(-limit)

    await chrome.storage.local.set({ [STORAGE_KEY]: merged })
  }

  async list(): Promise<ProblemInfo[]> {
    if (typeof chrome === 'undefined' || !chrome.storage?.local) return []
    const res = await chrome.storage.local.get([STORAGE_KEY])
    return Array.isArray(res[STORAGE_KEY]) ? res[STORAGE_KEY] : []
  }

  async clear(): Promise<void> {
    if (typeof chrome === 'undefined' || !chrome.storage?.local) return
    await chrome.storage.local.remove([STORAGE_KEY])
  }
}
