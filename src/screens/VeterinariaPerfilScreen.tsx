import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useAuth } from '../hooks/useAuth';
import { veterinariasService } from '../services/veterinarias';
import { COLORS } from '../constants/theme';
import type { Veterinaria } from '../types';

export function VeterinariaPerfilScreen() {
  const { usuario, cerrarSesion } = useAuth();
  const [veterinaria, setVeterinaria] = useState<Veterinaria | null>(null);
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [zona, setZona] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    if (!usuario?.veterinariaId) return;
    setCargando(true);
    const v = await veterinariasService.obtener(usuario.veterinariaId);
    if (v) {
      setVeterinaria(v);
      setDireccion(v.direccion);
      setTelefono(v.telefono);
      setZona(v.zona);
    }
    setCargando(false);
  }, [usuario?.veterinariaId]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  async function handleGuardar() {
    if (!veterinaria) return;
    setGuardando(true);
    try {
      await veterinariasService.actualizar(veterinaria.id, {
        direccion: direccion.trim(),
        telefono: telefono.trim(),
        zona: zona.trim(),
      });
      Alert.alert('Listo', 'Actualizamos los datos de tu veterinaria.');
    } catch {
      Alert.alert('Error', 'No pudimos guardar los cambios. Probá de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  async function handleCerrarSesion() {
    try {
      await cerrarSesion();
    } catch {
      Alert.alert('Error', 'No pudimos cerrar tu sesión. Probá de nuevo.');
    }
  }

  if (cargando || !veterinaria) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.tierra} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{veterinaria.nombre}</Text>

      <Text style={styles.label}>Zona</Text>
      <Input value={zona} onChangeText={setZona} />

      <Text style={styles.label}>Dirección</Text>
      <Input value={direccion} onChangeText={setDireccion} />

      <Text style={styles.label}>Teléfono</Text>
      <Input value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" />

      <Button title="Guardar cambios" onPress={handleGuardar} loading={guardando} style={styles.guardar} />
      <Button title="Cerrar sesión" variant="ghost" onPress={handleCerrarSesion} style={styles.logout} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.fondo },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.fondo },
  content: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 22, fontWeight: '900', color: COLORS.carbon, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.carbon, marginBottom: 8, marginTop: 16 },
  guardar: { marginTop: 28 },
  logout: { marginTop: 16 },
});
