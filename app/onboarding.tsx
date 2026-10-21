import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AppIcon } from '@/components/icon';
import { BrandLogo } from '@/components/brand-logo';
import { colors } from '@/lib/theme';
import { loginWithDemo } from '@/lib/auth';

export default function WelcomeOnboardingScreen() {
  const router = useRouter();

  const handleLaunchDemo = async (role: 'merchant' | 'buyer') => {
    await loginWithDemo(role);
    if (role === 'merchant') {
      router.replace('/(tabs)');
    } else {
      router.replace('/explore-sellers');
    }
  };

  return (
    <View className="flex-1 bg-surface">
      {/* Minimalist Brand Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-cardBorder shadow-sm">
        <View className="flex-row items-center gap-2">
          <BrandLogo variant="emblem" size={32} />
          <View>
            <Text className="text-base font-bold text-onSurface leading-tight">StockPilot</Text>
            <Text className="text-[10px] font-bold text-primary tracking-wider uppercase">Nigeria</Text>
          </View>
        </View>

        <Pressable
          onPress={() => router.push('/login')}
          className="px-4 py-1.5 rounded-full bg-surfaceContainer active:bg-surfaceContainerHigh"
        >
          <Text className="text-sm font-semibold text-onSurface">Log In</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        {/* Hero & Value Statement */}
        <View className="px-4 pt-5 pb-3">
          {/* Offline & Reliability Pill */}
          <View className="self-start flex-row items-center gap-1.5 px-3 py-1 rounded-full bg-secondaryContainer mb-3">
            <View className="w-2 h-2 rounded-full bg-primary" />
            <Text className="text-xs font-bold text-onSecondaryContainer">
              100% Offline Capable • Zero Network Wahala
            </Text>
          </View>

          {/* Main Headline */}
          <Text className="text-2xl font-extrabold text-onSurface tracking-tight leading-tight mb-1.5">
            Run Your Shop With <Text className="text-primary">Zero Wahala</Text>
          </Text>
          <Text className="text-sm text-onSurfaceVariant leading-relaxed mb-4">
            Join over 12,000+ FMCG wholesalers, provision stores, and distributors across Idumota, Balogun, Alaba & Trade Fair.
          </Text>

          {/* Visual Interactive Hero Showcase: Live Register & Margin Card */}
          <View className="bg-white rounded-2xl p-4 border border-cardBorder shadow-sm mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2">
                <View className="w-2.5 h-2.5 rounded-full bg-primary" />
                <Text className="text-xs font-semibold text-onSurfaceVariant">
                  Live Register Snapshot
                </Text>
              </View>
              <View className="flex-row items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondaryContainer">
                <AppIcon name="check_circle" size={12} color={colors.secondary} />
                <Text className="text-[11px] font-bold text-onSecondaryContainer">
                  Auto-Synced
                </Text>
              </View>
            </View>

            {/* Live Metric Ticker */}
            <View className="flex-row gap-2.5 mb-3">
              <View className="flex-1 p-3 rounded-xl bg-surfaceContainerLow">
                <Text className="text-[11px] text-onSurfaceVariant font-medium">{"Today's Sales"}</Text>
                <Text className="text-lg font-bold text-onSurface mt-0.5">₦1,420,500</Text>
                <View className="flex-row items-center gap-0.5 mt-0.5">
                  <AppIcon name="trending_up" size={13} color={colors.primary} />
                  <Text className="text-[11px] font-bold text-primary">+18.4%</Text>
                </View>
              </View>

              <View className="flex-1 p-3 rounded-xl bg-errorContainer">
                <Text className="text-[11px] text-onErrorContainer font-medium">Delinquent Credit</Text>
                <Text className="text-lg font-bold text-onErrorContainer mt-0.5">₦85,000</Text>
                <View className="flex-row items-center gap-0.5 mt-0.5">
                  <AppIcon name="lock_clock" size={13} color={colors.error} />
                  <Text className="text-[11px] font-semibold text-onErrorContainer">2 reminders due</Text>
                </View>
              </View>
            </View>

            {/* Quick Item Ticker */}
            <View className="flex-row items-center justify-between p-2.5 rounded-xl bg-surfaceContainer">
              <View className="flex-row items-center gap-2.5 flex-1 mr-2">
                <View className="w-8 h-8 rounded-lg bg-white items-center justify-center">
                  <AppIcon name="inventory" size={16} color={colors.primary} />
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="text-xs font-bold text-onSurface truncate">
                    Dangote Sugar (50kg Bag)
                  </Text>
                  <Text className="text-[11px] text-onSurfaceVariant truncate">
                    Cost: ₦78,000 • Margin: +₦4,500
                  </Text>
                </View>
              </View>
              <View className="px-2 py-1 rounded bg-secondaryContainer">
                <Text className="text-[11px] font-bold text-onSecondaryContainer">
                  42 Bags Left
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Market Atmosphere & Merchant Proof */}
        <View className="px-4 mb-4">
          <View className="relative rounded-2xl overflow-hidden bg-[#0d2e20] p-4 min-h-[120px] justify-end shadow-sm">
            <View className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <View className="relative z-10">
              <Text className="text-[10px] font-bold text-[#8bd79b] uppercase tracking-wider">
                Idumota Wholesale Hub • Alaba • Dawanau
              </Text>
              <Text className="text-base font-bold text-white mt-0.5">
                Powering ₦450M+ daily turnover across open-air markets.
              </Text>
            </View>
          </View>
        </View>

        {/* Feature Grid: High Trust Core Pillars */}
        <View className="px-4 flex-col gap-3 mb-5">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-bold text-onSurface">Designed for Fast Lagos Trade</Text>
            <Text className="text-xs font-bold text-primary">4 Key Pillars</Text>
          </View>

          {/* Pillar 1 */}
          <View className="p-4 rounded-xl bg-white border border-cardBorder shadow-sm">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-xl bg-surfaceContainer items-center justify-center">
                <AppIcon name="calculate" size={22} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-onSurface">Track Stock & Landed Margins</Text>
                <Text className="text-xs text-primary font-semibold">Instant Profit Clarity</Text>
              </View>
            </View>
            <Text className="text-xs text-onSurfaceVariant mt-2 leading-relaxed">
              Know your exact net profit before sealing wholesale deals. Receive automatic alerts when high-velocity goods run below safety thresholds.
            </Text>
          </View>

          {/* Pillar 2 */}
          <View className="p-4 rounded-xl bg-white border border-cardBorder shadow-sm">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-xl bg-secondaryContainer items-center justify-center">
                <AppIcon name="chat" size={22} color={colors.secondary} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-onSurface">Instant WhatsApp Receipts</Text>
                <Text className="text-xs text-secondary font-semibold">Zero Thermal Paper Waste</Text>
              </View>
            </View>
            <Text className="text-xs text-onSurfaceVariant mt-2 leading-relaxed">
              Disburse digital, branded transaction slips directly to customer WhatsApp with a single tap. Customers can verify purchases without messy paper.
            </Text>
          </View>

          {/* Pillar 3 */}
          <View className="p-4 rounded-xl bg-white border border-cardBorder shadow-sm">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-xl bg-surfaceContainerHigh items-center justify-center">
                <AppIcon name="wallet" size={22} color={colors.tertiary} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-onSurface">Stop Losing Money to Bad Debts</Text>
                <Text className="text-xs text-tertiary font-semibold">Collect 4x Faster</Text>
              </View>
            </View>
            <Text className="text-xs text-onSurfaceVariant mt-2 leading-relaxed">
              Log store credit instantly on customer records. Scheduled courteous WhatsApp reminders prompt debtors precisely on agreed settlement dates.
            </Text>
          </View>

          {/* Pillar 4 */}
          <View className="p-4 rounded-xl bg-white border border-cardBorder shadow-sm">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-xl bg-surfaceContainer items-center justify-center">
                <AppIcon name="verified_user" size={22} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-onSurface">Verify Real Bank Alerts</Text>
                <Text className="text-xs text-primary font-semibold">Scam Protection</Text>
              </View>
            </View>
            <Text className="text-xs text-onSurfaceVariant mt-2 leading-relaxed">
              Distinguish confirmed NIBSS / bank settlements from forged SMS transfer alerts before loading delivery trucks or releasing carton goods.
            </Text>
          </View>
        </View>

        {/* Merchant Testimonial Card */}
        <View className="px-4 mb-5">
          <View className="p-4 rounded-2xl bg-surfaceContainer border border-cardBorder shadow-sm">
            <View className="flex-row items-center gap-3 mb-2.5">
              <View className="w-12 h-12 rounded-full bg-primary items-center justify-center shadow-sm">
                <Text className="text-white font-extrabold text-base">AM</Text>
              </View>
              <View className="flex-1 min-w-0">
                <Text className="text-sm font-bold text-onSurface truncate">Alhaji Musa Sani</Text>
                <Text className="text-xs text-onSurfaceVariant truncate">
                  Musa & Sons Provisions, Idumota Market
                </Text>
                <View className="flex-row items-center gap-0.5 mt-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <AppIcon key={i} name="star" size={14} color="#f59e0b" />
                  ))}
                </View>
              </View>
            </View>

            <Text className="text-xs italic text-onSurface leading-relaxed">
              {"“Before StockPilot, my apprentices were giving customer credit I didn't know about. With stock shortages and fake SMS transfers, I was losing money every month. Now, every single carton is accounted for!”"}
            </Text>

            <View className="flex-row items-center gap-1.5 pt-2 mt-2 border-t border-cardBorder/50">
              <AppIcon name="verified" size={15} color={colors.primary} />
              <Text className="text-[11px] font-bold text-primary">
                Verified Merchant • ₦85M+ Logged Volume
              </Text>
            </View>
          </View>
        </View>

        {/* Market Sellers Interactive Preview Sheet */}
        <View className="px-4 mb-4">
          <View className="p-4 rounded-2xl bg-surfaceContainerLow border border-cardBorder">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2">
                <AppIcon name="warehouse" size={18} color={colors.primary} />
                <Text className="text-sm font-bold text-onSurface">Live Market Sellers</Text>
              </View>
              <Pressable onPress={() => router.push('/explore-sellers')}>
                <Text className="text-xs font-bold text-primary">View All 5,400+</Text>
              </Pressable>
            </View>

            <View className="flex-col gap-2">
              <Pressable
                onPress={() => router.push('/explore-sellers')}
                className="flex-row items-center justify-between p-3 rounded-xl bg-white border border-cardBorder shadow-sm"
              >
                <View className="flex-row items-center gap-2.5 flex-1 min-w-0">
                  <View className="w-8 h-8 rounded-full bg-secondaryContainer items-center justify-center">
                    <Text className="text-xs font-bold text-onSecondaryContainer">TC</Text>
                  </View>
                  <View className="flex-1 min-w-0">
                    <Text className="text-xs font-bold text-onSurface truncate">
                      TopChoice Confectioneries
                    </Text>
                    <Text className="text-[11px] text-onSurfaceVariant truncate">
                      Trade Fair Complex, Lagos
                    </Text>
                  </View>
                </View>
                <View className="px-2 py-0.5 rounded-full bg-surfaceContainer">
                  <Text className="text-[11px] font-semibold text-onSurface">142 SKUs</Text>
                </View>
              </Pressable>

              <Pressable
                onPress={() => router.push('/explore-sellers')}
                className="flex-row items-center justify-between p-3 rounded-xl bg-white border border-cardBorder shadow-sm"
              >
                <View className="flex-row items-center gap-2.5 flex-1 min-w-0">
                  <View className="w-8 h-8 rounded-full bg-surfaceContainerHigh items-center justify-center">
                    <Text className="text-xs font-bold text-onSurface">BO</Text>
                  </View>
                  <View className="flex-1 min-w-0">
                    <Text className="text-xs font-bold text-onSurface truncate">
                      Balogun Oils & Spices
                    </Text>
                    <Text className="text-[11px] text-onSurfaceVariant truncate">
                      Balogun Market, Lagos Island
                    </Text>
                  </View>
                </View>
                <View className="px-2 py-0.5 rounded-full bg-surfaceContainer">
                  <Text className="text-[11px] font-semibold text-onSurface">88 SKUs</Text>
                </View>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom CTA Dock */}
      <View className="absolute bottom-0 inset-x-0 bg-white/95 border-t border-cardBorder px-4 py-3 pb-6 shadow-xl">
        <Pressable
          onPress={() => router.push('/signup')}
          className="w-full h-12 rounded-xl bg-primary items-center justify-center flex-row gap-2 active:bg-secondary shadow-md mb-2"
        >
          <Text className="text-white font-bold text-sm">Create Free Business Account</Text>
          <AppIcon name="arrow_forward" size={18} color="#ffffff" />
        </Pressable>

        <View className="flex-row gap-2">
          <Pressable
            onPress={() => handleLaunchDemo('merchant')}
            className="flex-1 h-10 rounded-xl bg-surfaceContainer items-center justify-center flex-row gap-1 active:bg-surfaceContainerHigh"
          >
            <AppIcon name="warehouse" size={16} color={colors.primary} />
            <Text className="text-xs font-bold text-onSurface">Merchant Demo</Text>
          </Pressable>

          <Pressable
            onPress={() => handleLaunchDemo('buyer')}
            className="flex-1 h-10 rounded-xl bg-surfaceContainer items-center justify-center flex-row gap-1 active:bg-surfaceContainerHigh"
          >
            <AppIcon name="shopping_bag" size={16} color={colors.tertiary} />
            <Text className="text-xs font-bold text-onSurface">Buyer Stalls Demo</Text>
          </Pressable>
        </View>

        <Text className="text-[11px] text-center text-onSurfaceVariant mt-2">
          Takes only 60 seconds • No card required • Free 30-day trial
        </Text>
      </View>
    </View>
  );
}
