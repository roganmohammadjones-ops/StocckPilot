import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Linking,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/app-header';
import { AppIcon } from '@/components/icon';
import { colors } from '@/lib/theme';
import { useDataRefresh, useAppDb } from '@/lib/db/provider';
import { getProducts, updateProductStock } from '@/lib/db/queries';
import type { Product } from '@/lib/db/types';

interface SellerStall {
  id: string;
  name: string;
  market: string;
  tier: string;
  rating: string;
  tradeCount: string;
  waybill: string;
  phone: string;
  skus: { name: string; price: string; numPrice: number; targetSku: string }[];
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
      { name: 'Dangote Sugar 50kg (Bag)', price: '₦74,500', numPrice: 74500, targetSku: 'DNG-SUG-50' },
      { name: 'Peak Milk Powder Carton (24x400g)', price: '₦34,200', numPrice: 34200, targetSku: 'PEAK-CAN-48' },
      { name: 'Golden Penny Semo 10kg', price: '₦36,000', numPrice: 36000, targetSku: 'SEMO-10KG' },
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
      { name: 'White Clean Maize 100kg', price: '₦58,000', numPrice: 58000, targetSku: 'DNG-SUG-50' },
      { name: 'Sorghum Bag 100kg', price: '₦62,000', numPrice: 62000, targetSku: 'SEMO-10KG' },
      { name: 'Brown Beans 50kg', price: '₦88,000', numPrice: 88000, targetSku: 'DNG-SUG-50' },
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
      { name: 'Indomie Super Pack (40 pkts)', price: '₦12,400', numPrice: 12400, targetSku: 'IND-SUP-40' },
      { name: 'Mamador Vegetable Oil 25L', price: '₦58,500', numPrice: 58500, targetSku: 'DNG-SUG-50' },
      { name: 'Gino Tomato Paste 50x70g', price: '₦20,500', numPrice: 20500, targetSku: 'GINO-TOM-50' },
    ],
  },
];

