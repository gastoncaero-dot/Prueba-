const DAY_MS = 86_400_000

export const WEEKDAYS_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
export const WEEKDAYS_LONG = [
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
  'domingo',
]
export const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

/** Fecha ISO (YYYY-MM-DD) en horario local, no UTC. */
export function toISODate(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

export function today(): string {
  return toISODate()
}

export function addDays(iso: string, days: number): string {
  const d = fromISODate(iso)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

/** 0 = lunes … 6 = domingo. */
export function weekdayIndex(iso: string): number {
  return (fromISODate(iso).getDay() + 6) % 7
}

/** Lunes de la semana que contiene la fecha. */
export function startOfWeek(iso: string): string {
  return addDays(iso, -weekdayIndex(iso))
}

export function weekDates(mondayIso: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(mondayIso, i))
}

export function daysBetween(a: string, b: string): number {
  return Math.round((fromISODate(b).getTime() - fromISODate(a).getTime()) / DAY_MS)
}

/** "hoy", "mañana", "ayer" o el nombre del día. */
export function relativeDayLabel(iso: string, base = today()): string {
  const diff = daysBetween(base, iso)
  if (diff === 0) return 'hoy'
  if (diff === 1) return 'mañana'
  if (diff === -1) return 'ayer'
  return WEEKDAYS_LONG[weekdayIndex(iso)]
}

/** "martes 30 de julio" */
export function formatLongDate(iso: string): string {
  const d = fromISODate(iso)
  return `${WEEKDAYS_LONG[weekdayIndex(iso)]} ${d.getDate()} de ${MONTHS[d.getMonth()]}`
}

/** "30 jul" */
export function formatShortDate(iso: string): string {
  const d = fromISODate(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`
}

export function formatMonthYear(iso: string): string {
  const d = fromISODate(iso)
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/** Segundos a "m:ss" o "h:mm:ss". */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${m}:${String(sec).padStart(2, '0')}`
}

/** Segundos a texto corto: "45 s", "12 min", "1 h 5 min". */
export function formatDuration(totalSeconds: number): string {
  const s = Math.round(totalSeconds)
  if (s < 60) return `${s} s`
  const m = Math.round(s / 60)
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const rest = m % 60
  return rest ? `${h} h ${rest} min` : `${h} h`
}

/** "hace 3 días", "hace 2 semanas". */
export function timeAgo(iso: string, base = today()): string {
  const diff = daysBetween(iso, base)
  if (diff <= 0) return 'hoy'
  if (diff === 1) return 'ayer'
  if (diff < 7) return `hace ${diff} días`
  const weeks = Math.floor(diff / 7)
  if (weeks < 5) return `hace ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`
  const months = Math.floor(diff / 30)
  return `hace ${months} ${months === 1 ? 'mes' : 'meses'}`
}

/** Minutos desde medianoche, para ordenar horarios "HH:MM". */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}
