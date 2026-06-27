import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { VeterinariaTurnosNavigator } from './VeterinariaTurnosNavigator';
import { VeterinariaDashboardScreen } from '../screens/VeterinariaDashboardScreen';
import { VeterinariaPerfilScreen } from '../screens/VeterinariaPerfilScreen';
import { COLORS } from '../constants/theme';
import type { VeterinariaTabParamList } from './types';

const Tab = createBottomTabNavigator<VeterinariaTabParamList>();

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
        name="VeterinariaTurnosTab"
        component={VeterinariaTurnosNavigator}
        options={{
          title: 'Turnos',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📅</Text>,
        }}
      />
      <Tab.Screen
        name="VeterinariaSuscripcionTab"
        component={VeterinariaDashboardScreen}
        options={{
          title: 'Suscripción',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>💳</Text>,
        }}
      />
      <Tab.Screen
        name="VeterinariaPerfilTab"
        component={VeterinariaPerfilScreen}
        options={{
          title: 'Mi veterinaria',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏥</Text>,
        }}
      />
    </Tab.Navigator>
  );
}
