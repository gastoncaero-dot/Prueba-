import { where } from 'firebase/firestore';
import { makeCollection } from './firestoreCollection';
import { COLLECTIONS } from '../constants/collections';
import type { Turno } from '../types';

const turnosCollection = makeCollection<Turno>(COLLECTIONS.turnos);

export const turnosService = {
  ...turnosCollection,

  listarPorMascota(mascotaId: string) {
    return turnosCollection.listar(where('mascotaId', '==', mascotaId));
  },

  listarPorVeterinaria(veterinariaId: string) {
    return turnosCollection.listar(where('veterinariaId', '==', veterinariaId));
  },
};
