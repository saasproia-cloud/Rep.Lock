import { Image, StyleSheet, View } from 'react-native';

import { useAppColors } from '@/hooks/use-app-colors';

type RepLockLogoProps = {
  size?: number;
  elevated?: boolean;
};

export function RepLockLogo({ size = 72, elevated = true }: RepLockLogoProps) {
  const colors = useAppColors();

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.24),
          borderColor: colors.border,
          backgroundColor: colors.panel,
        },
        elevated ? styles.elevated : undefined,
      ]}>
      <Image source={require('../../assets/images/icon.png')} style={styles.image} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderWidth: 1,
    padding: 2,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  elevated: {
    shadowColor: '#A05CFF',
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
});
