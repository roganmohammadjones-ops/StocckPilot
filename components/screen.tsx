import type { PropsWithChildren } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function Screen({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 24, paddingBottom: insets.bottom + 24 }}
    >
      <View className="mx-auto w-full max-w-xl gap-6">{children}</View>
    </ScrollView>
  );
}
