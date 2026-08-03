/**
 * Genera las demostraciones del catálogo (public/demos) a partir de
 * free-exercise-db, un dataset de ejercicios de dominio público:
 *
 *   https://github.com/yuhonas/free-exercise-db   (licencia Unlicense)
 *
 * Descarga el par de fotos de cada movimiento (posición inicial y final), las
 * reescala y las convierte a WebP, y reescribe src/data/demos.ts.
 *
 * Uso:
 *   npm i -D playwright && npx playwright install chromium
 *   node scripts/build-demos.mjs
 *
 * Chromium se usa solo para reescalar y convertir a WebP. Si ya tenés uno en
 * el sistema, podés evitar la descarga: CHROMIUM_PATH=/ruta/al/chrome node …
 *
 * Para sumar un movimiento nuevo, agregá su entrada a MAP con el nombre exacto
 * que tiene en el dataset y volvé a correr el script.
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_IMAGES = join(ROOT, 'public', 'demos')
const OUT_DATA = join(ROOT, 'src', 'data', 'demos.ts')
const CACHE = join(ROOT, 'node_modules', '.cache', 'forja-demos')

const DB_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json'
const IMG_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/'

/** id del catálogo → nombre exacto del ejercicio en free-exercise-db. */
const MAP = {
  flexiones: 'Pushups',
  'flexiones-inclinadas': 'Incline Push-Up',
  'flexiones-declinadas': 'Decline Push-Up',
  'press-banca': 'Barbell Bench Press - Medium Grip',
  'press-banca-mancuernas': 'Dumbbell Bench Press',
  'press-mancuernas-piso': 'Dumbbell Floor Press',
  'fondos-cajon': 'Bench Dips',
  'press-militar': 'Standing Military Press',
  'press-hombro-mancuernas': 'Standing Dumbbell Press',
  'push-press': 'Push Press',
  'handstand-hold': 'Handstand Push-Ups',
  'elevaciones-laterales': 'Side Lateral Raise',
  dominadas: 'Pullups',
  'dominadas-banda': 'Band Assisted Pull-Up',
  'chin-up': 'Chin-Up',
  'jalon-banda': 'Wide-Grip Lat Pulldown',
  'colgado-escapular': 'Scapular Pull-Up',
  'remo-mancuerna': 'One-Arm Dumbbell Row',
  'remo-barra': 'Bent Over Barbell Row',
  'remo-invertido': 'Inverted Row',
  'remo-renegado': 'Alternating Renegade Row',
  'face-pull-banda': 'Face Pull',
  'sentadilla-libre': 'Bodyweight Squat',
  'goblet-squat': 'Goblet Squat',
  'sentadilla-trasera': 'Barbell Full Squat',
  'sentadilla-frontal': 'Front Barbell Squat',
  thruster: 'Kettlebell Thruster',
  'peso-muerto': 'Barbell Deadlift',
  'peso-muerto-rumano-mancuernas': 'Stiff-Legged Dumbbell Deadlift',
  'peso-muerto-una-pierna': 'Kettlebell One-Legged Deadlift',
  'hip-thrust': 'Barbell Hip Thrust',
  'puente-gluteo': 'Butt Lift (Bridge)',
  'buenos-dias': 'Good Morning',
  'clean-mancuerna': 'Dumbbell Clean',
  'zancadas-caminando': 'Bodyweight Walking Lunge',
  'zancada-inversa': 'Dumbbell Rear Lunge',
  'step-up': 'Dumbbell Step Ups',
  plancha: 'Plank',
  'plancha-lateral': 'Side Bridge',
  'dead-bug': 'Dead Bug',
  'pallof-press': 'Pallof Press',
  'elevacion-piernas': 'Flat Bench Lying Leg Raise',
  'v-ups': 'Jackknife Sit-Up',
  'mountain-climbers': 'Mountain Climbers',
  'russian-twist': 'Russian Twist',
  'toes-to-bar': 'Hanging Leg Raise',
  'sit-up': 'Sit-Up',
  'farmer-carry': "Farmer's Walk",
  'sled-push': 'Sled Push',
  'sled-pull': 'Sled Drag - Harness',
  'box-jump': 'Front Box Jump',
  soga: 'Rope Jumping',
  'remo-erg': 'Rowing, Stationary',
  'bici-asalto': 'Bicycling, Stationary',
  trote: 'Running, Treadmill',
  'gato-camello': 'Cat Stretch',
  'estiramiento-mundial': 'Groiners',
  'estiramiento-isquios': 'Hamstring Stretch',
}

