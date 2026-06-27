// El paquete "firebase/auth" sí trae getReactNativePersistence en su build
// para React Native (Metro la resuelve bien en runtime), pero el archivo de
// tipos público que usa TypeScript no la declara. Esto la agrega a mano
// para que el editor y "tsc" no se quejen.
import type { Persistence, ReactNativeAsyncStorage } from 'firebase/auth';

declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: ReactNativeAsyncStorage): Persistence;
}
