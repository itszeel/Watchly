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
  status: 'added' | 'watched'
  addedAt: number
  watchedAt?: number
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2.5} strokeLinecap='round' strokeLinejoin='round'>
      <polyline points='20 6 9 17 4 12' />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg className='size-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2} strokeLinecap='round' strokeLinejoin='round'>
      <path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' />
      <circle cx='12' cy='12' r='3' />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg className='size-3' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2} strokeLinecap='round' strokeLinejoin='round'>
      <circle cx='12' cy='12' r='10' />
      <polyline points='12 6 12 12 16 14' />
    </svg>
  )
}

function formatDate(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function VideoList(): ReactNode {
  const videos = useQuery((api.videos as any).list) as VideoDoc[] | undefined
  const toggleStatus = useMutation((api.videos as any).toggleStatus)

  if (videos === undefined) {
    return (
      <div className='flex items-center justify-center py-24'>
        <div className='border-blue size-6 animate-spin rounded-full border-2 border-t-transparent' />
      </div>
    )
  }

  const total = videos.length
  const watched = videos.filter(v => v.status === 'watched').length

  if (total === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-24'>
        <div className='bg-surface-2 mb-4 flex size-14 items-center justify-center rounded-2xl'>
          <EyeIcon />
        </div>
        <p className='text-subtle text-sm'>No videos tracked yet</p>
        <p className='text-muted mt-1 text-xs'>Open the Chrome extension on a YouTube video</p>
      </div>
    )
  }

  return (
    <div className='space-y-5'>
      <div className='flex items-center gap-3 text-sm'>
        <span className='text-subtle'>
          <strong className='text-text'>{total}</strong> total
        </span>
        <span className='text-subtle'>&middot;</span>
        <span className='text-subtle'>
          <strong className='text-green'>{watched}</strong> watched
        </span>
      </div>

      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'>
        {videos.map(video => {
          const isWatched = video.status === 'watched'

          return (
            <div key={video._id} className='group border-surface-3 bg-surface-2 flex flex-col overflow-hidden rounded-xl border transition-colors hover:border-white/10'>
              <div className='relative aspect-video bg-black'>
                <a href={video.url} target='_blank' rel='noopener noreferrer' className='block h-full'>
                  <img className={`h-full w-full object-cover transition-opacity ${isWatched ? 'opacity-40' : ''}`} src={`https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`} alt={video.title} loading='lazy' />
                </a>

                {isWatched && (
                  <div className='pointer-events-none absolute inset-0 flex items-center justify-center'>
                    <div className='bg-green flex size-10 items-center justify-center rounded-full text-white'>
                      <CheckIcon className='size-6' />
                    </div>
                  </div>
                )}
              </div>

              <div className='flex flex-1 flex-col gap-1 px-3 py-2.5'>
                <a href={video.url} target='_blank' rel='noopener noreferrer' className={`line-clamp-2 text-sm leading-snug font-medium transition-colors ${isWatched ? 'text-subtle' : 'text-text'} hover:text-blue`}>
                  {video.title}
                </a>
                <div className='mt-auto flex items-center justify-between gap-2'>
                  <div className='text-muted flex items-center gap-1 text-[11px]'>
                    <ClockIcon />
                    <span>{formatDate(video.addedAt)}</span>
                  </div>
                  <button
                    onClick={() =>
                      toggleStatus({
                        videoId: video.videoId,
                        status: isWatched ? 'added' : 'watched',
                      })
                    }
                    className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all ${isWatched ? 'border-green bg-green/10 text-green' : 'border-surface-3 text-muted hover:border-green/50 hover:text-green'}`}
                  >
                    <CheckIcon className='size-3' />
                    <span>{isWatched ? 'Watched' : 'Mark watched'}</span>
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
