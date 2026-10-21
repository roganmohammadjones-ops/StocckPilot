import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/app-header';
import { AppIcon } from '@/components/icon';
import { colors } from '@/lib/theme';

export default function SalesRegisterScreen() {
  const router = useRouter();
  const [selectedRange, setSelectedRange] = useState<'today' | 'yesterday' | 'week'>('today');

  const salesTransactions = [
    {
      id: 'SP-1094',
      customer: 'Walk-in Customer',
      time: '12:44 PM',
      amount: '₦142,900',
      status: 'Completed',
      channel: 'Cash',
      itemsCount: '3 items (Sugar, Semo, Milk)',
    },
    {
      id: 'SP-1093',
      customer: 'Mama Nkechi Stores',
      time: '11:20 AM',
      amount: '₦85,000',
      status: 'Completed',
      channel: 'Bank Transfer',
      itemsCount: '2 items (Peak Milk 2 ctn)',
    },
    {
      id: 'SP-1092',
      customer: 'Alhaji Musa Provisions',
      time: '10:15 AM',
      amount: '₦64,200',
      status: 'Credit (IOU)',
      channel: 'Credit Ledger',
      itemsCount: '1 item (Indomie 5 ctn)',
    },
    {
      id: 'SP-1091',
      customer: 'Chukwudi Supermarket',
      time: '09:05 AM',
      amount: '₦194,400',
      status: 'Completed',
      channel: 'Moniepoint POS',
      itemsCount: '4 items (Sugar 2, Veg Oil 2)',
    },
  ];

  return (
    <View className="flex-1 bg-surface">
      <AppHeader />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 80 }}
      >
        {/* 1. Daily Sales Summary Banner */}
        <View className="bg-white rounded-xl p-4 border border-cardBorder shadow-sm mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-1.5">
              <AppIcon name="analytics" size={20} color={colors.primary} />
              <Text className="text-base font-bold text-onSurface">Daily Register Pulse</Text>
            </View>
            <View className="flex-row items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondaryContainer/50">
              <AppIcon name="lock_clock" size={13} color={colors.onSecondaryContainer} />
              <Text className="text-xs font-semibold text-onSecondaryContainer">
                Shift #1 Open
              </Text>
            </View>
          </View>

          {/* Metric Readout */}
          <View className="bg-surfaceContainerLow rounded-xl p-3.5 mb-3">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-xs text-onSurfaceVariant">{"Today's Total Sales"}</Text>
              <View className="flex-row items-center gap-0.5 px-2 py-0.5 rounded-full bg-secondaryContainer">
                <AppIcon name="trending_up" size={12} color={colors.onSecondaryContainer} />
                <Text className="text-[11px] font-bold text-onSecondaryContainer">
                  +14.8% vs Yest.
                </Text>
              </View>
            </View>
            <Text className="text-3xl font-bold text-onSurface tracking-tight">
              ₦486,500<Text className="text-sm font-normal text-onSurfaceVariant">.00</Text>
            </Text>
            <View className="flex-row items-center justify-between pt-2 border-t border-cardBorder mt-2">
              <View className="flex-row items-center gap-1">
                <AppIcon name="shopping_bag" size={15} color={colors.primary} />
                <Text className="text-xs text-onSurface">
                  <Text className="font-bold">38</Text> Completed Sales
                </Text>
              </View>
              <View className="flex-row items-center gap-1">
                <AppIcon name="payments" size={15} color={colors.secondary} />
                <Text className="text-xs text-onSurface">
                  Est. Profit: <Text className="font-bold text-primary">₦92,400</Text>
                </Text>
              </View>
            </View>
          </View>

          {/* Date Chips */}
          <View className="flex-row items-center gap-2">
            {[
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'week', label: 'This Week' },
            ].map((tab) => (
              <Pressable
                key={tab.id}
                onPress={() => setSelectedRange(tab.id as any)}
                className={`px-3 py-1.5 rounded-full active:scale-95 ${
                  selectedRange === tab.id
                    ? 'bg-primary'
                    : 'bg-surfaceContainer border border-cardBorder'
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    selectedRange === tab.id ? 'text-white' : 'text-onSurfaceVariant'
                  }`}
                >
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* 2. Primary CTA Card / Action Dock */}
        <View className="bg-white rounded-xl p-4 border border-cardBorder shadow-sm mb-4">
          <View className="flex-row items-stretch gap-2 mb-3">
            <Pressable
              onPress={() => router.push('/modal/new-sale')}
              className="flex-1 bg-primary rounded-xl px-4 py-3 flex-row items-center justify-between shadow-md active:bg-primaryContainer"
            >
              <View className="flex-row items-center gap-2.5">
                <AppIcon name="point_of_sale" size={24} color="#ffffff" />
                <View>
                  <Text className="text-base font-bold text-white leading-tight">
                    Start New Sale
                  </Text>
                  <Text className="text-xs text-white/80">POS Mode • Instant Billing</Text>
                </View>
              </View>
              <View className="px-2 py-0.5 rounded bg-black/20">
                <Text className="text-[10px] font-bold text-white uppercase">F2</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => router.push('/modal/new-sale')}
              className="w-14 rounded-xl bg-surfaceContainer items-center justify-center active:bg-surfaceContainerHigh"
            >
              <AppIcon name="barcode_scanner" size={22} color={colors.primary} />
              <Text className="text-[10px] font-semibold text-onSurfaceVariant mt-0.5">
                Scan
              </Text>
            </Pressable>
          </View>

          {/* Active Cart Mini Drawer */}
          <Pressable
            onPress={() => router.push('/modal/new-sale')}
            className="bg-surfaceContainerHigh/60 rounded-xl p-3 flex-row items-center justify-between active:opacity-80"
          >
            <View className="flex-row items-center gap-2.5 flex-1 mr-2">
              <View className="w-9 h-9 rounded-lg bg-secondaryContainer items-center justify-center">
                <AppIcon name="shopping_cart" size={18} color={colors.onSecondaryContainer} />
              </View>
              <View className="flex-1 min-w-0">
                <View className="flex-row items-center gap-1.5">
                  <Text className="text-xs font-bold text-onSurface">
                    Active Cart: 3 items
                  </Text>
                  <View className="w-1.5 h-1.5 rounded-full bg-primary" />
                </View>
                <Text className="text-xs text-onSurfaceVariant truncate">
                  Walk-in Customer • <Text className="font-bold text-onSurface">₦76,200</Text>
                </Text>
              </View>
            </View>
            <View className="flex-row items-center gap-1 px-3 py-1.5 rounded-lg bg-primary">
              <Text className="text-xs font-semibold text-white">Resume</Text>
              <AppIcon name="arrow_forward" size={14} color="#ffffff" />
            </View>
          </Pressable>
        </View>

        {/* 3. Payment Channel Breakdown Pill Strip */}
        <View className="bg-white rounded-xl p-4 border border-cardBorder shadow-sm mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xs font-bold text-onSurface">Collection Channels</Text>
            <Text className="text-xs text-outline">{"Today's Split"}</Text>
          </View>

          {/* Proportional Progress Bar */}
          <View className="h-2.5 w-full bg-surfaceContainer rounded-full overflow-hidden flex-row mb-3">
            <View style={{ width: '38%' }} className="h-full bg-secondary" />
            <View style={{ width: '45%' }} className="h-full bg-tertiary" />
            <View style={{ width: '17%' }} className="h-full bg-error" />
          </View>

          {/* 3 Channels */}
          <View className="flex-row gap-2">
            <View className="flex-1 bg-surfaceContainerLow rounded-lg p-2">
              <View className="flex-row items-center gap-1">
                <View className="w-2 h-2 rounded-full bg-secondary" />
                <Text className="text-[11px] font-semibold text-secondary">Cash (38%)</Text>
              </View>
              <Text className="text-sm font-bold text-onSurface mt-1">₦185k</Text>
            </View>
            <View className="flex-1 bg-surfaceContainerLow rounded-lg p-2">
              <View className="flex-row items-center gap-1">
                <View className="w-2 h-2 rounded-full bg-tertiary" />
                <Text className="text-[11px] font-semibold text-tertiary">Transfer (45%)</Text>
              </View>
              <Text className="text-sm font-bold text-onSurface mt-1">₦221.5k</Text>
            </View>
            <View className="flex-1 bg-surfaceContainerLow rounded-lg p-2">
              <View className="flex-row items-center gap-1">
                <View className="w-2 h-2 rounded-full bg-error" />
                <Text className="text-[11px] font-semibold text-error">Credit (17%)</Text>
              </View>
              <Text className="text-sm font-bold text-onSurface mt-1">₦80k</Text>
            </View>
          </View>
        </View>

        {/* 4. Recent Sales Register List */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-2.5">
            <View className="flex-row items-center gap-1.5">
              <Text className="text-base font-bold text-onSurface">Recent Sales Register</Text>
              <View className="px-2 py-0.5 rounded-full bg-surfaceContainer">
                <Text className="text-[10px] font-bold text-onSurfaceVariant">38 Total</Text>
              </View>
            </View>
            <Pressable
              onPress={() => router.push('/reports')}
              className="flex-row items-center"
            >
              <Text className="text-xs font-semibold text-primary">Full Ledger</Text>
              <AppIcon name="chevron_right" size={14} color={colors.primary} />
            </Pressable>
          </View>

          <View className="gap-3">
            {salesTransactions.map((tx) => (
              <View
                key={tx.id}
                className="bg-white rounded-xl p-3.5 border border-cardBorder shadow-sm"
              >
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-row items-center gap-2.5 flex-1 mr-2">
                    <View className="w-10 h-10 rounded-lg bg-surfaceContainer items-center justify-center">
                      <AppIcon name="person" size={20} color={colors.onSurfaceVariant} />
                    </View>
                    <View className="flex-1 min-w-0">
                      <View className="flex-row items-center gap-1.5">
                        <Text className="text-sm font-bold text-onSurface truncate">
                          {tx.customer}
                        </Text>
                        <View
                          className={`px-1.5 py-0.2 rounded-full ${
                            tx.status.includes('Credit')
                              ? 'bg-errorContainer'
                              : 'bg-secondaryContainer'
                          }`}
                        >
                          <Text
                            className={`text-[10px] font-bold ${
                              tx.status.includes('Credit')
                                ? 'text-onErrorContainer'
                                : 'text-onSecondaryContainer'
                            }`}
                          >
                            {tx.status}
                          </Text>
                        </View>
                      </View>
                      <View className="flex-row items-center gap-1 mt-0.5">
                        <Text className="text-xs font-bold text-primary">#{tx.id}</Text>
                        <Text className="text-xs text-outline">•</Text>
                        <Text className="text-xs text-onSurfaceVariant">{tx.time}</Text>
                      </View>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className="text-base font-bold text-onSurface">{tx.amount}</Text>
                    <Text className="text-[11px] text-onSurfaceVariant">{tx.channel}</Text>
                  </View>
                </View>

                <View className="pt-2 border-t border-dashed border-cardBorder flex-row items-center justify-between">
                  <Text className="text-xs text-onSurfaceVariant">{tx.itemsCount}</Text>
                  <Pressable
                    onPress={() => router.push('/modal/new-sale')}
                    className="flex-row items-center gap-0.5"
                  >
                    <Text className="text-xs font-semibold text-primary">View receipt</Text>
                    <AppIcon name="chevron_right" size={13} color={colors.primary} />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
