// Pantallas para alguien sin sesión iniciada.
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  RegisterVeterinaria: undefined;
};

// Pantallas dentro de la pestaña "Mis mascotas", ya logueado como dueño.
export type MascotasStackParamList = {
  MascotasList: undefined;
  NuevaMascota: undefined;
  MascotaDetail: { mascotaId: string };
  NuevaVacuna: { mascotaId: string };
  NuevoTurno: { mascotaId: string; veterinariaId?: string; veterinariaNombre?: string };
  Veterinarias: { paraTurno?: { mascotaId: string } } | undefined;
};

// Pestañas principales una vez logueado como dueño de mascota.
export type AppTabParamList = {
  MascotasTab: undefined;
  PerfilTab: undefined;
};

// Pantallas para una cuenta de veterinaria logueada.
export type VeterinariaStackParamList = {
  VeterinariaDashboard: undefined;
  VeterinariaPerfil: undefined;
};
