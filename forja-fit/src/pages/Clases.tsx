import { CalendarX, Check, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button, Chip, EmptyState, Segmented, SectionHeader } from '../components/ui'
import { WorkoutCard } from '../components/WorkoutCard'
import { MODALITIES, modality as modalityMeta, PLACE_LABEL } from '../data/taxonomy'
import { getWorkout } from '../data/workouts'
import {
  WEEKDAYS_SHORT,
  addDays,
  formatLongDate,
  fromISODate,
  today,
  weekdayIndex,
} from '../lib/dates'
import { freeSpots, programmingForDate, slotsForDate } from '../lib/programming'
import { useStore } from '../lib/store'
import type { Modality, Place } from '../types'

const PLACES: Place[] = ['sede', 'online', 'casa', 'outdoor']

export function Clases() {
  const [date, setDate] = useState(today())
  const [view, setView] = useState<'horarios' | 'programacion'>('horarios')
  const [modalityFilter, setModalityFilter] = useState<Modality | 'todas'>('todas')
  const [placeFilter, setPlaceFilter] = useState<Place | 'todos'>('todos')

  const bookings = useStore((s) => s.bookings)
  const book = useStore((s) => s.book)
  const cancelBooking = useStore((s) => s.cancelBooking)

  const days = useMemo(
    () => Array.from({ length: 14 }, (_, i) => addDays(today(), i)),
    [],
  )
  const slots = useMemo(() => slotsForDate(date), [date])
  const programming = useMemo(() => programmingForDate(date), [date])

  const filtered = slots.filter(
    (s) =>
      (modalityFilter === 'todas' || s.modality === modalityFilter) &&
      (placeFilter === 'todos' || s.place === placeFilter),
  )

  const bookedIds = new Set(bookings.map((b) => b.slotId))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="display text-2xl">Clases</h1>
        <p className="text-[13px] text-muted">
          {slots.length} entrenamientos programados para el {formatLongDate(date)}
        </p>
      </div>

      {/* ------------------------------------------------------ tira de días */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {days.map((d) => {
          const active = d === date
          return (
            <button
              key={d}
              onClick={() => setDate(d)}
              className={`flex h-16 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl border transition-colors ${
                active
                  ? 'border-accent bg-accent text-accent-ink'
                  : 'border-line bg-surface text-muted hover:text-ink'
              }`}
              style={{ width: 52 }}
            >
              <span className="text-[10px] font-bold tracking-wider uppercase">
                {WEEKDAYS_SHORT[weekdayIndex(d)]}
              </span>
              <span className="display tnum text-lg leading-none">{fromISODate(d).getDate()}</span>
            </button>
          )
        })}
      </div>

      <Segmented
        value={view}
        onChange={setView}
        options={[
          { value: 'horarios', label: 'Horarios' },
          { value: 'programacion', label: 'Programación del día' },
        ]}
      />

      {view === 'programacion' ? (
        <section className="space-y-2.5">
          <SectionHeader
            title="Qué se entrena"
            hint="El entrenamiento asignado a cada modalidad para esta fecha"
          />
          {programming.map(({ modality, workout }) => (
            <WorkoutCard key={modality} workout={workout} compact />
          ))}
        </section>
      ) : (
        <>
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
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={<CalendarX size={22} />}
              title="No hay clases con esos filtros"
              text="Probá con otra modalidad, otro lugar u otro día."
            />
          ) : (
            <ul className="space-y-2">
              {filtered.map((slot) => {
                const workout = getWorkout(slot.workoutId)
                if (!workout) return null
                const color = modalityMeta(slot.modality).color
                const spots = freeSpots(slot)
                const isBooked = bookedIds.has(slot.id)
                const full = spots !== null && spots <= 0

                return (
                  <li key={slot.id} className="card overflow-hidden">
                    <div className="flex items-stretch">
                      <div
                        className="flex w-16 shrink-0 flex-col items-center justify-center gap-0.5 border-r border-line"
                        style={{ background: `${color}12` }}
                      >
                        <span className="display tnum text-[15px] leading-none" style={{ color }}>
                          {slot.time === 'libre' ? '∞' : slot.time}
                        </span>
                        <span className="text-[10px] text-faint">{slot.durationMin}′</span>
                      </div>

                      <div className="min-w-0 flex-1 px-3 py-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{workout.name}</p>
                            <p className="mt-0.5 text-[12px] text-muted">
                              {slot.venue}
                              {slot.place === 'sede' || slot.place === 'online'
                                ? ` · coach ${slot.coach}`
                                : ''}
                            </p>
                          </div>
                          <span
                            className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase"
                            style={{ background: `${color}1f`, color }}
                          >
                            {modalityMeta(slot.modality).label}
                          </span>
                        </div>

                        <div className="mt-2.5 flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1 text-[11px] text-faint">
                            {spots === null ? (
                              'Sin límite de cupo'
                            ) : (
                              <>
                                <Users size={11} />
                                {full ? 'Completo' : `${spots} lugares libres`}
                              </>
                            )}
                          </span>
                          {isBooked ? (
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-accent">
                                <Check size={12} /> Reservado
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => cancelBooking(slot.id)}
                              >
                                Cancelar
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant={full ? 'secondary' : 'primary'}
                              disabled={full}
                              onClick={() =>
                                book({
                                  slotId: slot.id,
                                  date: slot.date,
                                  time: slot.time,
                                  workoutId: slot.workoutId,
                                  venue: slot.venue,
                                  createdAt: new Date().toISOString(),
                                })
                              }
                            >
                              {full ? 'Completo' : 'Reservar'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
