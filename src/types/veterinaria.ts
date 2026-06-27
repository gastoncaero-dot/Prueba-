import type { Timestamp } from 'firebase/firestore';

// 'pendiente': se registró pero todavía no pagó la primera cuota.
// 'activa': la suscripción de MercadoPago está al día.
// 'vencida': dejó de pagar (lo marca el webhook de MercadoPago).
// 'cancelada': la canceló ella misma o nosotros.
export type EstadoSuscripcion = 'pendiente' | 'activa' | 'vencida' | 'cancelada';

export interface Veterinaria {
  id: string;
  ownerId: string; // uid del usuario (tipo 'veterinaria') que administra este perfil
  nombre: string;
  direccion: string;
  zona: string;
  telefono: string;
  lat: number;
  lng: number;
  premium: boolean;
  fotos: string[]; // URLs en Firebase Storage
  estadoSuscripcion: EstadoSuscripcion;
  mercadoPagoSubscriptionId: string | null;
  creadoEn: Timestamp;
}

export type NuevaVeterinaria = Omit<Veterinaria, 'id' | 'creadoEn'>;
