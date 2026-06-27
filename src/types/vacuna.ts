import type { Timestamp } from 'firebase/firestore';

export interface Vacuna {
  id: string;
  mascotaId: string;
  tipo: string; // ej: "Antirrábica", "Triple felina"
  fechaAplicada: Timestamp | null; // null si todavía no se aplicó
  fechaVence: Timestamp;
  veterinariaId: string | null;
  aplicada: boolean;
  creadoEn: Timestamp;
}

export type NuevaVacuna = Omit<Vacuna, 'id' | 'creadoEn'>;
