import type { PlatformId } from './platforms/types'
import { detectPlatformFromUrl, getPlatformMeta } from './platforms/detect'

type CapturedProblem = {
	id: string
	title: string
	content: string
	type?: string
	difficulty?: string
	platform?: string
	url?: string
	source?: string
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}): HTMLElementTagNameMap[K] {
	const node = document.createElement(tag)
	for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v)
	return node
}

async function getActiveTabUrl(): Promise<string | undefined> {
	const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
	return tabs[0]?.url
}

async function getCapturedProblems(): Promise<CapturedProblem[]> {
	const res = await chrome.runtime.sendMessage({ type: 'getCapturedProblems' })
	if (!res?.ok) return []
	return Array.isArray(res.problems) ? res.problems : []
}

async function getBackendUrl(): Promise<string> {
	const res = await chrome.runtime.sendMessage({ type: 'getBackendConfig' })
	if (!res?.ok) return 'http://localhost:3000'
	return String(res.backendUrl || 'http://localhost:3000')
}

async function setBackendUrl(backendUrl: string): Promise<boolean> {
	const res = await chrome.runtime.sendMessage({ type: 'setBackendConfig', backendUrl })
	return Boolean(res?.ok)
}

async function testBackend(): Promise<{ ok: boolean; status?: number; body?: string; error?: string }> {
	const res = await chrome.runtime.sendMessage({ type: 'testBackend' })
	return res || { ok: false, error: 'no response' }
}

async function importCapturedProblems(): Promise<{ ok: boolean; status?: number; body?: string; error?: string; sent?: number }> {
	const res = await chrome.runtime.sendMessage({ type: 'importCapturedProblems' })
	return res || { ok: false, error: 'no response' }
}

async function clearCapturedProblems(): Promise<void> {
	await chrome.storage.local.remove(['wph:capture:problems'])
}

async function copyText(text: string): Promise<boolean> {
	try {
		await navigator.clipboard.writeText(text)
		return true
	} catch {
		return false
	}
}

function normalizePlatformId(p: unknown): PlatformId {
	const s = String(p || '').toLowerCase()
	if (s === 'pintia') return 'pintia'
	if (s === 'leetcode') return 'leetcode'
	if (s === 'luogu') return 'luogu'
	if (s === 'chaoxing') return 'chaoxing'
	if (s === 'fenbi') return 'fenbi'
	return 'unknown'
}

