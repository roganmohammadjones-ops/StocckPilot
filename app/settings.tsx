import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { AppHeader } from '@/components/app-header';
import { AppIcon } from '@/components/icon';
import { colors } from '@/lib/theme';
import { syncDatabaseWithCloud } from '@/lib/db/sync';

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [stats, setStats] = useState({
    products: 0,
    customers: 0,
    sales: 0,
    expenses: 0,
  });

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
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 }}
      >
        {/* Business Profile Card */}
        <View className="bg-white rounded-xl p-4 border border-cardBorder shadow-sm mb-4">
          <View className="flex-row items-center gap-3 mb-3">
            <View className="w-14 h-14 rounded-2xl bg-primary items-center justify-center">
              <AppIcon name="warehouse" size={28} color="#ffffff" />
            </View>
            <View className="flex-1 min-w-0">
              <View className="flex-row items-center gap-1.5">
                <Text className="text-base font-bold text-onSurface truncate">
                  Bamidele & Sons Provisions
                </Text>
                <AppIcon name="verified" size={16} color={colors.primary} />
              </View>
              <Text className="text-xs text-onSurfaceVariant mt-0.5">
                CAC Reg: BN-2894103 • Verified Merchant
              </Text>
              <Text className="text-xs text-outline mt-0.5">
                Idumota Wholesale Market, Block B, Lagos
              </Text>
            </View>
          </View>

          <View className="bg-surfaceContainerLow p-3 rounded-xl gap-2 border border-cardBorder">
            <View className="flex-row justify-between text-xs">
              <Text className="text-xs text-onSurfaceVariant">Primary Phone:</Text>
              <Text className="text-xs font-semibold text-onSurface">+234 803 491 8820</Text>
            </View>
            <View className="flex-row justify-between text-xs">
              <Text className="text-xs text-onSurfaceVariant">Registered Market Stalls:</Text>
              <Text className="text-xs font-semibold text-onSurface">Stall #14 & Stall #15</Text>
            </View>
          </View>
        </View>

        {/* Payment Channels & Bank Accounts */}
        <View className="bg-white rounded-xl p-4 border border-cardBorder shadow-sm mb-4">
          <Text className="text-xs font-bold text-onSurfaceVariant uppercase tracking-wider mb-3">
            Settlement Accounts
          </Text>

          <View className="gap-2.5">
            <View className="bg-surfaceContainerLow p-3 rounded-xl flex-row items-center justify-between border border-cardBorder">
              <View className="flex-row items-center gap-2.5">
                <View className="w-9 h-9 rounded-full bg-tertiary items-center justify-center">
                  <Text className="text-xs font-bold text-white">MP</Text>
                </View>
                <View>
                  <Text className="text-xs font-bold text-onSurface">Moniepoint MFB</Text>
                  <Text className="text-xs font-mono text-onSurfaceVariant">
                    8219044812 • Active Till POS
                  </Text>
                </View>
              </View>
              <View className="px-2 py-0.5 rounded bg-secondaryContainer">
                <Text className="text-[10px] font-bold text-onSecondaryContainer">
                  Default
                </Text>
              </View>
            </View>

            <View className="bg-surfaceContainerLow p-3 rounded-xl flex-row items-center justify-between border border-cardBorder">
              <View className="flex-row items-center gap-2.5">
                <View className="w-9 h-9 rounded-full bg-primary items-center justify-center">
                  <Text className="text-xs font-bold text-white">AB</Text>
                </View>
                <View>
                  <Text className="text-xs font-bold text-onSurface">Access Bank Plc</Text>
                  <Text className="text-xs font-mono text-onSurfaceVariant">
                    0109923812 • Business Current
                  </Text>
                </View>
              </View>
              <Text className="text-xs font-medium text-outline">Secondary</Text>
            </View>
          </View>
        </View>

        {/* Hardware & Peripherals */}
        <View className="bg-white rounded-xl p-4 border border-cardBorder shadow-sm mb-4">
          <Text className="text-xs font-bold text-onSurfaceVariant uppercase tracking-wider mb-3">
            Hardware & Printers
          </Text>
          <View className="gap-2.5">
            <View className="flex-row items-center justify-between p-2.5 rounded-xl bg-surfaceContainerLow border border-cardBorder">
              <View className="flex-row items-center gap-2.5">
                <AppIcon name="receipt_long" size={20} color={colors.primary} />
                <View>
                  <Text className="text-xs font-bold text-onSurface">Thermal POS Printer</Text>
                  <Text className="text-[11px] text-onSurfaceVariant">
                    Bluetooth 58mm • Connected
                  </Text>
                </View>
              </View>
              <View className="w-2 h-2 rounded-full bg-primary" />
            </View>

            <View className="flex-row items-center justify-between p-2.5 rounded-xl bg-surfaceContainerLow border border-cardBorder">
              <View className="flex-row items-center gap-2.5">
                <AppIcon name="barcode_scanner" size={20} color={colors.primary} />
                <View>
                  <Text className="text-xs font-bold text-onSurface">Barcode Reader</Text>
                  <Text className="text-[11px] text-onSurfaceVariant">
                    Continuous Camera Autofocus
                  </Text>
                </View>
              </View>
              <View className="w-2 h-2 rounded-full bg-primary" />
            </View>
          </View>
        </View>

        {/* Database & Offline Sync */}
        <View className="bg-white rounded-xl p-4 border border-cardBorder shadow-sm mb-5">
          <Text className="text-xs font-bold text-onSurfaceVariant uppercase tracking-wider mb-2">
            Local Ledger & Cloud Mirror
          </Text>
          <Text className="text-xs text-onSurfaceVariant mb-3">
            StockPilot operates 100% offline in bustling Lagos markets. When data network connects, all transactions reconcile seamlessly.
          </Text>

          <View className="flex-row items-center justify-between p-3 rounded-xl bg-secondaryContainer/40 mb-3">
            <View className="flex-row items-center gap-2">
              <View className="w-2.5 h-2.5 rounded-full bg-primary" />
              <View>
                <Text className="text-xs font-bold text-onSurface">Node: Idumota-01</Text>
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
                {lastSyncedAt ? `Today ${lastSyncedAt}` : 'Pending sync'}
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
      </ScrollView>
    </View>
  );
}
