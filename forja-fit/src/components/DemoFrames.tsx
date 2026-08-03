import { Pause, Play } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { catalogDemo } from '../data/demos'

/**
 * Demostración del catálogo: alterna la foto de la posición inicial con la de
 * la final, con un fundido, así se lee el recorrido del movimiento.
 */
export function DemoFrames({ exerciseId, alt }: { exerciseId: string; alt: string }) {
  const demo = catalogDemo(exerciseId)
  const [atEnd, setAtEnd] = useState(false)
  const [playing, setPlaying] = useState(true)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!playing) return
    timer.current = setInterval(() => setAtEnd((v) => !v), 1500)
    return () => {
      if (timer.current) clearInterval(timer.current)
    }
  }, [playing])

  if (!demo) return null

  return (
    <div className="relative aspect-3/2 w-full overflow-hidden bg-black">
      <img
        src={demo.start}
        alt={`${alt}: posición inicial`}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
        style={{ opacity: atEnd ? 0 : 1 }}
      />
      <img
        src={demo.end}
        alt={`${alt}: posición final`}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
        style={{ opacity: atEnd ? 1 : 0 }}
      />

      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/75 to-transparent px-3 pt-8 pb-2">
        <button
          onClick={() => setPlaying((v) => !v)}
          aria-label={playing ? 'Pausar la demostración' : 'Reproducir la demostración'}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm hover:bg-white/25"
        >
          {playing ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
        </button>

        <div className="flex gap-1.5">
          {(['Inicio', 'Final'] as const).map((label, i) => (
            <button
              key={label}
              onClick={() => {
                setPlaying(false)
                setAtEnd(i === 1)
              }}
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors ${
                (i === 1) === atEnd
                  ? 'bg-accent text-accent-ink'
                  : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
