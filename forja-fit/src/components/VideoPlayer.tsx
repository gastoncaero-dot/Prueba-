import {
  ClipboardPaste,
  ExternalLink,
  Film,
  Link2,
  Pencil,
  Play,
  Search,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { catalogDemo } from '../data/demos'
import { useStore } from '../lib/store'
import { commonsSearchUrl, demoSearchUrl, isProbablyVideoUrl, parseVideo } from '../lib/video'
import { DemoFrames } from './DemoFrames'
import { Button, Field, Sheet, TextInput } from './ui'

/**
 * Demostración del movimiento.
 *
 * Muestra, en este orden: el video que hayas cargado, la demostración de fotos
 * que trae el catálogo, o el estado vacío con los accesos para sumar un video.
 */
export function VideoPlayer({
  exerciseId,
  exerciseName,
  catalogUrl,
}: {
  exerciseId: string
  exerciseName: string
  catalogUrl?: string
}) {
  const stored = useStore((s) => s.videos[exerciseId])
  const setVideo = useStore((s) => s.setVideo)
  const clearVideo = useStore((s) => s.clearVideo)
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(stored ?? catalogUrl ?? '')
  const [error, setError] = useState('')

  const url = stored ?? catalogUrl
  const video = url ? parseVideo(url) : null
  const hasVideo = Boolean(video && video.kind !== 'otro')
  const demo = catalogDemo(exerciseId)

  function open() {
    setValue(stored ?? catalogUrl ?? '')
    setError('')
    setEditing(true)
  }

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText()
      if (text?.trim()) {
        setValue(text.trim())
        setError('')
      }
    } catch {
      setError('Tu navegador no deja leer el portapapeles: pegá el link a mano.')
    }
  }

  function save() {
    const clean = value.trim()
    if (!clean) {
      clearVideo(exerciseId)
      setEditing(false)
      return
    }
    if (!isProbablyVideoUrl(clean)) {
      setError('No parece un link válido. Probá con una URL de YouTube, Vimeo o un archivo .mp4')
      return
    }
    setVideo(exerciseId, clean)
    setEditing(false)
  }

  return (
    <>
      <div className="card overflow-hidden">
        {hasVideo && video ? (
          <div className="relative aspect-video w-full bg-black">
            {video.kind === 'archivo' ? (
              <video src={video.src} controls playsInline preload="metadata" className="h-full w-full" />
            ) : (
              <iframe
                src={video.src}
                title={`Demostración: ${exerciseName}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                className="h-full w-full border-0"
              />
            )}
          </div>
        ) : demo ? (
          <DemoFrames exerciseId={exerciseId} alt={exerciseName} />
        ) : (
          <div className="relative flex aspect-video w-full flex-col items-center justify-center gap-3 bg-surface-2 px-6 text-center">
            <span className="hatch absolute inset-0" />
            <span className="relative flex h-12 w-12 items-center justify-center rounded-full border border-line bg-surface">
              <Film size={20} className="text-faint" />
            </span>
            <p className="relative text-[13px] text-muted">
              Este movimiento no tiene demostración en el catálogo.
            </p>
            <div className="relative flex flex-wrap items-center justify-center gap-2">
              <Button size="sm" onClick={open}>
                <Link2 size={14} /> Agregar video
              </Button>
              <a href={demoSearchUrl(exerciseName)} target="_blank" rel="noreferrer">
                <Button size="sm" variant="secondary">
                  <Search size={14} /> Buscar
                </Button>
              </a>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------- pie */}
        {hasVideo && video ? (
          <div className="flex items-center justify-between gap-2 border-t border-line px-3 py-2">
            <span className="inline-flex min-w-0 items-center gap-1.5 text-[11px] text-faint">
              <Play size={11} />
              <span className="truncate">
                {video.kind === 'archivo'
                  ? 'Archivo propio'
                  : `Video de ${video.kind === 'youtube' ? 'YouTube' : 'Vimeo'}`}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-1">
              <a
                href={video.original}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg p-1.5 text-faint hover:bg-surface-2 hover:text-ink"
                aria-label="Abrir en una pestaña nueva"
              >
                <ExternalLink size={14} />
              </a>
              <button
                onClick={open}
                className="rounded-lg p-1.5 text-faint hover:bg-surface-2 hover:text-ink"
                aria-label="Cambiar video"
              >
                <Pencil size={14} />
              </button>
              {stored && (
                <button
                  onClick={() => clearVideo(exerciseId)}
                  className="rounded-lg p-1.5 text-faint hover:bg-surface-2 hover:text-danger"
                  aria-label="Quitar video"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </span>
          </div>
        ) : demo ? (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-3 py-2">
            <span className="text-[11px] text-faint">
              Fotos del catálogo · dominio público
            </span>
            <span className="flex shrink-0 items-center gap-1.5">
              <a href={demoSearchUrl(exerciseName)} target="_blank" rel="noreferrer">
                <Button size="sm" variant="ghost">
                  <Search size={13} /> Buscar video
                </Button>
              </a>
              <Button size="sm" variant="secondary" onClick={open}>
                <Link2 size={13} /> Agregar
              </Button>
            </span>
          </div>
        ) : null}
      </div>

      <Sheet open={editing} onClose={() => setEditing(false)} title={`Video: ${exerciseName}`}>
        <div className="space-y-4">
          <Field
            label="Link del video"
            hint="Acepta YouTube, Vimeo o un archivo .mp4 / .webm. Para usar tus propios videos, copialos en la carpeta public/videos y escribí ./videos/nombre.mp4"
          >
            <div className="flex items-center gap-2">
              <TextInput
                value={value}
                onChange={(e) => {
                  setValue(e.target.value)
                  setError('')
                }}
                placeholder="https://www.youtube.com/watch?v=..."
                autoFocus
              />
              <button
                onClick={pasteFromClipboard}
                className="shrink-0 rounded-xl border border-line bg-surface-2 p-2.5 text-muted hover:text-ink"
                aria-label="Pegar el link copiado"
              >
                <ClipboardPaste size={16} />
              </button>
            </div>
          </Field>
          {error && <p className="text-[12px] text-danger">{error}</p>}
          <div className="flex gap-2">
            <Button onClick={save} full>
              Guardar
            </Button>
            <Button variant="secondary" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
          </div>
          <div className="flex flex-col gap-1.5 border-t border-line-soft pt-3 text-center">
            <a
              href={demoSearchUrl(exerciseName)}
              target="_blank"
              rel="noreferrer"
              className="text-[12px] font-semibold text-accent"
            >
              Buscar “{exerciseName}” en YouTube
            </a>
            <a
              href={commonsSearchUrl(exerciseName)}
              target="_blank"
              rel="noreferrer"
              className="text-[12px] font-semibold text-muted hover:text-ink"
            >
              Buscar en Wikimedia Commons (videos de licencia libre)
            </a>
          </div>
        </div>
      </Sheet>
    </>
  )
}