async function render(): Promise<void> {
	const root = document.getElementById('root')
	if (!root) return
	root.textContent = ''

	const url = await getActiveTabUrl()
	const platform = detectPlatformFromUrl(url)
	const meta = getPlatformMeta(platform)

	const header = el('div', { class: 'row' })
	const left = el('div')
	const title = el('div', { class: 'title' })
	title.textContent = 'Web 题目助手（Modern）'
	const sub = el('div', { class: 'muted' })
	sub.textContent = url ? new URL(url).hostname : '未获取到当前标签页 URL'
	left.appendChild(title)
	left.appendChild(sub)

	const badge = el('span', { class: 'badge' })
	badge.textContent = meta.name
	badge.style.background = meta.badgeColor

	header.appendChild(left)
	header.appendChild(badge)
	root.appendChild(header)

	const card = el('div', { class: 'card' })
	const stat = el('div', { class: 'muted' })
	stat.textContent = '正在读取已抓取题目…'
	card.appendChild(stat)

	const list = el('ul')
	card.appendChild(list)

	const actions = el('div', { class: 'btns' })
	const btnCopy = el('button', { class: 'primary' })
	btnCopy.textContent = '复制当前平台 JSON'
	const btnClear = el('button', { class: 'danger' })
	btnClear.textContent = '清空已抓取'
	actions.appendChild(btnCopy)
	actions.appendChild(btnClear)
	card.appendChild(actions)

	const hint = el('div', { class: 'hint' })
	hint.textContent = '仅采集你当前浏览页面可见的公开题面内容。'
	card.appendChild(hint)

	root.appendChild(card)

	const bridge = el('div', { class: 'card' })
	const bridgeTitle = el('div', { class: 'title' })
	bridgeTitle.textContent = '联桥到后端'
	bridge.appendChild(bridgeTitle)

	const bridgeMuted = el('div', { class: 'muted' })
	bridgeMuted.textContent = '默认走 http://localhost:3000（nginx 入口），也可改为 8080。'
	bridge.appendChild(bridgeMuted)

	const input = el('input') as HTMLInputElement
	input.placeholder = '后端地址，例如 http://localhost:3000'
	input.value = await getBackendUrl()
	bridge.appendChild(input)

	const bridgeActions = el('div', { class: 'btns' })
	const btnSave = el('button', { class: 'primary' })
	btnSave.textContent = '保存地址'
	const btnTest = el('button')
	btnTest.textContent = '测试连接'
	const btnSync = el('button', { class: 'primary' })
	btnSync.textContent = '同步入库'
	bridgeActions.appendChild(btnSave)
	bridgeActions.appendChild(btnTest)
	bridgeActions.appendChild(btnSync)
	bridge.appendChild(bridgeActions)

	const bridgeStatus = el('div', { class: 'status' })
	bridge.appendChild(bridgeStatus)

	root.appendChild(bridge)

	const all = await getCapturedProblems()
	const filtered = all.filter(p => normalizePlatformId(p.platform) === platform)
	stat.textContent = `已抓取：总计 ${all.length} 条；当前平台（${meta.name}）${filtered.length} 条。`

	const preview = filtered.slice(-5).reverse()
	list.textContent = ''
	if (preview.length === 0) {
		const li = el('li')
		li.textContent = '暂无题目。打开一道题后会自动记录。'
		list.appendChild(li)
	} else {
		for (const p of preview) {
			const li = el('li')
			li.textContent = p.title || p.id
			list.appendChild(li)
		}
	}

	btnCopy.addEventListener('click', async () => {
		const payload = {
			platform: meta.name,
			platformId: platform,
			exportedAt: new Date().toISOString(),
			problems: filtered
		}

		const text = JSON.stringify(payload, null, 2)
		const ok = await copyText(text)
		if (ok) {
			btnCopy.textContent = '已复制'
			setTimeout(() => (btnCopy.textContent = '复制当前平台 JSON'), 1200)
			return
		}

		// Fallback UI if clipboard is unavailable
		const ta = el('textarea') as HTMLTextAreaElement
		ta.value = text
		card.appendChild(ta)
		ta.focus()
		ta.select()
	})

	btnClear.addEventListener('click', async () => {
		await clearCapturedProblems()
		await render()
	})

	btnSave.addEventListener('click', async () => {
		const ok = await setBackendUrl(input.value)
		bridgeStatus.textContent = ok ? '已保存。' : '保存失败。'
	})

	btnTest.addEventListener('click', async () => {
		bridgeStatus.textContent = '测试中…'
		await setBackendUrl(input.value)
		const res = await testBackend()
		if (res.ok) {
			bridgeStatus.textContent = `OK（${res.status}）\n${(res.body || '').slice(0, 500)}`
		} else {
			bridgeStatus.textContent = `失败：${res.error || res.status || ''}\n${(res.body || '').slice(0, 500)}`
		}
	})

	btnSync.addEventListener('click', async () => {
		bridgeStatus.textContent = '同步中…'
		await setBackendUrl(input.value)
		const res = await importCapturedProblems()
		if (res.ok) {
			bridgeStatus.textContent = `已发送 ${res.sent ?? 0} 条（${res.status}）。\n${(res.body || '').slice(0, 500)}`
		} else {
			bridgeStatus.textContent = `同步失败：${res.error || res.status || ''}\n${(res.body || '').slice(0, 500)}`
		}
	})
}

render().catch((e) => {
	const root = document.getElementById('root')
	if (root) root.textContent = `Popup 初始化失败：${String(e)}`
})
