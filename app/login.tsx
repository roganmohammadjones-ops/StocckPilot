import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AppIcon } from '@/components/icon';
import { BrandLogo } from '@/components/brand-logo';
import { colors } from '@/lib/theme';
import { loginWithCredentials, loginWithDemo, getStoredUser } from '@/lib/auth';

export default function LoginScreen() {
  const router = useRouter();
  const currentUser = getStoredUser();
  const [authMode, setAuthMode] = useState<'phone' | 'email'>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const identifier = authMode === 'phone' ? phone : email;
      const res = await loginWithCredentials(identifier, password);
      if (res.success) {
        router.replace('/(tabs)');
      } else {
        setErrorMessage(res.error || 'Invalid credentials. Please verify your phone or email.');
      }
    } catch (e: any) {
      setErrorMessage(e?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async (role: 'merchant' | 'buyer') => {
    setIsLoading(true);
    try {
      await loginWithDemo(role);
      if (role === 'merchant') {
        router.replace('/(tabs)');
      } else {
        router.replace('/explore-sellers');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-surface">
      {/* Top Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-cardBorder">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full active:bg-surfaceContainer"
        >
          <AppIcon name="arrow_back" size={22} color={colors.onSurface} />
        </Pressable>
        <View className="flex-row items-center gap-2">
          <BrandLogo variant="emblem" size={26} />
          <Text className="text-base font-bold text-onSurface">StockPilot NG</Text>
        </View>
        {currentUser ? (
          <Pressable
            onPress={() => router.replace('/(tabs)')}
            className="px-2.5 py-1 rounded-full bg-secondaryContainer active:bg-secondaryContainer/80"
          >
            <Text className="text-[11px] font-bold text-onSecondaryContainer">Dashboard</Text>
          </Pressable>
        ) : (
          <View className="w-10" />
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
      >
        {/* Already logged in session reminder */}
        {currentUser && (
          <View className="p-3 rounded-xl bg-secondaryContainer mb-4 flex-row items-center justify-between border border-cardBorder shadow-xs">
            <View className="flex-row items-center gap-2 flex-1 mr-2">
              <AppIcon name="check_circle" size={16} color={colors.secondary} />
              <View className="flex-1 min-w-0">
                <Text className="text-[10px] text-onSecondaryContainer font-bold uppercase tracking-wider">
                  Active Login Session
                </Text>
                <Text className="text-xs text-onSurface font-bold truncate">
                  {currentUser.businessName || currentUser.name}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() => router.replace('/(tabs)')}
              className="px-2.5 py-1 rounded-lg bg-primary active:bg-secondary flex-row items-center gap-1 shadow-xs"
            >
              <Text className="text-xs font-bold text-white">Dashboard</Text>
              <AppIcon name="arrow_forward" size={13} color="#ffffff" />
            </Pressable>
          </View>
        )}

        {/* Title & Badge */}
        <View className="mb-6">
          <BrandLogo variant="full" width={140} className="mb-4" />
          <View className="self-start flex-row items-center gap-1.5 px-3 py-1 rounded-full bg-secondaryContainer mb-2">
            <View className="w-2 h-2 rounded-full bg-primary" />
            <Text className="text-xs font-bold text-onSecondaryContainer">
              Direct Merchant Terminal
            </Text>
          </View>
          <Text className="text-2xl font-extrabold text-onSurface">Welcome Back</Text>
          <Text className="text-sm text-onSurfaceVariant mt-1">
            Sign in to manage your inventory, sales ledger, and customer credit recovery.
          </Text>
        </View>

        {/* Auth Mode Tabs */}
        <View className="flex-row bg-surfaceContainerLow p-1 rounded-xl mb-5 border border-cardBorder">
          <Pressable
            onPress={() => setAuthMode('phone')}
            className={`flex-1 py-2.5 rounded-lg items-center ${
              authMode === 'phone' ? 'bg-white shadow-sm' : ''
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                authMode === 'phone' ? 'text-primary' : 'text-onSurfaceVariant'
              }`}
            >
              Phone Number (+234)
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setAuthMode('email')}
            className={`flex-1 py-2.5 rounded-lg items-center ${
              authMode === 'email' ? 'bg-white shadow-sm' : ''
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                authMode === 'email' ? 'text-primary' : 'text-onSurfaceVariant'
              }`}
            >
              Email / Merchant ID
            </Text>
          </Pressable>
        </View>

        {/* Input Fields */}
        <View className="gap-4 mb-5">
          {authMode === 'phone' ? (
            <View>
              <Text className="text-xs font-bold text-onSurface mb-1.5">WhatsApp / Phone Number</Text>
              <View className="flex-row items-center bg-white border border-cardBorder rounded-xl px-3 h-12 focus:border-primary">
                <Text className="text-sm font-bold text-onSurfaceVariant mr-2">+234</Text>
                <View className="w-px h-6 bg-cardBorder mr-2" />
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="803 123 4567"
                  keyboardType="phone-pad"
                  className="flex-1 text-sm text-onSurface font-medium outline-none"
                />
              </View>
            </View>
          ) : (
            <View>
              <Text className="text-xs font-bold text-onSurface mb-1.5">Email Address</Text>
              <View className="bg-white border border-cardBorder rounded-xl px-3 h-12 justify-center focus:border-primary">
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="musa@stockpilot.ng"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="text-sm text-onSurface font-medium outline-none"
                />
              </View>
            </View>
          )}

          <View>
            <View className="flex-row justify-between items-center mb-1.5">
              <Text className="text-xs font-bold text-onSurface">Password / Security PIN</Text>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/otp-verify',
                    params: {
                      phone: authMode === 'phone' ? (phone.startsWith('+') ? phone : `+234 ${phone.replace(/^0+/, '')}`) : undefined,
                      source: 'login',
                    },
                  })
                }
              >
                <Text className="text-xs font-bold text-primary">Login via WhatsApp OTP</Text>
              </Pressable>
            </View>
            <View className="bg-white border border-cardBorder rounded-xl px-3 h-12 justify-center focus:border-primary">
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter 4-6 digit pin or password"
                secureTextEntry
                className="text-sm text-onSurface font-medium outline-none"
              />
            </View>
          </View>
        </View>

        {/* Error Alert */}
        {errorMessage && (
          <View className="p-3 rounded-xl bg-errorContainer mb-4 flex-row items-center gap-2">
            <AppIcon name="warning" size={18} color={colors.error} />
            <Text className="text-xs text-onErrorContainer flex-1 font-medium">{errorMessage}</Text>
          </View>
        )}

        {/* Sign In Button */}
        <Pressable
          onPress={handleSignIn}
          disabled={isLoading}
          className="w-full h-12 rounded-xl bg-primary items-center justify-center flex-row gap-2 active:bg-secondary shadow-md mb-6"
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <Text className="text-white font-bold text-sm">Sign In to Workspace</Text>
              <AppIcon name="arrow_forward" size={18} color="#ffffff" />
            </>
          )}
        </Pressable>

        {/* One-Tap Demo Access Divider */}
        <View className="flex-row items-center gap-3 mb-4">
          <View className="flex-1 h-px bg-cardBorder" />
          <Text className="text-xs font-bold text-onSurfaceVariant uppercase tracking-wider">
            Quick Exploration
          </Text>
          <View className="flex-1 h-px bg-cardBorder" />
        </View>

        {/* Quick Access Buttons */}
        <View className="flex-row gap-3 mb-6">
          <Pressable
            onPress={() => handleQuickDemo('merchant')}
            className="flex-1 p-3.5 rounded-xl bg-white border border-cardBorder items-center justify-center active:bg-surfaceContainer shadow-sm"
          >
            <View className="w-10 h-10 rounded-xl bg-secondaryContainer items-center justify-center mb-1.5">
              <AppIcon name="warehouse" size={20} color={colors.secondary} />
            </View>
            <Text className="text-xs font-bold text-onSurface">
              Merchant Mode
            </Text>
            <Text className="text-[10px] text-onSurfaceVariant mt-0.5">
              Store & Till Workspace
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleQuickDemo('buyer')}
            className="flex-1 p-3.5 rounded-xl bg-white border border-cardBorder items-center justify-center active:bg-surfaceContainer shadow-sm"
          >
            <View className="w-10 h-10 rounded-xl bg-surfaceContainerHigh items-center justify-center mb-1.5">
              <AppIcon name="shopping_bag" size={20} color={colors.tertiary} />
            </View>
            <Text className="text-xs font-bold text-onSurface">
              Buyer Mode
            </Text>
            <Text className="text-[10px] text-onSurfaceVariant mt-0.5">
              Marketplace & Catalog
            </Text>
          </Pressable>
        </View>

        {/* New Merchant Signup Callout */}
        <View className="items-center">
          <Text className="text-xs text-onSurfaceVariant">
            New to StockPilot?{' '}
            <Text
              onPress={() => router.push('/signup')}
              className="text-primary font-bold underline"
            >
              Create Free Business Account
            </Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
