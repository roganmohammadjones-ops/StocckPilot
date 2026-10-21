import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Screen } from '@/components/screen';

export default function SetupCheckScreen() {
  const [count, setCount] = useState(0);

  return (
    <Screen>
      <Text className="text-base leading-7 text-slate-600">
        This screen exercises Expo Router and NativeWind utility classes. The card
        changes colour each time you increment the counter.
      </Text>
      <View
        testID="nativewind-sample"
        className={`gap-3 rounded-2xl border p-6 ${
          count % 2 === 0
            ? 'border-green-200 bg-green-50'
            : 'border-blue-200 bg-blue-50'
        }`}
      >
        <Text className="text-lg font-semibold text-slate-900">NativeWind sample</Text>
        <Text selectable className="text-base text-slate-700">
          Sample amount: ₦125,000.00
        </Text>
        <Text
          testID="sample-count"
          accessibilityLiveRegion="polite"
          className="text-4xl font-bold tabular-nums text-slate-900"
        >
          {count}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => setCount((current) => current + 1)}
          className="min-h-12 items-center justify-center rounded-xl bg-green-700 px-4 py-3 active:bg-green-800"
        >
          <Text className="text-base font-semibold text-white">Increment test counter</Text>
        </Pressable>
      </View>
      <Link href="/" dismissTo className="py-3 text-base font-semibold text-green-800">
        Return to home
      </Link>
    </Screen>
  );
}
