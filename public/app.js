/* ═══════════════════════════════════════════════════════════════
   Nappy — predicción de siestas y registro del bebé
   Sin dependencias. Los datos viven en el navegador (localStorage).
   ═══════════════════════════════════════════════════════════════ */
"use strict";

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const MIN = 60000, HOUR = 3600000, DAY = 86400000;

/* ─────────────── Estado ─────────────── */
const KEY = "nappy.v2";

const state = Object.assign(
  { baby: null, events: [], sleepingSince: null },
  (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } })()
);

const save = () => localStorage.setItem(KEY, JSON.stringify(state));

/* ─────────────── Tiempo ─────────────── */
const hhmm = (t) => new Date(t).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit", hour12: false });
const dayStart = (t = Date.now()) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
const dateKey = (t) => new Date(t - new Date(t).getTimezoneOffset() * MIN).toISOString().slice(0, 10);

function dur(ms) {
  const m = Math.max(0, Math.round(ms / MIN));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), r = m % 60;
  return r ? `${h} h ${r} min` : `${h} h`;
}
function durShort(ms) {
  const m = Math.max(0, Math.round(ms / MIN));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), r = m % 60;
  return r ? `${h}h ${String(r).padStart(2, "0")}m` : `${h}h`;
}
function localInput(t) {
  const d = new Date(t - new Date(t).getTimezoneOffset() * MIN);
  return d.toISOString().slice(0, 16);
}

/* ═══════════════════════════════════════════════════════════════
   CIENCIA DEL SUEÑO
   Cada franja describe la forma del día, no la ventana suelta: cuántas
   siestas, cuánto sueño diurno y cuántas horas dura la noche. La ventana
   de vigilia se deduce de ahí, así el día siempre cierra a una hora de
   dormir realista en lugar de irse acumulando hasta las diez de la noche. */
const BANDS = [
  //                                     siestas  sueño diurno  noche   sueño total
  { maxW: 4,   label: "recién nacido", naps: 5, dayNap: 420, night: 12,    total: 16.0 },
  { maxW: 8,   label: "1–2 meses",     naps: 5, dayNap: 350, night: 12,    total: 15.5 },
  { maxW: 13,  label: "2–3 meses",     naps: 4, dayNap: 300, night: 12,    total: 15.0 },
  { maxW: 17,  label: "3–4 meses",     naps: 4, dayNap: 260, night: 11.75, total: 14.5 },
  { maxW: 26,  label: "4–6 meses",     naps: 4, dayNap: 220, night: 11.5,  total: 14.0 },
  { maxW: 35,  label: "6–8 meses",     naps: 3, dayNap: 180, night: 11.5,  total: 13.8 },
  { maxW: 43,  label: "8–10 meses",    naps: 2, dayNap: 165, night: 11.5,  total: 13.5 },
  { maxW: 52,  label: "10–12 meses",   naps: 2, dayNap: 150, night: 11.5,  total: 13.5 },
  { maxW: 78,  label: "12–18 meses",   naps: 1, dayNap: 135, night: 11.5,  total: 13.0 },
  { maxW: 104, label: "18–24 meses",   naps: 1, dayNap: 120, night: 11.25, total: 12.5 },
  { maxW: 1e9, label: "2 años o más",  naps: 1, dayNap: 100, night: 11,    total: 12.0 },
];

const weeksOld = () =>
  Math.max(0, (Date.now() - new Date(state.baby.birth + "T00:00:00").getTime()) / (7 * DAY));

const band = () => BANDS.find((b) => weeksOld() <= b.maxW);

function ageText() {
  const w = Math.floor(weeksOld());
  if (w < 9) return `${w} semana${w === 1 ? "" : "s"}`;
  const m = Math.floor(weeksOld() / 4.345);
  if (m < 24) return `${m} mes${m === 1 ? "" : "es"}`;
  const y = Math.floor(m / 12), r = m % 12;
  return `${y} año${y === 1 ? "" : "s"}` + (r ? ` y ${r} mes${r === 1 ? "" : "es"}` : "");
}

/* Punto de partida por edad: la ventana de vigilia típica y la duración
   típica de siesta que se esperan a esa edad. Es solo el valor inicial;
   en cuanto hay registros propios, manda el bebé. */
const priorWake = (b) => Math.round((1440 - b.night * 60 - b.dayNap) / (b.naps + 1));
const priorNap  = (b) => Math.round(b.dayNap / b.naps);

/* ═══════════════════════════════════════════════════════════════
   RITMO APRENDIDO
   El ritmo no se fija por edad: se mide en el propio historial del
   bebé. Cada sueño registrado aporta una duración, y cada hueco entre
   dos sueños del mismo día aporta una ventana de vigilia.

   Dos correcciones sobre la media cruda:
   · los registros recientes pesan más (vida media de 5 días), porque el
     ritmo se va moviendo semana a semana;
   · con pocos datos el valor se apoya en el de la edad y se va soltando
     a medida que se acumulan registros (peso previo PRIOR_W).
   ═══════════════════════════════════════════════════════════════ */
const AGE_W = 1.5;        // cuántos registros "vale" la referencia por edad
const POS_W = 1.5;        // cuánto tira el ritmo global sobre cada posición
const HALF_LIFE = 5;      // días

function estimate(samples, prior, priorWeight) {
  let w = 0, acc = 0;
  for (const s of samples) {
    const k = Math.pow(0.5, s.age / HALF_LIFE);
    w += k; acc += k * s.value;
  }
  return (priorWeight * prior + acc) / (priorWeight + w);
}

function rhythm(now = Date.now()) {
  const b = band();
  const today = dayStart(now);

  const sleeps = state.events
    .filter((e) => e.type === "sueno" && e.end > e.ts)
    .sort((a, c) => a.ts - c.ts);

  /* Los sueños se agrupan por el día en el que terminan: el primero
     marca el despertar de la mañana y los siguientes son las siestas
     de ese día, en orden. Así cada siesta tiene una posición. */
  const byDay = new Map();
  sleeps.forEach((s) => {
    const d = dayStart(s.end);
    if (!byDay.has(d)) byDay.set(d, []);
    byDay.get(d).push(s);
  });

  const napAll = [], wakeAll = [], napAt = [], wakeAt = [];
  let daysUsed = 0;
  byDay.forEach((list, d) => {
    const age = (today - d) / DAY;
    if (age < 0 || age > 21) return;
    daysUsed++;

    let prevEnd = list[0].end;                       // despertar matutino
    list.slice(1)
      .filter((s) => s.end - s.ts <= 4 * HOUR && new Date(s.ts).getHours() < 19)
      .forEach((s, i) => {
        const len = (s.end - s.ts) / MIN;
        const gap = (s.ts - prevEnd) / MIN;
        if (len >= 10 && len <= 240) {
          napAll.push({ value: len, age });
          (napAt[i] ||= []).push({ value: len, age });
        }
        if (gap >= 20 && gap <= 360) {
          wakeAll.push({ value: gap, age });
          (wakeAt[i] ||= []).push({ value: gap, age });
        }
        prevEnd = s.end;
      });
  });

  /* Dos niveles: el ritmo típico del bebé se apoya en el de su edad, y
     cada posición del día se apoya en el ritmo típico del bebé. Con
     pocos datos todo tiende al valor general; con muchos, cada siesta
     encuentra su propia duración. */
  const wakeTypical = estimate(wakeAll, priorWake(b), AGE_W);
  const napTypical  = estimate(napAll,  priorNap(b),  AGE_W);

  return {
    wake: Math.round(wakeTypical),
    nap: Math.round(napTypical),
    /* isLast aplica el sesgo de final de día solo cuando esa posición
       todavía no tiene registros propios que ya lo reflejen. */
    wakeFor: (i, isLast) => {
      const s = wakeAt[i] || [];
      const base = s.length ? estimate(s, wakeTypical, POS_W) : wakeTypical * (isLast ? LAST_WAKE_F : 1);
      return Math.round(base);
    },
    napFor: (i, isLast) => {
      const s = napAt[i] || [];
      const base = s.length ? estimate(s, napTypical, POS_W) : napTypical * (isLast ? LAST_NAP_F : 1);
      return Math.round(base);
    },
    n: napAll.length + wakeAll.length,
    days: daysUsed,
    learned: napAll.length >= 4,
  };
}

