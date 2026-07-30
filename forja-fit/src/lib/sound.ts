let ctx: AudioContext | null = null

function audioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  if (!ctx) ctx = new Ctor()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

/** Pitido corto generado en el momento: no hace falta ningún archivo de audio. */
export function beep(frequency = 880, durationMs = 120, volume = 0.25) {
  const context = audioContext()
  if (!context) return
  const osc = context.createOscillator()
  const gain = context.createGain()
  osc.type = 'sine'
  osc.frequency.value = frequency
  gain.gain.value = volume
  osc.connect(gain).connect(context.destination)
  const now = context.currentTime
  osc.start(now)
  gain.gain.setValueAtTime(volume, now)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000)
  osc.stop(now + durationMs / 1000 + 0.02)
}

/** Cuenta regresiva: tres pitidos graves y uno agudo. */
export function beepCountdown(secondsLeft: number) {
  if (secondsLeft <= 0) beep(1320, 320)
  else if (secondsLeft <= 3) beep(660, 110)
}

export function beepStart() {
  beep(1046, 220)
}

export function beepFinish() {
  beep(880, 160)
  setTimeout(() => beep(1318, 320), 180)
}

export function vibrate(pattern: number | number[] = 60) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(pattern)
  }
}
