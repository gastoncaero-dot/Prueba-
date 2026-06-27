import { View, Text, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/Button';
import { COLORS } from '../constants/theme';

export function PerfilScreen() {
  const { usuario, cerrarSesion } = useAuth();

  async function handleCerrarSesion() {
    try {
      await cerrarSesion();
    } catch {
      Alert.alert('Error', 'No pudimos cerrar tu sesión. Probá de nuevo.');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.avatar}>🧑</Text>
      <Text style={styles.name}>{usuario?.nombre ?? 'Cargando...'}</Text>
      <Text style={styles.email}>{usuario?.email}</Text>
      <Text style={styles.zona}>📍 {usuario?.zona}</Text>

      <Button title="Cerrar sesión" variant="ghost" onPress={handleCerrarSesion} style={styles.logout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.fondo, alignItems: 'center', paddingTop: 80, padding: 24 },
  avatar: { fontSize: 56, marginBottom: 12 },
  name: { fontSize: 22, fontWeight: '900', color: COLORS.carbon },
  email: { fontSize: 14, color: COLORS.humo, marginTop: 4 },
  zona: { fontSize: 14, color: COLORS.humo, marginTop: 8 },
  logout: { marginTop: 40, alignSelf: 'stretch' },
});
