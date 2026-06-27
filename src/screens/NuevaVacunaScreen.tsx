import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { vacunasService } from '../services/vacunas';
import { parseFechaArgentina } from '../utils/date';
import { COLORS } from '../constants/theme';
import type { MascotasStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<MascotasStackParamList, 'NuevaVacuna'>;

export function NuevaVacunaScreen({ route, navigation }: Props) {
  const { mascotaId } = route.params;
  const [tipo, setTipo] = useState('');
  const [aplicada, setAplicada] = useState(false);
  const [fechaAplicada, setFechaAplicada] = useState('');
  const [fechaVence, setFechaVence] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function handleGuardar() {
    if (!tipo || !fechaVence) {
      Alert.alert('Faltan datos', 'Completá al menos el tipo y la fecha de vencimiento.');
      return;
    }
    const vence = parseFechaArgentina(fechaVence);
    if (!vence) {
      Alert.alert('Fecha inválida', 'Usá el formato DD/MM/AAAA.');
      return;
    }
    const aplicadaFecha = aplicada ? parseFechaArgentina(fechaAplicada) : null;
    if (aplicada && !aplicadaFecha) {
      Alert.alert('Fecha inválida', 'Completá la fecha en que se aplicó, formato DD/MM/AAAA.');
      return;
    }
    setGuardando(true);
    try {
      await vacunasService.crear({
        mascotaId,
        tipo: tipo.trim(),
        fechaAplicada: aplicadaFecha,
        fechaVence: vence,
        veterinariaId: null,
        aplicada,
      });
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'No pudimos guardar la vacuna. Probá de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Nueva vacuna</Text>

      <Text style={styles.label}>Tipo</Text>
      <Input placeholder="Ej: Antirrábica" value={tipo} onChangeText={setTipo} />

      <Text style={styles.label}>¿Ya se aplicó?</Text>
      <View style={styles.chipRow}>
        <Pressable onPress={() => setAplicada(true)} style={[styles.chip, aplicada && styles.chipActive]}>
          <Text style={[styles.chipText, aplicada && styles.chipTextActive]}>Sí</Text>
        </Pressable>
        <Pressable onPress={() => setAplicada(false)} style={[styles.chip, !aplicada && styles.chipActive]}>
          <Text style={[styles.chipText, !aplicada && styles.chipTextActive]}>No, todavía</Text>
        </Pressable>
      </View>

      {aplicada && (
        <>
          <Text style={styles.label}>Fecha en que se aplicó</Text>
          <Input
            placeholder="DD/MM/AAAA"
            keyboardType="numeric"
            value={fechaAplicada}
            onChangeText={setFechaAplicada}
          />
        </>
      )}

      <Text style={styles.label}>Fecha de vencimiento</Text>
      <Input placeholder="DD/MM/AAAA" keyboardType="numeric" value={fechaVence} onChangeText={setFechaVence} />

      <Button title="Guardar vacuna" onPress={handleGuardar} loading={guardando} style={styles.submit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.fondo },
  content: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: '900', color: COLORS.carbon, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.carbon, marginBottom: 8, marginTop: 16 },
  chipRow: { flexDirection: 'row', gap: 10 },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: COLORS.borde,
    backgroundColor: COLORS.blanco,
  },
  chipActive: { backgroundColor: COLORS.tierra, borderColor: COLORS.tierra },
  chipText: { fontWeight: '600', color: COLORS.carbon },
  chipTextActive: { color: COLORS.blanco },
  submit: { marginTop: 28 },
});
