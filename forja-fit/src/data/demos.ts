import { EXERCISES } from './exercises'

/**
 * Demostraciones que trae el catálogo: pares de fotos (posición inicial y
 * final) tomadas de free-exercise-db, un dataset de dominio público
 * (licencia Unlicense). Los archivos viven en public/demos y se sirven con la
 * app, así que funcionan sin conexión.
 *
 * Generado por scripts/build-demos.mjs — no lo edites a mano.
 */
export const CATALOG_DEMOS: Record<string, string> = {
  flexiones: "Pushups",
  'flexiones-inclinadas': "Incline Push-Up",
  'flexiones-declinadas': "Decline Push-Up",
  'press-banca': "Barbell Bench Press - Medium Grip",
  'press-banca-mancuernas': "Dumbbell Bench Press",
  'press-mancuernas-piso': "Dumbbell Floor Press",
  'fondos-cajon': "Bench Dips",
  'press-militar': "Standing Military Press",
  'press-hombro-mancuernas': "Standing Dumbbell Press",
  'push-press': "Push Press",
  'handstand-hold': "Handstand Push-Ups",
  'elevaciones-laterales': "Side Lateral Raise",
  dominadas: "Pullups",
  'dominadas-banda': "Band Assisted Pull-Up",
  'chin-up': "Chin-Up",
  'jalon-banda': "Wide-Grip Lat Pulldown",
  'colgado-escapular': "Scapular Pull-Up",
  'remo-mancuerna': "One-Arm Dumbbell Row",
  'remo-barra': "Bent Over Barbell Row",
  'remo-invertido': "Inverted Row",
  'remo-renegado': "Alternating Renegade Row",
  'face-pull-banda': "Face Pull",
  'sentadilla-libre': "Bodyweight Squat",
  'goblet-squat': "Goblet Squat",
  'sentadilla-trasera': "Barbell Full Squat",
  'sentadilla-frontal': "Front Barbell Squat",
  thruster: "Kettlebell Thruster",
  'peso-muerto': "Barbell Deadlift",
  'peso-muerto-rumano-mancuernas': "Stiff-Legged Dumbbell Deadlift",
  'peso-muerto-una-pierna': "Kettlebell One-Legged Deadlift",
  'hip-thrust': "Barbell Hip Thrust",
  'puente-gluteo': "Butt Lift (Bridge)",
  'buenos-dias': "Good Morning",
  'clean-mancuerna': "Dumbbell Clean",
  'zancadas-caminando': "Bodyweight Walking Lunge",
  'zancada-inversa': "Dumbbell Rear Lunge",
  'step-up': "Dumbbell Step Ups",
  plancha: "Plank",
  'plancha-lateral': "Side Bridge",
  'dead-bug': "Dead Bug",
  'pallof-press': "Pallof Press",
  'elevacion-piernas': "Flat Bench Lying Leg Raise",
  'v-ups': "Jackknife Sit-Up",
  'mountain-climbers': "Mountain Climbers",
  'russian-twist': "Russian Twist",
  'toes-to-bar': "Hanging Leg Raise",
  'sit-up': "Sit-Up",
  'farmer-carry': "Farmer's Walk",
  'sled-push': "Sled Push",
  'sled-pull': "Sled Drag - Harness",
  'box-jump': "Front Box Jump",
  soga: "Rope Jumping",
  'remo-erg': "Rowing, Stationary",
  'bici-asalto': "Bicycling, Stationary",
  trote: "Running, Treadmill",
  'gato-camello': "Cat Stretch",
  'estiramiento-mundial': "Groiners",
  'estiramiento-isquios': "Hamstring Stretch",
}

export interface DemoFramesInfo {
  /** Foto de la posición inicial. */
  start: string
  /** Foto de la posición final. */
  end: string
  /** Nombre del ejercicio en el dataset de origen. */
  source: string
}

/** Rutas de las dos fotos de un movimiento, si el catálogo trae demostración. */
export function catalogDemo(exerciseId: string): DemoFramesInfo | null {
  const source = CATALOG_DEMOS[exerciseId]
  if (!source) return null
  return {
    start: `./demos/${exerciseId}-0.webp`,
    end: `./demos/${exerciseId}-1.webp`,
    source,
  }
}

export const DEMO_COUNT = Object.keys(CATALOG_DEMOS).length

/** Movimientos del catálogo que todavía no tienen demostración propia. */
export function exercisesWithoutDemo(): string[] {
  return EXERCISES.filter((e) => !CATALOG_DEMOS[e.id]).map((e) => e.id)
}
