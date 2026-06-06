'use client'

import type { ReactNode } from 'react'

interface Props {
  active: 'extension' | 'watch_later' | 'settings'
  onTab: (tab: 'extension' | 'watch_later' | 'settings') => void
}

function EyeIcon({ active }: { active: boolean }) {
  return (
    <svg className='size-[18px]' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={active ? 2.5 : 2} strokeLinecap='round' strokeLinejoin='round'>
      <path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' />
      <circle cx='12' cy='12' r='3' />
    </svg>
  )
}

function ClockIcon({ active }: { active: boolean }) {
  return (
    <svg className='size-[18px]' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={active ? 2.5 : 2} strokeLinecap='round' strokeLinejoin='round'>
      <circle cx='12' cy='12' r='10' />
      <polyline points='12 6 12 12 16 14' />
    </svg>
  )
}

function GearIcon({ active }: { active: boolean }) {
  return (
    <svg className='size-[18px]' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={active ? 2.5 : 2} strokeLinecap='round' strokeLinejoin='round'>
      <circle cx='12' cy='12' r='3' />
      <path d='M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z' />
    </svg>
  )
}

export default function BottomNav({ active, onTab }: Props): ReactNode {
  const tabs = [
    { key: 'extension' as const, label: 'Extension', icon: <EyeIcon active={active === 'extension'} /> },
    { key: 'watch_later' as const, label: 'Playlist', icon: <ClockIcon active={active === 'watch_later'} /> },
    { key: 'settings' as const, label: 'Settings', icon: <GearIcon active={active === 'settings'} /> },
  ]

  return (
    <nav className='animate-fade-in fixed right-0 bottom-0 left-0 z-20 flex justify-center pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))]'>
      <div className='border-glass-border flex items-center gap-0.5 rounded-3xl border bg-black/70 px-1.5 py-1 shadow-2xl shadow-black/50 backdrop-blur-[96px]'>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => onTab(tab.key)} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 ${active === tab.key ? 'bg-white/10 text-white' : 'text-muted hover:text-text'}`}>
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
