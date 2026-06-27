// Nombres de las colecciones en Firestore. Centralizados acá para no
// repetir strings sueltos (y typeados) por todo el código.
export const COLLECTIONS = {
  usuarios: 'usuarios',
  mascotas: 'mascotas',
  vacunas: 'vacunas',
  veterinarias: 'veterinarias',
  turnos: 'turnos',
  consultas: 'consultas',
} as const;
