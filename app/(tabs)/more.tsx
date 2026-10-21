import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { AppHeader } from '@/components/app-header';
import { AppIcon } from '@/components/icon';
import { BrandLogo } from '@/components/brand-logo';
import { colors } from '@/lib/theme';
import { useDataRefresh } from '@/lib/db/provider';
import { getStoredUser, logout } from '@/lib/auth';

interface MenuItem {
  title: string;
  description: string;
  icon: string;
  iconColor: string;
  route: string;
  badge?: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export default function MoreHubScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { dataVersion } = useDataRefresh();
  const [productCount, setProductCount] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);
  const user = getStoredUser();

  useEffect(() => {
    async function loadData() {
      try {
        const [prod, cust] = await Promise.all([
          db.getFirstAsync<{ count: number }>('SELECT count(*) as count FROM products'),
          db.getFirstAsync<{ count: number }>('SELECT count(*) as count FROM customers'),
        ]);
        setProductCount(prod?.count ?? 0);
        setCustomerCount(cust?.count ?? 0);
      } catch (e) {
        console.error('Failed to load more screen stats:', e);
      }
    }
    loadData();
  }, [db, dataVersion]);

  const handleLogout = () => {
    logout();
    router.replace('/onboarding');
  };

  const menuSections: MenuSection[] = [
    {
      title: 'Operations & Sourcing',
      items: [
        {
          title: 'Explore Market Sellers',
          description: 'Direct trade link with Idumota, Trade Fair & Kano stalls',
          icon: 'near_me',
          iconColor: colors.primary,
          route: '/explore-sellers',
          badge: '5,400+ Stalls',
        },
        {
          title: 'Reports & P&L Analytics',
          description: 'True landed margins, expense burn, and collection rates',
          icon: 'analytics',
          iconColor: colors.secondary,
          route: '/reports',
          badge: 'Audited',
        },
        {
          title: 'Record Expense Outflow',
          description: 'Log diesel, generator, market union & attendant costs',
          icon: 'wallet',
          iconColor: colors.error,
          route: '/modal/record-expense',
        },
      ],
    },
    {
      title: 'Stitch Flow & Experience',
      items: [
        {
          title: 'Launch & Splash Screen',
          description: 'View the animated fintech offline initialization and node telemetry',
          icon: 'bolt',
          iconColor: colors.primary,
          route: '/launch',
          badge: 'Stitch Screen',
        },
        {
          title: 'Welcome & Onboarding Tour',
          description: 'Value proposition, live register snapshot & Lagos trade pillars',
          icon: 'inventory',
          iconColor: colors.secondary,
          route: '/onboarding',
          badge: 'Stitch Screen',
        },
        {
          title: 'Wholesale Cart & Order Review',
          description: 'Dangote Sugar & Peak Milk bulk purchase review with depot pickup',
          icon: 'receipt_long',
          iconColor: colors.tertiary,
          route: '/order-review',
          badge: 'Stitch Screen',
        },
        {
          title: 'Phone OTP Verification',
          description: 'WhatsApp & SMS 6-digit identity verification and trade credits',
          icon: 'chat',
          iconColor: colors.primary,
          route: '/otp-verify',
          badge: 'Stitch Screen',
        },
      ],
    },
    {
      title: 'Store Administration',
      items: [
        {
          title: 'Store Settings & Cloud Sync',
          description: 'Manage Idumota warehouse, cash till accounts & Supabase mirror',
          icon: 'warehouse',
          iconColor: colors.tertiary,
          route: '/settings',
        },
        {
          title: 'Foundation Check',
          description: 'Verify NativeWind styling, device offline storage and build',
          icon: 'verified_user',
          iconColor: colors.onSurfaceVariant,
          route: '/setup-check',
        },
      ],
    },
  ];

  return (
    <View className="flex-1 bg-surface">
      <AppHeader />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 }}
      >
        {/* Merchant Profile Snapshot */}
        <View className="bg-white rounded-xl p-4 border border-cardBorder shadow-sm mb-5">
          <View className="flex-row items-center gap-3">
            <View className="w-14 h-14 rounded-2xl bg-secondaryContainer/50 items-center justify-center border border-cardBorder shadow-sm overflow-hidden">
              <BrandLogo variant="emblem" size={38} />
            </View>
            <View className="flex-1 min-w-0">
              <View className="flex-row items-center gap-1.5">
                <Text className="text-base font-bold text-onSurface truncate">
                  {user?.businessName || 'Bamidele & Sons Provisions'}
                </Text>
                <AppIcon name="verified" size={16} color={colors.primary} />
              </View>
              <Text className="text-xs text-onSurfaceVariant mt-0.5 truncate">
                {user?.tradeHub || 'Idumota Wholesale Depot • Counter Till #1'}
              </Text>
              <View className="flex-row items-center gap-2 mt-1 flex-wrap">
                <View className="px-2 py-0.5 rounded bg-secondaryContainer">
                  <Text className="text-[10px] font-bold text-onSecondaryContainer">
                    {user?.isDemo ? 'Demo Mode' : 'Tier 1 Merchant'}
                  </Text>
                </View>
                <Text className="text-[11px] text-outline">
                  {productCount} SKUs • {customerCount} Customers
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Menu Navigation Sections */}
        {menuSections.map((section, idx) => (
          <View key={idx} className="mb-5">
            <Text className="text-xs font-bold text-onSurfaceVariant uppercase tracking-wider mb-2 px-1">
              {section.title}
            </Text>
            <View className="bg-white rounded-xl border border-cardBorder shadow-sm overflow-hidden divide-y divide-cardBorder">
              {section.items.map((item, itemIdx) => (
                <Pressable
                  key={itemIdx}
                  onPress={() => router.push(item.route as any)}
                  className="p-3.5 flex-row items-center justify-between active:bg-surfaceContainer"
                >
                  <View className="flex-row items-center gap-3 flex-1 mr-2">
                    <View className="w-10 h-10 rounded-xl bg-surfaceContainerLow items-center justify-center">
                      <AppIcon name={item.icon} size={22} color={item.iconColor} />
                    </View>
                    <View className="flex-1 min-w-0">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-sm font-bold text-onSurface">
                          {item.title}
                        </Text>
                        {item.badge && (
                          <View className="px-1.5 py-0.2 rounded bg-secondaryContainer">
                            <Text className="text-[10px] font-bold text-onSecondaryContainer">
                              {item.badge}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-xs text-onSurfaceVariant truncate mt-0.5">
                        {item.description}
                      </Text>
                    </View>
                  </View>
                  <AppIcon name="chevron_right" size={18} color={colors.outline} />
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        {/* Session Actions: Switch Account / Sign Out */}
        <View className="mb-6 gap-2">
          <Pressable
            onPress={() => router.push('/login')}
            className="w-full h-11 rounded-xl bg-white border border-cardBorder items-center justify-center active:bg-surfaceContainer shadow-xs"
          >
            <Text className="text-xs font-bold text-primary">Switch Account / Sign In</Text>
          </Pressable>

          <Pressable
            onPress={handleLogout}
            className="w-full h-11 rounded-xl bg-errorContainer items-center justify-center active:opacity-90 shadow-xs"
          >
            <Text className="text-xs font-bold text-onErrorContainer">
              Log Out & Return to Onboarding
            </Text>
          </Pressable>
        </View>

        {/* System Version & Node ID */}
        <View className="items-center py-4">
          <BrandLogo variant="full" width={110} className="mb-2" />
          <Text className="text-xs font-bold text-onSurfaceVariant">
            StockPilot Nigeria Business Manager
          </Text>
          <Text className="text-[11px] text-outline mt-0.5">
            Version 1.0.0 • Verified for Nigerian Wholesale Trade
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
