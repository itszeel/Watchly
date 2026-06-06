import { useEffect, useState, useCallback } from 'react'
import type { YouTubeTabInfo } from '../../utils/types'
import './App.css'

function App() {
  const [videos, setVideos] = useState<YouTubeTabInfo[]>([])
  const [loading, setLoading] = useState(true)

  const fetchVideos = useCallback(async () => {
    setLoading(true)
    const res = await chrome.runtime.sendMessage({ type: 'GET_YOUTUBE_TABS' })
    setVideos(res.videos)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchVideos()
  }, [fetchVideos])

  return (
    <div className='flex max-h-[500px] flex-col bg-[#0f0f0f] text-[#f1f1f1]'>
      <header className='sticky top-0 z-10 flex items-center justify-between border-b border-[#272727] bg-[#0f0f0f] px-4 py-3'>
        <h1 className='text-lg font-bold'>Watchly</h1>
        <span className='text-xs text-[#aaa]'>{loading ? '...' : `${videos.length} video${videos.length !== 1 ? 's' : ''}`}</span>
      </header>

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
