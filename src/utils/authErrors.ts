import { FirebaseError } from 'firebase/app';

// Firebase Auth devuelve códigos en inglés tipo "auth/invalid-email". Esto
// los traduce a mensajes que un usuario en Argentina entiende.
const MENSAJES: Record<string, string> = {
  'auth/invalid-email': 'Ese email no parece válido.',
  'auth/user-not-found': 'No encontramos una cuenta con ese email.',
  'auth/wrong-password': 'La contraseña es incorrecta.',
  'auth/invalid-credential': 'Email o contraseña incorrectos.',
  'auth/email-already-in-use': 'Ya existe una cuenta con ese email.',
  'auth/weak-password': 'La contraseña tiene que tener al menos 6 caracteres.',
  'auth/network-request-failed': 'Falló la conexión. Revisá tu internet.',
  'auth/too-many-requests': 'Probaste muchas veces. Esperá un momento y volvé a intentar.',
};

export function authErrorMessage(err: unknown): string {
  if (err instanceof FirebaseError) {
    return MENSAJES[err.code] ?? 'Algo salió mal. Probá de nuevo.';
  }
  return 'Algo salió mal. Probá de nuevo.';
}
