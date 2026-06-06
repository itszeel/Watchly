export type VideoStatus = 'added' | 'watched'

export interface YouTubeTabInfo {
  tabId: number
  videoId: string
  title: string
  url: string
  status: VideoStatus
}
