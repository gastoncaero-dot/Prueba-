/* ═══════════════════════════════════════════════════════════
   Nappy — app de sueño para bebés inspirada en Napper
   Predicción de siestas por ventanas de vigilia, registro,
   sonidos blancos (Web Audio) y tendencias. Sin dependencias.
   ═══════════════════════════════════════════════════════════ */
"use strict";

/* ── Estado y persistencia ── */
const STORAGE_KEY = "nappy-state-v1";

const state = load() || {
  baby: null,            // { name, birth: "YYYY-MM-DD" }
  events: [],            // { id, type, ts, end? }  type: sueño | toma-pecho | toma-bibe | panal-pis | panal-caca
  sleepingSince: null,   // timestamp ms si hay un sueño en curso
};

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); }
  catch { return null; }
}
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

/* ══════════════════════════════════════════════
   Ciencia del sueño: ventanas de vigilia por edad
   (valores típicos de las guías de sueño infantil)
   ══════════════════════════════════════════════ */
const SLEEP_GUIDE = [
  // maxWeeks, ventana de vigilia (min), siestas/día, sueño total (h), etiqueta
  { maxWeeks: 4,   wake: 50,  naps: 5, total: 16, label: "Recién nacido" },
  { maxWeeks: 8,   wake: 60,  naps: 5, total: 15.5, label: "1–2 meses" },
  { maxWeeks: 13,  wake: 75,  naps: 4, total: 15, label: "2–3 meses" },
  { maxWeeks: 17,  wake: 95,  naps: 4, total: 14.5, label: "3–4 meses" },
  { maxWeeks: 26,  wake: 120, naps: 3, total: 14, label: "4–6 meses" },
  { maxWeeks: 35,  wake: 165, naps: 3, total: 14, label: "6–8 meses" },
  { maxWeeks: 43,  wake: 195, naps: 2, total: 13.5, label: "8–10 meses" },
  { maxWeeks: 52,  wake: 225, naps: 2, total: 13.5, label: "10–12 meses" },
  { maxWeeks: 78,  wake: 285, naps: 1, total: 13, label: "12–18 meses" },
  { maxWeeks: 104, wake: 330, naps: 1, total: 12.5, label: "18–24 meses" },
  { maxWeeks: 99999, wake: 360, naps: 1, total: 12, label: "2+ años" },
];

function ageInWeeks() {
  const birth = new Date(state.baby.birth + "T00:00:00");
  return Math.max(0, (Date.now() - birth.getTime()) / (7 * 24 * 3600 * 1000));
}

function guideForAge() {
  const w = ageInWeeks();
  return SLEEP_GUIDE.find((g) => w <= g.maxWeeks);
}

function ageLabel() {
  const weeks = Math.floor(ageInWeeks());
  if (weeks < 9) return `${weeks} semana${weeks === 1 ? "" : "s"}`;
  const months = Math.floor(weeks / 4.345);
  if (months < 24) return `${months} mes${months === 1 ? "" : "es"}`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return `${years} año${years === 1 ? "" : "s"}${rem ? ` y ${rem} mes${rem === 1 ? "" : "es"}` : ""}`;
}

/* ── Utilidades de tiempo ── */
const fmtTime = (ts) =>
  new Date(ts).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });

function fmtDuration(ms) {
  const min = Math.round(ms / 60000);
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  return `${h} h ${String(m).padStart(2, "0")} min`;
}

function startOfDay(ts = Date.now()) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/* ══════════════════════════════════════════════
   Predicción de la próxima siesta / hora de dormir
   ══════════════════════════════════════════════ */
function lastWakeTime() {
  // Fin del último sueño registrado hoy o ayer
  const sleeps = state.events
    .filter((e) => e.type === "sueño" && e.end)
    .sort((a, b) => b.end - a.end);
  return sleeps.length ? sleeps[0].end : null;
}

function napsToday() {
  const t0 = startOfDay();
  return state.events.filter((e) => e.type === "sueño" && e.ts >= t0);
}

