import { useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { mascotasService } from '../services/mascotas';
import { vacunasService } from '../services/vacunas';
import { turnosService } from '../services/turnos';
import { Button } from '../components/Button';
import { AnilloSalud } from '../components/AnilloSalud';
import { COLORS } from '../constants/theme';
import { emojiPorEspecie } from '../utils/petEmoji';
import { calcularSalud } from '../utils/salud';
import type { MascotasStackParamList } from '../navigation/types';
import type { Mascota } from '../types';

type Props = NativeStackScreenProps<MascotasStackParamList, 'MascotasList'>;

export function MascotasListScreen({ navigation }: Props) {
  const { user, usuario } = useAuth();
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  // Puntaje de salud por mascota. Se calcula aparte (y después) de la lista
  // porque necesita las vacunas y turnos de cada una: primero mostramos las
  // tarjetas y los anillos aparecen apenas terminan esas consultas.
  const [salud, setSalud] = useState<Record<string, number>>({});
  const [cargando, setCargando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      let activo = true;
      setCargando(true);
      mascotasService.listarPorOwner(user.uid).then(async (lista) => {
        if (!activo) return;
        setMascotas(lista);
        setCargando(false);
        const entradas = await Promise.all(
          lista.map(async (m) => {
            const [vacunas, turnos] = await Promise.all([
              vacunasService.listarPorMascota(m.id),
              turnosService.listarPorMascota(m.id),
            ]);
            return [m.id, calcularSalud(m, vacunas, turnos).puntaje] as const;
          }),
        );
        if (activo) setSalud(Object.fromEntries(entradas));
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

  const racha = usuario?.racha ?? 0;

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
          ListHeaderComponent={
            <View style={styles.rachaCard}>
              <Text style={styles.rachaFuego}>🔥</Text>
              <Text style={styles.rachaTexto}>
                {racha >= 2
                  ? `¡${racha} días seguidos cuidándolos!`
                  : 'Entrá todos los días y armá tu racha de cuidado.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => navigation.navigate('MascotaDetail', { mascotaId: item.id })}
            >
              <Text style={styles.cardEmoji}>{emojiPorEspecie(item.especie)}</Text>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{item.nombre}</Text>
                <Text style={styles.cardBreed}>{item.raza}</Text>
              </View>
              {salud[item.id] !== undefined && <AnilloSalud puntaje={salud[item.id]!} />}
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
  rachaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.blanco,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: COLORS.amarillo,
  },
  rachaFuego: { fontSize: 22 },
  rachaTexto: { flex: 1, fontSize: 13, fontWeight: '700', color: COLORS.carbon },
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
  cardInfo: { flex: 1 },
  cardName: { fontSize: 17, fontWeight: '800', color: COLORS.carbon },
  cardBreed: { fontSize: 13, color: COLORS.humo, marginTop: 2 },
  footer: { padding: 20, paddingTop: 0, gap: 8 },
  verVeterinarias: { marginTop: 0 },
});
