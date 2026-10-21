import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppIcon } from './icon';
import { colors } from '@/lib/theme';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
}

export function AppHeader({ title, subtitle, showBack = false }: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View
      style={{ paddingTop: Math.max(insets.top, 12) }}
      className="bg-white border-b border-cardBorder shadow-sm px-4 pb-3 z-30"
    >
      <View className="flex-row items-center justify-between">
        {showBack ? (
          <View className="flex-row items-center gap-2 flex-1 min-w-0">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => router.back()}
              className="w-10 h-10 -ml-1 rounded-full items-center justify-center active:bg-surfaceContainer"
            >
              <AppIcon name="arrow_back" size={24} color={colors.onSurface} />
            </Pressable>
            <View className="flex-1 min-w-0">
              <Text className="text-lg font-bold text-onSurface truncate">
                {title || 'Back'}
              </Text>
              {subtitle ? (
                <Text className="text-xs text-onSurfaceVariant truncate">{subtitle}</Text>
              ) : null}
            </View>
          </View>
        ) : (
          <View className="flex-row items-center gap-2 flex-1 min-w-0">
            {/* Brand Logo Symbol */}
            <View className="w-8 h-8 rounded-lg bg-primary items-center justify-center">
              <AppIcon name="warehouse" size={18} color="#ffffff" />
            </View>

            {/* Merchant Switcher & Location */}
            <View className="flex-col min-w-0">
              <Pressable
                onPress={() => router.push('/settings')}
                className="flex-row items-center gap-0.5 active:opacity-75"
              >
                <Text className="text-sm font-bold text-onSurface truncate max-w-[160px]">
                  Bamidele & Sons
                </Text>
                <AppIcon name="arrow_drop_down" size={18} color={colors.onSurfaceVariant} />
              </Pressable>
              <View className="flex-row items-center gap-1">
                <AppIcon name="location_on" size={12} color={colors.outline} />
                <Text className="text-[11px] font-medium text-outline">
                  Idumota, Lagos
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Right Status Actions */}
        <View className="flex-row items-center gap-2">
          {/* Synced Pill */}
          <View className="flex-row items-center gap-1.5 px-2.5 py-1 bg-secondaryContainer/50 rounded-full">
            <View className="w-2 h-2 rounded-full bg-primary" />
            <Text className="text-[11px] font-semibold text-onSecondaryContainer">
              Synced
            </Text>
          </View>

          {/* Notifications Trigger */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            className="w-9 h-9 items-center justify-center relative active:opacity-75"
          >
            <AppIcon name="notifications" size={22} color={colors.onSurfaceVariant} />
            <View className="absolute top-1 right-1 w-4 h-4 rounded-full bg-error items-center justify-center">
              <Text className="text-[10px] font-bold text-white">3</Text>
            </View>
          </Pressable>

          {/* Profile Avatar */}
          <Pressable
            onPress={() => router.push('/settings')}
            className="w-8 h-8 rounded-full bg-primary items-center justify-center active:opacity-80"
          >
            <AppIcon name="person" size={18} color="#ffffff" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
