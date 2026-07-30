export type VideoKind = 'youtube' | 'vimeo' | 'archivo' | 'otro'

export interface ParsedVideo {
  kind: VideoKind
  /** URL lista para <iframe> (youtube/vimeo) o para <video> (archivo). */
  src: string
  /** Miniatura, cuando la plataforma la expone sin API. */
  thumb?: string
  original: string
}

const YT_PATTERNS = [
  /(?:youtube\.com\/watch\?[^#]*\bv=)([\w-]{11})/i,
  /(?:youtu\.be\/)([\w-]{11})/i,
  /(?:youtube\.com\/shorts\/)([\w-]{11})/i,
  /(?:youtube\.com\/embed\/)([\w-]{11})/i,
  /(?:youtube\.com\/live\/)([\w-]{11})/i,
]

const FILE_EXT = /\.(mp4|webm|ogg|ogv|mov|m4v)(\?.*)?$/i

/**
 * Reconoce el tipo de video a partir de la URL. Sirve tanto para links de
 * YouTube o Vimeo como para archivos propios (por ejemplo public/videos/x.mp4).
 */
export function parseVideo(url: string): ParsedVideo | null {
  const clean = url.trim()
  if (!clean) return null

  for (const pattern of YT_PATTERNS) {
    const match = clean.match(pattern)
    if (match) {
      const id = match[1]
      return {
        kind: 'youtube',
        src: `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`,
        thumb: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        original: clean,
      }
    }
  }

  const vimeo = clean.match(/vimeo\.com\/(?:video\/)?(\d+)/i)
  if (vimeo) {
    return {
      kind: 'vimeo',
      src: `https://player.vimeo.com/video/${vimeo[1]}`,
      original: clean,
    }
  }

  if (FILE_EXT.test(clean) || clean.startsWith('blob:') || clean.startsWith('data:video')) {
    return { kind: 'archivo', src: clean, original: clean }
  }

  return { kind: 'otro', src: clean, original: clean }
}

/** Búsqueda de demostraciones cuando todavía no cargaste un video propio. */
export function demoSearchUrl(exerciseName: string): string {
  const query = encodeURIComponent(`${exerciseName} técnica ejercicio demostración`)
  return `https://www.youtube.com/results?search_query=${query}`
}

export function isProbablyVideoUrl(url: string): boolean {
  const parsed = parseVideo(url)
  if (!parsed) return false
  return parsed.kind !== 'otro' || /^https?:\/\//i.test(parsed.original)
}
