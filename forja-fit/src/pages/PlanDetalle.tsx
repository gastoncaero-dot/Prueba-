import { ArrowLeft, CalendarRange, Check, Target } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button, EmptyState, SectionHeader, Tag } from '../components/ui'
import { getPlan } from '../data/plans'
import { EQUIPMENT_LABEL, LEVEL_LABEL, modality as modalityMeta, PLACE_LABEL } from '../data/taxonomy'
import { getWorkout } from '../data/workouts'
import { WEEKDAYS_SHORT, addDays, formatShortDate, startOfWeek, today } from '../lib/dates'
import { planPosition, planTotalSessions } from '../lib/planning'
import { useStore } from '../lib/store'

export function PlanDetalle() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const plan = id ? getPlan(id) : undefined

  const activePlan = useStore((s) => s.activePlan)
  const setActivePlan = useStore((s) => s.setActivePlan)
  const position = planPosition(activePlan)

  if (!plan) {
    return (
      <EmptyState
        title="No encontramos ese plan"
        action={
          <Link to="/rutinas">
            <Button size="sm">Ver planes</Button>
          </Link>
        }
      />
    )
  }

  const isActive = activePlan?.planId === plan.id
  const startMonday = isActive && activePlan ? startOfWeek(activePlan.startDate) : startOfWeek(today())

  function activate() {
    if (activePlan && activePlan.planId !== plan!.id) {
      const ok = confirm('Ya tenés un plan activo. ¿Querés reemplazarlo por este?')
      if (!ok) return
    }
    setActivePlan({ planId: plan!.id, startDate: startOfWeek(today()) })
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted hover:text-ink"
      >
        <ArrowLeft size={16} /> Volver
      </button>

      <header className="card px-4 py-5">
        <p className="overline text-accent">Plan de entrenamiento</p>
        <h1 className="display mt-1 text-2xl leading-tight">{plan.name}</h1>
        <p className="mt-1.5 flex items-start gap-1.5 text-[13px]">
          <Target size={14} className="mt-0.5 shrink-0 text-accent" />
          {plan.goal}
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">{plan.description}</p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          <Tag>
            <CalendarRange size={11} /> {plan.weeks.length} semanas
          </Tag>
          <Tag>{plan.daysPerWeek} días por semana</Tag>
          <Tag>{planTotalSessions(plan)} sesiones</Tag>
          <Tag>{LEVEL_LABEL[plan.level]}</Tag>
          <Tag>{plan.places.map((p) => PLACE_LABEL[p]).join(' · ')}</Tag>
        </div>
        <p className="mt-2 text-[11px] text-faint">
          Necesitás: {plan.equipment.map((e) => EQUIPMENT_LABEL[e]).join(', ')}
        </p>

        {isActive ? (
          <div className="mt-5 space-y-2">
            <div className="flex items-center gap-2 rounded-xl border border-accent/40 bg-accent/10 px-3 py-2.5 text-[13px] font-semibold text-accent">
              <Check size={15} />
              Plan activo desde el {formatShortDate(startMonday)}
              {position ? ` · semana ${Math.min(position.weekIndex + 1, position.totalWeeks)}` : ''}
            </div>
            <Button variant="danger" full onClick={() => setActivePlan(undefined)}>
              Desactivar plan
            </Button>
          </div>
        ) : (
          <Button size="lg" full className="mt-5" onClick={activate}>
            Activar este plan
          </Button>
        )}
      </header>

      <section>
        <SectionHeader
          title="Semana por semana"
          hint="Tocá cualquier día para ver el entrenamiento"
        />
        <div className="space-y-3">
          {plan.weeks.map((week, weekIndex) => {
            const weekMonday = addDays(startMonday, weekIndex * 7)
            const isCurrent = isActive && position?.weekIndex === weekIndex
            return (
              <article
                key={weekIndex}
                className={`card overflow-hidden ${isCurrent ? 'border-accent/50' : ''}`}
              >
                <header className="border-b border-line px-4 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="display text-[15px]">Semana {weekIndex + 1}</p>
                    {isActive && (
                      <span className="text-[11px] text-faint">
                        {formatShortDate(weekMonday)} — {formatShortDate(addDays(weekMonday, 6))}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[13px] font-semibold" style={{ color: 'var(--c-accent)' }}>
                    {week.focus}
                  </p>
                  {week.note && <p className="mt-1 text-[12px] text-muted">{week.note}</p>}
                </header>

                <ul className="divide-y divide-line-soft">
                  {week.days.map((day) => {
                    const workout = day.workoutId ? getWorkout(day.workoutId) : undefined
                    const isToday = isActive && isCurrent && position?.dayIndex === day.day
                    return (
                      <li key={day.day}>
                        {workout ? (
                          <Link
                            to={`/rutinas/${workout.id}`}
                            className={`flex items-center gap-3 px-4 py-2.5 hover:bg-surface-2 ${isToday ? 'bg-accent/8' : ''}`}
                          >
                            <span className="w-8 shrink-0 text-[11px] font-bold text-faint uppercase">
                              {WEEKDAYS_SHORT[day.day]}
                            </span>
                            <span
                              className="h-2 w-2 shrink-0 rounded-full"
                              style={{ background: modalityMeta(workout.modality).color }}
                            />
                            <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">
                              {workout.name}
                            </span>
                            <span className="shrink-0 text-[11px] text-faint">
                              {workout.durationMin} min
                            </span>
                          </Link>
                        ) : (
                          <div
                            className={`flex items-center gap-3 px-4 py-2.5 ${isToday ? 'bg-accent/8' : ''}`}
                          >
                            <span className="w-8 shrink-0 text-[11px] font-bold text-faint uppercase">
                              {WEEKDAYS_SHORT[day.day]}
                            </span>
                            <span className="text-[13px] text-faint">{day.label ?? 'Descanso'}</span>
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
