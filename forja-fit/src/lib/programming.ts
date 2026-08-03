import { MODALITIES } from '../data/taxonomy'
import { WORKOUTS } from '../data/workouts'
import type { Modality, Workout } from '../types'
import { weekdayIndex } from './dates'
import { hashString } from './rand'

/**
 * La programación es determinística: se calcula a partir de la fecha, así que
 * el mismo día siempre muestra los mismos entrenamientos, sin backend.
 */

/** Modalidades que se programan cada día de la semana (0 = lunes). */
const WEEK_EMPHASIS: Modality[][] = [
  ['fuerza', 'funcional', 'lower', 'pilates', 'core'], // lunes
  ['upper', 'hyrox', 'cardio', 'funcional', 'movilidad'], // martes
  ['funcional', 'lower', 'pilates', 'core', 'fuerza'], // miércoles
  ['fuerza', 'upper', 'hyrox', 'cardio', 'funcional'], // jueves
  ['funcional', 'hyrox', 'lower', 'pilates', 'core'], // viernes
  ['funcional', 'cardio', 'upper', 'movilidad', 'hyrox'], // sábado
  ['movilidad', 'pilates', 'cardio', 'core', 'funcional'], // domingo
]

const BY_MODALITY = new Map<Modality, Workout[]>()
for (const m of MODALITIES) {
  BY_MODALITY.set(
    m.id,
    WORKOUTS.filter((w) => w.modality === m.id),
  )
}

/**
 * Programación del día: un entrenamiento por modalidad, con las modalidades
 * del día ordenadas primero.
 */
export function programmingForDate(date: string): { modality: Modality; workout: Workout }[] {
  const emphasis = WEEK_EMPHASIS[weekdayIndex(date)]
  const ordered = [...MODALITIES].sort((a, b) => {
    const ia = emphasis.indexOf(a.id)
    const ib = emphasis.indexOf(b.id)
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
  })
  return ordered.flatMap(({ id }) => {
    const pool = BY_MODALITY.get(id) ?? []
    if (!pool.length) return []
    // Rota el catálogo según el día para no repetir el mismo entrenamiento.
    const index = hashString(`${date}:${id}`) % pool.length
    return [{ modality: id, workout: pool[index] }]
  })
}

/** Las modalidades destacadas de la fecha, en orden. */
export function emphasisForDate(date: string): Modality[] {
  return WEEK_EMPHASIS[weekdayIndex(date)]
}

/** El entrenamiento destacado del día (el primero de la modalidad principal). */
export function featuredWorkout(date: string): Workout {
  const programming = programmingForDate(date)
  return programming[0]?.workout ?? WORKOUTS[0]
}
