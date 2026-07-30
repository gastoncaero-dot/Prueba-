# Forja Fit

App de entrenamiento funcional para uso personal, inspirada en el formato de las
apps de gimnasios boutique tipo BIGG: **programación diaria, reserva de clases,
biblioteca de movimientos con video, planes de varias semanas y seguimiento de
progreso**.

Funciona **sin servidor y sin cuenta**: es una PWA que guarda todo en tu
dispositivo y se puede instalar como aplicación desde el navegador (Android, iOS
y escritorio).

---

## Sobre el contenido

No es una copia de la app de BIGG: sus rutinas, sus videos y su marca son de
ellos y están detrás de su login. Lo que sí replica es **el funcionamiento**, con
contenido propio:

- **93 movimientos** con ficha técnica original (posición inicial, claves de
  ejecución, errores comunes, respiración, progresiones y regresiones).
- **37 entrenamientos** completos repartidos en 9 modalidades.
- **6 planes** de 4 a 8 semanas.
- **Los videos los cargás vos.** Cada ejercicio tiene un espacio para su video de
  demostración: pegás un link de YouTube o Vimeo, o apuntás a un archivo tuyo.
  Ver [Cómo cargar los videos](#cómo-cargar-los-videos).

---

## Qué tiene

| Sección | Qué hace |
|---|---|
| **Hoy** | Resumen de la semana, racha, el día del plan activo, tus reservas y la programación del día. |
| **Clases** | 14 días de programación con horarios, sedes, coach y cupos. Reservás y cancelás. Vista por horario o por modalidad. |
| **Rutinas** | Catálogo filtrable por modalidad, lugar, nivel y duración, más los planes y tus favoritas. |
| **Ejercicios** | Biblioteca de movimientos con búsqueda, filtros por patrón y equipamiento, video y marcas personales. |
| **Sesión** | Reproductor bloque por bloque con cronómetros (AMRAP, EMOM, tabata, intervalos, for time), registro de series con kilos y repeticiones, RPE y notas. |
| **Progreso** | Sesiones por semana, mapa de constancia, distribución por modalidad, historial, récords, progresión de carga, medidas corporales y objetivos. |
| **Perfil** | Datos, equipamiento disponible, preferencias, gestión de videos y copia de seguridad de todo. |

**Modalidades:** Funcional, Fuerza, Hyrox, Upper Body, Lower Body, Pilates,
Cardio, Core y Movilidad.

**Formatos de bloque con cronómetro propio:** series, AMRAP, EMOM, tabata,
intervalos, for time, circuito y libre.

---

## Cómo la corro

Necesitás [Node.js](https://nodejs.org) 20 o superior.

```bash
cd forja-fit
npm install
npm run dev        # http://localhost:5173
```

Para la versión de producción:

```bash
npm run build      # genera dist/
npm run preview    # sirve dist/ en http://localhost:4173
```

### Instalarla en el celular

1. Serví la carpeta `dist/` desde cualquier hosting estático (Vercel, Netlify,
   GitHub Pages, o tu propia PC en la red de casa).
2. Abrí la URL en el celular.
3. **Android/Chrome:** menú → *Instalar aplicación*.
   **iPhone/Safari:** compartir → *Agregar a pantalla de inicio*.

Queda como una app más, funciona sin internet y arranca a pantalla completa.

> La app usa rutas con `#` y rutas relativas, así que anda igual servida desde la
> raíz de un dominio o desde una subcarpeta.

---

## Cómo cargar los videos

Hay tres maneras, se pueden combinar:

**1. Uno por uno, desde la app**
Entrá a *Ejercicios* → elegí el movimiento → **Agregar video** → pegá el link.
Sirven YouTube (`watch`, `youtu.be`, `shorts`), Vimeo y archivos `.mp4` / `.webm`.
Si todavía no tenés uno, el botón *Buscar demostración* abre una búsqueda con el
nombre del ejercicio.

**2. Todos juntos, con un JSON**
*Perfil* → *Videos* → **Importar videos**, con un archivo así:

```json
{
  "sentadilla-trasera": "https://www.youtube.com/watch?v=XXXXXXXXXXX",
  "peso-muerto": "https://vimeo.com/123456789",
  "swing-kettlebell": "./videos/swing.mp4"
}
```

Los identificadores son los `id` de `src/data/exercises.ts`.

**3. Con tus propios archivos, sin internet**
Copiá los videos en `forja-fit/public/videos/` y referencialos como
`./videos/nombre-del-archivo.mp4`. Quedan dentro de la app y se ven sin conexión.

Desde *Perfil* también podés **exportar** el mapa de videos para no volver a
cargarlos si cambiás de dispositivo.

---

## Tus datos

Todo (historial, marcas, medidas, objetivos, reservas, videos y preferencias) se
guarda en el `localStorage` del navegador. **Nada se envía a ningún servidor.**

Como contrapartida: si borrás los datos del navegador, se pierde. Desde
*Perfil → Tus datos* podés **exportar una copia** en JSON y volver a importarla
cuando quieras (o en otro dispositivo).

---

## Cómo la personalizo

Todo el contenido es texto plano en `src/data/`:

| Archivo | Qué define |
|---|---|
| `src/data/exercises.ts` | Los movimientos y sus fichas técnicas. |
| `src/data/workouts.ts` | Los entrenamientos, bloque por bloque. |
| `src/data/plans.ts` | Los planes de varias semanas. |
| `src/data/taxonomy.ts` | Modalidades, colores, sedes, coaches y etiquetas. |
| `src/lib/programming.ts` | Cómo se arma la programación diaria y los horarios. |

Por ejemplo, para agregar un entrenamiento propio alcanza con sumar un objeto
`wk({ ... })` en `workouts.ts` apuntando a ejercicios que existan; la app lo toma
sin tocar nada más.

Para cambiar sedes y horarios, editá `VENUES` en `taxonomy.ts` y `TIMES` en
`programming.ts`. La programación es determinística a partir de la fecha: el
mismo día siempre muestra lo mismo, sin necesidad de backend.

---

## Estructura

```
forja-fit/
├── public/            iconos del PWA y (opcional) tus videos
├── scripts/
│   └── gen-icons.mjs  genera los iconos PNG sin dependencias
└── src/
    ├── components/    UI, tarjetas, cronómetros, gráficos y reproductor de video
    ├── data/          catálogo: ejercicios, rutinas, planes y taxonomía
    ├── lib/           store, fechas, programación, cronómetros, estadísticas
    ├── pages/         una por pantalla
    └── types.ts       el modelo de datos completo
```

Stack: React 19 + TypeScript + Vite + Tailwind 4 + Zustand, con `vite-plugin-pwa`
para el modo offline. Sin backend, sin base de datos y sin analítica.

---

## Aviso

El contenido de entrenamiento es orientativo y general. No reemplaza la
indicación de un profesional: si tenés una lesión, una condición médica o hace
mucho que no entrenás, consultá antes de arrancar.
