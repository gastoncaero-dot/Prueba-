import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { AuthNavigator } from './AuthNavigator';
import { AppTabs } from './AppTabs';
import { COLORS } from '../constants/theme';

// Decide qué mostrar según haya o no una sesión activa. Es el único lugar
// de la app que necesita saber esto: el resto de las pantallas asumen que
// ya hay un usuario logueado (o que no lo hay, en el caso del AuthNavigator).
export function RootNavigator() {
  const { user, cargando } = useAuth();

  if (cargando) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.fondo }}>
        <ActivityIndicator color={COLORS.tierra} />
      </View>
    );
  }

  return <NavigationContainer>{user ? <AppTabs /> : <AuthNavigator />}</NavigationContainer>;
}
