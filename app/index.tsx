import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { getStoredUser } from '@/lib/auth';
import LaunchSplashScreen from './launch';

export default function Index() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [hasUser, setHasUser] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      setHasUser(true);
      router.replace('/(tabs)');
    } else {
      setHasUser(false);
      setIsChecking(false);
    }
  }, [router]);

  // While determining session or redirecting directly to dashboard, match launch background
  if (isChecking || hasUser) {
    return <View className="flex-1 bg-[#021811]" />;
  }

  return <LaunchSplashScreen />;
}
