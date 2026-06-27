import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  serverTimestamp,
  type QueryConstraint,
  type DocumentData,
} from 'firebase/firestore';
import { db } from './firebase';

// Cualquier entidad de nuestro modelo tiene un id (lo pone Firestore) y un
// creadoEn (lo ponemos nosotros con serverTimestamp al crear el documento).
type Entidad = { id: string; creadoEn: unknown };

// Fábrica de operaciones CRUD para una colección de Firestore. Las seis
// entidades (usuarios, mascotas, vacunas, veterinarias, turnos, consultas)
// necesitan las mismas cinco operaciones básicas, así que las generamos una
// sola vez acá en lugar de repetir el mismo código seis veces.
export function makeCollection<T extends Entidad>(nombreColeccion: string) {
  const ref = collection(db, nombreColeccion);

  return {
    async obtener(id: string): Promise<T | null> {
      const snap = await getDoc(doc(ref, id));
      return snap.exists() ? ({ id: snap.id, ...snap.data() } as T) : null;
    },

    async listar(...constraints: QueryConstraint[]): Promise<T[]> {
      const q = query(ref, ...constraints);
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
    },

    async crear(datos: Omit<T, 'id' | 'creadoEn'>): Promise<string> {
      const docRef = await addDoc(ref, { ...datos, creadoEn: serverTimestamp() });
      return docRef.id;
    },

    async actualizar(id: string, datos: Partial<Omit<T, 'id' | 'creadoEn'>>): Promise<void> {
      await updateDoc(doc(ref, id), datos as DocumentData);
    },

    async eliminar(id: string): Promise<void> {
      await deleteDoc(doc(ref, id));
    },
  };
}
