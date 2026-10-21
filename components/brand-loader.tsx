import React, { useEffect, useState } from 'react';
import { View, Text, Animated, Easing, ActivityIndicator } from 'react-native';
import { BrandLogo } from './brand-logo';
import { colors } from '@/lib/theme';

interface BrandLoaderProps {
  size?: 'small' | 'medium' | 'large' | number;
  message?: string;
  fullscreen?: boolean;
  showSpinner?: boolean;
  className?: string;
}

export function BrandLoader({
  size = 'medium',
  message,
  fullscreen = false,
  showSpinner = true,
  className = '',
}: BrandLoaderProps) {
  const [pulseAnim] = useState(() => new Animated.Value(1));
  const [opacityAnim] = useState(() => new Animated.Value(0.85));

  const emblemSize =
    typeof size === 'number'
      ? size
      : size === 'small'
      ? 28
      : size === 'large'
      ? 64
      : 44;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 0.95,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.8,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    pulse.start();

    return () => pulse.stop();
  }, [pulseAnim, opacityAnim]);

  const content = (
    <View
      className={`items-center justify-center gap-3 p-4 ${className}`}
      accessibilityRole="progressbar"
      accessibilityLabel={message || 'Loading StockPilot Nigeria'}
    >
      <View className="items-center justify-center relative">
        <Animated.View
          style={{
            transform: [{ scale: pulseAnim }],
            opacity: opacityAnim,
          }}
          className="items-center justify-center"
        >
          <BrandLogo variant="emblem" size={emblemSize} />
        </Animated.View>

        {showSpinner && (
          <View className="mt-3">
            <ActivityIndicator
              size={emblemSize >= 44 ? 'small' : 'small'}
              color={colors.primary}
            />
          </View>
        )}
      </View>

      {message ? (
        <Text className="text-xs font-semibold text-onSurfaceVariant text-center mt-1">
          {message}
        </Text>
      ) : null}
    </View>
  );

  if (fullscreen) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        {content}
      </View>
    );
  }

  return content;
}
