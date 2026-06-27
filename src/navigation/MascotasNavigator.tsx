import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MascotasListScreen } from '../screens/MascotasListScreen';
import { NuevaMascotaScreen } from '../screens/NuevaMascotaScreen';
import { MascotaDetailScreen } from '../screens/MascotaDetailScreen';
import { NuevaVacunaScreen } from '../screens/NuevaVacunaScreen';
import { NuevoTurnoScreen } from '../screens/NuevoTurnoScreen';
import { COLORS } from '../constants/theme';
import type { MascotasStackParamList } from './types';

const Stack = createNativeStackNavigator<MascotasStackParamList>();

export function MascotasNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.fondo },
        headerShadowVisible: false,
        headerTintColor: COLORS.carbon,
      }}
    >
      <Stack.Screen name="MascotasList" component={MascotasListScreen} options={{ title: 'Mis mascotas' }} />
      <Stack.Screen name="NuevaMascota" component={NuevaMascotaScreen} options={{ title: 'Nueva mascota' }} />
      <Stack.Screen name="MascotaDetail" component={MascotaDetailScreen} options={{ title: '' }} />
      <Stack.Screen name="NuevaVacuna" component={NuevaVacunaScreen} options={{ title: 'Nueva vacuna' }} />
      <Stack.Screen name="NuevoTurno" component={NuevoTurnoScreen} options={{ title: 'Nuevo turno' }} />
    </Stack.Navigator>
  );
}
