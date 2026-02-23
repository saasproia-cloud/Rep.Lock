import type { ColorSchemeName } from 'react-native';

export type AppColors = {
  bg: string;
  surface: string;
  card: string;
  text: string;
  textMuted: string;
  accent: string;
  accentAlt: string;
  success: string;
  danger: string;
  skeletonLine: string;
  skeletonJoint: string;
  border: string;
  overlay: string;
  panel: string;
  tabBg: string;
  tabActive: string;
  tabInactive: string;
  shadow: string;
};

export const DarkColors: AppColors = {
  bg: '#08060E',
  surface: '#120B1F',
  card: '#171026',
  text: '#F2ECFF',
  textMuted: '#A99CC3',
  accent: '#B45CFF',
  accentAlt: '#7B3BFF',
  success: '#4FE58A',
  danger: '#FF6B7A',
  skeletonLine: '#CE84FF',
  skeletonJoint: '#95F97A',
  border: 'rgba(226, 202, 255, 0.2)',
  overlay: 'rgba(8, 7, 14, 0.74)',
  panel: '#1E1533',
  tabBg: '#1A1328',
  tabActive: '#B45CFF',
  tabInactive: '#A38DBF',
  shadow: '#AA5BFF',
};

export const LightColors: AppColors = {
  bg: '#F3ECFF',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  text: '#2A1046',
  textMuted: '#705D90',
  accent: '#8E3CFF',
  accentAlt: '#6D2DDA',
  success: '#129A55',
  danger: '#CC325B',
  skeletonLine: '#7E42FF',
  skeletonJoint: '#23C060',
  border: 'rgba(77, 46, 134, 0.18)',
  overlay: 'rgba(244, 236, 255, 0.86)',
  panel: '#EDE2FF',
  tabBg: '#FFFFFF',
  tabActive: '#8E3CFF',
  tabInactive: '#7E6A9F',
  shadow: '#8D3CFF',
};

// Backward-compatible default for files still using static colors.
export const Colors = DarkColors;

export function getColors(colorScheme?: ColorSchemeName): AppColors {
  return colorScheme === 'light' ? LightColors : DarkColors;
}
