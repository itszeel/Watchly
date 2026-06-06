'use client'

import dynamic from 'next/dynamic'
import type { ReactNode } from 'react'

const VideoList = dynamic(() => import('./components/VideoList'), { ssr: false })

export default function Home(): ReactNode {
  return (
    <div className='min-h-screen bg-[#0f0f0f] text-[#f1f1f1]'>
      <header className='sticky top-0 z-10 border-b border-[#272727] bg-[#0f0f0f]'>
        <div className='mx-auto flex max-w-3xl items-center justify-between px-4 py-4'>
          <h1 className='text-xl font-bold'>Watchly</h1>
        </div>
      </header>

      <main className='mx-auto max-w-3xl px-4 py-6'>
        <VideoList />
      </main>
    </div>
  )
}
