import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { VeterinariaDashboardScreen } from '../screens/VeterinariaDashboardScreen';
import { VeterinariaPerfilScreen } from '../screens/VeterinariaPerfilScreen';
import { COLORS } from '../constants/theme';
import type { VeterinariaStackParamList } from './types';

const Tab = createBottomTabNavigator<VeterinariaStackParamList>();

export function VeterinariaTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.tierra,
        tabBarInactiveTintColor: COLORS.humo,
      }}
    >
      <Tab.Screen
        name="VeterinariaDashboard"
        component={VeterinariaDashboardScreen}
        options={{
          title: 'Suscripción',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>💳</Text>,
        }}
      />
      <Tab.Screen
        name="VeterinariaPerfil"
        component={VeterinariaPerfilScreen}
        options={{
          title: 'Mi veterinaria',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏥</Text>,
        }}
      />
    </Tab.Navigator>
  );
}
