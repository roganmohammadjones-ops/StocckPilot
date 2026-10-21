/**
 * Stitch Design System Tokens for StockPilot Nigeria
 * Extracted directly from Stitch project 14382578202593814412
 */

export const colors = {
  primary: '#006b2c',
  primaryContainer: '#00873a',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#f7fff2',
  primaryFixed: '#7ffc97',
  primaryFixedDim: '#62df7d',

  secondary: '#1f6c3a',
  secondaryContainer: '#a4f1b2',
  onSecondary: '#ffffff',
  onSecondaryContainer: '#24703e',
  secondaryFixed: '#a6f4b5',

  tertiary: '#0051d5',
  tertiaryContainer: '#316bf3',
  onTertiary: '#ffffff',
  onTertiaryContainer: '#fefcff',
  tertiaryFixed: '#dbe1ff',
  tertiaryFixedDim: '#b4c5ff',
  onTertiaryFixed: '#00174b',
  onTertiaryFixedVariant: '#003ea8',

  surface: '#faf8ff',
  surfaceDim: '#d2d9f4',
  surfaceBright: '#faf8ff',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f2f3ff',
  surfaceContainer: '#eaedff',
  surfaceContainerHigh: '#e2e7ff',
  surfaceContainerHighest: '#dae2fd',

  onSurface: '#131b2e',
  onSurfaceVariant: '#3e4a3d',
  inverseSurface: '#283044',
  inverseOnSurface: '#eef0ff',

  outline: '#6e7b6c',
  outlineVariant: '#bdcaba',

  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  onError: '#ffffff',
  onErrorContainer: '#93000a',

  // Semantic utility tints
  cardBorder: '#e2e8f0',
  slateCanvas: '#f8fafc',
  slateText: '#0f172a',
  slateMuted: '#64748b',
} as const;

export const formatNaira = (amount: number, showDecimals = false): string => {
  const formatted = amount.toLocaleString('en-NG', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  });
  return `₦${formatted}`;
};
