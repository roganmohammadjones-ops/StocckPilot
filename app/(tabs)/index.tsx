import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/app-header';
import { AppIcon } from '@/components/icon';
import { colors } from '@/lib/theme';

export default function HomeDashboardScreen() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<'today' | 'weekly' | 'monthly'>('today');

  const hourlyData = [
    { hour: '8am', amount: '₦35k', heightPct: 25 },
    { hour: '10am', amount: '₦78k', heightPct: 55 },
    { hour: '12pm', amount: '₦142k', heightPct: 98, isPeak: true },
    { hour: '2pm', amount: '₦110k', heightPct: 78 },
    { hour: '4pm', amount: '₦85k', heightPct: 60 },
    { hour: '6pm', amount: '₦36k', heightPct: 26 },
  ];

  return (
    <View className="flex-1 bg-surface">
      <AppHeader />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}
      >
        {/* Greeting & Shop Status */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-1">
            <View className="flex-row items-center gap-1.5 flex-1">
              <Text className="text-xl font-bold text-onSurface">
                Good morning, Chief Bamidele
              </Text>
              <Text className="text-lg">👋</Text>
            </View>
            <View className="flex-row items-center gap-1 bg-surfaceContainer px-2 py-0.5 rounded-full">
              <View className="w-1.5 h-1.5 rounded-full bg-primary" />
              <Text className="text-[11px] font-medium text-onSurfaceVariant">2m ago</Text>
            </View>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-xs text-onSurfaceVariant">
              Bamidele & Sons Provisions • Thu, 24 Oct 2024
            </Text>
            <View className="flex-row items-center gap-1">
              <AppIcon name="verified" size={13} color={colors.primary} />
              <Text className="text-xs font-semibold text-primary">Store Open</Text>
            </View>
          </View>
        </View>

        {/* 2x2 Financial Summary Matrix */}
        <View className="flex-row flex-wrap gap-3 mb-5">
          {/* Card 1: Today's Sales */}
          <View className="flex-1 min-w-[155px] bg-white p-3.5 rounded-xl border border-cardBorder shadow-sm justify-between">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-xs font-medium text-onSurfaceVariant">{"Today's Sales"}</Text>
              <AppIcon name="payments" size={18} color={colors.primary} />
            </View>
            <Text className="text-2xl font-bold text-onSurface tracking-tight mb-1">
              ₦486,500
            </Text>
            <View className="gap-0.5">
              <View className="self-start flex-row items-center px-1.5 py-0.5 rounded bg-secondaryContainer/70">
                <AppIcon name="trending_up" size={12} color={colors.onSecondaryContainer} />
                <Text className="text-[11px] font-bold text-onSecondaryContainer ml-0.5">
                  +18.4%
                </Text>
              </View>
              <Text className="text-[11px] text-onSurfaceVariant">38 transactions</Text>
            </View>
          </View>

          {/* Card 2: Est. Gross Profit */}
          <View className="flex-1 min-w-[155px] bg-white p-3.5 rounded-xl border border-cardBorder shadow-sm justify-between">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-xs font-medium text-onSurfaceVariant">Est. Gross Profit</Text>
              <AppIcon name="query_stats" size={18} color={colors.secondary} />
            </View>
            <Text className="text-2xl font-bold text-onSurface tracking-tight mb-1">
              ₦92,400
            </Text>
            <View className="gap-0.5">
              <View className="self-start px-1.5 py-0.5 rounded bg-surfaceContainer">
                <Text className="text-[11px] font-semibold text-onSurfaceVariant">
                  19.0% Margin
                </Text>
              </View>
              <Text className="text-[11px] text-onSurfaceVariant">Based on landed costs</Text>
            </View>
          </View>

          {/* Card 3: Customer Debts */}
          <Pressable
            onPress={() => router.push('/(tabs)/customers')}
            className="flex-1 min-w-[155px] bg-white p-3.5 rounded-xl border border-cardBorder shadow-sm justify-between active:opacity-80"
          >
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-xs font-medium text-onSurfaceVariant">Customer Debts</Text>
              <AppIcon name="receipt_long" size={18} color={colors.error} />
            </View>
            <Text className="text-2xl font-bold text-onSurface tracking-tight mb-1">
              ₦640,000
            </Text>
            <View className="gap-0.5">
              <View className="self-start px-1.5 py-0.5 rounded bg-errorContainer">
                <Text className="text-[11px] font-bold text-onErrorContainer">
                  14 owing
                </Text>
              </View>
              <View className="flex-row items-center">
                <Text className="text-[11px] font-semibold text-primary">View ledger</Text>
                <AppIcon name="chevron_right" size={13} color={colors.primary} />
              </View>
            </View>
          </Pressable>

          {/* Card 4: Total Stock Valuation */}
          <Pressable
            onPress={() => router.push('/(tabs)/inventory')}
            className="flex-1 min-w-[155px] bg-white p-3.5 rounded-xl border border-cardBorder shadow-sm justify-between active:opacity-80"
          >
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-xs font-medium text-onSurfaceVariant">Total Stock Value</Text>
              <AppIcon name="warehouse" size={18} color={colors.tertiary} />
            </View>
            <Text className="text-2xl font-bold text-onSurface tracking-tight mb-1">
              ₦8.45M
            </Text>
            <View className="gap-0.5">
              <View className="self-start px-1.5 py-0.5 rounded bg-surfaceContainer">
                <Text className="text-[11px] font-semibold text-onSurfaceVariant">
                  184 SKUs
                </Text>
              </View>
              <Text className="text-[11px] text-onSurfaceVariant">6 main categories</Text>
            </View>
          </Pressable>
        </View>

        {/* Frequent Actions (4 Quick Buttons) */}
        <View className="mb-5">
          <View className="flex-row items-center justify-between mb-2.5">
            <Text className="text-sm font-bold text-onSurface">Frequent Actions</Text>
            <Text className="text-xs text-onSurfaceVariant">Tap to trigger</Text>
          </View>
          <View className="flex-row items-center justify-between gap-2">
            {/* Record Sale (Hero Action) */}
            <Pressable
              onPress={() => router.push('/modal/new-sale')}
              className="flex-1 items-center active:scale-95"
            >
              <View className="w-14 h-14 rounded-2xl bg-primary items-center justify-center shadow-md">
                <AppIcon name="point_of_sale" size={26} color="#ffffff" />
              </View>
              <Text className="mt-1.5 text-xs font-bold text-onSurface text-center leading-tight">
                Record{'\n'}Sale
              </Text>
            </Pressable>

            {/* Add Product */}
            <Pressable
              onPress={() => router.push('/modal/add-product')}
              className="flex-1 items-center active:scale-95"
            >
              <View className="w-14 h-14 rounded-2xl bg-secondaryContainer items-center justify-center shadow-sm">
                <AppIcon name="add_box" size={26} color={colors.onSecondaryContainer} />
              </View>
              <Text className="mt-1.5 text-xs font-medium text-onSurface text-center leading-tight">
                Add{'\n'}Product
              </Text>
            </Pressable>

            {/* Add Expense */}
            <Pressable
              onPress={() => router.push('/modal/record-expense')}
              className="flex-1 items-center active:scale-95"
            >
              <View className="w-14 h-14 rounded-2xl bg-surfaceContainerHigh items-center justify-center shadow-sm">
                <AppIcon name="wallet" size={26} color={colors.onSurface} />
              </View>
              <Text className="mt-1.5 text-xs font-medium text-onSurface text-center leading-tight">
                Add{'\n'}Expense
              </Text>
            </Pressable>

            {/* New Customer / Ledger */}
            <Pressable
              onPress={() => router.push('/(tabs)/customers')}
              className="flex-1 items-center active:scale-95"
            >
              <View className="w-14 h-14 rounded-2xl bg-surfaceContainerHighest items-center justify-center shadow-sm">
                <AppIcon name="person_add" size={26} color={colors.tertiary} />
              </View>
              <Text className="mt-1.5 text-xs font-medium text-onSurface text-center leading-tight">
                Customer{'\n'}Ledger
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Sales Performance Hourly Bar Chart Card */}
        <View className="bg-white p-4 rounded-xl border border-cardBorder shadow-sm mb-5">
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="text-base font-bold text-onSurface">Hourly Performance</Text>
              <Text className="text-xs text-onSurfaceVariant">Market volume tracking</Text>
            </View>
            <View className="flex-row p-0.5 bg-surfaceContainer rounded-lg">
              <Pressable
                onPress={() => setSelectedFilter('today')}
                className={`px-2.5 py-1 rounded-md ${
                  selectedFilter === 'today' ? 'bg-white shadow-xs' : ''
                }`}
              >
                <Text
                  className={`text-xs ${
                    selectedFilter === 'today'
                      ? 'text-onSurface font-bold'
                      : 'text-onSurfaceVariant'
                  }`}
                >
                  Today
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setSelectedFilter('weekly')}
                className={`px-2.5 py-1 rounded-md ${
                  selectedFilter === 'weekly' ? 'bg-white shadow-xs' : ''
                }`}
              >
                <Text
                  className={`text-xs ${
                    selectedFilter === 'weekly'
                      ? 'text-onSurface font-bold'
                      : 'text-onSurfaceVariant'
                  }`}
                >
                  Weekly
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setSelectedFilter('monthly')}
                className={`px-2.5 py-1 rounded-md ${
                  selectedFilter === 'monthly' ? 'bg-white shadow-xs' : ''
                }`}
              >
                <Text
                  className={`text-xs ${
                    selectedFilter === 'monthly'
                      ? 'text-onSurface font-bold'
                      : 'text-onSurfaceVariant'
                  }`}
                >
                  Monthly
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Bar Chart Visualization */}
          <View className="h-32 flex-row items-end justify-between px-1 mb-3">
            {hourlyData.map((item, index) => (
              <View key={index} className="flex-1 items-center justify-end h-full px-1">
                <Text
                  className={`text-[10px] mb-1 font-semibold ${
                    item.isPeak ? 'text-primary font-bold' : 'text-onSurfaceVariant'
                  }`}
                >
                  {item.amount}
                </Text>
                <View
                  style={{ height: `${item.heightPct}%` }}
                  className={`w-full rounded-t-md ${
                    item.isPeak ? 'bg-primary' : 'bg-secondaryContainer'
                  }`}
                />
                <Text
                  className={`text-[10px] mt-1.5 ${
                    item.isPeak ? 'text-primary font-bold' : 'text-onSurfaceVariant'
                  }`}
                >
                  {item.hour}
                </Text>
              </View>
            ))}
          </View>

          {/* Peak Observation Tag */}
          <View className="flex-row items-center justify-between p-2.5 rounded-lg bg-surfaceContainerLow">
            <View className="flex-row items-center gap-1.5 flex-1 mr-2">
              <AppIcon name="local_fire_department" size={18} color={colors.primary} />
              <Text className="text-xs text-onSurface truncate">
                <Text className="font-bold">Peak: 12:00 – 14:00</Text> • Alaba offloading run
              </Text>
            </View>
            <Text className="text-xs font-bold text-primary">₦252k</Text>
          </View>
        </View>

        {/* Business Critical Action Needed Stack */}
        <View className="mb-5">
          <View className="flex-row items-center justify-between mb-2.5">
            <Text className="text-sm font-bold text-onSurface">Action Needed</Text>
            <View className="flex-row items-center gap-1">
              <View className="w-2 h-2 rounded-full bg-error" />
              <Text className="text-xs font-bold text-error">2 Critical</Text>
            </View>
          </View>

          {/* Alert 1: Low-Stock Alerts */}
          <View className="bg-white p-3.5 rounded-xl border border-cardBorder shadow-sm mb-3 relative overflow-hidden">
            <View className="absolute left-0 top-0 bottom-0 w-1 bg-secondary" />
            <View className="flex-row items-start justify-between mb-2">
              <View className="flex-row items-start gap-2">
                <View className="w-8 h-8 rounded-lg bg-secondaryContainer/60 items-center justify-center">
                  <AppIcon name="inventory_2" size={18} color={colors.secondary} />
                </View>
                <View>
                  <Text className="text-sm font-bold text-onSurface">3 Low-Stock Alerts</Text>
                  <Text className="text-xs text-onSurfaceVariant">
                    Reorder threshold reached for staples
                  </Text>
                </View>
              </View>
              <View className="px-2 py-0.5 rounded bg-secondaryContainer">
                <Text className="text-[10px] font-bold text-onSecondaryContainer uppercase">
                  Low
                </Text>
              </View>
            </View>

            <View className="bg-surfaceContainerLow p-2.5 rounded-lg gap-1.5 mb-2.5">
              <View className="flex-row justify-between items-center">
                <Text className="text-xs font-medium text-onSurface">
                  Golden Penny Semovita 10kg
                </Text>
                <Text className="text-xs font-bold text-error">4 bags left</Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-xs font-medium text-onSurface">Dangote Sugar 50kg</Text>
                <Text className="text-xs font-bold text-error">2 bags left</Text>
              </View>
            </View>

            <Pressable
              onPress={() => router.push('/explore-sellers')}
              className="self-end flex-row items-center gap-1 px-3.5 py-1.5 rounded-lg bg-primary active:bg-primaryContainer"
            >
              <AppIcon name="shopping_cart_checkout" size={15} color="#ffffff" />
              <Text className="text-xs font-semibold text-white">Restock Supplier</Text>
            </Pressable>
          </View>

          {/* Alert 2: Overdue Customer Debt */}
          <View className="bg-white p-3.5 rounded-xl border border-cardBorder shadow-sm relative overflow-hidden">
            <View className="absolute left-0 top-0 bottom-0 w-1 bg-error" />
            <View className="flex-row items-start justify-between mb-2">
              <View className="flex-row items-start gap-2">
                <View className="w-8 h-8 rounded-lg bg-errorContainer items-center justify-center">
                  <AppIcon name="notification_important" size={18} color={colors.error} />
                </View>
                <View>
                  <Text className="text-sm font-bold text-onSurface">
                    2 Overdue Debts (&gt;30 Days)
                  </Text>
                  <Text className="text-xs text-onSurfaceVariant">
                    Mama Nkechi Stores • Idumota Block B
                  </Text>
                </View>
              </View>
              <View className="px-2 py-0.5 rounded bg-errorContainer">
                <Text className="text-[10px] font-bold text-onErrorContainer uppercase">
                  Urgent
                </Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between bg-errorContainer/30 p-2.5 rounded-lg">
              <View>
                <Text className="text-base font-bold text-error">₦145,000</Text>
                <Text className="text-[11px] text-onSurfaceVariant">
                  Due 5 days ago • Inv #883
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  Linking.openURL(
                    'https://wa.me/2348034918820?text=Hello%20Mama%20Nkechi,%20friendly%20reminder%20regarding%20your%20settlement%20of%20₦145,000%20with%20Bamidele%20&%20Sons.'
                  );
                }}
                className="flex-row items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-cardBorder shadow-xs active:bg-surfaceContainer"
              >
                <AppIcon name="chat" size={15} color={colors.primary} />
                <Text className="text-xs font-semibold text-primary">Remind WhatsApp</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Recent Shop Activity Feed */}
        <View className="bg-white p-4 rounded-xl border border-cardBorder shadow-sm">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base font-bold text-onSurface">Recent Shop Activity</Text>
            <Pressable onPress={() => router.push('/(tabs)/sales')}>
              <Text className="text-xs font-semibold text-primary">All logs</Text>
            </Pressable>
          </View>

          <View className="gap-3.5">
            {/* Log 1: Cash Sale */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2.5 flex-1 mr-2">
                <View className="w-9 h-9 rounded-full bg-secondaryContainer/70 items-center justify-center">
                  <AppIcon name="check_circle" size={18} color={colors.secondary} />
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="text-xs font-bold text-onSurface truncate">
                    Sale #SP-1094
                  </Text>
                  <Text className="text-[11px] text-onSurfaceVariant truncate">
                    Walk-in Customer • Cash
                  </Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-sm font-bold text-primary">+₦24,500</Text>
                <Text className="text-[10px] text-onSurfaceVariant">12 mins ago</Text>
              </View>
            </View>

            {/* Log 2: Debt Repayment */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2.5 flex-1 mr-2">
                <View className="w-9 h-9 rounded-full bg-surfaceContainerHighest items-center justify-center">
                  <AppIcon name="account_balance" size={18} color={colors.tertiary} />
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="text-xs font-bold text-onSurface truncate">
                    Debt Cleared: Emeka Wholesales
                  </Text>
                  <Text className="text-[11px] text-onSurfaceVariant truncate">
                    Access Bank Transfer verified
                  </Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-sm font-bold text-tertiary">+₦80,000</Text>
                <Text className="text-[10px] text-onSurfaceVariant">45 mins ago</Text>
              </View>
            </View>

            {/* Log 3: Operating Expense */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2.5 flex-1 mr-2">
                <View className="w-9 h-9 rounded-full bg-surfaceContainer items-center justify-center">
                  <AppIcon name="receipt" size={18} color={colors.onSurfaceVariant} />
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="text-xs font-bold text-onSurface truncate">
                    Market Union Levy & Power
                  </Text>
                  <Text className="text-[11px] text-onSurfaceVariant truncate">
                    Cash payment • Ticket #441
                  </Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-sm font-bold text-error">-₦7,500</Text>
                <Text className="text-[10px] text-onSurfaceVariant">2 hrs ago</Text>
              </View>
            </View>

            {/* Log 4: Stock Inwarding */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2.5 flex-1 mr-2">
                <View className="w-9 h-9 rounded-full bg-surfaceContainer items-center justify-center">
                  <AppIcon name="inventory_2" size={18} color={colors.primary} />
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="text-xs font-bold text-onSurface truncate">
                    Stock-in: 50 Cartons Peak Milk
                  </Text>
                  <Text className="text-[11px] text-onSurfaceVariant truncate">
                    Logged by Attendant Tunde
                  </Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-xs font-bold text-onSurface">50 Ctn</Text>
                <Text className="text-[10px] text-onSurfaceVariant">4 hrs ago</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
