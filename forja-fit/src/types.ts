/** Modelo de datos de Forja Fit. Todo el contenido es original y editable. */

export type Modality =
  | 'fuerza'
  | 'hyrox'
  | 'pilates'
  | 'upper'
  | 'lower'
  | 'funcional'
  | 'cardio'
  | 'core'
  | 'movilidad'

export type Place = 'sede' | 'casa' | 'outdoor' | 'online'

export type Equipment =
  | 'ninguno'
  | 'mancuernas'
  | 'kettlebell'
  | 'barra'
  | 'banda'
  | 'trx'
  | 'cajon'
  | 'soga'
  | 'remo'
  | 'bici'
  | 'ski'
  | 'balon'
  | 'sled'
  | 'sandbag'
  | 'colchoneta'
  | 'banco'
  | 'aro'

export type Muscle =
  | 'pecho'
  | 'espalda'
  | 'dorsales'
  | 'hombros'
  | 'biceps'
  | 'triceps'
  | 'antebrazos'
  | 'cuadriceps'
  | 'isquios'
  | 'gluteos'
  | 'aductores'
  | 'gemelos'
  | 'core'
  | 'lumbares'
  | 'cardiovascular'
  | 'cuerpo-completo'

export type Pattern =
  | 'empuje-horizontal'
  | 'empuje-vertical'
  | 'traccion-horizontal'
  | 'traccion-vertical'
  | 'sentadilla'
  | 'bisagra'
  | 'zancada'
  | 'core-antiextension'
  | 'core-antirotacion'
  | 'core-flexion'
  | 'transporte'
  | 'locomocion'
  | 'salto'
  | 'monoestructural'
  | 'movilidad'

export type Level = 'principiante' | 'intermedio' | 'avanzado'

/** Cómo se mide el trabajo de un movimiento. */
export type MeasureUnit = 'reps' | 'tiempo' | 'distancia' | 'calorias'

export interface Exercise {
  id: string
  name: string
  aka?: string[]
  pattern: Pattern
  modalities: Modality[]
  equipment: Equipment[]
  primary: Muscle[]
  secondary?: Muscle[]
  level: Level
  unit: MeasureUnit
  /** Si tiene sentido registrar kilos en el historial. */
  loadable: boolean
  setup: string[]
  cues: string[]
  mistakes: string[]
  breathing?: string
  /** Variante más fácil / más difícil, por id. */
  regressionId?: string
  progressionId?: string
  /** Video de demostración que trae el catálogo (podés reemplazarlo). */
  videoUrl?: string
}

export type BlockKind =
  | 'calentamiento'
  | 'fuerza'
  | 'metcon'
  | 'accesorio'
  | 'core'
  | 'finisher'
  | 'movilidad'

/** Formato del bloque: define qué cronómetro usa el reproductor de sesión. */
export type BlockFormat =
  | 'series' // series y repeticiones clásicas
  | 'amrap' // tantas rondas como puedas en X tiempo
  | 'emom' // cada minuto, en el minuto
  | 'tabata' // intervalos 20/10 (configurable)
  | 'for-time' // completar el trabajo lo más rápido posible
  | 'intervalos' // trabajo/descanso por rondas
  | 'circuito' // estaciones seguidas, descanso entre rondas
  | 'libre' // sin cronómetro

export interface BlockItem {
  exerciseId: string
  /** Texto que se muestra: "10 reps", "40 s", "200 m", "12 cal". */
  prescription: string
  sets?: number
  reps?: number
  timeSec?: number
  distanceM?: number
  calories?: number
  /** Sugerencia de carga en texto: "moderado", "20 kg", "60% 1RM". */
  load?: string
  restSec?: number
  notes?: string
}

export interface Block {
  id: string
  name: string
  kind: BlockKind
  format: BlockFormat
  /** Duración total del bloque (amrap, emom, intervalos, tabata). */
  durationSec?: number
  rounds?: number
  workSec?: number
  restSec?: number
  /** Descanso entre series/rondas para el formato series/circuito. */
  restBetweenSetsSec?: number
  items: BlockItem[]
  notes?: string
  /** Objetivo del bloque, se muestra arriba en la sesión. */
  target?: string
}

export interface Workout {
  id: string
  name: string
  modality: Modality
  level: Level
  durationMin: number
  places: Place[]
  equipment: Equipment[]
  focus: string
  description: string
  blocks: Block[]
  tags?: string[]
  /** Estímulo esperado, en una línea. */
  stimulus?: string
}

// ------------------------------------------------------------ programación

export interface ClassSlot {
  id: string
  /** Fecha ISO (YYYY-MM-DD). */
  date: string
  /** HH:MM, 24 h. */
  time: string
  durationMin: number
  workoutId: string
  modality: Modality
  place: Place
  venue: string
  coach: string
  capacity: number
  taken: number
}

export interface Booking {
  slotId: string
  date: string
  time: string
  workoutId: string
  venue: string
  createdAt: string
  /** Se marca al terminar la sesión desde el reproductor. */
  attended?: boolean
}

// -------------------------------------------------------------- historial

export interface LoggedSet {
  exerciseId: string
  set: number
  reps?: number
  weightKg?: number
  timeSec?: number
  distanceM?: number
  done: boolean
}

export interface SessionLog {
  id: string
  /** Fecha ISO del día entrenado. */
  date: string
  startedAt: string
  finishedAt: string
  durationSec: number
  workoutId: string
  workoutName: string
  modality: Modality
  place: Place
  sets: LoggedSet[]
  /** Resultado libre del metcon: rondas, tiempo, reps. */
  score?: string
  rpe?: number
  notes?: string
  /** Volumen total en kg (suma de reps × carga). */
  volumeKg: number
}

// ------------------------------------------------------- objetivos y plan

export type GoalMetric = 'sesiones' | 'carga' | 'peso-corporal' | 'medida' | 'tiempo' | 'libre'

export interface Goal {
  id: string
  title: string
  metric: GoalMetric
  target: number
  start: number
  unit: string
  /** Para metas de carga: a qué ejercicio aplica. */
  exerciseId?: string
  deadline?: string
  createdAt: string
  doneAt?: string
  /** Valor cargado a mano cuando la métrica no se puede calcular sola. */
  manual?: number
}

export interface PlanDay {
  /** 0 = lunes. */
  day: number
  workoutId?: string
  label?: string
}

export interface PlanWeek {
  focus: string
  note?: string
  days: PlanDay[]
}

export interface Plan {
  id: string
  name: string
  goal: string
  level: Level
  weeks: PlanWeek[]
  daysPerWeek: number
  description: string
  places: Place[]
  equipment: Equipment[]
}

export interface ActivePlan {
  planId: string
  /** Fecha ISO del lunes de la semana 1. */
  startDate: string
}

export interface Measurement {
  id: string
  date: string
  weightKg?: number
  bodyFatPct?: number
  chestCm?: number
  waistCm?: number
  hipCm?: number
  armCm?: number
  thighCm?: number
  notes?: string
}

export interface Profile {
  name: string
  goalText: string
  level: Level
  daysPerWeek: number
  equipment: Equipment[]
  homeOnly: boolean
  units: 'kg' | 'lb'
  theme: 'dark' | 'light'
  sound: boolean
  vibration: boolean
  onboarded: boolean
  createdAt: string
}
