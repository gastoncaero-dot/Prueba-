import type { Timestamp } from 'firebase/firestore';

// Distingue entre un dueño de mascota (usa la app gratis) y una cuenta de
// veterinaria (la que eventualmente paga la suscripción). Sirve para
// decidir, después del login, a qué navegación mandar a cada usuario.
export type TipoUsuario = 'dueño' | 'veterinaria';

// El dueño de una o más mascotas, o una veterinaria. El id coincide con el
// uid de Firebase Auth en ambos casos.
export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  zona: string;
  tipo: TipoUsuario;
  mascotas: string[]; // ids de documentos en la colección "mascotas" (vacío si tipo === 'veterinaria')
  veterinariaId: string | null; // id del documento en "veterinarias" si tipo === 'veterinaria'
  creadoEn: Timestamp;
}

export type NuevoUsuario = Omit<Usuario, 'id' | 'creadoEn'>;
