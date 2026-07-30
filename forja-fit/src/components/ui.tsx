import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { modality as modalityMeta } from '../data/taxonomy'
import type { Modality } from '../types'

// ------------------------------------------------------------------ botón

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'

const BUTTON_STYLES: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-ink hover:brightness-110 active:brightness-95',
  secondary: 'bg-surface-3 text-ink hover:bg-surface-2 border border-line',
  outline: 'border border-line text-ink hover:bg-surface-2',
  ghost: 'text-muted hover:text-ink hover:bg-surface-2',
  danger: 'bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25',
}

export function Button({
  variant = 'primary',
  size = 'md',
  full,
  className = '',
  children,
  ...rest
}: {
  variant?: ButtonVariant
  size?: 'sm' | 'md' | 'lg'
  full?: boolean
  className?: string
  children: ReactNode
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const sizes = {
    sm: 'h-9 px-3 text-[13px] rounded-lg gap-1.5',
    md: 'h-11 px-4 text-sm rounded-xl gap-2',
    lg: 'h-14 px-6 text-base rounded-2xl gap-2',
  }
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center font-semibold transition-[filter,background-color,color] disabled:opacity-40 disabled:pointer-events-none ${sizes[size]} ${BUTTON_STYLES[variant]} ${full ? 'w-full' : ''} ${className}`}
    >
      {children}
    </button>
  )
}

// -------------------------------------------------------------------- chip

export function Chip({
  active,
  children,
  onClick,
  color,
}: {
  active?: boolean
  children: ReactNode
  onClick?: () => void
  color?: string
}) {
  return (
    <button
      onClick={onClick}
      style={active && color ? { background: color, borderColor: color, color: '#08090b' } : undefined}
      className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-colors ${
        active
          ? 'border-accent bg-accent text-accent-ink'
          : 'border-line bg-surface text-muted hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}

export function Tag({ children, color }: { children: ReactNode; color?: string }) {
  return (
    <span
      style={color ? { color, borderColor: `${color}55`, background: `${color}14` } : undefined}
      className="inline-flex items-center gap-1 rounded-md border border-line bg-surface-2 px-2 py-0.5 text-[11px] font-semibold text-muted"
    >
      {children}
    </span>
  )
}

export function ModalityTag({ id }: { id: Modality }) {
  const meta = modalityMeta(id)
  return <Tag color={meta.color}>{meta.label}</Tag>
}

// -------------------------------------------------------------- segmentado

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="no-scrollbar flex gap-1 overflow-x-auto rounded-xl border border-line bg-surface p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`flex-1 shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors ${
            value === o.value ? 'bg-surface-3 text-ink' : 'text-muted hover:text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// ------------------------------------------------------------------ layout

export function SectionHeader({
  title,
  hint,
  action,
}: {
  title: string
  hint?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <h2 className="display text-[17px] leading-tight">{title}</h2>
        {hint && <p className="text-[13px] text-muted">{hint}</p>}
      </div>
      {action}
    </div>
  )
}

export function Stat({
  label,
  value,
  unit,
  hint,
}: {
  label: string
  value: ReactNode
  unit?: string
  hint?: string
}) {
  return (
    <div className="card px-3 py-3">
      <p className="overline text-faint">{label}</p>
      <p className="display tnum mt-1 text-2xl leading-none">
        {value}
        {unit && <span className="ml-1 text-xs font-semibold text-muted">{unit}</span>}
      </p>
      {hint && <p className="mt-1 text-[11px] text-faint">{hint}</p>}
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon?: ReactNode
  title: string
  text?: string
  action?: ReactNode
}) {
  return (
    <div className="card flex flex-col items-center px-6 py-10 text-center">
      {icon && <div className="mb-3 text-faint">{icon}</div>}
      <p className="display text-base">{title}</p>
      {text && <p className="mx-auto mt-1 max-w-xs text-[13px] text-muted">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Progress({ value, max, color }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${pct}%`, background: color ?? 'var(--c-accent)' }}
      />
    </div>
  )
}

export function Ring({
  value,
  max,
  size = 64,
  thickness = 6,
  color,
  children,
}: {
  value: number
  max: number
  size?: number
  thickness?: number
  color?: string
  children?: ReactNode
}) {
  const pct = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0
  const r = (size - thickness) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--c-surface-3)"
          strokeWidth={thickness}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color ?? 'var(--c-accent)'}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  )
}

// ------------------------------------------------------------------- sheet

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <div className="animate-in safe-bottom relative z-10 max-h-[88vh] w-full overflow-y-auto rounded-t-2xl border border-line bg-bg-elev sm:max-w-lg sm:rounded-2xl">
        <div className="sticky top-0 flex items-center justify-between gap-3 border-b border-line bg-bg-elev px-4 py-3">
          <h3 className="display text-base">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-ink"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-4 py-4">{children}</div>
      </div>
    </div>
  )
}

// ------------------------------------------------------------- formularios

/** Etiqueta + un único control (input, select, textarea). */
export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="overline text-faint">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="mt-1 text-[11px] text-faint">{hint}</p>}
    </label>
  )
}

/**
 * Igual que Field pero para grupos de botones (chips): no usa <label>, que
 * le robaría el nombre accesible a cada botón del grupo.
 */
export function FieldGroup({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div role="group" aria-label={label}>
      <span className="overline text-faint">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="mt-1 text-[11px] text-faint">{hint}</p>}
    </div>
  )
}

const inputClass =
  'w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm outline-none placeholder:text-faint focus:border-accent/60'

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${props.className ?? ''}`} />
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputClass} min-h-20 resize-y ${props.className ?? ''}`} />
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputClass} appearance-none ${props.className ?? ''}`} />
}

export function Switch({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
  hint?: string
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 py-2 text-left"
    >
      <span>
        <span className="text-sm font-semibold">{label}</span>
        {hint && <span className="block text-[12px] text-muted">{hint}</span>}
      </span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-surface-3'}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-[left] ${checked ? 'left-[22px]' : 'left-0.5'}`}
        />
      </span>
    </button>
  )
}
