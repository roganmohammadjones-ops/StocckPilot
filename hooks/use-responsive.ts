import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets, EdgeInsets } from 'react-native-safe-area-context';

export interface ResponsiveInfo {
  // Raw window dimensions
  width: number;
  height: number;
  scale: number;
  fontScale: number;

  // Orientations
  isLandscape: boolean;
  isPortrait: boolean;

  // Device categories
  isCompactPhone: boolean; // < 375px (iPhone SE, small Androids)
  isPhone: boolean;        // < 768px (all phones)
  isTablet: boolean;       // >= 768px && < 1024px (iPads, Android tablets)
  isDesktop: boolean;      // >= 1024px (web, large tablets, desktop)
  isWide: boolean;         // >= 768px (tablet or desktop)
  isVeryWide: boolean;     // >= 1280px (large displays)

  // Safe area insets
  insets: EdgeInsets;

  // Adaptive spacing & layout classes
  horizontalPadding: number;
  contentMaxWidth: number;
  maxContentClass: string;

  // Helper functions
  columns: (phoneCols: number, tabletCols: number, desktopCols?: number) => number;
  cardWidthPct: (phoneCols: number, tabletCols: number, desktopCols?: number, gap?: number) => string;
  responsiveValue: <T>(phoneVal: T, tabletVal: T, desktopVal?: T) => T;
}

/**
 * useResponsive hook:
 * Listens dynamically to window dimension updates across all devices:
 * - Device rotation (portrait <-> landscape)
 * - iPad multitasking (Slide Over, Split View, Stage Manager)
 * - Android foldable devices (fold <-> unfold)
 * - Web browser window resizing
 */
export function useResponsive(): ResponsiveInfo {
  const { width, height, scale, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const isLandscape = width > height;
  const isPortrait = !isLandscape;

  const isCompactPhone = width < 375;
  const isPhone = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;
  const isWide = width >= 768;
  const isVeryWide = width >= 1280;

  // Adaptive horizontal padding
  const horizontalPadding = isCompactPhone ? 12 : isWide ? 24 : 16;

  // Max width of main content container
  const contentMaxWidth = isVeryWide ? 1200 : isWide ? 960 : width;
  const maxContentClass = isVeryWide ? 'max-w-7xl' : isWide ? 'max-w-5xl' : 'w-full';

  const columns = (phoneCols: number, tabletCols: number, desktopCols?: number): number => {
    if (isDesktop && desktopCols !== undefined) return desktopCols;
    if (isTablet) return tabletCols;
    return phoneCols;
  };

  const cardWidthPct = (phoneCols: number, tabletCols: number, desktopCols?: number, gap = 12): string => {
    const colCount = columns(phoneCols, tabletCols, desktopCols);
    if (colCount <= 1) return '100%';
    const pct = 100 / colCount;
    // account for flex gap
    return `${pct.toFixed(2)}%`;
  };

  const responsiveValue = <T>(phoneVal: T, tabletVal: T, desktopVal?: T): T => {
    if (isDesktop && desktopVal !== undefined) return desktopVal;
    if (isTablet) return tabletVal;
    return phoneVal;
  };

  return {
    width,
    height,
    scale,
    fontScale,
    isLandscape,
    isPortrait,
    isCompactPhone,
    isPhone,
    isTablet,
    isDesktop,
    isWide,
    isVeryWide,
    insets,
    horizontalPadding,
    contentMaxWidth,
    maxContentClass,
    columns,
    cardWidthPct,
    responsiveValue,
  };
}
