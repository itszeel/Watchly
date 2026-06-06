import type { VideoStatus } from '../utils/storage'

export default defineContentScript({
  matches: ['*://www.youtube.com/*'],
  main() {
    function createChip(status: VideoStatus): HTMLDivElement {
      const chip = document.createElement('div')
      chip.id = 'watchly-chip'

      const colors: Record<VideoStatus, { bg: string; text: string; label: string }> = {
        added: { bg: '#3ea6ff', text: '#0f0f0f', label: 'Added' },
        watched: { bg: '#2ba640', text: '#fff', label: 'Watched' },
      }

      const c = colors[status]
      chip.textContent = c.label
      Object.assign(chip.style, {
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600',
        letterSpacing: '0.3px',
        background: c.bg,
        color: c.text,
        marginLeft: '12px',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        lineHeight: '20px',
      })

      return chip
    }

    function injectChip(status: VideoStatus) {
      document.getElementById('watchly-chip')?.remove()
      const chip = createChip(status)

      const target = document.querySelector<HTMLElement>('ytd-masthead #center, #masthead-container #center, #masthead #center')

      if (target?.parentElement) {
        target.parentElement.insertBefore(chip, target)
        return
      }

      const masthead = document.querySelector<HTMLElement>('ytd-masthead, #masthead-container') || document.querySelector<HTMLElement>('#above-the-fold h1')?.parentElement

      if (masthead) {
        masthead.prepend(chip)
        return
      }

      document.body.prepend(chip)
      Object.assign(chip.style, {
        position: 'fixed',
        top: '8px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: '9999',
        marginLeft: '0',
      })
    }

    async function handlePage() {
      const match = window.location.href.match(/[?&]v=([^&]+)/)
      if (!match) return

      const videoId = match[1]
      const res = await chrome.runtime.sendMessage({ type: 'GET_VIDEO_STATUS', videoId })
      if (res?.status) injectChip(res.status as VideoStatus)
    }

    chrome.runtime.onMessage.addListener(message => {
      if (message.type === 'STORAGE_UPDATED') handlePage()
    })

    let lastUrl = window.location.href
    new MutationObserver(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href
        document.getElementById('watchly-chip')?.remove()
        handlePage()
      }
    }).observe(document, { subtree: true, childList: true })

    setInterval(handlePage, 2000)
    handlePage()
  },
})
