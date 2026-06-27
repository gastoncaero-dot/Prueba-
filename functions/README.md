# Cloud Functions de Patitas

Dos funciones, ambas en la región `southamerica-east1`:

- **crearSuscripcion** (callable): la app la llama cuando una veterinaria toca "Suscribirme". Crea un preapproval (suscripción recurrente) en MercadoPago y devuelve la URL de checkout.
- **mercadoPagoWebhook** (HTTP): MercadoPago la llama sola cuando cambia el estado de un preapproval (pago acreditado, pausado, cancelado). Es la única que puede poner `estadoSuscripcion: 'activa'` en Firestore.

## Antes de deployar

1. Necesitás un proyecto de Firebase en plan **Blaze** (las Cloud Functions no corren en el plan gratis Spark).
2. Conseguí el **access token de producción** de tu cuenta de MercadoPago (Tu negocio > Configuración > Credenciales).
3. Guardalo como secreto (nunca lo pongas en un .env ni en el código):
   ```
   firebase functions:secrets:set MERCADOPAGO_ACCESS_TOKEN
   ```
4. (Opcional) Si querés ajustar el precio mensual en pesos, definí la variable de entorno `PRECIO_MENSUAL_ARS` en `functions/.env` (este archivo SÍ podés versionarlo si el monto no es secreto, pero por defecto no se commitea nada acá).
5. En MercadoPago, configurá la URL del webhook apuntando a la URL que te da `firebase deploy --only functions` para `mercadoPagoWebhook`.

## Deploy

```
cd functions
npm install
firebase deploy --only functions
```
