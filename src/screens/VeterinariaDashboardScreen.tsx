import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Alert, Linking, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Button } from '../components/Button';
import { useAuth } from '../hooks/useAuth';
import { veterinariasService } from '../services/veterinarias';
import { pagosService } from '../services/pagos';
import { COLORS } from '../constants/theme';
import type { Veterinaria } from '../types';

const ESTADO_INFO: Record<Veterinaria['estadoSuscripcion'], { emoji: string; texto: string; color: string }> = {
  pendiente: { emoji: '🟡', texto: 'Pendiente de pago', color: COLORS.amarillo },
  activa: { emoji: '🟢', texto: 'Suscripción activa', color: COLORS.bosque },
  vencida: { emoji: '🔴', texto: 'Pago vencido', color: COLORS.error },
  cancelada: { emoji: '⚪', texto: 'Cancelada', color: COLORS.humo },
};

export function VeterinariaDashboardScreen() {
  const { usuario } = useAuth();
  const [veterinaria, setVeterinaria] = useState<Veterinaria | null>(null);
  const [cargando, setCargando] = useState(true);
  const [iniciandoPago, setIniciandoPago] = useState(false);

  const cargar = useCallback(async () => {
    if (!usuario?.veterinariaId) return;
    setCargando(true);
    setVeterinaria(await veterinariasService.obtener(usuario.veterinariaId));
    setCargando(false);
  }, [usuario?.veterinariaId]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  async function handleSuscribirme() {
    if (!veterinaria) return;
    setIniciandoPago(true);
    try {
      const initPoint = await pagosService.crearSuscripcion(veterinaria.id);
      await Linking.openURL(initPoint);
    } catch {
      Alert.alert(
        'No pudimos iniciar el pago',
        'Probá de nuevo en un momento. Si el problema sigue, contactanos.',
      );
    } finally {
      setIniciandoPago(false);
    }
  }

  if (cargando || !veterinaria) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.tierra} />
      </View>
    );
  }

  const estado = ESTADO_INFO[veterinaria.estadoSuscripcion];
  const puedeSuscribirse = veterinaria.estadoSuscripcion !== 'activa';

  return (
    <View style={styles.container}>
      <Text style={styles.nombre}>{veterinaria.nombre}</Text>
      <Text style={styles.zona}>📍 {veterinaria.zona}</Text>

      <View style={[styles.estadoCard, { borderColor: estado.color }]}>
        <Text style={styles.estadoEmoji}>{estado.emoji}</Text>
        <View>
          <Text style={styles.estadoTexto}>{estado.texto}</Text>
          <Text style={styles.estadoSub}>USD 15/mes vía MercadoPago</Text>
        </View>
      </View>

      {puedeSuscribirse && (
        <Button title="Suscribirme ahora" onPress={handleSuscribirme} loading={iniciandoPago} style={styles.boton} />
      )}

      <Text style={styles.ayuda}>
        Una vez que se acredite el pago en MercadoPago, tu cuenta pasa a "Suscripción activa"
        automáticamente y vas a poder aparecer en el directorio de veterinarias que ven los dueños de mascotas.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.fondo, padding: 24, paddingTop: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.fondo },
  nombre: { fontSize: 24, fontWeight: '900', color: COLORS.carbon },
  zona: { fontSize: 14, color: COLORS.humo, marginTop: 4, marginBottom: 24 },
  estadoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.blanco,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
  },
  estadoEmoji: { fontSize: 28 },
  estadoTexto: { fontSize: 16, fontWeight: '800', color: COLORS.carbon },
  estadoSub: { fontSize: 13, color: COLORS.humo, marginTop: 2 },
  boton: { marginTop: 20 },
  ayuda: { fontSize: 13, color: COLORS.humo, marginTop: 24, lineHeight: 19 },
});
