import { TextInput, type TextInputProps, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

export function Input(props: TextInputProps) {
  return <TextInput placeholderTextColor={COLORS.humo} style={styles.input} {...props} />;
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.borde,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
    fontSize: 15,
    color: COLORS.carbon,
    backgroundColor: COLORS.blanco,
  },
});
