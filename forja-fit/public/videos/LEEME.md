# Tus videos

Copiá acá los videos de demostración que quieras usar sin depender de internet.

Después, en la app, entrá al ejercicio → **Agregar video** y escribí la ruta:

```
./videos/nombre-del-archivo.mp4
```

Formatos que reproduce el navegador: `.mp4` (H.264 es el más compatible),
`.webm` y `.ogv`.

Si vas a cargar muchos de una vez, armá un JSON con pares
`"id-del-ejercicio": "./videos/archivo.mp4"` e importalo desde
**Perfil → Videos → Importar videos**. Los ids están en `src/data/exercises.ts`.
