import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/app-header';
import { AppIcon } from '@/components/icon';
import { colors } from '@/lib/theme';

export default function ReportsScreen() {
  const router = useRouter();
  const [selectedRange, setSelectedRange] = useState('Month (Oct 2024)');

  const weeklyTrend = [
    { week: 'Wk 1', sales: '₦3.2M', cost: '₦2.7M', salesH: 80, costH: 68 },
    { week: 'Wk 2', sales: '₦3.9M', cost: '₦3.3M', salesH: 90, costH: 76 },
    { week: 'Wk 3', sales: '₦4.4M', cost: '₦3.7M', salesH: 100, costH: 84, isPeak: true },
    { week: 'Wk 4', sales: '₦3.3M', cost: '₦2.8M', salesH: 82, costH: 70 },
  ];

  return (
    <View className="flex-1 bg-surface">
      <AppHeader title="Financial Intelligence" subtitle="Ledger & P&L Hub" showBack />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 }}
      >
        {/* Title & Audit Status */}
        <View className="mb-3">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-xs font-bold text-primary uppercase tracking-wider">
              Ledger & P&L Hub
            </Text>
            <View className="flex-row items-center gap-1 px-2 py-0.5 rounded-full bg-surfaceContainerHigh">
              <AppIcon name="verified" size={13} color={colors.primary} />
              <Text className="text-xs font-semibold text-onSurfaceVariant">Audited v2.4</Text>
            </View>
          </View>
          <Text className="text-2xl font-bold text-onSurface">Financial Intelligence</Text>
          <Text className="text-xs text-onSurfaceVariant mt-0.5">
            Real-time audited sales, true landed margins, running expenses & collection health.
          </Text>
        </View>

        {/* Date Range Filter Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6 }}
          className="mb-4"
        >
          {['Today', 'This Week', 'Month (Oct 2024)', 'Quarter', 'Year (2024)'].map((range) => (
            <Pressable
              key={range}
              onPress={() => setSelectedRange(range)}
              className={`px-3.5 py-1.5 rounded-full active:scale-95 ${
                selectedRange === range
                  ? 'bg-primary'
                  : 'bg-white border border-cardBorder'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  selectedRange === range ? 'text-white' : 'text-onSurfaceVariant'
                }`}
              >
                {range}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Executive 2x2 Financial Pulse Matrix */}
        <View className="flex-row flex-wrap gap-2.5 mb-4">
          {/* Card 1: Gross Sales */}
          <View className="flex-1 min-w-[150px] bg-white rounded-xl p-3.5 border border-cardBorder shadow-sm justify-between">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-onSurfaceVariant">Gross Sales</Text>
              <AppIcon name="payments" size={16} color={colors.primary} />
            </View>
            <View className="mt-2">
              <Text className="text-xl font-bold text-onSurface">₦14,820,000</Text>
              <View className="self-start mt-1 flex-row items-center gap-0.5 px-1.5 py-0.2 rounded bg-secondaryContainer">
                <AppIcon name="trending_up" size={11} color={colors.onSecondaryContainer} />
                <Text className="text-[10px] font-bold text-onSecondaryContainer">
                  +18.4% vs Sep
                </Text>
              </View>
            </View>
          </View>

          {/* Card 2: Landed Profit */}
          <View className="flex-1 min-w-[150px] bg-white rounded-xl p-3.5 border border-cardBorder shadow-sm justify-between">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-onSurfaceVariant">Landed Profit</Text>
              <AppIcon name="account_balance_wallet" size={16} color={colors.tertiary} />
            </View>
            <View className="mt-2">
              <Text className="text-xl font-bold text-onSurface">₦2,145,000</Text>
              <Text className="text-[11px] text-onSurfaceVariant mt-1">
                14.5% margin (184 SKUs)
              </Text>
            </View>
          </View>

          {/* Card 3: Shop Overhead */}
          <View className="flex-1 min-w-[150px] bg-white rounded-xl p-3.5 border border-cardBorder shadow-sm justify-between">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-onSurfaceVariant">Shop Overhead</Text>
              <AppIcon name="local_gas_station" size={16} color={colors.error} />
            </View>
            <View className="mt-2">
              <Text className="text-xl font-bold text-onSurface">₦412,000</Text>
              <Text className="text-[11px] text-error font-medium mt-1">
                Diesel, boys & union
              </Text>
            </View>
          </View>

          {/* Card 4: Net Take-Home (Hero Green) */}
          <View className="flex-1 min-w-[150px] bg-primary rounded-xl p-3.5 shadow-sm justify-between">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-white/80">Net Take-Home</Text>
              <AppIcon name="savings" size={16} color="#ffffff" />
            </View>
            <View className="mt-2">
              <Text className="text-xl font-bold text-white">₦1,733,000</Text>
              <Text className="text-[11px] text-white/90 mt-1">Real cash realized</Text>
            </View>
          </View>
        </View>

        {/* Weekly Revenue vs COGS Visualizer */}
        <View className="bg-white rounded-xl p-4 border border-cardBorder shadow-sm mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="text-sm font-bold text-onSurface">Sales & Landed Cost Trend</Text>
              <Text className="text-xs text-onSurfaceVariant">
                Weekly October velocity in Idumota warehouse
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <View className="flex-row items-center gap-1">
                <View className="w-2.5 h-2.5 rounded-full bg-primary" />
                <Text className="text-[11px] text-onSurfaceVariant">Sales</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <View className="w-2.5 h-2.5 rounded-full bg-surfaceContainerHighest" />
                <Text className="text-[11px] text-onSurfaceVariant">Cost</Text>
              </View>
            </View>
          </View>

          {/* Bar Chart Bars */}
          <View className="h-40 flex-row items-end justify-between px-2 pt-4 pb-2 border-b border-cardBorder">
            {weeklyTrend.map((item, idx) => (
              <View key={idx} className="flex-1 items-center justify-end h-full">
                <Text
                  className={`text-[10px] mb-1 font-bold ${
                    item.isPeak ? 'text-primary' : 'text-onSurfaceVariant'
                  }`}
                >
                  {item.sales}
                </Text>
                <View className="flex-row items-end gap-1 h-28">
                  <View
                    style={{ height: `${item.salesH}%` }}
                    className="w-3.5 rounded-t bg-primary"
                  />
                  <View
                    style={{ height: `${item.costH}%` }}
                    className="w-3.5 rounded-t bg-surfaceContainerHighest"
                  />
                </View>
                <Text
                  className={`text-xs mt-2 ${
                    item.isPeak ? 'font-bold text-primary' : 'text-onSurfaceVariant'
                  }`}
                >
                  {item.week}
                </Text>
              </View>
            ))}
          </View>

          {/* Efficiency Summary */}
          <View className="flex-row items-center justify-between pt-3">
            <Text className="text-xs text-onSurfaceVariant">Operating Gross Margin:</Text>
            <Text className="text-xs font-bold text-primary">14.5% Average</Text>
          </View>
        </View>

        {/* Collection & Debt Aging Health */}
        <View className="bg-white rounded-xl p-4 border border-cardBorder shadow-sm mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm font-bold text-onSurface">Receivables Aging Health</Text>
            <Pressable onPress={() => router.push('/(tabs)/customers')}>
              <Text className="text-xs font-semibold text-primary">View Ledger</Text>
            </Pressable>
          </View>

          <View className="gap-2.5">
            <View>
              <View className="flex-row justify-between text-xs mb-1">
                <Text className="text-xs text-onSurfaceVariant">Current / On Time (0 - 14 days)</Text>
                <Text className="text-xs font-bold text-primary">₦275,000 (43%)</Text>
              </View>
              <View className="h-2 w-full bg-surfaceContainerLow rounded-full overflow-hidden">
                <View style={{ width: '43%' }} className="h-full bg-primary" />
              </View>
            </View>

            <View>
              <View className="flex-row justify-between text-xs mb-1">
                <Text className="text-xs text-onSurfaceVariant">Due Soon (15 - 30 days)</Text>
                <Text className="text-xs font-bold text-tertiary">₦80,000 (12.5%)</Text>
              </View>
              <View className="h-2 w-full bg-surfaceContainerLow rounded-full overflow-hidden">
                <View style={{ width: '12.5%' }} className="h-full bg-tertiary" />
              </View>
            </View>

            <View>
              <View className="flex-row justify-between text-xs mb-1">
                <Text className="text-xs text-onSurfaceVariant">Critical Overdue (&gt; 30 days)</Text>
                <Text className="text-xs font-bold text-error">₦285,000 (44.5%)</Text>
              </View>
              <View className="h-2 w-full bg-surfaceContainerLow rounded-full overflow-hidden">
                <View style={{ width: '44.5%' }} className="h-full bg-error" />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
