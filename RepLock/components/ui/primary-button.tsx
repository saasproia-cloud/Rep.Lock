import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { useAppColors } from '@/hooks/use-app-colors';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'accent' | 'outline' | 'success';
  style?: ViewStyle;
  disabled?: boolean;
};

export function PrimaryButton({
  label,
  onPress,
  variant = 'accent',
  style,
  disabled = false,
}: PrimaryButtonProps) {
  const colors = useAppColors();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'accent' && { backgroundColor: colors.accent },
        variant === 'outline' && { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
        variant === 'success' && { backgroundColor: colors.success },
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}>
      <Text style={[styles.label, { color: variant === 'outline' ? colors.text : '#120C1C' }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  label: {
    fontSize: 18,
    fontWeight: '700',
  },
});
