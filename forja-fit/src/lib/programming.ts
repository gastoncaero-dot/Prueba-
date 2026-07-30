import { WORKOUTS, getWorkout } from '../data/workouts'
import { COACHES, MODALITIES, VENUES } from '../data/taxonomy'
import type { ClassSlot, Modality, Place, Workout } from '../types'
import { weekdayIndex } from './dates'
import { hashString, intBetween, seededRandom } from './rand'

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

const TIMES: Record<Place, string[]> = {
  sede: ['07:00', '08:00', '09:00', '10:00', '12:00', '17:00', '18:00', '19:00', '20:00'],
  online: ['08:00', '13:00', '19:00'],
  outdoor: ['09:00', '18:30'],
  casa: ['libre'],
}

const BY_MODALITY = new Map<Modality, Workout[]>()
for (const m of MODALITIES) {
  BY_MODALITY.set(
    m.id,
    WORKOUTS.filter((w) => w.modality === m.id),
  )
}

/**
 * Programación del día: un entrenamiento por modalidad, igual para todos los
 * horarios de esa modalidad (como la programación diaria de un box).
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

/** El entrenamiento destacado del día (el primero de la modalidad principal). */
export function featuredWorkout(date: string): Workout {
  const programming = programmingForDate(date)
  return programming[0]?.workout ?? WORKOUTS[0]
}

function workoutForModalityAndPlace(
  date: string,
  mod: Modality,
  place: Place,
): Workout | undefined {
  const pool = (BY_MODALITY.get(mod) ?? []).filter((w) => w.places.includes(place))
  if (!pool.length) return undefined
  return pool[hashString(`${date}:${mod}:${place}`) % pool.length]
}

/** Todas las clases del día, con horario, sede, coach y lugares disponibles. */
export function slotsForDate(date: string): ClassSlot[] {
  const emphasis = WEEK_EMPHASIS[weekdayIndex(date)]
  const slots: ClassSlot[] = []

  for (const venue of VENUES) {
    const times = TIMES[venue.place]
    times.forEach((time, timeIndex) => {
      const rnd = seededRandom(`${date}|${venue.name}|${time}`)
      const modality = emphasis[(timeIndex + hashString(venue.name)) % emphasis.length]
      const workout =
        workoutForModalityAndPlace(date, modality, venue.place) ??
        workoutForModalityAndPlace(date, 'funcional', venue.place)
      if (!workout) return

      const capacity =
        venue.place === 'sede'
          ? intBetween(12, 18, rnd)
          : venue.place === 'online'
            ? intBetween(20, 30, rnd)
            : 0
      slots.push({
        id: `${date}|${venue.name}|${time}`,
        date,
        time,
        durationMin: workout.durationMin,
        workoutId: workout.id,
        modality: workout.modality,
        place: venue.place,
        venue: venue.name,
        coach: COACHES[hashString(`${date}${venue.name}${time}`) % COACHES.length],
        capacity,
        taken: capacity ? Math.min(capacity, Math.round(capacity * (0.35 + rnd() * 0.6))) : 0,
      })
    })
  }

  return slots.sort((a, b) => {
    if (a.time === b.time) return a.venue.localeCompare(b.venue)
    if (a.time === 'libre') return 1
    if (b.time === 'libre') return -1
    return a.time.localeCompare(b.time)
  })
}

export function getSlot(date: string, slotId: string): ClassSlot | undefined {
  return slotsForDate(date).find((s) => s.id === slotId)
}

/** Cupos libres; los entrenamientos en casa u outdoor no tienen límite. */
export function freeSpots(slot: ClassSlot): number | null {
  if (!slot.capacity) return null
  return Math.max(0, slot.capacity - slot.taken)
}

export function slotWorkout(slot: ClassSlot): Workout | undefined {
  return getWorkout(slot.workoutId)
}