function prediction() {
  const guide = guideForAge();
  if (state.sleepingSince) {
    return { mode: "durmiendo" };
  }
  const wake = lastWakeTime();
  if (!wake || Date.now() - wake > 16 * 3600 * 1000) {
    return { mode: "sin-datos", guide };
  }
  const naps = napsToday().length;
  const isBedtime = naps >= guide.naps || new Date().getHours() >= 18;
  const target = wake + guide.wake * 60000;
  return {
    mode: isBedtime ? "noche" : "siesta",
    target,
    overdue: Date.now() > target,
    guide,
  };
}

function renderPrediction() {
  const p = prediction();
  const label = $("#prediction-label");
  const time = $("#prediction-time");
  const sub = $("#prediction-sub");

  if (p.mode === "durmiendo") {
    label.textContent = "Ahora mismo";
    time.textContent = "😴 Durmiendo";
    sub.textContent = "Dulces sueños…";
    return;
  }
  if (p.mode === "sin-datos") {
    label.textContent = "Próxima siesta";
    time.textContent = "—";
    sub.textContent = `Tocá «Se despertó» cuando ${state.baby.name} se despierte para empezar a predecir.`;
    return;
  }
  const what = p.mode === "noche" ? "Hora de dormir" : "Próxima siesta";
  if (p.overdue) {
    label.textContent = what;
    time.textContent = "¡Ahora!";
    sub.textContent = `La ventana de vigilia de ${fmtDuration(p.guide.wake * 60000)} ya se cumplió (${fmtTime(p.target)}).`;
  } else {
    label.textContent = `${what} a las`;
    time.textContent = fmtTime(p.target);
    sub.textContent = `En ${fmtDuration(p.target - Date.now())} · ventana de vigilia: ${fmtDuration(p.guide.wake * 60000)}`;
  }
}

/* ── Horario estimado del día ── */
function renderSchedule() {
  const el = $("#schedule");
  const guide = guideForAge();
  const wake = lastWakeTime();
  const naps = napsToday();
  const items = [];

  // Siestas ya registradas hoy
  naps.forEach((n, i) => {
    items.push({
      icon: "😴",
      what: `Siesta ${i + 1}`,
      when: `${fmtTime(n.ts)} – ${n.end ? fmtTime(n.end) : "…"} · ${n.end ? fmtDuration(n.end - n.ts) : "en curso"}`,
      time: fmtTime(n.ts),
      done: true,
    });
  });

  // Siestas futuras estimadas
  if (wake && !state.sleepingSince) {
    let cursor = Math.max(wake, Date.now() - guide.wake * 60000);
    const avgNap = 60; // duración media estimada de siesta en min
    for (let i = naps.length; i < guide.naps; i++) {
      const start = cursor + guide.wake * 60000;
      if (new Date(start).getHours() >= 19) break;
      items.push({
        icon: "🌤️",
        what: `Siesta ${i + 1} (estimada)`,
        when: `duración típica ~${avgNap} min`,
        time: fmtTime(start),
        next: items.every((x) => x.done),
      });
      cursor = start + avgNap * 60000;
    }
    const bedtime = cursor + guide.wake * 60000;
    items.push({
      icon: "🌙",
      what: "Hora de dormir (estimada)",
      when: "sueño nocturno",
      time: fmtTime(Math.min(bedtime, startOfDay() + 21 * 3600 * 1000)),
      next: items.every((x) => x.done),
    });
  }

  if (!items.length) {
    el.innerHTML = `<p class="log-empty">Registrá el primer despertar del día para ver el horario estimado. 🌅</p>`;
    return;
  }
  el.innerHTML = items
    .map(
      (i) => `
    <div class="schedule-item ${i.done ? "done" : ""} ${i.next ? "next" : ""}">
      <span class="schedule-icon">${i.icon}</span>
      <div class="schedule-info">
        <div class="schedule-what">${i.what}</div>
        <div class="schedule-when">${i.when}</div>
      </div>
      <span class="schedule-time">${i.time}</span>
    </div>`
    )
    .join("");
}

