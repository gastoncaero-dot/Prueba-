import { Check, ChevronLeft, ChevronRight, Film, Flag, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { SessionTimer } from '../components/SessionTimer'
import { Button, Chip, Field, FieldGroup, Sheet, TextArea, TextInput } from '../components/ui'
import { getExercise } from '../data/exercises'
import { BLOCK_KIND_LABEL, modality as modalityMeta } from '../data/taxonomy'
import { getWorkout } from '../data/workouts'
import { blockSummary } from '../lib/blocks'
import { formatClock, today } from '../lib/dates'
import { sessionVolume } from '../lib/stats'
import { emptyDraft, newId, useStore } from '../lib/store'
import type { Block, BlockItem, LoggedSet } from '../types'

/** Número de serie único dentro de la sesión (evita choques entre bloques). */
function setKey(blockIndex: number, index: number): number {
  return blockIndex * 100 + index + 1
}

function SetRow({
  item,
  blockIndex,
  index,
  loadable,
}: {
  item: BlockItem
  blockIndex: number
  index: number
  loadable: boolean
}) {
  const number = setKey(blockIndex, index)
  const logged = useStore((s) =>
    s.draft?.sets.find((x) => x.exerciseId === item.exerciseId && x.set === number),
  )
  const upsertSet = useStore((s) => s.upsertSet)
  const units = useStore((s) => s.profile.units)

  const usesTime = Boolean(item.timeSec) && !item.reps
  const usesDistance = Boolean(item.distanceM) && !item.reps

  const current: LoggedSet = logged ?? {
    exerciseId: item.exerciseId,
    set: number,
    reps: usesTime || usesDistance ? undefined : item.reps,
    timeSec: usesTime ? item.timeSec : undefined,
    distanceM: usesDistance ? item.distanceM : undefined,
    done: false,
  }

  function patch(next: Partial<LoggedSet>) {
    upsertSet({ ...current, ...next })
  }

  return (
    <div
      className={`flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors ${
        current.done ? 'bg-accent/10' : 'bg-surface-2'
      }`}
    >
      <span className="tnum w-6 shrink-0 text-center text-[12px] font-bold text-faint">
        {index + 1}
      </span>

      {loadable && (
        <label className="flex min-w-0 flex-1 items-center gap-1">
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.5"
            value={current.weightKg ?? ''}
            onChange={(e) =>
              patch({ weightKg: e.target.value === '' ? undefined : Number(e.target.value) })
            }
            placeholder="—"
            className="tnum w-full min-w-0 rounded-lg border border-line bg-surface px-2 py-1.5 text-center text-[13px] outline-none focus:border-accent/60"
          />
          <span className="shrink-0 text-[11px] text-faint">{units}</span>
        </label>
      )}

      <label className="flex min-w-0 flex-1 items-center gap-1">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={
            usesTime
              ? (current.timeSec ?? '')
              : usesDistance
                ? (current.distanceM ?? '')
                : (current.reps ?? '')
          }
          onChange={(e) => {
            const value = e.target.value === '' ? undefined : Number(e.target.value)
            if (usesTime) patch({ timeSec: value })
            else if (usesDistance) patch({ distanceM: value })
            else patch({ reps: value })
          }}
          placeholder="—"
          className="tnum w-full min-w-0 rounded-lg border border-line bg-surface px-2 py-1.5 text-center text-[13px] outline-none focus:border-accent/60"
        />
        <span className="shrink-0 text-[11px] text-faint">
          {usesTime ? 's' : usesDistance ? 'm' : 'reps'}
        </span>
      </label>

      <button
        onClick={() => patch({ done: !current.done })}
        aria-label={current.done ? 'Marcar como pendiente' : 'Marcar como hecha'}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors ${
          current.done
            ? 'border-accent bg-accent text-accent-ink'
            : 'border-line bg-surface text-faint hover:text-ink'
        }`}
      >
        <Check size={16} strokeWidth={3} />
      </button>
    </div>
  )
}

function ItemLogger({ item, block, blockIndex }: { item: BlockItem; block: Block; blockIndex: number }) {
  const exercise = getExercise(item.exerciseId)
  // En los formatos por rondas se registra una fila por ronda; en los que se
  // miden por resultado (AMRAP, EMOM, tabata) alcanza con una sola.
  const roundBased = ['series', 'circuito', 'for-time', 'intervalos'].includes(block.format)
  const sets = item.sets ?? (roundBased ? (block.rounds ?? 1) : 1)

  return (
    <section className="card px-3 py-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold">{exercise?.name ?? item.exerciseId}</h3>
          <p className="text-[12px] text-muted">
            {item.prescription}
            {item.load ? ` · ${item.load}` : ''}
            {item.restSec ? ` · descanso ${item.restSec} s` : ''}
          </p>
        </div>
        <Link
          to={`/ejercicios/${item.exerciseId}`}
          className="shrink-0 rounded-lg border border-line bg-surface-2 p-2 text-faint hover:text-ink"
          aria-label="Ver técnica y video"
        >
          <Film size={15} />
        </Link>
      </div>

      <div className="mt-2.5 space-y-1.5">
        {Array.from({ length: sets }, (_, i) => (
          <SetRow
            key={i}
            item={item}
            blockIndex={blockIndex}
            index={i}
            loadable={Boolean(exercise?.loadable)}
          />
        ))}
      </div>

      {item.notes && <p className="mt-2 text-[12px] text-faint">{item.notes}</p>}
    </section>
  )
}

export function Sesion() {
  const { workoutId } = useParams<{ workoutId: string }>()
  const navigate = useNavigate()
  const workout = workoutId ? getWorkout(workoutId) : undefined

  const draft = useStore((s) => s.draft)
  const profile = useStore((s) => s.profile)
  const startSession = useStore((s) => s.startSession)
  const updateDraft = useStore((s) => s.updateDraft)
  const discardDraft = useStore((s) => s.discardDraft)
  const finishSession = useStore((s) => s.finishSession)

  const [finishing, setFinishing] = useState(false)
  const [score, setScore] = useState('')
  const [rpe, setRpe] = useState<number | undefined>()
  const [notes, setNotes] = useState('')
  const [now, setNow] = useState(Date.now())

  // Si entrás directo por URL (o recargaste), arranca una sesión nueva. Solo al
  // montar: si no, al guardar la sesión se crearía un borrador nuevo enseguida.
  const bootstrapped = useRef(false)
  useEffect(() => {
    if (bootstrapped.current) return
    bootstrapped.current = true
    const current = useStore.getState().draft
    if (workoutId && workout && (!current || current.workoutId !== workoutId)) {
      startSession(emptyDraft(workoutId, profile.homeOnly ? 'casa' : workout.places[0]))
    }
  }, [workoutId, workout, startSession, profile.homeOnly])

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const elapsedSec = useMemo(() => {
    if (!draft) return 0
    return Math.max(0, Math.round((now - Date.parse(draft.startedAt)) / 1000))
  }, [draft, now])

  if (!workout || !draft) return null

  const blockIndex = Math.min(draft.blockIndex, workout.blocks.length - 1)
  const block = workout.blocks[blockIndex]
  const color = modalityMeta(workout.modality).color
  const isLast = blockIndex === workout.blocks.length - 1
  const doneSets = draft.sets.filter((s) => s.done).length

  function exit() {
    const choice = confirm(
      'Vas a salir de la sesión. Aceptá para guardarla como borrador y seguir después, o cancelá para quedarte.',
    )
    if (choice) navigate(-1)
  }

  function discard() {
    if (confirm('¿Descartar esta sesión sin guardarla?')) {
      discardDraft()
      navigate('/')
    }
  }

  function save() {
    finishSession({
      id: newId('sesion'),
      date: draft!.date || today(),
      startedAt: draft!.startedAt,
      finishedAt: new Date().toISOString(),
      durationSec: elapsedSec,
      workoutId: workout!.id,
      workoutName: workout!.name,
      modality: workout!.modality,
      place: draft!.place,
      sets: draft!.sets,
      score: score.trim() || undefined,
      rpe,
      notes: notes.trim() || undefined,
      volumeKg: sessionVolume(draft!.sets),
    })
    navigate('/progreso')
  }

  return (
    <div className="min-h-dvh bg-bg">
      <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <button
            onClick={exit}
            className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-ink"
            aria-label="Salir"
          >
            <X size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold">{workout.name}</p>
            <p className="text-[11px] text-faint">
              Bloque {blockIndex + 1} de {workout.blocks.length} · {doneSets} series hechas
            </p>
          </div>
          <span className="display tnum shrink-0 text-lg" style={{ color }}>
            {formatClock(elapsedSec)}
          </span>
        </div>
        <div className="h-0.5 w-full bg-surface-3">
          <div
            className="h-full transition-[width] duration-500"
            style={{
              width: `${((blockIndex + 1) / workout.blocks.length) * 100}%`,
              background: color,
            }}
          />
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-4 px-4 pt-4 pb-40">
        <div className="card px-4 py-4" style={{ borderColor: `${color}44` }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="overline" style={{ color }}>
                {BLOCK_KIND_LABEL[block.kind]}
              </p>
              <h1 className="display mt-0.5 text-lg leading-tight">{block.name}</h1>
            </div>
            <span className="shrink-0 rounded-md border border-line bg-surface-2 px-2 py-1 text-[10px] font-bold tracking-wider uppercase">
              {blockSummary(block)}
            </span>
          </div>
          {block.target && <p className="mt-2 text-[13px] text-muted">{block.target}</p>}
          {block.notes && <p className="mt-1 text-[12px] text-faint">{block.notes}</p>}
        </div>

        <SessionTimer
          block={block}
          prefs={{ sound: profile.sound, vibration: profile.vibration }}
        />

        <div className="space-y-2.5">
          {block.items.map((item, i) => (
            <ItemLogger
              key={`${block.id}-${item.exerciseId}-${i}`}
              item={item}
              block={block}
              blockIndex={blockIndex}
            />
          ))}
        </div>

        <button
          onClick={discard}
          className="w-full py-2 text-center text-[12px] font-semibold text-faint hover:text-danger"
        >
          Descartar esta sesión
        </button>
      </main>

      <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 backdrop-blur-lg">
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-3">
          <Button
            variant="secondary"
            disabled={blockIndex === 0}
            onClick={() => updateDraft({ blockIndex: blockIndex - 1 })}
          >
            <ChevronLeft size={16} />
          </Button>
          {isLast ? (
            <Button full size="lg" onClick={() => setFinishing(true)}>
              <Flag size={16} /> Terminar sesión
            </Button>
          ) : (
            <Button full size="lg" onClick={() => updateDraft({ blockIndex: blockIndex + 1 })}>
              Siguiente bloque <ChevronRight size={16} />
            </Button>
          )}
        </div>
      </div>

      <Sheet open={finishing} onClose={() => setFinishing(false)} title="Cerrar la sesión">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="card px-3 py-2.5 text-center">
              <p className="overline text-faint">Tiempo</p>
              <p className="display tnum text-lg">{formatClock(elapsedSec)}</p>
            </div>
            <div className="card px-3 py-2.5 text-center">
              <p className="overline text-faint">Series</p>
              <p className="display tnum text-lg">{doneSets}</p>
            </div>
            <div className="card px-3 py-2.5 text-center">
              <p className="overline text-faint">Volumen</p>
              <p className="display tnum text-lg">{sessionVolume(draft.sets)}</p>
            </div>
          </div>

          <Field
            label="Resultado"
            hint="Rondas + reps del AMRAP, tiempo del for time, o lo que quieras anotar."
          >
            <TextInput
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder="Ej: 7 rondas + 12 reps"
            />
          </Field>

          <FieldGroup label="Esfuerzo percibido (RPE)">
            <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <Chip key={n} active={rpe === n} onClick={() => setRpe(rpe === n ? undefined : n)}>
                  {n}
                </Chip>
              ))}
            </div>
          </FieldGroup>

          <Field label="Notas">
            <TextArea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Cómo te sentiste, qué cargas usaste, qué ajustar la próxima…"
            />
          </Field>

          <Button size="lg" full onClick={save}>
            Guardar sesión
          </Button>
        </div>
      </Sheet>
    </div>
  )
}
