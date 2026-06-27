import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Timestamp } from 'firebase/firestore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { consultasService } from '../services/consultas';
import { turnosService } from '../services/turnos';
import { mascotasService } from '../services/mascotas';
import { COLORS } from '../constants/theme';
import type { VeterinariaTurnosStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<VeterinariaTurnosStackParamList, 'NuevaConsulta'>;

// La veterinaria carga esto al terminar de atender un turno. Además de
// crear la consulta, marcamos el turno como "completado" y agregamos el
// peso al historial de la mascota: son tres escrituras relacionadas con
// una sola acción del usuario, así que las hacemos todas juntas acá.
export function NuevaConsultaScreen({ route, navigation }: Props) {
  const { turnoId, mascotaId, veterinariaId } = route.params;
  const [motivo, setMotivo] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [peso, setPeso] = useState('');
  const [notas, setNotas] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function handleGuardar() {
    if (!motivo || !diagnostico || !peso) {
      Alert.alert('Faltan datos', 'Completá motivo, diagnóstico y peso.');
      return;
    }
    const pesoNumero = Number(peso.replace(',', '.'));
    if (Number.isNaN(pesoNumero) || pesoNumero <= 0) {
      Alert.alert('Peso inválido', 'Ingresá el peso en kg, por ejemplo 7.5.');
      return;
    }
    setGuardando(true);
    try {
      const ahora = Timestamp.now();
      await consultasService.crear({
        mascotaId,
        veterinariaId,
        fecha: ahora,
        motivo: motivo.trim(),
        diagnostico: diagnostico.trim(),
        peso: pesoNumero,
        notas: notas.trim(),
      });
      await turnosService.actualizar(turnoId, { estado: 'completado' });
      const mascota = await mascotasService.obtener(mascotaId);
      if (mascota) {
        await mascotasService.actualizar(mascotaId, {
          peso: [...mascota.peso, { valor: pesoNumero, fecha: ahora }],
        });
      }
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'No pudimos guardar la consulta. Probá de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Cargar consulta</Text>

      <Text style={styles.label}>Motivo</Text>
      <Input placeholder="Ej: Control anual" value={motivo} onChangeText={setMotivo} />

      <Text style={styles.label}>Diagnóstico</Text>
      <Input placeholder="Ej: Sano, sin observaciones" value={diagnostico} onChangeText={setDiagnostico} />

      <Text style={styles.label}>Peso (kg)</Text>
      <Input placeholder="Ej: 7.5" keyboardType="decimal-pad" value={peso} onChangeText={setPeso} />

      <Text style={styles.label}>Notas</Text>
      <Input placeholder="Notas adicionales (opcional)" value={notas} onChangeText={setNotas} />

      <Button title="Guardar consulta" onPress={handleGuardar} loading={guardando} style={styles.submit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.fondo },
  content: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: '900', color: COLORS.carbon, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.carbon, marginBottom: 8, marginTop: 16 },
  submit: { marginTop: 28 },
});
