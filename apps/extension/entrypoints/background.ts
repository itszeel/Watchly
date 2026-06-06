import { getStoredVideos, getStoredVideo, saveVideo, updateVideoStatus, type StoredVideo } from '../utils/storage'
import type { YouTubeTabInfo } from '../utils/types'

function extractVideoId(url: string): string | null {
  const match = url.match(/[?&]v=([^&]+)/)
  return match ? match[1] : null
}

export default defineBackground(() => {
  async function pushStorageUpdate() {
    const tabs = await chrome.tabs.query({ url: '*://www.youtube.com/*' })
    for (const tab of tabs) {
      chrome.tabs.sendMessage(tab.id!, { type: 'STORAGE_UPDATED' }).catch(() => {})
    }
  }

  chrome.storage.onChanged.addListener(changes => {
    if (changes['watchly:videos']) pushStorageUpdate()
  })

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_YOUTUBE_TABS') {
      chrome.tabs
        .query({ url: '*://www.youtube.com/watch*' })
        .then(async tabs => {
          const stored = await getStoredVideos()

          const videos: YouTubeTabInfo[] = tabs
            .map(tab => {
              const videoId = extractVideoId(tab.url ?? '')
              if (!videoId) return null

              const existing = stored[videoId]
              if (!existing) {
                saveVideo({
                  videoId,
                  title: tab.title?.replace(' - YouTube', '') ?? 'Untitled',
                  url: tab.url!,
                  status: 'added',
                  addedAt: Date.now(),
                } as StoredVideo)
              }

              return {
                tabId: tab.id!,
                videoId,
                title: tab.title?.replace(' - YouTube', '') ?? 'Untitled',
                url: tab.url!,
                status: existing?.status ?? 'added',
              }
            })
            .filter((v): v is YouTubeTabInfo => v !== null)

          sendResponse({ videos })
        })
        .catch(() => sendResponse({ videos: [] }))

      return true
    }

    if (message.type === 'GET_VIDEO_STATUS') {
      const videoId: string = message.videoId
      getStoredVideo(videoId)
        .then(async existing => {
          if (existing) {
            sendResponse({ status: existing.status, title: existing.title })
            return
          }

          let title = 'Untitled'
          if (sender.tab) {
            title = sender.tab.title?.replace(' - YouTube', '') ?? title
          }

          await saveVideo({
            videoId,
            title,
            url: sender.tab?.url ?? `https://www.youtube.com/watch?v=${videoId}`,
            status: 'added',
            addedAt: Date.now(),
          } as StoredVideo)

          sendResponse({ status: 'added', title })
        })
        .catch(() => sendResponse({ status: null }))

      return true
    }

    if (message.type === 'TOGGLE_STATUS') {
      const videoId: string = message.videoId
      const current: string = message.current
      const next = current === 'added' ? 'watched' : 'added'
      updateVideoStatus(videoId, next as StoredVideo['status']).then(() => {
        sendResponse({ status: next })
      })
      return true
    }

    if (message.type === 'GET_ALL_VIDEOS') {
      getStoredVideos()
        .then(videos => sendResponse({ videos }))
        .catch(() => sendResponse({ videos: {} }))
      return true
    }
  })
})