function renderAgeGuide() {
  const g = guideForAge();
  $("#age-guide").innerHTML = `
    <div class="guide-item"><div class="guide-value">${fmtDuration(g.wake * 60000)}</div><div class="guide-label">Ventana de vigilia</div></div>
    <div class="guide-item"><div class="guide-value">${g.naps}</div><div class="guide-label">Siestas por día</div></div>
    <div class="guide-item"><div class="guide-value">${g.total} h</div><div class="guide-label">Sueño total en 24 h</div></div>
    <div class="guide-item"><div class="guide-value">${g.label}</div><div class="guide-label">Etapa</div></div>`;
}

/* ══════════════════════════════════════════════
   Cronómetro de sueño
   ══════════════════════════════════════════════ */
let timerInterval = null;

function startSleep() {
  state.sleepingSince = Date.now();
  save();
  renderTimer();
  renderPrediction();
  toast(`${state.baby.name} se durmió 😴`);
}

function stopSleep() {
  if (!state.sleepingSince) return;
  const start = state.sleepingSince;
  state.sleepingSince = null;
  addEvent({ type: "sueño", ts: start, end: Date.now() });
  renderTimer();
  renderAll();
  toast(`Sueño registrado: ${fmtDuration(Date.now() - start)} ☀️`);
}

function markWokeUp() {
  // Despertar sin sueño cronometrado: registra un despertar puntual
  addEvent({ type: "sueño", ts: Date.now() - 60000, end: Date.now() });
  renderAll();
  toast("¡Buen día! Ventana de vigilia iniciada ☀️");
}

function renderTimer() {
  const running = !!state.sleepingSince;
  $("#timer-idle").hidden = running;
  $("#timer-running").hidden = !running;

  clearInterval(timerInterval);
  if (running) {
    const tick = () => {
      const ms = Date.now() - state.sleepingSince;
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      $("#timer-display").textContent =
        h > 0
          ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
          : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    };
    tick();
    timerInterval = setInterval(tick, 1000);
  } else {
    const wake = lastWakeTime();
    $("#awake-since").textContent =
      wake && Date.now() - wake < 16 * 3600 * 1000
        ? `Despierto desde las ${fmtTime(wake)} (hace ${fmtDuration(Date.now() - wake)})`
        : "Registrá cuándo se despertó para calcular la próxima siesta.";
  }
}

/* ══════════════════════════════════════════════
   Registro de actividad
   ══════════════════════════════════════════════ */
const LOG_META = {
  "sueño": { icon: "😴", label: "Sueño" },
  "toma-pecho": { icon: "🤱", label: "Toma de pecho" },
  "toma-bibe": { icon: "🍼", label: "Biberón" },
  "panal-pis": { icon: "💧", label: "Pañal (pis)" },
  "panal-caca": { icon: "💩", label: "Pañal (caca)" },
};

function addEvent(ev) {
  ev.id = Date.now() + Math.random().toString(36).slice(2, 7);
  if (!ev.ts) ev.ts = Date.now();
  state.events.push(ev);
  state.events.sort((a, b) => a.ts - b.ts);
  save();
}

function deleteEvent(id) {
  state.events = state.events.filter((e) => e.id !== id);
  save();
  renderAll();
}

function renderLog() {
  const t0 = startOfDay();
  const today = state.events.filter((e) => e.ts >= t0).sort((a, b) => b.ts - a.ts);
  const el = $("#log-list");
  if (!today.length) {
    el.innerHTML = `<li class="log-empty">Todavía no hay registros hoy.</li>`;
    return;
  }
  el.innerHTML = today
    .map((e) => {
      const meta = LOG_META[e.type];
      const extra = e.type === "sueño" && e.end ? ` · ${fmtDuration(e.end - e.ts)}` : "";
      return `<li class="log-item">
        <span>${meta.icon}</span>
        <span>${meta.label}${extra}</span>
        <span class="log-time">${fmtTime(e.ts)}</span>
        <button class="log-del" data-del="${e.id}" title="Eliminar" aria-label="Eliminar registro">✕</button>
      </li>`;
    })
    .join("");
}

