# Forja Fit

App de entrenamiento funcional para uso personal, inspirada en el formato de las
apps de gimnasios boutique tipo BIGG: **programación diaria, biblioteca de
movimientos con video, planes de varias semanas y seguimiento de progreso**.

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
| **Hoy** | Resumen de la semana, racha, el día del plan activo y la programación de hoy. |
| **Programa** | Tres semanas de programación (una atrás, dos adelante): qué toca cada día en cada modalidad, con filtros por modalidad y lugar, y una marca en los días que ya entrenaste. |
| **Rutinas** | Catálogo filtrable por modalidad, lugar, nivel y duración, más los planes y tus favoritas. |
| **Ejercicios** | Biblioteca de movimientos con búsqueda, filtros por patrón y equipamiento, video y marcas personales. |
| **Sesión** | Reproductor bloque por bloque con cronómetros (AMRAP, EMOM, tabata, intervalos, for time), registro de series con kilos y repeticiones, RPE y notas. Cada ejercicio abre su **video y sus claves de ejecución ahí mismo**, sin salir de la sesión. |
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

---

## Publicarla en Netlify

El repositorio ya trae un `netlify.toml` en la raíz con todo configurado
(carpeta base, comando de build, headers de caché y fallback de rutas).

### Opción A — conectando el repositorio (recomendada)

Se republica sola cada vez que hacés un push.

1. Entrá a [app.netlify.com](https://app.netlify.com) → **Add new site** →
   *Import an existing project* → **GitHub** → elegí este repositorio.
2. **No toques ninguno de los campos de build.** Netlify lee el `netlify.toml`
   y ya sabe que tiene que entrar a `forja-fit/`, correr `npm run build` y
   publicar `dist`. (Si el panel te muestra un *Base directory* vacío, dejalo
   así: ponerlo a mano puede pisar la configuración del archivo.)
3. **Deploy site**. Tarda un minuto.
4. En *Site configuration → Change site name* le ponés el nombre que quieras:
   queda como `https://el-nombre-que-elijas.netlify.app`.

### Opción B — arrastrando la carpeta

Sin repositorio ni cuenta conectada, para probarla rápido:

```bash
cd forja-fit
npm install
npm run build
```

Después arrastrá la carpeta `forja-fit/dist` a
[app.netlify.com/drop](https://app.netlify.com/drop). Cada vez que quieras
actualizarla, volvés a hacer el build y arrastrás de nuevo.

### Opción C — desde la terminal

```bash
npm install -g netlify-cli
cd forja-fit
npm run build
netlify deploy --prod --dir=dist
```

### Después de publicar

Abrí la URL en el celular e instalala como app:

- **Android / Chrome:** menú (⋮) → *Instalar aplicación*
- **iPhone / Safari:** compartir → *Agregar a pantalla de inicio*

Queda como una app más: ícono propio, pantalla completa y funciona sin
internet. Netlify sirve por HTTPS, que es justamente lo que necesita una PWA
para poder instalarse.

> **Ojo con los datos:** el historial vive en el navegador de cada dispositivo.
> Si entrás desde la compu y desde el celular, son dos historiales distintos.
> Para pasarlos, usá *Perfil → Exportar todo* en uno e *Importar copia* en el
> otro.

> **Actualizaciones:** cuando publicás una versión nueva, la app la detecta y se
> actualiza sola la próxima vez que la abrís (los headers del `netlify.toml`
> están puestos para que el service worker no se quede pegado a la vieja).

La app usa rutas con `#` y rutas relativas, así que anda igual en Netlify, en
Vercel, en GitHub Pages o servida desde una subcarpeta.

---

## Cómo cargar los videos

Hay cuatro maneras, se pueden combinar:

**1. Varios de una, en la pantalla de carga** (la más rápida)
*Perfil* → **Cargar videos**. Te muestra la lista completa **ordenada por cuánto
se usa cada movimiento en las rutinas**, así con los primeros veinte ya cubrís
casi todas. Al lado de cada uno tenés un botón *Buscar*, que abre una búsqueda
con el nombre del ejercicio: copiás la dirección del video que te guste y la
pegás en el campo. Se guarda solo.

**2. Uno por uno, mientras mirás un ejercicio**
En *Ejercicios* → elegí el movimiento → **Agregar video**, o directamente desde
el panel de técnica que se abre dentro de la rutina o de la sesión.
Sirven YouTube (`watch`, `youtu.be`, `shorts`), Vimeo y archivos `.mp4` / `.webm`.

**3. Todos juntos, con un JSON**
*Perfil* → *Videos* → **Importar videos**, o el botón *Importar una lista en
JSON* de la pantalla de carga, con un archivo así:

```json
{
  "sentadilla-trasera": "https://www.youtube.com/watch?v=XXXXXXXXXXX",
  "peso-muerto": "https://vimeo.com/123456789",
  "swing-kettlebell": "./videos/swing.mp4"
}
```

Los identificadores son los `id` de `src/data/exercises.ts`.

**4. Con tus propios archivos, sin internet**
Copiá los videos en `forja-fit/public/videos/` y referencialos como
`./videos/nombre-del-archivo.mp4`. Quedan dentro de la app y se ven sin conexión.

Desde *Perfil* también podés **exportar** el mapa de videos para no volver a
cargarlos si cambiás de dispositivo.

### Dónde aparecen

Una vez cargados, los videos se abren en tres lugares:

- **En la rutina** (*Rutinas → un entrenamiento*): tocás cualquier ejercicio de
  un bloque y se despliega el video con las claves y los errores comunes.
- **En la sesión**, mientras entrenás: el botón **Técnica** de cada ejercicio
  abre el video justo debajo de las series, sin perder el cronómetro ni lo que
  ya registraste. Es la forma de corregirte en el momento.
- **En la ficha del movimiento** (*Ejercicios → uno cualquiera*), con el detalle
  completo.

---

## Tus datos

Todo (historial, marcas, medidas, objetivos, videos y preferencias) se
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
| `src/data/taxonomy.ts` | Modalidades, colores, lugares y etiquetas. |
| `src/lib/programming.ts` | Cómo se arma la programación diaria y los horarios. |

Por ejemplo, para agregar un entrenamiento propio alcanza con sumar un objeto
`wk({ ... })` en `workouts.ts` apuntando a ejercicios que existan; la app lo toma
sin tocar nada más.

Para cambiar qué modalidades caen cada día, editá `WEEK_EMPHASIS` en
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
