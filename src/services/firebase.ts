import { getApps, initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Estas variables vienen del archivo .env (ver .env.example). Expo solo
// inyecta en el bundle las que empiezan con EXPO_PUBLIC_, por eso el prefijo
// es obligatorio. Son datos públicos del proyecto Firebase (no son secretos:
// la seguridad real la dan las Firestore Security Rules, no este archivo).
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Evita reinicializar la app si este módulo se vuelve a importar
// (pasa seguido con Fast Refresh durante el desarrollo).
const app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);

// En React Native (a diferencia de la web) hay que decirle a Firebase Auth
// dónde guardar la sesión para que el usuario siga logueado al cerrar la app.
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
export const storage = getStorage(app);
// Las Cloud Functions corren en "southamerica-east1" (San Pablo): es la
// región más cercana a Argentina entre las disponibles en el plan gratis/Blaze.
export const functions = getFunctions(app, 'southamerica-east1');

export default app;
