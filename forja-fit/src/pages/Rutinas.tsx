import { CalendarRange, HeartOff, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Chip, EmptyState, Segmented, SectionHeader, TextInput } from '../components/ui'
import { WorkoutCard } from '../components/WorkoutCard'
import { PLANS } from '../data/plans'
import { LEVEL_LABEL, MODALITIES, PLACE_LABEL } from '../data/taxonomy'
import { WORKOUTS } from '../data/workouts'
import { planPosition, planTotalSessions } from '../lib/planning'
import { useStore } from '../lib/store'
import type { Level, Modality, Place } from '../types'

const PLACES: Place[] = ['sede', 'casa', 'online', 'outdoor']
const LEVELS: Level[] = ['principiante', 'intermedio', 'avanzado']

export function Rutinas() {
  const [tab, setTab] = useState<'rutinas' | 'planes' | 'favoritas'>('rutinas')
  const [query, setQuery] = useState('')
  const [modalityFilter, setModalityFilter] = useState<Modality | 'todas'>('todas')
  const [placeFilter, setPlaceFilter] = useState<Place | 'todos'>('todos')
  const [levelFilter, setLevelFilter] = useState<Level | 'todos'>('todos')
  const [maxDuration, setMaxDuration] = useState(0)

  const favorites = useStore((s) => s.favoriteWorkouts)
  const activePlan = useStore((s) => s.activePlan)
  const position = planPosition(activePlan)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return WORKOUTS.filter((w) => {
      if (modalityFilter !== 'todas' && w.modality !== modalityFilter) return false
      if (placeFilter !== 'todos' && !w.places.includes(placeFilter)) return false
      if (levelFilter !== 'todos' && w.level !== levelFilter) return false
      if (maxDuration && w.durationMin > maxDuration) return false
      if (!q) return true
      return [w.name, w.focus, w.description, ...(w.tags ?? [])]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [query, modalityFilter, placeFilter, levelFilter, maxDuration])

  const favoriteWorkouts = WORKOUTS.filter((w) => favorites.includes(w.id))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="display text-2xl">Rutinas</h1>
        <p className="text-[13px] text-muted">
          {WORKOUTS.length} entrenamientos y {PLANS.length} planes de varias semanas
        </p>
      </div>

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'rutinas', label: 'Entrenamientos' },
          { value: 'planes', label: 'Planes' },
          { value: 'favoritas', label: `Favoritas${favorites.length ? ` (${favorites.length})` : ''}` },
        ]}
      />

      {tab === 'rutinas' && (
        <>
          <div className="relative">
            <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-faint" />
            <TextInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre, foco o etiqueta"
              className="pl-9"
            />
          </div>

          <div className="space-y-2">
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
              <Chip active={modalityFilter === 'todas'} onClick={() => setModalityFilter('todas')}>
                Todas
              </Chip>
              {MODALITIES.map((m) => (
                <Chip
                  key={m.id}
                  active={modalityFilter === m.id}
                  color={m.color}
                  onClick={() => setModalityFilter(m.id)}
                >
                  {m.label}
                </Chip>
              ))}
            </div>
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
              <Chip active={placeFilter === 'todos'} onClick={() => setPlaceFilter('todos')}>
                Cualquier lugar
              </Chip>
              {PLACES.map((p) => (
                <Chip key={p} active={placeFilter === p} onClick={() => setPlaceFilter(p)}>
                  {PLACE_LABEL[p]}
                </Chip>
              ))}
              {LEVELS.map((l) => (
                <Chip key={l} active={levelFilter === l} onClick={() => setLevelFilter(levelFilter === l ? 'todos' : l)}>
                  {LEVEL_LABEL[l]}
                </Chip>
              ))}
              {[20, 30, 45].map((d) => (
                <Chip
                  key={d}
                  active={maxDuration === d}
                  onClick={() => setMaxDuration(maxDuration === d ? 0 : d)}
                >
                  ≤ {d} min
                </Chip>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              title="Ningún entrenamiento coincide"
              text="Probá quitando algún filtro o buscando otra palabra."
            />
          ) : (
            <div className="space-y-2.5">
              {filtered.map((w) => (
                <WorkoutCard key={w.id} workout={w} />
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'planes' && (
        <div className="space-y-2.5">
          {position && !position.finished && (
            <div className="card border-accent/40 px-4 py-3">
              <p className="overline text-accent">Plan activo</p>
              <p className="display mt-0.5 text-[15px]">{position.plan.name}</p>
              <p className="mt-0.5 text-[12px] text-muted">
                Semana {Math.min(position.weekIndex + 1, position.totalWeeks)} de{' '}
                {position.totalWeeks} · {position.week.focus}
              </p>
              <Link
                to={`/planes/${position.plan.id}`}
                className="mt-2 inline-block text-[12px] font-semibold text-accent"
              >
                Ver el detalle del plan
              </Link>
            </div>
          )}
          <SectionHeader title="Planes disponibles" hint="Programación armada de varias semanas" />
          {PLANS.map((plan) => (
            <Link key={plan.id} to={`/planes/${plan.id}`} className="card block px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="display text-[15px]">{plan.name}</h3>
                  <p className="mt-0.5 text-[13px] text-muted">{plan.goal}</p>
                </div>
                <span className="shrink-0 rounded-md border border-line bg-surface-2 px-2 py-1 text-[10px] font-bold tracking-wider uppercase">
                  {LEVEL_LABEL[plan.level]}
                </span>
              </div>
              <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted">
                {plan.description}
              </p>
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-faint">
                <span className="inline-flex items-center gap-1">
                  <CalendarRange size={12} /> {plan.weeks.length} semanas
                </span>
                <span>{plan.daysPerWeek} días por semana</span>
                <span>{planTotalSessions(plan)} sesiones en total</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {tab === 'favoritas' && (
        <div className="space-y-2.5">
          {favoriteWorkouts.length === 0 ? (
            <EmptyState
              icon={<HeartOff size={22} />}
              title="Sin favoritas todavía"
              text="Tocá el corazón en cualquier entrenamiento para tenerlo siempre a mano."
            />
          ) : (
            favoriteWorkouts.map((w) => <WorkoutCard key={w.id} workout={w} />)
          )}
        </div>
      )}
    </div>
  )
}
