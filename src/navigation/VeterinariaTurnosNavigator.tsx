import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { VeterinariaTurnosScreen } from '../screens/VeterinariaTurnosScreen';
import { NuevaConsultaScreen } from '../screens/NuevaConsultaScreen';
import { COLORS } from '../constants/theme';
import type { VeterinariaTurnosStackParamList } from './types';

const Stack = createNativeStackNavigator<VeterinariaTurnosStackParamList>();

export function VeterinariaTurnosNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.fondo },
        headerShadowVisible: false,
        headerTintColor: COLORS.carbon,
      }}
    >
      <Stack.Screen name="VeterinariaTurnos" component={VeterinariaTurnosScreen} options={{ title: 'Turnos' }} />
      <Stack.Screen name="NuevaConsulta" component={NuevaConsultaScreen} options={{ title: 'Cargar consulta' }} />
    </Stack.Navigator>
  );
}
