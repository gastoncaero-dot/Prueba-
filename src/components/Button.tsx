import { Pressable, Text, StyleSheet, ActivityIndicator, type StyleProp, type ViewStyle } from 'react-native';
import { COLORS } from '../constants/theme';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ title, onPress, variant = 'primary', loading, disabled, style }: Props) {
  const isGhost = variant === 'ghost';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        isGhost ? styles.ghost : styles.primary,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isGhost ? COLORS.carbon : COLORS.blanco} />
      ) : (
        <Text style={isGhost ? styles.textGhost : styles.textPrimary}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 100,
    paddingVertical: 15,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: COLORS.tierra },
  ghost: { backgroundColor: COLORS.blanco, borderWidth: 2, borderColor: COLORS.borde },
  disabled: { opacity: 0.5 },
  pressed: { transform: [{ scale: 0.97 }] },
  textPrimary: { color: COLORS.blanco, fontWeight: '700', fontSize: 16 },
  textGhost: { color: COLORS.carbon, fontWeight: '700', fontSize: 16 },
});
