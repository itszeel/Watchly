import type { VideoStatus } from '../utils/types'
import { initShortsSpeed, disableShortsSpeed, enableShortsSpeed, onShortsDomMutated } from '../utils/shorts-speed'
import { initThumbnailButtons, disableThumbnailButtons, enableThumbnailButtons, onThumbnailDomMutated } from '../utils/thumbnail-button'
import { FEATURE_KEYS, getFeatureSettings } from '../utils/feature-storage'

// Static — no need to recreate on every chip injection
const CHIP_COLORS: Record<VideoStatus, { bg: string; text: string; label: string }> = {
  added: { bg: '#3ea6ff', text: '#0f0f0f', label: 'Added' },
  watched: { bg: '#2ba640', text: '#fff', label: 'Watched' },
}

export default defineContentScript({
  matches: ['*://www.youtube.com/*'],
  main() {
    let thumbnailInitialized = false
    let shortsSpeedInitialized = false

    // ── Feature bootstrap ──────────────────────────────────────────────────

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

    // ── Feature toggle listener ────────────────────────────────────────────

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

    // ── Video status chip ──────────────────────────────────────────────────

    let lastChipVideoId: string | null = null
    let lastChipStatus: string | null = null
    let handlePageQueued = false

    function createChip(status: VideoStatus): HTMLDivElement {
      const chip = document.createElement('div')
      chip.id = 'watchly-chip'

      const c = CHIP_COLORS[status]
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
      if (!match) {
        // Not a video page — clean up any lingering chip
        if (lastChipVideoId) {
          document.getElementById('watchly-chip')?.remove()
          lastChipVideoId = null
          lastChipStatus = null
        }
        return
      }

      const videoId = match[1]

      try {
        const res = await chrome.runtime.sendMessage({ type: 'GET_VIDEO_STATUS', videoId })
        if (res?.status) {
          // Skip re-injection if chip already shows the same status for the same video
          if (videoId === lastChipVideoId && res.status === lastChipStatus) return
          lastChipVideoId = videoId
          lastChipStatus = res.status
          injectChip(res.status as VideoStatus)
        }
      } catch {
        // Extension context invalidated
      }
    }

    /** Debounce rapid-fire handlePage calls into a single rAF execution */
    function queueHandlePage() {
      if (handlePageQueued) return
      handlePageQueued = true
      requestAnimationFrame(() => {
        handlePageQueued = false
        handlePage()
      })
    }

    // ── Message listener ───────────────────────────────────────────────────

    chrome.runtime.onMessage.addListener(message => {
      if (message.type === 'STORAGE_UPDATED') {
        // Status may have changed — force re-check even if same video
        lastChipStatus = null
        queueHandlePage()
      }
    })

    // ── Consolidated MutationObserver (single for entire extension) ───────

    let lastUrl = window.location.href

    function onUrlChanged() {
      lastUrl = window.location.href
      lastChipVideoId = null
      lastChipStatus = null
      document.getElementById('watchly-chip')?.remove()
      queueHandlePage()
      updatePolling()
    }

    new MutationObserver(() => {
      // URL change detection (cheap string compare)
      if (window.location.href !== lastUrl) {
        onUrlChanged()
      }

      // Dispatch to feature modules (both have internal debouncing/queueing)
      if (thumbnailInitialized) onThumbnailDomMutated()
      if (shortsSpeedInitialized) onShortsDomMutated()
    }).observe(document.documentElement, {
      childList: true,
      subtree: true,
    })

    // Also listen for YouTube's own navigation events for reliability
    document.addEventListener('yt-navigate-finish', () => {
      if (window.location.href !== lastUrl) onUrlChanged()
    })
    document.addEventListener('yt-page-data-updated', () => {
      if (window.location.href !== lastUrl) onUrlChanged()
    })

    // ── Smart polling (only on video pages, longer interval) ─────────────

    let pollIntervalId: ReturnType<typeof setInterval> | null = null

    function updatePolling() {
      const isVideoPage = /[?&]v=/.test(window.location.href)
      if (isVideoPage && !pollIntervalId) {
        pollIntervalId = setInterval(handlePage, 5000)
      } else if (!isVideoPage && pollIntervalId) {
        clearInterval(pollIntervalId)
        pollIntervalId = null
      }
    }

    // ── Kick off ─────────────────────────────────────────────────────────

    updatePolling()
    handlePage()
  },
})
