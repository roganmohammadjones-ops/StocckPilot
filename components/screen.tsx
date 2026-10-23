import type { PropsWithChildren } from 'react';
import { ScrollView, View, ViewStyle } from 'react-native';
import { useResponsive } from '@/hooks/use-responsive';

interface ScreenProps extends PropsWithChildren {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '5xl' | '6xl' | '7xl' | 'full';
  contentContainerStyle?: ViewStyle;
}

export function Screen({ children, maxWidth = 'xl', contentContainerStyle }: ScreenProps) {
  const { insets, horizontalPadding, isWide } = useResponsive();

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'w-full',
  }[maxWidth];

  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        {
          paddingHorizontal: horizontalPadding,
          paddingTop: isWide ? 24 : 16,
          paddingBottom: insets.bottom + 24,
        },
        contentContainerStyle,
      ]}
    >
      <View className={`mx-auto w-full ${maxWidthClass} gap-6`}>{children}</View>
    </ScrollView>
  );
}
