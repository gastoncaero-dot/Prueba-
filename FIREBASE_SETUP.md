# Configurar Firebase en Nappy

Nappy puede sincronizar datos entre dispositivos usando Firebase. Esto permite:
- ✅ Acceder a los datos desde cualquier dispositivo (celular, tablet, computadora)
- ✅ Sincronización automática
- ✅ Login con Google o email
- ✅ Funcionamiento offline (datos se guardan localmente también)

## Pasos para configurar:

### 1. Crear un proyecto en Firebase

1. Entrá a [Firebase Console](https://console.firebase.google.com)
2. Clickeá "Crear proyecto"
3. Ponele un nombre (ej: "Nappy")
4. Desactivá "Google Analytics" (opcional)
5. Clickeá "Crear proyecto"

### 2. Habilitar autenticación con Google

1. En el menú lateral, clickeá **Compilación → Autenticación**
2. Clickeá **Crear método de inicio de sesión**
3. Seleccioná **Google**
4. Activá el toggle
5. Seleccioná tu email de proyecto
6. Clickeá **Guardar**

### 3. Crear base de datos Firestore

1. En el menú lateral, clickeá **Compilación → Firestore Database**
2. Clickeá **Crear base de datos**
3. Seleccioná **Empezar en modo de prueba** (luego configuras reglas si querés)
4. Elegí la región más cercana
5. Clickeá **Crear**

### 4. Obtener configuración de Firebase

1. Clickeá el ícono de engranaje (⚙️) en la esquina superior
2. Clickeá **Configuración del proyecto**
3. Desplazate a "Tus apps" y clickeá "</>"
4. Nombrá la app "nappy-web"
5. Copiar el objeto `firebaseConfig`

### 5. Actualizar archivo de configuración

1. Abrí `public/firebase-config.js`
2. Reemplazá los valores en `firebaseConfig` con los que copiaste
3. **NO compartas** el archivo con las credenciales públicamente

Ejemplo:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyCHUHKm9qV7MzR_tu_clave_aqui",
  authDomain: "nappy-xxxxx.firebaseapp.com",
  projectId: "nappy-xxxxx",
  // ... etc
};
```

### 6. Configurar reglas de seguridad de Firestore (opcional pero recomendado)

En Firestore Database → Reglas, reemplazá por:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

### 7. Subir a Netlify

Hacé push de los cambios y sube la carpeta `public/` a Netlify como antes:
```bash
npm install -g netlify-cli
netlify deploy --dir=public --prod
```

O si usás GitHub: conectá el repo y Netlify va a auto-deployar.

## Uso en la app

- **Sin login**: Todo funciona localmente (localStorage)
- **Con login**: Se sincronizan los datos a Firebase automáticamente
- Los datos se guardan en AMBOS lados (localStorage + Firestore) para funcionamiento offline

¡Listo! Ya podés usar Nappy desde cualquier dispositivo. 🎉
