import { Clock, Heart, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EQUIPMENT_LABEL, LEVEL_LABEL, modality as modalityMeta, PLACE_LABEL } from '../data/taxonomy'
import { useStore } from '../lib/store'
import type { Workout } from '../types'

export function WorkoutCard({
  workout,
  meta,
  to,
  compact,
}: {
  workout: Workout
  /** Línea extra arriba del nombre: horario, sede, coach. */
  meta?: string
  to?: string
  compact?: boolean
}) {
  const favorites = useStore((s) => s.favoriteWorkouts)
  const toggleFavorite = useStore((s) => s.toggleFavoriteWorkout)
  const color = modalityMeta(workout.modality).color
  const isFav = favorites.includes(workout.id)

  return (
    <div className="card relative overflow-hidden">
      <span className="absolute inset-y-0 left-0 w-1" style={{ background: color }} />
      <Link to={to ?? `/rutinas/${workout.id}`} className="block pl-4 pr-3 py-3.5">
        {meta && (
          <p className="overline mb-1" style={{ color }}>
            {meta}
          </p>
        )}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="display truncate text-[15px] leading-snug">{workout.name}</h3>
            <p className="mt-0.5 text-[13px] text-muted">{workout.focus}</p>
          </div>
          <span
            className="shrink-0 rounded-md px-2 py-1 text-[10px] font-bold tracking-wider uppercase"
            style={{ background: `${color}1f`, color }}
          >
            {modalityMeta(workout.modality).label}
          </span>
        </div>

        {!compact && (
          <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted">
            {workout.description}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-faint">
          <span className="inline-flex items-center gap-1">
            <Clock size={12} /> {workout.durationMin} min
          </span>
          <span>{LEVEL_LABEL[workout.level]}</span>
          <span className="inline-flex items-center gap-1">
            <MapPin size={12} /> {workout.places.map((p) => PLACE_LABEL[p]).join(' · ')}
          </span>
          {!compact && workout.equipment[0] && (
            <span className="truncate">
              {workout.equipment.map((e) => EQUIPMENT_LABEL[e]).join(', ')}
            </span>
          )}
        </div>
      </Link>
      <button
        onClick={() => toggleFavorite(workout.id)}
        aria-label={isFav ? 'Quitar de favoritas' : 'Guardar en favoritas'}
        className="absolute right-2.5 bottom-2.5 rounded-lg p-1.5 text-faint transition-colors hover:text-ink"
      >
        <Heart size={15} fill={isFav ? 'var(--c-accent)' : 'none'} color={isFav ? 'var(--c-accent)' : 'currentColor'} />
      </button>
    </div>
  )
}
