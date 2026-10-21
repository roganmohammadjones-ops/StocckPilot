import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AppIcon } from '@/components/icon';
import { BrandLogo } from '@/components/brand-logo';
import { colors } from '@/lib/theme';
import { signupMerchant } from '@/lib/auth';

const tradingHubs = [
  'Idumota Wholesale Hub, Lagos',
  'Alaba International Market, Lagos',
  'Balogun Market, Lagos Island',
  'Trade Fair Complex (ASPAAM), Lagos',
  'Dawanau Grain Market, Kano',
  'Onitsha Main Market, Anambra',
  'Mile 12 Food Market, Lagos',
  'Bodija Market, Ibadan',
];

export default function SignupScreen() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState('Alhaji Musa & Sons Provisions');
  const [ownerName, setOwnerName] = useState('Alhaji Musa Sani');
  const [phone, setPhone] = useState('803 491 8820');
  const [selectedHub, setSelectedHub] = useState(tradingHubs[0]);
  const [showHubPicker, setShowHubPicker] = useState(false);

  const handleProceedToOtp = async () => {
    await signupMerchant({
      businessName,
      ownerName,
      phone: `+234 ${phone}`,
      tradeHub: selectedHub,
    });
    router.push({
      pathname: '/otp-verify',
      params: { phone: `+234 ${phone}`, businessName, source: 'signup' },
    });
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
        <View className="w-10" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
      >
        <BrandLogo variant="full" width={135} className="mb-4" />

        {/* Step Indicator */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-1.5 px-3 py-1 rounded-full bg-secondaryContainer">
              <AppIcon name="verified" size={14} color={colors.secondary} />
              <Text className="text-xs font-bold text-onSecondaryContainer">
                Step 1 of 2: Business Profile
              </Text>
            </View>
            <Text className="text-xs font-semibold text-secondary">50% Complete</Text>
          </View>
          <View className="w-full h-1.5 bg-surfaceContainer rounded-full overflow-hidden">
            <View className="h-full bg-primary rounded-full w-1/2" />
          </View>
        </View>

        {/* Headline */}
        <View className="mb-6">
          <Text className="text-2xl font-extrabold text-onSurface">Create Business Account</Text>
          <Text className="text-sm text-onSurfaceVariant mt-1">
            Free 30-day merchant trial. Start tracking inventory and sending WhatsApp receipts in 60 seconds.
          </Text>
        </View>

        {/* Input Fields */}
        <View className="gap-4 mb-6">
          {/* Business / Trading Name */}
          <View>
            <Text className="text-xs font-bold text-onSurface mb-1.5">Registered / Trading Shop Name</Text>
            <View className="bg-white border border-cardBorder rounded-xl px-3 h-12 justify-center focus:border-primary">
              <TextInput
                value={businessName}
                onChangeText={setBusinessName}
                placeholder="e.g. Alhaji Musa & Sons Provisions"
                className="text-sm text-onSurface font-medium outline-none"
              />
            </View>
          </View>

          {/* Owner / Manager Name */}
          <View>
            <Text className="text-xs font-bold text-onSurface mb-1.5">Owner or Principal Trader Name</Text>
            <View className="bg-white border border-cardBorder rounded-xl px-3 h-12 justify-center focus:border-primary">
              <TextInput
                value={ownerName}
                onChangeText={setOwnerName}
                placeholder="e.g. Alhaji Musa Sani"
                className="text-sm text-onSurface font-medium outline-none"
              />
            </View>
          </View>

          {/* WhatsApp / Phone */}
          <View>
            <Text className="text-xs font-bold text-onSurface mb-1.5">WhatsApp Number for Receipts & Alerts</Text>
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

          {/* Market Trading Hub Picker */}
          <View>
            <Text className="text-xs font-bold text-onSurface mb-1.5">Primary Trading Market / Hub</Text>
            <Pressable
              onPress={() => setShowHubPicker(!showHubPicker)}
              className="bg-white border border-cardBorder rounded-xl px-3 h-12 flex-row items-center justify-between active:bg-surfaceContainer"
            >
              <View className="flex-row items-center gap-2 flex-1 min-w-0 mr-2">
                <AppIcon name="location_on" size={18} color={colors.primary} />
                <Text className="text-sm text-onSurface font-medium truncate">{selectedHub}</Text>
              </View>
              <AppIcon name="arrow_drop_down" size={20} color={colors.outline} />
            </Pressable>

            {showHubPicker && (
              <View className="bg-white border border-cardBorder rounded-xl mt-1.5 shadow-lg overflow-hidden divide-y divide-cardBorder">
                {tradingHubs.map((hub) => (
                  <Pressable
                    key={hub}
                    onPress={() => {
                      setSelectedHub(hub);
                      setShowHubPicker(false);
                    }}
                    className={`p-3 flex-row items-center justify-between ${
                      selectedHub === hub ? 'bg-secondaryContainer/40' : 'active:bg-surfaceContainer'
                    }`}
                  >
                    <Text className="text-xs font-semibold text-onSurface">{hub}</Text>
                    {selectedHub === hub && (
                      <AppIcon name="check_circle" size={16} color={colors.primary} />
                    )}
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Benefits Pill Banner */}
        <View className="p-3.5 rounded-xl bg-secondaryContainer/50 border border-secondaryContainer mb-6 flex-row items-center gap-3">
          <View className="w-8 h-8 rounded-lg bg-secondaryContainer items-center justify-center">
            <AppIcon name="bolt" size={18} color={colors.secondary} />
          </View>
          <View className="flex-1">
            <Text className="text-xs font-bold text-onSecondaryContainer">
              100% Offline Database Preloaded
            </Text>
            <Text className="text-[11px] text-onSecondaryContainer/80">
              No internet required for POS checkout and daily inventory recording.
            </Text>
          </View>
        </View>

        {/* Submit Button */}
        <Pressable
          onPress={handleProceedToOtp}
          className="w-full h-12 rounded-xl bg-primary items-center justify-center flex-row gap-2 active:bg-secondary shadow-md mb-4"
        >
          <Text className="text-white font-bold text-sm">Next: Verify WhatsApp Number</Text>
          <AppIcon name="arrow_forward" size={18} color="#ffffff" />
        </Pressable>

        {/* Existing User Link */}
        <View className="items-center">
          <Text className="text-xs text-onSurfaceVariant">
            Already registered?{' '}
            <Text
              onPress={() => router.push('/login')}
              className="text-primary font-bold underline"
            >
              Sign In to Your Workspace
            </Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
