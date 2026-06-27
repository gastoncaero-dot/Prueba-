import type { Timestamp } from 'firebase/firestore';

// El dueño de una o más mascotas. El id coincide con el uid de Firebase Auth.
export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  zona: string;
  mascotas: string[]; // ids de documentos en la colección "mascotas"
  creadoEn: Timestamp;
}

export type NuevoUsuario = Omit<Usuario, 'id' | 'creadoEn'>;
