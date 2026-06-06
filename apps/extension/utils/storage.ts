export type VideoStatus = 'added' | 'watched'

export interface StoredVideo {
  videoId: string
  title: string
  url: string
  channel?: string
  status: VideoStatus
  addedAt: number
  watchedAt?: number
}

const STORAGE_KEY = 'watchly:videos'

export async function getStoredVideos(): Promise<Record<string, StoredVideo>> {
  const result = await chrome.storage.local.get(STORAGE_KEY)
  return (result[STORAGE_KEY] ?? {}) as Record<string, StoredVideo>
}

export async function getStoredVideo(videoId: string): Promise<StoredVideo | null> {
  const videos = await getStoredVideos()
  return videos[videoId] ?? null
}

export async function saveVideo(video: StoredVideo): Promise<void> {
  const videos = await getStoredVideos()
  videos[video.videoId] = video
  await chrome.storage.local.set({ [STORAGE_KEY]: videos })
}

export async function updateVideoStatus(videoId: string, status: VideoStatus): Promise<void> {
  const videos = await getStoredVideos()
  if (videos[videoId]) {
    videos[videoId].status = status
    if (status === 'watched') {
      videos[videoId].watchedAt = Date.now()
    }
    await chrome.storage.local.set({ [STORAGE_KEY]: videos })
  }
}