const ORDINAL = ["Primera", "Segunda", "Tercera", "Cuarta", "Quinta", "Sexta", "Séptima"];
const napName = (i) => `${ORDINAL[i] || `${i + 1}.ª`} siesta`;

/* ═══════════════════════════════════════════════════════════════
   MOTOR DE PREDICCIÓN
   Ancla en el último despertar y encadena ventana de vigilia →
   siesta → ventana → siesta, hasta que ya no entra otra siesta antes
   de la noche. El número de siestas no se fija por edad: sale de ahí,
   y por eso un día tiene cuatro y otro cinco.

   Sobre el ritmo constante se aplican dos sesgos de final de día,
   medidos en el comportamiento real: la vigilia previa a la última
   siesta se alarga y esa última siesta se acorta.
   ═══════════════════════════════════════════════════════════════ */
const LAST_WAKE_F = 1.09;   // la vigilia antes de la última siesta se estira
const LAST_NAP_F  = 0.91;   // y esa siesta sale más corta
const CUE_LEAD    = 30;     // minutos de antelación para buscar señales de sueño
const LATEST_NAP  = 18.25;  // más tarde de esta hora ya no se propone siesta

function plan(now = Date.now()) {
  const b = band();
  const r = rhythm(now);
  const t0 = dayStart(now);

  /* Encadena siestas desde un ancla. Primera pasada con el ritmo
     uniforme para saber cuántas entran; segunda aplicando los sesgos
     a la que resulte ser la última del día. */
  const projectFrom = (anchor, from) => {
    let n = 0, a = anchor;
    while (n < 8) {
      const s = a + r.wakeFor(from + n, false) * MIN;
      if (s > t0 + LATEST_NAP * HOUR) break;
      a = s + r.napFor(from + n, false) * MIN;
      n++;
    }
    const out = [];
    a = anchor;
    for (let k = 0; k < n; k++) {
      const i = from + k, last = k === n - 1;
      const start = a + r.wakeFor(i, last) * MIN;
      const end = start + r.napFor(i, last) * MIN;
      out.push({ kind: "nap", index: i, start, end, est: true });
      a = end;
    }
    return out;
  };

  const sleeps = state.events
    .filter((e) => e.type === "sueno" && e.end)
    .sort((a, b2) => a.ts - b2.ts);

  /* El primer sueño que termina hoy pasadas las 4 de la mañana marca
     el despertar matutino; los siguientes son las siestas del día. */
  const endedToday = sleeps.filter((e) => e.end >= t0 + 4 * HOUR && e.end <= now);
  const morningWake = endedToday.length ? endedToday[0].end : null;
  const naps = endedToday.slice(1);
  const skipped = state.events.filter((e) => e.type === "omitida" && e.ts >= t0 && e.ts <= now);

  const blocks = naps.map((n, i) => ({ kind: "nap", index: i, start: n.ts, end: n.end, est: false, ev: n }));

  let index = naps.length + skipped.length;
  let anchor = Math.max(
    morningWake || t0 + 7 * HOUR,
    ...naps.map((n) => n.end),
    ...skipped.map((s) => s.ts)
  );

  let live = null;
  if (state.sleepingSince) {
    live = { kind: "nap", index, start: state.sleepingSince,
             end: state.sleepingSince + r.napFor(index, false) * MIN, est: true, live: true };
    blocks.push(live);
    anchor = live.end;
    index++;
  }

  const upcoming = projectFrom(anchor, index);
  blocks.push(...upcoming);
  if (upcoming.length) anchor = upcoming[upcoming.length - 1].end;

  /* La noche cierra el día: una última ventana desde el final del
     último sueño, acotada a un rango razonable. */
  let bedtime = anchor + Math.round(r.wake * LAST_WAKE_F) * MIN;
  bedtime = Math.min(Math.max(bedtime, t0 + 18 * HOUR), t0 + 21 * HOUR);
  const night = { kind: "night", start: bedtime, end: bedtime + b.night * HOUR, est: true };
  blocks.push(night);
  if (!live) upcoming.push(night);

  const next = live || upcoming.find((x) => x.end > now) || night;

  return {
    b, r, morningWake, naps, blocks,
    next, live, bedtime,
    firstAt: morningWake || t0 + 7 * HOUR,
    lastAt: night.start,
    hasData: !!morningWake,
  };
}

const blockTitle = (x) => (x.kind === "night" ? "Hora de dormir" : napName(x.index));

/* ═══════════════════════════════════════════════════════════════
   ICONOGRAFÍA — dibujada a mano, sin emoji en la interfaz principal
   ═══════════════════════════════════════════════════════════════ */
