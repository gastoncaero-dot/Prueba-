import { where } from 'firebase/firestore';
import { makeCollection } from './firestoreCollection';
import { COLLECTIONS } from '../constants/collections';
import type { Consulta } from '../types';

const consultasCollection = makeCollection<Consulta>(COLLECTIONS.consultas);

export const consultasService = {
  ...consultasCollection,

  listarPorMascota(mascotaId: string) {
    return consultasCollection.listar(where('mascotaId', '==', mascotaId));
  },
};
