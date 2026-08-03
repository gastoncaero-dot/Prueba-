import { Download, Film, Info, RotateCcw, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Button,
  Chip,
  Field,
  FieldGroup,
  SectionHeader,
  Select,
  Switch,
  TextInput,
} from '../components/ui'
import { EXERCISES, exerciseName } from '../data/exercises'
import { EQUIPMENT_CHOICES, EQUIPMENT_LABEL, LEVEL_LABEL } from '../data/taxonomy'
import { exportSnapshot, useStore } from '../lib/store'
import type { Equipment, Level } from '../types'

function download(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function Perfil() {
  const profile = useStore((s) => s.profile)
  const updateProfile = useStore((s) => s.updateProfile)
  const videos = useStore((s) => s.videos)
  const importVideos = useStore((s) => s.importVideos)
  const clearVideo = useStore((s) => s.clearVideo)
  const replaceAll = useStore((s) => s.replaceAll)
  const resetAll = useStore((s) => s.resetAll)
  const history = useStore((s) => s.history)

  const dataInput = useRef<HTMLInputElement>(null)
  const videoInput = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState('')

  const videoEntries = Object.entries(videos).filter(([, url]) => url)

  function toggleEquipment(item: Equipment) {
    const next = profile.equipment.includes(item)
      ? profile.equipment.filter((e) => e !== item)
      : [...profile.equipment, item]
    updateProfile({ equipment: next })
  }

  async function importData(file: File) {
    try {
      const parsed = JSON.parse(await file.text())
      replaceAll(parsed)
      setMessage('Datos importados correctamente.')
    } catch {
      setMessage('No pudimos leer ese archivo. Tiene que ser un JSON exportado desde la app.')
    }
  }

  async function importVideoMap(file: File) {
    try {
      const parsed = JSON.parse(await file.text())
      const map = parsed.videos ?? parsed
      const count = importVideos(map)
      setMessage(`${count} videos importados.`)
    } catch {
      setMessage('El archivo tiene que ser un JSON con pares "id-del-ejercicio": "url".')
    }
  }

  return (
    <div className="space-y-7">
      <div>
        <h1 className="display text-2xl">Perfil</h1>
        <p className="text-[13px] text-muted">
          Todo se guarda en este dispositivo. Nada sale de tu navegador.
        </p>
      </div>

      {message && (
        <p className="rounded-xl border border-accent/40 bg-accent/10 px-3 py-2 text-[13px] text-accent">
          {message}
        </p>
      )}

      {/* --------------------------------------------------------- perfil */}
      <section className="space-y-3">
        <SectionHeader title="Tus datos" />
        <Field label="Nombre">
          <TextInput
            value={profile.name}
            onChange={(e) => updateProfile({ name: e.target.value })}
            placeholder="Tu nombre"
          />
        </Field>
        <Field label="Objetivo">
          <TextInput
            value={profile.goalText}
            onChange={(e) => updateProfile({ goalText: e.target.value })}
            placeholder="Ej: ganar fuerza"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nivel">
            <Select
              value={profile.level}
              onChange={(e) => updateProfile({ level: e.target.value as Level })}
            >
              {(['principiante', 'intermedio', 'avanzado'] as Level[]).map((l) => (
                <option key={l} value={l}>
                  {LEVEL_LABEL[l]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Días por semana">
            <Select
              value={profile.daysPerWeek}
              onChange={(e) => updateProfile({ daysPerWeek: Number(e.target.value) })}
            >
              {[2, 3, 4, 5, 6, 7].map((n) => (
                <option key={n} value={n}>
                  {n} días
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <FieldGroup label="Equipamiento disponible">
          <div className="flex flex-wrap gap-2">
            {EQUIPMENT_CHOICES.map((item) => (
              <Chip
                key={item}
                active={profile.equipment.includes(item)}
                onClick={() => toggleEquipment(item)}
              >
                {EQUIPMENT_LABEL[item]}
              </Chip>
            ))}
          </div>
        </FieldGroup>
      </section>

      {/* ------------------------------------------------------ preferencias */}
      <section>
        <SectionHeader title="Preferencias" />
        <div className="card divide-y divide-line-soft px-4">
          <Switch
            label="Entreno solo en casa"
            hint="Prioriza rutinas sin equipamiento de gimnasio"
            checked={profile.homeOnly}
            onChange={(v) => updateProfile({ homeOnly: v })}
          />
          <Switch
            label="Sonido en los cronómetros"
            checked={profile.sound}
            onChange={(v) => updateProfile({ sound: v })}
          />
          <Switch
            label="Vibración"
            hint="Solo en celulares compatibles"
            checked={profile.vibration}
            onChange={(v) => updateProfile({ vibration: v })}
          />
          <Switch
            label="Tema oscuro"
            checked={profile.theme === 'dark'}
            onChange={(v) => updateProfile({ theme: v ? 'dark' : 'light' })}
          />
          <div className="py-2">
            <Field label="Unidad de carga">
              <Select
                value={profile.units}
                onChange={(e) => updateProfile({ units: e.target.value as 'kg' | 'lb' })}
              >
                <option value="kg">Kilos (kg)</option>
                <option value="lb">Libras (lb)</option>
              </Select>
            </Field>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ videos */}
      <section>
        <SectionHeader
          title="Videos"
          hint={`${videoEntries.length} de ${EXERCISES.length} movimientos con video`}
        />
        <div className="card space-y-3 px-4 py-4">
          <p className="text-[13px] leading-relaxed text-muted">
            El catálogo trae la ficha técnica de cada movimiento, pero los videos los cargás vos:
            entrá a un ejercicio y pegá el link, o importá un archivo JSON con todos juntos.
          </p>
          <Link to="/videos">
            <Button full>
              <Film size={15} /> Cargar videos
            </Button>
          </Link>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => videoInput.current?.click()}>
              <Upload size={14} /> Importar videos
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => download('forja-videos.json', videos)}
              disabled={!videoEntries.length}
            >
              <Download size={14} /> Exportar videos
            </Button>
            <Link to="/ejercicios">
              <Button size="sm" variant="ghost">
                Ir a la biblioteca
              </Button>
            </Link>
          </div>
          <input
            ref={videoInput}
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void importVideoMap(file)
              e.target.value = ''
            }}
          />

          {videoEntries.length > 0 && (
            <ul className="divide-y divide-line-soft border-t border-line-soft">
              {videoEntries.map(([id, url]) => (
                <li key={id} className="flex items-center gap-2 py-2">
                  <Link to={`/ejercicios/${id}`} className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold">
                      {exerciseName(id)}
                    </span>
                    <span className="block truncate text-[11px] text-faint">{url}</span>
                  </Link>
                  <button
                    onClick={() => clearVideo(id)}
                    className="shrink-0 text-[11px] font-semibold text-faint hover:text-danger"
                  >
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* -------------------------------------------------------------- datos */}
      <section>
        <SectionHeader title="Tus datos" hint={`${history.length} sesiones guardadas`} />
        <div className="card space-y-3 px-4 py-4">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => download('forja-backup.json', exportSnapshot(useStore.getState()))}
            >
              <Download size={14} /> Exportar todo
            </Button>
            <Button size="sm" variant="secondary" onClick={() => dataInput.current?.click()}>
              <Upload size={14} /> Importar copia
            </Button>
          </div>
          <input
            ref={dataInput}
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void importData(file)
              e.target.value = ''
            }}
          />
          <p className="text-[12px] text-faint">
            Exportá de vez en cuando: si borrás los datos del navegador, se pierde el historial.
          </p>
          <Button
            size="sm"
            variant="danger"
            onClick={() => {
              if (confirm('Esto borra tu historial, objetivos, medidas y videos. ¿Seguro?')) {
                resetAll()
                setMessage('Se borraron todos los datos.')
              }
            }}
          >
            <RotateCcw size={14} /> Borrar todos mis datos
          </Button>
        </div>
      </section>

      {/* -------------------------------------------------------------- acerca */}
      <section>
        <SectionHeader title="Sobre esta app" />
        <div className="card space-y-2 px-4 py-4 text-[13px] leading-relaxed text-muted">
          <p className="flex items-start gap-2">
            <Info size={15} className="mt-0.5 shrink-0 text-accent" />
            <span>
              Forja Fit es una app de entrenamiento de uso personal: funciona sin servidor, guarda
              todo en tu dispositivo y se puede instalar como aplicación desde el navegador.
            </span>
          </p>
          <p>
            El catálogo de {EXERCISES.length} movimientos, las rutinas y los planes son contenido
            original escrito para esta app. Los videos de demostración los cargás vos, con links
            propios o de la plataforma que prefieras.
          </p>
        </div>
      </section>
    </div>
  )
}
