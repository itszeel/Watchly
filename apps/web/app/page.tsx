'use client'

import { useState, type ReactNode } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@watchly/convex'
import dynamic from 'next/dynamic'
import BottomNav from './components/BottomNav'

const VideoList = dynamic(() => import('./components/VideoList'), { ssr: false })

export default function Home(): ReactNode {
  const [tab, setTab] = useState<'extension' | 'watch_later' | 'settings'>('extension')
  const [playlistUrl, setPlaylistUrl] = useState('https://www.youtube.com/playlist?list=PLIkzaBFikcNplIf-oyrmcl29yTF6hQKQD')
  const [importing, setImporting] = useState(false)
  const batchSave = useMutation((api.videos as any).batchSave)

  async function handleImport() {
    setImporting(true)

    try {
      const res = await fetch(`/api/scrape-playlist?url=${encodeURIComponent(playlistUrl)}`)
      const data = await res.json()
      if (!res.ok || !data.videos) return

      await batchSave({ videos: data.videos, source: 'watch_later' })
    } catch {
      // ignore
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className='bg-surface flex min-h-screen flex-col'>
      <main className='mx flex w-full max-w-3xl flex-1 flex-col self-center px-5 py-6'>
        {tab === 'settings' ? (
          <div className='flex flex-1 flex-col justify-center gap-6 pb-16'>
            <div className='flex flex-col items-center gap-3'>
              <div className='bg-glass flex size-12 items-center justify-center rounded-2xl backdrop-blur-2xl'>
                <svg className='text-muted size-6' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.5} strokeLinecap='round' strokeLinejoin='round'>
                  <circle cx='12' cy='12' r='3' />
                  <path d='M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z' />
                </svg>
              </div>
              <h2 className='text-text text-lg font-bold'>Settings</h2>
            </div>

            <div className='border-glass-border bg-glass flex flex-col gap-4 rounded-2xl border p-5 backdrop-blur-2xl'>
              <div className='flex flex-col gap-2'>
                <label className='text-subtle text-xs font-medium'>Playlist URL</label>
                <input value={playlistUrl} onChange={e => setPlaylistUrl(e.target.value)} placeholder='https://www.youtube.com/playlist?list=...' className='border-glass-border text-text placeholder:text-muted rounded-xl border bg-white/5 px-4 py-2.5 text-sm transition-all outline-none focus:border-white/20' />
              </div>

              <button onClick={handleImport} disabled={importing || !playlistUrl} className='bg-blue hover:bg-blue/90 flex items-center justify-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.97] disabled:opacity-40'>
                <svg className={`size-4 ${importing ? 'animate-spin' : ''}`} fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2} strokeLinecap='round' strokeLinejoin='round'>
                  <polyline points='23 4 23 10 17 10' />
                  <polyline points='1 20 1 14 7 14' />
                  <path d='M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15' />
                </svg>
                <span>{importing ? 'Importing...' : 'Import playlist'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className='flex flex-1 flex-col'>
            <VideoList source={tab === 'extension' ? 'browser_tab' : 'watch_later'} />
          </div>
        )}
      </main>

      <BottomNav active={tab} onTab={setTab} />
    </div>
  )
}
