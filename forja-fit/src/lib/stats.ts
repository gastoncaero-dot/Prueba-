import type { LoggedSet, Modality, SessionLog } from '../types'
import { addDays, daysBetween, startOfWeek, today } from './dates'

export function setVolume(s: LoggedSet): number {
  if (!s.done) return 0
  if (s.weightKg && s.reps) return s.weightKg * s.reps
  return 0
}

export function sessionVolume(sets: LoggedSet[]): number {
  return Math.round(sets.reduce((acc, s) => acc + setVolume(s), 0))
}

export interface Totals {
  sessions: number
  minutes: number
  volumeKg: number
  setsDone: number
}

export function totals(history: SessionLog[]): Totals {
  return history.reduce<Totals>(
    (acc, h) => ({
      sessions: acc.sessions + 1,
      minutes: acc.minutes + Math.round(h.durationSec / 60),
      volumeKg: acc.volumeKg + h.volumeKg,
      setsDone: acc.setsDone + h.sets.filter((s) => s.done).length,
    }),
    { sessions: 0, minutes: 0, volumeKg: 0, setsDone: 0 },
  )
}

export interface WeekSummary {
  weekStart: string
  sessions: number
  minutes: number
  volumeKg: number
}

/** Resumen de las últimas `count` semanas, de la más vieja a la más reciente. */
export function weeklySummaries(history: SessionLog[], count = 8): WeekSummary[] {
  const thisMonday = startOfWeek(today())
  const weeks: WeekSummary[] = []
  for (let i = count - 1; i >= 0; i--) {
    const weekStart = addDays(thisMonday, -7 * i)
    const weekEnd = addDays(weekStart, 7)
    const inWeek = history.filter((h) => h.date >= weekStart && h.date < weekEnd)
    weeks.push({
      weekStart,
      sessions: inWeek.length,
      minutes: inWeek.reduce((a, h) => a + Math.round(h.durationSec / 60), 0),
      volumeKg: inWeek.reduce((a, h) => a + h.volumeKg, 0),
    })
  }
  return weeks
}

export interface PersonalRecord {
  exerciseId: string
  maxWeightKg?: number
  repsAtMax?: number
  maxReps?: number
  bestTimeSec?: number
  maxDistanceM?: number
  /** Mejor estimación de 1RM con la fórmula de Epley. */
  estimated1RM?: number
  date: string
}

export function personalRecords(history: SessionLog[]): Map<string, PersonalRecord> {
  const records = new Map<string, PersonalRecord>()
  for (const session of history) {
    for (const s of session.sets) {
      if (!s.done) continue
      const current: PersonalRecord = records.get(s.exerciseId) ?? {
        exerciseId: s.exerciseId,
        date: session.date,
      }
      if (s.weightKg && (!current.maxWeightKg || s.weightKg > current.maxWeightKg)) {
        current.maxWeightKg = s.weightKg
        current.repsAtMax = s.reps
        current.date = session.date
      }
      if (s.reps && !s.weightKg && (!current.maxReps || s.reps > current.maxReps)) {
        current.maxReps = s.reps
        current.date = session.date
      }
      if (s.timeSec && (!current.bestTimeSec || s.timeSec > current.bestTimeSec)) {
        current.bestTimeSec = s.timeSec
      }
      if (s.distanceM && (!current.maxDistanceM || s.distanceM > current.maxDistanceM)) {
        current.maxDistanceM = s.distanceM
      }
      if (s.weightKg && s.reps) {
        const epley = s.weightKg * (1 + s.reps / 30)
        if (!current.estimated1RM || epley > current.estimated1RM) {
          current.estimated1RM = Math.round(epley * 10) / 10
        }
      }
      records.set(s.exerciseId, current)
    }
  }
  return records
}

/** Serie de carga máxima por fecha para un ejercicio. */
export function loadProgression(
  history: SessionLog[],
  exerciseId: string,
): { date: string; weightKg: number }[] {
  const byDate = new Map<string, number>()
  for (const session of history) {
    for (const s of session.sets) {
      if (s.exerciseId !== exerciseId || !s.done || !s.weightKg) continue
      byDate.set(session.date, Math.max(byDate.get(session.date) ?? 0, s.weightKg))
    }
  }
  return [...byDate.entries()]
    .map(([date, weightKg]) => ({ date, weightKg }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/** Días seguidos entrenando, contando desde hoy o ayer. */
export function dayStreak(history: SessionLog[]): number {
  if (!history.length) return 0
  const days = new Set(history.map((h) => h.date))
  const base = days.has(today()) ? today() : addDays(today(), -1)
  if (!days.has(base)) return 0
  let streak = 0
  let cursor = base
  while (days.has(cursor)) {
    streak++
    cursor = addDays(cursor, -1)
  }
  return streak
}

/** Semanas seguidas en las que cumpliste el objetivo de sesiones. */
export function weekStreak(history: SessionLog[], target: number): number {
  const weeks = weeklySummaries(history, 26)
  let streak = 0
  for (let i = weeks.length - 1; i >= 0; i--) {
    // La semana en curso solo corta la racha si ya terminó.
    const isCurrent = i === weeks.length - 1
    if (weeks[i].sessions >= target) streak++
    else if (!isCurrent) break
    else continue
  }
  return streak
}

export function modalityBreakdown(history: SessionLog[]): { modality: Modality; count: number }[] {
  const counts = new Map<Modality, number>()
  for (const h of history) counts.set(h.modality, (counts.get(h.modality) ?? 0) + 1)
  return [...counts.entries()]
    .map(([modality, count]) => ({ modality, count }))
    .sort((a, b) => b.count - a.count)
}

/** Mapa fecha → cantidad de sesiones, para el calendario de adherencia. */
export function sessionsByDate(history: SessionLog[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const h of history) map.set(h.date, (map.get(h.date) ?? 0) + 1)
  return map
}

export function lastSessionOf(history: SessionLog[], workoutId: string): SessionLog | undefined {
  return history.find((h) => h.workoutId === workoutId)
}

/** Días desde la última sesión, o null si nunca entrenaste. */
export function daysSinceLastSession(history: SessionLog[]): number | null {
  if (!history.length) return null
  const latest = history.reduce((a, h) => (h.date > a ? h.date : a), history[0].date)
  return daysBetween(latest, today())
}
