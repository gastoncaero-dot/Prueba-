import { ArrowLeft, Check, Search, Trash2, Upload } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Chip, Progress, SectionHeader, TextInput } from '../components/ui'
import { EXERCISES } from '../data/exercises'
import { WORKOUTS } from '../data/workouts'
import { useStore } from '../lib/store'
import { demoSearchUrl, isProbablyVideoUrl } from '../lib/video'

/** Cuántas veces aparece cada movimiento en el catálogo de rutinas. */
const USAGE = new Map<string, number>()
for (const workout of WORKOUTS) {
  for (const block of workout.blocks) {
    for (const item of block.items) {
      USAGE.set(item.exerciseId, (USAGE.get(item.exerciseId) ?? 0) + 1)
    }
  }
}

function VideoRow({ id, name }: { id: string; name: string }) {
  const stored = useStore((s) => s.videos[id])
  const setVideo = useStore((s) => s.setVideo)
  const clearVideo = useStore((s) => s.clearVideo)
  const [value, setValue] = useState(stored ?? '')
  const [error, setError] = useState(false)
  const [saved, setSaved] = useState(false)

  function commit() {
    const clean = value.trim()
    if (!clean) {
      if (stored) clearVideo(id)
      setError(false)
      return
    }
    if (!isProbablyVideoUrl(clean)) {
      setError(true)
      return
    }
    setError(false)
    setVideo(id, clean)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <li className="px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">{name}</span>
        <span className="flex shrink-0 items-center gap-1">
          {stored && (
            <button
              onClick={() => {
                clearVideo(id)
                setValue('')
              }}
              className="rounded-lg p-1.5 text-faint hover:text-danger"
              aria-label={`Quitar el video de ${name}`}
            >
              <Trash2 size={14} />
            </button>
          )}
          <a
            href={demoSearchUrl(name)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface-2 px-2 py-1.5 text-[11px] font-bold text-muted hover:text-ink"
          >
            <Search size={12} /> Buscar
          </a>
        </span>
      </div>

      <div className="mt-1.5 flex items-center gap-2">
        <TextInput
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setError(false)
          }}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur()
          }}
          placeholder="Pegá acá el link del video"
          className={`text-[12px] ${error ? 'border-danger' : ''}`}
        />
        {(saved || (stored && value === stored)) && (
          <Check size={16} className="shrink-0 text-accent" />
        )}
      </div>
      {error && (
        <p className="mt-1 text-[11px] text-danger">
          No parece un link válido: usá YouTube, Vimeo o un archivo .mp4
        </p>
      )}
    </li>
  )
}

export function Videos() {
  const navigate = useNavigate()
  const videos = useStore((s) => s.videos)
  const importVideos = useStore((s) => s.importVideos)
  const [filter, setFilter] = useState<'faltantes' | 'cargados' | 'todos'>('faltantes')
  const [query, setQuery] = useState('')
  const [message, setMessage] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)

  const withVideo = EXERCISES.filter((e) => videos[e.id] ?? e.videoUrl).length

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return EXERCISES.filter((e) => {
      const has = Boolean(videos[e.id] ?? e.videoUrl)
      if (filter === 'faltantes' && has) return false
      if (filter === 'cargados' && !has) return false
      if (!q) return true
      return [e.name, ...(e.aka ?? [])].join(' ').toLowerCase().includes(q)
    }).sort((a, b) => (USAGE.get(b.id) ?? 0) - (USAGE.get(a.id) ?? 0))
  }, [videos, filter, query])

  async function importFile(file: File) {
    try {
      const parsed = JSON.parse(await file.text())
      const count = importVideos(parsed.videos ?? parsed)
      setMessage(`${count} videos importados.`)
    } catch {
      setMessage('El archivo tiene que ser un JSON con pares "id-del-ejercicio": "url".')
    }
  }

  return (
    <div className="space-y-5">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted hover:text-ink"
      >
        <ArrowLeft size={16} /> Volver
      </button>

      <div>
        <h1 className="display text-2xl">Cargar videos</h1>
        <p className="text-[13px] text-muted">
          Los videos que sumes acá aparecen dentro de la rutina y de la sesión, para que puedas
          corregirte mientras entrenás.
        </p>
      </div>

      <div className="card px-4 py-4">
        <div className="mb-2 flex items-baseline justify-between">
          <p className="text-[13px] font-semibold">
            {withVideo} de {EXERCISES.length} movimientos
          </p>
          <p className="tnum text-[12px] text-muted">
            {Math.round((withVideo / EXERCISES.length) * 100)}%
          </p>
        </div>
        <Progress value={withVideo} max={EXERCISES.length} />
        <p className="mt-3 text-[12px] leading-relaxed text-muted">
          La lista arranca por los movimientos que más aparecen en las rutinas, así con los
          primeros veinte ya cubrís casi todas. Tocá <strong>Buscar</strong>, copiá la dirección del
          video que te guste y pegala en el campo.
        </p>
      </div>

      {message && (
        <p className="rounded-xl border border-accent/40 bg-accent/10 px-3 py-2 text-[13px] text-accent">
          {message}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Chip active={filter === 'faltantes'} onClick={() => setFilter('faltantes')}>
          Faltantes ({EXERCISES.length - withVideo})
        </Chip>
        <Chip active={filter === 'cargados'} onClick={() => setFilter('cargados')}>
          Cargados ({withVideo})
        </Chip>
        <Chip active={filter === 'todos'} onClick={() => setFilter('todos')}>
          Todos
        </Chip>
      </div>

      <TextInput
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar un movimiento"
      />

      <Button variant="secondary" full onClick={() => fileInput.current?.click()}>
        <Upload size={15} /> Importar una lista en JSON
      </Button>
      <input
        ref={fileInput}
        type="file"
        accept="application/json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void importFile(file)
          e.target.value = ''
        }}
      />

      {list.length === 0 ? (
        <div className="card px-4 py-8 text-center">
          <p className="display text-base">
            {filter === 'faltantes' ? '¡Están todos cargados!' : 'Nada por acá'}
          </p>
          <p className="mt-1 text-[13px] text-muted">
            {filter === 'faltantes'
              ? 'Todos los movimientos del catálogo tienen su video.'
              : 'Probá con otro filtro o buscando otro nombre.'}
          </p>
        </div>
      ) : (
        <>
          <SectionHeader title="Movimientos" hint="Ordenados por cuánto se usan en las rutinas" />
          <ul className="card divide-y divide-line-soft overflow-hidden">
            {list.map((e) => (
              <VideoRow key={e.id} id={e.id} name={e.name} />
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
