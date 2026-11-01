const BUTTON_CLASS = 'watchly-open-video-btn'
const STYLE_ID = 'watchly-open-video-btn-styles'

const THUMBNAIL_SELECTOR = 'ytd-thumbnail, yt-thumbnail-view-model, ytd-playlist-thumbnail'
const VIDEO_LINK_SELECTOR = 'a[href*="/watch?v="], a[href*="/shorts/"]'
const PREVIEW_SELECTOR = 'ytd-video-preview'
const PREVIEW_ACTIVE_CLASS = 'ytdVideoPreviewActive'

let featureEnabled = true

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return

  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    .${BUTTON_CLASS} {
      position: absolute;
      top: 8px;
      left: 8px;
      z-index: 30;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 7px 11px;
      border: 0;
      border-radius: 999px;
      background: rgba(15, 15, 15, 0.85);
      color: #fff;
      font-family: Roboto, Arial, sans-serif;
      font-size: 13px;
      font-weight: 600;
      line-height: 1;
      letter-spacing: 0.2px;
      cursor: pointer;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(4px);
      transition: background 120ms ease, color 120ms ease, transform 120ms ease;
    }

    .${BUTTON_CLASS}:hover {
      background: #3ea6ff;
      color: #0f0f0f;
      transform: scale(1.05);
    }

    .${BUTTON_CLASS}:active {
      transform: scale(0.96);
    }

    .${BUTTON_CLASS} svg {
      display: block;
      flex-shrink: 0;
    }
  `

  document.head.appendChild(style)
}

function buildVideoUrl(anchor: HTMLAnchorElement): string | null {
  const href = anchor.getAttribute('href')
  if (!href) return null

  try {
    const url = new URL(href, window.location.origin)
    const videoId = url.searchParams.get('v')
    if (videoId) return `https://www.youtube.com/watch?v=${videoId}`

    const shortsMatch = url.pathname.match(/^\/shorts\/([A-Za-z0-9_-]+)/)
    if (shortsMatch) return `https://www.youtube.com/shorts/${shortsMatch[1]}`

    return null
  } catch {
    return null
  }
}

function createButton(url: string): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = BUTTON_CLASS
  button.title = 'Open in new tab'
  button.setAttribute('aria-label', 'Open video in new tab')
  button.dataset.url = url

  const svgNamespace = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(svgNamespace, 'svg')
  svg.setAttribute('width', '14')
  svg.setAttribute('height', '14')
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('fill', 'none')
  svg.setAttribute('stroke', 'currentColor')
  svg.setAttribute('stroke-width', '2.5')
  svg.setAttribute('stroke-linecap', 'round')
  svg.setAttribute('stroke-linejoin', 'round')
  svg.setAttribute('aria-hidden', 'true')

  const path = document.createElementNS(svgNamespace, 'path')
  path.setAttribute('d', 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6')

  const polyline = document.createElementNS(svgNamespace, 'polyline')
  polyline.setAttribute('points', '15 3 21 3 21 9')

  const line = document.createElementNS(svgNamespace, 'line')
  line.setAttribute('x1', '10')
  line.setAttribute('y1', '14')
  line.setAttribute('x2', '21')
  line.setAttribute('y2', '3')

  svg.append(path, polyline, line)

  const label = document.createElement('span')
  label.textContent = 'Open'

  button.append(svg, label)

  const stopPropagation = (event: Event) => event.stopPropagation()

  button.addEventListener('pointerdown', stopPropagation)
  button.addEventListener('mousedown', stopPropagation)
  button.addEventListener('click', event => {
    event.preventDefault()
    event.stopPropagation()

    const videoUrl = button.dataset.url
    if (!videoUrl) return

    try {
      chrome.runtime.sendMessage({ type: 'OPEN_VIDEO_TAB', url: videoUrl }).catch(() => {})
    } catch {
      // The extension was reloaded while this page was open.
    }
  })

  return button
}

function createPreviewButton(url: string, thumbnail: HTMLElement | null, preview: HTMLElement): HTMLButtonElement {
  const button = createButton(url)
  button.dataset.watchlyPreviewButton = 'true'
  button.style.zIndex = '2147483647'

  // Keep the button aligned with the thumbnail, not the slightly larger preview frame.
  const previewRect = preview.getBoundingClientRect()
  if (previewRect.width > 0 && previewRect.height > 0) {
    const thumbnailRect = thumbnail?.getBoundingClientRect()
    button.style.top = `${8 + Math.max(0, thumbnailRect ? thumbnailRect.top - previewRect.top : 12)}px`
    button.style.left = `${8 + Math.max(0, thumbnailRect ? thumbnailRect.left - previewRect.left : 12)}px`
  }

  return button
}

function getPreviewVideoUrl(preview: HTMLElement): string | null {
  const anchor = preview.querySelector<HTMLAnchorElement>(VIDEO_LINK_SELECTOR)
  return anchor ? buildVideoUrl(anchor) : null
}

