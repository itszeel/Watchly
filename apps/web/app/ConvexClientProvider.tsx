'use client'

import { ConvexProvider, ConvexReactClient } from 'convex/react'
import type { ReactNode } from 'react'
import { useMemo } from 'react'

export default function ConvexClientProvider({ children }: { children: ReactNode }): ReactNode {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL

  const convex = useMemo(() => {
    if (!convexUrl) return null
    return new ConvexReactClient(convexUrl)
  }, [convexUrl])

  if (!convex) {
    return <>{children}</>
  }

  return <ConvexProvider client={convex}>{children}</ConvexProvider>
}
