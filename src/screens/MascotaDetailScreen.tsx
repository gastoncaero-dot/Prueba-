import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { mascotasService } from '../services/mascotas';
import { vacunasService } from '../services/vacunas';
import { turnosService } from '../services/turnos';
import { Button } from '../components/Button';
import { AnilloSalud } from '../components/AnilloSalud';
import { COLORS } from '../constants/theme';
import { emojiPorEspecie } from '../utils/petEmoji';
import { edadEnAnios, formatDate, diasHasta } from '../utils/date';
import { calcularSalud, mensajeSalud, type ItemSalud } from '../utils/salud';
import type { MascotasStackParamList } from '../navigation/types';
import type { Mascota, Vacuna, Turno } from '../types';

type Props = NativeStackScreenProps<MascotasStackParamList, 'MascotaDetail'>;

export function MascotaDetailScreen({ route, navigation }: Props) {
  const { mascotaId } = route.params;
  const [mascota, setMascota] = useState<Mascota | null>(null);
  const [vacunas, setVacunas] = useState<Vacuna[]>([]);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [cargando, setCargando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      setCargando(true);
      Promise.all([
        mascotasService.obtener(mascotaId),
        vacunasService.listarPorMascota(mascotaId),
        turnosService.listarPorMascota(mascotaId),
      ]).then(([m, v, t]) => {
        if (!activo) return;
        setMascota(m);
        setVacunas(v);
        setTurnos(t);
        setCargando(false);
      });
      return () => {
        activo = false;
      };
    }, [mascotaId])
  );

  if (cargando || !mascota) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.tierra} />
      </View>
    );
  }

  const salud = calcularSalud(mascota, vacunas, turnos);

  // Cada "misión" incompleta lleva directo a la pantalla que la resuelve.
  function irAMision(item: ItemSalud) {
    if (item.clave === 'vacunas') {
      navigation.navigate('NuevaVacuna', { mascotaId });
    } else {
      // Tanto el peso (se registra en la consulta) como el control se
      // resuelven agendando un turno.
      navigation.navigate('NuevoTurno', { mascotaId });
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.avatar}>{emojiPorEspecie(mascota.especie)}</Text>
        <Text style={styles.name}>{mascota.nombre}</Text>
        <Text style={styles.breed}>
          {mascota.raza} · {edadEnAnios(mascota.fechaNacimiento)} años
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.saludCard}>
          <AnilloSalud puntaje={salud.puntaje} tamanio={64} />
          <View style={styles.saludInfo}>
            <Text style={styles.saludTitulo}>Salud al día</Text>
            <Text style={styles.saludMensaje}>{mensajeSalud(salud.puntaje)}</Text>
          </View>
        </View>
        {salud.items.map((item) => (
          <Pressable
            key={item.clave}
            disabled={item.completo}
            onPress={() => irAMision(item)}
            style={[styles.misionRow, item.completo && styles.misionCompleta]}
          >
            <Text style={styles.misionEmoji}>{item.completo ? '✅' : item.emoji}</Text>
            <View style={styles.misionInfo}>
              <Text style={styles.misionTitulo}>{item.titulo}</Text>
              <Text style={styles.misionDetalle}>{item.detalle}</Text>
            </View>
            {!item.completo && <Text style={styles.misionPuntos}>+{item.puntos}</Text>}
          </Pressable>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>💉 Vacunas</Text>
          <Button
            title="+ Agregar"
            variant="ghost"
            onPress={() => navigation.navigate('NuevaVacuna', { mascotaId })}
            style={styles.smallButton}
          />
        </View>
        {vacunas.length === 0 ? (
          <Text style={styles.emptyText}>Todavía no registraste vacunas.</Text>
        ) : (
          vacunas.map((v) => {
            const dias = diasHasta(v.fechaVence);
            const vencida = dias < 0;
            return (
              <View key={v.id} style={styles.row}>
                <View>
                  <Text style={styles.rowTitle}>{v.tipo}</Text>
                  <Text style={styles.rowSubtitle}>Vence: {formatDate(v.fechaVence)}</Text>
                </View>
                <Text style={[styles.badge, vencida ? styles.badgeVencida : styles.badgeOk]}>
                  {vencida ? 'Vencida' : `En ${dias} días`}
                </Text>
              </View>
            );
          })
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📅 Turnos</Text>
          <Button
            title="+ Agregar"
            variant="ghost"
            onPress={() => navigation.navigate('NuevoTurno', { mascotaId })}
            style={styles.smallButton}
          />
        </View>
        {turnos.length === 0 ? (
          <Text style={styles.emptyText}>Todavía no tenés turnos agendados.</Text>
        ) : (
          turnos.map((t) => (
            <View key={t.id} style={styles.row}>
              <Text style={styles.rowTitle}>{formatDate(t.fecha)}</Text>
              <Text style={styles.badge}>{t.estado}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.fondo },
  content: { padding: 24, paddingBottom: 48 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 28 },
  avatar: { fontSize: 64 },
  name: { fontSize: 26, fontWeight: '900', color: COLORS.carbon, marginTop: 8 },
  breed: { fontSize: 14, color: COLORS.humo, marginTop: 4 },
  section: { marginBottom: 28 },
  saludCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: COLORS.blanco,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.borde,
    marginBottom: 10,
  },
  saludInfo: { flex: 1 },
  saludTitulo: { fontSize: 16, fontWeight: '800', color: COLORS.carbon },
  saludMensaje: { fontSize: 12, color: COLORS.humo, marginTop: 3 },
  misionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.blanco,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: COLORS.borde,
  },
  misionCompleta: { opacity: 0.55 },
  misionEmoji: { fontSize: 20 },
  misionInfo: { flex: 1 },
  misionTitulo: { fontSize: 13, fontWeight: '700', color: COLORS.carbon },
  misionDetalle: { fontSize: 11.5, color: COLORS.humo, marginTop: 2 },
  misionPuntos: { fontSize: 14, fontWeight: '900', color: COLORS.tierra },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: COLORS.carbon },
  smallButton: { paddingVertical: 8, paddingHorizontal: 14 },
  emptyText: { color: COLORS.humo, fontSize: 13 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.blanco,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: COLORS.borde,
  },
  rowTitle: { fontWeight: '700', color: COLORS.carbon, fontSize: 14 },
  rowSubtitle: { fontSize: 12, color: COLORS.humo, marginTop: 2 },
  badge: { fontSize: 11, fontWeight: '700', color: COLORS.humo, textTransform: 'capitalize' },
  badgeOk: { color: COLORS.bosqueOscuro },
  badgeVencida: { color: COLORS.error },
});
