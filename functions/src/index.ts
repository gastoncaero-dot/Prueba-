import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as logger from 'firebase-functions/logger';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { MercadoPagoConfig, PreApproval } from 'mercadopago';

initializeApp();
const db = getFirestore();

// El access token NUNCA va en el código ni en el cliente: se guarda como
// secreto de Cloud Functions con:
//   firebase functions:secrets:set MERCADOPAGO_ACCESS_TOKEN
const MERCADOPAGO_ACCESS_TOKEN = defineSecret('MERCADOPAGO_ACCESS_TOKEN');

// Precio de la suscripción mensual. MercadoPago Argentina solo permite
// cobrar en ARS, así que el monto real en pesos hay que actualizarlo a mano
// (o automatizarlo después con una cotización) para que siga representando
// los USD 15/mes prometidos en la landing a medida que cambie el dólar.
const PRECIO_MENSUAL_ARS = Number(process.env.PRECIO_MENSUAL_ARS ?? '15000');

const REGION = 'southamerica-east1';

// Callable que invoca la app (ver src/services/pagos.ts en el cliente).
// Crea un "preapproval" (suscripción recurrente) de MercadoPago para la
// veterinaria indicada y devuelve la URL de checkout (init_point) para que
// la app la abra en el navegador. No marcamos nada como "activa" acá: eso
// solo lo hace mercadoPagoWebhook, una vez que MercadoPago confirma el pago.
export const crearSuscripcion = onCall(
  { region: REGION, secrets: [MERCADOPAGO_ACCESS_TOKEN] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Tenés que iniciar sesión.');
    }

    const veterinariaId = request.data?.veterinariaId;
    if (typeof veterinariaId !== 'string' || !veterinariaId) {
      throw new HttpsError('invalid-argument', 'Falta veterinariaId.');
    }

    const veterinariaRef = db.collection('veterinarias').doc(veterinariaId);
    const veterinariaSnap = await veterinariaRef.get();
    if (!veterinariaSnap.exists) {
      throw new HttpsError('not-found', 'No encontramos esa veterinaria.');
    }

    const veterinaria = veterinariaSnap.data()!;
    if (veterinaria.ownerId !== request.auth.uid) {
      throw new HttpsError('permission-denied', 'Esta veterinaria no es tuya.');
    }

    const client = new MercadoPagoConfig({ accessToken: MERCADOPAGO_ACCESS_TOKEN.value() });
    const preApproval = new PreApproval(client);

    try {
      const resultado = await preApproval.create({
        body: {
          reason: `Patitas - suscripción mensual (${veterinaria.nombre})`,
          // external_reference es lo que nos permite, en el webhook, saber
          // a qué veterinaria corresponde este preapproval.
          external_reference: veterinariaId,
          payer_email: request.auth.token.email,
          back_url: 'https://patitas.app/suscripcion-confirmada',
          auto_recurring: {
            frequency: 1,
            frequency_type: 'months',
            transaction_amount: PRECIO_MENSUAL_ARS,
            currency_id: 'ARS',
          },
          status: 'pending',
        },
      });

      await veterinariaRef.update({ mercadoPagoSubscriptionId: resultado.id ?? null });

      return { initPoint: resultado.init_point };
    } catch (error) {
      logger.error('Error creando preapproval de MercadoPago', error);
      throw new HttpsError('internal', 'No pudimos iniciar el pago. Probá de nuevo.');
    }
  },
);

// Webhook que MercadoPago llama cuando cambia el estado de un preapproval
// (por ejemplo: el usuario paga la primera cuota, o deja de pagar). Esta es
// la ÚNICA función que puede cambiar estadoSuscripcion, porque usa
// firebase-admin (que ignora las Firestore Security Rules).
export const mercadoPagoWebhook = onRequest(
  { region: REGION, secrets: [MERCADOPAGO_ACCESS_TOKEN] },
  async (req, res) => {
    const tipo = req.query.type ?? req.body?.type;
    const preapprovalId = req.query['data.id'] ?? req.body?.data?.id;

    if (tipo !== 'subscription_preapproval' || !preapprovalId) {
      // Otras notificaciones (pagos sueltos, etc.) no nos interesan acá.
      res.status(200).send('ignorado');
      return;
    }

    try {
      const client = new MercadoPagoConfig({ accessToken: MERCADOPAGO_ACCESS_TOKEN.value() });
      const preApproval = new PreApproval(client);
      const detalle = await preApproval.get({ id: String(preapprovalId) });

      const veterinariaId = detalle.external_reference;
      if (!veterinariaId) {
        res.status(200).send('sin external_reference');
        return;
      }

      const estadoSuscripcion = mapearEstadoMercadoPago(detalle.status);
      await db.collection('veterinarias').doc(veterinariaId).update({
        estadoSuscripcion,
        mercadoPagoSubscriptionId: detalle.id ?? null,
      });

      res.status(200).send('ok');
    } catch (error) {
      logger.error('Error procesando webhook de MercadoPago', error);
      // 200 para que MercadoPago no siga reintentando un error que no se va
      // a resolver solo (igual queda en los logs para revisarlo a mano).
      res.status(200).send('error registrado');
    }
  },
);

function mapearEstadoMercadoPago(estadoMp: string | undefined): 'activa' | 'vencida' | 'cancelada' | 'pendiente' {
  switch (estadoMp) {
    case 'authorized':
      return 'activa';
    case 'paused':
      return 'vencida';
    case 'cancelled':
      return 'cancelada';
    default:
      return 'pendiente';
  }
}
