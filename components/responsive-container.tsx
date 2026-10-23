import React, { PropsWithChildren } from 'react';
import { View, ViewStyle } from 'react-native';
import { useResponsive } from '@/hooks/use-responsive';

interface ResponsiveContainerProps extends PropsWithChildren {
  className?: string;
  style?: ViewStyle;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '5xl' | '6xl' | '7xl' | 'full';
  noPadding?: boolean;
}

export function ResponsiveContainer({
  children,
  className = '',
  style,
  maxWidth = '7xl',
  noPadding = false,
}: ResponsiveContainerProps) {
  const { isCompactPhone, isWide } = useResponsive();

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

  const paddingClass = noPadding
    ? ''
    : isCompactPhone
    ? 'px-3'
    : isWide
    ? 'px-6'
    : 'px-4';

  return (
    <View
      style={style}
      className={`w-full mx-auto ${maxWidthClass} ${paddingClass} ${className}`}
    >
      {children}
    </View>
  );
}
