import { Timestamp } from 'firebase/firestore';

export function formatDate(ts: Timestamp | null): string {
  if (!ts) return '—';
  return ts.toDate().toLocaleDateString('es-AR');
}

export function diasHasta(ts: Timestamp): number {
  const ahora = new Date();
  const ms = ts.toDate().getTime() - ahora.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

// Diferencia en días calendario (ignorando la hora) entre dos fechas:
// diasCalendarioEntre(ayer 23:59, hoy 00:01) === 1 aunque falten minutos
// para las 24 horas. Es lo que necesita la racha diaria.
export function diasCalendarioEntre(desde: Date, hasta: Date): number {
  const inicioDesde = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate());
  const inicioHasta = new Date(hasta.getFullYear(), hasta.getMonth(), hasta.getDate());
  return Math.round((inicioHasta.getTime() - inicioDesde.getTime()) / (24 * 60 * 60 * 1000));
}

export function edadEnAnios(fechaNacimiento: Timestamp): number {
  const hoy = new Date();
  const nacimiento = fechaNacimiento.toDate();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const todaviaNoCumplio =
    hoy.getMonth() < nacimiento.getMonth() ||
    (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() < nacimiento.getDate());
  if (todaviaNoCumplio) edad -= 1;
  return Math.max(edad, 0);
}

// Convierte "DD/MM/AAAA" a Timestamp. Devuelve null si el formato es inválido.
// Usamos texto simple en vez de un date-picker nativo para no agregar
// dependencias extra en esta primera versión.
export function parseFechaArgentina(texto: string): Timestamp | null {
  const match = texto.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, dia, mes, anio] = match;
  const fecha = new Date(Number(anio), Number(mes) - 1, Number(dia));
  if (Number.isNaN(fecha.getTime())) return null;
  return Timestamp.fromDate(fecha);
}

// Igual que parseFechaArgentina pero con hora: "DD/MM/AAAA HH:MM".
export function parseFechaHoraArgentina(fechaTexto: string, horaTexto: string): Timestamp | null {
  const matchFecha = fechaTexto.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  const matchHora = horaTexto.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!matchFecha || !matchHora) return null;
  const [, dia, mes, anio] = matchFecha;
  const [, hora, minuto] = matchHora;
  const fecha = new Date(Number(anio), Number(mes) - 1, Number(dia), Number(hora), Number(minuto));
  if (Number.isNaN(fecha.getTime())) return null;
  return Timestamp.fromDate(fecha);
}