const P = {
  nap: `<circle cx="8.5" cy="8" r="3.3" fill="none" stroke="currentColor" stroke-width="1.5"/>
        <g stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
        <path d="M8.5 1.6v1.5M8.5 12.9v.6M1.9 8h1.5M13.6 8h.6M3.8 3.3l1 1M13.2 3.3l-1 1"/></g>
        <path d="M9.4 20.8a3.6 3.6 0 0 1 .3-7.2 4.9 4.9 0 0 1 9.3 1.4 2.9 2.9 0 0 1-.5 5.8z" fill="currentColor"/>`,
  night: `<path d="M20.4 14.9A8.4 8.4 0 0 1 9.6 4.1a8.4 8.4 0 1 0 10.8 10.8z" fill="currentColor"/>
          <path d="M17.2 3.1l.6 1.7 1.7.6-1.7.6-.6 1.7-.6-1.7-1.7-.6 1.7-.6z" fill="currentColor" opacity=".8"/>`,
  wake: `<circle cx="12" cy="12" r="4.2" fill="currentColor"/>
         <g stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
         <path d="M12 2.4v2.2M12 19.4v2.2M2.4 12h2.2M19.4 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6"/></g>`,
  breast: `<path d="M12 20.6S4.2 15.7 4.2 10.4A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 7.8 2.8c0 5.3-7.8 10.2-7.8 10.2z" fill="currentColor"/>`,
  bottle: `<path d="M9.3 2h5.4v1.5l-1.3 1.9V7h.4A3 3 0 0 1 16.8 10v8.6a3.4 3.4 0 0 1-3.4 3.4h-2.8a3.4 3.4 0 0 1-3.4-3.4V10a3 3 0 0 1 3-3h.4V5.4L9.3 3.5z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
           <path d="M7.2 12.6h9.6M7.2 15.8h9.6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`,
  solid: `<path d="M3.2 11h13.6a6.8 6.8 0 0 1-13.6 0z" fill="currentColor"/>
          <path d="M2.4 11h15.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          <path d="M20.6 3.4v17.2M20.6 3.4c1.4 1.6 1.4 4.6 0 6.2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>`,
  pee: `<path d="M12 2.6s6.3 6.9 6.3 10.9a6.3 6.3 0 1 1-12.6 0C5.7 9.5 12 2.6 12 2.6z" fill="currentColor"/>`,
  poo: `<path d="M7.6 21.4h8.8a3.1 3.1 0 0 0 .5-6.1 2.7 2.7 0 0 0-2-3.7 2.5 2.5 0 0 0-1.6-3.9c.5-1.4-.3-3-1.8-3.5.6 1.6 0 2.7-1.1 3.4-1.4.8-1.7 2.1-1 3.3-1.5.5-2.3 1.9-1.9 3.4a3.1 3.1 0 0 0 .1 7.1z" fill="currentColor"/>`,
  meds: `<rect x="2.6" y="8.6" width="18.8" height="6.8" rx="3.4" transform="rotate(-40 12 12)" fill="none" stroke="currentColor" stroke-width="1.7"/>
         <path d="M8.3 15.7l7.4-7.4" stroke="currentColor" stroke-width="1.7"/>`,
  note: `<path d="M5 3.6h14v16.8H5z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
         <path d="M8.4 8.4h7.2M8.4 12h7.2M8.4 15.6h4.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
  chart: `<path d="M4 20V9.5M10 20V4.6M16 20v-8M22 20H2" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>`,
  wave: `<path d="M2 9c2.6-3.4 5.2-3.4 7.8 0S15 12.4 17.6 9M2 16c2.6-3.4 5.2-3.4 7.8 0s5.2 3.4 7.8 0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`,
  bulb: `<path d="M12 2.6a6.5 6.5 0 0 0-3.8 11.8c.7.5 1.1 1.2 1.1 2v.4h5.4v-.4c0-.8.4-1.5 1.1-2A6.5 6.5 0 0 0 12 2.6z" fill="none" stroke="currentColor" stroke-width="1.6"/>
         <path d="M9.6 19.2h4.8M10.4 21.6h3.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>`,
  gear: `<circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" stroke-width="1.7"/>
         <path d="M12 2.4l1.5 2.4 2.8-.5.5 2.8 2.4 1.5-1.4 2.5 1.4 2.5-2.4 1.5-.5 2.8-2.8-.5L12 21.6l-1.5-2.4-2.8.5-.5-2.8-2.4-1.5L6.2 12 4.8 9.5l2.4-1.5.5-2.8 2.8.5z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>`,
  rain: `<path d="M8.6 14.4a4.2 4.2 0 0 1 .4-8.4 5.6 5.6 0 0 1 10.6 1.6 3.3 3.3 0 0 1-.6 6.8z" fill="currentColor"/>
         <g stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M8 17.4l-1 3M13 17.4l-1 3M18 17.4l-1 3"/></g>`,
  heart: `<path d="M12 21.2C7 17.6 2.6 14.2 2.6 10.2A4.6 4.6 0 0 1 12 7.5a4.6 4.6 0 0 1 9.4 2.7c0 4-4.4 7.4-9.4 11z" fill="none" stroke="currentColor" stroke-width="1.7"/>
          <path d="M2.6 12h4.6l1.6-3 2.4 6 2-4.4 1.4 1.4h6.8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`,
  fog: `<g stroke="currentColor" stroke-width="1.9" stroke-linecap="round">
        <path d="M3 6.6h18M3 11h18M3 15.4h13M3 19.8h18"/></g>`,
};

const svg = (name, cls = "") =>
  `<svg viewBox="0 0 24 24" fill="none" class="${cls}" aria-hidden="true">${P[name] || ""}</svg>`;

/* ═══════════════════════════════════════════════════════════════
   TIPOS DE REGISTRO
   ═══════════════════════════════════════════════════════════════ */
const TYPES = {
  sueno:  { icon: "nap",    label: "Sueño",    color: "var(--luna)" },
  pecho:  { icon: "breast", label: "Pecho",    color: "var(--dawn)" },
  bibe:   { icon: "bottle", label: "Biberón",  color: "var(--dawn)" },
  solido: { icon: "solid",  label: "Sólidos",  color: "var(--dawn)" },
  pis:    { icon: "pee",    label: "Pis",      color: "var(--amber)" },
  caca:   { icon: "poo",    label: "Caca",     color: "var(--amber)" },
  medic:  { icon: "meds",   label: "Medicina", color: "var(--rose)" },
  nota:   { icon: "note",   label: "Nota",     color: "var(--dim)" },
};
const FEEDS = ["pecho", "bibe", "solido"];
const isNightSleep = (e) => e.end && e.end - e.ts > 5 * HOUR;

const eventTitle = (e) =>
  e.type === "sueno" ? (isNightSleep(e) ? "Sueño nocturno" : "Siesta") : (TYPES[e.type] || TYPES.nota).label;

const eventIcon = (e) =>
  e.type === "sueno" && isNightSleep(e) ? "night" : (TYPES[e.type] || TYPES.nota).icon;

function eventSubtitle(e) {
  const bits = [];
  if (e.type === "sueno" && e.end) bits.push(`${hhmm(e.ts)} – ${hhmm(e.end)} · ${dur(e.end - e.ts)}`);
  if (e.type === "pecho") { if (e.side) bits.push({ izq: "Izquierdo", der: "Derecho", ambos: "Ambos" }[e.side]); if (e.mins) bits.push(`${e.mins} min`); }
  if (e.type === "bibe" && e.ml) bits.push(`${e.ml} ml`);
  if (e.note) bits.push(e.note);
  return bits.join(" · ");
}

/* ═══════════════════════════════════════════════════════════════
   EL ANILLO
   El día se dibuja como un arco de 250°, desde el despertar de la
   mañana hasta la hora de dormir. Cada sueño es una cápsula cuya
   longitud de arco equivale a su duración real.
   ═══════════════════════════════════════════════════════════════ */
const CX = 160, CY = 160, R = 118, A0 = 200, A1 = 450;

/* Ángulos en grados, medidos en sentido horario desde las 12 en punto. */
const pt = (r, a) => {
  const rad = (a * Math.PI) / 180;
  return [CX + r * Math.sin(rad), CY - r * Math.cos(rad)];
};

