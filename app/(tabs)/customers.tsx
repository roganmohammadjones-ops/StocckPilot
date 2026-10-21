import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/app-header';
import { AppIcon } from '@/components/icon';
import { colors } from '@/lib/theme';

interface CustomerRecord {
  id: string;
  name: string;
  phone: string;
  location: string;
  tier: string;
  isVerified: boolean;
  debtStatus: 'overdue' | 'due_soon' | 'settled';
  dueText: string;
  balance: number;
  lastCredit: string;
  lastPayment: string;
  lifetimeVolume: string;
}

const mockCustomers: CustomerRecord[] = [
  {
    id: '1',
    name: 'Mama Nkechi Stores',
    phone: '+234 803 491 8820',
    location: 'Balogun Mkt, Line 3B',
    tier: 'Gold Tier',
    isVerified: true,
    debtStatus: 'overdue',
    dueText: '12 Days Overdue',
    balance: 145000,
    lastCredit: '3 ctns Peak Milk (5d ago)',
    lastPayment: '₦50,000 on Oct 02',
    lifetimeVolume: '₦1,850,000',
  },
  {
    id: '2',
    name: 'Emeka Wholesales & Retail',
    phone: '+234 802 119 4432',
    location: 'Idumota Block C, Shop 14',
    tier: 'Silver Tier',
    isVerified: true,
    debtStatus: 'due_soon',
    dueText: 'Due in 3 days',
    balance: 80000,
    lastCredit: '10 bags Dangote Sugar',
    lastPayment: '₦40,000 on Sep 28',
    lifetimeVolume: '₦920,000',
  },
  {
    id: '3',
    name: 'Alhaji Bello Grains Enterprise',
    phone: '+234 813 555 0192',
    location: 'Mile 12 Market Stall 8',
    tier: 'Silver Tier',
    isVerified: false,
    debtStatus: 'overdue',
    dueText: '28 Days Overdue',
    balance: 60000,
    lastCredit: '5 packs Semovita (18d ago)',
    lastPayment: '₦20,000 on Sep 15',
    lifetimeVolume: '₦450,000',
  },
  {
    id: '4',
    name: 'Blessing Supermarket',
    phone: '+234 809 332 9901',
    location: 'Festac Town, 23 Road',
    tier: 'Gold Tier',
    isVerified: true,
    debtStatus: 'settled',
    dueText: 'Settled (Zero Balance)',
    balance: 0,
    lastCredit: 'Cleared invoice #SP-1080',
    lastPayment: '₦120,000 on Oct 20',
    lifetimeVolume: '₦3,400,000',
  },
];

export default function CustomersLedgerScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'owing' | 'overdue' | 'zero'>('all');

  const filteredCustomers = mockCustomers.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.phone.includes(searchQuery);

    if (activeFilter === 'owing') {
      return matchesSearch && item.balance > 0;
    }
    if (activeFilter === 'overdue') {
      return matchesSearch && item.debtStatus === 'overdue';
    }
    if (activeFilter === 'zero') {
      return matchesSearch && item.balance === 0;
    }
    return matchesSearch;
  });

  return (
    <View className="flex-1 bg-surface">
      <AppHeader />
      <ScrollView
        showsVerticalScrollIndicator={false}
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
                High Risk: 4 Overdue
              </Text>
            </View>
          </View>

          {/* Metric Split Card */}
          <View className="flex-row gap-2.5 mb-3">
            <View className="flex-1 bg-surfaceContainerLow rounded-xl p-3">
              <Text className="text-xs text-onSurfaceVariant">Total Outstanding</Text>
              <Text className="text-2xl font-bold text-error tracking-tight mt-1">
                ₦640,000
              </Text>
              <Text className="text-[11px] text-onSurfaceVariant mt-0.5">
                14 of 68 customers owing
              </Text>
            </View>

            <View className="flex-1 bg-errorContainer/40 rounded-xl p-3 border border-errorContainer">
              <Text className="text-xs text-onErrorContainer">Overdue (&gt;30 Days)</Text>
              <Text className="text-2xl font-bold text-error tracking-tight mt-1">
                ₦285,000
              </Text>
              <Text className="text-[11px] text-error font-medium mt-0.5">
                4 Accounts in default
              </Text>
            </View>
          </View>

          {/* Quick Progress Bar */}
          <View className="h-2 w-full bg-surfaceContainer rounded-full overflow-hidden flex-row mb-3">
            <View style={{ width: '44.5%' }} className="h-full bg-error" />
            <View style={{ width: '25.5%' }} className="h-full bg-tertiary" />
            <View style={{ width: '30%' }} className="h-full bg-secondaryContainer" />
          </View>

          {/* Filter Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 6 }}
          >
            {[
              { id: 'all', label: 'All Customers (68)' },
              { id: 'owing', label: 'Owing Debt (14)' },
              { id: 'overdue', label: 'Overdue (4)' },
              { id: 'zero', label: 'Zero Balance (54)' },
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

        {/* Search & Bulk WhatsApp Action */}
        <View className="mb-4 gap-2.5">
          <View className="relative flex-row items-center">
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

          {/* Bulk Action Button: Instant WhatsApp Broadcast */}
          <Pressable
            onPress={() => {
              Linking.openURL(
                'https://wa.me/?text=StockPilot%20Automated%20Reminder:%20Dear%20esteemed%20trade%20partners,%20this%20is%20a%20courtesy%20reminder%20to%20reconcile%20pending%20balances%20with%20Bamidele%20&%20Sons%20Provisions.'
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
                4 Overdue Debts
              </Text>
              <AppIcon name="arrow_forward" size={14} color={colors.secondary} />
            </View>
          </Pressable>
        </View>

        {/* Ledger Customer Cards */}
        <View className="gap-3">
          {filteredCustomers.map((cust) => (
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
                    {cust.lastCredit}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-1">
                    <AppIcon name="history" size={14} color={colors.outline} />
                    <Text className="text-xs text-onSurfaceVariant">Last payment:</Text>
                  </View>
                  <Text className="text-xs font-semibold text-secondary">
                    {cust.lastPayment}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between pt-1 border-t border-dashed border-cardBorder">
                  <Text className="text-xs text-onSurfaceVariant">Lifetime Volume:</Text>
                  <Text className="text-xs font-bold text-onSurface">
                    {cust.lifetimeVolume}
                  </Text>
                </View>
              </View>

              {/* Action Buttons (Record, WhatsApp, Statement) */}
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => router.push('/modal/new-sale')}
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
                      )},%20this%20is%20Bamidele%20&%20Sons%20regarding%20your%20statement%20of%20₦${cust.balance.toLocaleString()}.`
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
                  onPress={() => router.push('/reports')}
                  className="flex-1 h-9 rounded-lg bg-surfaceContainer items-center justify-center flex-row gap-1 active:bg-surfaceContainerHigh"
                >
                  <AppIcon name="picture_as_pdf" size={15} color={colors.onSurfaceVariant} />
                  <Text className="text-xs font-semibold text-onSurfaceVariant">
                    Statement
                  </Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
