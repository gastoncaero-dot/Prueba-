import { useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { mascotasService } from '../services/mascotas';
import { Button } from '../components/Button';
import { COLORS } from '../constants/theme';
import { emojiPorEspecie } from '../utils/petEmoji';
import type { MascotasStackParamList } from '../navigation/types';
import type { Mascota } from '../types';

type Props = NativeStackScreenProps<MascotasStackParamList, 'MascotasList'>;

export function MascotasListScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [cargando, setCargando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      let activo = true;
      setCargando(true);
      mascotasService.listarPorOwner(user.uid).then((lista) => {
        if (activo) {
          setMascotas(lista);
          setCargando(false);
        }
      });
      return () => {
        activo = false;
      };
    }, [user])
  );

  if (cargando) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.tierra} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {mascotas.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🐾</Text>
          <Text style={styles.emptyTitle}>Todavía no tenés mascotas</Text>
          <Text style={styles.emptySubtitle}>Registrá a tu primera mascota para empezar.</Text>
        </View>
      ) : (
        <FlatList
          data={mascotas}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => navigation.navigate('MascotaDetail', { mascotaId: item.id })}
            >
              <Text style={styles.cardEmoji}>{emojiPorEspecie(item.especie)}</Text>
              <View>
                <Text style={styles.cardName}>{item.nombre}</Text>
                <Text style={styles.cardBreed}>{item.raza}</Text>
              </View>
            </Pressable>
          )}
        />
      )}

      <View style={styles.footer}>
        <Button title="🐾 Agregar mascota" onPress={() => navigation.navigate('NuevaMascota')} />
        <Button
          title="🏥 Ver veterinarias"
          variant="ghost"
          onPress={() => navigation.navigate('Veterinarias')}
          style={styles.verVeterinarias}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.fondo },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyEmoji: { fontSize: 56, marginBottom: 12 },
  emptyTitle: { fontSize: 19, fontWeight: '800', color: COLORS.carbon, marginBottom: 6 },
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
  cardEmoji: { fontSize: 36 },
  cardName: { fontSize: 17, fontWeight: '800', color: COLORS.carbon },
  cardBreed: { fontSize: 13, color: COLORS.humo, marginTop: 2 },
  footer: { padding: 20, paddingTop: 0, gap: 8 },
  verVeterinarias: { marginTop: 0 },
});