function arc(r, a1, a2) {
  const [x1, y1] = pt(r, a1), [x2, y2] = pt(r, a2);
  const large = Math.abs(a2 - a1) > 180 ? 1 : 0;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

function renderRing() {
  const p = plan();
  const now = Date.now();
  const span = Math.max(p.lastAt - p.firstAt, 6 * HOUR);
  const ang = (t) => A0 + ((Math.min(Math.max(t, p.firstAt), p.lastAt) - p.firstAt) / span) * (A1 - A0);

  const out = [`<path class="ring-track" d="${arc(R, A0, A1)}"/>`];

  if (p.hasData && now > p.firstAt) out.push(`<path class="ring-elapsed" d="${arc(R, A0, ang(now))}"/>`);

  // Cada sueño: una cápsula proporcional a su duración
  p.blocks.forEach((blk) => {
    const a1 = ang(blk.start);
    const a2 = Math.max(ang(blk.end), a1 + 2.4);
    const cls = blk.live ? "arc-sleep live" : blk.est ? "arc-sleep est" : "arc-sleep";
    out.push(`<path class="${cls}" d="${arc(R, a1, a2)}"/>`);

    const mid = (a1 + a2) / 2;
    const [ix, iy] = pt(R, mid);
    const color = blk.est ? "var(--luna)" : "var(--luna-d)";
    out.push(`<circle cx="${ix.toFixed(1)}" cy="${iy.toFixed(1)}" r="15" class="node-bg"/>
      <circle cx="${ix.toFixed(1)}" cy="${iy.toFixed(1)}" r="15" class="node-ring"
        stroke="${color}" ${blk.est ? 'stroke-dasharray="2 3"' : ""}/>
      <svg x="${(ix - 9).toFixed(1)}" y="${(iy - 9).toFixed(1)}" width="18" height="18" viewBox="0 0 24 24"
        fill="none" style="color:${color}">${P[blk.kind === "night" ? "night" : "nap"]}</svg>`);

    // El despertar cierra cada siesta ya registrada
    if (!blk.est && blk.kind === "nap") {
      const [wx, wy] = pt(R, a2);
      out.push(`<circle cx="${wx.toFixed(1)}" cy="${wy.toFixed(1)}" r="9" class="node-bg"/>
        <circle cx="${wx.toFixed(1)}" cy="${wy.toFixed(1)}" r="9" class="node-ring" stroke="var(--dawn)"/>
        <svg x="${(wx - 5.5).toFixed(1)}" y="${(wy - 5.5).toFixed(1)}" width="11" height="11" viewBox="0 0 24 24"
          fill="none" style="color:var(--dawn)">${P.wake}</svg>`);
    }
  });

  // Tomas y pañales, en una órbita exterior
  state.events
    .filter((e) => e.ts >= p.firstAt && e.ts <= p.lastAt && e.type !== "sueno" && e.type !== "omitida")
    .forEach((e) => {
      const [x, y] = pt(R + 22, ang(e.ts));
      const c = FEEDS.includes(e.type) ? "var(--dawn)" : "var(--amber)";
      out.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.4" fill="${c}" opacity=".85"/>`);
    });

  /* Cada siesta prevista se rotula con su ventana. Las dos horas van a
     radios distintos: en una siesta de media hora el arco es tan corto
     que a la misma distancia se solaparían. */
  p.blocks.filter((x) => x.est && x.kind === "nap" && !x.live).forEach((blk) => {
    [[blk.start, R + 27], [blk.end, R + 45]].forEach(([t, rad]) => {
      const a = ang(t);
      const [lx, ly] = pt(rad, a);
      out.push(`<text class="tick-label" x="${lx.toFixed(1)}" y="${ly.toFixed(1)}"
        text-anchor="middle" dominant-baseline="middle"
        transform="rotate(${(a - 90).toFixed(1)} ${lx.toFixed(1)} ${ly.toFixed(1)})">${hhmm(t)}</text>`);
    });
  });

  // Aguja de la hora actual
  if (p.hasData && now >= p.firstAt && now <= p.lastAt) {
    const a = ang(now);
    const [x1, y1] = pt(R - 17, a), [x2, y2] = pt(R + 13, a);
    out.push(`<path class="now-hand" d="M ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)}"/>`);
  }

  $("#ring").innerHTML = out.join("");
  renderCore(p, now);
}

function renderCore(p, now) {
  const label = $("#core-label"), value = $("#core-value"), note = $("#core-note");

  if (p.live) {
    label.textContent = "Durmiendo hace";
    value.textContent = durShort(now - p.live.start);
    note.textContent = `Podría despertarse ~${hhmm(p.live.end)}`;
    return;
  }
  if (!p.hasData) {
    label.textContent = "Buenos días";
    value.textContent = "—";
    note.textContent = "Registrá el despertar para empezar";
    return;
  }
  const left = p.next.start - now;
  label.textContent = `${blockTitle(p.next)} en`;
  value.textContent = left <= 0 ? "Ahora" : durShort(left);
  note.textContent = left <= 0 ? `Prevista ${hhmm(p.next.start)}` : `Aprox. ${hhmm(p.next.start)}`;
}

/* ═══════════════════════════════════════════════════════════════
   HOJA INFERIOR — qué hacer ahora mismo
   ═══════════════════════════════════════════════════════════════ */
function renderSheet() {
  const p = plan();
  const now = Date.now();
  const sheet = $("#sheet");

  if (p.live) {
    sheet.innerHTML = `
      <div class="sheet-badge live">${svg("nap")}</div>
      <p class="sheet-kicker">Durmiendo desde las ${hhmm(p.live.start)}</p>
      <p class="sheet-window">${durShort(now - p.live.start)}</p>
      <p class="sheet-len">Duración prevista ${dur(p.live.end - p.live.start)}</p>
      <p class="sheet-tip">Si sigue durmiendo pasadas las ${hhmm(p.live.end)}, dejala descansar salvo que se acerque la hora de dormir.</p>
      <div class="sheet-actions">
        <button class="btn btn-primary" data-act="wake">Se despertó</button>
      </div>`;
    return;
  }

  if (!p.hasData) {
    sheet.innerHTML = `
      <div class="sheet-badge">${svg("wake")}</div>
      <p class="sheet-kicker">Todavía no hay datos de hoy</p>
      <p class="sheet-window">¿Ya se despertó?</p>
      <p class="sheet-tip">Con la hora del despertar de la mañana, Nappy calcula todas las siestas del día y la hora de dormir.</p>
      <div class="sheet-actions">
        <button class="btn btn-ghost" data-act="sleep">Se durmió</button>
        <button class="btn btn-primary" data-act="woke">Se despertó</button>
      </div>`;
    return;
  }

  const n = p.next;
  const isNight = n.kind === "night";
  const signsAt = n.start - CUE_LEAD * MIN;
  const late = now > n.start;

  sheet.innerHTML = `
    <div class="sheet-badge">${svg(isNight ? "night" : "nap")}</div>
    <p class="sheet-kicker">${isNight ? "Hora estimada de dormir" : "Hora estimada de siesta"}</p>
    <p class="sheet-window">${hhmm(n.start)}${isNight ? "" : ` – ${hhmm(n.end)}`}</p>
    <p class="sheet-len">${isNight ? "Sueño nocturno" : `${dur(n.end - n.start)} de duración`}</p>
    <p class="sheet-tip">${
      late
        ? `La ventana de vigilia ya se cumplió. Bajá los estímulos y probá acostarla ahora: pasarse de la ventana suele costar más llanto.`
        : isNight
        ? `Empezá la rutina de la noche a partir de las ${hhmm(signsAt)}: luz baja, ambiente tranquilo y siempre el mismo orden.`
        : `Evitá las actividades emocionantes y buscá señales de sueño a partir de las ${hhmm(signsAt)}.`
    }</p>
    <div class="sheet-actions">
      <button class="btn btn-ghost" data-act="skip">Omitir</button>
      <button class="btn btn-primary" data-act="sleep">Registrar</button>
    </div>`;
}

/* El ritmo con el que se está calculando, a la vista: sin esto la
   predicción es una caja negra y no se entiende por qué cambia. */
function renderRhythm() {
  const r = rhythm();
  const source = r.learned
    ? `Aprendido de ${r.n} medidas en ${r.days} día${r.days === 1 ? "" : "s"} de registros`
    : r.n > 0
    ? `Ajustándose: ${r.n} medida${r.n === 1 ? "" : "s"} sobre la referencia de ${band().label}`
    : `Referencia para ${band().label}. Registrá sueños y se ajusta al ritmo real`;

  $("#rhythm").innerHTML = `
    <div class="rhythm-pair">
      <div><span class="rhythm-val">${dur(r.wake * MIN)}</span><span class="rhythm-lbl">Ventana de vigilia</span></div>
      <div><span class="rhythm-val">${dur(r.nap * MIN)}</span><span class="rhythm-lbl">Siesta habitual</span></div>
    </div>
    <p class="rhythm-src">${source}</p>`;
}

$("#sheet").addEventListener("click", (e) => {
  const act = e.target.closest("[data-act]")?.dataset.act;
  if (!act) return;
  if (act === "sleep") startSleep();
  if (act === "wake") stopSleep();
  if (act === "woke") markWoke();
  if (act === "skip") skipNap();
});

/* ─────────────── Acciones de sueño ─────────────── */
function startSleep() {
  state.sleepingSince = Date.now();
  save(); refreshToday();
  toast(`${state.baby.name} se durmió`);
}
function stopSleep() {
  if (!state.sleepingSince) return;
  const start = state.sleepingSince;
  state.sleepingSince = null;
  addEvent({ type: "sueno", ts: start, end: Date.now() });
  refreshToday();
  toast(`Sueño de ${dur(Date.now() - start)} registrado`);
}
function markWoke() {
  addEvent({ type: "sueno", ts: Date.now() - MIN, end: Date.now() });
  refreshToday();
  toast("Despertar registrado. Ya podés ver el plan del día");
}
function skipNap() {
  addEvent({ type: "omitida", ts: Date.now() });
  refreshToday();
  toast("Siesta omitida. Recalculando el día");
}

/* ═══════════════════════════════════════════════════════════════
   REGISTRO
   ═══════════════════════════════════════════════════════════════ */
let viewDay = dayStart();
let editing = null;
let logType = "pecho";

function addEvent(ev) {
  ev.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  ev.ts = ev.ts || Date.now();
  state.events.push(ev);
  state.events.sort((a, b) => a.ts - b.ts);
  save();
}

function eventsOn(day) {
  return state.events
    .filter((e) => e.type !== "omitida" && e.ts >= day && e.ts < day + DAY)
    .sort((a, b) => b.ts - a.ts);
}

function renderQuick() {
  const html = ["pecho", "bibe", "pis", "caca"]
    .map((t) => `<button class="quick" data-quick="${t}">
        <span style="color:${TYPES[t].color}">${svg(TYPES[t].icon)}</span>${TYPES[t].label}</button>`)
    .join("");
  $$("[data-quickgrid]").forEach((el) => (el.innerHTML = html));
}

function renderDay() {
  const isToday = viewDay === dayStart();
  $("#day-title").textContent = isToday
    ? "Hoy"
    : new Date(viewDay).toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" });
  $("#day-next").disabled = isToday;

  const evs = eventsOn(viewDay);

  // Resumen
  let sleepMs = 0, nightMs = 0;
  state.events.forEach((e) => {
    if (e.type !== "sueno" || !e.end) return;
    const s = Math.max(e.ts, viewDay), en = Math.min(e.end, viewDay + DAY);
    if (en > s) sleepMs += en - s;
  });
  if (state.sleepingSince) {
    const s = Math.max(state.sleepingSince, viewDay), en = Math.min(Date.now(), viewDay + DAY);
    if (en > s) sleepMs += en - s;
  }
  const feeds = evs.filter((e) => FEEDS.includes(e.type)).length;
  const ml = evs.filter((e) => e.type === "bibe").reduce((a, e) => a + (Number(e.ml) || 0), 0);
  const diapers = evs.filter((e) => e.type === "pis" || e.type === "caca").length;
  const napCount = evs.filter((e) => e.type === "sueno" && e.end && e.end - e.ts < 5 * HOUR).length;

  $("#daysum").innerHTML = [
    [durShort(sleepMs), "Sueño total"],
    [napCount, "Sueños"],
    [feeds, "Tomas"],
    [ml ? `${ml} ml` : "—", "Biberón"],
    [diapers, "Pañales"],
  ].map(([v, l]) => `<div class="sum-cell"><div class="sum-val">${v}</div><div class="sum-lbl">${l}</div></div>`).join("");

  // Actividad
  $("#feed").innerHTML = evs.length
    ? evs.map((e) => {
        const t = TYPES[e.type] || TYPES.nota;
        const sub = eventSubtitle(e);
        return `<li><button class="feed-item" data-edit="${e.id}">
          <span class="feed-icon" style="color:${t.color}">${svg(eventIcon(e))}</span>
          <span class="feed-body">
            <span class="feed-title">${eventTitle(e)}</span>
            ${sub ? `<span class="feed-sub">${escapeHtml(sub)}</span>` : ""}
          </span>
          <span class="feed-time">${hhmm(e.ts)}</span>
        </button></li>`;
      }).join("")
    : `<li class="empty">Sin registros este día.</li>`;
}

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ─────────────── Modal de registro ─────────────── */
function openLog(type = "pecho", ev = null) {
  editing = ev;
  logType = ev ? ev.type : type;
  $("#log-title").textContent = ev ? "Editar registro" : "Registrar";
  $("#log-delete").hidden = !ev;
  $("#log-time").value = localInput(ev ? ev.ts : Date.now());
  $("#log-note").value = ev?.note || "";
  renderTypeGrid();
  $("#log-dialog").showModal();
}

function renderTypeGrid() {
  $("#typegrid").innerHTML = Object.entries(TYPES)
    .map(([k, t]) => `<button type="button" class="type ${k === logType ? "on" : ""}" data-type="${k}">
        <span style="color:${k === logType ? t.color : "inherit"}">${svg(t.icon)}</span>${t.label}</button>`)
    .join("");
  $("#log-time-label").textContent = logType === "sueno" ? "Se durmió" : "Hora";
  renderExtra();
}

function renderExtra() {
  const box = $("#log-extra");
  const e = editing;
  if (logType === "sueno") {
    const end = e?.end ?? (e ? null : Date.now());
    box.innerHTML = `<div class="field"><label for="x-end">Se despertó</label>
      <input type="datetime-local" id="x-end" value="${end ? localInput(end) : ""}"></div>
      <p class="field-note" id="x-dur"></p>`;
    const paint = () => {
      const a = new Date($("#log-time").value).getTime();
      const b = new Date($("#x-end").value).getTime();
      $("#x-dur").textContent =
        Number.isFinite(a) && Number.isFinite(b) && b > a ? `Duración: ${dur(b - a)}` : "";
    };
    $("#x-end").addEventListener("input", paint);
    $("#log-time").addEventListener("input", paint);
    paint();
  } else if (logType === "pecho") {
    const side = e?.side || "izq";
    box.innerHTML = `<div class="field"><label>Lado</label><div class="seg" id="side-seg">
        ${[["izq", "Izquierdo"], ["der", "Derecho"], ["ambos", "Ambos"]]
          .map(([v, l]) => `<button type="button" data-side="${v}" class="${v === side ? "on" : ""}">${l}</button>`).join("")}
      </div></div>
      <div class="field"><label for="x-mins">Duración (min)</label>
        <input type="number" id="x-mins" min="0" max="180" inputmode="numeric" value="${e?.mins ?? ""}" placeholder="15"></div>`;
    $("#side-seg").addEventListener("click", (ev2) => {
      const b = ev2.target.closest("[data-side]");
      if (!b) return;
      $$("#side-seg button").forEach((x) => x.classList.toggle("on", x === b));
    });
  } else if (logType === "bibe") {
    box.innerHTML = `<div class="field"><label for="x-ml">Cantidad (ml)</label>
      <input type="number" id="x-ml" min="0" max="500" inputmode="numeric" value="${e?.ml ?? ""}" placeholder="120"></div>`;
  } else {
    box.innerHTML = "";
  }
}

$("#typegrid").addEventListener("click", (e) => {
  const b = e.target.closest("[data-type]");
  if (!b) return;
  logType = b.dataset.type;
  renderTypeGrid();
});

$("#log-save").addEventListener("click", () => {
  const ts = new Date($("#log-time").value).getTime();
  if (!Number.isFinite(ts)) return toast("Elegí una hora válida");

  const data = { type: logType, ts, note: $("#log-note").value.trim() || undefined };
  if (logType === "sueno") {
    const end = new Date($("#x-end").value).getTime();
    if (!Number.isFinite(end)) return toast("Indicá a qué hora se despertó");
    if (end <= ts) return toast("El despertar tiene que ser posterior al inicio");
    data.end = end;
  }
  if (logType === "pecho") {
    data.side = $("#side-seg .on")?.dataset.side;
    data.mins = Number($("#x-mins").value) || undefined;
  }
  if (logType === "bibe") data.ml = Number($("#x-ml").value) || undefined;
  if (logType !== "sueno") data.end = undefined;   // al cambiar de tipo no queda un fin huérfano

  if (editing) {
    Object.assign(editing, data);
    state.events.sort((a, b) => a.ts - b.ts);
    save();
  } else {
    addEvent(data);
  }
  $("#log-dialog").close();
  refreshAll();
  toast(`${TYPES[logType].label} ${editing ? "actualizado" : "registrado"}`);
});

$("#log-delete").addEventListener("click", () => {
  if (!editing) return;
  state.events = state.events.filter((x) => x.id !== editing.id);
  save();
  $("#log-dialog").close();
  refreshAll();
  toast("Registro eliminado");
});

$("#log-close").addEventListener("click", () => $("#log-dialog").close());
$("#fab").addEventListener("click", () => openLog("pecho"));

document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-quickgrid] [data-quick]")?.dataset.quick;
  if (!t) return;
  addEvent({ type: t });
  refreshAll();
  toast(`${TYPES[t].label} registrado a las ${hhmm(Date.now())}`);
});

