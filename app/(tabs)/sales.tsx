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
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { AppHeader } from '@/components/app-header';
import { AppIcon } from '@/components/icon';
import { colors } from '@/lib/theme';
import { useDataRefresh, useAppDb } from '@/lib/db/provider';
import { useStoreProfile } from '@/lib/store-profile';
import {
  getSales,
  getDashboardMetrics,
  getCurrentShift,
  closeShift,
  openNewShift,
  getSaleItems,
  getWaybills,
} from '@/lib/db/queries';
import { useResponsive } from '@/hooks/use-responsive';
import type { SaleRecord, DashboardMetrics, ShiftRecord, WaybillRecord } from '@/lib/db/types';
import { printReceipt, shareReceiptPdf } from '@/lib/receipt';
import { WaybillModal } from '@/components/waybill-modal';

function formatShiftTime(isoString?: string): string {
  if (!isoString) return 'Just now';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return isoString;
  }
}

export default function SalesRegisterScreen() {
  const router = useRouter();
  const db = useAppDb();
  const { dataVersion } = useDataRefresh();
  const store = useStoreProfile();
  const { isWide, horizontalPadding } = useResponsive();

  const [selectedRange, setSelectedRange] = useState<'today' | 'yesterday' | 'week'>('today');
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [currentShift, setCurrentShift] = useState<ShiftRecord | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<SaleRecord | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [waybillsMap, setWaybillsMap] = useState<Record<string, WaybillRecord>>({});
  const [activeWaybillSale, setActiveWaybillSale] = useState<SaleRecord | null>(null);

  // Shift Closeout & Drawer Reconciliation
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [countedCashInput, setCountedCashInput] = useState('');
  const [nextCashierInput, setNextCashierInput] = useState('');
  const [shiftNotes, setShiftNotes] = useState('');
  const [isReconciling, setIsReconciling] = useState(false);

  const loadSalesData = useCallback(async () => {
    try {
      const [salesList, dashMetrics, activeShift, waybillsList] = await Promise.all([
        getSales(db, 30),
        getDashboardMetrics(db),
        getCurrentShift(db),
        getWaybills(db, 100),
      ]);
      setSales(salesList);
      setMetrics(dashMetrics);
      setCurrentShift(activeShift);
      const wbMap: Record<string, WaybillRecord> = {};
      for (const wb of waybillsList) {
        wbMap[wb.saleId] = wb;
      }
      setWaybillsMap(wbMap);
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

  const expectedCash = currentShift?.expectedCash ?? 0;
  const countedCash = parseFloat(countedCashInput.replace(/,/g, '')) || 0;
  const discrepancy = countedCash - expectedCash;

  const addCashIncrement = (amount: number) => {
    const current = parseFloat(countedCashInput.replace(/,/g, '')) || 0;
    setCountedCashInput((current + amount).toString());
  };

  const handleOpenShiftModal = () => {
    if (currentShift) {
      setCountedCashInput(currentShift.expectedCash > 0 ? currentShift.expectedCash.toString() : '');
      setNextCashierInput(currentShift.cashierName);
      setShiftNotes('');
      setShowShiftModal(true);
    }
  };

  const handleReconcileShift = async () => {
    if (!currentShift) return;
    setIsReconciling(true);
    try {
      await closeShift(
        db,
        currentShift.id,
        countedCash,
        expectedCash,
        shiftNotes.trim()
      );

      const nextCashier = nextCashierInput.trim() || currentShift.cashierName;
      const newShift = await openNewShift(db, nextCashier);
      setCurrentShift(newShift);
      setShowShiftModal(false);

      await loadSalesData();

      Alert.alert(
        'Shift Closed & Drawer Reconciled',
        `Till Shift Summary:\n• Cashier: ${currentShift.cashierName}\n• Expected Cash: ₦${expectedCash.toLocaleString()}\n• Counted Cash: ₦${countedCash.toLocaleString()}\n• Discrepancy: ${discrepancy >= 0 ? '+' : ''}₦${discrepancy.toLocaleString()}\n\nNext shift active for ${nextCashier}.`
      );
    } catch (e: any) {
      Alert.alert('Reconciliation Error', e?.message || 'Failed to close shift.');
    } finally {
      setIsReconciling(false);
    }
  };

  const handleShareReceiptWhatsApp = (tx: SaleRecord) => {
    const text = `*${store.businessName.toUpperCase()}*%0A` +
      `${store.marketLocation}${store.marketStall ? `, ${store.marketStall}` : ''}%0A` +
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

  const handlePrintReceipt = async (tx: SaleRecord) => {
    try {
      setIsPrinting(true);
      const items = await getSaleItems(db, tx.id);
      await printReceipt(tx, items);
    } catch (e: any) {
      Alert.alert('Printing Error', e?.message || 'Could not send document to printer.');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleShareReceiptPdf = async (tx: SaleRecord) => {
    try {
      setIsPrinting(true);
      const items = await getSaleItems(db, tx.id);
      await shareReceiptPdf(tx, items);
    } catch (e: any) {
      Alert.alert('PDF Export Error', e?.message || 'Could not generate PDF receipt.');
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <View className="flex-1 bg-surface">
      <AppHeader />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: horizontalPadding,
          paddingTop: isWide ? 20 : 14,
          paddingBottom: 80,
        }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="w-full max-w-7xl mx-auto">
          {/* Responsive 2-column layout on wide screens, stacked on phones */}
          <View className={isWide ? 'flex-row gap-5 items-start' : ''}>
            {/* Left Column on Tablet/Desktop: Register Pulse & Inflows & CTA Dock */}
            <View className={isWide ? 'w-[400px] lg:w-[440px]' : 'w-full'}>
              {/* 1. Daily Sales Summary Banner */}
              <View className="bg-white rounded-xl p-4 border border-cardBorder shadow-sm mb-4">
          <View className="flex-row items-center justify-between gap-2 mb-3">
            <View className="flex-row items-center gap-1.5 shrink min-w-0">
              <AppIcon name="analytics" size={19} color={colors.primary} />
              <Text numberOfLines={1} className="text-base font-bold text-onSurface truncate">
                Daily Register Pulse
              </Text>
            </View>
            <Pressable
              onPress={handleOpenShiftModal}
              accessibilityRole="button"
              accessibilityLabel={`Current shift: ${currentShift?.cashierName || 'Attendant'}. Tap to reconcile shift.`}
              className="flex-row items-center gap-1 px-2.5 py-1 rounded-full bg-secondaryContainer/80 border border-secondary active:opacity-70 shrink min-w-0 max-w-[50%]"
            >
              <View className="w-2 h-2 rounded-full bg-primary shrink-0" />
              <AppIcon name="lock_clock" size={13} color={colors.onSecondaryContainer} />
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                className="text-xs font-bold text-onSecondaryContainer shrink truncate"
              >
                {isWide
                  ? currentShift?.cashierName
                    ? `${currentShift.cashierName} • Shift Open`
                    : 'Shift Open'
                  : currentShift?.cashierName
                  ? `${currentShift.cashierName.replace('Attendant ', '')} • Open`
                  : 'Shift Open'}
              </Text>
              <AppIcon name="expand_more" size={14} color={colors.onSecondaryContainer} />
            </Pressable>
          </View>

          {/* Metric Readout */}
          <View className="bg-surfaceContainerLow rounded-xl p-3.5 mb-3">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-xs text-onSurfaceVariant">{"Today's Total Sales"}</Text>
              {todayTotal > 0 ? (
                <View className="flex-row items-center gap-0.5 px-2 py-0.5 rounded-full bg-secondaryContainer">
                  <AppIcon name="trending_up" size={12} color={colors.onSecondaryContainer} />
                  <Text className="text-[11px] font-bold text-onSecondaryContainer">
                    +{metrics?.salesGrowthPct ?? 0}% vs Yest.
                  </Text>
                </View>
              ) : (
                <View className="px-2 py-0.5 rounded-full bg-surfaceContainer">
                  <Text className="text-[10px] font-medium text-onSurfaceVariant">No sales today</Text>
                </View>
              )}
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
            className="bg-surfaceContainerHigh/60 rounded-xl p-3 flex-row items-center justify-between active:opacity-80 mb-2"
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

          {/* End-of-Day Shift Closeout & Drawer Reconciliation Link */}
          <Pressable
            onPress={handleOpenShiftModal}
            className="bg-secondaryContainer/40 border border-secondary/30 rounded-xl p-3 flex-row items-center justify-between active:opacity-80"
          >
            <View className="flex-row items-center gap-2.5 flex-1 mr-2">
              <View className="w-9 h-9 rounded-lg bg-secondaryContainer items-center justify-center">
                <AppIcon name="lock_clock" size={18} color={colors.onSecondaryContainer} />
              </View>
              <View className="flex-1 min-w-0">
                <Text className="text-xs font-bold text-onSurface truncate">
                  End-of-Day Shift Closeout & Cash Drawer
                </Text>
                <Text className="text-[11px] text-onSurfaceVariant truncate">
                  Count drawer cash, balance overage/shortage & handover
                </Text>
              </View>
            </View>
            <View className="px-2 py-0.5 rounded bg-secondaryContainer">
              <Text className="text-[10px] font-bold text-onSecondaryContainer uppercase">
                Reconcile
              </Text>
            </View>
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
      </View>

      {/* Right Column on Tablet/Desktop: Recent Sales Register List */}
      <View className={isWide ? 'flex-1 min-w-0' : 'w-full'}>
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

          {sales.length === 0 ? (
            <View className="bg-white rounded-xl p-8 items-center justify-center border border-cardBorder text-center">
              <View className="w-14 h-14 rounded-full bg-secondaryContainer/50 items-center justify-center mb-3">
                <AppIcon name="point_of_sale" size={28} color={colors.primary} />
              </View>
              <Text className="text-base font-bold text-onSurface mb-1">No sales recorded yet</Text>
              <Text className="text-xs text-onSurfaceVariant text-center mb-4 max-w-xs">
                Open the till to record your first transaction, accept payment, and issue a digital WhatsApp receipt.
              </Text>
              <Pressable
                onPress={() => router.push('/modal/new-sale')}
                className="px-4 py-2.5 rounded-xl bg-primary flex-row items-center gap-2"
              >
                <AppIcon name="add" size={16} color="#ffffff" />
                <Text className="text-xs font-bold text-white">Open Till & Record Sale</Text>
              </Pressable>
            </View>
          ) : (
            <View className="gap-3">
              {sales.map((tx) => (
                <View
                  key={tx.id}
                  className="bg-white rounded-xl p-3.5 border border-cardBorder shadow-sm"
                >
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-row items-center gap-2.5 flex-1 mr-2 min-w-0">
                      <View className="w-10 h-10 rounded-lg bg-surfaceContainer items-center justify-center shrink-0">
                        <AppIcon name="person" size={20} color={colors.onSurfaceVariant} />
                      </View>
                      <View className="flex-1 min-w-0">
                        <View className="flex-row items-center gap-1.5 flex-wrap">
                          <Text numberOfLines={1} className="text-sm font-bold text-onSurface shrink truncate">
                            {tx.customerName || 'Walk-in Cash Customer'}
                          </Text>
                          <View
                            className={`px-1.5 py-0.2 rounded-full shrink-0 ${
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

                {waybillsMap[tx.id] ? (
                  <Pressable
                    onPress={() => setActiveWaybillSale(tx)}
                    className="mt-2 pt-1.5 border-t border-cardBorder/60 flex-row items-center justify-between"
                  >
                    <View className="flex-row items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200">
                      <AppIcon name="local_shipping" size={12} color="#0369a1" />
                      <Text className="text-[10px] font-bold text-blue-800">
                        WB #{waybillsMap[tx.id].waybillNo} • {waybillsMap[tx.id].destinationCity}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-0.5">
                      <Text className="text-[11px] font-bold capitalize text-primary">
                        {waybillsMap[tx.id].status.replace('_', ' ')}
                      </Text>
                      <AppIcon name="chevron_right" size={12} color={colors.primary} />
                    </View>
                  </Pressable>
                ) : null}
              </View>
            ))}
          </View>
          )}
          </View>
        </View>
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
    <View className={`flex-1 bg-black/50 ${isWide ? 'justify-center items-center p-4' : 'justify-end'}`}>
      <View className={`bg-white ${isWide ? 'rounded-3xl max-w-lg w-full p-6 shadow-2xl' : 'rounded-t-3xl p-5 border-t border-cardBorder max-h-[90%]'}`}>
        <View className="w-12 h-1 bg-outlineVariant rounded-full self-center mb-3" />

            {/* Header */}
            <View className="items-center pb-3 border-b border-dashed border-cardBorder mb-4">
              <Text className="text-lg font-bold text-onSurface">{store.businessName}</Text>
              <Text className="text-xs text-onSurfaceVariant">{store.marketLocation}</Text>
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
            <View className="gap-2">
              <View className="flex-row gap-2">
                <Pressable
                  disabled={isPrinting}
                  onPress={() => {
                    if (selectedReceipt) handlePrintReceipt(selectedReceipt);
                  }}
                  className="flex-1 h-12 bg-primary rounded-xl flex-row items-center justify-center gap-1.5 active:bg-primaryContainer shadow-sm"
                >
                  {isPrinting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <AppIcon name="print" size={18} color="#ffffff" />
                      <Text className="text-xs font-bold text-white">
                        Print Thermal
                      </Text>
                    </>
                  )}
                </Pressable>

                <Pressable
                  disabled={isPrinting}
                  onPress={() => {
                    if (selectedReceipt) handleShareReceiptPdf(selectedReceipt);
                  }}
                  className="flex-1 h-12 bg-surfaceContainer rounded-xl flex-row items-center justify-center gap-1.5 active:bg-surfaceContainerHigh"
                >
                  <AppIcon name="picture_as_pdf" size={18} color={colors.onSurface} />
                  <Text className="text-xs font-bold text-onSurface">
                    Share PDF
                  </Text>
                </Pressable>
              </View>

              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => {
                    if (selectedReceipt) handleShareReceiptWhatsApp(selectedReceipt);
                  }}
                  className="flex-1 h-11 bg-secondaryContainer rounded-xl flex-row items-center justify-center gap-1.5 active:opacity-90 shadow-xs"
                >
                  <AppIcon name="chat" size={18} color={colors.onSecondaryContainer} />
                  <Text className="text-xs font-bold text-onSecondaryContainer">
                    WhatsApp Slip
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setSelectedReceipt(null)}
                  className="w-11 h-11 rounded-xl bg-surfaceContainerLow items-center justify-center active:bg-surfaceContainer"
                >
                  <AppIcon name="close" size={20} color={colors.onSurfaceVariant} />
                </Pressable>
              </View>

              {selectedReceipt ? (
                <Pressable
                  onPress={() => {
                    const saleToDispatch = selectedReceipt;
                    setSelectedReceipt(null);
                    setActiveWaybillSale(saleToDispatch);
                  }}
                  className="w-full h-11 bg-primary/10 border border-primary/30 rounded-xl flex-row items-center justify-center gap-1.5 active:bg-primary/20 shadow-xs mt-1"
                >
                  <AppIcon name="local_shipping" size={17} color={colors.primary} />
                  <Text className="text-xs font-bold text-primary">
                    {waybillsMap[selectedReceipt.id]
                      ? `View Waybill Manifest (#${waybillsMap[selectedReceipt.id].waybillNo})`
                      : 'Issue Interstate Waybill / Dispatch Manifest'}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>
      </Modal>

      {/* 4. End-of-Day Shift Closeout Modal */}
      <Modal
        visible={showShiftModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowShiftModal(false)}
      >
        <View className={`flex-1 bg-black/60 ${isWide ? 'justify-center items-center p-4' : 'justify-end'}`}>
          <View className={`bg-white ${isWide ? 'rounded-3xl max-w-lg w-full p-6 shadow-2xl max-h-[85%]' : 'rounded-t-3xl max-h-[90%] p-5 border-t border-cardBorder shadow-2xl'}`}>
            {/* Modal Header */}
            <View className="flex-row items-center justify-between pb-3 border-b border-cardBorder mb-4">
              <View>
                <Text className="text-base font-bold text-onSurface">Till Shift Closeout</Text>
                <Text className="text-xs text-onSurfaceVariant">
                  {currentShift?.cashierName || 'Attendant'} • Opened {formatShiftTime(currentShift?.openedAt)}
                </Text>
              </View>
              <Pressable
                onPress={() => setShowShiftModal(false)}
                className="w-8 h-8 rounded-full bg-surfaceContainerLow items-center justify-center"
              >
                <AppIcon name="close" size={18} color={colors.onSurfaceVariant} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Expected Drawer Cash */}
              <View className="bg-surfaceContainerLow p-4 rounded-2xl mb-4 border border-cardBorder">
                <Text className="text-xs font-semibold text-onSurfaceVariant mb-1">
                  Expected Cash in Drawer
                </Text>
                <Text className="text-2xl font-bold text-onSurface">
                  ₦{expectedCash.toLocaleString()}
                  <Text className="text-sm font-normal text-onSurfaceVariant">.00</Text>
                </Text>
                <Text className="text-[11px] text-outline mt-1">
                  System balance calculated from total cash sales minus shop cash expenses.
                </Text>
              </View>

              {/* Physical Count Input */}
              <View className="mb-4">
                <Text className="text-xs font-bold text-onSurface mb-1.5">
                  Counted Physical Cash (₦)
                </Text>
                <TextInput
                  value={countedCashInput}
                  onChangeText={setCountedCashInput}
                  keyboardType="numeric"
                  placeholder="Enter counted cash in till"
                  placeholderTextColor={colors.onSurfaceVariant}
                  className="w-full h-12 bg-surfaceContainerLow border border-cardBorder rounded-xl px-4 text-base font-bold text-onSurface"
                />

                {/* Quick Denomination Chips */}
                <View className="flex-row flex-wrap gap-1.5 mt-2.5">
                  {[10000, 5000, 1000, 500].map((amt) => (
                    <Pressable
                      key={amt}
                      onPress={() => addCashIncrement(amt)}
                      className="px-2.5 py-1 bg-surfaceContainer rounded-lg border border-cardBorder active:bg-secondaryContainer"
                    >
                      <Text className="text-xs font-semibold text-onSurface">
                        +₦{amt.toLocaleString()}
                      </Text>
                    </Pressable>
                  ))}
                  <Pressable
                    onPress={() => setCountedCashInput(expectedCash.toString())}
                    className="px-2.5 py-1 bg-primary/10 rounded-lg active:bg-primary/20"
                  >
                    <Text className="text-xs font-bold text-primary">Match Expected</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setCountedCashInput('0')}
                    className="px-2.5 py-1 bg-surfaceContainerHigh rounded-lg"
                  >
                    <Text className="text-xs font-semibold text-onSurfaceVariant">Clear</Text>
                  </Pressable>
                </View>
              </View>

              {/* Discrepancy Status Banner */}
              <View
                className={`p-3.5 rounded-xl mb-4 border ${
                  discrepancy === 0
                    ? 'bg-secondaryContainer/50 border-secondary'
                    : discrepancy > 0
                    ? 'bg-primary/10 border-primary'
                    : 'bg-errorContainer/60 border-error'
                }`}
              >
                <View className="flex-row items-center justify-between mb-0.5">
                  <Text className="text-xs font-bold text-onSurface">Reconciliation Status</Text>
                  <Text
                    className={`text-xs font-bold ${
                      discrepancy === 0
                        ? 'text-onSecondaryContainer'
                        : discrepancy > 0
                        ? 'text-primary'
                        : 'text-error'
                    }`}
                  >
                    {discrepancy === 0
                      ? 'Balanced (₦0.00)'
                      : discrepancy > 0
                      ? `+₦${discrepancy.toLocaleString()} Overage`
                      : `-₦${Math.abs(discrepancy).toLocaleString()} Shortage`}
                  </Text>
                </View>
                <Text className="text-[11px] text-onSurfaceVariant">
                  {discrepancy === 0
                    ? 'Drawer physically matches the register ledger exactly.'
                    : discrepancy > 0
                    ? 'Physical cash exceeds system calculation (extra cash in drawer).'
                    : 'Physical cash is lower than system calculation (cash missing or unrecorded expense).'}
                </Text>
              </View>

              {/* Handover Next Attendant */}
              <View className="mb-4">
                <Text className="text-xs font-bold text-onSurface mb-1.5">
                  Next Shift Cashier Name
                </Text>
                <TextInput
                  value={nextCashierInput}
                  onChangeText={setNextCashierInput}
                  placeholder="e.g. Attendant Chioma"
                  placeholderTextColor={colors.onSurfaceVariant}
                  className="w-full h-11 bg-surfaceContainerLow border border-cardBorder rounded-xl px-3 text-xs font-medium text-onSurface"
                />
              </View>

              {/* Shift Notes */}
              <View className="mb-5">
                <Text className="text-xs font-bold text-onSurface mb-1.5">
                  Reconciliation Notes (Optional)
                </Text>
                <TextInput
                  value={shiftNotes}
                  onChangeText={setShiftNotes}
                  placeholder="e.g. ₦200 shortage due to damaged note"
                  placeholderTextColor={colors.onSurfaceVariant}
                  className="w-full h-11 bg-surfaceContainerLow border border-cardBorder rounded-xl px-3 text-xs font-medium text-onSurface"
                />
              </View>

              {/* Action Buttons */}
              <View className="flex-row gap-2.5 mb-6">
                <Pressable
                  onPress={handleReconcileShift}
                  disabled={isReconciling}
                  className={`flex-1 h-12 rounded-xl flex-row items-center justify-center gap-2 ${
                    isReconciling ? 'bg-primary/70' : 'bg-primary active:bg-primaryContainer'
                  }`}
                >
                  {isReconciling ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <AppIcon name="lock" size={18} color="#ffffff" />
                  )}
                  <Text className="text-xs font-bold text-white">
                    {isReconciling ? 'Closing Shift...' : 'Close & Open Next Shift'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setShowShiftModal(false)}
                  className="px-4 h-12 rounded-xl bg-surfaceContainer items-center justify-center"
                >
                  <Text className="text-xs font-semibold text-onSurfaceVariant">Cancel</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 5. Interstate Waybill & Dispatch Manifest Modal */}
      {activeWaybillSale && (
        <WaybillModal
          visible={Boolean(activeWaybillSale)}
          onClose={() => setActiveWaybillSale(null)}
          sale={activeWaybillSale}
          onWaybillCreated={(wb) => {
            setWaybillsMap((prev) => ({ ...prev, [wb.saleId]: wb }));
            loadSalesData();
          }}
        />
      )}
    </View>
  );
}
