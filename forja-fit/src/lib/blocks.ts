import { FORMAT_LABEL } from '../data/taxonomy'
import type { Block } from '../types'
import { formatDuration } from './dates'

/** Resumen del formato del bloque: "AMRAP 14 min", "4 rondas", "8 × 20/10 s". */
export function blockSummary(block: Block): string {
  const label = FORMAT_LABEL[block.format]
  if (block.format === 'amrap' || block.format === 'emom') {
    return `${label} ${formatDuration(block.durationSec ?? 0)}`
  }
  if (block.format === 'tabata' || block.format === 'intervalos') {
    const rounds = block.rounds ?? 1
    if (block.workSec) return `${rounds} × ${block.workSec}/${block.restSec ?? 0} s`
    return `${label} · ${rounds} rondas`
  }
  if (block.rounds && block.rounds > 1) return `${label} · ${block.rounds} rondas`
  return label
}

/** Duración estimada de un bloque, en segundos. */
export function blockDurationSec(block: Block): number {
  if (block.durationSec) return block.durationSec
  if (block.format === 'intervalos' || block.format === 'tabata') {
    const rounds = block.rounds ?? 1
    return rounds * ((block.workSec ?? 40) + (block.restSec ?? 20))
  }
  const rounds = block.rounds ?? 1
  const perRound = block.items.reduce((acc, i) => acc + (i.timeSec ?? (i.reps ?? 10) * 3), 0)
  return rounds * perRound + (block.restBetweenSetsSec ?? 0) * Math.max(rounds - 1, 0)
}
