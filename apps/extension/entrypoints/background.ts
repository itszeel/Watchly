import { convexSyncBrowserTabs, convexGetByVideoId, convexListAll } from '../utils/convex'
import type { YouTubeTabInfo } from '../utils/types'

function extractVideoId(url: string): string | null {
  const match = url.match(/[?&]v=([^&]+)/)
  return match ? match[1] : null
}

function detectBrowser(): 'chrome' | 'brave' {
  if (navigator.userAgent.includes('Brave')) return 'brave'
  return 'chrome'
}

export default defineBackground(() => {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_YOUTUBE_TABS') {
      chrome.tabs
        .query({ url: '*://www.youtube.com/watch*' })
        .then(async tabs => {
          const browser = detectBrowser()

          const convexTabs = tabs
            .map(tab => {
              const videoId = extractVideoId(tab.url ?? '')
              if (!videoId) return null
              return {
                videoId,
                title: tab.title?.replace(' - YouTube', '') ?? 'Untitled',
                url: tab.url!,
              }
            })
            .filter((t): t is { videoId: string; title: string; url: string } => t !== null)

          await convexSyncBrowserTabs({ browser, tabs: convexTabs })

          const allVideos = await convexListAll()
          const allVideosMap = new Map((allVideos as { videoId: string; status: string }[]).map(v => [v.videoId, v]))

          const openTabs = convexTabs
            .map(tab => {
              const videoId = extractVideoId(tab.url)
              if (!videoId) return null
              return {
                tabId: 0,
                videoId,
                title: tab.title,
                url: tab.url,
                status: (allVideosMap.get(videoId)?.status as 'added' | 'watched') ?? 'added',
              }
            })
            .filter((v): v is YouTubeTabInfo => v !== null)

          sendResponse({ videos: openTabs })
        })
        .catch(() => sendResponse({ videos: [] }))

      return true
    }

    if (message.type === 'GET_VIDEO_STATUS') {
      const videoId: string = message.videoId
      convexGetByVideoId(videoId)
        .then(existing => {
          if (existing) {
            sendResponse({ status: existing.status, title: existing.title })
          } else {
            sendResponse({ status: null })
          }
        })
        .catch(() => sendResponse({ status: null }))

      return true
    }

    if (message.type === 'GET_ALL_VIDEOS') {
      convexListAll()
        .then(videos => {
          const map: Record<string, { status: string; title: string }> = {}
          for (const v of videos as { videoId: string; status: string; title: string }[]) {
            map[v.videoId] = { status: v.status, title: v.title }
          }
          sendResponse({ videos: map })
        })
        .catch(() => sendResponse({ videos: {} }))
      return true
    }
  })
})
