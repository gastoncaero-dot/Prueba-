import { where } from 'firebase/firestore';
import { makeCollection } from './firestoreCollection';
import { COLLECTIONS } from '../constants/collections';
import type { Veterinaria } from '../types';

const veterinariasCollection = makeCollection<Veterinaria>(COLLECTIONS.veterinarias);

export const veterinariasService = {
  ...veterinariasCollection,

  listarPorZona(zona: string) {
    return veterinariasCollection.listar(where('zona', '==', zona));
  },
};
