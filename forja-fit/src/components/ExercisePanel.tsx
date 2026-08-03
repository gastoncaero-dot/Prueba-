import { AlertTriangle, ArrowRight, CheckCircle2, Wind } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getExercise } from '../data/exercises'
import { VideoPlayer } from './VideoPlayer'

/**
 * Panel de técnica que se despliega dentro de la rutina y de la sesión: el
 * video de demostración más las claves y los errores comunes, para poder
 * autocorregirse sin salir del entrenamiento.
 */
export function ExercisePanel({ exerciseId }: { exerciseId: string }) {
  const exercise = getExercise(exerciseId)
  if (!exercise) return null

  return (
    <div className="animate-in space-y-3 border-t border-line-soft pt-3">
      <VideoPlayer
        exerciseId={exercise.id}
        exerciseName={exercise.name}
        catalogUrl={exercise.videoUrl}
      />

      <div>
        <p className="overline text-faint">Claves de ejecución</p>
        <ul className="mt-1.5 space-y-1.5">
          {exercise.cues.map((cue) => (
            <li key={cue} className="flex gap-2 text-[13px] leading-relaxed">
              <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-accent" />
              {cue}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="overline text-faint">Errores comunes</p>
        <ul className="mt-1.5 space-y-1.5">
          {exercise.mistakes.map((mistake) => (
            <li key={mistake} className="flex gap-2 text-[13px] leading-relaxed text-muted">
              <AlertTriangle size={14} className="mt-0.5 shrink-0 text-warn" />
              {mistake}
            </li>
          ))}
        </ul>
      </div>

      {exercise.breathing && (
        <p className="flex gap-2 text-[13px] leading-relaxed text-muted">
          <Wind size={14} className="mt-0.5 shrink-0" />
          {exercise.breathing}
        </p>
      )}

      <Link
        to={`/ejercicios/${exercise.id}`}
        className="inline-flex items-center gap-1 text-[12px] font-semibold text-accent"
      >
        Ver la ficha completa <ArrowRight size={13} />
      </Link>
    </div>
  )
}
