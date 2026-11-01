const STORAGE_KEY = 'watchly-shorts-speed'
const DEFAULT_SPEED = 2
const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3]
const CONTROL_ID = 'watchly-shorts-speed'
const STYLE_ID = 'watchly-shorts-speed-styles'

const SHORTS_CONTAINER_SELECTOR = 'ytd-shorts, ytd-reel-video-renderer, ytd-shorts-video-renderer, yt-shorts-video-renderer, #shorts-player, #shorts-container'
const VIDEO_SELECTOR = 'ytd-shorts video, ytd-reel-video-renderer video, ytd-shorts-video-renderer video, yt-shorts-video-renderer video, #shorts-player video, #shorts-container video'

const ACTION_BAR_SELECTOR = 'reel-action-bar-view-model'

let desiredSpeed = DEFAULT_SPEED
let control: HTMLDivElement | null = null
let menuOpen = false
let lastHref = window.location.href
let featureEnabled = true
let navTimeoutIds: ReturnType<typeof setTimeout>[] = []

function isShortsPage(): boolean {
  return window.location.pathname.startsWith('/shorts/')
}

function formatSpeed(speed: number): string {
  return `${speed}x`
}

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return

  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    #${CONTROL_ID} {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 6px;
      font-family: Roboto, Arial, sans-serif;
      color: #fff;
      user-select: none;
      pointer-events: auto;
      z-index: 10;
    }

    #${CONTROL_ID} .watchly-speed-trigger {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 0;
      border: 0;
      background: transparent;
      color: #fff;
      font: inherit;
      cursor: pointer;
      outline: none;
    }

    #${CONTROL_ID} .watchly-speed-circle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(28, 28, 32, 0.8);
      border: 1.5px solid rgba(255, 255, 255, 0.16);
      color: #fff;
      box-shadow: 0 3px 12px rgba(0, 0, 0, 0.35);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      transition: all 180ms cubic-bezier(0.2, 0, 0, 1);
    }

    #${CONTROL_ID} .watchly-speed-circle[data-active='true'] {
      border-color: #3ea6ff;
      background: rgba(18, 34, 52, 0.85);
      color: #3ea6ff;
      box-shadow: 0 0 14px rgba(62, 166, 255, 0.4), 0 3px 12px rgba(0, 0, 0, 0.4);
    }

    #${CONTROL_ID} .watchly-speed-trigger:hover .watchly-speed-circle {
      background: rgba(255, 255, 255, 0.24);
      border-color: rgba(255, 255, 255, 0.3);
      transform: scale(1.08);
    }

    #${CONTROL_ID} .watchly-speed-trigger:hover .watchly-speed-circle[data-active='true'] {
      background: rgba(62, 166, 255, 0.28);
      border-color: #3ea6ff;
    }

    #${CONTROL_ID} .watchly-speed-trigger:active .watchly-speed-circle {
      transform: scale(0.94);
    }

    #${CONTROL_ID} .watchly-speed-value {
      font-size: 14px;
      font-weight: 800;
      letter-spacing: -0.2px;
      line-height: 1;
    }

    #${CONTROL_ID} .watchly-speed-label {
      color: #f1f1f1;
      font-size: 11.5px;
      font-weight: 500;
      line-height: 1.2;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
    }

    #${CONTROL_ID} .watchly-speed-menu {
      position: absolute;
      top: 50%;
      right: calc(100% + 14px);
      z-index: 2147483647;
      width: 218px;
      padding: 10px;
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 18px;
      background: rgba(18, 18, 22, 0.96);
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(24px) saturate(180%);
      -webkit-backdrop-filter: blur(24px) saturate(180%);
      display: flex;
      flex-direction: column;
      gap: 6px;
      transform: translateY(-50%) scale(0.94);
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transition: transform 160ms cubic-bezier(0.16, 1, 0.3, 1), opacity 160ms cubic-bezier(0.16, 1, 0.3, 1), visibility 160ms;
    }

    #${CONTROL_ID}[data-open='true'] .watchly-speed-menu {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
      transform: translateY(-50%) scale(1);
    }

    #${CONTROL_ID} .watchly-speed-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 2px 4px 6px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      margin-bottom: 2px;
    }

    #${CONTROL_ID} .watchly-speed-header-left {
      display: flex;
      align-items: center;
      gap: 5px;
      color: #a1a1aa;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.6px;
      text-transform: uppercase;
    }

    #${CONTROL_ID} .watchly-speed-reset-btn {
      display: inline-flex;
      align-items: center;
      padding: 2px 7px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.06);
      color: #a1a1aa;
      font-size: 10px;
      font-weight: 600;
      cursor: pointer;
      transition: all 120ms ease;
    }

    #${CONTROL_ID} .watchly-speed-reset-btn:hover {
      background: rgba(255, 255, 255, 0.15);
      color: #fff;
      border-color: rgba(255, 255, 255, 0.25);
    }

    #${CONTROL_ID} .watchly-speed-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 5px;
    }

    #${CONTROL_ID} .watchly-speed-option {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      width: 100%;
      height: 34px;
      padding: 0 8px;
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.05);
      color: #e4e4e7;
      font: 600 13px/1 Roboto, Arial, sans-serif;
      text-align: center;
      cursor: pointer;
      transition: all 120ms ease;
    }

    #${CONTROL_ID} .watchly-speed-option:hover {
      background: rgba(255, 255, 255, 0.16);
      color: #fff;
      border-color: rgba(255, 255, 255, 0.15);
      transform: translateY(-1px);
    }

    #${CONTROL_ID} .watchly-speed-option:active {
      transform: scale(0.96);
    }

    #${CONTROL_ID} .watchly-speed-option[aria-selected='true'] {
      background: #3ea6ff;
      color: #0c0d0e;
      border-color: #3ea6ff;
      font-weight: 800;
      box-shadow: 0 2px 10px rgba(62, 166, 255, 0.45);
    }

    #${CONTROL_ID} .watchly-speed-tag {
      font-size: 9px;
      opacity: 0.75;
      font-weight: 500;
      margin-left: 2px;
    }
  `

  document.head.appendChild(style)
}

function getShortsVideos(): HTMLVideoElement[] {
  return Array.from(document.querySelectorAll<HTMLVideoElement>(VIDEO_SELECTOR))
}

function applySpeed(video: HTMLVideoElement) {
  try {
    if (Math.abs(video.playbackRate - desiredSpeed) > 0.001) {
      video.playbackRate = desiredSpeed
    }

    if (Math.abs(video.defaultPlaybackRate - desiredSpeed) > 0.001) {
      video.defaultPlaybackRate = desiredSpeed
    }
  } catch {
    // The video may be between sources; the next play/metadata event retries.
  }
}

function applyToAllShortsVideos() {
  if (!isShortsPage() || !featureEnabled) return
  getShortsVideos().forEach(applySpeed)
}

function updateControl() {
  if (!control) return

  const value = control.querySelector<HTMLElement>('.watchly-speed-value')
  if (value) value.textContent = formatSpeed(desiredSpeed)

  const circle = control.querySelector<HTMLElement>('.watchly-speed-circle')
  if (circle) {
    if (desiredSpeed !== 1) {
      circle.setAttribute('data-active', 'true')
    } else {
      circle.removeAttribute('data-active')
    }
  }

  const trigger = control.querySelector<HTMLButtonElement>('.watchly-speed-trigger')
  if (trigger) {
    trigger.title = `Playback speed ${formatSpeed(desiredSpeed)}`
    trigger.setAttribute('aria-label', `Playback speed ${formatSpeed(desiredSpeed)}. Click to change.`)
  }

  control.querySelectorAll<HTMLButtonElement>('.watchly-speed-option').forEach(option => {
    option.setAttribute('aria-selected', String(Number(option.dataset.speed) === desiredSpeed))
  })
}

function setMenuOpen(open: boolean) {
  if (!control) return

  menuOpen = open
  control.dataset.open = String(open)
  control.querySelector<HTMLButtonElement>('.watchly-speed-trigger')?.setAttribute('aria-expanded', String(open))
}

function persistSpeed(speed: number) {
  try {
    chrome.storage.local.set({ [STORAGE_KEY]: speed }, () => {
      // Reading lastError keeps the callback from logging when storage is unavailable.
      void chrome.runtime.lastError
    })
  } catch {
    // Storage is unavailable (for example after an extension reload); keep the in-page speed.
  }
}

function setSpeed(speed: number) {
  desiredSpeed = speed
  applyToAllShortsVideos()
  updateControl()
  persistSpeed(speed)
}

function createControl(): HTMLDivElement {
  const container = document.createElement('div')
  container.id = CONTROL_ID
  container.dataset.open = 'false'

  const trigger = document.createElement('button')
  trigger.type = 'button'
  trigger.className = 'watchly-speed-trigger'
  trigger.setAttribute('aria-haspopup', 'listbox')
  trigger.setAttribute('aria-expanded', 'false')
  trigger.innerHTML = `<span class="watchly-speed-circle" ${desiredSpeed !== 1 ? 'data-active="true"' : ''}><span class="watchly-speed-value">${formatSpeed(desiredSpeed)}</span></span><span class="watchly-speed-label">Speed</span>`

  const menu = document.createElement('div')
  menu.className = 'watchly-speed-menu'
  menu.setAttribute('role', 'listbox')
  menu.setAttribute('aria-label', 'Playback speed')

  // Header with title and quick 1x reset button
  const header = document.createElement('div')
  header.className = 'watchly-speed-header'

  const headerLeft = document.createElement('div')
  headerLeft.className = 'watchly-speed-header-left'
  headerLeft.innerHTML = `
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
    <span>Playback Speed</span>
  `

  const resetBtn = document.createElement('button')
  resetBtn.type = 'button'
  resetBtn.className = 'watchly-speed-reset-btn'
  resetBtn.title = 'Reset to 1x normal speed'
  resetBtn.textContent = '1x Normal'
  resetBtn.addEventListener('click', event => {
    event.preventDefault()
    event.stopPropagation()
    setSpeed(1)
    setMenuOpen(false)
    trigger.focus()
  })

  header.append(headerLeft, resetBtn)
  menu.appendChild(header)

  // 2-column speed option grid
  const grid = document.createElement('div')
  grid.className = 'watchly-speed-grid'

  SPEED_OPTIONS.forEach(speed => {
    const option = document.createElement('button')
    option.type = 'button'
    option.className = 'watchly-speed-option'
    option.setAttribute('role', 'option')
    option.dataset.speed = String(speed)

    let innerContent = `<span>${formatSpeed(speed)}</span>`
    if (speed === 1) {
      innerContent += `<span class="watchly-speed-tag">Norm</span>`
    } else if (speed === 2) {
      innerContent += `<span class="watchly-speed-tag">Fast</span>`
    }
    option.innerHTML = innerContent

    option.addEventListener('click', event => {
      event.preventDefault()
      event.stopPropagation()
      setSpeed(speed)
      setMenuOpen(false)
      trigger.focus()
    })
    grid.appendChild(option)
  })

  menu.appendChild(grid)

  trigger.addEventListener('click', event => {
    event.preventDefault()
    event.stopPropagation()
    setMenuOpen(!menuOpen)
  })

  container.append(trigger, menu)

  // Keep clicks and keys inside the control from reaching YouTube's player
  // shortcuts (click to pause, space/arrow keys, etc.).
  ;['pointerdown', 'mousedown', 'click', 'dblclick'].forEach(type => {
    container.addEventListener(type, event => event.stopPropagation())
  })

  container.addEventListener('keydown', event => {
    event.stopPropagation()
    if (event.key === 'Escape') {
      setMenuOpen(false)
      trigger.focus()
    }
  })

  return container
}

function findActiveActionBar(): HTMLElement | null {
  // Try O(1) query using YouTube's active reel marker to avoid forced reflows
  const activeRendererBar = document.querySelector<HTMLElement>('ytd-reel-video-renderer[is-active] reel-action-bar-view-model')
  if (activeRendererBar) return activeRendererBar

  const bars = Array.from(document.querySelectorAll<HTMLElement>(ACTION_BAR_SELECTOR))
  if (bars.length <= 1) return bars[0] ?? null

  const viewportCenter = window.innerHeight / 2
  let best: HTMLElement | null = null
  let bestDistance = Infinity

  for (const bar of bars) {
    const renderer = bar.closest<HTMLElement>('ytd-reel-video-renderer')
    if (!renderer) continue

    const rect = renderer.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) continue
    if (rect.bottom <= 0 || rect.top >= window.innerHeight) continue

    const distance = Math.abs(rect.top + rect.height / 2 - viewportCenter)
    if (distance < bestDistance) {
      bestDistance = distance
      best = bar
    }
  }

  return best ?? bars[0] ?? null
}

function ensureControl() {
  if (!isShortsPage() || !featureEnabled) {
    control?.remove()
    control = null
    menuOpen = false
    return
  }

  ensureStyles()

  const actionBar = findActiveActionBar()
  if (!actionBar) {
    control?.remove()
    control = null
    menuOpen = false
    return
  }

  if (!control) {
    control = createControl()
    menuOpen = false
  }

  if (control.parentElement !== actionBar || actionBar.firstElementChild !== control) {
    setMenuOpen(false)
    actionBar.prepend(control)
  }

  updateControl()
}

function loadSpeed() {
  try {
    chrome.storage.local.get(STORAGE_KEY, result => {
      const stored = result?.[STORAGE_KEY]
      if (typeof stored === 'number' && SPEED_OPTIONS.includes(stored)) {
        desiredSpeed = stored
        updateControl()
        applyToAllShortsVideos()
      }
    })
  } catch {
    // Fall back to the default speed.
  }
}

function watchStorage() {
  try {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== 'local' || !changes[STORAGE_KEY]) return

      const next = changes[STORAGE_KEY].newValue
      if (typeof next === 'number' && SPEED_OPTIONS.includes(next) && next !== desiredSpeed) {
        desiredSpeed = next
        updateControl()
        applyToAllShortsVideos()
      }
    })
  } catch {
    // Storage events are optional; the page control still works.
  }
}

function handleNavigation() {
  if (window.location.href !== lastHref) {
    lastHref = window.location.href
    setMenuOpen(false)
    ensureControl()

    // Cancel any stale timeouts from a previous navigation
    for (const id of navTimeoutIds) clearTimeout(id)
    navTimeoutIds = []

    if (isShortsPage()) {
      // Shorts mounts the player asynchronously after the route changes.
      navTimeoutIds.push(setTimeout(applyToAllShortsVideos, 100), setTimeout(applyToAllShortsVideos, 500), setTimeout(applyToAllShortsVideos, 1500))
    }
    return
  }

  // Only queue control sync on shorts pages — no-op elsewhere
  if (isShortsPage()) queueControlSync()
}

function handleMediaEvent(event: Event) {
  if (!isShortsPage() || !featureEnabled) return

  const target = event.target
  if (!(target instanceof HTMLVideoElement)) return
  if (!target.closest(SHORTS_CONTAINER_SELECTOR)) return

  applySpeed(target)
}

function watchMedia() {
  ;['play', 'playing', 'loadedmetadata', 'canplay', 'durationchange'].forEach(type => {
    document.addEventListener(type, handleMediaEvent, true)
  })

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') applyToAllShortsVideos()
  })
}

let controlSyncQueued = false

function queueControlSync() {
  if (controlSyncQueued || !featureEnabled || !isShortsPage()) return
  controlSyncQueued = true

  const run = () => {
    controlSyncQueued = false
    ensureControl()
  }

  if (typeof window.requestAnimationFrame === 'function') {
    window.requestAnimationFrame(run)
  } else {
    window.setTimeout(run, 50)
  }
}

function watchNavigation() {
  document.addEventListener('yt-navigate-finish', handleNavigation)
  document.addEventListener('yt-page-data-updated', handleNavigation)

  document.addEventListener(
    'pointerdown',
    event => {
      if (!menuOpen) return

      const target = event.target
      if (!(target instanceof Node) || control?.contains(target)) return
      setMenuOpen(false)
    },
    true
  )

  // Safety net for player resets (ads, loops) — gated to shorts pages
  setInterval(() => {
    if (!isShortsPage() || !featureEnabled) return
    handleNavigation()
    applyToAllShortsVideos()
  }, 2000)
}

export function initShortsSpeed() {
  loadSpeed()
  watchStorage()
  watchMedia()
  watchNavigation()
  ensureControl()
  applyToAllShortsVideos()
}

function resetVideoSpeeds() {
  getShortsVideos().forEach(video => {
    try {
      video.playbackRate = 1
      video.defaultPlaybackRate = 1
    } catch {
      // ignore
    }
  })
}

export function disableShortsSpeed() {
  featureEnabled = false
  for (const id of navTimeoutIds) clearTimeout(id)
  navTimeoutIds = []
  control?.remove()
  control = null
  menuOpen = false
  document.getElementById(STYLE_ID)?.remove()
  resetVideoSpeeds()
}

export function enableShortsSpeed() {
  featureEnabled = true
  ensureControl()
  applyToAllShortsVideos()
}

/** Called by the consolidated MutationObserver in content.ts */
export function onShortsDomMutated() {
  if (!featureEnabled || !isShortsPage()) return
  handleNavigation()
}
