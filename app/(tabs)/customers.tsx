import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Linking,
  RefreshControl,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/app-header';
import { AppIcon } from '@/components/icon';
import { BrandLoader } from '@/components/brand-loader';
import { colors } from '@/lib/theme';
import { useDataRefresh, useAppDb } from '@/lib/db/provider';
import { useStoreProfile } from '@/lib/store-profile';
import {
  getCustomers,
  recordDebtPayment,
  addCustomer,
  getDashboardMetrics,
  getSales,
} from '@/lib/db/queries';
import type { Customer, DashboardMetrics } from '@/lib/db/types';
import { sharePaymentReceiptPdf, shareStatementPdf } from '@/lib/receipt';

export default function CustomersLedgerScreen() {
  const router = useRouter();
  const db = useAppDb();
  const { refreshTrigger, triggerRefresh } = useDataRefresh();
  const store = useStoreProfile();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'owing' | 'overdue' | 'zero'>('all');

  // Payment Modal State
  const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'pos'>('cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Add Customer Modal State
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustLocation, setNewCustLocation] = useState('');
  const [newCustCreditLimit, setNewCustCreditLimit] = useState('500000');
  const [newCustBalance, setNewCustBalance] = useState('0');
  const [isSubmittingCustomer, setIsSubmittingCustomer] = useState(false);
  const [generatingCustId, setGeneratingCustId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [fetchedCustomers, fetchedMetrics] = await Promise.all([
        getCustomers(db, searchQuery, activeFilter),
        getDashboardMetrics(db),
      ]);
      setCustomers(fetchedCustomers);
      setMetrics(fetchedMetrics);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [db, searchQuery, activeFilter]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshTrigger]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Open Payment Modal
  const openPaymentModal = (cust: Customer) => {
    if (cust.balance <= 0) {
      Alert.alert(
        'Account Settled',
        `${cust.name} currently has zero outstanding balance. Would you like to record a new sale instead?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'New Sale', onPress: () => router.push('/modal/new-sale') },
        ]
      );
      return;
    }
    setPaymentCustomer(cust);
    setPaymentAmount(cust.balance.toString());
    setPaymentMethod('cash');
    setPaymentNotes('');
  };

  // Submit Payment
  const handleConfirmPayment = async () => {
    if (!paymentCustomer) return;
    const amountNum = parseInt(paymentAmount.replace(/[^0-9]/g, '') || '0', 10);
    if (!amountNum || amountNum <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid repayment amount.');
      return;
    }

    setIsSubmittingPayment(true);
    try {
      await recordDebtPayment(
        db,
        paymentCustomer.id,
        amountNum,
        paymentMethod,
        paymentNotes || 'Counter Debt Settlement'
      );
      const currentCust = { ...paymentCustomer };
      const remaining = Math.max(0, currentCust.balance - amountNum);
      triggerRefresh();
      setPaymentCustomer(null);

      Alert.alert(
        'Payment Recorded Successfully',
        `₦${amountNum.toLocaleString()} payment recorded for ${currentCust.name}.\nNew Remaining Balance: ₦${remaining.toLocaleString()}.`,
        [
          {
            text: 'Send WhatsApp Voucher',
            onPress: () => {
              const cleanPhone = currentCust.phone.replace(/[^0-9]/g, '');
              const msg = `*PAYMENT ACKNOWLEDGMENT*%0A` +
                `*Store:* ${encodeURIComponent(store.businessName)}%0A` +
                `*Customer:* ${encodeURIComponent(currentCust.name)}%0A` +
                `*Amount Received:* ₦${amountNum.toLocaleString()}%0A` +
                `*Channel:* ${paymentMethod.toUpperCase()}%0A` +
                `*Remaining Balance:* ₦${remaining.toLocaleString()}%0A` +
                `Payment credited to ledger. Thank you!`;
              Linking.openURL(`https://wa.me/${cleanPhone}?text=${msg}`);
            },
          },
          {
            text: 'Print Voucher PDF',
            onPress: () => {
              sharePaymentReceiptPdf(currentCust, amountNum, paymentMethod, remaining).catch((err) => {
                Alert.alert('Printing Error', err?.message || 'Could not print voucher.');
              });
            },
          },
          {
            text: 'Done',
            style: 'cancel',
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Payment Error', err?.message || 'Failed to record debt payment.');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleShareCustomerStatement = async (cust: Customer) => {
    try {
      setGeneratingCustId(cust.id);
      const customerSales = await getSales(db, 30, cust.id);
      await shareStatementPdf(cust, customerSales);
    } catch (e: any) {
      Alert.alert('Statement Error', e?.message || 'Could not generate statement PDF.');
    } finally {
      setGeneratingCustId(null);
    }
  };

  // Submit New Customer
  const handleCreateCustomer = async () => {
    if (!newCustName.trim()) {
      Alert.alert('Missing Name', 'Please enter the customer or business name.');
      return;
    }

    setIsSubmittingCustomer(true);
    try {
      await addCustomer(db, {
        name: newCustName.trim(),
        phone: newCustPhone.trim() || '+234 800 000 0000',
        location: newCustLocation.trim() || 'Balogun Market, Lagos',
        creditLimit: parseInt(newCustCreditLimit.replace(/[^0-9]/g, '') || '500000', 10),
        balance: parseInt(newCustBalance.replace(/[^0-9]/g, '') || '0', 10),
      });

      triggerRefresh();
      setShowAddCustomerModal(false);
      setNewCustName('');
      setNewCustPhone('');
      setNewCustLocation('');
      setNewCustCreditLimit('500000');
      setNewCustBalance('0');

      Alert.alert('Success', 'Customer added to your trade directory.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to create customer.');
    } finally {
      setIsSubmittingCustomer(false);
    }
  };

  // Compute local counts from data
  const totalOutstanding = metrics?.creditOutstanding ?? 0;
  const overdueCount = metrics?.overdueDebtorsCount ?? 0;
  const owingCount = metrics?.owingCustomersCount ?? 0;
  const totalCount = metrics?.totalCustomersCount ?? customers.length;
  const zeroCount = Math.max(0, totalCount - owingCount);

  // Compute overdue amount
  const overdueAmount = customers
    .filter((c) => c.debtStatus === 'overdue')
    .reduce((sum, c) => sum + c.balance, 0);

  return (
    <View className="flex-1 bg-surface">
      <AppHeader />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 80 }}
      >
        {/* Debt Ledger Summary Panel */}
        <View className="bg-white rounded-xl p-4 border border-cardBorder shadow-sm mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-1.5">
              <AppIcon name="warning" size={18} color={colors.error} />
              <Text className="text-xs font-bold text-onSurfaceVariant uppercase tracking-wider">
                Credit Ledger & Receivables
              </Text>
            </View>
            <View className="flex-row items-center gap-1 px-2.5 py-0.5 rounded-full bg-errorContainer">
              <View className="w-1.5 h-1.5 rounded-full bg-error" />
              <Text className="text-xs font-bold text-onErrorContainer">
                {overdueCount > 0 ? `High Risk: ${overdueCount} Overdue` : 'All Accounts Good'}
              </Text>
            </View>
          </View>

          {/* Metric Split Card */}
          <View className="flex-row gap-2.5 mb-3">
            <View className="flex-1 bg-surfaceContainerLow rounded-xl p-3">
              <Text className="text-xs text-onSurfaceVariant">Total Outstanding</Text>
              <Text className="text-2xl font-bold text-error tracking-tight mt-1">
                ₦{totalOutstanding.toLocaleString()}
              </Text>
              <Text className="text-[11px] text-onSurfaceVariant mt-0.5">
                {owingCount} of {totalCount} customers owing
              </Text>
            </View>

            <View className="flex-1 bg-errorContainer/40 rounded-xl p-3 border border-errorContainer">
              <Text className="text-xs text-onErrorContainer">Overdue (&gt;30 Days)</Text>
              <Text className="text-2xl font-bold text-error tracking-tight mt-1">
                ₦{overdueAmount.toLocaleString()}
              </Text>
              <Text className="text-[11px] text-error font-medium mt-0.5">
                {overdueCount} {overdueCount === 1 ? 'Account' : 'Accounts'} in default
              </Text>
            </View>
          </View>

          {/* Filter Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 6 }}
          >
            {[
              { id: 'all', label: `All Customers (${totalCount})` },
              { id: 'owing', label: `Owing Debt (${owingCount})` },
              { id: 'overdue', label: `Overdue (${overdueCount})` },
              { id: 'zero', label: `Zero Balance (${zeroCount})` },
            ].map((tab) => (
              <Pressable
                key={tab.id}
                onPress={() => setActiveFilter(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-full shadow-xs active:scale-95 ${
                  activeFilter === tab.id
                    ? 'bg-primary'
                    : 'bg-surfaceContainer border border-cardBorder'
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    activeFilter === tab.id ? 'text-white' : 'text-onSurfaceVariant'
                  }`}
                >
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Search & Actions */}
        <View className="mb-4 gap-2.5">
          <View className="flex-row items-center gap-2">
            <View className="relative flex-1 flex-row items-center">
              <View className="absolute left-3 z-10">
                <AppIcon name="search" size={18} color={colors.slateMuted} />
              </View>
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search customer, phone, or shop line..."
                placeholderTextColor={colors.slateMuted}
                className="w-full h-11 pl-9 pr-4 bg-white rounded-xl border border-cardBorder text-sm text-onSurface shadow-xs"
              />
            </View>
            <Pressable
              onPress={() => setShowAddCustomerModal(true)}
              className="h-11 px-3.5 bg-primary rounded-xl flex-row items-center justify-center gap-1 active:bg-primaryContainer shadow-xs"
            >
              <AppIcon name="person_add" size={18} color="#ffffff" />
              <Text className="text-xs font-bold text-white">Add</Text>
            </Pressable>
          </View>

          {/* Bulk Action Button: Instant WhatsApp Broadcast */}
          <Pressable
            onPress={() => {
              Linking.openURL(
                `https://wa.me/?text=StockPilot%20Automated%20Reminder:%20Dear%20esteemed%20trade%20partners,%20this%20is%20a%20courtesy%20reminder%20to%20reconcile%20pending%20balances%20with%20${encodeURIComponent(
                  store.businessName
                )}.`
              );
            }}
            className="w-full h-12 bg-secondaryContainer rounded-xl px-4 flex-row items-center justify-between shadow-xs active:opacity-90"
          >
            <View className="flex-row items-center gap-2">
              <AppIcon name="chat" size={20} color={colors.secondary} />
              <Text className="text-sm font-bold text-onSecondaryContainer">
                Bulk WhatsApp Reminder
              </Text>
            </View>
            <View className="flex-row items-center gap-1.5 bg-white/80 px-2.5 py-1 rounded-full">
              <Text className="text-xs font-bold text-onSecondaryContainer">
                {overdueCount} Overdue Debts
              </Text>
              <AppIcon name="arrow_forward" size={14} color={colors.secondary} />
            </View>
          </Pressable>
        </View>

        {/* Loading State */}
        {isLoading && (
          <View className="py-16 items-center justify-center">
            <BrandLoader
              size="medium"
              message="Loading merchant credit ledger..."
            />
          </View>
        )}

        {/* Empty State */}
        {!isLoading && customers.length === 0 && (
          <View className="bg-white rounded-xl p-8 border border-cardBorder items-center justify-center shadow-xs">
            <View className="w-14 h-14 rounded-2xl bg-surfaceContainerLow items-center justify-center mb-3">
              <AppIcon name="people" size={28} color={colors.slateMuted} />
            </View>
            <Text className="text-base font-bold text-onSurface">No customers found</Text>
            <Text className="text-xs text-onSurfaceVariant text-center mt-1 mb-4">
              {searchQuery
                ? `No customers matching "${searchQuery}"`
                : 'Your customer ledger has no records under this filter.'}
            </Text>
            <Pressable
              onPress={() => setShowAddCustomerModal(true)}
              className="px-4 py-2 bg-primary rounded-xl flex-row items-center gap-1.5 active:bg-primaryContainer"
            >
              <AppIcon name="person_add" size={16} color="#ffffff" />
              <Text className="text-xs font-bold text-white">Add New Customer</Text>
            </Pressable>
          </View>
        )}

        {/* Ledger Customer Cards */}
        {!isLoading && (
          <View className="gap-3">
            {customers.map((cust) => (
              <View
                key={cust.id}
                className="bg-white rounded-xl p-4 border border-cardBorder shadow-sm relative overflow-hidden"
              >
                {/* Left Indicator Band */}
                <View
                  className={`absolute left-0 top-0 bottom-0 w-1 ${
                    cust.debtStatus === 'overdue'
                      ? 'bg-error'
                      : cust.debtStatus === 'due_soon'
                      ? 'bg-tertiary'
                      : 'bg-primary'
                  }`}
                />

                {/* Header Info */}
                <View className="flex-row items-start justify-between mb-2 pl-1">
                  <View className="flex-row items-center gap-2.5 flex-1 mr-2">
                    <View className="w-11 h-11 rounded-lg bg-surfaceContainer items-center justify-center">
                      <AppIcon name="person" size={22} color={colors.primary} />
                    </View>
                    <View className="flex-1 min-w-0">
                      <View className="flex-row items-center gap-1.5">
                        <Text className="text-sm font-bold text-onSurface truncate">
                          {cust.name}
                        </Text>
                        {cust.isVerified && (
                          <AppIcon name="verified" size={15} color={colors.primary} />
                        )}
                      </View>
                      <View className="flex-row items-center gap-1 mt-0.5">
                        <Text className="text-xs text-onSurfaceVariant truncate">
                          {cust.location}
                        </Text>
                        <Text className="text-xs text-outline">•</Text>
                        <View className="bg-secondaryContainer/50 px-1.5 py-0.2 rounded">
                          <Text className="text-[10px] font-bold text-primary">
                            {cust.tier}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View className="items-end">
                    <Text
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        cust.debtStatus === 'overdue'
                          ? 'text-error'
                          : cust.debtStatus === 'due_soon'
                          ? 'text-tertiary'
                          : 'text-primary'
                      }`}
                    >
                      {cust.dueText}
                    </Text>
                    <Text
                      className={`text-base font-bold mt-0.5 ${
                        cust.balance > 0 ? 'text-error' : 'text-primary'
                      }`}
                    >
                      ₦{cust.balance.toLocaleString()}
                    </Text>
                  </View>
                </View>

                {/* Ledger Line Details */}
                <View className="bg-surfaceContainerLow rounded-xl p-3 mb-3 gap-1.5">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-1">
                      <AppIcon name="shopping_bag" size={14} color={colors.outline} />
                      <Text className="text-xs text-onSurfaceVariant">Last credit:</Text>
                    </View>
                    <Text className="text-xs font-medium text-onSurface">
                      {cust.lastCredit || 'No credit sales yet'}
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-1">
                      <AppIcon name="history" size={14} color={colors.outline} />
                      <Text className="text-xs text-onSurfaceVariant">Last payment:</Text>
                    </View>
                    <Text className="text-xs font-semibold text-secondary">
                      {cust.lastPayment || 'None recorded'}
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between pt-1 border-t border-dashed border-cardBorder">
                    <Text className="text-xs text-onSurfaceVariant">Lifetime Volume:</Text>
                    <Text className="text-xs font-bold text-onSurface">
                      {cust.lifetimeVolume || `₦${cust.balance.toLocaleString()}`}
                    </Text>
                  </View>
                </View>

                {/* Action Buttons (Record Payment, WhatsApp, Statement) */}
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => openPaymentModal(cust)}
                    className="flex-1 h-9 rounded-lg bg-primary items-center justify-center flex-row gap-1 active:bg-primaryContainer"
                  >
                    <AppIcon name="payments" size={15} color="#ffffff" />
                    <Text className="text-xs font-semibold text-white">Record</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      Linking.openURL(
                        `https://wa.me/${cust.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(
                          cust.name
                        )},%20this%20is%20${encodeURIComponent(
                          store.businessName
                        )}%20regarding%20your%20statement%20of%20₦${cust.balance.toLocaleString()}.`
                      );
                    }}
                    className="flex-1 h-9 rounded-lg bg-secondaryContainer items-center justify-center flex-row gap-1 active:opacity-80"
                  >
                    <AppIcon name="chat" size={15} color={colors.onSecondaryContainer} />
                    <Text className="text-xs font-semibold text-onSecondaryContainer">
                      WhatsApp
                    </Text>
                  </Pressable>

                  <Pressable
                    disabled={generatingCustId === cust.id}
                    onPress={() => handleShareCustomerStatement(cust)}
                    className="flex-1 h-9 rounded-lg bg-surfaceContainer items-center justify-center flex-row gap-1 active:bg-surfaceContainerHigh"
                  >
                    {generatingCustId === cust.id ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <>
                        <AppIcon name="picture_as_pdf" size={15} color={colors.onSurfaceVariant} />
                        <Text className="text-xs font-semibold text-onSurfaceVariant">
                          Statement
                        </Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Repayment Modal */}
      <Modal
        visible={Boolean(paymentCustomer)}
        transparent
        animationType="slide"
        onRequestClose={() => setPaymentCustomer(null)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-5 border-t border-cardBorder max-h-[85%]">
            <View className="w-12 h-1 bg-outlineVariant rounded-full self-center mb-3" />

            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-lg font-bold text-onSurface">Record Debt Payment</Text>
                <Text className="text-xs text-onSurfaceVariant">{paymentCustomer?.name}</Text>
              </View>
              <Pressable
                onPress={() => setPaymentCustomer(null)}
                className="w-8 h-8 rounded-full bg-surfaceContainer items-center justify-center"
              >
                <AppIcon name="close" size={18} color={colors.onSurfaceVariant} />
              </Pressable>
            </View>

            {/* Current Debt Card */}
            <View className="bg-errorContainer/30 p-3 rounded-xl border border-errorContainer mb-4 flex-row items-center justify-between">
              <View>
                <Text className="text-xs text-onErrorContainer">Current Balance</Text>
                <Text className="text-xl font-bold text-error">
                  ₦{paymentCustomer?.balance.toLocaleString()}
                </Text>
              </View>
              <Pressable
                onPress={() => setPaymentAmount(paymentCustomer?.balance.toString() || '0')}
                className="px-2.5 py-1 bg-white rounded-lg border border-errorContainer"
              >
                <Text className="text-xs font-bold text-error">Pay Full</Text>
              </Pressable>
            </View>

            {/* Amount Input */}
            <Text className="text-xs font-semibold text-onSurfaceVariant mb-1.5">
              Amount Paid (₦)
            </Text>
            <View className="flex-row items-center bg-surfaceContainerLow rounded-xl px-3 h-12 border border-cardBorder mb-4">
              <Text className="text-xl font-bold text-primary mr-2">₦</Text>
              <TextInput
                value={paymentAmount}
                onChangeText={setPaymentAmount}
                keyboardType="numeric"
                className="flex-1 text-xl font-bold text-onSurface p-0"
              />
            </View>

            {/* Payment Method */}
            <Text className="text-xs font-semibold text-onSurfaceVariant mb-1.5">
              Payment Channel
            </Text>
            <View className="flex-row gap-2 mb-4">
              {[
                { id: 'cash', label: 'Cash' },
                { id: 'transfer', label: 'Bank Transfer' },
                { id: 'pos', label: 'POS Terminal' },
              ].map((m) => (
                <Pressable
                  key={m.id}
                  onPress={() => setPaymentMethod(m.id as any)}
                  className={`flex-1 py-2 rounded-xl border items-center justify-center ${
                    paymentMethod === m.id
                      ? 'bg-primary border-primary'
                      : 'bg-white border-cardBorder'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      paymentMethod === m.id ? 'text-white' : 'text-onSurface'
                    }`}
                  >
                    {m.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Notes */}
            <Text className="text-xs font-semibold text-onSurfaceVariant mb-1.5">
              Notes (Optional)
            </Text>
            <TextInput
              value={paymentNotes}
              onChangeText={setPaymentNotes}
              placeholder="e.g. Access Bank receipt #491"
              placeholderTextColor={colors.outline}
              className="w-full h-11 px-3 bg-surfaceContainerLow rounded-xl border border-cardBorder text-xs text-onSurface mb-5"
            />

            {/* Confirm Button */}
            <Pressable
              onPress={handleConfirmPayment}
              disabled={isSubmittingPayment}
              className={`w-full h-13 bg-primary rounded-xl items-center justify-center flex-row gap-2 active:bg-primaryContainer shadow-sm ${
                isSubmittingPayment ? 'opacity-60' : ''
              }`}
            >
              <AppIcon name="check_circle" size={18} color="#ffffff" />
              <Text className="text-sm font-bold text-white">
                {isSubmittingPayment ? 'Processing...' : 'Confirm Repayment'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Add Customer Modal */}
      <Modal
        visible={showAddCustomerModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddCustomerModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-5 border-t border-cardBorder max-h-[90%]">
            <View className="w-12 h-1 bg-outlineVariant rounded-full self-center mb-3" />

            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-lg font-bold text-onSurface">Add Trade Customer</Text>
                <Text className="text-xs text-onSurfaceVariant">
                  Register customer for ledger tracking and credit terms
                </Text>
              </View>
              <Pressable
                onPress={() => setShowAddCustomerModal(false)}
                className="w-8 h-8 rounded-full bg-surfaceContainer items-center justify-center"
              >
                <AppIcon name="close" size={18} color={colors.onSurfaceVariant} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="gap-3 mb-4">
              <View>
                <Text className="text-xs font-semibold text-onSurfaceVariant mb-1">
                  Customer / Business Name *
                </Text>
                <TextInput
                  value={newCustName}
                  onChangeText={setNewCustName}
                  placeholder="e.g. Iya Moria Cold Store"
                  placeholderTextColor={colors.outline}
                  className="w-full h-11 px-3 bg-surfaceContainerLow rounded-xl border border-cardBorder text-sm text-onSurface"
                />
              </View>

              <View>
                <Text className="text-xs font-semibold text-onSurfaceVariant mb-1">
                  Phone Number
                </Text>
                <TextInput
                  value={newCustPhone}
                  onChangeText={setNewCustPhone}
                  placeholder="+234 803 000 0000"
                  keyboardType="phone-pad"
                  placeholderTextColor={colors.outline}
                  className="w-full h-11 px-3 bg-surfaceContainerLow rounded-xl border border-cardBorder text-sm text-onSurface"
                />
              </View>

              <View>
                <Text className="text-xs font-semibold text-onSurfaceVariant mb-1">
                  Shop Location / Market Line
                </Text>
                <TextInput
                  value={newCustLocation}
                  onChangeText={setNewCustLocation}
                  placeholder="e.g. Balogun Market Line 4"
                  placeholderTextColor={colors.outline}
                  className="w-full h-11 px-3 bg-surfaceContainerLow rounded-xl border border-cardBorder text-sm text-onSurface"
                />
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-onSurfaceVariant mb-1">
                    Credit Limit (₦)
                  </Text>
                  <TextInput
                    value={newCustCreditLimit}
                    onChangeText={setNewCustCreditLimit}
                    keyboardType="numeric"
                    placeholder="500,000"
                    placeholderTextColor={colors.outline}
                    className="w-full h-11 px-3 bg-surfaceContainerLow rounded-xl border border-cardBorder text-sm text-onSurface font-bold"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-onSurfaceVariant mb-1">
                    Initial Balance (₦)
                  </Text>
                  <TextInput
                    value={newCustBalance}
                    onChangeText={setNewCustBalance}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.outline}
                    className="w-full h-11 px-3 bg-surfaceContainerLow rounded-xl border border-cardBorder text-sm text-error font-bold"
                  />
                </View>
              </View>
            </ScrollView>

            <Pressable
              onPress={handleCreateCustomer}
              disabled={isSubmittingCustomer}
              className={`w-full h-13 bg-primary rounded-xl items-center justify-center flex-row gap-2 active:bg-primaryContainer shadow-sm ${
                isSubmittingCustomer ? 'opacity-60' : ''
              }`}
            >
              <AppIcon name="person_add" size={18} color="#ffffff" />
              <Text className="text-sm font-bold text-white">
                {isSubmittingCustomer ? 'Saving...' : 'Save to Directory'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
