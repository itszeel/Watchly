import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

export const save = mutation({
  args: {
    videoId: v.string(),
    title: v.string(),
    url: v.string(),
    source: v.union(v.literal('browser_tab'), v.literal('watch_later')),
    browser: v.union(v.literal('chrome'), v.literal('brave'), v.literal('watch_later')),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('videos')
      .withIndex('by_videoId', q => q.eq('videoId', args.videoId))
      .first()

    if (!existing) {
      await ctx.db.insert('videos', {
        videoId: args.videoId,
        title: args.title,
        url: args.url,
        source: args.source,
        browser: args.browser,
        status: 'added',
        addedAt: Date.now(),
      })
    }
  },
})

export const toggleStatus = mutation({
  args: {
    videoId: v.string(),
    status: v.union(v.literal('added'), v.literal('watched')),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('videos')
      .withIndex('by_videoId', q => q.eq('videoId', args.videoId))
      .first()

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        watchedAt: args.status === 'watched' ? Date.now() : undefined,
      })
    }
  },
})

export const remove = mutation({
  args: { videoId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('videos')
      .withIndex('by_videoId', q => q.eq('videoId', args.videoId))
      .first()

    if (existing) {
      await ctx.db.delete(existing._id)
    }
  },
})

export const syncBrowserTabs = mutation({
  args: {
    browser: v.union(v.literal('chrome'), v.literal('brave')),
    tabs: v.array(
      v.object({
        videoId: v.string(),
        title: v.string(),
        url: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const tabIds = new Set(args.tabs.map(t => t.videoId))

    const existingBrowserTabs = await ctx.db
      .query('videos')
      .filter(q => q.eq(q.field('source'), 'browser_tab'))
      .collect()

    const existingIds = new Set(existingBrowserTabs.map(v => v.videoId))

    for (const tab of args.tabs) {
      if (!existingIds.has(tab.videoId)) {
        await ctx.db.insert('videos', {
          videoId: tab.videoId,
          title: tab.title,
          url: tab.url,
          source: 'browser_tab',
          browser: args.browser,
          status: 'added',
          addedAt: Date.now(),
        })
      }
    }

    for (const video of existingBrowserTabs) {
      if (!tabIds.has(video.videoId)) {
        await ctx.db.delete(video._id)
      }
    }
  },
})

export const list = query({
  handler: async ctx => {
    return await ctx.db.query('videos').order('desc').collect()
  },
})

export const listBySource = query({
  args: { source: v.union(v.literal('browser_tab'), v.literal('watch_later')) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('videos')
      .filter(q => q.eq(q.field('source'), args.source))
      .order('desc')
      .collect()
  },
})

export const getByVideoId = query({
  args: { videoId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('videos')
      .withIndex('by_videoId', q => q.eq('videoId', args.videoId))
      .first()
  },
})
