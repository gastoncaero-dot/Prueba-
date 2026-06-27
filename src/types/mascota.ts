import type { Timestamp } from 'firebase/firestore';

export type Especie = 'perro' | 'gato' | 'otro';
export type Sexo = 'macho' | 'hembra';

// Un registro de peso en una fecha puntual, para armar el historial de peso.
export interface RegistroPeso {
  valor: number; // en kg
  fecha: Timestamp;
}

export interface Mascota {
  id: string;
  ownerId: string; // id del Usuario dueño
  nombre: string;
  especie: Especie;
  raza: string;
  sexo: Sexo;
  fechaNacimiento: Timestamp;
  foto: string | null; // URL en Firebase Storage
  peso: RegistroPeso[];
  color: string;
  creadoEn: Timestamp;
}

export type NuevaMascota = Omit<Mascota, 'id' | 'creadoEn' | 'peso'> & {
  peso?: RegistroPeso[];
};
