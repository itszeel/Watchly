import { convexSyncBrowserTabs, convexGetByVideoId, convexListAll } from '../utils/convex'
import type { YouTubeTabInfo } from '../utils/types'

function extractVideoId(url: string): string | null {
  const match = url.match(/[?&]v=([^&]+)/)
  return match ? match[1] : null
}

const statusCache = new Map<string, { status: string | null; title?: string; timestamp: number }>()
const CACHE_TTL_MS = 15_000

export default defineBackground(() => {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'STORAGE_UPDATED') {
      statusCache.clear()
    }

    if (message.type === 'GET_YOUTUBE_TABS') {
      chrome.tabs
        .query({ url: '*://www.youtube.com/watch*' })
        .then(async tabs => {
          const tabList = tabs
            .map(tab => {
              const videoId = extractVideoId(tab.url ?? '')
              if (!videoId) return null
              return {
                tabId: tab.id ?? 0,
                videoId,
                title: tab.title?.replace(' - YouTube', '') ?? 'Untitled',
                url: tab.url!,
              }
            })
            .filter((t): t is { tabId: number; videoId: string; title: string; url: string } => t !== null)

          if (tabList.length === 0) {
            sendResponse({ videos: [] })
            return
          }

          await convexSyncBrowserTabs({
            tabs: tabList.map(t => ({ videoId: t.videoId, title: t.title, url: t.url })),
          })

          const allVideos = await convexListAll()
          const allVideosMap = new Map((allVideos as { videoId: string; status: string; title?: string }[]).map(v => [v.videoId, v]))

          for (const [vId, v] of allVideosMap) {
            statusCache.set(vId, { status: v.status, title: v.title, timestamp: Date.now() })
          }

          const openTabs: YouTubeTabInfo[] = tabList.map(tab => ({
            tabId: tab.tabId,
            videoId: tab.videoId,
            title: tab.title,
            url: tab.url,
            status: (allVideosMap.get(tab.videoId)?.status as 'added' | 'watched') ?? 'added',
          }))

          sendResponse({ videos: openTabs })
        })
        .catch(() => sendResponse({ videos: [] }))

      return true
    }

    if (message.type === 'GET_VIDEO_STATUS') {
      const videoId: string = message.videoId
      if (!videoId) {
        sendResponse({ status: null })
        return
      }

      const cached = statusCache.get(videoId)
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        sendResponse({ status: cached.status, title: cached.title })
        return
      }

      convexGetByVideoId(videoId)
        .then(existing => {
          if (statusCache.size > 500) statusCache.clear()
          if (existing) {
            statusCache.set(videoId, { status: existing.status, title: existing.title, timestamp: Date.now() })
            sendResponse({ status: existing.status, title: existing.title })
          } else {
            statusCache.set(videoId, { status: null, timestamp: Date.now() })
            sendResponse({ status: null })
          }
        })
        .catch(() => sendResponse({ status: null }))

      return true
    }

    if (message.type === 'OPEN_VIDEO_TAB') {
      const url = typeof message.url === 'string' ? message.url : ''
      if (/^https:\/\/www\.youtube\.com\/(?:watch\?v=|shorts\/)[A-Za-z0-9_-]+$/.test(url)) {
        const createProperties: chrome.tabs.CreateProperties = {
          url,
          active: false,
        }
        if (typeof sender.tab?.windowId === 'number') {
          createProperties.windowId = sender.tab.windowId
        }
        if (typeof sender.tab?.id === 'number') {
          createProperties.openerTabId = sender.tab.id
        }
        if (typeof sender.tab?.index === 'number') {
          createProperties.index = sender.tab.index + 1
        }
        chrome.tabs.create(createProperties).catch(() => {
          chrome.tabs.create({ url, active: false }).catch(() => {})
        })
      }
      return
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
