import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useAuth } from '../hooks/useAuth';
import { mascotasService } from '../services/mascotas';
import { usuariosService } from '../services/usuarios';
import { parseFechaArgentina } from '../utils/date';
import { COLORS } from '../constants/theme';
import type { MascotasStackParamList } from '../navigation/types';
import type { Especie, Sexo } from '../types';

type Props = NativeStackScreenProps<MascotasStackParamList, 'NuevaMascota'>;

const ESPECIES: { valor: Especie; label: string }[] = [
  { valor: 'perro', label: '🐶 Perro' },
  { valor: 'gato', label: '🐱 Gato' },
  { valor: 'otro', label: '🐾 Otro' },
];

const SEXOS: { valor: Sexo; label: string }[] = [
  { valor: 'macho', label: 'Macho' },
  { valor: 'hembra', label: 'Hembra' },
];

export function NuevaMascotaScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [nombre, setNombre] = useState('');
  const [especie, setEspecie] = useState<Especie>('perro');
  const [raza, setRaza] = useState('');
  const [sexo, setSexo] = useState<Sexo>('macho');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [color, setColor] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function handleGuardar() {
    if (!user) return;
    if (!nombre || !raza || !fechaNacimiento || !color) {
      Alert.alert('Faltan datos', 'Completá todos los campos.');
      return;
    }
    const fecha = parseFechaArgentina(fechaNacimiento);
    if (!fecha) {
      Alert.alert('Fecha inválida', 'Usá el formato DD/MM/AAAA, por ejemplo 26/06/2023.');
      return;
    }
    setGuardando(true);
    try {
      const id = await mascotasService.crear({
        ownerId: user.uid,
        nombre: nombre.trim(),
        especie,
        raza: raza.trim(),
        sexo,
        fechaNacimiento: fecha,
        foto: null,
        peso: [],
        color: color.trim(),
      });
      await usuariosService.agregarMascota(user.uid, id);
      navigation.replace('MascotaDetail', { mascotaId: id });
    } catch {
      Alert.alert('Error', 'No pudimos guardar la mascota. Probá de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Nueva mascota</Text>

      <Text style={styles.label}>Nombre</Text>
      <Input placeholder="Ej: Simón" value={nombre} onChangeText={setNombre} />

      <Text style={styles.label}>Especie</Text>
      <View style={styles.chipRow}>
        {ESPECIES.map((e) => (
          <Pressable
            key={e.valor}
            onPress={() => setEspecie(e.valor)}
            style={[styles.chip, especie === e.valor && styles.chipActive]}
          >
            <Text style={[styles.chipText, especie === e.valor && styles.chipTextActive]}>{e.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Raza</Text>
      <Input placeholder="Ej: Golden Retriever" value={raza} onChangeText={setRaza} />

      <Text style={styles.label}>Sexo</Text>
      <View style={styles.chipRow}>
        {SEXOS.map((s) => (
          <Pressable
            key={s.valor}
            onPress={() => setSexo(s.valor)}
            style={[styles.chip, sexo === s.valor && styles.chipActive]}
          >
            <Text style={[styles.chipText, sexo === s.valor && styles.chipTextActive]}>{s.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Fecha de nacimiento</Text>
      <Input
        placeholder="DD/MM/AAAA"
        keyboardType="numeric"
        value={fechaNacimiento}
        onChangeText={setFechaNacimiento}
      />

      <Text style={styles.label}>Color</Text>
      <Input placeholder="Ej: Dorado" value={color} onChangeText={setColor} />

      <Button title="Guardar mascota" onPress={handleGuardar} loading={guardando} style={styles.submit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.fondo },
  content: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: '900', color: COLORS.carbon, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.carbon, marginBottom: 8, marginTop: 16 },
  chipRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
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