/* ══════════════════════════════════════════════
   Sonidos para dormir (Web Audio, generados en vivo)
   ══════════════════════════════════════════════ */
const SOUND_NAMES = {
  blanco: "Ruido blanco",
  lluvia: "Lluvia",
  vientre: "Vientre materno",
  olas: "Olas del mar",
};

let audio = { ctx: null, master: null, nodes: [], current: null, offTimer: null };

function noiseBuffer(ctx, seconds = 2) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function playSound(kind) {
  stopSound(false);
  const ctx = audio.ctx || new (window.AudioContext || window.webkitAudioContext)();
  audio.ctx = ctx;
  ctx.resume();

  const master = ctx.createGain();
  master.gain.value = ($("#sound-volume").value / 100) * 0.6;
  master.connect(ctx.destination);
  audio.master = master;
  audio.current = kind;

  const noiseSrc = () => {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx);
    src.loop = true;
    return src;
  };

  if (kind === "blanco") {
    const src = noiseSrc();
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 6000;
    src.connect(lp).connect(master);
    src.start();
    audio.nodes = [src];
  }

  if (kind === "lluvia") {
    const src = noiseSrc();
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 2400;
    bp.Q.value = 0.4;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 500;
    src.connect(bp).connect(hp).connect(master);
    src.start();
    audio.nodes = [src];
  }

  if (kind === "vientre") {
    // Ruido grave y amortiguado + latido rítmico
    const src = noiseSrc();
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 320;
    const g = ctx.createGain();
    g.gain.value = 0.8;
    src.connect(lp).connect(g).connect(master);
    src.start();

    const beat = ctx.createOscillator();
    beat.type = "sine";
    beat.frequency.value = 62;
    const beatGain = ctx.createGain();
    beatGain.gain.value = 0;
    beat.connect(beatGain).connect(master);
    beat.start();
    // ~140 lpm como el corazón materno escuchado desde dentro
    const bpm = 140;
    const interval = setInterval(() => {
      if (!audio.ctx) return;
      const t = ctx.currentTime;
      beatGain.gain.cancelScheduledValues(t);
      beatGain.gain.setValueAtTime(0.0001, t);
      beatGain.gain.exponentialRampToValueAtTime(0.5, t + 0.04);
      beatGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    }, 60000 / bpm);
    audio.nodes = [src, beat, { stop: () => clearInterval(interval) }];
  }

  if (kind === "olas") {
    const src = noiseSrc();
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 900;
    const swell = ctx.createGain();
    src.connect(lp).connect(swell).connect(master);
    src.start();
    // LFO lento que sube y baja el volumen como olas
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.09;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.45;
    swell.gain.value = 0.55;
    lfo.connect(lfoGain).connect(swell.gain);
    lfo.start();
    audio.nodes = [src, lfo];
  }

  // UI
  $$(".sound-btn").forEach((b) => b.classList.toggle("playing", b.dataset.sound === kind));
  $("#sound-controls").hidden = false;
  $("#sound-playing").textContent = `🎵 Reproduciendo: ${SOUND_NAMES[kind]}`;
  applySoundTimer();
}

function stopSound(updateUI = true) {
  audio.nodes.forEach((n) => { try { n.stop(); } catch {} });
  audio.nodes = [];
  audio.current = null;
  clearTimeout(audio.offTimer);
  if (updateUI) {
    $$(".sound-btn").forEach((b) => b.classList.remove("playing"));
    $("#sound-controls").hidden = true;
  }
}

function applySoundTimer() {
  clearTimeout(audio.offTimer);
  const min = Number($("#sound-timer").value);
  if (min > 0 && audio.current) {
    audio.offTimer = setTimeout(() => {
      stopSound();
      toast("Sonido apagado ⏰");
    }, min * 60000);
  }
}

/* ══════════════════════════════════════════════
   Tendencias y estadísticas
   ══════════════════════════════════════════════ */
