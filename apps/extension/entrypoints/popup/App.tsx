import { useEffect, useState, useCallback } from 'react'
import type { YouTubeTabInfo } from '../../utils/types'
import { FEATURE_KEYS, getFeatureSettings, setFeatureSetting } from '../../utils/feature-storage'
import './App.css'

function ToggleSwitch({ enabled, onToggle }: { enabled: boolean; onToggle: (v: boolean) => void }) {
  return (
    <button type='button' role='switch' aria-checked={enabled} onClick={() => onToggle(!enabled)} className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ${enabled ? 'bg-[#3ea6ff]' : 'bg-[#555]'}`}>
      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200 ${enabled ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
    </button>
  )
}

function App() {
  const [videos, setVideos] = useState<YouTubeTabInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [openButtonEnabled, setOpenButtonEnabled] = useState(true)
  const [shortsSpeedEnabled, setShortsSpeedEnabled] = useState(true)

  const fetchVideos = useCallback(async () => {
    setLoading(true)
    const res = await chrome.runtime.sendMessage({ type: 'GET_YOUTUBE_TABS' })
    setVideos(res.videos)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchVideos()
    getFeatureSettings().then(settings => {
      setOpenButtonEnabled(settings[FEATURE_KEYS.openButton])
      setShortsSpeedEnabled(settings[FEATURE_KEYS.shortsSpeed])
    })
  }, [fetchVideos])

  const handleToggleOpenButton = async (enabled: boolean) => {
    setOpenButtonEnabled(enabled)
    await setFeatureSetting(FEATURE_KEYS.openButton, enabled)
  }

  const handleToggleShortsSpeed = async (enabled: boolean) => {
    setShortsSpeedEnabled(enabled)
    await setFeatureSetting(FEATURE_KEYS.shortsSpeed, enabled)
  }

  return (
    <div className='flex max-h-[500px] flex-col bg-[#0f0f0f] text-[#f1f1f1]'>
      <header className='sticky top-0 z-10 flex items-center justify-between border-b border-[#272727] bg-[#0f0f0f] px-4 py-3'>
        <h1 className='text-lg font-bold'>Watchly</h1>
        <span className='text-xs text-[#aaa]'>{loading ? '...' : `${videos.length} video${videos.length !== 1 ? 's' : ''}`}</span>
      </header>

      {/* Feature Toggles */}
      <div className='border-b border-[#272727] px-4 py-3'>
        <p className='mb-2.5 text-xs font-semibold tracking-wider text-[#888] uppercase'>Features</p>

        <div className='flex items-center justify-between py-1.5'>
          <div className='flex flex-col gap-0.5'>
            <span className='text-sm font-medium'>Open Button</span>
            <span className='text-[11px] text-[#888]'>Show open-in-new-tab button on thumbnails</span>
          </div>
          <ToggleSwitch enabled={openButtonEnabled} onToggle={handleToggleOpenButton} />
        </div>

        <div className='flex items-center justify-between py-1.5'>
          <div className='flex flex-col gap-0.5'>
            <span className='text-sm font-medium'>Shorts Speed</span>
            <span className='text-[11px] text-[#888]'>Speed control for YouTube Shorts</span>
          </div>
          <ToggleSwitch enabled={shortsSpeedEnabled} onToggle={handleToggleShortsSpeed} />
        </div>
      </div>

      {loading && <p className='px-4 py-6 text-center text-[#888]'>Scanning YouTube tabs...</p>}

      {!loading && videos.length === 0 && (
        <div className='px-4 py-6 text-center text-[#888]'>
          <p>No YouTube videos open</p>
        </div>
      )}

      <ul className='max-h-[450px] overflow-y-auto'>
        {videos.map(v => (
          <li key={v.tabId} className='flex gap-2.5 border-b border-[#272727] px-4 py-2.5'>
            <img className='h-[68px] w-[120px] shrink-0 rounded-lg object-cover' src={`https://img.youtube.com/vi/${v.videoId}/mqdefault.jpg`} alt={v.title} />
            <div className='flex min-w-0 flex-col justify-center gap-1'>
              <p className='line-clamp-2 text-sm leading-tight'>{v.title}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App
