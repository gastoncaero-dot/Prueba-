import { ArrowLeft, Clock, Dumbbell, Heart, MapPin, Play, Target } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BlockList } from '../components/BlockList'
import { Button, EmptyState, SectionHeader, Tag } from '../components/ui'
import {
  EQUIPMENT_LABEL,
  LEVEL_LABEL,
  modality as modalityMeta,
  PLACE_LABEL,
} from '../data/taxonomy'
import { getWorkout } from '../data/workouts'
import { blockDurationSec } from '../lib/blocks'
import { formatDuration, timeAgo } from '../lib/dates'
import { emptyDraft, useStore } from '../lib/store'

export function RutinaDetalle() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const workout = id ? getWorkout(id) : undefined

  const history = useStore((s) => s.history)
  const favorites = useStore((s) => s.favoriteWorkouts)
  const toggleFavorite = useStore((s) => s.toggleFavoriteWorkout)
  const startSession = useStore((s) => s.startSession)
  const draft = useStore((s) => s.draft)
  const profile = useStore((s) => s.profile)

  if (!workout) {
    return (
      <EmptyState
        title="No encontramos ese entrenamiento"
        text="Puede que haya cambiado el catálogo."
        action={
          <Link to="/rutinas">
            <Button size="sm">Volver a rutinas</Button>
          </Link>
        }
      />
    )
  }

  const color = modalityMeta(workout.modality).color
  const isFav = favorites.includes(workout.id)
  const past = history.filter((h) => h.workoutId === workout.id).slice(0, 3)
  const estimated = workout.blocks.reduce((acc, b) => acc + blockDurationSec(b), 0)

  function start() {
    if (draft && draft.workoutId !== workout!.id) {
      const ok = confirm('Tenés una sesión sin terminar. ¿Descartarla y empezar esta?')
      if (!ok) return
    }
    if (!draft || draft.workoutId !== workout!.id) {
      startSession(emptyDraft(workout!.id, profile.homeOnly ? 'casa' : workout!.places[0]))
    }
    navigate(`/sesion/${workout!.id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted hover:text-ink"
        >
          <ArrowLeft size={16} /> Volver
        </button>
        <button
          onClick={() => toggleFavorite(workout.id)}
          className="rounded-lg p-2 text-faint hover:bg-surface-2 hover:text-ink"
          aria-label={isFav ? 'Quitar de favoritas' : 'Guardar en favoritas'}
        >
          <Heart
            size={18}
            fill={isFav ? 'var(--c-accent)' : 'none'}
            color={isFav ? 'var(--c-accent)' : 'currentColor'}
          />
        </button>
      </div>

      <header
        className="card hatch relative overflow-hidden px-4 py-5"
        style={{ borderColor: `${color}44` }}
      >
        <span className="absolute inset-x-0 top-0 h-1" style={{ background: color }} />
        <p className="overline" style={{ color }}>
          {modalityMeta(workout.modality).label}
        </p>
        <h1 className="display mt-1 text-2xl leading-tight">{workout.name}</h1>
        <p className="mt-1.5 text-[13px] text-muted">{workout.description}</p>

        {workout.stimulus && (
          <p className="mt-3 flex items-start gap-1.5 text-[13px]">
            <Target size={14} className="mt-0.5 shrink-0" style={{ color }} />
            <span>
              <span className="font-semibold">Estímulo:</span> {workout.stimulus}
            </span>
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-1.5">
          <Tag>
            <Clock size={11} /> {workout.durationMin} min
          </Tag>
          <Tag>{LEVEL_LABEL[workout.level]}</Tag>
          <Tag>
            <MapPin size={11} /> {workout.places.map((p) => PLACE_LABEL[p]).join(' · ')}
          </Tag>
          <Tag>
            <Dumbbell size={11} /> {workout.equipment.map((e) => EQUIPMENT_LABEL[e]).join(', ')}
          </Tag>
        </div>

        <Button size="lg" full className="mt-5" onClick={start}>
          <Play size={16} fill="currentColor" />
          {draft?.workoutId === workout.id ? 'Continuar sesión' : 'Empezar entrenamiento'}
        </Button>
        <p className="mt-2 text-center text-[11px] text-faint">
          {workout.blocks.length} bloques · tiempo estimado de trabajo{' '}
          {formatDuration(estimated)}
        </p>
      </header>

      <section>
        <SectionHeader
          title="La sesión, bloque por bloque"
          hint="Tocá cualquier ejercicio para ver el video y las claves de ejecución"
        />
        <BlockList blocks={workout.blocks} />
      </section>

      <section>
        <SectionHeader title="Tus registros de esta rutina" />
        {past.length === 0 ? (
          <div className="card px-4 py-4 text-[13px] text-muted">
            Todavía no la hiciste. Cuando la completes, vas a poder comparar marcas acá.
          </div>
        ) : (
          <ul className="space-y-2">
            {past.map((s) => (
              <li key={s.id} className="card flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold">{timeAgo(s.date)}</p>
                  <p className="text-[12px] text-muted">
                    {formatDuration(s.durationSec)} · {s.sets.filter((x) => x.done).length} series
                    {s.volumeKg ? ` · ${s.volumeKg} kg de volumen` : ''}
                  </p>
                </div>
                {s.score && (
                  <span className="tnum shrink-0 rounded-md bg-surface-2 px-2 py-1 text-[12px] font-bold text-accent">
                    {s.score}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
