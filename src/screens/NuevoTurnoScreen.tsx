import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { turnosService } from '../services/turnos';
import { parseFechaHoraArgentina } from '../utils/date';
import { COLORS } from '../constants/theme';
import type { MascotasStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<MascotasStackParamList, 'NuevoTurno'>;

export function NuevoTurnoScreen({ route, navigation }: Props) {
  const { mascotaId, veterinariaId, veterinariaNombre } = route.params;
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function handleGuardar() {
    if (!veterinariaId || !fecha || !hora) {
      Alert.alert('Faltan datos', 'Elegí una veterinaria y completá fecha y hora.');
      return;
    }
    const fechaHora = parseFechaHoraArgentina(fecha, hora);
    if (!fechaHora) {
      Alert.alert('Fecha u hora inválida', 'Usá DD/MM/AAAA para la fecha y HH:MM para la hora.');
      return;
    }
    setGuardando(true);
    try {
      await turnosService.crear({
        mascotaId,
        veterinariaId,
        fecha: fechaHora,
        estado: 'pendiente',
      });
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'No pudimos guardar el turno. Probá de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Nuevo turno</Text>

      <Text style={styles.label}>Veterinaria</Text>
      {veterinariaNombre ? (
        <View style={styles.veterinariaElegida}>
          <Text style={styles.veterinariaNombre}>🏥 {veterinariaNombre}</Text>
          <Button
            title="Cambiar"
            variant="ghost"
            onPress={() => navigation.navigate('Veterinarias', { paraTurno: { mascotaId } })}
            style={styles.cambiarButton}
          />
        </View>
      ) : (
        <Button
          title="Elegir veterinaria"
          onPress={() => navigation.navigate('Veterinarias', { paraTurno: { mascotaId } })}
        />
      )}

      <Text style={styles.label}>Fecha</Text>
      <Input placeholder="DD/MM/AAAA" keyboardType="numeric" value={fecha} onChangeText={setFecha} />

      <Text style={styles.label}>Hora</Text>
      <Input placeholder="HH:MM" keyboardType="numeric" value={hora} onChangeText={setHora} />

      <Button title="Guardar turno" onPress={handleGuardar} loading={guardando} style={styles.submit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.fondo },
  content: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: '900', color: COLORS.carbon, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.carbon, marginBottom: 8, marginTop: 16 },
  submit: { marginTop: 28 },
  veterinariaElegida: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.blanco,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: COLORS.borde,
  },
  veterinariaNombre: { fontWeight: '700', color: COLORS.carbon, fontSize: 14, flex: 1 },
  cambiarButton: { paddingVertical: 6, paddingHorizontal: 12 },
});
