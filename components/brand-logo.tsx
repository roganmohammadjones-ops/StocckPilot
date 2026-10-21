import React from 'react';
import { Image, ImageStyle, StyleProp, View } from 'react-native';

export type BrandLogoVariant = 'emblem' | 'full';

interface BrandLogoProps {
  variant?: BrandLogoVariant;
  size?: number; // Used for square emblem (default 32)
  width?: number; // Used for custom full logo width
  height?: number; // Used for custom full logo height
  style?: StyleProp<ImageStyle>;
  className?: string;
}

const emblemSource = require('@/assets/images/stockpilot-emblem.png');
const fullLogoSource = require('@/assets/images/stockpilot-logo.png');

// Aspect ratio for full logo is 433 x 359 (approx 1.206)
const FULL_LOGO_ASPECT = 433 / 359;

export function BrandLogo({
  variant = 'emblem',
  size = 32,
  width,
  height,
  style,
  className,
}: BrandLogoProps) {
  if (variant === 'full') {
    const computedWidth = width || (height ? height * FULL_LOGO_ASPECT : 140);
    const computedHeight = height || computedWidth / FULL_LOGO_ASPECT;

    return (
      <View className={className}>
        <Image
          source={fullLogoSource}
          style={[{ width: computedWidth, height: computedHeight }, style]}
          resizeMode="contain"
          accessibilityRole="image"
          accessibilityLabel="StockPilot Nigeria Logo"
        />
      </View>
    );
  }

  return (
    <View className={className}>
      <Image
        source={emblemSource}
        style={[{ width: size, height: size }, style]}
        resizeMode="contain"
        accessibilityRole="image"
        accessibilityLabel="StockPilot Nigeria Brand Emblem"
      />
    </View>
  );
}
