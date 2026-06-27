import { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { turnosService } from '../services/turnos';
import { mascotasService } from '../services/mascotas';
import { Button } from '../components/Button';
import { COLORS } from '../constants/theme';
import { formatDate } from '../utils/date';
import type { VeterinariaTurnosStackParamList } from '../navigation/types';
import type { Turno, EstadoTurno } from '../types';

type Props = NativeStackScreenProps<VeterinariaTurnosStackParamList, 'VeterinariaTurnos'>;

// Un turno solo guarda mascotaId, así que para mostrar un nombre legible
// completamos el nombre de cada mascota en un mapa aparte en vez de guardar
// datos de la mascota duplicados dentro del turno.
type TurnoConMascota = Turno & { nombreMascota: string };

export function VeterinariaTurnosScreen({ navigation }: Props) {
  const { usuario } = useAuth();
  const [turnos, setTurnos] = useState<TurnoConMascota[]>([]);
  const [cargando, setCargando] = useState(true);
  const [actualizandoId, setActualizandoId] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    if (!usuario?.veterinariaId) return;
    setCargando(true);
    const lista = await turnosService.listarPorVeterinaria(usuario.veterinariaId);
    const conNombre = await Promise.all(
      lista.map(async (t) => {
        const mascota = await mascotasService.obtener(t.mascotaId);
        return { ...t, nombreMascota: mascota?.nombre ?? 'Mascota' };
      }),
    );
    conNombre.sort((a, b) => a.fecha.toMillis() - b.fecha.toMillis());
    setTurnos(conNombre);
    setCargando(false);
  }, [usuario?.veterinariaId]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  async function cambiarEstado(turno: TurnoConMascota, estado: EstadoTurno) {
    setActualizandoId(turno.id);
    try {
      await turnosService.actualizar(turno.id, { estado });
      await cargar();
    } catch {
      Alert.alert('Error', 'No pudimos actualizar el turno. Probá de nuevo.');
    } finally {
      setActualizandoId(null);
    }
  }

  if (cargando) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.tierra} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {turnos.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>📅</Text>
          <Text style={styles.emptyTitle}>Todavía no tenés turnos</Text>
          <Text style={styles.emptySubtitle}>Cuando un dueño agende un turno con vos, va a aparecer acá.</Text>
        </View>
      ) : (
        <FlatList
          data={turnos}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardMascota}>🐾 {item.nombreMascota}</Text>
              <Text style={styles.cardFecha}>{formatDate(item.fecha)}</Text>
              <Text style={styles.cardEstado}>{item.estado}</Text>

              <View style={styles.acciones}>
                {item.estado === 'pendiente' && (
                  <Button
                    title="Confirmar"
                    onPress={() => cambiarEstado(item, 'confirmado')}
                    loading={actualizandoId === item.id}
                    style={styles.accionBtn}
                  />
                )}
                {(item.estado === 'pendiente' || item.estado === 'confirmado') && (
                  <>
                    <Button
                      title="Completar"
                      onPress={() =>
                        navigation.navigate('NuevaConsulta', {
                          turnoId: item.id,
                          mascotaId: item.mascotaId,
                          veterinariaId: item.veterinariaId,
                        })
                      }
                      style={styles.accionBtn}
                    />
                    <Button
                      title="Cancelar"
                      variant="ghost"
                      onPress={() => cambiarEstado(item, 'cancelado')}
                      loading={actualizandoId === item.id}
                      style={styles.accionBtn}
                    />
                  </>
                )}
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.fondo },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyEmoji: { fontSize: 56, marginBottom: 12 },
  emptyTitle: { fontSize: 19, fontWeight: '800', color: COLORS.carbon, marginBottom: 6, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: COLORS.humo, textAlign: 'center' },
  list: { padding: 20, gap: 12 },
  card: {
    backgroundColor: COLORS.blanco,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.borde,
  },
  cardMascota: { fontSize: 16, fontWeight: '800', color: COLORS.carbon },
  cardFecha: { fontSize: 13, color: COLORS.humo, marginTop: 4 },
  cardEstado: { fontSize: 12, fontWeight: '700', color: COLORS.tierra, marginTop: 4, textTransform: 'capitalize' },
  acciones: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  accionBtn: { paddingVertical: 8, paddingHorizontal: 14, flexGrow: 0 },
});