export default function ExploreSellersScreen() {
  const router = useRouter();
  const db = useAppDb();
  const { triggerRefresh } = useDataRefresh();

  const [search, setSearch] = useState('');
  const [selectedMarket, setSelectedMarket] = useState('All Markets');
  const [products, setProducts] = useState<Product[]>([]);

  // Reorder Modal State
  const [activeSeller, setActiveSeller] = useState<SellerStall | null>(null);
  const [selectedSkuIndex, setSelectedSkuIndex] = useState(0);
  const [orderQuantity, setOrderQuantity] = useState('10');
  const [isInwarding, setIsInwarding] = useState(false);

  useEffect(() => {
    async function loadProducts() {
      try {
        const prods = await getProducts(db);
        setProducts(prods);
      } catch (e) {
        console.error('Failed to load products in explore sellers:', e);
      }
    }
    loadProducts();
  }, [db]);

  const filteredSellers = mockSellers.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.market.toLowerCase().includes(search.toLowerCase());
    const matchesMarket =
      selectedMarket === 'All Markets' || s.market.includes(selectedMarket);
    return matchesSearch && matchesMarket;
  });

  const handleOpenOrder = (seller: SellerStall) => {
    setActiveSeller(seller);
    setSelectedSkuIndex(0);
    setOrderQuantity('10');
  };

  const handleInwardStock = async () => {
    if (!activeSeller) return;
    const qty = parseInt(orderQuantity.replace(/[^0-9]/g, '') || '0', 10);
    if (!qty || qty <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid stock quantity.');
      return;
    }

    const skuItem = activeSeller.skus[selectedSkuIndex];
    // Find matching product in local SQLite
    const matchedProduct = products.find(
      (p) => p.sku === skuItem.targetSku || p.name.includes(skuItem.name.split(' ')[0])
    ) || products[0];

    setIsInwarding(true);
    try {
      if (matchedProduct) {
        await updateProductStock(db, matchedProduct.id, qty);
      }
      triggerRefresh();
      setActiveSeller(null);
      Alert.alert(
        'Stock Inwarded Successfully',
        `+${qty} units of ${skuItem.name} added to your local warehouse inventory.`,
        [
          { text: 'View Inventory', onPress: () => router.push('/(tabs)/inventory') },
          { text: 'OK' },
        ]
      );
    } catch (e: any) {
      Alert.alert('Inwarding Error', e?.message || 'Failed to update warehouse stock.');
    } finally {
      setIsInwarding(false);
    }
  };

  const handleSendPOWhatsApp = () => {
    if (!activeSeller) return;
    const qty = parseInt(orderQuantity.replace(/[^0-9]/g, '') || '0', 10);
    const skuItem = activeSeller.skus[selectedSkuIndex];
    const totalOrderCost = (qty * skuItem.numPrice).toLocaleString();

    const poMessage = `*PURCHASE ORDER: WAYBILL REQUEST*%0A` +
      `--------------------------------%0A` +
      `*To:* ${activeSeller.name}%0A` +
      `*From:* Bamidele & Sons Provisions (Balogun Market, Lagos)%0A` +
      `*Item:* ${skuItem.name}%0A` +
      `*Quantity:* ${qty} units%0A` +
      `*Gate Rate:* ${skuItem.price}%0A` +
      `*Est. Total:* ₦${totalOrderCost}%0A` +
      `*Waybill Term:* ${activeSeller.waybill}%0A` +
      `--------------------------------%0A` +
      `Kindly confirm dispatch timing and account details for transfer.`;

    Linking.openURL(`https://wa.me/${activeSeller.phone.replace(/[^0-9]/g, '')}?text=${poMessage}`);
    setActiveSeller(null);
  };

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

          {/* Quick Metrics */}
          <View className="flex-row gap-2 pt-2 border-t border-cardBorder">
            <View className="flex-1 bg-white p-2.5 rounded-xl border border-cardBorder">
              <Text className="text-[10px] text-onSurfaceVariant">Verified Depots</Text>
              <Text className="text-base font-bold text-onSurface mt-0.5">5,400+ Stalls</Text>
            </View>
            <View className="flex-1 bg-white p-2.5 rounded-xl border border-cardBorder">
              <Text className="text-[10px] text-onSurfaceVariant">Waybill Speed</Text>
              <Text className="text-base font-bold text-primary mt-0.5">Same-day / 24h</Text>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View className="relative flex-row items-center mb-3">
          <View className="absolute left-3 z-10">
            <AppIcon name="search" size={18} color={colors.slateMuted} />
          </View>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search stalls, markets, or commodities..."
            placeholderTextColor={colors.slateMuted}
            className="w-full h-11 pl-9 pr-4 bg-white rounded-xl border border-cardBorder text-sm text-onSurface shadow-xs"
          />
        </View>

        {/* Market Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6 }}
          className="mb-4"
        >
          {['All Markets', 'Idumota Block B', 'Dawanau Grain', 'Trade Fair'].map((mkt) => (
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
                    onPress={() => handleOpenOrder(seller)}
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

      {/* Reorder / Inwarding Modal */}
      <Modal
        visible={Boolean(activeSeller)}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveSeller(null)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-5 border-t border-cardBorder max-h-[85%]">
            <View className="w-12 h-1 bg-outlineVariant rounded-full self-center mb-3" />

            <View className="flex-row items-center justify-between mb-3">
              <View>
                <Text className="text-lg font-bold text-onSurface">Wholesale Reorder</Text>
                <Text className="text-xs text-onSurfaceVariant">{activeSeller?.name}</Text>
              </View>
              <Pressable
                onPress={() => setActiveSeller(null)}
                className="w-8 h-8 rounded-full bg-surfaceContainer items-center justify-center"
              >
                <AppIcon name="close" size={18} color={colors.onSurfaceVariant} />
              </Pressable>
            </View>

            {/* Select SKU to reorder */}
            <Text className="text-xs font-semibold text-onSurfaceVariant mb-1.5">
              Select Commodity to Reorder:
            </Text>
            <View className="gap-2 mb-3">
              {activeSeller?.skus.map((item, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => setSelectedSkuIndex(idx)}
                  className={`p-2.5 rounded-xl border flex-row items-center justify-between ${
                    selectedSkuIndex === idx
                      ? 'bg-secondaryContainer/50 border-primary'
                      : 'bg-surfaceContainerLow border-cardBorder'
                  }`}
                >
                  <Text
                    className={`text-xs ${
                      selectedSkuIndex === idx ? 'font-bold text-primary' : 'text-onSurface'
                    }`}
                  >
                    {item.name}
                  </Text>
                  <Text className="text-xs font-bold text-onSurface">{item.price}</Text>
                </Pressable>
              ))}
            </View>

            {/* Quantity Input */}
            <Text className="text-xs font-semibold text-onSurfaceVariant mb-1">
              Order Quantity:
            </Text>
            <TextInput
              value={orderQuantity}
              onChangeText={setOrderQuantity}
              keyboardType="numeric"
              placeholder="10"
              className="w-full h-11 px-3 bg-surfaceContainerLow rounded-xl border border-cardBorder text-base font-bold text-onSurface mb-3"
            />

            {/* Total Cost Card */}
            {activeSeller && (
              <View className="bg-surfaceContainerLow p-3 rounded-xl mb-4 flex-row items-center justify-between">
                <Text className="text-xs text-onSurfaceVariant">Estimated Order Cost:</Text>
                <Text className="text-base font-bold text-primary">
                  ₦
                  {(
                    (parseInt(orderQuantity || '0', 10) || 0) *
                    activeSeller.skus[selectedSkuIndex].numPrice
                  ).toLocaleString()}
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            <View className="flex-col gap-2">
              <View className="flex-row gap-2">
                <Pressable
                  onPress={handleInwardStock}
                  disabled={isInwarding}
                  className={`flex-1 h-12 bg-primary rounded-xl items-center justify-center flex-row gap-1.5 active:bg-primaryContainer shadow-xs ${
                    isInwarding ? 'opacity-60' : ''
                  }`}
                >
                  <AppIcon name="inventory_2" size={18} color="#ffffff" />
                  <Text className="text-xs font-bold text-white">
                    {isInwarding ? 'Inwarding...' : 'Inward to Warehouse'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleSendPOWhatsApp}
                  className="flex-1 h-12 bg-secondaryContainer rounded-xl items-center justify-center flex-row gap-1.5 active:opacity-90 shadow-xs"
                >
                  <AppIcon name="chat" size={18} color={colors.onSecondaryContainer} />
                  <Text className="text-xs font-bold text-onSecondaryContainer">
                    WhatsApp PO
                  </Text>
                </Pressable>
              </View>

              <Pressable
                onPress={() => {
                  setActiveSeller(null);
                  router.push('/order-review');
                }}
                className="w-full h-11 bg-surfaceContainer border border-cardBorder rounded-xl items-center justify-center flex-row gap-1.5 active:bg-surfaceContainerHigh"
              >
                <AppIcon name="shopping_cart_checkout" size={16} color={colors.primary} />
                <Text className="text-xs font-bold text-primary">
                  Review Batch Order & Direct Checkout (Stitch Flow)
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
