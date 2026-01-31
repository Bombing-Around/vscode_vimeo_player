/**
 * Vimeo video URL parsing
 */

export type VideoPlatform = 'vimeo';

export interface ParsedVideo {
  platform: VideoPlatform;
  videoId: string;
  embedUrl: string;
  watchUrl: string;
}

/**
 * Parse a Vimeo URL and extract video ID
 */
export function parseVideoUrl(url: string): ParsedVideo | null {
  let normalizedUrl = url.trim();
  if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
    normalizedUrl = 'https://' + normalizedUrl;
  }

  try {
    const urlObj = new URL(normalizedUrl);
    const hostname = urlObj.hostname.toLowerCase();

    if (hostname.includes('vimeo.com')) {
      const videoId = extractVimeoId(urlObj);
      if (videoId) {
        return {
          platform: 'vimeo',
          videoId,
          embedUrl: `https://player.vimeo.com/video/${videoId}?autoplay=1`,
          watchUrl: `https://vimeo.com/${videoId}`
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}

function extractVimeoId(url: URL): string | null {
  const match = url.pathname.match(/^\/(\d+)/);
  if (match) {
    return match[1];
  }

  if (url.pathname.startsWith('/video/')) {
    const videoId = url.pathname.split('/')[2];
    if (videoId && /^\d+$/.test(videoId)) {
      return videoId;
    }
  }

  return null;
}
