import { ConvexHttpClient } from 'convex/browser'

export function createConvexClient(url: string): ConvexHttpClient {
  return new ConvexHttpClient(url)
}

export async function convexSave(
  c: ConvexHttpClient,
  video: {
    videoId: string
    title: string
    url: string
    source: 'browser_tab' | 'watch_later'
  }
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (c.mutation as any)('videos:save', video)
}

export async function convexToggleStatus(c: ConvexHttpClient, videoId: string, status: 'added' | 'watched'): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (c.mutation as any)('videos:toggleStatus', { videoId, status })
}

export async function convexRemove(c: ConvexHttpClient, videoId: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (c.mutation as any)('videos:remove', { videoId })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function convexGetByVideoId(c: ConvexHttpClient, videoId: string): Promise<any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await (c.query as any)('videos:getByVideoId', { videoId })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function convexListAll(c: ConvexHttpClient): Promise<any[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await (c.query as any)('videos:list', {})
}

export async function convexSyncBrowserTabs(
  c: ConvexHttpClient,
  args: {
    tabs: { videoId: string; title: string; url: string }[]
  }
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (c.mutation as any)('videos:syncBrowserTabs', args)
}

export async function convexBatchSave(
  c: ConvexHttpClient,
  args: {
    videos: { videoId: string; title: string; url: string }[]
    source: 'browser_tab' | 'watch_later'
  }
): Promise<{ added: number }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await (c.mutation as any)('videos:batchSave', args)
}

export async function convexListBySource(
  c: ConvexHttpClient,
  source: 'browser_tab' | 'watch_later'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await (c.query as any)('videos:listBySource', { source })
}
