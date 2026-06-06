import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  videos: defineTable({
    videoId: v.string(),
    title: v.string(),
    url: v.string(),
    source: v.optional(v.union(v.literal('browser_tab'), v.literal('watch_later'))),
    status: v.union(v.literal('added'), v.literal('watched')),
    addedAt: v.number(),
    watchedAt: v.optional(v.number()),
  }).index('by_videoId', ['videoId']),
})