function sleepByDay(days = 7) {
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d0 = startOfDay() - i * 86400000;
    const d1 = d0 + 86400000;
    let ms = 0;
    state.events.forEach((e) => {
      if (e.type !== "sueño" || !e.end) return;
      const s = Math.max(e.ts, d0);
      const en = Math.min(e.end, d1);
      if (en > s) ms += en - s;
    });
    // Sueño en curso también cuenta
    if (state.sleepingSince) {
      const s = Math.max(state.sleepingSince, d0);
      const en = Math.min(Date.now(), d1);
      if (en > s) ms += en - s;
    }
    out.push({ day: d0, hours: ms / 3600000 });
  }
  return out;
}

function renderChart() {
  const canvas = $("#chart-sleep");
  const ctx = canvas.getContext("2d");
  const data = sleepByDay(7);
  const W = canvas.width, H = canvas.height;
  const pad = { top: 26, right: 14, bottom: 42, left: 40 };
  const goal = guideForAge().total;
  const maxH = Math.max(goal + 2, ...data.map((d) => d.hours), 8);

  ctx.clearRect(0, 0, W, H);
  ctx.font = "13px sans-serif";

  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;
  const y = (h) => pad.top + plotH * (1 - h / maxH);

  // Rejilla horizontal
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.fillStyle = "rgba(240,239,255,0.55)";
  ctx.textAlign = "right";
  for (let h = 0; h <= maxH; h += 4) {
    ctx.beginPath();
    ctx.moveTo(pad.left, y(h));
    ctx.lineTo(W - pad.right, y(h));
    ctx.stroke();
    ctx.fillText(`${h}h`, pad.left - 6, y(h) + 4);
  }

  // Línea de objetivo
  ctx.strokeStyle = "rgba(127,224,176,0.7)";
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(pad.left, y(goal));
  ctx.lineTo(W - pad.right, y(goal));
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(127,224,176,0.9)";
  ctx.textAlign = "left";
  ctx.fillText(`objetivo ${goal}h`, pad.left + 4, y(goal) - 6);

  // Barras
  const bw = (plotW / data.length) * 0.55;
  data.forEach((d, i) => {
    const cx = pad.left + (plotW / data.length) * (i + 0.5);
    const grad = ctx.createLinearGradient(0, y(d.hours), 0, y(0));
    grad.addColorStop(0, "#b79cff");
    grad.addColorStop(1, "#5d4ba8");
    ctx.fillStyle = grad;
    const barH = Math.max(2, y(0) - y(d.hours));
    roundRect(ctx, cx - bw / 2, y(0) - barH, bw, barH, 6);
    ctx.fill();

    ctx.fillStyle = "rgba(240,239,255,0.75)";
    ctx.textAlign = "center";
    const name = new Date(d.day).toLocaleDateString("es", { weekday: "short" });
    ctx.fillText(name, cx, H - pad.bottom + 20);
    if (d.hours > 0) {
      ctx.fillStyle = "#f7c873";
      ctx.fillText(d.hours.toFixed(1), cx, y(d.hours) - 8);
    }
  });
}

function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function renderStats() {
  const data = sleepByDay(7);
  const today = data[data.length - 1].hours;
  const withData = data.filter((d) => d.hours > 0);
  const avg = withData.length ? withData.reduce((a, d) => a + d.hours, 0) / withData.length : 0;
  const napsCount = napsToday().length;
  $("#stats-grid").innerHTML = `
    <div class="stat-card"><div class="stat-value">${today.toFixed(1)} h</div><div class="stat-label">Sueño hoy</div></div>
    <div class="stat-card"><div class="stat-value">${napsCount}</div><div class="stat-label">Siestas hoy</div></div>
    <div class="stat-card"><div class="stat-value">${avg.toFixed(1)} h</div><div class="stat-label">Media 7 días</div></div>`;
}

