import { useMemo } from 'react';

import { getColors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useAppColors() {
  const colorScheme = useColorScheme();
  return useMemo(() => getColors(colorScheme), [colorScheme]);
}
