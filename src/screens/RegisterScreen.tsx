import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useAuth } from '../hooks/useAuth';
import { COLORS } from '../constants/theme';
import type { AuthStackParamList } from '../navigation/types';
import { authErrorMessage } from '../utils/authErrors';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { registrarse } = useAuth();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [zona, setZona] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);

  async function handleSubmit() {
    if (!nombre || !email || !zona || !password) {
      Alert.alert('Faltan datos', 'Completá todos los campos.');
      return;
    }
    setCargando(true);
    try {
      await registrarse({ nombre: nombre.trim(), email: email.trim(), zona: zona.trim(), password });
    } catch (err) {
      Alert.alert('No pudimos crear tu cuenta', authErrorMessage(err));
    } finally {
      setCargando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Creá tu cuenta</Text>
        <Text style={styles.subtitle}>Gratis para siempre. Registrá a tu mascota en minutos.</Text>

        <View style={styles.form}>
          <Input placeholder="Tu nombre" value={nombre} onChangeText={setNombre} />
          <Input
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <Input placeholder="Zona (ej: Llavallol, Buenos Aires)" value={zona} onChangeText={setZona} />
          <Input placeholder="Contraseña" secureTextEntry value={password} onChangeText={setPassword} />
          <Button title="Crear cuenta" onPress={handleSubmit} loading={cargando} />
        </View>

        <Button title="Ya tengo cuenta" variant="ghost" onPress={() => navigation.navigate('Login')} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.fondo },
  scroll: { padding: 28, paddingTop: 64, flexGrow: 1, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '900', color: COLORS.carbon, marginBottom: 6 },
  subtitle: { fontSize: 15, color: COLORS.humo, marginBottom: 28 },
  form: { gap: 12, marginBottom: 20 },
});
