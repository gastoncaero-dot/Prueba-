# 🌙 Nappy — app de sueño para bebés

App web inspirada en [Napper](https://napper.app). Predice **a qué hora y
cuánto** va a dormir tu bebé según su edad, y registra sueño, tomas y pañales.

Sin dependencias, sin servidor y sin cuentas: todo funciona en el navegador y
los datos se guardan en el propio dispositivo (`localStorage`).

---

## Cómo predice el sueño

El motor no usa una ventana de vigilia suelta: modela **la forma completa del
día** para cada franja de edad — cuántas siestas tocan, cuánto sueño diurno
corresponde y cuántas horas dura la noche. De ahí deduce el tiempo despierto y
lo reparte en ventanas crecientes, porque un bebé aguanta menos despierto por
la mañana que antes de acostarse.

```
despertar → ventana 1 → siesta 1 → ventana 2 → siesta 2 → … → hora de dormir
```

Las siestas también se estiman: la de la mañana es la más larga y la última del
día queda como una siesta corta de recuperación. Ese reparto es el que produce,
para un bebé de 4–6 meses, una cuarta siesta de poco más de media hora.

Para un bebé de 4 meses y medio que se despertó de su tercera siesta a las
15:12, Nappy calcula:

> **Cuarta siesta en 52 min · Aprox. 17:12**
> Hora estimada de siesta **17:12 – 17:47**, 35 min de duración.
> Buscá señales de sueño a partir de las 16:42.

Cada edad cierra el día con una hora de dormir realista (entre las 19:00 y las
20:00 partiendo de un despertar a las 7:00), en lugar de acumular ventanas
hasta una hora imposible.

## Qué incluye

| Pantalla | Qué hace |
|---|---|
| **Hoy** | Anillo del día: cada sueño es una cápsula cuya longitud es su duración real. Cuenta atrás al centro y la ventana estimada abajo, con «Omitir» y «Registrar». |
| **Registro** | Alta rápida de pecho, biberón, pis y caca; resumen del día y actividad editable. Navegación por días. |
| **Sonidos** | Ruido blanco, lluvia, vientre materno (con latido a 140 lpm) y olas, sintetizados en vivo con Web Audio. Volumen y temporizador de apagado. |
| **Datos** | Sueño y tomas de los últimos 7 días, con línea de objetivo por edad, e historial. |
| **Consejos** | Orientación de sueño adaptada a la etapa del bebé. |

Se registra: sueño (con inicio y fin editables), pecho (lado y duración),
biberón (ml), sólidos, pañales, medicación y notas libres.

---

## Publicar en Netlify

El repositorio ya viene configurado: `netlify.toml` publica la carpeta `public/`
y no hace falta ningún paso de compilación.

**Opción A — arrastrar y soltar (lo más rápido)**

1. Entrá en [app.netlify.com/drop](https://app.netlify.com/drop).
2. Arrastrá la carpeta **`public/`** a la ventana.
3. Listo: Netlify te da la URL al instante.

**Opción B — conectar el repositorio (se actualiza sola en cada push)**

1. En Netlify: *Add new site → Import an existing project → GitHub*.
2. Elegí este repositorio y la rama.
3. Netlify lee `netlify.toml`. Dejá el comando de compilación vacío y el
   directorio de publicación en `public`.

**Opción C — desde la terminal**

```bash
npm install -g netlify-cli
netlify deploy --dir=public --prod
```

### Instalarla en el iPhone

Abrí la URL en Safari → botón **Compartir** → **Añadir a pantalla de inicio**.
Queda con su icono y se abre a pantalla completa, sin barra del navegador.
Gracias al *service worker*, después de la primera visita funciona sin conexión.

---

## Desarrollo

```bash
python3 -m http.server 8000 --directory public   # → http://localhost:8000
node build-standalone.mjs                        # regenera nappy.html
```

```
public/           el sitio que se publica
  index.html      estructura
  styles.css      identidad visual nocturna
  app.js          predicción, registro, sonidos y gráficos
  manifest.webmanifest, sw.js, icons/
netlify.toml      configuración de despliegue
nappy.html        la app entera en un solo archivo (generado)
```

> Nappy es una guía orientativa basada en rangos de sueño infantil habituales.
> No sustituye la consulta con tu pediatra.