function findThumbnailForPreview(url: string, preview: HTMLElement): HTMLElement | null {
  if (lastHoveredThumbnail?.isConnected) {
    const button = lastHoveredThumbnail.querySelector<HTMLButtonElement>(`:scope > .${BUTTON_CLASS}`)
    if (button?.dataset.url === url) return lastHoveredThumbnail
  }

  const previewRect = preview.getBoundingClientRect()
  let closest: HTMLElement | null = null
  let closestDistance = Infinity

  document.querySelectorAll<HTMLElement>(THUMBNAIL_SELECTOR).forEach(thumbnail => {
    const button = thumbnail.querySelector<HTMLButtonElement>(`:scope > .${BUTTON_CLASS}`)
    if (button?.dataset.url !== url) return

    const rect = thumbnail.getBoundingClientRect()
    const dx = rect.left + rect.width / 2 - (previewRect.left + previewRect.width / 2)
    const dy = rect.top + rect.height / 2 - (previewRect.top + previewRect.height / 2)
    const distance = dx * dx + dy * dy
    if (distance < closestDistance) {
      closestDistance = distance
      closest = thumbnail
    }
  })

  return closest
}

// YouTube renders inline previews in a separate top-level ytd-video-preview layer
// that covers the thumbnail (and the original button). Mirror the button inside the
// preview so it remains visible and clickable while the preview is playing.
function syncPreviewButton() {
  if (syncingPreview) return
  syncingPreview = true

  try {
    const preview = document.querySelector<HTMLElement>(PREVIEW_SELECTOR)
    const existing = preview?.querySelector<HTMLButtonElement>(':scope > [data-watchly-preview-button]') ?? null

    if (!preview || !preview.classList.contains(PREVIEW_ACTIVE_CLASS)) {
      existing?.remove()
      return
    }

    const url = getPreviewVideoUrl(preview)
    if (!url) {
      existing?.remove()
      return
    }

    if (existing?.dataset.url === url) return
    existing?.remove()

    preview.appendChild(createPreviewButton(url, findThumbnailForPreview(url, preview), preview))
  } finally {
    syncingPreview = false
  }
}

function watchPreview() {
  const preview = document.querySelector<HTMLElement>(PREVIEW_SELECTOR)
  if (!preview || preview === observedPreview) return

  previewObserver?.disconnect()
  observedPreview = preview
  previewObserver = new MutationObserver(queuePreviewSync)
  previewObserver.observe(preview, {
    attributes: true,
    attributeFilter: ['class'],
    childList: true,
    subtree: true,
  })
  queuePreviewSync()
}

function decorateThumbnail(thumbnail: HTMLElement) {
  const anchor = thumbnail.closest<HTMLAnchorElement>(VIDEO_LINK_SELECTOR) ?? thumbnail.querySelector<HTMLAnchorElement>(VIDEO_LINK_SELECTOR)
  if (!anchor) return

  const url = buildVideoUrl(anchor)
  if (!url) return

  const existing = thumbnail.querySelector<HTMLButtonElement>(`:scope > .${BUTTON_CLASS}`)
  if (existing) {
    existing.dataset.url = url
    return
  }

  if (window.getComputedStyle(thumbnail).position === 'static') {
    thumbnail.style.position = 'relative'
  }

  thumbnail.appendChild(createButton(url))
}

function scanThumbnails() {
  if (!featureEnabled) return

  document.querySelectorAll<HTMLElement>(THUMBNAIL_SELECTOR).forEach(thumbnail => {
    try {
      decorateThumbnail(thumbnail)
    } catch {
      // Ignore unexpected markup changes for a single thumbnail.
    }
  })

  queuePreviewSync()
}

let scanQueued = false
let lastHoveredThumbnail: HTMLElement | null = null
let previewObserver: MutationObserver | null = null
let observedPreview: HTMLElement | null = null
let previewSyncQueued = false
let syncingPreview = false

function queuePreviewSync() {
  if (previewSyncQueued) return
  previewSyncQueued = true

  const run = () => {
    previewSyncQueued = false
    syncPreviewButton()
  }

  if (typeof window.requestAnimationFrame === 'function') {
    window.requestAnimationFrame(run)
  } else {
    window.setTimeout(run, 50)
  }
}

function queueScan() {
  if (scanQueued) return
  scanQueued = true

  const run = () => {
    scanQueued = false
    scanThumbnails()
  }

  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(run, { timeout: 1000 })
  } else {
    window.setTimeout(run, 250)
  }
}

export function initThumbnailButtons() {
  ensureStyles()
  scanThumbnails()
  watchPreview()

  document.addEventListener('yt-navigate-finish', queueScan)
  document.addEventListener('yt-page-data-updated', queueScan)

  document.addEventListener(
    'pointerover',
    event => {
      const target = event.target
      if (!(target instanceof Element)) return

      const thumbnail = target.closest<HTMLElement>(THUMBNAIL_SELECTOR)
      if (!thumbnail) return

      lastHoveredThumbnail = thumbnail
      queuePreviewSync()
    },
    true
  )

  new MutationObserver(() => {
    watchPreview()
    queueScan()
  }).observe(document.documentElement, {
    childList: true,
    subtree: true,
  })
}

function removeAllButtons() {
  document.querySelectorAll<HTMLElement>(`.${BUTTON_CLASS}`).forEach(btn => btn.remove())
  document.querySelector<HTMLElement>(`#${STYLE_ID}`)?.remove()

  const preview = document.querySelector<HTMLElement>(PREVIEW_SELECTOR)
  preview?.querySelector<HTMLElement>(':scope > [data-watchly-preview-button]')?.remove()
}

export function disableThumbnailButtons() {
  featureEnabled = false
  removeAllButtons()
}

export function enableThumbnailButtons() {
  featureEnabled = true
  ensureStyles()
  scanThumbnails()
}
