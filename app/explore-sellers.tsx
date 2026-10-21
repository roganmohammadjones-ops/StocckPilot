import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/app-header';
import { AppIcon } from '@/components/icon';
import { colors } from '@/lib/theme';

interface SellerStall {
  id: string;
  name: string;
  market: string;
  tier: string;
  rating: string;
  tradeCount: string;
  waybill: string;
  phone: string;
  skus: { name: string; price: string }[];
}

const mockSellers: SellerStall[] = [
  {
    id: '1',
    name: 'Bamidele & Sons Direct Depot',
    market: 'Idumota Block B, Lagos',
    tier: 'Wholesale Tier 1',
    rating: '★ 4.9',
    tradeCount: '320+ verified trades',
    waybill: 'Same-day Waybill',
    phone: '+2348034918820',
    skus: [
      { name: 'Dangote Sugar 50kg (Bag)', price: '₦74,500' },
      { name: 'Peak Milk Powder Carton (24x400g)', price: '₦34,200' },
      { name: 'Golden Penny Semo 10kg', price: '₦36,000' },
    ],
  },
  {
    id: '2',
    name: 'Kano Dawanau Grain Apex',
    market: 'Dawanau Grain Market, Kano',
    tier: 'Primary Grain Depot',
    rating: '★ 4.8',
    tradeCount: '840+ interstate waybills',
    waybill: 'Interstate Rail & Truck',
    phone: '+2348145550221',
    skus: [
      { name: 'White Clean Maize 100kg', price: '₦58,000' },
      { name: 'Sorghum Bag 100kg', price: '₦62,000' },
      { name: 'Brown Beans 50kg', price: '₦88,000' },
    ],
  },
  {
    id: '3',
    name: 'Trade Fair Provisions Direct Hub',
    market: 'Trade Fair Complex, Badagry Exp.',
    tier: 'FMCG Mega Distributor',
    rating: '★ 4.9',
    tradeCount: '510+ bulk orders',
    waybill: 'Lagos Island Delivery',
    phone: '+2348029910044',
    skus: [
      { name: 'Indomie Super Pack (40 pkts)', price: '₦12,400' },
      { name: 'Mamador Vegetable Oil 25L', price: '₦58,500' },
      { name: 'Gino Tomato Paste 50x70g', price: '₦20,500' },
    ],
  },
];

