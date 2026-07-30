import { ChevronRight, Film, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Chip, EmptyState, TextInput } from '../components/ui'
import { EXERCISES } from '../data/exercises'
import {
  EQUIPMENT_LABEL,
  MODALITIES,
  MUSCLE_LABEL,
  PATTERN_LABEL,
  modality as modalityMeta,
} from '../data/taxonomy'
import { useStore } from '../lib/store'
import type { Equipment, Modality, Pattern } from '../types'

const PATTERN_GROUPS: { label: string; patterns: Pattern[] }[] = [
  { label: 'Empujes', patterns: ['empuje-horizontal', 'empuje-vertical'] },
  { label: 'Tracciones', patterns: ['traccion-horizontal', 'traccion-vertical'] },
  { label: 'Piernas', patterns: ['sentadilla', 'bisagra', 'zancada', 'salto'] },
  {
    label: 'Core',
    patterns: ['core-antiextension', 'core-antirotacion', 'core-flexion', 'transporte'],
  },
  { label: 'Cardio', patterns: ['locomocion', 'monoestructural'] },
  { label: 'Movilidad', patterns: ['movilidad'] },
]

const EQUIPMENT_FILTERS: Equipment[] = [
  'ninguno',
  'mancuernas',
  'kettlebell',
  'barra',
  'banda',
  'colchoneta',
  'cajon',
  'aro',
  'trx',
]

export function Ejercicios() {
  const [query, setQuery] = useState('')
  const [modalityFilter, setModalityFilter] = useState<Modality | 'todas'>('todas')
  const [group, setGroup] = useState<string>('todos')
  const [equipmentFilter, setEquipmentFilter] = useState<Equipment | 'todos'>('todos')
  const [onlyWithVideo, setOnlyWithVideo] = useState(false)

  const videos = useStore((s) => s.videos)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const patterns = PATTERN_GROUPS.find((g) => g.label === group)?.patterns
    return EXERCISES.filter((e) => {
      if (modalityFilter !== 'todas' && !e.modalities.includes(modalityFilter)) return false
      if (patterns && !patterns.includes(e.pattern)) return false
      if (equipmentFilter !== 'todos' && !e.equipment.includes(equipmentFilter)) return false
      if (onlyWithVideo && !videos[e.id] && !e.videoUrl) return false
      if (!q) return true
      return [e.name, ...(e.aka ?? []), PATTERN_LABEL[e.pattern], ...e.primary]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [query, modalityFilter, group, equipmentFilter, onlyWithVideo, videos])

  const withVideo = EXERCISES.filter((e) => videos[e.id] || e.videoUrl).length

  return (
    <div className="space-y-5">
      <div>
        <h1 className="display text-2xl">Ejercicios</h1>
        <p className="text-[13px] text-muted">
          {EXERCISES.length} movimientos con ficha técnica · {withVideo} con video cargado
        </p>
      </div>

      <div className="relative">
        <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-faint" />
        <TextInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar movimiento, patrón o músculo"
          className="pl-9"
        />
      </div>

      <div className="space-y-2">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          <Chip active={group === 'todos'} onClick={() => setGroup('todos')}>
            Todos
          </Chip>
          {PATTERN_GROUPS.map((g) => (
            <Chip key={g.label} active={group === g.label} onClick={() => setGroup(g.label)}>
              {g.label}
            </Chip>
          ))}
        </div>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          <Chip active={modalityFilter === 'todas'} onClick={() => setModalityFilter('todas')}>
            Cualquier modalidad
          </Chip>
          {MODALITIES.map((m) => (
            <Chip
              key={m.id}
              active={modalityFilter === m.id}
              color={m.color}
              onClick={() => setModalityFilter(m.id)}
            >
              {m.label}
            </Chip>
          ))}
        </div>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          <Chip active={onlyWithVideo} onClick={() => setOnlyWithVideo(!onlyWithVideo)}>
            Con video
          </Chip>
          {EQUIPMENT_FILTERS.map((eq) => (
            <Chip
              key={eq}
              active={equipmentFilter === eq}
              onClick={() => setEquipmentFilter(equipmentFilter === eq ? 'todos' : eq)}
            >
              {EQUIPMENT_LABEL[eq]}
            </Chip>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Ningún movimiento coincide"
          text="Probá con otro filtro o buscá por el nombre alternativo del ejercicio."
        />
      ) : (
        <ul className="card divide-y divide-line-soft overflow-hidden">
          {filtered.map((e) => {
            const hasVideo = Boolean(videos[e.id] ?? e.videoUrl)
            return (
              <li key={e.id}>
                <Link
                  to={`/ejercicios/${e.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold"
                    style={{
                      background: `${modalityMeta(e.modalities[0]).color}1f`,
                      color: modalityMeta(e.modalities[0]).color,
                    }}
                  >
                    {hasVideo ? <Film size={14} /> : PATTERN_LABEL[e.pattern].slice(0, 2)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{e.name}</span>
                    <span className="block truncate text-[12px] text-muted">
                      {PATTERN_LABEL[e.pattern]} · {e.primary.map((m) => MUSCLE_LABEL[m]).join(', ')}
                    </span>
                  </span>
                  <ChevronRight size={15} className="shrink-0 text-faint" />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
