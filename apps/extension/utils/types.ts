import type { StoredVideo } from './storage'

export interface YouTubeTabInfo {
  tabId: number
  videoId: string
  title: string
  url: string
  channel?: string
  status: StoredVideo['status']
}
