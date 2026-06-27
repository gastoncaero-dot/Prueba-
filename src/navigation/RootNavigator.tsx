import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { AuthNavigator } from './AuthNavigator';
import { AppTabs } from './AppTabs';
import { VeterinariaTabs } from './VeterinariaTabs';
import { COLORS } from '../constants/theme';

// Decide qué mostrar según haya o no una sesión activa, y si es un dueño de
// mascota o una veterinaria. Es el único lugar de la app que necesita saber
// esto: el resto de las pantallas asumen un tipo de usuario fijo.
export function RootNavigator() {
  const { user, usuario, cargando } = useAuth();

  if (cargando) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.fondo }}>
        <ActivityIndicator color={COLORS.tierra} />
      </View>
    );
  }

  if (!user || !usuario) {
    return (
      <NavigationContainer>
        <AuthNavigator />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>{usuario.tipo === 'veterinaria' ? <VeterinariaTabs /> : <AppTabs />}</NavigationContainer>
  );
}
