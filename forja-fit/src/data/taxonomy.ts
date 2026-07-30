import type {
  BlockFormat,
  BlockKind,
  Equipment,
  Level,
  Modality,
  Muscle,
  Pattern,
  Place,
} from '../types'

export interface ModalityMeta {
  id: Modality
  label: string
  color: string
  blurb: string
}

export const MODALITIES: ModalityMeta[] = [
  {
    id: 'funcional',
    label: 'Funcional',
    color: '#c7f634',
    blurb: 'Clase completa: fuerza, potencia y trabajo aeróbico en bloques.',
  },
  {
    id: 'fuerza',
    label: 'Fuerza',
    color: '#ff5c39',
    blurb: 'Series pesadas con descansos largos sobre los patrones básicos.',
  },
  {
    id: 'hyrox',
    label: 'Hyrox',
    color: '#ffc53d',
    blurb: 'Correr + estaciones. Ritmo sostenido y transiciones limpias.',
  },
  {
    id: 'upper',
    label: 'Upper Body',
    color: '#38bdf8',
    blurb: 'Empujes y tracciones para pecho, espalda, hombros y brazos.',
  },
  {
    id: 'lower',
    label: 'Lower Body',
    color: '#34d399',
    blurb: 'Sentadilla, bisagra y zancada: piernas y glúteos.',
  },
  {
    id: 'pilates',
    label: 'Pilates',
    color: '#a78bfa',
    blurb: 'Control, respiración y centro. Bajo impacto, mucha precisión.',
  },
  {
    id: 'cardio',
    label: 'Cardio',
    color: '#f472b6',
    blurb: 'Intervalos y trabajo continuo para la base aeróbica.',
  },
  {
    id: 'core',
    label: 'Core',
    color: '#fb923c',
    blurb: 'Abdomen, lumbares y estabilidad: anti-extensión y anti-rotación.',
  },
  {
    id: 'movilidad',
    label: 'Movilidad',
    color: '#22d3ee',
    blurb: 'Rango de movimiento, respiración y recuperación activa.',
  },
]

const MODALITY_MAP = new Map(MODALITIES.map((m) => [m.id, m]))

export function modality(id: Modality): ModalityMeta {
  return MODALITY_MAP.get(id) ?? MODALITIES[0]
}

export const PLACE_LABEL: Record<Place, string> = {
  sede: 'En la sede',
  casa: 'En casa',
  outdoor: 'Outdoor',
  online: 'Online',
}

export const LEVEL_LABEL: Record<Level, string> = {
  principiante: 'Principiante',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
}

export const EQUIPMENT_LABEL: Record<Equipment, string> = {
  ninguno: 'Sin equipamiento',
  mancuernas: 'Mancuernas',
  kettlebell: 'Kettlebell',
  barra: 'Barra y discos',
  banda: 'Banda elástica',
  trx: 'TRX / anillas',
  cajon: 'Cajón',
  soga: 'Soga',
  remo: 'Remo ergómetro',
  bici: 'Bici / asalto',
  ski: 'Ski erg',
  balon: 'Balón (wall ball)',
  sled: 'Trineo',
  sandbag: 'Bolsa de arena',
  colchoneta: 'Colchoneta',
  banco: 'Banco',
  aro: 'Aro / step',
}

/** Equipamiento que se puede elegir en el perfil (orden de la lista). */
export const EQUIPMENT_CHOICES: Equipment[] = [
  'mancuernas',
  'kettlebell',
  'barra',
  'banda',
  'trx',
  'cajon',
  'soga',
  'balon',
  'colchoneta',
  'banco',
  'remo',
  'bici',
  'ski',
  'sled',
  'sandbag',
]

export const MUSCLE_LABEL: Record<Muscle, string> = {
  pecho: 'Pecho',
  espalda: 'Espalda',
  dorsales: 'Dorsales',
  hombros: 'Hombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  antebrazos: 'Antebrazos',
  cuadriceps: 'Cuádriceps',
  isquios: 'Isquiotibiales',
  gluteos: 'Glúteos',
  aductores: 'Aductores',
  gemelos: 'Gemelos',
  core: 'Core',
  lumbares: 'Lumbares',
  cardiovascular: 'Cardiovascular',
  'cuerpo-completo': 'Cuerpo completo',
}

export const PATTERN_LABEL: Record<Pattern, string> = {
  'empuje-horizontal': 'Empuje horizontal',
  'empuje-vertical': 'Empuje vertical',
  'traccion-horizontal': 'Tracción horizontal',
  'traccion-vertical': 'Tracción vertical',
  sentadilla: 'Sentadilla',
  bisagra: 'Bisagra de cadera',
  zancada: 'Zancada',
  'core-antiextension': 'Core anti-extensión',
  'core-antirotacion': 'Core anti-rotación',
  'core-flexion': 'Core flexión',
  transporte: 'Transporte de carga',
  locomocion: 'Locomoción',
  salto: 'Salto',
  monoestructural: 'Monoestructural',
  movilidad: 'Movilidad',
}

export const BLOCK_KIND_LABEL: Record<BlockKind, string> = {
  calentamiento: 'Calentamiento',
  fuerza: 'Fuerza',
  metcon: 'Metcon',
  accesorio: 'Accesorio',
  core: 'Core',
  finisher: 'Finisher',
  movilidad: 'Movilidad',
}

export const FORMAT_LABEL: Record<BlockFormat, string> = {
  series: 'Series',
  amrap: 'AMRAP',
  emom: 'EMOM',
  tabata: 'Tabata',
  'for-time': 'For time',
  intervalos: 'Intervalos',
  circuito: 'Circuito',
  libre: 'Libre',
}

/** Explicación corta de cada formato, para mostrar en la sesión. */
export const FORMAT_HELP: Record<BlockFormat, string> = {
  series: 'Series y repeticiones. Descansá lo indicado entre series.',
  amrap: 'Tantas rondas como puedas dentro del tiempo. Ritmo constante.',
  emom: 'Cada minuto arrancás el trabajo indicado; el resto del minuto descansás.',
  tabata: 'Intervalos cortos de trabajo máximo con descanso incompleto.',
  'for-time': 'Completá todo el trabajo lo más rápido posible, con buena técnica.',
  intervalos: 'Trabajo y descanso pautados por rondas.',
  circuito: 'Estaciones seguidas sin pausa; descansás al final de la ronda.',
  libre: 'Sin cronómetro: seguí las indicaciones del bloque.',
}

export const VENUES: { name: string; place: Place }[] = [
  { name: 'Sede Centro', place: 'sede' },
  { name: 'Sede Norte', place: 'sede' },
  { name: 'Sede Sur', place: 'sede' },
  { name: 'Online (videollamada)', place: 'online' },
  { name: 'En casa', place: 'casa' },
  { name: 'Parque', place: 'outdoor' },
]

export const COACHES = [
  'Nico',
  'Vale',
  'Juli',
  'Mati',
  'Flor',
  'Santi',
  'Caro',
  'Lu',
  'Fede',
  'Aye',
]
