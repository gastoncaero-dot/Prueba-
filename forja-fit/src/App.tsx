import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { useStore } from './lib/store'
import { Clases } from './pages/Clases'
import { EjercicioDetalle } from './pages/EjercicioDetalle'
import { Ejercicios } from './pages/Ejercicios'
import { Hoy } from './pages/Hoy'
import { Onboarding } from './pages/Onboarding'
import { Perfil } from './pages/Perfil'
import { PlanDetalle } from './pages/PlanDetalle'
import { Progreso } from './pages/Progreso'
import { RutinaDetalle } from './pages/RutinaDetalle'
import { Rutinas } from './pages/Rutinas'
import { Sesion } from './pages/Sesion'

export default function App() {
  const theme = useStore((s) => s.profile.theme)
  const onboarded = useStore((s) => s.profile.onboarded)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#08090b' : '#f4f5f7')
  }, [theme])

  if (!onboarded) return <Onboarding />

  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Hoy />} />
          <Route path="/clases" element={<Clases />} />
          <Route path="/rutinas" element={<Rutinas />} />
          <Route path="/rutinas/:id" element={<RutinaDetalle />} />
          <Route path="/planes/:id" element={<PlanDetalle />} />
          <Route path="/ejercicios" element={<Ejercicios />} />
          <Route path="/ejercicios/:id" element={<EjercicioDetalle />} />
          <Route path="/progreso" element={<Progreso />} />
          <Route path="/perfil" element={<Perfil />} />
        </Route>
        <Route path="/sesion/:workoutId" element={<Sesion />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
