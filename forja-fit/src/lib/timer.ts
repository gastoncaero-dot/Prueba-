import { useCallback, useEffect, useRef, useState } from 'react'

/** Cronómetro que cuenta hacia arriba o hacia abajo, en segundos. */
export function useClock(options: {
  direction: 'up' | 'down'
  durationSec?: number
  autoStart?: boolean
  onFinish?: () => void
  onTick?: (secondsLeft: number) => void
}) {
  const { direction, durationSec = 0, autoStart = false, onFinish, onTick } = options
  const [running, setRunning] = useState(autoStart)
  const [elapsed, setElapsed] = useState(0)
  const startedAt = useRef<number | null>(autoStart ? Date.now() : null)
  const base = useRef(0)
  const finishedRef = useRef(false)
  const lastTick = useRef(-1)

  const finishCb = useRef(onFinish)
  const tickCb = useRef(onTick)
  finishCb.current = onFinish
  tickCb.current = onTick

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      const now = Date.now()
      const value = base.current + (startedAt.current ? (now - startedAt.current) / 1000 : 0)
      setElapsed(value)

      if (direction === 'down') {
        const left = Math.max(0, durationSec - value)
        const whole = Math.ceil(left)
        if (whole !== lastTick.current) {
          lastTick.current = whole
          tickCb.current?.(whole)
        }
        if (left <= 0 && !finishedRef.current) {
          finishedRef.current = true
          setRunning(false)
          finishCb.current?.()
        }
      } else {
        const whole = Math.floor(value)
        if (whole !== lastTick.current) {
          lastTick.current = whole
          tickCb.current?.(whole)
        }
      }
    }, 100)
    return () => clearInterval(id)
  }, [running, direction, durationSec])

  const start = useCallback(() => {
    if (finishedRef.current) return
    startedAt.current = Date.now()
    setRunning(true)
  }, [])

  const pause = useCallback(() => {
    if (startedAt.current) base.current += (Date.now() - startedAt.current) / 1000
    startedAt.current = null
    setRunning(false)
  }, [])

  const reset = useCallback(() => {
    base.current = 0
    startedAt.current = null
    finishedRef.current = false
    lastTick.current = -1
    setElapsed(0)
    setRunning(false)
  }, [])

  const seconds = direction === 'down' ? Math.max(0, durationSec - elapsed) : elapsed

  return {
    seconds,
    running,
    finished: finishedRef.current,
    start,
    pause,
    reset,
    toggle: () => (running ? pause() : start()),
  }
}

export type IntervalPhase = 'listo' | 'preparacion' | 'trabajo' | 'descanso' | 'terminado'

export interface IntervalState {
  phase: IntervalPhase
  round: number
  totalRounds: number
  secondsLeft: number
  running: boolean
}

/**
 * Motor de intervalos: preparación → (trabajo → descanso) × rondas.
 * Sirve para tabata, intervalos y circuitos con tiempo pautado.
 */
export function useIntervals(config: {
  rounds: number
  workSec: number
  restSec: number
  prepSec?: number
  onPhaseChange?: (phase: IntervalPhase, round: number) => void
  onTick?: (secondsLeft: number, phase: IntervalPhase) => void
}) {
  const { rounds, workSec, restSec, prepSec = 10 } = config
  const [phase, setPhase] = useState<IntervalPhase>('listo')
  const [round, setRound] = useState(1)
  const [secondsLeft, setSecondsLeft] = useState(prepSec)
  const [running, setRunning] = useState(false)
  const deadline = useRef<number>(0)

  const phaseCb = useRef(config.onPhaseChange)
  const tickCb = useRef(config.onTick)
  phaseCb.current = config.onPhaseChange
  tickCb.current = config.onTick

  const enter = useCallback(
    (next: IntervalPhase, nextRound: number, duration: number) => {
      setPhase(next)
      setRound(nextRound)
      setSecondsLeft(duration)
      deadline.current = Date.now() + duration * 1000
      phaseCb.current?.(next, nextRound)
      if (next === 'terminado') setRunning(false)
    },
    [],
  )

  useEffect(() => {
    if (!running || phase === 'listo' || phase === 'terminado') return
    const id = setInterval(() => {
      const left = Math.max(0, (deadline.current - Date.now()) / 1000)
      const whole = Math.ceil(left)
      setSecondsLeft((prev) => {
        if (whole !== Math.ceil(prev)) tickCb.current?.(whole, phase)
        return left
      })
      if (left > 0) return

      if (phase === 'preparacion') {
        enter('trabajo', round, workSec)
      } else if (phase === 'trabajo') {
        if (restSec > 0) enter('descanso', round, restSec)
        else if (round < rounds) enter('trabajo', round + 1, workSec)
        else enter('terminado', round, 0)
      } else if (phase === 'descanso') {
        if (round < rounds) enter('trabajo', round + 1, workSec)
        else enter('terminado', round, 0)
      }
    }, 100)
    return () => clearInterval(id)
  }, [running, phase, round, rounds, workSec, restSec, enter])

  const start = useCallback(() => {
    if (phase === 'listo') enter('preparacion', 1, prepSec)
    else deadline.current = Date.now() + secondsLeft * 1000
    setRunning(true)
  }, [phase, prepSec, secondsLeft, enter])

  const pause = useCallback(() => setRunning(false), [])

  const reset = useCallback(() => {
    setRunning(false)
    setPhase('listo')
    setRound(1)
    setSecondsLeft(prepSec)
  }, [prepSec])

  const skip = useCallback(() => {
    deadline.current = Date.now()
  }, [])

  return {
    phase,
    round,
    totalRounds: rounds,
    secondsLeft: Math.ceil(secondsLeft),
    running,
    start,
    pause,
    reset,
    skip,
    toggle: () => (running ? pause() : start()),
  }
}
