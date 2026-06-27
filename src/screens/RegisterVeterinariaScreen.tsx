import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useAuth } from '../hooks/useAuth';
import { COLORS } from '../constants/theme';
import type { AuthStackParamList } from '../navigation/types';
import { authErrorMessage } from '../utils/authErrors';

type Props = NativeStackScreenProps<AuthStackParamList, 'RegisterVeterinaria'>;

// A diferencia del registro de un dueño de mascota, esta cuenta queda
// asociada a un documento en "veterinarias" con estadoSuscripcion:
// 'pendiente'. Recién cuando paga la primera cuota en MercadoPago (ver
// VeterinariaDashboardScreen) ese estado pasa a 'activa'.
export function RegisterVeterinariaScreen({ navigation }: Props) {
  const { registrarVeterinaria } = useAuth();
  const [nombreVeterinaria, setNombreVeterinaria] = useState('');
  const [email, setEmail] = useState('');
  const [zona, setZona] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);

  async function handleSubmit() {
    if (!nombreVeterinaria || !email || !zona || !direccion || !telefono || !password) {
      Alert.alert('Faltan datos', 'Completá todos los campos.');
      return;
    }
    setCargando(true);
    try {
      await registrarVeterinaria({
        nombreVeterinaria: nombreVeterinaria.trim(),
        email: email.trim(),
        zona: zona.trim(),
        direccion: direccion.trim(),
        telefono: telefono.trim(),
        password,
      });
    } catch (err) {
      Alert.alert('No pudimos crear tu cuenta', authErrorMessage(err));
    } finally {
      setCargando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Registrá tu veterinaria</Text>
        <Text style={styles.subtitle}>
          Gestioná turnos e historiales clínicos de tus pacientes. 14 días gratis, después USD 15/mes.
        </Text>

        <View style={styles.form}>
          <Input placeholder="Nombre de la veterinaria" value={nombreVeterinaria} onChangeText={setNombreVeterinaria} />
          <Input
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <Input placeholder="Zona (ej: Belgrano, CABA)" value={zona} onChangeText={setZona} />
          <Input placeholder="Dirección" value={direccion} onChangeText={setDireccion} />
          <Input placeholder="Teléfono" keyboardType="phone-pad" value={telefono} onChangeText={setTelefono} />
          <Input placeholder="Contraseña" secureTextEntry value={password} onChangeText={setPassword} />
          <Button title="Crear cuenta de veterinaria" onPress={handleSubmit} loading={cargando} />
        </View>

        <Button title="Volver" variant="ghost" onPress={() => navigation.navigate('Login')} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.fondo },
  scroll: { padding: 28, paddingTop: 64, flexGrow: 1, justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: '900', color: COLORS.carbon, marginBottom: 6 },
  subtitle: { fontSize: 15, color: COLORS.humo, marginBottom: 28 },
  form: { gap: 12, marginBottom: 20 },
});
