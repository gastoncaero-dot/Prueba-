import { Award, Plus, Ruler, Target, Trash2, TrendingUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart, Heatmap, LineChart, RankedBars } from '../components/Charts'
import {
  Button,
  Chip,
  EmptyState,
  Field,
  Progress,
  Sheet,
  Segmented,
  SectionHeader,
  Select,
  Stat,
  TextArea,
  TextInput,
} from '../components/ui'
import { EXERCISES, exerciseName } from '../data/exercises'
import { modality as modalityMeta } from '../data/taxonomy'
import {
  addDays,
  formatClock,
  formatDuration,
  formatShortDate,
  startOfWeek,
  timeAgo,
  today,
} from '../lib/dates'
import {
  dayStreak,
  loadProgression,
  modalityBreakdown,
  personalRecords,
  sessionsByDate,
  totals,
  weeklySummaries,
  weekStreak,
} from '../lib/stats'
import { newId, useStore } from '../lib/store'
import type { Goal, GoalMetric } from '../types'

const METRIC_LABEL: Record<GoalMetric, string> = {
  sesiones: 'Cantidad de sesiones',
  carga: 'Carga en un ejercicio',
  'peso-corporal': 'Peso corporal',
  medida: 'Una medida corporal',
  tiempo: 'Un tiempo o marca',
  libre: 'Objetivo libre',
}

export function Progreso() {
  const [tab, setTab] = useState<'resumen' | 'historial' | 'marcas' | 'medidas' | 'objetivos'>(
    'resumen',
  )
  const history = useStore((s) => s.history)
  const profile = useStore((s) => s.profile)

  const summary = useMemo(() => totals(history), [history])
  const weeks = useMemo(() => weeklySummaries(history, 8), [history])
  const byDate = useMemo(() => sessionsByDate(history), [history])
  const streak = dayStreak(history)
  const weeksStreak = weekStreak(history, profile.daysPerWeek)

  const heatDays = useMemo(() => {
    const start = addDays(startOfWeek(today()), -7 * 11)
    return Array.from({ length: 12 * 7 }, (_, i) => addDays(start, i))
  }, [])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="display text-2xl">Progreso</h1>
        <p className="text-[13px] text-muted">
          {summary.sessions} {summary.sessions === 1 ? 'sesión registrada' : 'sesiones registradas'}
          {summary.minutes ? ` · ${formatDuration(summary.minutes * 60)} en total` : ''}
        </p>
      </div>

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'resumen', label: 'Resumen' },
          { value: 'historial', label: 'Historial' },
          { value: 'marcas', label: 'Marcas' },
          { value: 'medidas', label: 'Medidas' },
          { value: 'objetivos', label: 'Objetivos' },
        ]}
      />

      {tab === 'resumen' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Sesiones" value={summary.sessions} />
            <Stat label="Tiempo" value={Math.round(summary.minutes / 60)} unit="h" />
            <Stat label="Volumen" value={summary.volumeKg.toLocaleString('es-AR')} unit="kg" />
            <Stat
              label="Racha"
              value={streak}
              unit={streak === 1 ? 'día' : 'días'}
              hint={weeksStreak ? `${weeksStreak} semanas cumplidas` : undefined}
            />
          </div>

          <section className="card px-4 py-4">
            <SectionHeader title="Sesiones por semana" hint="Últimas 8 semanas" />
            <BarChart
              data={weeks.map((w, i) => ({
                label: formatShortDate(w.weekStart),
                value: w.sessions,
                current: i === weeks.length - 1,
                detail: `${w.sessions} sesiones · ${formatDuration(w.minutes * 60)}${w.volumeKg ? ` · ${w.volumeKg} kg` : ''}`,
              }))}
              goal={profile.daysPerWeek}
              unit="sesiones"
            />
          </section>

          <section className="card px-4 py-4">
            <SectionHeader title="Constancia" hint="Cada cuadrado es un día" />
            <Heatmap days={heatDays} counts={byDate} />
          </section>

          {history.length > 0 && (
            <section className="card px-4 py-4">
              <SectionHeader title="Qué entrenaste" hint="Sesiones por modalidad" />
              <RankedBars
                items={modalityBreakdown(history).map((m) => ({
                  label: modalityMeta(m.modality).label,
                  value: m.count,
                  color: modalityMeta(m.modality).color,
                }))}
              />
            </section>
          )}

          {history.length === 0 && (
            <EmptyState
              icon={<TrendingUp size={22} />}
              title="Sin datos todavía"
              text="Cuando termines tu primera sesión vas a ver acá tu volumen, tus marcas y tu constancia."
              action={
                <Link to="/">
                  <Button size="sm">Ver la programación de hoy</Button>
                </Link>
              }
            />
          )}
        </div>
      )}

      {tab === 'historial' && <Historial />}
      {tab === 'marcas' && <Marcas />}
      {tab === 'medidas' && <Medidas />}
      {tab === 'objetivos' && <Objetivos />}
    </div>
  )
}