$("#feed").addEventListener("click", (e) => {
  const id = e.target.closest("[data-edit]")?.dataset.edit;
  const ev = state.events.find((x) => x.id === id);
  if (ev) openLog(ev.type, ev);
});

$("#day-prev").addEventListener("click", () => { viewDay -= DAY; renderDay(); });
$("#day-next").addEventListener("click", () => { viewDay = Math.min(viewDay + DAY, dayStart()); renderDay(); });

/* ═══════════════════════════════════════════════════════════════
   SONIDOS — sintetizados en vivo con Web Audio
   ═══════════════════════════════════════════════════════════════ */
const SOUNDS = {
  blanco:  { icon: "fog",   name: "Ruido blanco", desc: "Constante y neutro" },
  lluvia:  { icon: "rain",  name: "Lluvia",       desc: "Suave, sobre el techo" },
  vientre: { icon: "heart", name: "Vientre",      desc: "Con latido materno" },
  olas:    { icon: "wave",  name: "Olas",         desc: "Van y vienen" },
};

let audio = { ctx: null, master: null, nodes: [], current: null, off: null };

function renderSounds() {
  $("#soundgrid").innerHTML = Object.entries(SOUNDS)
    .map(([k, s]) => `<button class="sound" data-sound="${k}">${svg(s.icon)}
      <span>${s.name}<small>${s.desc}</small></span></button>`)
    .join("");
}

