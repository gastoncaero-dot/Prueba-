import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';
import { colorSalud } from '../utils/salud';

// El "anillo" de salud: un círculo cuyo borde y número toman el color del
// puntaje (verde/amarillo/rojo). Hecho con View + border en vez de SVG para
// no sumar una dependencia de gráficos solo para esto.
export function AnilloSalud({ puntaje, tamanio = 48 }: { puntaje: number; tamanio?: number }) {
  const color = colorSalud(puntaje);
  return (
    <View
      style={[
        styles.anillo,
        { width: tamanio, height: tamanio, borderRadius: tamanio / 2, borderColor: color },
      ]}
    >
      <Text style={[styles.numero, { color, fontSize: tamanio * 0.3 }]}>{puntaje}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  anillo: {
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.blanco,
  },
  numero: { fontWeight: '900' },
});
