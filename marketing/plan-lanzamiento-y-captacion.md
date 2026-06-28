# Plan de lanzamiento y captación — Patitas

> Todos los números de acá son **estimaciones** para razonar el tamaño del
> negocio, no datos oficiales. Sirven para tomar decisiones, no para poner
> en un pitch a un inversor sin verificarlos antes.

## 1. El problema de fondo: es un mercado de dos lados

Patitas tiene dos públicos:

- **Dueños de mascotas** (no pagan, usan la app gratis).
- **Veterinarias** (pagan la suscripción mensual).

El clásico problema del huevo y la gallina: una veterinaria no quiere pagar
por aparecer en un directorio vacío de usuarios, y un dueño no quiere usar
un directorio donde no hay veterinarias. Si intentás arrancar los dos lados
a la vez en toda la Argentina, no arranca ninguno.

**La solución está en el propio diseño de la app:** Patitas le sirve a un
dueño AUNQUE NO HAYA NI UNA VETERINARIA registrada. Es el carnet de vacunas
digital + recordatorios + perfil de la mascota. Ese valor "de un solo
jugador" es lo que rompe el huevo y la gallina:

1. Primero juntás **dueños** con la utilidad pura (vacunas y recordatorios).
2. Después le vendés a las **veterinarias**: "tus clientes ya están acá".

## 2. Tamaño del mercado (estimaciones)

### Veterinarias (los que pagan)
- Argentina: ~5.000 a 7.000 establecimientos veterinarios.
- CABA: ~400 a 700 clínicas de pequeños animales (mascotas).
- **No arranques por "Argentina". Arrancá por 2 o 3 barrios de CABA.**
  Un beachhead de 2-3 barrios son ~60 a 100 clínicas.

### Dueños de mascotas (los usuarios gratis)
- Argentina es uno de los países con MÁS mascotas por habitante del mundo
  (se estima que ~8 de cada 10 hogares tienen al menos una mascota).
- CABA: ~1,1 millón de hogares → cientos de miles de hogares con mascota.
- No necesitás a todos. Necesitás **densidad en tu barrio piloto**: que en
  Belgrano (o el barrio que elijas) lo use mucha gente, no 10 personas
  desparramadas por todo el país.

### Cuántas veterinarias entrarían realmente (año 1)
Vendiendo B2B a comercios chicos locales, una conversión razonable de un
funnel "tibio" (que ya te conoce) es 5-10%. Con ejecución buena y foco
hiperlocal, un objetivo realista de **año 1 es 15 a 40 veterinarias
pagando**. Parece poco, pero:
- 30 veterinarias a ~USD 15/mes = ~USD 450/mes = ~USD 5.400/año.
- El objetivo del año 1 NO es la plata, es **probar que retienen** (que no
  se dan de baja al segundo mes). Si retienen, escalás a otros barrios.

## 3. El motor de crecimiento (el "flywheel")

La veterinaria no es solo el cliente que paga: es también tu **canal de
captación de dueños**. El círculo virtuoso:

1. Una veterinaria empieza a usar Patitas.
2. Le dice a SUS clientes: "descargá Patitas y sacá el turno por acá".
3. Esos dueños se registran y cargan a sus mascotas.
4. Esos dueños son la **prueba social** para venderle a la PRÓXIMA
   veterinaria del barrio: "mirá, 200 dueños de Belgrano ya lo usan".
5. Volvés al paso 1 con más fuerza.

Cada veterinaria que sumás te trae dueños, y cada dueño te hace más fácil
sumar la próxima veterinaria. Ese es el corazón del crecimiento.

## 4. Por dónde lanzar: canales

### Para DUEÑOS (B2C) — masivo
- **Instagram (canal principal).** El contenido de mascotas funciona
  buenísimo. Reels cortos, hashtags del barrio (#Belgrano #PerrosCABA),
  colaboraciones con cuentas de mascotas locales. Ver
  `redes-sociales-lanzamiento.md` para los posteos ya escritos.
- **TikTok (secundario).** Bueno para alcance y viralización, público más
  joven. Mismo contenido que IG, reformateado. No te mata si no lo hacés al
  principio, pero suma.
- **WhatsApp (NO para spam).** No mandes mensajes masivos en frío: te
  reportan y te banean el número. WhatsApp sirve para:
  - El **boca a boca**: que un dueño le pase el link a un amigo. Poné un
    botón "compartir Patitas" bien a mano.
  - **Estados de WhatsApp** de la veterinaria mostrando que usa la app.

### Para VETERINARIAS (B2B) — uno a uno
- **Venta a pie / fundador.** Las primeras 10-20 NO se consiguen con
  anuncios. Se consiguen entrando a la veterinaria, mostrando la app en el
  celu, y dejando el `pitch-veterinarias.md`. Cara a cara.
- **WhatsApp 1:1** como seguimiento después de la visita (acá sí, porque es
  una conversación que ellos esperan, no spam).
- **Instagram de veterinarias.** Muchas clínicas tienen IG. Seguilas,
  comentá, mandá DM presentándote. Es B2B pero por el canal que ya usan.

### Canal "de calle" que casi nadie aprovecha
- **QR en la sala de espera** de las propias veterinarias.
- **Paseadores de perros.** Un paseador toca 10-20 dueños por día. Si
  convencés a 5 paseadores de un barrio, tenés un ejército de distribución.
- **Plazas y parques** donde va la gente con los perros: flyers con QR.

## 5. Plan de 90 días (hiperlocal)

### Días 1-30: preparar y elegir el barrio
- Elegí UN barrio de CABA para empezar (sugerencia: Belgrano, Palermo o
  Caballito, por densidad de mascotas y poder adquisitivo).
- Terminá el despliegue técnico (Cloud Functions + MercadoPago) desde una
  compu. (Ver `functions/README.md`.)
- Conseguí 3-5 veterinarias "amigas" que prueben gratis los primeros meses.
  Sin esto, el directorio arranca vacío.
- Armá el Instagram de Patitas con los 5 posteos ya escritos.

### Días 31-60: sembrar dueños
- Empezá a postear en IG/TikTok 3 veces por semana (contenido de utilidad,
  no de venta: "¿sabés cuándo vence la vacuna de tu perro?").
- Pegá QRs en las salas de espera de las veterinarias amigas.
- Sumá 2-3 paseadores como difusores.
- **Meta: 100-300 dueños registrados en el barrio piloto.**

### Días 61-90: vender veterinarias con prueba social
- Ahora SÍ salí a vender a las veterinarias del barrio, mostrando los
  números: "X dueños de este barrio ya usan Patitas".
- Ofrecé el primer mes gratis para sacar el "no" fácil.
- **Meta: 10-15 veterinarias pagando, retención > 80% al mes siguiente.**

## 6. Recomendación de prioridad de canales

Si tenés que elegir por dónde poner la energía, en orden:

1. **Venta a pie a veterinarias** (sin esto, no hay negocio).
2. **Instagram para dueños** (el motor de volumen barato).
3. **QR en salas de espera + paseadores** (distribución gratis y local).
4. **TikTok** (cuando ya tengas ritmo de contenido).
5. WhatsApp solo como herramienta de boca a boca y seguimiento, nunca como
   canal de spam masivo.

## 7. Métrica que importa de verdad

No te obsesiones con descargas. La métrica que dice si esto es un negocio:

> **¿Las veterinarias siguen pagando el mes 2, el mes 3?**

Si retienen, todo lo demás (más barrios, más ciudades) es repetir la receta.
Si no retienen, ningún anuncio te va a salvar: hay que arreglar el producto
o la propuesta antes de gastar en marketing.
