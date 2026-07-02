import { COLORS } from '../constants/theme';
import type { Mascota, Vacuna, Turno } from '../types';

// "Salud al día": un puntaje de 0 a 100 que resume cuán al día está el
// cuidado de una mascota, calculado siempre a partir de datos que ya
// existen (vacunas, peso, turnos) — no se guarda en Firestore, así nunca
// queda desactualizado. No es un dato médico: es una guía simple y un
// incentivo para que el dueño complete lo que falta.
//
// El reparto de puntos refleja qué le importa más a la salud real de la
// mascota (y de paso, al negocio: cada "misión" incompleta empuja una
// acción que termina en la veterinaria).

export type ItemSalud = {
  clave: 'vacunas' | 'peso' | 'turno';
  emoji: string;
  titulo: string;
  detalle: string;
  puntos: number;
  completo: boolean;
};

export type SaludMascota = {
  puntaje: number; // 0 a 100
  items: ItemSalud[];
};

const DIAS_PESO_RECIENTE = 90;
const MS_POR_DIA = 24 * 60 * 60 * 1000;

export function calcularSalud(mascota: Mascota, vacunas: Vacuna[], turnos: Turno[]): SaludMascota {
  const ahora = Date.now();

  const vacunasVencidas = vacunas.filter((v) => v.fechaVence.toDate().getTime() < ahora).length;
  const vacunasOk = vacunas.length > 0 && vacunasVencidas === 0;

  const historialPeso = mascota.peso ?? [];
  const ultimoPeso = historialPeso[historialPeso.length - 1];
  const pesoOk =
    !!ultimoPeso && (ahora - ultimoPeso.fecha.toDate().getTime()) / MS_POR_DIA <= DIAS_PESO_RECIENTE;

  const turnoOk = turnos.some(
    (t) => (t.estado === 'pendiente' || t.estado === 'confirmado') && t.fecha.toDate().getTime() >= ahora,
  );

  const items: ItemSalud[] = [
    {
      clave: 'vacunas',
      emoji: '💉',
      titulo: 'Vacunas al día',
      detalle: vacunasOk
        ? 'Todas sus vacunas están vigentes.'
        : vacunas.length > 0
          ? `Tiene ${vacunasVencidas} vacuna${vacunasVencidas === 1 ? '' : 's'} vencida${vacunasVencidas === 1 ? '' : 's'}.`
          : 'Registrá su primera vacuna.',
      puntos: 40,
      completo: vacunasOk,
    },
    {
      clave: 'peso',
      emoji: '⚖️',
      titulo: 'Peso registrado',
      detalle: pesoOk
        ? 'Su peso se registró hace menos de 3 meses.'
        : 'En la próxima consulta le registran el peso.',
      puntos: 30,
      completo: pesoOk,
    },
    {
      clave: 'turno',
      emoji: '📅',
      titulo: 'Próximo control agendado',
      detalle: turnoOk ? 'Ya tiene un turno agendado.' : 'Agendá un turno con tu veterinaria.',
      puntos: 30,
      completo: turnoOk,
    },
  ];

  const puntaje = items.reduce((total, item) => total + (item.completo ? item.puntos : 0), 0);
  return { puntaje, items };
}

export function colorSalud(puntaje: number): string {
  if (puntaje >= 70) return COLORS.bosqueOscuro;
  if (puntaje >= 40) return COLORS.amarillo;
  return COLORS.error;
}

export function mensajeSalud(puntaje: number): string {
  if (puntaje >= 100) return '¡Cuidado perfecto! 🏆';
  if (puntaje >= 70) return '¡Muy bien! Te falta poco para el 100.';
  if (puntaje >= 40) return 'Vas bien. Completá las misiones de abajo.';
  return 'Sumá puntos completando las misiones de abajo.';
}
