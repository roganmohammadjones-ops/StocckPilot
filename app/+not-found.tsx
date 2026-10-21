import { Link } from 'expo-router';
import { Text } from 'react-native';

import { Screen } from '@/components/screen';

export default function NotFoundScreen() {
  return (
    <Screen>
      <Text className="text-base text-slate-600">This page does not exist.</Text>
      <Link href="/" replace className="py-3 text-base font-semibold text-green-800">
        Return to home
      </Link>
    </Screen>
  );
}
