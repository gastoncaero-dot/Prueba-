import { useState } from 'react'
import { formatShortDate } from '../lib/dates'

/**
 * Gráficos simples hechos a mano: una sola serie por gráfico, un solo tono y
 * etiquetas directas donde importa. El color de modalidad se usa solo como
 * punto de identidad, nunca como única forma de leer el dato.
 */

interface BarDatum {
  label: string
  value: number
  /** Texto del tooltip. */
  detail?: string
  /** Marca la barra actual (semana en curso, por ejemplo). */
  current?: boolean
}

export function BarChart({
  data,
  height = 132,
  unit = '',
  goal,
}: {
  data: BarDatum[]
  height?: number
  unit?: string
  /** Línea de referencia horizontal (objetivo semanal). */
  goal?: number
}) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(1, ...data.map((d) => d.value), goal ?? 0)
  const best = data.reduce((acc, d, i) => (d.value > data[acc].value ? i : acc), 0)

  return (
    <div className="relative">
      {goal ? (
        <div
          className="pointer-events-none absolute inset-x-0 border-t border-dashed border-line"
          style={{ bottom: `${(goal / max) * height + 22}px` }}
        >
          <span className="absolute -top-4 right-0 text-[10px] text-faint">meta {goal}</span>
        </div>
      ) : null}

      <div className="flex items-end gap-1.5" style={{ height: height + 22 }}>
        {data.map((d, i) => {
          const barHeight = Math.max(d.value > 0 ? 4 : 2, (d.value / max) * height)
          const showLabel = i === best || i === data.length - 1
          return (
            <button
              key={`${d.label}-${i}`}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              onClick={() => setHover(hover === i ? null : i)}
              className="group flex flex-1 flex-col items-center justify-end gap-1"
              style={{ height: height + 22 }}
              aria-label={`${d.label}: ${d.value} ${unit}`}
            >
              {showLabel && d.value > 0 && (
                <span className="tnum text-[10px] font-bold text-muted">{d.value}</span>
              )}
              <span
                className="w-full rounded-t-[4px] transition-colors"
                style={{
                  height: barHeight,
                  background:
                    d.value === 0
                      ? 'var(--c-surface-3)'
                      : d.current || hover === i
                        ? 'var(--c-accent)'
                        : 'color-mix(in oklab, var(--c-accent) 55%, var(--c-surface-3))',
                }}
              />
              <span className="text-[9px] whitespace-nowrap text-faint">{d.label}</span>
            </button>
          )
        })}
      </div>

      {hover !== null && data[hover] && (
        <div className="mt-2 rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-[12px]">
          <span className="font-semibold">{data[hover].label}</span>
          <span className="text-muted">
            {' — '}
            {data[hover].detail ?? `${data[hover].value} ${unit}`}
          </span>
        </div>
      )}
    </div>
  )
}

export function RankedBars({
  items,
}: {
  items: { label: string; value: number; color?: string; suffix?: string }[]
}) {
  const max = Math.max(1, ...items.map((i) => i.value))
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2.5">
          {item.color && (
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: item.color }}
              aria-hidden="true"
            />
          )}
          <span className="w-24 shrink-0 truncate text-[12px] font-semibold">{item.label}</span>
          <span className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-3">
            <span
              className="block h-full rounded-full bg-accent"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </span>
          <span className="tnum w-10 shrink-0 text-right text-[12px] text-muted">
            {item.value}
            {item.suffix ?? ''}
          </span>
        </li>
      ))}
    </ul>
  )
}

export function LineChart({
  points,
  unit = 'kg',
}: {
  points: { date: string; value: number }[]
  unit?: string
}) {
  const [hover, setHover] = useState<number | null>(null)
  if (points.length < 2) {
    return (
      <p className="py-6 text-center text-[13px] text-muted">
        Necesitás al menos dos registros para ver la progresión.
      </p>
    )
  }

  const W = 320
  const H = 120
  const pad = { top: 12, right: 10, bottom: 20, left: 28 }
  const values = points.map((p) => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const x = (i: number) => pad.left + (i / (points.length - 1)) * (W - pad.left - pad.right)
  const y = (v: number) => pad.top + (1 - (v - min) / span) * (H - pad.top - pad.bottom)

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p.value)}`).join(' ')
  const active = hover ?? points.length - 1

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Progresión de carga">
        <line
          x1={pad.left}
          x2={W - pad.right}
          y1={H - pad.bottom}
          y2={H - pad.bottom}
          stroke="var(--c-line)"
          strokeWidth="1"
        />
        <text x="2" y={pad.top + 4} fontSize="8" fill="var(--c-faint)">
          {max}
        </text>
        <text x="2" y={H - pad.bottom} fontSize="8" fill="var(--c-faint)">
          {min}
        </text>
        <path d={path} fill="none" stroke="var(--c-accent)" strokeWidth="2" strokeLinejoin="round" />
        {points.map((p, i) => (
          <g key={p.date}>
            <circle
              cx={x(i)}
              cy={y(p.value)}
              r={i === active ? 5 : 3.5}
              fill="var(--c-accent)"
              stroke="var(--c-surface)"
              strokeWidth="2"
            />
            <rect
              x={x(i) - 10}
              y={0}
              width={20}
              height={H}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onClick={() => setHover(i)}
            />
          </g>
        ))}
      </svg>
      <p className="mt-1 text-center text-[12px] text-muted">
        <span className="font-semibold text-ink">
          {points[active].value} {unit}
        </span>{' '}
        · {formatShortDate(points[active].date)}
      </p>
    </div>
  )
}

export function Heatmap({
  days,
  counts,
}: {
  /** Fechas ISO ordenadas, de la más vieja a hoy (múltiplo de 7). */
  days: string[]
  counts: Map<string, number>
}) {
  const [hover, setHover] = useState<string | null>(null)
  const weeks: string[][] = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))

  const shade = (count: number) => {
    if (!count) return 'var(--c-surface-3)'
    if (count === 1) return 'color-mix(in oklab, var(--c-accent) 55%, var(--c-surface-3))'
    return 'var(--c-accent)'
  }

  return (
    <div>
      <div className="no-scrollbar flex gap-1 overflow-x-auto pb-1">
        {weeks.map((week) => (
          <div key={week[0]} className="flex flex-col gap-1">
            {week.map((day) => {
              const count = counts.get(day) ?? 0
              return (
                <button
                  key={day}
                  onMouseEnter={() => setHover(day)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => setHover(hover === day ? null : day)}
                  title={`${day}: ${count} ${count === 1 ? 'sesión' : 'sesiones'}`}
                  aria-label={`${day}: ${count} sesiones`}
                  className="h-3.5 w-3.5 rounded-[3px] transition-transform hover:scale-125"
                  style={{ background: shade(count) }}
                />
              )
            })}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-faint">
        <span>{hover ? `${formatShortDate(hover)}: ${counts.get(hover) ?? 0} sesiones` : 'Últimas 12 semanas'}</span>
        <span className="flex items-center gap-1">
          menos
          <span className="h-2.5 w-2.5 rounded-[2px]" style={{ background: shade(0) }} />
          <span className="h-2.5 w-2.5 rounded-[2px]" style={{ background: shade(1) }} />
          <span className="h-2.5 w-2.5 rounded-[2px]" style={{ background: shade(2) }} />
          más
        </span>
      </div>
    </div>
  )
}
