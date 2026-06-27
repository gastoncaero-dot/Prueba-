import { where } from 'firebase/firestore';
import { makeCollection } from './firestoreCollection';
import { COLLECTIONS } from '../constants/collections';
import type { Vacuna } from '../types';

const vacunasCollection = makeCollection<Vacuna>(COLLECTIONS.vacunas);

export const vacunasService = {
  ...vacunasCollection,

  listarPorMascota(mascotaId: string) {
    return vacunasCollection.listar(where('mascotaId', '==', mascotaId));
  },
};
