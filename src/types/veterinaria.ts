import type { Timestamp } from 'firebase/firestore';

export interface Veterinaria {
  id: string;
  nombre: string;
  direccion: string;
  zona: string;
  telefono: string;
  lat: number;
  lng: number;
  premium: boolean;
  fotos: string[]; // URLs en Firebase Storage
  creadoEn: Timestamp;
}

export type NuevaVeterinaria = Omit<Veterinaria, 'id' | 'creadoEn'>;
