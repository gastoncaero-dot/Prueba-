import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';
import { auth } from '../services/firebase';
import { usuariosService } from '../services/usuarios';
import { veterinariasService } from '../services/veterinarias';
import { diasCalendarioEntre } from '../utils/date';
import type { Usuario } from '../types';

type DatosRegistro = {
  nombre: string;
  email: string;
  password: string;
  zona: string;
};

type DatosRegistroVeterinaria = {
  nombreVeterinaria: string;
  email: string;
  password: string;
  zona: string;
  direccion: string;
  telefono: string;
};

type AuthContextValue = {
  user: User | null;
  usuario: Usuario | null;
  cargando: boolean;
  registrarse: (datos: DatosRegistro) => Promise<void>;
  registrarVeterinaria: (datos: DatosRegistroVeterinaria) => Promise<void>;
  iniciarSesion: (email: string, password: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// La "racha de cuidado": cuántos días calendario seguidos el dueño abrió la
// app. Cuenta como mucho una vez por día; si se saltea un día entero, vuelve
// a 1. Si la escritura falla no bloqueamos el login: la racha es un
// incentivo, no un dato crítico.
async function registrarVisitaDiaria(perfil: Usuario): Promise<Usuario> {
  if (perfil.tipo !== 'dueño') return perfil;
  const ahora = Timestamp.now();
  const dias = perfil.ultimaVisita
    ? diasCalendarioEntre(perfil.ultimaVisita.toDate(), ahora.toDate())
    : null;
  if (dias === 0) return perfil; // hoy ya contó
  const racha = dias === 1 ? (perfil.racha ?? 0) + 1 : 1;
  try {
    await usuariosService.actualizar(perfil.id, { racha, ultimaVisita: ahora });
  } catch {
    return perfil;
  }
  return { ...perfil, racha, ultimaVisita: ahora };
}

// Provider que envuelve toda la app. Se encarga de dos cosas:
// 1) saber si hay alguien logueado (Firebase Auth)
// 2) traer su perfil de la colección "usuarios" (nombre, zona, etc.)
// Separamos esto de las pantallas para no repetir esta lógica en cada una.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const perfil = await usuariosService.obtener(firebaseUser.uid);
        setUsuario(perfil ? await registrarVisitaDiaria(perfil) : perfil);
      } else {
        setUsuario(null);
      }
      setCargando(false);
    });
    return unsubscribe;
  }, []);

  async function registrarse({ nombre, email, password, zona }: DatosRegistro) {
    const credencial = await createUserWithEmailAndPassword(auth, email, password);
    await usuariosService.crearConId(credencial.user.uid, {
      nombre,
      email,
      zona,
      tipo: 'dueño',
      mascotas: [],
      veterinariaId: null,
      racha: 1,
      ultimaVisita: Timestamp.now(),
    });
    setUsuario(await usuariosService.obtener(credencial.user.uid));
  }

  // A diferencia de registrarse(), acá además del usuario creamos su
  // documento en "veterinarias" (con estadoSuscripcion: 'pendiente') y lo
  // enlazamos con veterinariaId. Es lo que separa una cuenta que va a pagar
  // suscripción de una que usa la app gratis.
  async function registrarVeterinaria({
    nombreVeterinaria,
    email,
    password,
    zona,
    direccion,
    telefono,
  }: DatosRegistroVeterinaria) {
    const credencial = await createUserWithEmailAndPassword(auth, email, password);
    const veterinariaId = await veterinariasService.crear({
      ownerId: credencial.user.uid,
      nombre: nombreVeterinaria,
      direccion,
      zona,
      telefono,
      lat: 0,
      lng: 0,
      premium: false,
      fotos: [],
      estadoSuscripcion: 'pendiente',
      mercadoPagoSubscriptionId: null,
    });
    await usuariosService.crearConId(credencial.user.uid, {
      nombre: nombreVeterinaria,
      email,
      zona,
      tipo: 'veterinaria',
      mascotas: [],
      veterinariaId,
    });
    setUsuario(await usuariosService.obtener(credencial.user.uid));
  }

  async function iniciarSesion(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function cerrarSesion() {
    await firebaseSignOut(auth);
  }

  return (
    <AuthContext.Provider
      value={{ user, usuario, cargando, registrarse, registrarVeterinaria, iniciarSesion, cerrarSesion }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth tiene que usarse dentro de <AuthProvider>');
  return ctx;
}