function noise(ctx) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf; src.loop = true;
  return src;
}

function playSound(kind) {
  stopSound(false);
  const ctx = audio.ctx || new (window.AudioContext || window.webkitAudioContext)();
  audio.ctx = ctx; ctx.resume();

  const master = ctx.createGain();
  master.gain.value = ($("#vol").value / 100) * 0.6;
  master.connect(ctx.destination);
  audio.master = master;
  audio.current = kind;

  if (kind === "blanco") {
    const s = noise(ctx), lp = ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 6200;
    s.connect(lp).connect(master); s.start();
    audio.nodes = [s];
  }
  if (kind === "lluvia") {
    const s = noise(ctx), bp = ctx.createBiquadFilter(), hp = ctx.createBiquadFilter();
    bp.type = "bandpass"; bp.frequency.value = 2400; bp.Q.value = 0.4;
    hp.type = "highpass"; hp.frequency.value = 480;
    s.connect(bp).connect(hp).connect(master); s.start();
    audio.nodes = [s];
  }
  if (kind === "vientre") {
    const s = noise(ctx), lp = ctx.createBiquadFilter(), g = ctx.createGain();
    lp.type = "lowpass"; lp.frequency.value = 300; g.gain.value = 0.85;
    s.connect(lp).connect(g).connect(master); s.start();

    const beat = ctx.createOscillator(), bg = ctx.createGain();
    beat.type = "sine"; beat.frequency.value = 58; bg.gain.value = 0.0001;
    beat.connect(bg).connect(master); beat.start();
    const iv = setInterval(() => {
      if (!audio.ctx || audio.current !== "vientre") return;
      const t = ctx.currentTime;
      bg.gain.cancelScheduledValues(t);
      bg.gain.setValueAtTime(0.0001, t);
      bg.gain.exponentialRampToValueAtTime(0.45, t + 0.04);
      bg.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
    }, 60000 / 140);                                    // ~140 lpm, como se oye desde dentro
    audio.nodes = [s, beat, { stop: () => clearInterval(iv) }];
  }
  if (kind === "olas") {
    const s = noise(ctx), lp = ctx.createBiquadFilter(), swell = ctx.createGain();
    lp.type = "lowpass"; lp.frequency.value = 850; swell.gain.value = 0.55;
    s.connect(lp).connect(swell).connect(master); s.start();
    const lfo = ctx.createOscillator(), lg = ctx.createGain();
    lfo.frequency.value = 0.09; lg.gain.value = 0.45;
    lfo.connect(lg).connect(swell.gain); lfo.start();
    audio.nodes = [s, lfo];
  }

  $$(".sound").forEach((b) => b.classList.toggle("on", b.dataset.sound === kind));
  $("#sound-panel").hidden = false;
  $("#now-playing").textContent = `Sonando: ${SOUNDS[kind].name}`;
  armOffTimer();
}

function stopSound(ui = true) {
  audio.nodes.forEach((n) => { try { n.stop(); } catch {} });
  audio.nodes = []; audio.current = null;
  clearTimeout(audio.off);
  if (ui) { $$(".sound").forEach((b) => b.classList.remove("on")); $("#sound-panel").hidden = true; }
}

