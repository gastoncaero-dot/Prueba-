import { CalendarX, Check } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Chip, EmptyState, SectionHeader } from '../components/ui'
import { WorkoutCard } from '../components/WorkoutCard'
import { MODALITIES, PLACE_LABEL, modality as modalityMeta } from '../data/taxonomy'
import {
  WEEKDAYS_LONG,
  WEEKDAYS_SHORT,
  addDays,
  formatLongDate,
  fromISODate,
  today,
  weekdayIndex,
} from '../lib/dates'
import { emphasisForDate, programmingForDate } from '../lib/programming'
import { useStore } from '../lib/store'
import type { Modality, Place } from '../types'

const PLACES: Place[] = ['sede', 'casa', 'outdoor']

export function Programacion() {
  const [date, setDate] = useState(today())
  const [modalityFilter, setModalityFilter] = useState<Modality | 'todas'>('todas')
  const [placeFilter, setPlaceFilter] = useState<Place | 'todos'>('todos')

  const history = useStore((s) => s.history)

  // Dos días atrás y tres semanas adelante: hoy queda a la vista y alcanza
  // para planificar sin abrumar.
  const days = useMemo(() => Array.from({ length: 23 }, (_, i) => addDays(today(), i - 2)), [])

  const programming = useMemo(() => programmingForDate(date), [date])
  const emphasis = useMemo(() => emphasisForDate(date), [date])

  const doneToday = useMemo(
    () => new Set(history.filter((h) => h.date === date).map((h) => h.workoutId)),
    [history, date],
  )

  const filtered = programming.filter(
    ({ modality, workout }) =>
      (modalityFilter === 'todas' || modality === modalityFilter) &&
      (placeFilter === 'todos' || workout.places.includes(placeFilter)),
  )

  const destacadas = filtered.filter(({ modality }) => emphasis.includes(modality))
  const resto = filtered.filter(({ modality }) => !emphasis.includes(modality))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="display text-2xl">Programación</h1>
        <p className="text-[13px] text-muted first-letter:uppercase">{formatLongDate(date)}</p>
      </div>

      {/* ------------------------------------------------------ tira de días */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {days.map((d) => {
          const active = d === date
          const isToday = d === today()
          const trained = history.some((h) => h.date === d)
          return (
            <button
              key={d}
              onClick={() => setDate(d)}
              style={{ width: 52 }}
              className={`relative flex h-16 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl border transition-colors ${
                active
                  ? 'border-accent bg-accent text-accent-ink'
                  : isToday
                    ? 'border-accent/50 bg-surface text-ink'
                    : 'border-line bg-surface text-muted hover:text-ink'
              }`}
            >
              <span className="text-[10px] font-bold tracking-wider uppercase">
                {WEEKDAYS_SHORT[weekdayIndex(d)]}
              </span>
              <span className="display tnum text-lg leading-none">{fromISODate(d).getDate()}</span>
              {trained && (
                <span
                  className="absolute bottom-1.5 h-1 w-1 rounded-full"
                  style={{ background: active ? 'var(--c-accent-ink)' : 'var(--c-accent)' }}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* ---------------------------------------------------------- filtros */}
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
              onClick={() => setModalityFilter(modalityFilter === m.id ? 'todas' : m.id)}
            >
              {m.label}
            </Chip>
          ))}
        </div>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          <Chip active={placeFilter === 'todos'} onClick={() => setPlaceFilter('todos')}>
            Donde sea
          </Chip>
          {PLACES.map((p) => (
            <Chip
              key={p}
              active={placeFilter === p}
              onClick={() => setPlaceFilter(placeFilter === p ? 'todos' : p)}
            >
              {PLACE_LABEL[p]}
            </Chip>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<CalendarX size={22} />}
          title="Nada con esos filtros"
          text="Probá con otra modalidad, otro lugar u otro día."
        />
      ) : (
        <>
          {destacadas.length > 0 && (
            <section className="space-y-2.5">
              <SectionHeader
                title="El foco del día"
                hint={`Lo que toca el ${WEEKDAYS_LONG[weekdayIndex(date)]}`}
              />
              {destacadas.map(({ modality, workout }) => (
                <div key={modality} className="relative">
                  <WorkoutCard workout={workout} compact />
                  {doneToday.has(workout.id) && (
                    <span
                      className="absolute top-3 right-11 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                      style={{
                        background: `${modalityMeta(modality).color}1f`,
                        color: modalityMeta(modality).color,
                      }}
                    >
                      <Check size={10} /> Hecho
                    </span>
                  )}
                </div>
              ))}
            </section>
          )}

          {resto.length > 0 && (
            <section className="space-y-2.5">
              <SectionHeader
                title="También disponible"
                hint="El resto de las modalidades, por si querés cambiar"
              />
              {resto.map(({ modality, workout }) => (
                <WorkoutCard key={modality} workout={workout} compact />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  )
}
