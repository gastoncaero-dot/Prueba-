import { getPlan } from '../data/plans'
import type { ActivePlan, Plan, PlanDay } from '../types'
import { daysBetween, startOfWeek, today, weekdayIndex } from './dates'

export interface PlanPosition {
  plan: Plan
  /** Semana en curso, base 0. */
  weekIndex: number
  dayIndex: number
  week: Plan['weeks'][number]
  day: PlanDay
  totalWeeks: number
  /** true cuando el plan ya terminó. */
  finished: boolean
}

/** Ubica una fecha dentro del plan activo. */
export function planPosition(active: ActivePlan | undefined, date = today()): PlanPosition | null {
  if (!active) return null
  const plan = getPlan(active.planId)
  if (!plan) return null

  const startMonday = startOfWeek(active.startDate)
  const elapsedDays = daysBetween(startMonday, date)
  if (elapsedDays < 0) return null

  const weekIndex = Math.floor(elapsedDays / 7)
  const dayIndex = weekdayIndex(date)
  const finished = weekIndex >= plan.weeks.length
  const week = plan.weeks[Math.min(weekIndex, plan.weeks.length - 1)]

  return {
    plan,
    weekIndex,
    dayIndex,
    week,
    day: week.days[dayIndex] ?? { day: dayIndex, label: 'Descanso' },
    totalWeeks: plan.weeks.length,
    finished,
  }
}

/** Cantidad de días con entrenamiento asignado en el plan completo. */
export function planTotalSessions(plan: Plan): number {
  return plan.weeks.reduce(
    (acc, week) => acc + week.days.filter((d) => Boolean(d.workoutId)).length,
    0,
  )
}
