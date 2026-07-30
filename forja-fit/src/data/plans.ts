import type { Plan, PlanWeek } from '../types'

type WeekSpec = {
  focus: string
  note?: string
  /** Reemplaza la plantilla semanal para esa semana puntual (deload, test, etc.). */
  days?: (string | null)[]
}

function buildWeeks(template: (string | null)[], specs: WeekSpec[]): PlanWeek[] {
  return specs.map((spec) => {
    const source = spec.days ?? template
    return {
      focus: spec.focus,
      note: spec.note,
      days: source.map((workoutId, day) => ({
        day,
        workoutId: workoutId ?? undefined,
        label: workoutId ? undefined : 'Descanso',
      })),
    }
  })
}

/**
 * Planes de varias semanas. Cada plan define una plantilla semanal
 * (lunes a domingo) y las semanas van cambiando el foco y la carga.
 */
export const PLANS: Plan[] = [
  {
    id: 'plan-arranque',
    name: 'Arranque — 4 semanas',
    goal: 'Empezar a entrenar con constancia',
    level: 'principiante',
    daysPerWeek: 3,
    places: ['sede', 'casa'],
    equipment: ['mancuernas', 'colchoneta'],
    description:
      'Tres días por semana con los patrones básicos, sumando volumen de a poco. La meta acá es la adherencia, no el rendimiento.',
    weeks: buildWeeks(
      ['fza-full-body', null, 'func-casa-express', null, 'lower-casa', null, 'mov-completa'],
      [
        { focus: 'Aprender los movimientos', note: 'Cargas livianas. Priorizá técnica sobre kilos.' },
        { focus: 'Sumar un poco de carga', note: 'Si las series salen cómodas, subí 1-2 kg.' },
        { focus: 'Primer pico de volumen', note: 'Agregá una serie extra al bloque principal.' },
        {
          focus: 'Semana suave y test',
          note: 'Bajá el volumen a la mitad y probá cuántas flexiones te salen seguidas.',
          days: ['fza-full-body', null, 'mov-post-entreno', null, 'func-casa-express', null, null],
        },
      ],
    ),
  },
  {
    id: 'plan-fuerza-8',
    name: 'Fuerza — 8 semanas',
    goal: 'Subir sentadilla, peso muerto y press',
    level: 'intermedio',
    daysPerWeek: 4,
    places: ['sede'],
    equipment: ['barra', 'mancuernas', 'banco', 'aro'],
    description:
      'Bloque de fuerza clásico de cuatro días: dos de tren inferior y dos de tren superior, con progresión lineal y una semana de descarga al final de cada mes.',
    weeks: buildWeeks(
      ['fza-sentadilla', 'fza-press', null, 'fza-peso-muerto', 'upper-tirones', null, 'mov-completa'],
      [
        { focus: 'Base — RPE 7', note: 'Arrancá conservador: dejá 3 repeticiones en el tanque.' },
        { focus: 'Acumulación — RPE 7.5', note: 'Subí 2,5 kg en los principales.' },
        { focus: 'Acumulación — RPE 8', note: 'Última serie exigente pero limpia.' },
        {
          focus: 'Descarga',
          note: 'Mismas cargas, la mitad de las series.',
          days: ['fza-full-body', 'upper-completo', null, 'mov-completa', null, null, null],
        },
        { focus: 'Intensificación — RPE 8', note: 'Bajá a 4 repeticiones por serie y subí la carga.' },
        { focus: 'Intensificación — RPE 8.5', note: 'Series de 3. Cuidá la técnica en la fatiga.' },
        { focus: 'Pico', note: 'Series de 2-3 cerca del máximo. Descansos completos.' },
        {
          focus: 'Test de fuerza',
          note: 'Probá un máximo de 3 repeticiones en sentadilla, banca y peso muerto.',
          days: ['fza-sentadilla', null, 'fza-press', null, 'fza-peso-muerto', null, null],
        },
      ],
    ),
  },
  {
    id: 'plan-recomposicion',
    name: 'Recomposición — 6 semanas',
    goal: 'Bajar grasa manteniendo fuerza',
    level: 'intermedio',
    daysPerWeek: 5,
    places: ['sede', 'casa'],
    equipment: ['mancuernas', 'kettlebell', 'cajon', 'colchoneta'],
    description:
      'Cinco días combinando fuerza, funcional y cardio de base. Mucho gasto calórico sin resignar trabajo con carga.',
    weeks: buildWeeks(
      [
        'fza-full-body',
        'func-forja-total',
        'cardio-base',
        'lower-piernas-gluteos',
        'func-motor',
        null,
        'mov-post-entreno',
      ],
      [
        { focus: 'Adaptación', note: 'Ritmo cómodo en los metcon: la idea es terminar entero.' },
        { focus: 'Sumar densidad', note: 'Mismos entrenamientos, menos descanso entre bloques.' },
        { focus: 'Volumen alto', note: 'Agregá 5 minutos al trabajo de cardio.' },
        { focus: 'Semana intensa', note: 'Buscá superar tu marca en los AMRAP.' },
        {
          focus: 'Descarga activa',
          note: 'Bajá la intensidad: entrenar liviano también es entrenar.',
          days: ['fza-full-body', null, 'cardio-base', null, 'pil-mat-esencial', null, 'mov-completa'],
        },
        { focus: 'Cierre y medición', note: 'Registrá peso y medidas al final de la semana.' },
      ],
    ),
  },
  {
    id: 'plan-hyrox',
    name: 'Hyrox — 8 semanas',
    goal: 'Llegar preparado a una carrera de formato Hyrox',
    level: 'avanzado',
    daysPerWeek: 5,
    places: ['sede', 'outdoor'],
    equipment: ['sled', 'remo', 'ski', 'mancuernas', 'sandbag', 'balon'],
    description:
      'Preparación específica: dos sesiones de carrera, dos de estaciones con carga y una de fuerza, con simulacros cada tres semanas.',
    weeks: buildWeeks(
      ['hyrox-run', 'fza-sentadilla', 'hyrox-estaciones', null, 'hyrox-compromiso', 'cardio-base', null],
      [
        { focus: 'Base aeróbica', note: 'Corré cómodo: todavía no es momento de forzar.' },
        { focus: 'Fuerza específica', note: 'Subí la carga del trineo.' },
        {
          focus: 'Primer simulacro',
          note: 'Anotá el tiempo total y el de cada estación.',
          days: ['hyrox-run', 'fza-sentadilla', null, 'hyrox-simulacro', null, 'mov-post-entreno', null],
        },
        { focus: 'Compromiso de piernas', note: 'Foco en zancadas con carga y wall balls.' },
        { focus: 'Transiciones', note: 'Cronometrá cada pasaje de estación.' },
        {
          focus: 'Segundo simulacro',
          note: 'Compará con la semana 3: deberías bajar el tiempo.',
          days: ['hyrox-run', 'hyrox-compromiso', null, 'hyrox-simulacro', null, 'cardio-base', null],
        },
        { focus: 'Pico de intensidad', note: 'Última semana dura antes de aflojar.' },
        {
          focus: 'Puesta a punto',
          note: 'Volumen bajo, intensidad alta y corta. Llegá descansado.',
          days: ['hyrox-run', null, 'hyrox-estaciones', null, 'mov-post-entreno', null, null],
        },
      ],
    ),
  },
  {
    id: 'plan-casa',
    name: 'Solo en casa — 4 semanas',
    goal: 'Entrenar sin gimnasio ni equipamiento',
    level: 'principiante',
    daysPerWeek: 4,
    places: ['casa', 'online'],
    equipment: ['ninguno', 'colchoneta', 'banda'],
    description:
      'Cuatro semanas sin salir de casa: circuitos de peso corporal, banda elástica y trabajo de core y movilidad.',
    weeks: buildWeeks(
      ['func-casa-express', 'upper-casa-banda', null, 'lower-casa', 'core-express', null, 'mov-manana'],
      [
        { focus: 'Volver al movimiento', note: 'Tomate los descansos completos entre rondas.' },
        { focus: 'Más rondas', note: 'Sumá una ronda a los circuitos.' },
        { focus: 'Más densidad', note: 'Bajá el descanso a 45 segundos.' },
        {
          focus: 'Semana test',
          note: 'Cronometrá el circuito completo y anotá la marca.',
          days: ['func-casa-express', null, 'cardio-tabata', null, 'lower-casa', null, 'mov-completa'],
        },
      ],
    ),
  },
  {
    id: 'plan-espalda',
    name: 'Espalda y postura — 4 semanas',
    goal: 'Menos molestias de espalda y mejor postura',
    level: 'principiante',
    daysPerWeek: 3,
    places: ['casa', 'sede', 'online'],
    equipment: ['colchoneta', 'banda'],
    description:
      'Plan de bajo impacto para días de mucha silla: movilidad de columna, activación de glúteo y fortalecimiento de espalda alta.',
    weeks: buildWeeks(
      ['pil-espalda-sana', null, 'mov-completa', null, 'core-anti', null, 'mov-manana'],
      [
        { focus: 'Movilizar', note: 'Sin dolor: buscá rango, no intensidad.' },
        { focus: 'Activar', note: 'Sumá una serie a los ejercicios de glúteo y espalda.' },
        { focus: 'Fortalecer', note: 'Sostené las isometrías 10 segundos más.' },
        { focus: 'Integrar', note: 'Agregá la secuencia de la mañana todos los días.' },
      ],
    ),
  },
]

const PLAN_BY_ID = new Map(PLANS.map((p) => [p.id, p]))

export function getPlan(id: string): Plan | undefined {
  return PLAN_BY_ID.get(id)
}
