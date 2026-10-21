import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AppIcon } from '@/components/icon';
import { BrandLogo } from '@/components/brand-logo';
import { colors } from '@/lib/theme';
import { getStoredUser, saveStoredUser } from '@/lib/auth';

export default function OtpVerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string; businessName?: string }>();
  const [digits, setDigits] = useState(['4', '8', '2', '9', '', '']);
  const [timerCount, setTimerCount] = useState(38);
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const displayPhone = params.phone || '+234 803 ••• ••89';

  useEffect(() => {
    if (timerCount <= 0) {
      setCanResend(true);
      return;
    }
    const interval = setInterval(() => {
      setTimerCount((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timerCount]);

  const handleDigitChange = (val: string, index: number) => {
    const updated = [...digits];
    updated[index] = val.slice(-1);
    setDigits(updated);
  };

  const handleVerify = () => {
    setIsVerifying(true);
    setTimeout(() => {
      const existing = getStoredUser();
      if (existing) {
        saveStoredUser({ ...existing, isDemo: false });
      }
      setIsVerifying(false);
      router.replace('/(tabs)');
    }, 600);
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
        <Text className="text-base font-bold text-onSurface">Phone OTP Verification</Text>
        <BrandLogo variant="emblem" size={28} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
      >
        {/* Step Badge & Process Indicator */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-1.5 px-3 py-1 rounded-full bg-secondaryContainer">
              <AppIcon name="verified" size={14} color={colors.secondary} />
              <Text className="text-xs font-bold text-onSecondaryContainer">
                Step 2 of 2: Quick Identity Verification
              </Text>
            </View>
            <Text className="text-xs font-semibold text-secondary">95% Complete</Text>
          </View>
          <View className="w-full h-1.5 bg-surfaceContainer rounded-full overflow-hidden">
            <View className="h-full bg-primary rounded-full w-[95%]" />
          </View>
        </View>

        {/* Verification Hero Card */}
        <View className="bg-white rounded-2xl p-5 border border-cardBorder shadow-sm mb-5">
          <View className="flex-row items-start gap-3 mb-2">
            <View className="w-12 h-12 rounded-xl bg-secondaryContainer/50 items-center justify-center border border-cardBorder">
              <BrandLogo variant="emblem" size={32} />
            </View>
            <View className="flex-1 min-w-0">
              <Text className="text-[11px] font-bold text-secondary uppercase tracking-wider">
                Instant Order & Till Lock
              </Text>
              <Text className="text-lg font-bold text-onSurface leading-snug mt-0.5">
                Verify Your Phone to Activate StockPilot
              </Text>
            </View>
          </View>

          <Text className="text-xs text-onSurfaceVariant leading-relaxed mb-4">
            We sent a 6-digit verification code via WhatsApp & SMS to{' '}
            <Text className="font-bold text-onSurface">{displayPhone}</Text> to verify your shop
            and link your offline POS cache.
          </Text>

          {/* 6-digit OTP Input Group */}
          <View className="flex-row items-center justify-between gap-2 mb-3">
            {digits.map((digit, idx) => (
              <TextInput
                key={idx}
                value={digit}
                onChangeText={(val) => handleDigitChange(val, idx)}
                keyboardType="numeric"
                maxLength={1}
                placeholder="•"
                className={`w-12 h-14 text-center text-xl font-bold rounded-xl border ${
                  digit ? 'border-primary bg-secondaryContainer/20 text-primary' : 'border-cardBorder bg-surfaceContainerLow text-onSurface'
                } outline-none`}
              />
            ))}
          </View>

          {/* Resend and Call Helpers */}
          <View className="flex-row items-center justify-between pt-1">
            <Pressable
              disabled={!canResend}
              onPress={() => {
                setTimerCount(45);
                setCanResend(false);
              }}
              className="flex-row items-center gap-1"
            >
              <AppIcon name="history" size={14} color={colors.secondary} />
              <Text className="text-xs text-onSurfaceVariant">
                {canResend ? (
                  <Text className="text-primary font-bold">Resend code now</Text>
                ) : (
                  <>Resend via WhatsApp in <Text className="font-bold text-secondary">{timerCount}s</Text></>
                )}
              </Text>
            </Pressable>

            <Pressable className="flex-row items-center gap-0.5">
              <AppIcon name="near_me" size={14} color={colors.tertiary} />
              <Text className="text-xs font-semibold text-tertiary">Call me with code</Text>
            </Pressable>
          </View>
        </View>

        {/* First Buyer / Merchant Unlocks Banner */}
        <View className="bg-white rounded-2xl p-4 border border-cardBorder shadow-sm mb-4">
          <View className="flex-row items-center justify-between pb-2 mb-2 border-b border-cardBorder/60">
            <View className="flex-row items-center gap-1.5">
              <AppIcon name="star" size={18} color="#f59e0b" />
              <Text className="text-xs font-bold text-onSurface">
                Account Configured Privileges
              </Text>
            </View>
            <View className="px-2 py-0.5 rounded-full bg-secondaryFixed">
              <Text className="text-[10px] font-bold text-secondary">Auto-Applied</Text>
            </View>
          </View>

          <View className="gap-2">
            <View className="flex-row items-start gap-2.5 bg-surfaceContainerLow p-2.5 rounded-xl">
              <View className="w-7 h-7 rounded-lg bg-white items-center justify-center">
                <AppIcon name="bolt" size={16} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-onSurface">0% Settlement & Transaction Fees</Text>
                <Text className="text-[11px] text-onSurfaceVariant">
                  Permanent free tier for registered open-market merchants.
                </Text>
              </View>
            </View>

            <View className="flex-row items-start gap-2.5 bg-surfaceContainerLow p-2.5 rounded-xl">
              <View className="w-7 h-7 rounded-lg bg-white items-center justify-center">
                <AppIcon name="receipt_long" size={16} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-onSurface">Instant WhatsApp Digital Invoices</Text>
                <Text className="text-[11px] text-onSurfaceVariant">
                  Legally binding receipts with itemized stock breakdowns.
                </Text>
              </View>
            </View>

            <View className="flex-row items-start gap-2.5 bg-surfaceContainerLow p-2.5 rounded-xl">
              <View className="w-7 h-7 rounded-lg bg-white items-center justify-center">
                <AppIcon name="calculate" size={16} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-onSurface">₦5,000 First-Time Trade Credit</Text>
                <Text className="text-[11px] text-onSurfaceVariant">
                  Deducted directly from wholesale checkout balance.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Security & Merchant Trust Badge */}
        <View className="bg-surfaceContainerLow rounded-2xl p-3.5 border border-cardBorder flex-row items-center gap-3 mb-6">
          <View className="w-9 h-9 rounded-full bg-white items-center justify-center shadow-sm">
            <AppIcon name="verified_user" size={18} color={colors.secondary} />
          </View>
          <View className="flex-1">
            <Text className="text-xs font-bold text-onSurface">CBN & CAC Compliant Merchant Trade</Text>
            <Text className="text-[11px] text-onSurfaceVariant leading-snug">
              StockPilot wholesale escrow protects both vendor dispatch and buyer payouts.
            </Text>
          </View>
        </View>

        {/* Action Button */}
        <Pressable
          onPress={handleVerify}
          disabled={isVerifying}
          className="w-full h-12 rounded-xl bg-primary items-center justify-center flex-row gap-2 active:bg-secondary shadow-md mb-4"
        >
          {isVerifying ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <Text className="text-white font-bold text-sm">Verify & Launch Workspace</Text>
              <AppIcon name="arrow_forward" size={18} color="#ffffff" />
            </>
          )}
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          className="items-center py-2"
        >
          <Text className="text-xs font-medium text-onSurfaceVariant">Change Phone Number</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
