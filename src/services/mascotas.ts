import { where } from 'firebase/firestore';
import { makeCollection } from './firestoreCollection';
import { COLLECTIONS } from '../constants/collections';
import type { Mascota } from '../types';

const mascotasCollection = makeCollection<Mascota>(COLLECTIONS.mascotas);

export const mascotasService = {
  ...mascotasCollection,

  listarPorOwner(ownerId: string) {
    return mascotasCollection.listar(where('ownerId', '==', ownerId));
  },
};
