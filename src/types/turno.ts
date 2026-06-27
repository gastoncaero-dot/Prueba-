import type { Timestamp } from 'firebase/firestore';

export type EstadoTurno = 'pendiente' | 'confirmado' | 'cancelado' | 'completado';

export interface Turno {
  id: string;
  mascotaId: string;
  veterinariaId: string;
  fecha: Timestamp;
  estado: EstadoTurno;
  creadoEn: Timestamp;
}

export type NuevoTurno = Omit<Turno, 'id' | 'creadoEn' | 'estado'> & {
  estado?: EstadoTurno;
};
