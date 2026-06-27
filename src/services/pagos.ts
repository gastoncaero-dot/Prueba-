import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

type RespuestaCrearSuscripcion = { initPoint: string };

// Llama a la Cloud Function "crearSuscripcion" (ver functions/src/index.ts).
// Esa función es la única que tiene el access token de MercadoPago: nunca
// debe vivir en el cliente, porque cualquiera podría extraerlo del bundle
// de la app y crear cobros en nuestro nombre.
const crearSuscripcionCallable = httpsCallable<{ veterinariaId: string }, RespuestaCrearSuscripcion>(
  functions,
  'crearSuscripcion',
);

export const pagosService = {
  // Devuelve la URL de checkout de MercadoPago para que la app la abra con
  // Linking.openURL(). Cuando el pago se confirma, MercadoPago llama al
  // webhook (otra Cloud Function) que actualiza estadoSuscripcion a 'activa'.
  async crearSuscripcion(veterinariaId: string): Promise<string> {
    const resultado = await crearSuscripcionCallable({ veterinariaId });
    return resultado.data.initPoint;
  },
};
