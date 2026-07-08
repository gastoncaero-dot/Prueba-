# 🌙 Nappy — app de sueño para bebés

Aplicación web inspirada en [Napper](https://napper.app), la app de seguimiento
de sueño infantil. Predice las siestas y la hora de dormir de tu bebé según su
edad, usando las **ventanas de vigilia** recomendadas por las guías de sueño
infantil.

## Funcionalidades

- **Predicción de siestas** — al registrar cuándo se despertó el bebé, la app
  calcula cuándo debería ser la próxima siesta o la hora de dormir según su
  edad (ventana de vigilia, número de siestas y sueño total recomendado).
- **Cronómetro de sueño** — botones «Se durmió» / «Se despertó» que registran
  cada sueño con su duración.
- **Horario estimado del día** — proyección de las siestas restantes y la hora
  de dormir de la noche.
- **Registro del bebé** — tomas de pecho, biberones y cambios de pañal con un
  toque.
- **Sonidos para dormir** — ruido blanco, lluvia, vientre materno (con latido)
  y olas del mar, generados en tiempo real con Web Audio (sin archivos de
  audio), con control de volumen y temporizador de apagado.
- **Tendencias** — gráfico de horas de sueño de los últimos 7 días con línea de
  objetivo, estadísticas e historial.
- **Consejos** — recomendaciones de sueño adaptadas a la edad del bebé.

Todos los datos se guardan localmente en el navegador (`localStorage`); no hay
servidor ni cuentas.

## Cómo usarla

No requiere instalación ni dependencias. Opciones:

1. Abrir `index.html` directamente en el navegador, o
2. Servirla localmente:

   ```bash
   python3 -m http.server 8000
   # → http://localhost:8000
   ```

Funciona muy bien en el móvil (diseño *mobile-first*); podés «Añadir a pantalla
de inicio» para usarla como una app.

## Estructura

```
index.html      Interfaz (onboarding, pestañas Hoy/Registro/Sonidos/Tendencias/Consejos)
css/style.css   Estética nocturna: cielo estrellado, luna, tarjetas translúcidas
js/app.js       Lógica: predicción por edad, cronómetro, registro, Web Audio, gráficos
```

> ⚠️ Esta app es un proyecto educativo y no sustituye el consejo de
> profesionales de la salud infantil.
