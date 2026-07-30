/** Hash estable de string a entero de 32 bits. */
export function hashString(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Generador determinístico: la misma semilla da siempre la misma serie. */
export function seededRandom(seed: string | number): () => number {
  let a = (typeof seed === 'string' ? hashString(seed) : seed) >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function pick<T>(items: readonly T[], rnd: () => number): T {
  return items[Math.floor(rnd() * items.length) % items.length]
}

export function pickBySeed<T>(items: readonly T[], seed: string): T {
  return items[hashString(seed) % items.length]
}

export function intBetween(min: number, max: number, rnd: () => number): number {
  return min + Math.floor(rnd() * (max - min + 1))
}
