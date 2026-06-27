import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
// Importar la app de Firebase ya inicializa la conexión (auth, firestore,
// storage). Si las variables de entorno faltan o están mal, va a fallar
// apenas arranque la app, así nos enteramos rápido.
import './src/services/firebase';

export default function App() {
  return (
    <View style={styles.container}>
      <Text>🐾 Patitas</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
