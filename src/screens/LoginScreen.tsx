import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useAuth } from '../hooks/useAuth';
import { COLORS } from '../constants/theme';
import type { AuthStackParamList } from '../navigation/types';
import { authErrorMessage } from '../utils/authErrors';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { iniciarSesion } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);

  async function handleSubmit() {
    if (!email || !password) {
      Alert.alert('Faltan datos', 'Completá email y contraseña.');
      return;
    }
    setCargando(true);
    try {
      await iniciarSesion(email.trim(), password);
    } catch (err) {
      Alert.alert('No pudimos iniciar sesión', authErrorMessage(err));
    } finally {
      setCargando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.logo}>🐾 Patitas</Text>
      <Text style={styles.title}>Hola de nuevo</Text>
      <Text style={styles.subtitle}>Iniciá sesión para ver a tus mascotas.</Text>

      <View style={styles.form}>
        <Input
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Input
          placeholder="Contraseña"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <Button title="Iniciar sesión" onPress={handleSubmit} loading={cargando} />
      </View>

      <Button
        title="Crear cuenta nueva"
        variant="ghost"
        onPress={() => navigation.navigate('Register')}
      />
      <Button
        title="Soy una veterinaria"
        variant="ghost"
        onPress={() => navigation.navigate('RegisterVeterinaria')}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.fondo, padding: 28, justifyContent: 'center' },
  logo: { fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 36, color: COLORS.carbon },
  title: { fontSize: 28, fontWeight: '900', color: COLORS.carbon, marginBottom: 6 },
  subtitle: { fontSize: 15, color: COLORS.humo, marginBottom: 28 },
  form: { gap: 12, marginBottom: 20 },
});
