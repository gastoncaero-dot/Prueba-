import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MascotasNavigator } from './MascotasNavigator';
import { PerfilScreen } from '../screens/PerfilScreen';
import { COLORS } from '../constants/theme';
import type { AppTabParamList } from './types';

const Tab = createBottomTabNavigator<AppTabParamList>();

export function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.tierra,
        tabBarInactiveTintColor: COLORS.humo,
      }}
    >
      <Tab.Screen
        name="MascotasTab"
        component={MascotasNavigator}
        options={{
          title: 'Mis mascotas',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🐾</Text>,
        }}
      />
      <Tab.Screen
        name="PerfilTab"
        component={PerfilScreen}
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🧑</Text>,
        }}
      />
    </Tab.Navigator>
  );
}
