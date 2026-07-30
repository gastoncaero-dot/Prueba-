import { CalendarCheck, ChevronRight, Flame, MapPin, Play, Repeat2, Sparkles } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, EmptyState, Ring, SectionHeader, Stat } from '../components/ui'
import { WorkoutCard } from '../components/WorkoutCard'
import { modality as modalityMeta, PLACE_LABEL } from '../data/taxonomy'
import { getWorkout } from '../data/workouts'
import { formatDuration, startOfWeek, timeAgo, today } from '../lib/dates'
import { planPosition } from '../lib/planning'
import { programmingForDate } from '../lib/programming'
import { dayStreak } from '../lib/stats'
import { emptyDraft, useStore } from '../lib/store'

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 6) return 'Buenas noches'
  if (hour < 13) return 'Buen día'
  if (hour < 20) return 'Buenas tardes'
  return 'Buenas noches'
}

export function Hoy() {
  const navigate = useNavigate()
  const profile = useStore((s) => s.profile)
  const history = useStore((s) => s.history)
  const bookings = useStore((s) => s.bookings)
  const activePlan = useStore((s) => s.activePlan)
  const startSession = useStore((s) => s.startSession)
  const draft = useStore((s) => s.draft)

  const iso = today()
  const monday = startOfWeek(iso)
  const weekSessions = history.filter((h) => h.date >= monday).length
  const weekSeconds = history
    .filter((h) => h.date >= monday)
    .reduce((acc, h) => acc + h.durationSec, 0)
  const streak = dayStreak(history)

  const position = planPosition(activePlan, iso)
  const planWorkout = position?.day.workoutId ? getWorkout(position.day.workoutId) : undefined

  const todaysBookings = bookings
    .filter((b) => b.date === iso)
    .sort((a, b) => a.time.localeCompare(b.time))
  const upcoming = bookings
    .filter((b) => b.date > iso)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    .slice(0, 2)

  const programming = programmingForDate(iso)
  const lastSession = history[0]

  function launch(workoutId: string) {
    if (draft && draft.workoutId !== workoutId) {
      const ok = confirm(
        'Tenés una sesión sin terminar. ¿Querés descartarla y empezar este entrenamiento?',
      )
      if (!ok) return
    }
    if (!draft || draft.workoutId !== workoutId) {
      startSession(emptyDraft(workoutId, profile.homeOnly ? 'casa' : 'sede'))
    }
    navigate(`/sesion/${workoutId}`)
  }

  return (
    <div className="space-y-7">
      {/* -------------------------------------------------------- resumen */}
      <section>
        <p className="text-[13px] text-muted">
          {greeting()}
          {profile.name ? `, ${profile.name}` : ''}
        </p>
        <h1 className="display mt-0.5 text-2xl">Tu semana</h1>

        <div className="card mt-3 flex items-center gap-4 px-4 py-4">
          <Ring value={weekSessions} max={profile.daysPerWeek} size={72} thickness={7}>
            <span className="text-center">
              <span className="display tnum block text-lg leading-none">{weekSessions}</span>
              <span className="block text-[10px] text-faint">de {profile.daysPerWeek}</span>
            </span>
          </Ring>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              {weekSessions >= profile.daysPerWeek
                ? '¡Objetivo semanal cumplido!'
                : `${profile.daysPerWeek - weekSessions} ${
                    profile.daysPerWeek - weekSessions === 1 ? 'sesión' : 'sesiones'
                  } para cumplir la semana`}
            </p>
            <p className="mt-0.5 text-[12px] text-muted">
              {weekSessions === 0
                ? 'Todavía no entrenaste esta semana'
                : `${formatDuration(weekSeconds)} entrenados esta semana`}
            </p>
            <p className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-semibold text-accent">
              <Flame size={13} />
              {streak > 0
                ? `${streak} ${streak === 1 ? 'día seguido' : 'días seguidos'}`
                : 'Arrancá tu racha hoy'}
            </p>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------- plan de hoy */}
      {position && (
        <section>
          <SectionHeader
            title="Tu plan"
            hint={`${position.plan.name} · semana ${Math.min(position.weekIndex + 1, position.totalWeeks)} de ${position.totalWeeks}`}
            action={
              <Link
                to={`/planes/${position.plan.id}`}
                className="text-[12px] font-semibold text-accent"
              >
                Ver plan
              </Link>
            }
          />
          {position.finished ? (
            <EmptyState
              icon={<Sparkles size={22} />}
              title="Plan completado"
              text="Terminaste todas las semanas. Elegí un plan nuevo para seguir progresando."
              action={
                <Link to="/rutinas">
                  <Button size="sm">Ver planes</Button>
                </Link>
              }
            />
          ) : planWorkout ? (
            <div className="space-y-2">
              <p className="text-[12px] text-muted">
                <span className="font-semibold text-ink">Foco de la semana:</span>{' '}
                {position.week.focus}
                {position.week.note ? ` — ${position.week.note}` : ''}
              </p>
              <WorkoutCard workout={planWorkout} meta="Hoy toca" />
              <Button full size="lg" onClick={() => launch(planWorkout.id)}>
                <Play size={16} fill="currentColor" /> Empezar entrenamiento
              </Button>
            </div>
          ) : (
            <div className="card px-4 py-5 text-center">
              <p className="display text-base">Hoy descansás</p>
              <p className="mt-1 text-[13px] text-muted">
                El plan marca descanso. Si tenés ganas, sumá movilidad suave.
              </p>
              <Link to="/rutinas/mov-post-entreno">
                <Button size="sm" variant="secondary" className="mt-3">
                  Ver movilidad de 15 minutos
                </Button>
              </Link>
            </div>
          )}
        </section>
      )}

      {/* --------------------------------------------------------- reservas */}
      {(todaysBookings.length > 0 || upcoming.length > 0) && (
        <section>
          <SectionHeader
            title="Tus reservas"
            action={
              <Link to="/clases" className="text-[12px] font-semibold text-accent">
                Reservar
              </Link>
            }
          />
          <div className="space-y-2">
            {[...todaysBookings, ...upcoming].map((b) => {
              const workout = getWorkout(b.workoutId)
              const color = workout ? modalityMeta(workout.modality).color : 'var(--c-accent)'
              return (
                <div key={b.slotId} className="card flex items-center gap-3 px-4 py-3">
                  <span
                    className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl text-[11px] font-bold"
                    style={{ background: `${color}1f`, color }}
                  >
                    <CalendarCheck size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {workout?.name ?? 'Entrenamiento'}
                    </p>
                    <p className="text-[12px] text-muted">
                      {b.date === iso ? 'Hoy' : b.date} · {b.time !== 'libre' ? b.time : 'a tu horario'} ·{' '}
                      {b.venue}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => launch(b.workoutId)}>
                    Entrenar
                  </Button>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ---------------------------------------------------- programación */}
      <section>
        <SectionHeader
          title="Programación de hoy"
          hint="Un entrenamiento por modalidad, como en el box"
          action={
            <Link to="/clases" className="inline-flex items-center text-[12px] font-semibold text-accent">
              Horarios <ChevronRight size={14} />
            </Link>
          }
        />
        <div className="space-y-2.5">
          {programming.slice(0, 4).map(({ modality, workout }) => (
            <WorkoutCard key={modality} workout={workout} compact />
          ))}
        </div>
        <Link to="/clases">
          <Button variant="secondary" full className="mt-3">
            Ver las {programming.length} modalidades del día
          </Button>
        </Link>
      </section>

      {/* --------------------------------------------------- última sesión */}
      <section>
        <SectionHeader title="Última sesión" />
        {lastSession ? (
          <div className="card px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="display truncate text-[15px]">{lastSession.workoutName}</p>
                <p className="mt-0.5 text-[12px] text-muted">
                  {timeAgo(lastSession.date)} · {formatDuration(lastSession.durationSec)} ·{' '}
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={11} /> {PLACE_LABEL[lastSession.place]}
                  </span>
                </p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => launch(lastSession.workoutId)}>
                <Repeat2 size={14} /> Repetir
              </Button>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Stat label="Series" value={lastSession.sets.filter((s) => s.done).length} />
              <Stat label="Volumen" value={lastSession.volumeKg} unit="kg" />
              <Stat label="RPE" value={lastSession.rpe ?? '—'} />
            </div>
          </div>
        ) : (
          <EmptyState
            icon={<Play size={22} />}
            title="Todavía no registraste ninguna sesión"
            text="Elegí un entrenamiento de la programación de hoy y arrancá. Todo queda guardado en este dispositivo."
          />
        )}
      </section>
    </div>
  )
}
