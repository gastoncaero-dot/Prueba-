// Pantallas para alguien sin sesión iniciada.
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

// Pantallas dentro de la pestaña "Mis mascotas", ya logueado.
export type MascotasStackParamList = {
  MascotasList: undefined;
  NuevaMascota: undefined;
  MascotaDetail: { mascotaId: string };
  NuevaVacuna: { mascotaId: string };
  NuevoTurno: { mascotaId: string };
};

// Pestañas principales una vez logueado.
export type AppTabParamList = {
  MascotasTab: undefined;
  PerfilTab: undefined;
};