function armOffTimer() {
  clearTimeout(audio.off);
  const m = Number($("#offtimer").value);
  if (m > 0 && audio.current) audio.off = setTimeout(() => { stopSound(); toast("Sonido apagado"); }, m * MIN);
}

$("#soundgrid").addEventListener("click", (e) => {
  const k = e.target.closest("[data-sound]")?.dataset.sound;
  if (!k) return;
  audio.current === k ? stopSound() : playSound(k);
});
$("#sound-stop").addEventListener("click", () => stopSound());
$("#vol").addEventListener("input", (e) => { if (audio.master) audio.master.gain.value = (e.target.value / 100) * 0.6; });
$("#offtimer").addEventListener("change", armOffTimer);

/* ═══════════════════════════════════════════════════════════════
   TENDENCIAS
   ═══════════════════════════════════════════════════════════════ */
function series(days = 7) {
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d0 = dayStart() - i * DAY, d1 = d0 + DAY;
    let ms = 0;
    state.events.forEach((e) => {
      if (e.type !== "sueno" || !e.end) return;
      const s = Math.max(e.ts, d0), en = Math.min(e.end, d1);
      if (en > s) ms += en - s;
    });
    if (state.sleepingSince) {
      const s = Math.max(state.sleepingSince, d0), en = Math.min(Date.now(), d1);
      if (en > s) ms += en - s;
    }
    const feeds = state.events.filter((e) => FEEDS.includes(e.type) && e.ts >= d0 && e.ts < d1).length;
    out.push({ day: d0, hours: ms / HOUR, feeds });
  }
  return out;
}