function renderSleepHistory() {
  const sleeps = state.events
    .filter((e) => e.type === "sueño" && e.end)
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 20);
  const el = $("#sleep-history");
  if (!sleeps.length) {
    el.innerHTML = `<li class="log-empty">Todavía no hay sueños registrados.</li>`;
    return;
  }
  el.innerHTML = sleeps
    .map((e) => {
      const day = new Date(e.ts).toLocaleDateString("es", { weekday: "short", day: "numeric", month: "short" });
      return `<li class="log-item">
        <span>😴</span>
        <span>${day} · ${fmtTime(e.ts)} – ${fmtTime(e.end)}</span>
        <span class="log-time">${fmtDuration(e.end - e.ts)}</span>
      </li>`;
    })
    .join("");
}

/* ══════════════════════════════════════════════
   Consejos por edad
   ══════════════════════════════════════════════ */
const TIPS = [
  {
    maxWeeks: 13,
    tips: [
      ["El día y la noche se aprenden", "Los recién nacidos no distinguen el día de la noche. Exponé a tu bebé a luz natural de día y mantené las noches oscuras y tranquilas para ayudar a madurar su reloj interno."],
      ["Las ventanas de vigilia son cortas", "A esta edad tu bebé solo aguanta despierto entre 45 y 75 minutos. Pasarse de la ventana suele producir llanto y más dificultad para dormirse, no más cansancio «útil»."],
      ["El contacto calma", "El porteo, el contacto piel con piel y el movimiento suave imitan el vientre materno y son la forma más eficaz de calmar a un bebé pequeño."],
    ],
  },
  {
    maxWeeks: 26,
    tips: [
      ["Rutina corta antes de dormir", "Una mini-rutina predecible (baño, pijama, canción, oscuridad) le indica al cerebro del bebé que llega la hora de dormir. Con 10–15 minutos alcanza."],
      ["La regresión de los 4 meses", "Alrededor de los 4 meses el sueño del bebé madura y se vuelve más liviano. Es normal que se despierte más: no es un retroceso, es desarrollo."],
      ["Somnoliento pero despierto", "Intentá acostarlo somnoliento pero aún despierto de vez en cuando: practicar dormirse en la cuna le ayuda a conectar ciclos de sueño solito."],
    ],
  },
  {
    maxWeeks: 52,
    tips: [
      ["Cuidá la última siesta", "Si la última siesta termina muy tarde, la hora de dormir se atrasa. Intentá que el último tramo despierto del día sea el más largo."],
      ["Ansiedad por separación", "Entre los 8 y 10 meses muchos bebés protestan al quedarse solos en la cuna. Es una etapa normal del apego: respondé con calma y consistencia."],
      ["El ambiente importa", "Habitación oscura (¡de verdad oscura!), temperatura fresca de 19–21 °C y ruido blanco constante ayudan a dormir más y mejor."],
    ],
  },
  {
    maxWeeks: 99999,
    tips: [
      ["Transición a una siesta", "Entre los 12 y 18 meses la mayoría pasa de dos siestas a una. Hacelo gradualmente: atrasá la siesta de la mañana poco a poco hasta el mediodía."],
      ["Límites con cariño", "A esta edad aparecen las protestas a la hora de dormir. Una rutina firme, predecible y cariñosa es más eficaz que alargar la negociación."],
      ["Actividad física de día", "El movimiento y el juego al aire libre durante el día mejoran la calidad del sueño nocturno de los niños pequeños."],
    ],
  },
];

function renderTips() {
  const w = ageInWeeks();
  const group = TIPS.find((t) => w <= t.maxWeeks);
  $("#tips-list").innerHTML = group.tips
    .map(([h, p]) => `<div class="tip-card"><h3>${h}</h3><p>${p}</p></div>`)
    .join("");
}

/* ══════════════════════════════════════════════
   Navegación, ajustes y arranque
   ══════════════════════════════════════════════ */
function showView(name) {
  $$(".view").forEach((v) => (v.hidden = v.id !== `view-${name}`));
  $$(".tab").forEach((t) => t.classList.toggle("active", t.dataset.view === name));
  if (name === "tendencias") { renderChart(); renderStats(); renderSleepHistory(); }
  if (name === "consejos") renderTips();
  if (name === "registro") renderLog();
}

