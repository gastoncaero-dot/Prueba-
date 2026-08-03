import { Activity, CalendarDays, Dumbbell, Home, Moon, Play, Sun, TrendingUp, User } from 'lucide-react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { getWorkout } from '../data/workouts'
import { formatLongDate, today } from '../lib/dates'
import { useStore } from '../lib/store'

const TABS = [
  { to: '/', label: 'Hoy', icon: Home },
  { to: '/programacion', label: 'Programa', icon: CalendarDays },
  { to: '/rutinas', label: 'Rutinas', icon: Dumbbell },
  { to: '/ejercicios', label: 'Ejercicios', icon: Activity },
  { to: '/progreso', label: 'Progreso', icon: TrendingUp },
]

export function Logo({ size = 18 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
        <g fill="var(--c-accent)">
          <rect x="8" y="38" width="12" height="16" rx="3" />
          <rect x="26" y="26" width="12" height="28" rx="3" />
          <rect x="44" y="10" width="12" height="44" rx="3" />
        </g>
      </svg>
      <span className="display text-[15px] tracking-[0.14em] uppercase">Forja</span>
    </span>
  )
}

function ResumeBar() {
  const draft = useStore((s) => s.draft)
  const navigate = useNavigate()
  const location = useLocation()
  if (!draft || location.pathname.startsWith('/sesion')) return null
  const workout = getWorkout(draft.workoutId)
  return (
    <button
      onClick={() => navigate(`/sesion/${draft.workoutId}`)}
      className="fixed inset-x-0 bottom-[68px] z-30 mx-auto flex max-w-2xl items-center gap-3 border-y border-accent/30 bg-accent/12 px-4 py-2.5 backdrop-blur-md sm:bottom-[76px] sm:rounded-xl sm:border"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-ink">
        <Play size={14} fill="currentColor" />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-[11px] font-bold tracking-wider text-accent uppercase">
          Sesión en curso
        </span>
        <span className="block truncate text-[13px] font-semibold">
          {workout?.name ?? 'Entrenamiento'}
        </span>
      </span>
      <span className="text-[12px] font-semibold text-accent">Continuar</span>
    </button>
  )
}

export function Layout() {
  const profile = useStore((s) => s.profile)
  const setTheme = useStore((s) => s.setTheme)
  const navigate = useNavigate()

  return (
    <div className="min-h-dvh bg-bg">
      <header className="sticky top-0 z-40 border-b border-line-soft bg-bg/85 backdrop-blur-lg">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <div>
            <Logo />
            <p className="mt-0.5 text-[11px] text-faint first-letter:uppercase">
              {formatLongDate(today())}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setTheme(profile.theme === 'dark' ? 'light' : 'dark')}
              className="rounded-xl p-2.5 text-muted hover:bg-surface-2 hover:text-ink"
              aria-label="Cambiar tema"
            >
              {profile.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={() => navigate('/perfil')}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface-2 text-[13px] font-bold"
              aria-label="Perfil"
            >
              {profile.name ? profile.name.trim().charAt(0).toUpperCase() : <User size={16} />}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-4 pb-32">
        <Outlet />
      </main>

      <ResumeBar />

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 backdrop-blur-lg">
        <div className="mx-auto flex max-w-2xl items-stretch justify-around px-2">
          {TABS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors ${
                  isActive ? 'text-accent' : 'text-faint hover:text-muted'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={20} strokeWidth={isActive ? 2.4 : 1.8} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