function roundRect(c, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function drawBars(canvas, data, valueOf, fmt, goal) {
  const c = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  const pad = { t: 26, r: 10, b: 34, l: 34 };
  const pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;
  const max = Math.max(goal ? goal + 2 : 0, ...data.map(valueOf), 4);
  const y = (v) => pad.t + ph * (1 - v / max);

  c.clearRect(0, 0, W, H);
  c.font = '600 12px ui-rounded, "Nunito", system-ui, sans-serif';

  const step = max > 12 ? 4 : max > 6 ? 2 : 1;
  c.textAlign = "right";
  for (let v = 0; v <= max; v += step) {
    c.strokeStyle = "rgba(255,255,255,.07)";
    c.beginPath(); c.moveTo(pad.l, y(v)); c.lineTo(W - pad.r, y(v)); c.stroke();
    c.fillStyle = "#6d6b99";
    c.fillText(String(v), pad.l - 7, y(v) + 4);
  }

  if (goal) {
    c.strokeStyle = "rgba(116,214,164,.65)"; c.setLineDash([5, 5]);
    c.beginPath(); c.moveTo(pad.l, y(goal)); c.lineTo(W - pad.r, y(goal)); c.stroke();
    c.setLineDash([]);
  }

  const slot = pw / data.length, bw = Math.min(34, slot * 0.5);
  data.forEach((d, i) => {
    const v = valueOf(d);
    const cx = pad.l + slot * (i + 0.5);
    const last = i === data.length - 1;
    if (v > 0) {
      const g = c.createLinearGradient(0, y(v), 0, y(0));
      g.addColorStop(0, last ? "#e0d6ff" : "#c2b4ff");
      g.addColorStop(1, last ? "#7b6bd6" : "#4b4291");
      c.fillStyle = g;
      roundRect(c, cx - bw / 2, y(v), bw, y(0) - y(v), 7);
      c.fill();
      c.fillStyle = last ? "#f6c98b" : "#9491c4";
      c.textAlign = "center";
      c.fillText(fmt(v), cx, y(v) - 8);
    }
    c.fillStyle = last ? "#eeecff" : "#6d6b99";
    c.textAlign = "center";
    c.fillText(new Date(d.day).toLocaleDateString("es", { weekday: "short" }).replace(".", ""), cx, H - pad.b + 20);
  });
}

function renderTrends() {
  const data = series(7);
  const b = band();
  const done = data.filter((d) => d.hours > 0);
  const avg = done.length ? done.reduce((a, d) => a + d.hours, 0) / done.length : 0;
  const todayFeeds = data[data.length - 1].feeds;

  $("#statrow").innerHTML = [
    [durShort(data[data.length - 1].hours * HOUR), "Sueño hoy"],
    [avg ? `${avg.toFixed(1)} h` : "—", "Media 7 días"],
    [todayFeeds, "Tomas hoy"],
  ].map(([v, l]) => `<div class="stat"><div class="stat-val">${v}</div><div class="stat-lbl">${l}</div></div>`).join("");

  $("#goal-hint").textContent = `objetivo ${b.total} h`;
  drawBars($("#chart"), data, (d) => d.hours, (v) => v.toFixed(1), b.total);
  drawBars($("#chart-feeds"), data, (d) => d.feeds, (v) => String(v), 0);

  const sleeps = state.events.filter((e) => e.type === "sueno" && e.end).sort((a, b2) => b2.ts - a.ts).slice(0, 15);
  $("#sleeplog").innerHTML = sleeps.length
    ? sleeps.map((e) => `<li class="feed-item" style="cursor:default">
        <span class="feed-icon" style="color:var(--luna)">${svg(e.end - e.ts > 5 * HOUR ? "night" : "nap")}</span>
        <span class="feed-body">
          <span class="feed-title">${hhmm(e.ts)} – ${hhmm(e.end)}</span>
          <span class="feed-sub">${new Date(e.ts).toLocaleDateString("es", { weekday: "long", day: "numeric", month: "short" })}</span>
        </span>
        <span class="feed-time">${dur(e.end - e.ts)}</span></li>`).join("")
    : `<li class="empty">Todavía no hay sueños registrados.</li>`;
}

/* ═══════════════════════════════════════════════════════════════
   CONSEJOS
   ═══════════════════════════════════════════════════════════════ */
const TIPS = [
  { maxW: 13, list: [
    ["El día y la noche se aprenden", "Un recién nacido no distingue el día de la noche. Luz natural y ruido normal durante el día, penumbra y calma en las tomas nocturnas: así madura su reloj interno en pocas semanas."],
    ["Las ventanas son cortísimas", "A esta edad aguanta despierta entre 45 y 75 minutos. Pasarse de esa ventana no produce más cansancio útil: produce cortisol, llanto y una siesta peor."],
    ["El contacto es la herramienta", "Porteo, piel con piel y movimiento suave reproducen las condiciones del vientre. A esta edad no se crean malos hábitos: se cubre una necesidad."],
  ]},
  { maxW: 26, list: [
    ["Una rutina corta y siempre igual", "Diez minutos bastan: cambio de pañal, pijama, luz baja, la misma canción. La previsibilidad es lo que hace de señal, no la duración."],
    ["Lo de los 4 meses no es un retroceso", "Alrededor de los 4 meses el sueño madura y aparecen ciclos con fases ligeras. Que se despierte más es una señal de desarrollo, no un problema que arreglar."],
    ["Adormilada, pero despierta", "De vez en cuando acostala somnolienta antes de que se duerma del todo. Practicar el último tramo sola es lo que le permitirá enlazar ciclos de madrugada."],
  ]},
  { maxW: 52, list: [
    ["Cuidá la última siesta del día", "Si termina muy tarde, la hora de dormir se corre. El último tramo despierto debe ser el más largo del día; si hace falta, acortá esa siesta."],
    ["La ansiedad por separación es una etapa", "Entre los 8 y los 10 meses muchos bebés protestan al quedarse solos. Respuesta tranquila y constante: se atraviesa, no se corrige."],
    ["El ambiente hace la mitad del trabajo", "Oscuridad real, 19–21 °C y un ruido constante de fondo. Son tres condiciones baratas que alargan las siestas más que cualquier técnica."],
  ]},
  { maxW: 1e9, list: [
    ["El paso a una sola siesta", "Entre los 12 y los 18 meses se pasa de dos siestas a una. Hacelo gradual: atrasá la de la mañana de a 15 minutos por semana hasta el mediodía."],
    ["Límites con cariño", "Aparecen las negociaciones a la hora de dormir. Una rutina firme y afectuosa funciona mejor que alargar la conversación: el límite tranquiliza."],
    ["Movimiento durante el día", "El juego activo y el aire libre mejoran la profundidad del sueño nocturno más que cualquier ajuste de horario."],
  ]},
];

function renderTips() {
  $("#tips-band").textContent = band().label;
  $("#tips").innerHTML = TIPS.find((t) => weeksOld() <= t.maxW).list
    .map(([h, p]) => `<article class="tip"><h3>${h}</h3><p>${p}</p></article>`).join("");
}

/* ═══════════════════════════════════════════════════════════════
   NAVEGACIÓN Y CICLO DE VIDA
   ═══════════════════════════════════════════════════════════════ */
const TABS = [
  ["hoy", "Hoy", "nap"],
  ["registro", "Registro", "note"],
  ["sonidos", "Sonidos", "wave"],
  ["tendencias", "Datos", "chart"],
  ["consejos", "Consejos", "bulb"],
];

function renderTabs() {
  $("#tabs").innerHTML = TABS.map(([id, label, icon]) =>
    `<button class="tab" data-view="${id}">${svg(icon)}${label}</button>`).join("");
}

function show(view) {
  $$(".view").forEach((v) => (v.hidden = v.id !== `view-${view}`));
  $$(".tab").forEach((t) => t.classList.toggle("on", t.dataset.view === view));
  // El botón flotante solo en Registro: en Hoy chocaría con las acciones de la hoja.
  $("#fab").hidden = view !== "registro";
  if (view === "hoy") { renderQuick(); refreshToday(); }
  if (view === "registro") { renderQuick(); renderDay(); }
  if (view === "tendencias") renderTrends();
  if (view === "consejos") renderTips();
}

$("#tabs").addEventListener("click", (e) => {
  const v = e.target.closest("[data-view]")?.dataset.view;
  if (v) show(v);
});

function refreshToday() { renderRing(); renderSheet(); renderRhythm(); }
function refreshAll() {
  $("#baby-name").textContent = state.baby.name;
  $("#baby-age").textContent = `${ageText()} · ${band().label}`;
  $("#baby-dot").textContent = state.baby.name.trim().charAt(0).toUpperCase() || "·";
  refreshToday();
  if (!$("#view-registro").hidden) renderDay();
  if (!$("#view-tendencias").hidden) renderTrends();
}

let toastT = null;
function toast(msg) {
  const el = $("#toast");
  el.textContent = msg; el.hidden = false;
  clearTimeout(toastT);
  toastT = setTimeout(() => (el.hidden = true), 2800);
}

/* ─────────────── Ajustes ─────────────── */
function bandPreview(birth) {
  if (!birth) return "";
  const w = Math.max(0, (Date.now() - new Date(birth + "T00:00:00").getTime()) / (7 * DAY));
  const b = BANDS.find((x) => w <= x.maxW);
  return `Etapa ${b.label}. Punto de partida: ventana de vigilia de ${dur(priorWake(b) * MIN)} y siestas de ${dur(priorNap(b) * MIN)}. Nappy lo ajusta con los registros del bebé.`;
}

$("#open-settings").addEventListener("click", () => {
  $("#s-name").value = state.baby.name;
  $("#s-birth").value = state.baby.birth;
  $("#s-birth").max = new Date().toISOString().slice(0, 10);
  $("#s-band").textContent = bandPreview(state.baby.birth);
  $("#settings-dialog").showModal();
});
$("#settings-close").addEventListener("click", () => $("#settings-dialog").close());
$("#s-birth").addEventListener("change", (e) => ($("#s-band").textContent = bandPreview(e.target.value)));
$("#s-save").addEventListener("click", () => {
  const name = $("#s-name").value.trim(), birth = $("#s-birth").value;
  if (!name || !birth) return toast("Completá el nombre y la fecha");
  state.baby = { name, birth };
  save();
  $("#settings-dialog").close();
  refreshAll();
  toast("Ajustes guardados");
});
$("#s-export").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `nappy-${dateKey(Date.now())}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
});
$("#s-reset").addEventListener("click", () => {
  if (!confirm("Se borrarán el bebé y todos los registros. Esta acción no se puede deshacer.")) return;
  localStorage.removeItem(KEY);
  location.reload();
});

/* ─────────────── Cielo estrellado ─────────────── */
function drawSky() {
  const c = $("#sky"), ctx = c.getContext("2d");
  const dpr = Math.min(devicePixelRatio || 1, 2);
  c.width = innerWidth * dpr; c.height = innerHeight * dpr;
  ctx.scale(dpr, dpr);
  const n = Math.round((innerWidth * innerHeight) / 9000);
  for (let i = 0; i < n; i++) {
    const r = Math.random() * 1.1 + 0.25;
    ctx.globalAlpha = 0.15 + Math.random() * 0.55;
    ctx.fillStyle = Math.random() > 0.85 ? "#c2b4ff" : "#ffffff";
    ctx.beginPath();
    ctx.arc(Math.random() * innerWidth, Math.random() * innerHeight, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* ─────────────── Arranque ─────────────── */
function init() {
  drawSky();
  renderTabs();
  renderSounds();

  if (!state.baby) {
    $("#welcome-mark").innerHTML = svg("night");
    $("#welcome").hidden = false;
    $("#w-birth").max = new Date().toISOString().slice(0, 10);
    $("#w-birth").addEventListener("change", (e) => ($("#w-band").textContent = bandPreview(e.target.value)));
    $("#w-start").addEventListener("click", () => {
      const name = $("#w-name").value.trim(), birth = $("#w-birth").value;
      if (!name) return toast("Escribí el nombre de tu bebé");
      if (!birth || new Date(birth) > new Date()) return toast("Elegí una fecha de nacimiento válida");
      state.baby = { name, birth };
      save();
      $("#welcome").hidden = true;
      $("#app").hidden = false;
      refreshAll(); show("hoy");
      toast(`Todo listo para ${name}`);
    });
    return;
  }

  $("#open-settings").innerHTML = svg("gear");
  $("#app").hidden = false;
  refreshAll();
  show("hoy");
}

$("#open-settings").innerHTML = svg("gear");

// El anillo y la cuenta atrás se refrescan cada 20 s
setInterval(() => { if (state.baby && !$("#view-hoy").hidden) refreshToday(); }, 20000);
addEventListener("visibilitychange", () => { if (!document.hidden && state.baby) refreshAll(); });
addEventListener("resize", drawSky);

if ("serviceWorker" in navigator && location.protocol === "https:") {
  addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}

init();
