'use client'

import type { ReactNode } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@watchly/convex'

interface VideoDoc {
  _id: string
  _creationTime: number
  videoId: string
  title: string
  url: string
  source?: 'browser_tab' | 'watch_later'
  status: 'added' | 'watched'
  addedAt: number
  watchedAt?: number
}

interface Props {
  source: 'browser_tab' | 'watch_later'
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={3} strokeLinecap='round' strokeLinejoin='round'>
      <polyline points='20 6 9 17 4 12' />
    </svg>
  )
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'size-3'} fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2} strokeLinecap='round' strokeLinejoin='round'>
      <circle cx='12' cy='12' r='10' />
      <polyline points='12 6 12 12 16 14' />
    </svg>
  )
}

function FormatDate({ ts }: { ts: number }) {
  const d = new Date(ts)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / 86400000)
  let label: string
  if (days === 0) label = 'Today'
  else if (days === 1) label = 'Yesterday'
  else if (days < 7) label = `${days}d ago`
  else label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return <>{label}</>
}

export default function VideoList({ source }: Props): ReactNode {
  const videos = useQuery((api.videos as any).listBySource, { source }) as VideoDoc[] | undefined
  const toggleStatus = useMutation((api.videos as any).toggleStatus)
  const removeVideo = useMutation((api.videos as any).remove)

  if (videos === undefined) {
    return (
      <div className='flex flex-1 items-center justify-center py-12'>
        <div className='flex flex-col items-center gap-4'>
          <div className='border-blue size-7 animate-spin rounded-full border-2 border-t-transparent' />
          <p className='text-muted text-xs'>Loading...</p>
        </div>
      </div>
    )
  }

  const total = videos.length
  const watched = videos.filter(v => v.status === 'watched').length

  if (total === 0) {
    return (
      <div className='flex flex-1 flex-col items-center justify-center py-12'>
        <div className='animate-scale-in bg-glass mb-6 flex size-16 items-center justify-center rounded-2xl backdrop-blur-2xl'>
          {source === 'browser_tab' ? (
            <svg className='text-muted size-7' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.5} strokeLinecap='round' strokeLinejoin='round'>
              <path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' />
              <circle cx='12' cy='12' r='3' />
            </svg>
          ) : (
            <svg className='text-muted size-7' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.5} strokeLinecap='round' strokeLinejoin='round'>
              <circle cx='12' cy='12' r='10' />
              <polyline points='12 6 12 12 16 14' />
            </svg>
          )}
        </div>
        <p className='animate-fade-up text-subtle text-[15px] font-medium' style={{ animationDelay: '0.1s' }}>
          {source === 'browser_tab' ? 'No extension tabs yet' : 'Nothing saved yet'}
        </p>
        <p className='animate-fade-up text-muted mt-2 text-xs' style={{ animationDelay: '0.15s' }}>
          {source === 'browser_tab' ? 'Open the extension on a YouTube tab' : 'Import a playlist to get started'}
        </p>
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-5'>
      <div className='animate-fade-in text-subtle flex items-center gap-3 text-xs'>
        <span>
          <strong className='text-text'>{total}</strong> total
        </span>
        <span>&middot;</span>
        <span>
          <strong className='text-green'>{watched}</strong> watched
        </span>
      </div>

      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'>
        {videos.map((video, i) => {
          const isWatched = video.status === 'watched'

          return (
            <div
              key={video._id}
              className='group relative flex flex-col overflow-hidden rounded-2xl border backdrop-blur-2xl transition-all duration-300 hover:scale-[1.02]'
              style={{
                animation: `fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.06}s both`,
                borderColor: isWatched ? 'rgba(43,166,64,0.12)' : 'var(--color-glass-border)',
                backgroundColor: isWatched ? 'rgba(43,166,64,0.02)' : 'var(--color-glass)',
              }}
            >
              <div className='relative aspect-video overflow-hidden bg-black'>
                <a href={video.url} target='_blank' rel='noopener noreferrer' className='block h-full'>
                  <img className={`h-full w-full object-cover transition-all duration-500 ${isWatched ? 'scale-105 opacity-25 saturate-0' : 'group-hover:scale-105'}`} src={`https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`} alt={video.title} loading='lazy' />
                </a>

                {isWatched && (
                  <div className='animate-scale-in pointer-events-none absolute inset-0 flex items-center justify-center'>
                    <div className='bg-green/80 shadow-green/30 flex size-10 items-center justify-center rounded-full text-white shadow-lg backdrop-blur-sm'>
                      <CheckIcon className='size-5' />
                    </div>
                  </div>
                )}
              </div>

              <div className='flex flex-1 flex-col gap-1.5 px-3.5 py-3'>
                <a href={video.url} target='_blank' rel='noopener noreferrer' className={`line-clamp-2 text-sm leading-snug font-medium transition-colors ${isWatched ? 'text-subtle' : 'text-text'}`}>
                  {video.title}
                </a>
                <div className='mt-auto flex items-center justify-between gap-2 pt-1'>
                  <div className='text-muted flex items-center gap-1.5 text-[11px]'>
                    <ClockIcon />
                    <span>
                      <FormatDate ts={video.addedAt} />
                    </span>
                  </div>
                  <div className='flex items-center gap-1.5'>
                    <button onClick={() => removeVideo({ videoId: video.videoId })} className='text-muted hover:bg-red/15 hover:text-red flex size-7 items-center justify-center rounded-full bg-white/5 transition-all active:scale-90' title='Delete'>
                      <svg className='size-3.5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2} strokeLinecap='round' strokeLinejoin='round'>
                        <polyline points='3 6 5 6 21 6' />
                        <path d='M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2' />
                      </svg>
                    </button>
                    <button
                      onClick={() =>
                        toggleStatus({
                          videoId: video.videoId,
                          status: isWatched ? 'added' : 'watched',
                        })
                      }
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold transition-all active:scale-90 ${isWatched ? 'bg-green/10 text-green' : 'text-muted hover:text-text bg-white/5 hover:bg-white/10'}`}
                    >
                      <CheckIcon className='size-3' />
                      <span>{isWatched ? 'Watched' : 'Watch'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
