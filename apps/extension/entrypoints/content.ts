import type { VideoStatus } from '../utils/types'
import { initShortsSpeed, disableShortsSpeed, enableShortsSpeed } from '../utils/shorts-speed'
import { initThumbnailButtons, disableThumbnailButtons, enableThumbnailButtons } from '../utils/thumbnail-button'
import { FEATURE_KEYS, getFeatureSettings } from '../utils/feature-storage'

export default defineContentScript({
  matches: ['*://www.youtube.com/*'],
  main() {
    let thumbnailInitialized = false
    let shortsSpeedInitialized = false

    async function bootstrapFeatures() {
      const settings = await getFeatureSettings()

      if (settings[FEATURE_KEYS.openButton]) {
        if (!thumbnailInitialized) {
          initThumbnailButtons()
          thumbnailInitialized = true
        } else {
          enableThumbnailButtons()
        }
      } else if (thumbnailInitialized) {
        disableThumbnailButtons()
      }

      if (settings[FEATURE_KEYS.shortsSpeed]) {
        if (!shortsSpeedInitialized) {
          initShortsSpeed()
          shortsSpeedInitialized = true
        } else {
          enableShortsSpeed()
        }
      } else if (shortsSpeedInitialized) {
        disableShortsSpeed()
      }
    }

    bootstrapFeatures()

    // React to toggle changes from the popup in real time
    try {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== 'local') return

        if (changes[FEATURE_KEYS.openButton]) {
          const enabled = changes[FEATURE_KEYS.openButton].newValue
          if (enabled === false) {
            disableThumbnailButtons()
          } else {
            if (!thumbnailInitialized) {
              initThumbnailButtons()
              thumbnailInitialized = true
            } else {
              enableThumbnailButtons()
            }
          }
        }

        if (changes[FEATURE_KEYS.shortsSpeed]) {
          const enabled = changes[FEATURE_KEYS.shortsSpeed].newValue
          if (enabled === false) {
            disableShortsSpeed()
          } else {
            if (!shortsSpeedInitialized) {
              initShortsSpeed()
              shortsSpeedInitialized = true
            } else {
              enableShortsSpeed()
            }
          }
        }
      })
    } catch {
      // Storage events unavailable after extension reload
    }

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
