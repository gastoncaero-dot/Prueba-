import { AlertTriangle, ArrowLeft, ArrowUpRight, CheckCircle2, Heart, TrendingDown, Wind } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button, EmptyState, SectionHeader, Tag } from '../components/ui'
import { VideoPlayer } from '../components/VideoPlayer'
import { getExercise } from '../data/exercises'
import {
  EQUIPMENT_LABEL,
  LEVEL_LABEL,
  MUSCLE_LABEL,
  PATTERN_LABEL,
  modality as modalityMeta,
} from '../data/taxonomy'
import { WORKOUTS } from '../data/workouts'
import { formatClock } from '../lib/dates'
import { personalRecords } from '../lib/stats'
import { useStore } from '../lib/store'

export function EjercicioDetalle() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const exercise = id ? getExercise(id) : undefined

  const history = useStore((s) => s.history)
  const favorites = useStore((s) => s.favoriteExercises)
  const toggleFavorite = useStore((s) => s.toggleFavoriteExercise)

  if (!exercise) {
    return (
      <EmptyState
        title="No encontramos ese movimiento"
        action={
          <Link to="/ejercicios">
            <Button size="sm">Volver a la biblioteca</Button>
          </Link>
        }
      />
    )
  }

  const color = modalityMeta(exercise.modalities[0]).color
  const isFav = favorites.includes(exercise.id)
  const record = personalRecords(history).get(exercise.id)
  const regression = exercise.regressionId ? getExercise(exercise.regressionId) : undefined
  const progression = exercise.progressionId ? getExercise(exercise.progressionId) : undefined
  const appearsIn = WORKOUTS.filter((w) =>
    w.blocks.some((b) => b.items.some((i) => i.exerciseId === exercise.id)),
  )

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
          onClick={() => toggleFavorite(exercise.id)}
          className="rounded-lg p-2 text-faint hover:bg-surface-2 hover:text-ink"
          aria-label={isFav ? 'Quitar de favoritos' : 'Guardar en favoritos'}
        >
          <Heart
            size={18}
            fill={isFav ? 'var(--c-accent)' : 'none'}
            color={isFav ? 'var(--c-accent)' : 'currentColor'}
          />
        </button>
      </div>

      <header>
        <p className="overline" style={{ color }}>
          {PATTERN_LABEL[exercise.pattern]}
        </p>
        <h1 className="display mt-1 text-2xl leading-tight">{exercise.name}</h1>
        {exercise.aka?.length ? (
          <p className="mt-0.5 text-[13px] text-muted">También conocido como {exercise.aka.join(', ')}</p>
        ) : null}
      </header>

      <VideoPlayer
        exerciseId={exercise.id}
        exerciseName={exercise.name}
        catalogUrl={exercise.videoUrl}
      />

      <div className="flex flex-wrap gap-1.5">
        <Tag color={color}>{LEVEL_LABEL[exercise.level]}</Tag>
        {exercise.equipment.map((eq) => (
          <Tag key={eq}>{EQUIPMENT_LABEL[eq]}</Tag>
        ))}
        {exercise.modalities.map((m) => (
          <Tag key={m} color={modalityMeta(m).color}>
            {modalityMeta(m).label}
          </Tag>
        ))}
      </div>

      <section className="card px-4 py-4">
        <p className="overline text-faint">Músculos que trabaja</p>
        <p className="mt-1 text-[13px]">
          <span className="font-semibold">Principales:</span>{' '}
          {exercise.primary.map((m) => MUSCLE_LABEL[m]).join(', ')}
        </p>
        {exercise.secondary?.length ? (
          <p className="mt-0.5 text-[13px] text-muted">
            <span className="font-semibold">Secundarios:</span>{' '}
            {exercise.secondary.map((m) => MUSCLE_LABEL[m]).join(', ')}
          </p>
        ) : null}
      </section>

      <section>
        <SectionHeader title="Cómo se hace" />
        <div className="card space-y-4 px-4 py-4">
          <div>
            <p className="overline text-faint">Posición inicial</p>
            <ul className="mt-1.5 space-y-1.5">
              {exercise.setup.map((s) => (
                <li key={s} className="flex gap-2 text-[13px] leading-relaxed">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-faint" />
                  {s}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="overline text-faint">Claves de ejecución</p>
            <ul className="mt-1.5 space-y-1.5">
              {exercise.cues.map((c) => (
                <li key={c} className="flex gap-2 text-[13px] leading-relaxed">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0" style={{ color }} />
                  {c}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="overline text-faint">Errores comunes</p>
            <ul className="mt-1.5 space-y-1.5">
              {exercise.mistakes.map((m) => (
                <li key={m} className="flex gap-2 text-[13px] leading-relaxed text-muted">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0 text-warn" />
                  {m}
                </li>
              ))}
            </ul>
          </div>

          {exercise.breathing && (
            <div>
              <p className="overline text-faint">Respiración</p>
              <p className="mt-1 flex gap-2 text-[13px] leading-relaxed">
                <Wind size={14} className="mt-0.5 shrink-0 text-muted" />
                {exercise.breathing}
              </p>
            </div>
          )}
        </div>
      </section>

      {(regression || progression) && (
        <section>
          <SectionHeader title="Variantes" hint="Para ajustar la dificultad" />
          <div className="space-y-2">
            {regression && (
              <Link to={`/ejercicios/${regression.id}`} className="card flex items-center gap-3 px-4 py-3">
                <TrendingDown size={16} className="shrink-0 text-ok" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] text-faint">Más fácil</span>
                  <span className="block truncate text-sm font-semibold">{regression.name}</span>
                </span>
              </Link>
            )}
            {progression && (
              <Link to={`/ejercicios/${progression.id}`} className="card flex items-center gap-3 px-4 py-3">
                <ArrowUpRight size={16} className="shrink-0 text-danger" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] text-faint">Más difícil</span>
                  <span className="block truncate text-sm font-semibold">{progression.name}</span>
                </span>
              </Link>
            )}
          </div>
        </section>
      )}

      {record && (
        <section>
          <SectionHeader title="Tus marcas" />
          <div className="card grid grid-cols-2 gap-x-4 gap-y-3 px-4 py-4 text-[13px]">
            {record.maxWeightKg && (
              <p>
                <span className="block text-[11px] text-faint">Carga máxima</span>
                <span className="display tnum text-lg">
                  {record.maxWeightKg} kg
                  {record.repsAtMax ? <span className="text-xs text-muted"> × {record.repsAtMax}</span> : null}
                </span>
              </p>
            )}
            {record.estimated1RM && (
              <p>
                <span className="block text-[11px] text-faint">1RM estimado</span>
                <span className="display tnum text-lg">{record.estimated1RM} kg</span>
              </p>
            )}
            {record.maxReps && (
              <p>
                <span className="block text-[11px] text-faint">Máximo de repeticiones</span>
                <span className="display tnum text-lg">{record.maxReps}</span>
              </p>
            )}
            {record.bestTimeSec && (
              <p>
                <span className="block text-[11px] text-faint">Mejor tiempo sostenido</span>
                <span className="display tnum text-lg">{formatClock(record.bestTimeSec)}</span>
              </p>
            )}
            {record.maxDistanceM && (
              <p>
                <span className="block text-[11px] text-faint">Mayor distancia</span>
                <span className="display tnum text-lg">{record.maxDistanceM} m</span>
              </p>
            )}
          </div>
        </section>
      )}

      {appearsIn.length > 0 && (
        <section>
          <SectionHeader title="Aparece en" hint={`${appearsIn.length} entrenamientos del catálogo`} />
          <ul className="card divide-y divide-line-soft overflow-hidden">
            {appearsIn.slice(0, 8).map((w) => (
              <li key={w.id}>
                <Link to={`/rutinas/${w.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-2">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: modalityMeta(w.modality).color }}
                  />
                  <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">{w.name}</span>
                  <span className="shrink-0 text-[11px] text-faint">{w.durationMin} min</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
