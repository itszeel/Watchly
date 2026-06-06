'use client'

import { useState, type ReactNode, type FormEvent } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@watchly/convex'
import dynamic from 'next/dynamic'
import { useAuth } from './components/AuthProvider'
import BottomNav from './components/BottomNav'

const VideoList = dynamic(() => import('./components/VideoList'), { ssr: false })

function EyeIcon() {
  return (
    <svg className='text-blue size-6' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2} strokeLinecap='round' strokeLinejoin='round'>
      <path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' />
      <circle cx='12' cy='12' r='3' />
    </svg>
  )
}

function LoginScreen({ onLogin }: { onLogin: () => void }): ReactNode {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(false)

    if (login(username, password)) {
      onLogin()
    } else {
      setError(true)
    }
  }

  return (
    <div className='bg-surface flex min-h-screen flex-col items-center justify-center px-6'>
      <div className='animate-fade-up mb-8 flex flex-col items-center gap-4'>
        <div className='bg-blue/10 flex size-16 items-center justify-center rounded-2xl'>
          <EyeIcon />
        </div>
        <h1 className='text-text text-2xl font-bold'>Watchly</h1>
        <p className='text-muted text-sm'>Sign in to continue</p>
      </div>

      <form onSubmit={handleSubmit} className='animate-fade-up flex w-full max-w-sm flex-col gap-4' style={{ animationDelay: '0.1s' }}>
        <div className='flex flex-col gap-2'>
          <input
            value={username}
            onChange={e => {
              setUsername(e.target.value)
              setError(false)
            }}
            placeholder='Username'
            autoCapitalize='off'
            autoCorrect='off'
            className='border-glass-border text-text placeholder:text-muted rounded-2xl border bg-white/5 px-5 py-3.5 text-[15px] transition-all outline-none focus:border-white/20'
          />
          <input
            value={password}
            onChange={e => {
              setPassword(e.target.value)
              setError(false)
            }}
            type='password'
            placeholder='Password'
            className='border-glass-border text-text placeholder:text-muted rounded-2xl border bg-white/5 px-5 py-3.5 text-[15px] transition-all outline-none focus:border-white/20'
          />
        </div>

        {error && <p className='animate-scale-in text-center text-[13px] text-red-400'>Invalid username or password</p>}

        <button type='submit' disabled={!username || !password} className='bg-blue hover:bg-blue/90 rounded-2xl py-3.5 text-[15px] font-semibold text-white transition-all active:scale-[0.97] disabled:opacity-40'>
          Sign In
        </button>
      </form>
    </div>
  )
}

export default function Home(): ReactNode {
  const { user, logout } = useAuth()
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

  if (!user) {
    return <LoginScreen onLogin={() => {}} />
  }

  return (
    <div className='bg-surface flex min-h-screen flex-col'>
      <main className='mx flex w-full max-w-3xl flex-1 flex-col self-center px-5 py-6'>
        {tab === 'settings' ? (
          <div className='flex flex-col gap-8 pb-24'>
            <div className='flex flex-col gap-1.5'>
              <h1 className='text-text text-[28px] font-bold'>Settings</h1>
              <p className='text-muted text-xs'>Manage your watchlist and account</p>
            </div>

            <div className='flex flex-col gap-6'>
              <div className='flex flex-col gap-1.5'>
                <p className='text-muted px-1 text-[13px] font-medium tracking-wider uppercase'>Playlist</p>
                <div className='divide-glass-border border-glass-border bg-glass flex flex-col divide-y overflow-hidden rounded-2xl border backdrop-blur-2xl'>
                  <div className='flex flex-col gap-2 px-4 py-3.5'>
                    <label className='text-subtle text-xs font-medium'>YouTube Playlist URL</label>
                    <input value={playlistUrl} onChange={e => setPlaylistUrl(e.target.value)} placeholder='https://www.youtube.com/playlist?list=...' className='border-glass-border text-text placeholder:text-muted rounded-xl border bg-white/5 px-4 py-2.5 text-sm transition-all outline-none focus:border-white/20' />
                  </div>
                  <button onClick={handleImport} disabled={importing || !playlistUrl} className='text-blue flex items-center justify-between px-4 py-3.5 text-sm font-medium transition-all hover:bg-white/[0.02] active:scale-[0.99] disabled:opacity-40'>
                    <span>Import playlist</span>
                    <svg className={`size-4 ${importing ? 'animate-spin' : ''}`} fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2} strokeLinecap='round' strokeLinejoin='round'>
                      <polyline points='23 4 23 10 17 10' />
                      <polyline points='1 20 1 14 7 14' />
                      <path d='M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15' />
                    </svg>
                  </button>
                </div>
              </div>

              <div className='flex flex-col gap-1.5'>
                <p className='text-muted px-1 text-[13px] font-medium tracking-wider uppercase'>Account</p>
                <div className='divide-glass-border border-glass-border bg-glass flex flex-col divide-y overflow-hidden rounded-2xl border backdrop-blur-2xl'>
                  <div className='flex items-center gap-3 px-4 py-3.5'>
                    <div className='bg-blue/10 flex size-10 items-center justify-center rounded-full'>
                      <svg className='text-blue size-5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2} strokeLinecap='round' strokeLinejoin='round'>
                        <path d='M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2' />
                        <circle cx='12' cy='7' r='4' />
                      </svg>
                    </div>
                    <div className='flex flex-1 flex-col'>
                      <span className='text-text text-sm font-medium'>{user}</span>
                      <span className='text-muted text-[11px]'>Signed in</span>
                    </div>
                    <div className='flex size-2 items-center justify-center'>
                      <svg className='text-muted size-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2} strokeLinecap='round' strokeLinejoin='round'>
                        <polyline points='9 18 15 12 9 6' />
                      </svg>
                    </div>
                  </div>
                  <button onClick={logout} className='flex items-center justify-between px-4 py-3.5 text-sm font-medium text-red-400 transition-all hover:bg-white/[0.02] active:scale-[0.99]'>
                    <span>Log Out</span>
                    <svg className='size-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2} strokeLinecap='round' strokeLinejoin='round'>
                      <path d='M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4' />
                      <polyline points='16 17 21 12 16 7' />
                      <line x1='21' y1='12' x2='9' y2='12' />
                    </svg>
                  </button>
                </div>
              </div>
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
