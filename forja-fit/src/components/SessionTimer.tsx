import { Pause, Play, RotateCcw, SkipForward } from 'lucide-react'
import { FORMAT_HELP } from '../data/taxonomy'
import { formatClock } from '../lib/dates'
import { beepCountdown, beepFinish, beepStart, vibrate } from '../lib/sound'
import { useClock, useIntervals } from '../lib/timer'
import type { Block } from '../types'

interface Prefs {
  sound: boolean
  vibration: boolean
}

function useFeedback({ sound, vibration }: Prefs) {
  return {
    tick: (secondsLeft: number) => {
      if (secondsLeft > 3 || secondsLeft < 0) return
      if (sound) beepCountdown(secondsLeft)
      if (vibration && secondsLeft === 0) vibrate(120)
    },
    start: () => {
      if (sound) beepStart()
      if (vibration) vibrate(60)
    },
    finish: () => {
      if (sound) beepFinish()
      if (vibration) vibrate([80, 60, 160])
    },
  }
}

function Controls({
  running,
  onToggle,
  onReset,
  onSkip,
}: {
  running: boolean
  onToggle: () => void
  onReset: () => void
  onSkip?: () => void
}) {
  return (
    <div className="mt-4 flex items-center justify-center gap-2">
      <button
        onClick={onReset}
        className="rounded-xl border border-line bg-surface-2 p-3 text-muted hover:text-ink"
        aria-label="Reiniciar"
      >
        <RotateCcw size={18} />
      </button>
      <button
        onClick={onToggle}
        className="flex h-14 w-20 items-center justify-center rounded-2xl bg-accent text-accent-ink"
        aria-label={running ? 'Pausar' : 'Iniciar'}
      >
        {running ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
      </button>
      {onSkip && (
        <button
          onClick={onSkip}
          className="rounded-xl border border-line bg-surface-2 p-3 text-muted hover:text-ink"
          aria-label="Saltear"
        >
          <SkipForward size={18} />
        </button>
      )}
    </div>
  )
}

function CountdownTimer({ block, prefs }: { block: Block; prefs: Prefs }) {
  const feedback = useFeedback(prefs)
  const duration = block.durationSec ?? 600
  const clock = useClock({
    direction: 'down',
    durationSec: duration,
    onTick: feedback.tick,
    onFinish: feedback.finish,
  })

  const isEmom = block.format === 'emom'
  const elapsed = duration - clock.seconds
  const minute = Math.floor(elapsed / 60) + 1
  const totalMinutes = Math.round(duration / 60)
  const secondsInMinute = Math.floor(elapsed % 60)

  return (
    <div className="text-center">
      <p className="overline text-faint">
        {isEmom ? `Minuto ${Math.min(minute, totalMinutes)} de ${totalMinutes}` : 'Tiempo restante'}
      </p>
      <p className="display tnum mt-1 text-6xl leading-none">{formatClock(clock.seconds)}</p>
      {isEmom && (
        <p className="tnum mt-2 text-[13px] text-accent">
          {60 - secondsInMinute} s para el próximo minuto
        </p>
      )}
      <Controls running={clock.running} onToggle={clock.toggle} onReset={clock.reset} />
    </div>
  )
}

function StopwatchTimer({ block, prefs }: { block: Block; prefs: Prefs }) {
  const feedback = useFeedback(prefs)
  const clock = useClock({ direction: 'up' })
  const rest = useClock({
    direction: 'down',
    durationSec: block.restBetweenSetsSec ?? 90,
    onTick: feedback.tick,
    onFinish: feedback.finish,
  })

  return (
    <div className="text-center">
      <p className="overline text-faint">Tiempo del bloque</p>
      <p className="display tnum mt-1 text-6xl leading-none">{formatClock(clock.seconds)}</p>
      <Controls running={clock.running} onToggle={clock.toggle} onReset={clock.reset} />

      <div className="mt-4 border-t border-line-soft pt-3">
        <p className="overline text-faint">Descanso</p>
        <div className="mt-2 flex items-center justify-center gap-2">
          <span className="display tnum w-16 text-xl">{formatClock(rest.seconds)}</span>
          <button
            onClick={() => {
              rest.reset()
              rest.start()
              feedback.start()
            }}
            className="rounded-lg bg-surface-3 px-3 py-2 text-[12px] font-semibold hover:bg-surface-2"
          >
            {block.restBetweenSetsSec ?? 90} s
          </button>
          <button
            onClick={rest.toggle}
            className="rounded-lg bg-surface-3 px-3 py-2 text-[12px] font-semibold hover:bg-surface-2"
          >
            {rest.running ? 'Pausar' : 'Seguir'}
          </button>
        </div>
      </div>
    </div>
  )
}

function IntervalTimer({ block, prefs }: { block: Block; prefs: Prefs }) {
  const feedback = useFeedback(prefs)
  const engine = useIntervals({
    rounds: block.rounds ?? 8,
    workSec: block.workSec ?? 20,
    restSec: block.restSec ?? 10,
    onTick: feedback.tick,
    onPhaseChange: (phase) => {
      if (phase === 'trabajo') feedback.start()
      if (phase === 'terminado') feedback.finish()
    },
  })

  const label: Record<typeof engine.phase, string> = {
    listo: 'Listo para arrancar',
    preparacion: 'Preparate',
    trabajo: 'Trabajo',
    descanso: 'Descanso',
    terminado: 'Bloque terminado',
  }

  const color =
    engine.phase === 'trabajo'
      ? 'var(--c-accent)'
      : engine.phase === 'descanso'
        ? 'var(--c-warn)'
        : 'var(--c-muted)'

  return (
    <div className="text-center">
      <p className="overline" style={{ color }}>
        {label[engine.phase]} · ronda {engine.round} de {engine.totalRounds}
      </p>
      <p
        className={`display tnum mt-1 text-6xl leading-none ${engine.phase === 'trabajo' && engine.secondsLeft <= 3 ? 'animate-beat' : ''}`}
        style={{ color: engine.phase === 'trabajo' ? color : undefined }}
      >
        {engine.phase === 'terminado' ? '¡Listo!' : formatClock(engine.secondsLeft)}
      </p>
      <div className="mt-3 flex justify-center gap-1">
        {Array.from({ length: engine.totalRounds }, (_, i) => (
          <span
            key={i}
            className="h-1.5 w-4 rounded-full transition-colors"
            style={{
              background:
                i + 1 < engine.round || engine.phase === 'terminado'
                  ? 'var(--c-accent)'
                  : i + 1 === engine.round && engine.phase !== 'listo'
                    ? 'var(--c-accent)'
                    : 'var(--c-surface-3)',
              opacity: i + 1 === engine.round && engine.phase !== 'terminado' ? 0.6 : 1,
            }}
          />
        ))}
      </div>
      <Controls
        running={engine.running}
        onToggle={engine.toggle}
        onReset={engine.reset}
        onSkip={engine.skip}
      />
    </div>
  )
}

export function SessionTimer({ block, prefs }: { block: Block; prefs: Prefs }) {
  // La `key` reinicia los cronómetros al cambiar de bloque.
  return (
    <div key={block.id} className="card px-4 py-5">
      {block.format === 'amrap' || block.format === 'emom' ? (
        <CountdownTimer block={block} prefs={prefs} />
      ) : block.format === 'tabata' || block.format === 'intervalos' ? (
        <IntervalTimer block={block} prefs={prefs} />
      ) : (
        <StopwatchTimer block={block} prefs={prefs} />
      )}
      <p className="mt-4 border-t border-line-soft pt-3 text-center text-[12px] text-faint">
        {FORMAT_HELP[block.format]}
      </p>
    </div>
  )
}
