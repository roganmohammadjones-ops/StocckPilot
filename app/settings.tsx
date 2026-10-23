import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/app-header';
import { AppIcon } from '@/components/icon';
import { BrandLogo } from '@/components/brand-logo';
import { colors } from '@/lib/theme';
import { syncDatabaseWithCloud } from '@/lib/db/sync';
import { useAppDb, useDataRefresh } from '@/lib/db/provider';
import { logout } from '@/lib/auth';
import {
  useStoreProfile,
  updateStoreProfile,
  addSettlementAccount,
  removeSettlementAccount,
  setDefaultSettlementAccount,
  NIGERIAN_BANKS,
  TRADING_HUBS,
} from '@/lib/store-profile';
import { clearAllDatabaseRecords, seedStandardSampleCatalog } from '@/lib/db/queries';
import { useResponsive } from '@/hooks/use-responsive';

export default function SettingsScreen() {
  const router = useRouter();
  const db = useAppDb();
  const { triggerRefresh } = useDataRefresh();
  const store = useStoreProfile();
  const { isWide } = useResponsive();

  const [isSyncing, setIsSyncing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [stats, setStats] = useState({
    products: 0,
    customers: 0,
    sales: 0,
    expenses: 0,
  });

  // Profile Edit Modal State
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editBusinessName, setEditBusinessName] = useState(store.businessName);
  const [editOwnerName, setEditOwnerName] = useState(store.ownerName);
  const [editPhone, setEditPhone] = useState(store.phone);
  const [editCac, setEditCac] = useState(store.cacNumber);
  const [editLocation, setEditLocation] = useState(store.marketLocation);
  const [editStall, setEditStall] = useState(store.marketStall);

  // Add Account Modal State
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [selectedBank, setSelectedBank] = useState(NIGERIAN_BANKS[0]);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState<'Till POS' | 'Current' | 'Savings'>('Till POS');
  const [isDefaultAccount, setIsDefaultAccount] = useState(true);
  const [showBankPicker, setShowBankPicker] = useState(false);

  // Hardware states
  const [printerConnected, setPrinterConnected] = useState(store.hardware.posPrinterConnected);
  const [scannerActive, setScannerActive] = useState(store.hardware.barcodeReaderEnabled);

  const loadStats = useCallback(async () => {
    try {
      const [prodRow, custRow, saleRow, expRow] = await Promise.all([
        db.getFirstAsync<{ count: number }>('SELECT count(*) as count FROM products'),
        db.getFirstAsync<{ count: number }>('SELECT count(*) as count FROM customers'),
        db.getFirstAsync<{ count: number }>('SELECT count(*) as count FROM sales'),
        db.getFirstAsync<{ count: number }>('SELECT count(*) as count FROM expenses'),
      ]);

      setStats({
        products: prodRow?.count ?? 0,
        customers: custRow?.count ?? 0,
        sales: saleRow?.count ?? 0,
        expenses: expRow?.count ?? 0,
      });
    } catch (e) {
      console.error('Failed to load settings stats:', e);
    }
  }, [db]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleOpenEditProfile = () => {
    setEditBusinessName(store.businessName);
    setEditOwnerName(store.ownerName);
    setEditPhone(store.phone);
    setEditCac(store.cacNumber);
    setEditLocation(store.marketLocation);
    setEditStall(store.marketStall);
    setShowEditProfileModal(true);
  };

  const handleSaveProfile = () => {
    if (!editBusinessName.trim()) {
      Alert.alert('Required', 'Please enter your business or trading shop name.');
      return;
    }
    updateStoreProfile({
      businessName: editBusinessName.trim(),
      ownerName: editOwnerName.trim() || 'Store Manager',
      phone: editPhone.trim(),
      cacNumber: editCac.trim() || 'Unregistered (Sole Trader)',
      isCacVerified: editCac.trim().length > 3 && !editCac.toLowerCase().includes('unregistered'),
      marketLocation: editLocation.trim() || 'Lagos, Nigeria',
      marketStall: editStall.trim() || 'Main Shop',
    });
    setShowEditProfileModal(false);
    Alert.alert('Profile Updated', 'Your business profile and receipt headers have been updated.');
  };

  const handleSaveAccount = () => {
    if (!accountNumber.trim() || accountNumber.trim().length < 10) {
      Alert.alert('Invalid Account', 'Please enter a valid 10-digit NUBAN account number.');
      return;
    }
    if (!accountName.trim()) {
      Alert.alert('Invalid Name', 'Please enter the registered beneficiary or account name.');
      return;
    }

    addSettlementAccount({
      bankName: selectedBank,
      accountNumber: accountNumber.trim(),
      accountName: accountName.trim().toUpperCase(),
      accountType,
      isDefault: isDefaultAccount || store.settlementAccounts.length === 0,
    });

    setAccountNumber('');
    setAccountName('');
    setShowAddAccountModal(false);
    Alert.alert('Settlement Account Added', `${selectedBank} account linked successfully.`);
  };

  const handleTogglePrinter = (val: boolean) => {
    setPrinterConnected(val);
    updateStoreProfile({
      hardware: {
        ...store.hardware,
        posPrinterConnected: val,
      },
    });
  };

  const handleToggleScanner = (val: boolean) => {
    setScannerActive(val);
    updateStoreProfile({
      hardware: {
        ...store.hardware,
        barcodeReaderEnabled: val,
      },
    });
  };

  const handleClearDemoData = async () => {
    Alert.alert(
      'Clear All Demo Records?',
      'This will purge all sample products, demo sales, mock debtors, and expense vouchers so you can start with a 100% clean production database.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Everything (Start Fresh)',
          style: 'destructive',
          onPress: async () => {
            setIsResetting(true);
            try {
              await clearAllDatabaseRecords(db);
              triggerRefresh();
              await loadStats();
              Alert.alert('Database Cleared', 'All demo records have been cleared. Your store is now fresh and ready.');
            } catch (err: any) {
              Alert.alert('Reset Error', err?.message || 'Failed to clear database records.');
            } finally {
              setIsResetting(false);
            }
          },
        },
      ]
    );
  };

  const handleLoadSampleCatalog = async () => {
    setIsResetting(true);
    try {
      await seedStandardSampleCatalog(db);
      triggerRefresh();
      await loadStats();
      Alert.alert('Sample Catalog Loaded', 'Standard wholesale staple products added for testing.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to load sample catalog.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleBackup = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const result = await syncDatabaseWithCloud(db);
      setLastSyncedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      await loadStats();
      Alert.alert(
        result.isOffline ? 'Offline SQLite Cache Ready' : 'Cloud Mirror Synchronized',
        result.message
      );
    } catch (err: any) {
      Alert.alert('Sync Notice', err?.message || 'Local SQLite database backed up successfully.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <View className="flex-1 bg-surface">
      <AppHeader title="Settings & Profile" subtitle="Store & Device Configuration" showBack />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 60 }}
      >
        <View className="w-full max-w-5xl mx-auto">
          {/* Business Profile Card */}
          <View className="bg-white rounded-xl p-4 border border-cardBorder shadow-sm mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-3 flex-1 min-w-0 mr-2">
              <View className="w-14 h-14 rounded-2xl bg-secondaryContainer/50 items-center justify-center border border-cardBorder shadow-sm overflow-hidden">
                <BrandLogo variant="emblem" size={38} />
              </View>
              <View className="flex-1 min-w-0">
                <View className="flex-row items-center gap-1.5">
                  <Text className="text-base font-bold text-onSurface truncate">
                    {store.businessName}
                  </Text>
                  {store.isCacVerified && (
                    <AppIcon name="verified" size={16} color={colors.primary} />
                  )}
                </View>
                <Text className="text-xs text-onSurfaceVariant mt-0.5 truncate">
                  {store.cacNumber}
                </Text>
                <Text className="text-xs text-outline mt-0.5 truncate">
                  {store.marketLocation}
                </Text>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit Store Profile"
              onPress={handleOpenEditProfile}
              className="px-3 py-1.5 rounded-lg bg-surfaceContainerLow border border-cardBorder flex-row items-center gap-1 active:bg-surfaceContainer"
            >
              <AppIcon name="edit" size={14} color={colors.primary} />
              <Text className="text-xs font-semibold text-primary">Edit</Text>
            </Pressable>
          </View>

          <View className="bg-surfaceContainerLow p-3 rounded-xl gap-2 border border-cardBorder">
            <View className="flex-row justify-between text-xs">
              <Text className="text-xs text-onSurfaceVariant">Owner / Manager:</Text>
              <Text className="text-xs font-semibold text-onSurface">{store.ownerName}</Text>
            </View>
            <View className="flex-row justify-between text-xs">
              <Text className="text-xs text-onSurfaceVariant">Primary Phone:</Text>
              <Text className="text-xs font-semibold text-onSurface">
                {store.phone || 'Not set'}
              </Text>
            </View>
            <View className="flex-row justify-between text-xs">
              <Text className="text-xs text-onSurfaceVariant">Registered Market Stall:</Text>
              <Text className="text-xs font-semibold text-onSurface">
                {store.marketStall || 'Not set'}
              </Text>
            </View>
          </View>
        </View>

        {/* 2-Column Responsive Settings Layout on Tablets & Desktops */}
        <View className={isWide ? 'flex-row items-start gap-5' : ''}>
          {/* Left Column: Accounts & Session */}
          <View className={isWide ? 'flex-1' : 'w-full'}>
            {/* Settlement Accounts */}
            <View className="bg-white rounded-xl p-4 border border-cardBorder shadow-sm mb-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-xs font-bold text-onSurfaceVariant uppercase tracking-wider">
                  Settlement Accounts
                </Text>
            <Pressable
              onPress={() => setShowAddAccountModal(true)}
              className="flex-row items-center gap-1 px-2.5 py-1 rounded-md bg-secondaryContainer active:opacity-80"
            >
              <AppIcon name="add" size={14} color={colors.secondary} />
              <Text className="text-xs font-bold text-onSecondaryContainer">Add Account</Text>
            </Pressable>
          </View>

          {store.settlementAccounts.length === 0 ? (
            <View className="p-4 rounded-xl bg-surfaceContainerLow border border-dashed border-cardBorder items-center text-center">
              <View className="w-10 h-10 rounded-full bg-secondaryContainer/60 items-center justify-center mb-2">
                <AppIcon name="account_balance" size={20} color={colors.primary} />
              </View>
              <Text className="text-xs font-bold text-onSurface mb-1">
                No Settlement Account Configured
              </Text>
              <Text className="text-[11px] text-onSurfaceVariant text-center mb-3">
                Link your Nigerian business bank account (Moniepoint, OPay, Access, GTB, etc.) to receive customer transfers and print on receipts.
              </Text>
              <Pressable
                onPress={() => setShowAddAccountModal(true)}
                className="px-3.5 py-1.5 rounded-lg bg-primary flex-row items-center gap-1.5"
              >
                <AppIcon name="add" size={14} color="#ffffff" />
                <Text className="text-xs font-semibold text-white">Add Your Bank Details</Text>
              </Pressable>
            </View>
          ) : (
            <View className="gap-2.5">
              {store.settlementAccounts.map((acc) => {
                const initials = acc.bankName
                  .split(' ')
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();
                return (
                  <View
                    key={acc.id}
                    className="bg-surfaceContainerLow p-3 rounded-xl flex-row items-center justify-between border border-cardBorder"
                  >
                    <View className="flex-row items-center gap-2.5 flex-1 min-w-0 mr-2">
                      <View className="w-9 h-9 rounded-full bg-primary items-center justify-center">
                        <Text className="text-xs font-bold text-white">{initials}</Text>
                      </View>
                      <View className="flex-1 min-w-0">
                        <View className="flex-row items-center gap-1.5">
                          <Text className="text-xs font-bold text-onSurface truncate">
                            {acc.bankName}
                          </Text>
                          {acc.accountType && (
                            <Text className="text-[10px] text-onSurfaceVariant bg-surfaceContainer px-1.5 py-0.2 rounded">
                              {acc.accountType}
                            </Text>
                          )}
                        </View>
                        <Text className="text-xs font-mono text-onSurfaceVariant mt-0.5">
                          {acc.accountNumber} • {acc.accountName}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center gap-1.5">
                      {acc.isDefault ? (
                        <View className="px-2 py-0.5 rounded bg-secondaryContainer">
                          <Text className="text-[10px] font-bold text-onSecondaryContainer">
                            Default
                          </Text>
                        </View>
                      ) : (
                        <Pressable
                          onPress={() => setDefaultSettlementAccount(acc.id)}
                          className="px-2 py-0.5 rounded bg-surfaceContainer active:bg-surfaceContainerHigh"
                        >
                          <Text className="text-[10px] font-semibold text-outline">
                            Make Default
                          </Text>
                        </Pressable>
                      )}

                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Delete Account"
                        onPress={() => {
                          Alert.alert('Remove Account', `Remove ${acc.bankName} (${acc.accountNumber})?`, [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Remove',
                              style: 'destructive',
                              onPress: () => removeSettlementAccount(acc.id),
                            },
                          ]);
                        }}
                        className="w-7 h-7 rounded items-center justify-center active:bg-errorContainer"
                      >
                        <AppIcon name="delete" size={16} color={colors.outline} />
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Session Management */}
        <View className="bg-white rounded-xl p-4 border border-cardBorder shadow-sm mb-4">
          <Text className="text-sm font-bold text-onSurface mb-1">Session & Account</Text>
          <Text className="text-xs text-onSurfaceVariant mb-4">
            Reset current login session or switch account.
          </Text>

          <Pressable
            onPress={() => {
              logout();
              router.replace('/onboarding');
            }}
            className="w-full h-11 rounded-xl bg-surfaceContainerLow border border-cardBorder items-center justify-center active:bg-surfaceContainer"
          >
            <Text className="text-xs font-bold text-onSurface">
              Sign Out & Return to Welcome Tour
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Right Column: Hardware & Database Infrastructure */}
      <View className={isWide ? 'flex-1' : 'w-full'}>
        {/* Hardware & Printers */}
        <View className="bg-white rounded-xl p-4 border border-cardBorder shadow-sm mb-4">
          <Text className="text-xs font-bold text-onSurfaceVariant uppercase tracking-wider mb-3">
            Hardware & Printers
          </Text>
          <View className="gap-2.5">
            <View className="flex-row items-center justify-between p-2.5 rounded-xl bg-surfaceContainerLow border border-cardBorder">
              <View className="flex-row items-center gap-2.5 flex-1 mr-2">
                <AppIcon name="receipt_long" size={20} color={colors.primary} />
                <View className="flex-1">
                  <Text className="text-xs font-bold text-onSurface">Thermal POS Printer</Text>
                  <Text className="text-[11px] text-onSurfaceVariant">
                    Bluetooth 58mm / 80mm ESC-POS
                  </Text>
                </View>
              </View>
              <Switch
                value={printerConnected}
                onValueChange={handleTogglePrinter}
                trackColor={{ false: '#cbd5e1', true: colors.primary }}
              />
            </View>

            <View className="flex-row items-center justify-between p-2.5 rounded-xl bg-surfaceContainerLow border border-cardBorder">
              <View className="flex-row items-center gap-2.5 flex-1 mr-2">
                <AppIcon name="barcode_scanner" size={20} color={colors.primary} />
                <View className="flex-1">
                  <Text className="text-xs font-bold text-onSurface">Barcode Scanner</Text>
                  <Text className="text-[11px] text-onSurfaceVariant">
                    Camera & USB Barcode Autofocus
                  </Text>
                </View>
              </View>
              <Switch
                value={scannerActive}
                onValueChange={handleToggleScanner}
                trackColor={{ false: '#cbd5e1', true: colors.primary }}
              />
            </View>
          </View>
        </View>

        {/* Database & Offline Sync */}
        <View className="bg-white rounded-xl p-4 border border-cardBorder shadow-sm mb-4">
          <Text className="text-xs font-bold text-onSurfaceVariant uppercase tracking-wider mb-2">
            Local Ledger & Cloud Mirror
          </Text>
          <Text className="text-xs text-onSurfaceVariant mb-3">
            StockPilot operates 100% offline in high-velocity Nigerian markets. When network connects, all transactions reconcile seamlessly.
          </Text>

          <View className="flex-row items-center justify-between p-3 rounded-xl bg-secondaryContainer/40 mb-3">
            <View className="flex-row items-center gap-2">
              <View className="w-2.5 h-2.5 rounded-full bg-primary" />
              <View>
                <Text className="text-xs font-bold text-onSurface">Production Ledger Active</Text>
                <Text className="text-[11px] text-onSurfaceVariant">
                  {stats.products} SKUs • {stats.customers} Customers • {stats.sales} Sales logged
                </Text>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-[10px] font-bold text-primary uppercase">
                {lastSyncedAt ? 'Synced' : 'Local Only'}
              </Text>
              <Text className="text-[10px] text-onSurfaceVariant">
                {lastSyncedAt ? `Today ${lastSyncedAt}` : 'Ready for sync'}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={handleBackup}
            disabled={isSyncing}
            className={`w-full h-11 rounded-xl flex-row items-center justify-center gap-2 ${
              isSyncing ? 'bg-primary/70' : 'bg-primary active:bg-primaryContainer'
            }`}
          >
            {isSyncing ? (
              <>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text className="text-xs font-semibold text-white">
                  Reconciling with Cloud Mirror...
                </Text>
              </>
            ) : (
              <>
                <AppIcon name="bolt" size={16} color="#ffffff" />
                <Text className="text-xs font-semibold text-white">
                  Sync Database with Cloud Mirror
                </Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Data & Demo Management */}
        <View className="bg-white rounded-xl p-4 border border-cardBorder shadow-sm mb-4">
          <Text className="text-xs font-bold text-onSurfaceVariant uppercase tracking-wider mb-2">
            Database & Data Management
          </Text>
          <Text className="text-xs text-onSurfaceVariant mb-3">
            Purge sample and demo records to start with a clean slate, or re-populate retail starter items.
          </Text>

          <View className="gap-2">
            <Pressable
              onPress={handleClearDemoData}
              disabled={isResetting}
              className="w-full h-11 rounded-xl bg-errorContainer items-center justify-center flex-row gap-2 active:opacity-90"
            >
              <AppIcon name="delete_sweep" size={16} color={colors.error} />
              <Text className="text-xs font-bold text-onErrorContainer">
                Clear All Demo Records (Start Fresh)
              </Text>
            </Pressable>

            <Pressable
              onPress={handleLoadSampleCatalog}
              disabled={isResetting}
              className="w-full h-10 rounded-xl bg-surfaceContainerLow border border-cardBorder items-center justify-center flex-row gap-2 active:bg-surfaceContainer"
            >
              <AppIcon name="inventory_2" size={15} color={colors.primary} />
              <Text className="text-xs font-semibold text-primary">
                Load Standard Sample FMCG Staples
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Footer Brand Identity */}
        <View className="items-center py-4 mb-4">
          <BrandLogo variant="full" width={120} className="mb-2" />
          <Text className="text-xs font-bold text-onSurfaceVariant">
            StockPilot Nigeria Business Manager
          </Text>
          <Text className="text-[11px] text-outline mt-0.5">
            Production Build 1.0.1 • CBN & CAC Compliant Architecture
          </Text>
        </View>
      </View>
    </View>
  </View>
</ScrollView>

      {/* Edit Store Profile Modal */}
      <Modal
        visible={showEditProfileModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditProfileModal(false)}
      >
        <View className={`flex-1 bg-black/60 ${isWide ? 'justify-center items-center p-4' : 'justify-end'}`}>
          <View className={`bg-white p-5 ${isWide ? 'w-full max-w-lg rounded-3xl max-h-[85%] border border-cardBorder shadow-2xl' : 'rounded-t-3xl max-h-[85%]'}`}>
            <View className="w-12 h-1 bg-outlineVariant rounded-full self-center mb-3" />
            <View className="flex-row items-center justify-between pb-3 border-b border-cardBorder mb-4">
              <View>
                <Text className="text-base font-bold text-onSurface">Edit Business Profile</Text>
                <Text className="text-xs text-onSurfaceVariant">
                  Update your trading details, receipts, and market stalls
                </Text>
              </View>
              <Pressable
                onPress={() => setShowEditProfileModal(false)}
                className="w-8 h-8 rounded-full items-center justify-center active:bg-surfaceContainer"
              >
                <AppIcon name="close" size={20} color={colors.onSurface} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="gap-3.5 mb-4">
              <View>
                <Text className="text-xs font-bold text-onSurface mb-1">Business / Shop Name *</Text>
                <TextInput
                  value={editBusinessName}
                  onChangeText={setEditBusinessName}
                  placeholder="e.g. Adeyemi Wholesale Stores"
                  placeholderTextColor={colors.outline}
                  className="bg-surfaceContainerLow border border-cardBorder rounded-xl px-3 h-11 text-xs text-onSurface"
                />
              </View>

              <View>
                <Text className="text-xs font-bold text-onSurface mb-1">Owner / Manager Name</Text>
                <TextInput
                  value={editOwnerName}
                  onChangeText={setEditOwnerName}
                  placeholder="e.g. Babatunde Adeyemi"
                  placeholderTextColor={colors.outline}
                  className="bg-surfaceContainerLow border border-cardBorder rounded-xl px-3 h-11 text-xs text-onSurface"
                />
              </View>

              <View>
                <Text className="text-xs font-bold text-onSurface mb-1">Primary Phone Number</Text>
                <TextInput
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="e.g. +234 803 123 4567"
                  placeholderTextColor={colors.outline}
                  keyboardType="phone-pad"
                  className="bg-surfaceContainerLow border border-cardBorder rounded-xl px-3 h-11 text-xs text-onSurface"
                />
              </View>

              <View>
                <Text className="text-xs font-bold text-onSurface mb-1">
                  CAC Reg Number (Optional)
                </Text>
                <TextInput
                  value={editCac}
                  onChangeText={setEditCac}
                  placeholder="e.g. BN-1234567 or Unregistered"
                  placeholderTextColor={colors.outline}
                  className="bg-surfaceContainerLow border border-cardBorder rounded-xl px-3 h-11 text-xs text-onSurface"
                />
              </View>

              <View>
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-xs font-bold text-onSurface">Market Location / Hub</Text>
                  <Text className="text-[10px] text-onSurfaceVariant">Type manually or tap preset</Text>
                </View>
                <TextInput
                  value={editLocation}
                  onChangeText={setEditLocation}
                  placeholder="e.g. Idumota Wholesale Market, Lagos"
                  placeholderTextColor={colors.outline}
                  className="bg-surfaceContainerLow border border-cardBorder rounded-xl px-3 h-11 text-xs text-onSurface"
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-1.5 flex-row gap-1.5 py-1">
                  {TRADING_HUBS.map((hub) => {
                    const isSelected = editLocation === hub;
                    return (
                      <Pressable
                        key={hub}
                        onPress={() => setEditLocation(hub)}
                        className={`px-2.5 py-1 rounded-full border ${
                          isSelected
                            ? 'bg-primary border-primary'
                            : 'bg-surfaceContainer border-cardBorder active:bg-secondaryContainer'
                        }`}
                      >
                        <Text
                          className={`text-[10px] font-medium ${
                            isSelected ? 'text-white font-bold' : 'text-onSurfaceVariant'
                          }`}
                        >
                          {hub}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              <View>
                <Text className="text-xs font-bold text-onSurface mb-1">Registered Market Stall</Text>
                <TextInput
                  value={editStall}
                  onChangeText={setEditStall}
                  placeholder="e.g. Stall #14, Block B"
                  placeholderTextColor={colors.outline}
                  className="bg-surfaceContainerLow border border-cardBorder rounded-xl px-3 h-11 text-xs text-onSurface"
                />
              </View>
            </ScrollView>

            <Pressable
              onPress={handleSaveProfile}
              className="w-full h-12 rounded-xl bg-primary items-center justify-center active:bg-primaryContainer"
            >
              <Text className="text-sm font-bold text-white">Save Changes</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Add Settlement Account Modal */}
      <Modal
        visible={showAddAccountModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddAccountModal(false)}
      >
        <View className={`flex-1 bg-black/60 ${isWide ? 'justify-center items-center p-4' : 'justify-end'}`}>
          <View className={`bg-white p-5 ${isWide ? 'w-full max-w-lg rounded-3xl max-h-[85%] border border-cardBorder shadow-2xl' : 'rounded-t-3xl max-h-[85%]'}`}>
            <View className="w-12 h-1 bg-outlineVariant rounded-full self-center mb-3" />
            <View className="flex-row items-center justify-between pb-3 border-b border-cardBorder mb-4">
              <View>
                <Text className="text-base font-bold text-onSurface">Add Settlement Bank</Text>
                <Text className="text-xs text-onSurfaceVariant">
                  Link an official account for receipts and POS settlement
                </Text>
              </View>
              <Pressable
                onPress={() => setShowAddAccountModal(false)}
                className="w-8 h-8 rounded-full items-center justify-center active:bg-surfaceContainer"
              >
                <AppIcon name="close" size={20} color={colors.onSurface} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="gap-3.5 mb-4">
              <View>
                <Text className="text-xs font-bold text-onSurface mb-1">Select Bank *</Text>
                <Pressable
                  onPress={() => setShowBankPicker(!showBankPicker)}
                  className="bg-surfaceContainerLow border border-cardBorder rounded-xl px-3 h-11 flex-row items-center justify-between"
                >
                  <Text className="text-xs font-bold text-onSurface">{selectedBank}</Text>
                  <AppIcon name="arrow_drop_down" size={20} color={colors.onSurfaceVariant} />
                </Pressable>

                {showBankPicker && (
                  <View className="bg-white border border-cardBorder rounded-xl mt-1 max-h-40 overflow-hidden shadow-sm">
                    <ScrollView nestedScrollEnabled>
                      {NIGERIAN_BANKS.map((b) => (
                        <Pressable
                          key={b}
                          onPress={() => {
                            setSelectedBank(b);
                            setShowBankPicker(false);
                          }}
                          className={`p-2.5 border-b border-cardBorder ${
                            selectedBank === b ? 'bg-secondaryContainer' : ''
                          }`}
                        >
                          <Text
                            className={`text-xs ${
                              selectedBank === b ? 'font-bold text-secondary' : 'text-onSurface'
                            }`}
                          >
                            {b}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              <View>
                <Text className="text-xs font-bold text-onSurface mb-1">
                  NUBAN Account Number (10 Digits) *
                </Text>
                <TextInput
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                  placeholder="e.g. 0123456789"
                  placeholderTextColor={colors.outline}
                  keyboardType="number-pad"
                  maxLength={10}
                  className="bg-surfaceContainerLow border border-cardBorder rounded-xl px-3 h-11 text-xs font-mono text-onSurface"
                />
              </View>

              <View>
                <Text className="text-xs font-bold text-onSurface mb-1">
                  Registered Account / Beneficiary Name *
                </Text>
                <TextInput
                  value={accountName}
                  onChangeText={setAccountName}
                  placeholder="e.g. ADEWALE TRADING ENTERPRISES"
                  placeholderTextColor={colors.outline}
                  autoCapitalize="characters"
                  className="bg-surfaceContainerLow border border-cardBorder rounded-xl px-3 h-11 text-xs text-onSurface"
                />
              </View>

              <View>
                <Text className="text-xs font-bold text-onSurface mb-1">Account Purpose</Text>
                <View className="flex-row gap-2">
                  {(['Till POS', 'Current', 'Savings'] as const).map((type) => (
                    <Pressable
                      key={type}
                      onPress={() => setAccountType(type)}
                      className={`flex-1 py-2 rounded-lg items-center border ${
                        accountType === type
                          ? 'bg-secondaryContainer border-secondary'
                          : 'bg-surfaceContainerLow border-cardBorder'
                      }`}
                    >
                      <Text
                        className={`text-xs ${
                          accountType === type
                            ? 'font-bold text-onSecondaryContainer'
                            : 'text-onSurfaceVariant'
                        }`}
                      >
                        {type}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View className="flex-row items-center justify-between p-3 rounded-xl bg-surfaceContainerLow border border-cardBorder">
                <View>
                  <Text className="text-xs font-bold text-onSurface">Set as Default Account</Text>
                  <Text className="text-[11px] text-onSurfaceVariant">
                    Display prominently on invoices and receipts
                  </Text>
                </View>
                <Switch
                  value={isDefaultAccount}
                  onValueChange={setIsDefaultAccount}
                  trackColor={{ false: '#cbd5e1', true: colors.primary }}
                />
              </View>
            </ScrollView>

            <Pressable
              onPress={handleSaveAccount}
              className="w-full h-12 rounded-xl bg-primary items-center justify-center active:bg-primaryContainer"
            >
              <Text className="text-sm font-bold text-white">Save Account</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
