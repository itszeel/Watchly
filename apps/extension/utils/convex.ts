import { createConvexClient, convexGetByVideoId as cgbi, convexListAll as cla, convexSyncBrowserTabs as csbt } from '@watchly/convex'

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL as string | undefined
const client = CONVEX_URL ? createConvexClient(CONVEX_URL) : null

interface VideoInfo {
  videoId: string
  title: string
  url: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function convexGetByVideoId(videoId: string): Promise<any> {
  if (!client) return null
  return await cgbi(client, videoId)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function convexListAll(): Promise<any[]> {
  if (!client) return []
  return await cla(client)
}

export async function convexSyncBrowserTabs(args: { browser: 'chrome' | 'brave'; tabs: { videoId: string; title: string; url: string }[] }): Promise<void> {
  if (!client) return
  await csbt(client, args)
}