// ---------------------------------------------------------------- historial

function Historial() {
  const history = useStore((s) => s.history)
  const deleteSession = useStore((s) => s.deleteSession)

  if (!history.length) {
    return <EmptyState title="Todavía no hay sesiones" text="Acá se guarda todo lo que entrenás." />
  }

  return (
    <ul className="space-y-2">
      {history.map((s) => (
        <li key={s.id} className="card px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link to={`/rutinas/${s.workoutId}`} className="display truncate text-[15px]">
                {s.workoutName}
              </Link>
              <p className="mt-0.5 text-[12px] text-muted">
                {formatShortDate(s.date)} · {timeAgo(s.date)} · {formatDuration(s.durationSec)}
              </p>
            </div>
            <span
              className="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase"
              style={{
                background: `${modalityMeta(s.modality).color}1f`,
                color: modalityMeta(s.modality).color,
              }}
            >
              {modalityMeta(s.modality).label}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted">
            <span>{s.sets.filter((x) => x.done).length} series</span>
            {s.volumeKg > 0 && <span>{s.volumeKg.toLocaleString('es-AR')} kg de volumen</span>}
            {s.rpe && <span>RPE {s.rpe}</span>}
            {s.score && <span className="font-semibold text-accent">{s.score}</span>}
          </div>

          {s.notes && <p className="mt-1.5 text-[12px] text-faint">{s.notes}</p>}

          <button
            onClick={() => {
              if (confirm('¿Borrar esta sesión del historial?')) deleteSession(s.id)
            }}
            className="mt-2 inline-flex items-center gap-1 text-[11px] text-faint hover:text-danger"
          >
            <Trash2 size={12} /> Borrar
          </button>
        </li>
      ))}
    </ul>
  )
}

// ------------------------------------------------------------------ marcas

