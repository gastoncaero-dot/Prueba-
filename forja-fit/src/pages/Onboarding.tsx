import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { useState } from 'react'
import { Logo } from '../components/Layout'
import { Button, Chip, Field, FieldGroup, Select, TextInput } from '../components/ui'
import { EQUIPMENT_CHOICES, EQUIPMENT_LABEL, LEVEL_LABEL } from '../data/taxonomy'
import { useStore } from '../lib/store'
import type { Equipment, Level } from '../types'

const GOALS = [
  'Bajar grasa',
  'Ganar fuerza',
  'Ganar masa muscular',
  'Mejorar el estado físico',
  'Volver a entrenar',
  'Preparar una carrera',
]

export function Onboarding() {
  const updateProfile = useStore((s) => s.updateProfile)
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [goalText, setGoalText] = useState('')
  const [level, setLevel] = useState<Level>('principiante')
  const [daysPerWeek, setDaysPerWeek] = useState(3)
  const [equipment, setEquipment] = useState<Equipment[]>(['mancuernas', 'colchoneta'])
  const [homeOnly, setHomeOnly] = useState(false)

  function toggleEquipment(item: Equipment) {
    setEquipment((prev) =>
      prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item],
    )
  }

  function finish() {
    updateProfile({
      name: name.trim(),
      goalText: goalText || GOALS[3],
      level,
      daysPerWeek,
      equipment,
      homeOnly,
      onboarded: true,
    })
  }

  const steps = [
    {
      title: '¿Cómo te llamás?',
      hint: 'Se usa solo acá adentro: todos tus datos quedan en este dispositivo.',
      body: (
        <div className="space-y-4">
          <Field label="Nombre">
            <TextInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              autoFocus
            />
          </Field>
          <FieldGroup label="¿Cuál es tu objetivo?">
            <div className="flex flex-wrap gap-2">
              {GOALS.map((g) => (
                <Chip key={g} active={goalText === g} onClick={() => setGoalText(g)}>
                  {g}
                </Chip>
              ))}
            </div>
          </FieldGroup>
        </div>
      ),
    },
    {
      title: '¿Cómo venís entrenando?',
      hint: 'Con esto se ajustan las rutinas y los planes que te sugiere la app.',
      body: (
        <div className="space-y-4">
          <FieldGroup label="Nivel">
            <div className="flex flex-wrap gap-2">
              {(['principiante', 'intermedio', 'avanzado'] as Level[]).map((l) => (
                <Chip key={l} active={level === l} onClick={() => setLevel(l)}>
                  {LEVEL_LABEL[l]}
                </Chip>
              ))}
            </div>
          </FieldGroup>
          <Field label="Días por semana" hint="Es la meta semanal que va a medir tu progreso.">
            <Select
              value={daysPerWeek}
              onChange={(e) => setDaysPerWeek(Number(e.target.value))}
            >
              {[2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n} días
                </option>
              ))}
            </Select>
          </Field>
        </div>
      ),
    },
    {
      title: '¿Con qué contás?',
      hint: 'Podés cambiarlo cuando quieras desde tu perfil.',
      body: (
        <div className="space-y-4">
          <FieldGroup label="Equipamiento disponible">
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT_CHOICES.map((item) => (
                <Chip
                  key={item}
                  active={equipment.includes(item)}
                  onClick={() => toggleEquipment(item)}
                >
                  {EQUIPMENT_LABEL[item]}
                </Chip>
              ))}
            </div>
          </FieldGroup>
          <FieldGroup label="¿Dónde entrenás?">
            <div className="flex flex-wrap gap-2">
              <Chip active={!homeOnly} onClick={() => setHomeOnly(false)}>
                Sede, casa y al aire libre
              </Chip>
              <Chip active={homeOnly} onClick={() => setHomeOnly(true)}>
                Solo en casa
              </Chip>
            </div>
          </FieldGroup>
        </div>
      ),
    },
  ]

  const current = steps[step]
  const isLast = step === steps.length - 1

  return (
    <div className="flex min-h-dvh flex-col bg-bg px-5 py-8">
      <div className="mx-auto w-full max-w-md flex-1">
        <Logo size={22} />

        <div className="mt-10">
          <div className="mb-6 flex gap-1.5">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-accent' : 'bg-surface-3'}`}
              />
            ))}
          </div>

          <h1 className="display text-2xl">{current.title}</h1>
          <p className="mt-1 mb-6 text-[13px] text-muted">{current.hint}</p>

          <div className="animate-in" key={step}>
            {current.body}
          </div>
        </div>
      </div>

      <div className="safe-bottom mx-auto mt-8 flex w-full max-w-md gap-2">
        {step > 0 && (
          <Button variant="secondary" size="lg" onClick={() => setStep(step - 1)}>
            <ArrowLeft size={16} />
          </Button>
        )}
        <Button size="lg" full onClick={() => (isLast ? finish() : setStep(step + 1))}>
          {isLast ? (
            <>
              Empezar <Check size={16} />
            </>
          ) : (
            <>
              Continuar <ArrowRight size={16} />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
