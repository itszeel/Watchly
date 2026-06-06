import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const playlistUrl = searchParams.get('url')

  if (!playlistUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  try {
    const html = await fetch(playlistUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    }).then(r => r.text())

    const match = html.match(/ytInitialData\s*=\s*({.+?});\s*<\/script>/s)
    if (!match) {
      return NextResponse.json({ error: 'Could not parse playlist data' }, { status: 400 })
    }
    const data = JSON.parse(match[1]!)

    const contents = data?.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents?.[0]?.playlistVideoListRenderer?.contents ?? []

    const videos: { videoId: string; title: string; url: string }[] = []

    for (const item of contents) {
      const renderer = item?.playlistVideoRenderer
      if (!renderer?.videoId) continue

      videos.push({
        videoId: renderer.videoId,
        title: renderer.title?.runs?.[0]?.text ?? 'Untitled',
        url: `https://www.youtube.com/watch?v=${renderer.videoId}`,
      })
    }

    return NextResponse.json({ videos, count: videos.length })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch playlist' }, { status: 500 })
  }
}
