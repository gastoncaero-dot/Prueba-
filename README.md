# 🌙 Nappy — app de sueño para bebés

App web inspirada en [Napper](https://napper.app). Predice **a qué hora y
cuánto** va a dormir tu bebé según su edad, y registra sueño, tomas y pañales.

Sin dependencias, sin servidor y sin cuentas: todo funciona en el navegador y
los datos se guardan en el propio dispositivo (`localStorage`).

---

## Cómo predice el sueño

El día se construye encadenando ventanas de vigilia y siestas desde el último
despertar, hasta que ya no entra otra siesta antes de la noche:

```
despertar → ventana → siesta → ventana → siesta → … → hora de dormir
```

**El número de siestas no lo fija la edad**: sale de ese encadenado. Por eso un
día con siestas largas tiene cuatro y otro con siestas cortas tiene cinco.

### El ritmo se aprende del propio bebé

La edad solo aporta el punto de partida. En cuanto hay registros, el ritmo se
mide en ellos: cada sueño registrado aporta una duración y cada hueco entre dos
siestas del mismo día aporta una ventana de vigilia. Sobre esas medidas se
aplican tres criterios:

- **Lo reciente pesa más.** Vida media de 5 días, porque el ritmo se mueve
  semana a semana. Así la estimación acompaña a un bebé cuyas siestas pasan de
  45 a 30 minutos en pocos días.
- **Cada siesta aprende de su posición.** La segunda siesta del día no dura lo
  mismo que la última, así que cada posición mantiene su propia estimación,
  apoyada en el ritmo general del bebé cuando aún tiene pocos datos.
- **Con pocos datos manda la edad; con muchos, el bebé.** El valor de la etapa
  pesa lo que unos dos registros, de modo que se diluye solo a medida que se
  acumula historial.

Dos detalles medidos en el comportamiento real: la ventana previa a la última
siesta del día se alarga (×1.09) y esa última siesta sale más corta (×0.91).
Las señales de sueño se avisan siempre 30 minutos antes.

El tramo que va de la última siesta a la noche **no** cuenta como ventana
típica: siempre es más largo y, si se incluyera, desplazaría hacia arriba todas
las ventanas del día.

### Contraste con la app real

Con un historial que reproduce el ritmo de un bebé real (ventanas de ~107 min,
siestas de ~45 min), partiendo del mismo despertar:

| | Napper | Nappy |
|---|---|---|
| 1.ª siesta | 08:26 – 09:10 | **08:26** – 09:11 |
| 2.ª siesta | 10:58 – 11:43 | **10:58 – 11:43** |
| 3.ª siesta | 13:27 – 14:12 | 13:30 – 14:15 |
| 4.ª siesta | 16:10 – 16:50 | 16:02 – 16:47 |

Y con siestas de ~35 min: Napper propone 14:37 – 15:12 y Nappy 14:38 – 15:13.
El panel «ritmo» de la pantalla Hoy muestra en todo momento con qué ventana y
qué duración se está calculando, y sobre cuántos registros.

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
