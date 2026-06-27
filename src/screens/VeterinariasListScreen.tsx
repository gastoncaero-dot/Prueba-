import { useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { veterinariasService } from '../services/veterinarias';
import { COLORS } from '../constants/theme';
import type { MascotasStackParamList } from '../navigation/types';
import type { Veterinaria } from '../types';

type Props = NativeStackScreenProps<MascotasStackParamList, 'Veterinarias'>;

// Directorio público de veterinarias. Solo mostramos las que tienen la
// suscripción activa: son las que pagaron para aparecer acá y atender
// turnos desde la app. Las que están en estado "pendiente" o "vencida"
// todavía no se muestran a los dueños de mascotas.
export function VeterinariasListScreen({ route, navigation }: Props) {
  const { usuario } = useAuth();
  const paraTurno = route.params?.paraTurno;
  const [veterinarias, setVeterinarias] = useState<Veterinaria[]>([]);
  const [cargando, setCargando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      setCargando(true);
      const zona = usuario?.zona;
      const promesa = zona ? veterinariasService.listarPorZona(zona) : veterinariasService.listar();
      promesa.then((lista) => {
        if (!activo) return;
        setVeterinarias(lista.filter((v) => v.estadoSuscripcion === 'activa'));
        setCargando(false);
      });
      return () => {
        activo = false;
      };
    }, [usuario?.zona]),
  );

  function handleSeleccionar(v: Veterinaria) {
    if (!paraTurno) return;
    navigation.navigate('NuevoTurno', {
      mascotaId: paraTurno.mascotaId,
      veterinariaId: v.id,
      veterinariaNombre: v.nombre,
    });
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
      {veterinarias.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🏥</Text>
          <Text style={styles.emptyTitle}>Todavía no hay veterinarias en tu zona</Text>
          <Text style={styles.emptySubtitle}>Estamos sumando veterinarias de a poco. Probá de nuevo más adelante.</Text>
        </View>
      ) : (
        <FlatList
          data={veterinarias}
          keyExtractor={(v) => v.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => handleSeleccionar(item)}>
              <Text style={styles.cardEmoji}>🏥</Text>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{item.nombre}</Text>
                <Text style={styles.cardDireccion}>{item.direccion}</Text>
                <Text style={styles.cardZona}>📍 {item.zona} · 📞 {item.telefono}</Text>
              </View>
            </Pressable>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: COLORS.blanco,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: COLORS.borde,
  },
  cardEmoji: { fontSize: 32 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '800', color: COLORS.carbon },
  cardDireccion: { fontSize: 13, color: COLORS.humo, marginTop: 2 },
  cardZona: { fontSize: 12, color: COLORS.humo, marginTop: 4 },
});
