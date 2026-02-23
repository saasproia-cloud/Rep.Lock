import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { Colors } from '@/constants/colors';

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
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'accent' && styles.accent,
        variant === 'outline' && styles.outline,
        variant === 'success' && styles.success,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}>
      <Text style={[styles.label, variant === 'outline' && styles.labelOutline]}>{label}</Text>
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
  accent: {
    backgroundColor: Colors.accent,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  success: {
    backgroundColor: Colors.success,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  label: {
    color: '#07111B',
    fontSize: 18,
    fontWeight: '700',
  },
  labelOutline: {
    color: Colors.text,
  },
});