function renderHeader() {
  $("#baby-name").textContent = state.baby.name;
  $("#baby-age").textContent = `${ageLabel()} · ${guideForAge().label}`;
}

function renderAll() {
  renderHeader();
  renderPrediction();
  renderTimer();
  renderSchedule();
  renderAgeGuide();
  renderLog();
}

let toastTimeout = null;
function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => (el.hidden = true), 2600);
}

function makeStars() {
  const wrap = $("#stars");
  for (let i = 0; i < 90; i++) {
    const s = document.createElement("div");
    s.className = "star";
    const size = Math.random() * 2.2 + 0.6;
    s.style.cssText = `left:${Math.random() * 100}%;top:${Math.random() * 100}%;width:${size}px;height:${size}px;animation-delay:${Math.random() * 3}s;animation-duration:${2 + Math.random() * 3}s`;
    wrap.appendChild(s);
  }
}

function init() {
  makeStars();

  if (!state.baby) {
    $("#onboarding").hidden = false;
    const birthInput = $("#ob-birth");
    birthInput.max = new Date().toISOString().slice(0, 10);
    $("#ob-start").addEventListener("click", () => {
      const name = $("#ob-name").value.trim();
      const birth = birthInput.value;
      if (!name) return toast("Escribí el nombre de tu bebé 🙂");
      if (!birth || new Date(birth) > new Date()) return toast("Elegí una fecha de nacimiento válida");
      state.baby = { name, birth };
      save();
      $("#onboarding").hidden = true;
      $("#app").hidden = false;
      renderAll();
      toast(`¡Bienvenido/a, ${name}! 🌙`);
    });
    return;
  }

  $("#app").hidden = false;
  renderAll();
}

/* ── Eventos de UI ── */
$$(".tab").forEach((t) => t.addEventListener("click", () => showView(t.dataset.view)));

$("#btn-sleep-start").addEventListener("click", startSleep);
$("#btn-sleep-stop").addEventListener("click", stopSleep);
$("#btn-woke-up").addEventListener("click", markWokeUp);

$$(".quick-btn").forEach((b) =>
  b.addEventListener("click", () => {
    addEvent({ type: b.dataset.log });
    renderLog();
    toast(`${LOG_META[b.dataset.log].label} registrado ✔️`);
  })
);

$("#log-list").addEventListener("click", (e) => {
  const id = e.target.dataset.del;
  if (id) deleteEvent(id);
});

$$(".sound-btn").forEach((b) =>
  b.addEventListener("click", () => {
    if (audio.current === b.dataset.sound) stopSound();
    else playSound(b.dataset.sound);
  })
);
$("#btn-sound-stop").addEventListener("click", () => stopSound());
$("#sound-volume").addEventListener("input", (e) => {
  if (audio.master) audio.master.gain.value = (e.target.value / 100) * 0.6;
});
$("#sound-timer").addEventListener("change", applySoundTimer);

$("#btn-settings").addEventListener("click", () => {
  $("#set-name").value = state.baby.name;
  $("#set-birth").value = state.baby.birth;
  $("#set-birth").max = new Date().toISOString().slice(0, 10);
  $("#settings-dialog").showModal();
});
$("#set-cancel").addEventListener("click", () => $("#settings-dialog").close());
$("#set-save").addEventListener("click", () => {
  const name = $("#set-name").value.trim();
  const birth = $("#set-birth").value;
  if (!name || !birth) return toast("Completá nombre y fecha");
  state.baby = { name, birth };
  save();
  $("#settings-dialog").close();
  renderAll();
  toast("Ajustes guardados ✔️");
});
$("#set-reset").addEventListener("click", () => {
  if (confirm("¿Borrar TODOS los datos de la app? Esta acción no se puede deshacer.")) {
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  }
});

// Refresco periódico de predicciones (cada 30 s)
setInterval(() => {
  if (state.baby && !$("#view-hoy").hidden) {
    renderPrediction();
    renderSchedule();
    if (!state.sleepingSince) renderTimer();
  }
}, 30000);

init();
