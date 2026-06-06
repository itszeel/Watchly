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

export default function VideoList(): ReactNode {
  const videos = useQuery((api.videos as any).list) as VideoDoc[] | undefined
  const toggleStatus = useMutation((api.videos as any).toggleStatus)

  if (videos === undefined) {
    return <p className='py-8 text-center text-[#888]'>Loading...</p>
  }

  if (videos.length === 0) {
    return (
      <div className='py-8 text-center'>
        <p className='text-[#888]'>No videos yet</p>
        <p className='mt-1 text-sm text-[#555]'>Open the Chrome extension to start tracking</p>
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-3'>
      {videos.map(video => (
        <div key={video._id} className='flex gap-3 rounded-xl border border-[#272727] bg-[#1a1a1a] p-3'>
          <img className='h-24 w-44 shrink-0 rounded-lg object-cover' src={`https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`} alt={video.title} />
          <div className='flex min-w-0 flex-col justify-between py-0.5'>
            <p className='line-clamp-2 text-sm leading-tight text-[#f1f1f1]'>{video.title}</p>
            <button
              className={`inline-flex w-fit cursor-pointer items-center rounded-full border-none px-3 py-1 text-xs font-semibold ${video.status === 'watched' ? 'bg-[#2ba640] text-white' : 'bg-[#3ea6ff] text-[#0f0f0f]'}`}
              onClick={() =>
                toggleStatus({
                  videoId: video.videoId,
                  status: video.status === 'added' ? 'watched' : 'added',
                })
              }
            >
              {video.status === 'watched' ? 'Watched' : 'Added'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
