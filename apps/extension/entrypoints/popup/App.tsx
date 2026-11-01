import { useEffect, useState, useCallback } from 'react'
import type { YouTubeTabInfo } from '../../utils/types'
import { FEATURE_KEYS, getFeatureSettings, setFeatureSetting } from '../../utils/feature-storage'
import './App.css'

function ToggleSwitch({ enabled, onToggle, label }: { enabled: boolean; onToggle: (v: boolean) => void; label: string }) {
  return (
    <button
      type='button'
      role='switch'
      aria-label={label}
      aria-checked={enabled}
      onClick={() => onToggle(!enabled)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-all duration-200 focus:outline-none ${enabled ? 'bg-[#3ea6ff] shadow-[0_0_12px_rgba(62,166,255,0.4)]' : 'border border-[#3f3f46] bg-[#27272a]'}`}
    >
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-md transition-transform duration-200 ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )
}

function App() {
  const [videos, setVideos] = useState<YouTubeTabInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [openButtonEnabled, setOpenButtonEnabled] = useState(true)
  const [shortsSpeedEnabled, setShortsSpeedEnabled] = useState(true)

  const fetchVideos = useCallback(async () => {
    try {
      const res = await chrome.runtime.sendMessage({ type: 'GET_YOUTUBE_TABS' })
      setVideos(res?.videos ?? [])
    } catch {
      setVideos([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchVideos()
    getFeatureSettings().then(settings => {
      setOpenButtonEnabled(settings[FEATURE_KEYS.openButton])
      setShortsSpeedEnabled(settings[FEATURE_KEYS.shortsSpeed])
    })
  }, [fetchVideos])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchVideos()
  }

  const handleToggleOpenButton = async (enabled: boolean) => {
    setOpenButtonEnabled(enabled)
    await setFeatureSetting(FEATURE_KEYS.openButton, enabled)
  }

  const handleToggleShortsSpeed = async (enabled: boolean) => {
    setShortsSpeedEnabled(enabled)
    await setFeatureSetting(FEATURE_KEYS.shortsSpeed, enabled)
  }

  const handleActivateTab = (tabId: number) => {
    if (tabId && chrome.tabs?.update) {
      chrome.tabs.update(tabId, { active: true }).catch(() => {})
    }
  }

  return (
    <div className='flex flex-col bg-[#0c0d0e] text-[#f4f4f5] select-none'>
      {/* ── Header ── */}
      <header className='sticky top-0 z-20 flex items-center justify-between border-b border-[#1e2023] bg-[#0c0d0e]/95 px-4 py-3 backdrop-blur-md'>
        <div className='flex items-center gap-2.5'>
          <div className='flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-red-600 via-rose-600 to-amber-500 shadow-sm'>
            <svg className='h-3.5 w-3.5 text-white' viewBox='0 0 24 24' fill='currentColor'>
              <path d='M8 5v14l11-7z' />
            </svg>
          </div>
          <div>
            <h1 className='text-sm leading-none font-bold tracking-tight text-white'>Watchly</h1>
            <p className='mt-0.5 text-[10px] leading-none font-medium text-[#71717a]'>YouTube Companion</p>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <div className='flex items-center gap-1.5 rounded-full border border-[#27272a] bg-[#18191c] px-2.5 py-1 text-[11px] font-medium text-[#a1a1aa]'>
            <span className={`h-1.5 w-1.5 rounded-full ${videos.length > 0 ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-[#52525b]'}`} />
            <span>{loading ? '...' : `${videos.length} tab${videos.length !== 1 ? 's' : ''}`}</span>
          </div>

          <button type='button' title='Refresh open tabs' onClick={handleRefresh} className={`flex h-7 w-7 items-center justify-center rounded-lg border border-[#27272a] bg-[#18191c] text-[#a1a1aa] transition-colors hover:bg-[#222327] hover:text-white ${refreshing ? 'animate-spin text-[#3ea6ff]' : ''}`}>
            <svg className='h-3.5 w-3.5' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round'>
              <path d='M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8' />
              <path d='M3 3v5h5' />
              <path d='M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16' />
              <path d='M16 21h5v-5' />
            </svg>
          </button>
        </div>
      </header>

      {/* ── Content Container ── */}
      <div className='flex flex-col gap-3.5 p-3.5'>
        {/* ── Feature Toggles Card ── */}
        <section className='rounded-xl border border-[#222327] bg-[#131417] p-3 shadow-sm'>
          <div className='mb-2.5 flex items-center justify-between'>
            <span className='text-[10px] font-bold tracking-wider text-[#71717a] uppercase'>Extension Controls</span>
            <span className='text-[10px] text-[#52525b]'>Live Sync</span>
          </div>

          <div className='flex flex-col gap-2.5'>
            {/* Toggle 1: Thumbnail Button */}
            <div className='flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-[#1a1b1f]'>
              <div className='flex items-center gap-3'>
                <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-sky-500/20 bg-sky-500/10 text-sky-400'>
                  <svg className='h-4 w-4' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                    <path d='M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' />
                    <polyline points='15 3 21 3 21 9' />
                    <line x1='10' y1='14' x2='21' y2='3' />
                  </svg>
                </div>
                <div>
                  <div className='text-xs font-semibold text-[#f4f4f5]'>Open Button</div>
                  <div className='text-[11px] text-[#71717a]'>Quick new-tab button on thumbnails</div>
                </div>
              </div>
              <ToggleSwitch enabled={openButtonEnabled} onToggle={handleToggleOpenButton} label='Toggle thumbnail open button' />
            </div>

            <div className='h-px bg-[#1e2023]' />

            {/* Toggle 2: Shorts Speed */}
            <div className='flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-[#1a1b1f]'>
              <div className='flex items-center gap-3'>
                <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-400'>
                  <svg className='h-4 w-4' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                    <polygon points='13 2 3 14 12 14 11 22 21 10 12 10 13 2' />
                  </svg>
                </div>
                <div>
                  <div className='text-xs font-semibold text-[#f4f4f5]'>Shorts Speed</div>
                  <div className='text-[11px] text-[#71717a]'>Playback speed control for Shorts</div>
                </div>
              </div>
              <ToggleSwitch enabled={shortsSpeedEnabled} onToggle={handleToggleShortsSpeed} label='Toggle shorts speed control' />
            </div>
          </div>
        </section>

        {/* ── Active Tabs Section ── */}
        <section className='flex flex-col gap-2'>
          <div className='flex items-center justify-between px-0.5'>
            <span className='text-[10px] font-bold tracking-wider text-[#71717a] uppercase'>Open YouTube Videos</span>
            {!loading && videos.length > 0 && <span className='text-[10px] text-[#52525b]'>Click to switch tab</span>}
          </div>

          {/* Loading Skeleton */}
          {loading && (
            <div className='flex flex-col gap-2'>
              {[1, 2].map(i => (
                <div key={i} className='flex gap-2.5 rounded-xl border border-[#222327] bg-[#131417] p-2'>
                  <div className='animate-shimmer h-[62px] w-[100px] shrink-0 rounded-lg' />
                  <div className='flex flex-1 flex-col justify-center gap-2 py-1'>
                    <div className='animate-shimmer h-3 w-4/5 rounded' />
                    <div className='animate-shimmer h-2.5 w-1/2 rounded' />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && videos.length === 0 && (
            <div className='flex flex-col items-center justify-center rounded-xl border border-dashed border-[#27272a] bg-[#121316]/50 px-4 py-8 text-center'>
              <div className='mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#1e2023] text-[#71717a]'>
                <svg className='h-5 w-5' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'>
                  <rect x='2' y='2' width='20' height='20' rx='2.18' ry='2.18' />
                  <line x1='7' y1='2' x2='7' y2='22' />
                  <line x1='17' y1='2' x2='17' y2='22' />
                  <line x1='2' y1='12' x2='22' y2='12' />
                  <line x1='2' y1='7' x2='7' y2='7' />
                  <line x1='2' y1='17' x2='7' y2='17' />
                  <line x1='17' y1='17' x2='22' y2='17' />
                  <line x1='17' y1='7' x2='22' y2='7' />
                </svg>
              </div>
              <p className='text-xs font-semibold text-[#d4d4d8]'>No YouTube Tabs Open</p>
              <p className='mt-1 max-w-[240px] text-[11px] leading-tight text-[#71717a]'>Open any video on YouTube to track watch history and tab states automatically.</p>
            </div>
          )}

          {/* Videos List */}
          {!loading && videos.length > 0 && (
            <div className='flex max-h-[300px] flex-col gap-2 overflow-y-auto pr-0.5'>
              {videos.map((v, index) => {
                const isWatched = v.status === 'watched'
                return (
                  <div key={`${v.videoId}-${v.tabId || index}`} onClick={() => handleActivateTab(v.tabId)} className='group flex cursor-pointer items-center gap-2.5 rounded-xl border border-[#222327] bg-[#131417] p-2 transition-all duration-150 hover:border-[#383a42] hover:bg-[#1a1b20] active:scale-[0.99]'>
                    {/* Thumbnail */}
                    <div className='relative h-[62px] w-[100px] shrink-0 overflow-hidden rounded-lg bg-[#1f2024]'>
                      <img loading='lazy' decoding='async' className='h-full w-full object-cover transition-transform duration-200 group-hover:scale-105' src={`https://img.youtube.com/vi/${v.videoId}/mqdefault.jpg`} alt={v.title} />
                      <div className='absolute inset-0 bg-black/10 transition-opacity group-hover:opacity-0' />
                    </div>

                    {/* Meta */}
                    <div className='flex min-w-0 flex-1 flex-col justify-center gap-1.5'>
                      <p className='line-clamp-2 text-xs leading-snug font-medium text-[#f4f4f5] transition-colors group-hover:text-[#3ea6ff]'>{v.title}</p>

                      <div className='flex items-center gap-2'>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ${isWatched ? 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-400' : 'border border-sky-500/30 bg-sky-500/15 text-sky-400'}`}>
                          <span className={`h-1 w-1 rounded-full ${isWatched ? 'bg-emerald-400' : 'bg-sky-400'}`} />
                          {isWatched ? 'Watched' : 'Added'}
                        </span>

                        <span className='text-[10px] text-[#52525b] transition-colors group-hover:text-[#a1a1aa]'>Switch tab →</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>

      {/* ── Footer ── */}
      <footer className='border-t border-[#1e2023] bg-[#0c0d0e] px-4 py-2.5 text-center'>
        <p className='text-[10px] text-[#52525b]'>Watchly • Smart Video Tracking for YouTube</p>
      </footer>
    </div>
  )
}

export default App
