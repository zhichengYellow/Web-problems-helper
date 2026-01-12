chrome.runtime.onInstalled.addListener(() => {
  console.log('Web 题目助手（Modern）已安装')
})

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'ping') {
    sendResponse({ ok: true })
    return true
  }

  sendResponse({ ok: false })
  return true
})