const WIDTH = 560
const QUALITY = 0.72

mkdirSync(OUT_IMAGES, { recursive: true })
mkdirSync(CACHE, { recursive: true })

// ------------------------------------------------------------- descarga

console.log('Bajando el índice de free-exercise-db…')
const db = await (await fetch(DB_URL)).json()
const byName = new Map(db.map((e) => [e.name, e]))

const pairs = []
const problems = []

for (const [id, name] of Object.entries(MAP)) {
  const ex = byName.get(name)
  if (!ex?.images || ex.images.length < 2) {
    problems.push(`${id}: no encontré dos fotos para "${name}"`)
    continue
  }
  const files = []
  for (let i = 0; i < 2; i++) {
    const cached = join(CACHE, `${id}-${i}.jpg`)
    if (!existsSync(cached)) {
      const res = await fetch(IMG_BASE + ex.images[i])
      if (!res.ok) {
        problems.push(`${id}: HTTP ${res.status} bajando ${ex.images[i]}`)
        break
      }
      writeFileSync(cached, Buffer.from(await res.arrayBuffer()))
    }
    files.push(cached)
  }
  if (files.length === 2) pairs.push({ id, name, files })
}

console.log(`Pares descargados: ${pairs.length} de ${Object.keys(MAP).length}`)
if (problems.length) console.warn('Problemas:\n  ' + problems.join('\n  '))

// ------------------------------------------------- compresión con Chromium

let chromium
try {
  ;({ chromium } = await import('playwright'))
} catch {
  console.error(
    '\nFalta playwright para comprimir las imágenes. Instalalo con:\n  npm i -D playwright\n',
  )
  process.exit(1)
}

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
)
const page = await browser.newPage()
await page.setContent('<html><body></body></html>')

let bytes = 0
for (const pair of pairs) {
  for (let i = 0; i < 2; i++) {
    const jpeg = readFileSync(pair.files[i])
    const webp = await page.evaluate(
      async ({ dataUrl, width, quality }) => {
        const img = new Image()
        img.src = dataUrl
        await img.decode()
        const scale = Math.min(1, width / img.naturalWidth)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.naturalWidth * scale)
        canvas.height = Math.round(img.naturalHeight * scale)
        const ctx = canvas.getContext('2d')
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        return canvas.toDataURL('image/webp', quality).split(',')[1]
      },
      { dataUrl: `data:image/jpeg;base64,${jpeg.toString('base64')}`, width: WIDTH, quality: QUALITY },
    )
    const out = join(OUT_IMAGES, `${pair.id}-${i}.webp`)
    writeFileSync(out, Buffer.from(webp, 'base64'))
    bytes += statSync(out).size
  }
}
await browser.close()

console.log(`Imágenes escritas en public/demos: ${(bytes / 1048576).toFixed(1)} MB`)

// ----------------------------------------------------------- src/data

const entries = pairs
  .map(({ id, name }) => {
    const key = /^[a-z][a-z0-9]*$/.test(id) ? id : `'${id}'`
    return `  ${key}: ${JSON.stringify(name)},`
  })
  .join('\n')

writeFileSync(
  OUT_DATA,
  `import { EXERCISES } from './exercises'

/**
 * Demostraciones que trae el catálogo: pares de fotos (posición inicial y
 * final) tomadas de free-exercise-db, un dataset de dominio público
 * (licencia Unlicense). Los archivos viven en public/demos y se sirven con la
 * app, así que funcionan sin conexión.
 *
 * Generado por scripts/build-demos.mjs — no lo edites a mano.
 */
export const CATALOG_DEMOS: Record<string, string> = {
${entries}
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
    start: \`./demos/\${exerciseId}-0.webp\`,
    end: \`./demos/\${exerciseId}-1.webp\`,
    source,
  }
}

export const DEMO_COUNT = Object.keys(CATALOG_DEMOS).length

/** Movimientos del catálogo que todavía no tienen demostración propia. */
export function exercisesWithoutDemo(): string[] {
  return EXERCISES.filter((e) => !CATALOG_DEMOS[e.id]).map((e) => e.id)
}
`,
)

console.log(`src/data/demos.ts actualizado con ${pairs.length} demostraciones.`)
