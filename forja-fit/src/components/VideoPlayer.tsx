import { ExternalLink, Film, Link2, Pencil, Play, Search, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../lib/store'
import { demoSearchUrl, isProbablyVideoUrl, parseVideo } from '../lib/video'
import { Button, Field, Sheet, TextInput } from './ui'

/**
 * Reproductor de la demostración del movimiento.
 *
 * El catálogo viene sin videos cargados: podés pegar el link de un video de
 * YouTube o Vimeo, o apuntar a un archivo propio (por ejemplo
 * ./videos/sentadilla.mp4 dentro de la carpeta public).
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

  function open() {
    setValue(stored ?? catalogUrl ?? '')
    setError('')
    setEditing(true)
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
        {video && video.kind !== 'otro' ? (
          <div className="relative aspect-video w-full bg-black">
            {video.kind === 'archivo' ? (
              <video
                src={video.src}
                controls
                playsInline
                preload="metadata"
                className="h-full w-full"
              />
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
        ) : (
          <div className="relative flex aspect-video w-full flex-col items-center justify-center gap-3 bg-surface-2 px-6 text-center">
            <span className="hatch absolute inset-0" />
            <span className="relative flex h-12 w-12 items-center justify-center rounded-full border border-line bg-surface">
              <Film size={20} className="text-faint" />
            </span>
            <p className="relative text-[13px] text-muted">
              Todavía no cargaste el video de este movimiento.
            </p>
            <div className="relative flex flex-wrap items-center justify-center gap-2">
              <Button size="sm" onClick={open}>
                <Link2 size={14} /> Agregar video
              </Button>
              <a href={demoSearchUrl(exerciseName)} target="_blank" rel="noreferrer">
                <Button size="sm" variant="secondary">
                  <Search size={14} /> Buscar demostración
                </Button>
              </a>
            </div>
          </div>
        )}

        {video && video.kind !== 'otro' && (
          <div className="flex items-center justify-between gap-2 border-t border-line px-3 py-2">
            <span className="inline-flex min-w-0 items-center gap-1.5 text-[11px] text-faint">
              <Play size={11} />
              <span className="truncate">
                {video.kind === 'archivo'
                  ? 'Archivo propio'
                  : `Video de ${video.kind === 'youtube' ? 'YouTube' : 'Vimeo'}`}
                {stored ? '' : ' (del catálogo)'}
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
        )}
      </div>

      <Sheet open={editing} onClose={() => setEditing(false)} title={`Video: ${exerciseName}`}>
        <div className="space-y-4">
          <Field
            label="Link del video"
            hint="Acepta YouTube, Vimeo o un archivo .mp4 / .webm. Para usar tus propios videos, copialos en la carpeta public/videos y escribí ./videos/nombre.mp4"
          >
            <TextInput
              value={value}
              onChange={(e) => {
                setValue(e.target.value)
                setError('')
              }}
              placeholder="https://www.youtube.com/watch?v=..."
              autoFocus
            />
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
          <a
            href={demoSearchUrl(exerciseName)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-1.5 text-[12px] font-semibold text-accent"
          >
            <Search size={13} /> Buscar una demostración de {exerciseName}
          </a>
        </div>
      </Sheet>
    </>
  )
}
