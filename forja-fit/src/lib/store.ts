import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  ActivePlan,
  Goal,
  LoggedSet,
  Measurement,
  Place,
  Profile,
  SessionLog,
} from '../types'
import { today } from './dates'

export interface SessionDraft {
  workoutId: string
  date: string
  startedAt: string
  place: Place
  blockIndex: number
  sets: LoggedSet[]
  score?: string
  notes?: string
  rpe?: number
  /** Segundos acumulados de trabajo (se congela al salir de la sesión). */
  elapsedSec: number
  /** Marca de tiempo del último "reanudar", para contar el tiempo corriendo. */
  runningSince?: number
}

const DEFAULT_PROFILE: Profile = {
  name: '',
  goalText: '',
  level: 'principiante',
  daysPerWeek: 3,
  equipment: ['mancuernas', 'colchoneta'],
  homeOnly: false,
  units: 'kg',
  theme: 'dark',
  sound: true,
  vibration: true,
  onboarded: false,
  createdAt: new Date().toISOString(),
}

export interface ForjaState {
  profile: Profile
  /** exerciseId → URL del video que cargaste. */
  videos: Record<string, string>
  history: SessionLog[]
  goals: Goal[]
  measurements: Measurement[]
  activePlan?: ActivePlan
  favoriteWorkouts: string[]
  favoriteExercises: string[]
  draft?: SessionDraft

  updateProfile: (patch: Partial<Profile>) => void
  setTheme: (theme: 'dark' | 'light') => void

  setVideo: (exerciseId: string, url: string) => void
  clearVideo: (exerciseId: string) => void
  importVideos: (map: Record<string, string>) => number

  startSession: (draft: SessionDraft) => void
  updateDraft: (patch: Partial<SessionDraft>) => void
  upsertSet: (set: LoggedSet) => void
  discardDraft: () => void
  finishSession: (log: SessionLog) => void
  deleteSession: (id: string) => void

  addGoal: (goal: Goal) => void
  updateGoal: (id: string, patch: Partial<Goal>) => void
  removeGoal: (id: string) => void

  addMeasurement: (m: Measurement) => void
  removeMeasurement: (id: string) => void

  setActivePlan: (plan: ActivePlan | undefined) => void

  toggleFavoriteWorkout: (id: string) => void
  toggleFavoriteExercise: (id: string) => void

  replaceAll: (data: Partial<ForjaState>) => void
  resetAll: () => void
}

const STORAGE_KEY = 'forja-fit-v1'

export const useStore = create<ForjaState>()(
  persist(
    (set) => ({
      profile: DEFAULT_PROFILE,
      videos: {},
      history: [],
      goals: [],
      measurements: [],
      favoriteWorkouts: [],
      favoriteExercises: [],

      updateProfile: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),
      setTheme: (theme) => set((s) => ({ profile: { ...s.profile, theme } })),

      setVideo: (exerciseId, url) =>
        set((s) => ({ videos: { ...s.videos, [exerciseId]: url.trim() } })),
      clearVideo: (exerciseId) =>
        set((s) => {
          const next = { ...s.videos }
          delete next[exerciseId]
          return { videos: next }
        }),
      importVideos: (map) => {
        const entries = Object.entries(map).filter(
          ([id, url]) => typeof id === 'string' && typeof url === 'string' && url.trim(),
        )
        set((s) => ({ videos: { ...s.videos, ...Object.fromEntries(entries) } }))
        return entries.length
      },

      startSession: (draft) => set({ draft }),
      updateDraft: (patch) =>
        set((s) => (s.draft ? { draft: { ...s.draft, ...patch } } : {})),
      upsertSet: (entry) =>
        set((s) => {
          if (!s.draft) return {}
          const rest = s.draft.sets.filter(
            (x) => !(x.exerciseId === entry.exerciseId && x.set === entry.set),
          )
          return { draft: { ...s.draft, sets: [...rest, entry] } }
        }),
      discardDraft: () => set({ draft: undefined }),
      finishSession: (log) =>
        set((s) => ({ history: [log, ...s.history], draft: undefined })),
      deleteSession: (id) => set((s) => ({ history: s.history.filter((h) => h.id !== id) })),

      addGoal: (goal) => set((s) => ({ goals: [goal, ...s.goals] })),
      updateGoal: (id, patch) =>
        set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) })),
      removeGoal: (id) => set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),

      addMeasurement: (m) =>
        set((s) => ({
          measurements: [m, ...s.measurements].sort((a, b) => b.date.localeCompare(a.date)),
        })),
      removeMeasurement: (id) =>
        set((s) => ({ measurements: s.measurements.filter((m) => m.id !== id) })),

      setActivePlan: (plan) => set({ activePlan: plan }),

      toggleFavoriteWorkout: (id) =>
        set((s) => ({
          favoriteWorkouts: s.favoriteWorkouts.includes(id)
            ? s.favoriteWorkouts.filter((x) => x !== id)
            : [...s.favoriteWorkouts, id],
        })),
      toggleFavoriteExercise: (id) =>
        set((s) => ({
          favoriteExercises: s.favoriteExercises.includes(id)
            ? s.favoriteExercises.filter((x) => x !== id)
            : [...s.favoriteExercises, id],
        })),

      replaceAll: (data) =>
        set((s) => ({
          profile: { ...s.profile, ...(data.profile ?? {}) },
          videos: data.videos ?? s.videos,
          history: data.history ?? s.history,
          goals: data.goals ?? s.goals,
          measurements: data.measurements ?? s.measurements,
          activePlan: data.activePlan ?? s.activePlan,
          favoriteWorkouts: data.favoriteWorkouts ?? s.favoriteWorkouts,
          favoriteExercises: data.favoriteExercises ?? s.favoriteExercises,
        })),

      resetAll: () =>
        set({
          profile: { ...DEFAULT_PROFILE, createdAt: new Date().toISOString() },
          videos: {},
          history: [],
          goals: [],
          measurements: [],
          activePlan: undefined,
          favoriteWorkouts: [],
          favoriteExercises: [],
          draft: undefined,
        }),
    }),
    {
      name: STORAGE_KEY,
      version: 2,
      // La versión 1 guardaba reservas de clases; ya no existen.
      migrate: (persisted) => {
        const state = { ...(persisted as Record<string, unknown>) }
        delete state.bookings
        return state as unknown as ForjaState
      },
    },
  ),
)

/** Datos exportables: todo lo que generaste vos, sin el catálogo. */
export function exportSnapshot(state: ForjaState) {
  return {
    app: 'forja-fit',
    version: 1,
    exportedAt: new Date().toISOString(),
    profile: state.profile,
    videos: state.videos,
    history: state.history,
    goals: state.goals,
    measurements: state.measurements,
    activePlan: state.activePlan,
    favoriteWorkouts: state.favoriteWorkouts,
    favoriteExercises: state.favoriteExercises,
  }
}

export function newId(prefix = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export function emptyDraft(workoutId: string, place: Place): SessionDraft {
  return {
    workoutId,
    date: today(),
    startedAt: new Date().toISOString(),
    place,
    blockIndex: 0,
    sets: [],
    elapsedSec: 0,
    runningSince: Date.now(),
  }
}