function Marcas() {
  const history = useStore((s) => s.history)
  const records = useMemo(() => personalRecords(history), [history])
  const entries = [...records.values()].sort((a, b) => (b.maxWeightKg ?? 0) - (a.maxWeightKg ?? 0))
  const loadable = entries.filter((e) => e.maxWeightKg)
  const [selected, setSelected] = useState<string>(loadable[0]?.exerciseId ?? '')
  const progression = useMemo(
    () => (selected ? loadProgression(history, selected) : []),
    [history, selected],
  )

  if (!entries.length) {
    return (
      <EmptyState
        icon={<Award size={22} />}
        title="Sin marcas registradas"
        text="Cargá los kilos y las repeticiones durante la sesión y tus récords aparecen solos."
      />
    )
  }

  return (
    <div className="space-y-5">
      {loadable.length > 0 && (
        <section className="card px-4 py-4">
          <SectionHeader title="Progresión de carga" />
          <Select value={selected} onChange={(e) => setSelected(e.target.value)}>
            {loadable.map((r) => (
              <option key={r.exerciseId} value={r.exerciseId}>
                {exerciseName(r.exerciseId)}
              </option>
            ))}
          </Select>
          <div className="mt-3">
            <LineChart points={progression.map((p) => ({ date: p.date, value: p.weightKg }))} />
          </div>
        </section>
      )}

      <section>
        <SectionHeader title="Tus récords" hint="Lo mejor que registraste en cada movimiento" />
        <ul className="card divide-y divide-line-soft overflow-hidden">
          {entries.map((r) => (
            <li key={r.exerciseId} className="flex items-center gap-3 px-4 py-2.5">
              <Link
                to={`/ejercicios/${r.exerciseId}`}
                className="min-w-0 flex-1 truncate text-[13px] font-semibold"
              >
                {exerciseName(r.exerciseId)}
              </Link>
              <span className="tnum shrink-0 text-right text-[13px]">
                {r.maxWeightKg ? (
                  <>
                    <span className="font-bold">{r.maxWeightKg} kg</span>
                    {r.repsAtMax ? <span className="text-muted"> × {r.repsAtMax}</span> : null}
                  </>
                ) : r.maxReps ? (
                  <span className="font-bold">{r.maxReps} reps</span>
                ) : r.bestTimeSec ? (
                  <span className="font-bold">{formatClock(r.bestTimeSec)}</span>
                ) : r.maxDistanceM ? (
                  <span className="font-bold">{r.maxDistanceM} m</span>
                ) : (
                  <span className="text-faint">—</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

// ----------------------------------------------------------------- medidas

function Medidas() {
  const measurements = useStore((s) => s.measurements)
  const addMeasurement = useStore((s) => s.addMeasurement)
  const removeMeasurement = useStore((s) => s.removeMeasurement)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    date: today(),
    weightKg: '',
    waistCm: '',
    chestCm: '',
    hipCm: '',
    armCm: '',
    thighCm: '',
    notes: '',
  })

  const weightSeries = [...measurements]
    .filter((m) => m.weightKg)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((m) => ({ date: m.date, value: m.weightKg as number }))

  function save() {
    const num = (v: string) => (v.trim() === '' ? undefined : Number(v))
    addMeasurement({
      id: newId('med'),
      date: form.date,
      weightKg: num(form.weightKg),
      waistCm: num(form.waistCm),
      chestCm: num(form.chestCm),
      hipCm: num(form.hipCm),
      armCm: num(form.armCm),
      thighCm: num(form.thighCm),
      notes: form.notes.trim() || undefined,
    })
    setForm({ ...form, weightKg: '', waistCm: '', chestCm: '', hipCm: '', armCm: '', thighCm: '', notes: '' })
    setOpen(false)
  }

  return (
    <div className="space-y-5">
      <Button full onClick={() => setOpen(true)}>
        <Plus size={16} /> Registrar medidas
      </Button>

      {weightSeries.length >= 2 && (
        <section className="card px-4 py-4">
          <SectionHeader title="Peso corporal" />
          <LineChart points={weightSeries} unit="kg" />
        </section>
      )}

      {measurements.length === 0 ? (
        <EmptyState
          icon={<Ruler size={22} />}
          title="Sin registros"
          text="Anotá tu peso y medidas cada dos o tres semanas para ver la evolución."
        />
      ) : (
        <ul className="space-y-2">
          {measurements.map((m) => (
            <li key={m.id} className="card px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[13px] font-semibold">{formatShortDate(m.date)}</p>
                <button
                  onClick={() => removeMeasurement(m.id)}
                  className="text-faint hover:text-danger"
                  aria-label="Borrar registro"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted">
                {m.weightKg && <span>Peso {m.weightKg} kg</span>}
                {m.chestCm && <span>Pecho {m.chestCm} cm</span>}
                {m.waistCm && <span>Cintura {m.waistCm} cm</span>}
                {m.hipCm && <span>Cadera {m.hipCm} cm</span>}
                {m.armCm && <span>Brazo {m.armCm} cm</span>}
                {m.thighCm && <span>Muslo {m.thighCm} cm</span>}
              </div>
              {m.notes && <p className="mt-1 text-[12px] text-faint">{m.notes}</p>}
            </li>
          ))}
        </ul>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="Nuevo registro">
        <div className="space-y-3">
          <Field label="Fecha">
            <TextInput
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                ['weightKg', 'Peso (kg)'],
                ['waistCm', 'Cintura (cm)'],
                ['chestCm', 'Pecho (cm)'],
                ['hipCm', 'Cadera (cm)'],
                ['armCm', 'Brazo (cm)'],
                ['thighCm', 'Muslo (cm)'],
              ] as const
            ).map(([key, label]) => (
              <Field key={key} label={label}>
                <TextInput
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder="—"
                />
              </Field>
            ))}
          </div>
          <Field label="Notas">
            <TextArea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Cómo te sentís, cambios que notaste…"
            />
          </Field>
          <Button full onClick={save}>
            Guardar
          </Button>
        </div>
      </Sheet>
    </div>
  )
}

// --------------------------------------------------------------- objetivos

function goalCurrent(goal: Goal, state: { history: ReturnType<typeof useStore.getState>['history']; measurements: ReturnType<typeof useStore.getState>['measurements'] }): number {
  if (goal.metric === 'sesiones') {
    return state.history.filter((h) => h.date >= goal.createdAt.slice(0, 10)).length
  }
  if (goal.metric === 'carga' && goal.exerciseId) {
    return personalRecords(state.history).get(goal.exerciseId)?.maxWeightKg ?? goal.start
  }
  if (goal.metric === 'peso-corporal') {
    const latest = state.measurements.find((m) => m.weightKg)
    return latest?.weightKg ?? goal.start
  }
  return goal.manual ?? goal.start
}

function Objetivos() {
  const goals = useStore((s) => s.goals)
  const history = useStore((s) => s.history)
  const measurements = useStore((s) => s.measurements)
  const addGoal = useStore((s) => s.addGoal)
  const updateGoal = useStore((s) => s.updateGoal)
  const removeGoal = useStore((s) => s.removeGoal)

  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [metric, setMetric] = useState<GoalMetric>('sesiones')
  const [exerciseId, setExerciseId] = useState(EXERCISES.find((e) => e.loadable)?.id ?? '')
  const [start, setStart] = useState('0')
  const [target, setTarget] = useState('')
  const [unit, setUnit] = useState('sesiones')
  const [deadline, setDeadline] = useState('')

  function save() {
    if (!title.trim() || !target.trim()) return
    addGoal({
      id: newId('goal'),
      title: title.trim(),
      metric,
      target: Number(target),
      start: Number(start) || 0,
      unit: unit.trim() || 'unidades',
      exerciseId: metric === 'carga' ? exerciseId : undefined,
      deadline: deadline || undefined,
      createdAt: new Date().toISOString(),
    })
    setTitle('')
    setTarget('')
    setOpen(false)
  }

  return (
    <div className="space-y-4">
      <Button full onClick={() => setOpen(true)}>
        <Plus size={16} /> Nuevo objetivo
      </Button>

      {goals.length === 0 ? (
        <EmptyState
          icon={<Target size={22} />}
          title="Sin objetivos cargados"
          text="Un objetivo concreto y con fecha es lo que sostiene la constancia."
        />
      ) : (
        <ul className="space-y-2.5">
          {goals.map((goal) => {
            const current = goalCurrent(goal, { history, measurements })
            const range = goal.target - goal.start || 1
            const progress = Math.max(0, Math.min(1, (current - goal.start) / range))
            const done = Boolean(goal.doneAt) || progress >= 1
            return (
              <li key={goal.id} className="card px-4 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{goal.title}</p>
                    <p className="text-[12px] text-muted">
                      {METRIC_LABEL[goal.metric]}
                      {goal.exerciseId ? ` · ${exerciseName(goal.exerciseId)}` : ''}
                      {goal.deadline ? ` · hasta el ${formatShortDate(goal.deadline)}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => removeGoal(goal.id)}
                    className="shrink-0 text-faint hover:text-danger"
                    aria-label="Borrar objetivo"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="mt-3">
                  <div className="mb-1 flex items-baseline justify-between text-[12px]">
                    <span className="tnum font-bold">
                      {current} / {goal.target} {goal.unit}
                    </span>
                    <span className={done ? 'font-bold text-accent' : 'text-faint'}>
                      {done ? '¡Cumplido!' : `${Math.round(progress * 100)}%`}
                    </span>
                  </div>
                  <Progress value={progress * 100} max={100} />
                </div>

                {['medida', 'tiempo', 'libre'].includes(goal.metric) && (
                  <div className="mt-3 flex items-center gap-2">
                    <TextInput
                      type="number"
                      inputMode="decimal"
                      value={goal.manual ?? ''}
                      onChange={(e) =>
                        updateGoal(goal.id, {
                          manual: e.target.value === '' ? undefined : Number(e.target.value),
                        })
                      }
                      placeholder="Valor actual"
                      className="max-w-32"
                    />
                    <span className="text-[12px] text-faint">{goal.unit}</span>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="Nuevo objetivo">
        <div className="space-y-3">
          <Field label="¿Qué querés lograr?">
            <TextInput
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: entrenar 4 veces por semana"
            />
          </Field>
          <Field label="Tipo de objetivo">
            <Select value={metric} onChange={(e) => setMetric(e.target.value as GoalMetric)}>
              {(Object.keys(METRIC_LABEL) as GoalMetric[]).map((m) => (
                <option key={m} value={m}>
                  {METRIC_LABEL[m]}
                </option>
              ))}
            </Select>
          </Field>
          {metric === 'carga' && (
            <Field label="Ejercicio">
              <Select value={exerciseId} onChange={(e) => setExerciseId(e.target.value)}>
                {EXERCISES.filter((e) => e.loadable).map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <div className="grid grid-cols-3 gap-2">
            <Field label="Desde">
              <TextInput
                type="number"
                inputMode="decimal"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </Field>
            <Field label="Hasta">
              <TextInput
                type="number"
                inputMode="decimal"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="Meta"
              />
            </Field>
            <Field label="Unidad">
              <TextInput value={unit} onChange={(e) => setUnit(e.target.value)} />
            </Field>
          </div>
          <Field label="Fecha límite (opcional)">
            <TextInput
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            {['sesiones', 'kg', 'cm', 'minutos', 'repeticiones'].map((u) => (
              <Chip key={u} active={unit === u} onClick={() => setUnit(u)}>
                {u}
              </Chip>
            ))}
          </div>
          <Button full onClick={save}>
            Crear objetivo
          </Button>
        </div>
      </Sheet>
    </div>
  )
}