export default function ExploreSellersScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedMarket, setSelectedMarket] = useState('All Markets');

  const filteredSellers = mockSellers.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.market.toLowerCase().includes(search.toLowerCase());
    const matchesMarket =
      selectedMarket === 'All Markets' || s.market.includes(selectedMarket);
    return matchesSearch && matchesMarket;
  });

  return (
    <View className="flex-1 bg-surface">
      <AppHeader title="Explore Wholesalers" subtitle="Direct Nigerian Market Stalls" showBack />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 }}
      >
        {/* Value Proposition & Warm Welcome Banner */}
        <View className="bg-surfaceContainerHigh rounded-2xl p-4 shadow-sm mb-4">
          <View className="self-start flex-row items-center gap-1.5 bg-secondaryContainer px-2.5 py-1 rounded-full mb-2">
            <AppIcon name="verified" size={14} color={colors.onSecondaryContainer} />
            <Text className="text-[10px] font-bold text-onSecondaryContainer uppercase">
              Nationwide Trade Link
            </Text>
          </View>
          <Text className="text-base font-bold text-onSurface leading-snug mb-1">
            Connect Directly with Verified Wholesalers in Lagos, Kano & Onitsha
          </Text>
          <Text className="text-xs text-onSurfaceVariant mb-3">
            Source directly from primary market stalls at real gate rates. Cut out agent fees and protect your shop margins.
          </Text>

          {/* 3 Trust Highlights */}
          <View className="flex-row gap-2">
            <View className="flex-1 bg-white p-2 rounded-xl items-center shadow-xs">
              <Text className="text-sm font-bold text-primary">5,400+</Text>
              <Text className="text-[10px] text-onSurfaceVariant text-center">Verified Sellers</Text>
            </View>
            <View className="flex-1 bg-white p-2 rounded-xl items-center shadow-xs">
              <Text className="text-sm font-bold text-secondary">0%</Text>
              <Text className="text-[10px] text-onSurfaceVariant text-center">Middleman Cut</Text>
            </View>
            <View className="flex-1 bg-white p-2 rounded-xl items-center shadow-xs">
              <Text className="text-sm font-bold text-tertiary">Daily</Text>
              <Text className="text-[10px] text-onSurfaceVariant text-center">Gate Rates</Text>
            </View>
          </View>
        </View>

        {/* Search Input */}
        <View className="relative flex-row items-center mb-3">
          <View className="absolute left-3 z-10">
            <AppIcon name="search" size={18} color={colors.slateMuted} />
          </View>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search products (e.g. Dangote Sugar) or seller..."
            placeholderTextColor={colors.slateMuted}
            className="w-full h-11 pl-9 pr-4 bg-white rounded-xl border border-cardBorder text-xs text-onSurface shadow-xs"
          />
        </View>

        {/* Market Centers (Horizontal Pills) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6 }}
          className="mb-4"
        >
          {['All Markets', 'Idumota', 'Trade Fair', 'Dawanau', 'Balogun', 'Alaba'].map((mkt) => (
            <Pressable
              key={mkt}
              onPress={() => setSelectedMarket(mkt)}
              className={`px-3 py-1.5 rounded-full active:scale-95 ${
                selectedMarket === mkt
                  ? 'bg-primary'
                  : 'bg-white border border-cardBorder'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  selectedMarket === mkt ? 'text-white' : 'text-onSurface'
                }`}
              >
                {mkt}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Directory Results Feed */}
        <View className="mb-2">
          <Text className="text-xs font-bold text-onSurfaceVariant uppercase tracking-wider mb-2.5">
            Featured Open Stalls (Live Stock Feed)
          </Text>

          <View className="gap-3.5">
            {filteredSellers.map((seller) => (
              <View
                key={seller.id}
                className="bg-white rounded-xl p-4 border border-cardBorder shadow-sm gap-3"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-row items-start gap-2.5 flex-1 mr-2">
                    <View className="w-12 h-12 rounded-xl bg-primary items-center justify-center">
                      <AppIcon name="warehouse" size={24} color="#ffffff" />
                    </View>
                    <View className="flex-1 min-w-0">
                      <View className="flex-row items-center gap-1.5">
                        <Text className="text-sm font-bold text-onSurface truncate">
                          {seller.name}
                        </Text>
                        <AppIcon name="verified" size={15} color={colors.primary} />
                      </View>
                      <View className="flex-row items-center gap-1.5 mt-0.5">
                        <View className="bg-secondaryContainer px-1.5 py-0.2 rounded">
                          <Text className="text-[10px] font-bold text-onSecondaryContainer">
                            {seller.tier}
                          </Text>
                        </View>
                        <Text className="text-[11px] text-onSurfaceVariant truncate">
                          {seller.market}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-1.5 mt-1">
                        <Text className="text-xs font-bold text-amber-600">{seller.rating}</Text>
                        <Text className="text-xs text-outline">•</Text>
                        <Text className="text-xs text-secondary font-medium">
                          {seller.tradeCount}
                        </Text>
                        <Text className="text-xs text-outline">•</Text>
                        <Text className="text-xs text-onSurfaceVariant">{seller.waybill}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* SKU Snapshot Table */}
                <View className="bg-surfaceContainerLow rounded-xl p-3 gap-2">
                  <View className="flex-row items-center justify-between pb-1 border-b border-cardBorder">
                    <Text className="text-[11px] font-bold text-onSurfaceVariant">
                      Verified Real-time Gate Price
                    </Text>
                    <Text className="text-[10px] font-semibold text-primary">
                      Updated 24m ago
                    </Text>
                  </View>
                  {seller.skus.map((sku, skuIdx) => (
                    <View key={skuIdx} className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-1.5 flex-1 mr-2">
                        <AppIcon name="inventory_2" size={14} color={colors.primary} />
                        <Text className="text-xs text-onSurface truncate">{sku.name}</Text>
                      </View>
                      <Text className="text-xs font-bold text-onSurface">{sku.price}</Text>
                    </View>
                  ))}
                </View>

                {/* Direct Connect Buttons */}
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => {
                      Linking.openURL(
                        `https://wa.me/${seller.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(
                          seller.name
                        )},%20I%20am%20inquirying%20about%20your%20gate%20rates%20via%20StockPilot%20Nigeria.`
                      );
                    }}
                    className="flex-1 h-9 rounded-lg bg-primary items-center justify-center flex-row gap-1 active:bg-primaryContainer"
                  >
                    <AppIcon name="chat" size={15} color="#ffffff" />
                    <Text className="text-xs font-semibold text-white">Direct WhatsApp</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => router.push('/modal/new-sale')}
                    className="flex-1 h-9 rounded-lg bg-secondaryContainer items-center justify-center flex-row gap-1 active:opacity-80"
                  >
                    <AppIcon name="shopping_cart" size={15} color={colors.onSecondaryContainer} />
                    <Text className="text-xs font-semibold text-onSecondaryContainer">
                      Place Trade Order
                    </Text>
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
