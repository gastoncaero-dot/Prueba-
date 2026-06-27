import { doc, setDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { makeCollection } from './firestoreCollection';
import { COLLECTIONS } from '../constants/collections';
import type { Usuario, NuevoUsuario } from '../types';

const usuariosCollection = makeCollection<Usuario>(COLLECTIONS.usuarios);

export const usuariosService = {
  obtener: usuariosCollection.obtener,
  actualizar: usuariosCollection.actualizar,
  eliminar: usuariosCollection.eliminar,

  // A diferencia de las otras entidades, el id del usuario no lo genera
  // Firestore: tiene que ser el mismo uid que devuelve Firebase Auth al
  // registrarse. Por eso usamos setDoc con un id elegido en vez de crear().
  async crearConId(uid: string, datos: NuevoUsuario): Promise<void> {
    await setDoc(doc(db, COLLECTIONS.usuarios, uid), {
      ...datos,
      creadoEn: serverTimestamp(),
    });
  },

  async agregarMascota(uid: string, mascotaId: string): Promise<void> {
    await updateDoc(doc(db, COLLECTIONS.usuarios, uid), { mascotas: arrayUnion(mascotaId) });
  },

  async quitarMascota(uid: string, mascotaId: string): Promise<void> {
    await updateDoc(doc(db, COLLECTIONS.usuarios, uid), { mascotas: arrayRemove(mascotaId) });
  },
};
