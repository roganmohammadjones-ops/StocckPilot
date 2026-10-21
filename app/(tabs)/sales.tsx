import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  Modal,
  Linking,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { AppHeader } from '@/components/app-header';
import { AppIcon } from '@/components/icon';
import { colors } from '@/lib/theme';
import { useDataRefresh } from '@/lib/db/provider';
import { getSales, getDashboardMetrics } from '@/lib/db/queries';
import type { SaleRecord, DashboardMetrics } from '@/lib/db/types';

export default function SalesRegisterScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { dataVersion } = useDataRefresh();

  const [selectedRange, setSelectedRange] = useState<'today' | 'yesterday' | 'week'>('today');
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<SaleRecord | null>(null);

  const loadSalesData = useCallback(async () => {
    try {
      const [salesList, dashMetrics] = await Promise.all([
        getSales(db, 30),
        getDashboardMetrics(db),
      ]);
      setSales(salesList);
      setMetrics(dashMetrics);
    } catch (e) {
      console.error('Failed to load sales register', e);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      loadSalesData();
    }, [loadSalesData])
  );

  useEffect(() => {
    loadSalesData();
  }, [loadSalesData, dataVersion]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSalesData();
    setRefreshing(false);
  };

  const todayTotal = metrics?.todaySales ?? 0;
  const cashTotal = metrics?.cashCollected ?? 0;
  const transferTotal = metrics?.transferCollected ?? 0;
  const creditTotal = metrics?.creditOutstanding ?? 0;
  const totalChannels = cashTotal + transferTotal + creditTotal || 1;
  const cashPct = Math.round((cashTotal / totalChannels) * 100);
  const transferPct = Math.round((transferTotal / totalChannels) * 100);
  const creditPct = Math.max(0, 100 - cashPct - transferPct);

  const handleShareReceiptWhatsApp = (tx: SaleRecord) => {
    const text = `*BAMIDELE & SONS PROVISIONS*%0A` +
      `Idumota Market, Block B, Lagos%0A` +
      `--------------------------------%0A` +
      `*Receipt:* #${tx.invoiceNo}%0A` +
      `*Customer:* ${tx.customerName || 'Walk-in Customer'}%0A` +
      `*Payment:* ${tx.paymentChannel.toUpperCase()}%0A` +
      `*Items:* ${tx.itemsSummary || `${tx.itemCount} items`}%0A` +
      `--------------------------------%0A` +
      `*TOTAL PAID:* ₦${tx.netPayable.toLocaleString()}%0A` +
      (tx.amountTendered ? `*Tendered:* ₦${tx.amountTendered.toLocaleString()}%0A` : '') +
      (tx.changeReturned ? `*Change:* ₦${tx.changeReturned.toLocaleString()}%0A` : '') +
      `--------------------------------%0A` +
      `_Thank you for your business!_`;

    Linking.openURL(`https://wa.me/?text=${text}`);
  };

  return (
    <View className="flex-1 bg-surface">
      <AppHeader />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
                  +{metrics?.salesGrowthPct ?? 14.8}% vs Yest.
                </Text>
              </View>
            </View>
            <Text className="text-3xl font-bold text-onSurface tracking-tight">
              ₦{todayTotal.toLocaleString()}<Text className="text-sm font-normal text-onSurfaceVariant">.00</Text>
            </Text>
            <View className="flex-row items-center justify-between pt-2 border-t border-cardBorder mt-2">
              <View className="flex-row items-center gap-1">
                <AppIcon name="shopping_bag" size={15} color={colors.primary} />
                <Text className="text-xs text-onSurface">
                  <Text className="font-bold">{sales.length}</Text> Completed Sales
                </Text>
              </View>
              <View className="flex-row items-center gap-1">
                <AppIcon name="payments" size={15} color={colors.secondary} />
                <Text className="text-xs text-onSurface">
                  Est. Margin: <Text className="font-bold text-primary">₦{Math.round(todayTotal * 0.18).toLocaleString()}</Text>
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
                <Text className="text-[10px] font-bold text-white uppercase">POS</Text>
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

          {/* Quick Expense Outflow Link */}
          <Pressable
            onPress={() => router.push('/modal/record-expense')}
            className="bg-surfaceContainerHigh/60 rounded-xl p-3 flex-row items-center justify-between active:opacity-80"
          >
            <View className="flex-row items-center gap-2.5 flex-1 mr-2">
              <View className="w-9 h-9 rounded-lg bg-secondaryContainer items-center justify-center">
                <AppIcon name="wallet" size={18} color={colors.onSecondaryContainer} />
              </View>
              <View className="flex-1 min-w-0">
                <Text className="text-xs font-bold text-onSurface truncate">
                  Record Store Expense Outflow
                </Text>
                <Text className="text-[11px] text-onSurfaceVariant truncate">
                  Deduct diesel, generator, market levy & attendant wages
                </Text>
              </View>
            </View>
            <AppIcon name="arrow_forward" size={16} color={colors.primary} />
          </Pressable>
        </View>

        {/* 3. Multi-Channel Payment Distribution Panel */}
        <View className="bg-white rounded-xl p-4 border border-cardBorder shadow-sm mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-1.5">
              <AppIcon name="account_balance_wallet" size={18} color={colors.onSurface} />
              <Text className="text-sm font-bold text-onSurface">Payment Inflows</Text>
            </View>
            <Text className="text-xs text-onSurfaceVariant">Channel Breakdown</Text>
          </View>

          {/* Proportional Progress Bar */}
          <View className="h-2.5 w-full bg-surfaceContainer rounded-full overflow-hidden flex-row mb-3">
            <View style={{ width: `${cashPct}%` }} className="h-full bg-secondary" />
            <View style={{ width: `${transferPct}%` }} className="h-full bg-tertiary" />
            <View style={{ width: `${creditPct}%` }} className="h-full bg-error" />
          </View>

          {/* 3 Channels */}
          <View className="flex-row gap-2">
            <View className="flex-1 bg-surfaceContainerLow rounded-lg p-2">
              <View className="flex-row items-center gap-1">
                <View className="w-2 h-2 rounded-full bg-secondary" />
                <Text className="text-[11px] font-semibold text-secondary">Cash ({cashPct}%)</Text>
              </View>
              <Text className="text-sm font-bold text-onSurface mt-1">₦{cashTotal.toLocaleString()}</Text>
            </View>
            <View className="flex-1 bg-surfaceContainerLow rounded-lg p-2">
              <View className="flex-row items-center gap-1">
                <View className="w-2 h-2 rounded-full bg-tertiary" />
                <Text className="text-[11px] font-semibold text-tertiary">Transfer ({transferPct}%)</Text>
              </View>
              <Text className="text-sm font-bold text-onSurface mt-1">₦{transferTotal.toLocaleString()}</Text>
            </View>
            <View className="flex-1 bg-surfaceContainerLow rounded-lg p-2">
              <View className="flex-row items-center gap-1">
                <View className="w-2 h-2 rounded-full bg-error" />
                <Text className="text-[11px] font-semibold text-error">Credit ({creditPct}%)</Text>
              </View>
              <Text className="text-sm font-bold text-onSurface mt-1">₦{creditTotal.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* 4. Recent Sales Register List */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-2.5">
            <View className="flex-row items-center gap-1.5">
              <Text className="text-base font-bold text-onSurface">Recent Sales Register</Text>
              <View className="px-2 py-0.5 rounded-full bg-surfaceContainer">
                <Text className="text-[10px] font-bold text-onSurfaceVariant">{sales.length} Total</Text>
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
            {sales.map((tx) => (
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
                          {tx.customerName || 'Walk-in Cash Customer'}
                        </Text>
                        <View
                          className={`px-1.5 py-0.2 rounded-full ${
                            tx.paymentChannel === 'credit'
                              ? 'bg-errorContainer'
                              : 'bg-secondaryContainer'
                          }`}
                        >
                          <Text
                            className={`text-[10px] font-bold ${
                              tx.paymentChannel === 'credit'
                                ? 'text-onErrorContainer'
                                : 'text-onSecondaryContainer'
                            }`}
                          >
                            {tx.paymentChannel === 'credit' ? 'Credit (IOU)' : 'Completed'}
                          </Text>
                        </View>
                      </View>
                      <View className="flex-row items-center gap-1 mt-0.5">
                        <Text className="text-xs font-bold text-primary">#{tx.invoiceNo}</Text>
                        <Text className="text-xs text-outline">•</Text>
                        <Text className="text-xs text-onSurfaceVariant">
                          {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className="text-base font-bold text-onSurface">₦{tx.netPayable.toLocaleString()}</Text>
                    <Text className="text-[11px] text-onSurfaceVariant capitalize">{tx.paymentChannel}</Text>
                  </View>
                </View>

                <View className="pt-2 border-t border-dashed border-cardBorder flex-row items-center justify-between">
                  <Text className="text-xs text-onSurfaceVariant">
                    {tx.itemsSummary || `${tx.itemCount} items`}
                  </Text>
                  <Pressable
                    onPress={() => setSelectedReceipt(tx)}
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

      {/* Digital Receipt Modal */}
      <Modal
        visible={Boolean(selectedReceipt)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedReceipt(null)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-5 border-t border-cardBorder max-h-[90%]">
            <View className="w-12 h-1 bg-outlineVariant rounded-full self-center mb-3" />

            {/* Header */}
            <View className="items-center pb-3 border-b border-dashed border-cardBorder mb-4">
              <Text className="text-lg font-bold text-onSurface">Bamidele & Sons Provisions</Text>
              <Text className="text-xs text-onSurfaceVariant">Idumota Market Block B, Lagos</Text>
              <Text className="text-xs font-mono text-primary font-bold mt-1">
                Invoice #{selectedReceipt?.invoiceNo}
              </Text>
              <Text className="text-[11px] text-onSurfaceVariant">
                {selectedReceipt ? new Date(selectedReceipt.createdAt).toLocaleString() : ''}
              </Text>
            </View>

            {/* Customer & Payment Meta */}
            <View className="bg-surfaceContainerLow p-3 rounded-xl mb-4 gap-1.5">
              <View className="flex-row justify-between">
                <Text className="text-xs text-onSurfaceVariant">Customer:</Text>
                <Text className="text-xs font-bold text-onSurface">
                  {selectedReceipt?.customerName}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-xs text-onSurfaceVariant">Channel:</Text>
                <Text className="text-xs font-bold text-primary uppercase">
                  {selectedReceipt?.paymentChannel}
                </Text>
              </View>
              {selectedReceipt?.amountTendered ? (
                <View className="flex-row justify-between">
                  <Text className="text-xs text-onSurfaceVariant">Tendered:</Text>
                  <Text className="text-xs font-medium text-onSurface">
                    ₦{selectedReceipt.amountTendered.toLocaleString()}
                  </Text>
                </View>
              ) : null}
              {selectedReceipt?.changeReturned ? (
                <View className="flex-row justify-between">
                  <Text className="text-xs text-onSurfaceVariant">Change Returned:</Text>
                  <Text className="text-xs font-medium text-secondary">
                    ₦{selectedReceipt.changeReturned.toLocaleString()}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Items Summary */}
            <View className="mb-4">
              <Text className="text-xs font-semibold text-onSurfaceVariant mb-2">
                Purchased Line Items
              </Text>
              <View className="bg-surfaceContainerLow p-3 rounded-xl">
                <Text className="text-xs text-onSurface font-medium">
                  {selectedReceipt?.itemsSummary || `${selectedReceipt?.itemCount} line items`}
                </Text>
              </View>
            </View>

            {/* Total Readout */}
            <View className="flex-row items-center justify-between p-3.5 bg-primary/10 rounded-xl mb-5">
              <Text className="text-sm font-bold text-primary">Total Paid</Text>
              <Text className="text-2xl font-bold text-primary">
                ₦{selectedReceipt?.netPayable.toLocaleString()}
              </Text>
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => {
                  if (selectedReceipt) handleShareReceiptWhatsApp(selectedReceipt);
                }}
                className="flex-1 h-12 bg-secondaryContainer rounded-xl flex-row items-center justify-center gap-1.5 active:opacity-90 shadow-xs"
              >
                <AppIcon name="chat" size={18} color={colors.onSecondaryContainer} />
                <Text className="text-xs font-bold text-onSecondaryContainer">
                  WhatsApp Slip
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  Alert.alert(
                    'Thermal Printer',
                    `Sending #${selectedReceipt?.invoiceNo} to Moniepoint Bluetooth POS printer...`,
                    [{ text: 'OK' }]
                  );
                }}
                className="flex-1 h-12 bg-surfaceContainer rounded-xl flex-row items-center justify-center gap-1.5 active:bg-surfaceContainerHigh"
              >
                <AppIcon name="print" size={18} color={colors.onSurfaceVariant} />
                <Text className="text-xs font-bold text-onSurfaceVariant">
                  Print ESC/POS
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setSelectedReceipt(null)}
                className="w-12 h-12 rounded-xl bg-surfaceContainerLow items-center justify-center"
              >
                <AppIcon name="close" size={20} color={colors.onSurfaceVariant} />
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
