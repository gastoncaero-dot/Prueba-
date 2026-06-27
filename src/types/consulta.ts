import type { Timestamp } from 'firebase/firestore';

// Una entrada del historial médico: lo que pasó en una visita al veterinario.
export interface Consulta {
  id: string;
  mascotaId: string;
  veterinariaId: string;
  fecha: Timestamp;
  motivo: string;
  diagnostico: string;
  peso: number; // en kg, registrado en esta consulta
  notas: string;
  creadoEn: Timestamp;
}

export type NuevaConsulta = Omit<Consulta, 'id' | 'creadoEn'>;
