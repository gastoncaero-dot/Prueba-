import type { Especie } from '../types';

export function emojiPorEspecie(especie: Especie): string {
  if (especie === 'perro') return '🐶';
  if (especie === 'gato') return '🐱';
  return '🐾';
}
