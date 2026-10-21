import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/app-header';
import { AppIcon } from '@/components/icon';
import { colors } from '@/lib/theme';

interface ProductItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  categorySlug: string;
  stockLeft: number;
  stockUnit: string;
  minAlert: number;
  costPrice: number;
  sellingPrice: number;
  status: 'low' | 'healthy' | 'out';
  recentNote: string;
}

const mockProducts: ProductItem[] = [
  {
    id: '1',
    name: 'Dangote Refined Sugar 50kg',
    sku: 'DNG-SUG-50',
    category: 'Grains & Staples',
    categorySlug: 'grains',
    stockLeft: 2,
    stockUnit: 'bags',
    minAlert: 10,
    costPrice: 68000,
    sellingPrice: 74500,
    status: 'low',
    recentNote: 'Sold 18 yesterday',
  },
  {
    id: '2',
    name: 'Golden Penny Semovita 10kg (Pack of 5)',
    sku: 'GP-SEMO-10K',
    category: 'Grains & Staples',
    categorySlug: 'grains',
    stockLeft: 4,
    stockUnit: 'packs',
    minAlert: 8,
    costPrice: 32000,
    sellingPrice: 36000,
    status: 'low',
    recentNote: 'Supplier: Flour Mills Nig',
  },
  {
    id: '3',
    name: 'Peak Evaporated Milk 160g (Carton of 48)',
    sku: 'PEAK-CAN-48',
    category: 'Canned & Dairy',
    categorySlug: 'canned',
    stockLeft: 86,
    stockUnit: 'cartons',
    minAlert: 15,
    costPrice: 31500,
    sellingPrice: 34200,
    status: 'healthy',
    recentNote: '50 ctns received 4h ago',
  },
  {
    id: '4',
    name: 'Indomie Instant Noodles 70g (Carton of 40)',
    sku: 'IND-NOOD-40',
    category: 'Grains & Staples',
    categorySlug: 'grains',
    stockLeft: 120,
    stockUnit: 'cartons',
    minAlert: 20,
    costPrice: 11200,
    sellingPrice: 12600,
    status: 'healthy',
    recentNote: 'High turnover SKU',
  },
  {
    id: '5',
    name: 'Mamador Pure Vegetable Oil 25L',
    sku: 'MAM-OIL-25L',
    category: 'Oils & Condiments',
    categorySlug: 'oils',
    stockLeft: 1,
    stockUnit: 'jerrycan',
    minAlert: 5,
    costPrice: 54000,
    sellingPrice: 59500,
    status: 'low',
    recentNote: 'Reorder critical',
  },
  {
    id: '6',
    name: 'Milo Refill Economy Pack 800g (Carton of 12)',
    sku: 'MILO-800-12',
    category: 'Beverages',
    categorySlug: 'beverages',
    stockLeft: 0,
    stockUnit: 'cartons',
    minAlert: 10,
    costPrice: 48000,
    sellingPrice: 53000,
    status: 'out',
    recentNote: 'Out of stock since Tuesday',
  },
];

export default function InventoryScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'low' | 'out'>('all');

  const filteredProducts = mockProducts.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || item.categorySlug === selectedCategory;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'low' && item.status === 'low') ||
      (statusFilter === 'out' && item.status === 'out');
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <View className="flex-1 bg-surface">
      <AppHeader />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 80 }}
      >
        {/* Top Action Header */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-1 mr-2">
            <Text className="text-xl font-bold text-onSurface">Product Catalog</Text>
            <View className="flex-row items-center gap-1.5 mt-0.5">
              <View className="w-1.5 h-1.5 rounded-full bg-primary" />
              <Text className="text-xs text-onSurfaceVariant">
                184 active SKUs logged in Idumota warehouse
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => router.push('/modal/add-product')}
            className="flex-row items-center gap-1 px-3.5 py-2 rounded-full bg-secondaryContainer shadow-sm active:scale-95"
          >
            <AppIcon name="barcode_scanner" size={17} color={colors.onSecondaryContainer} />
            <Text className="text-xs font-semibold text-onSecondaryContainer">
              Scan Stock
            </Text>
          </Pressable>
        </View>

        {/* Inventory KPI Strip */}
        <View className="flex-row gap-2 mb-4">
          <View className="flex-1 bg-white p-2.5 rounded-xl border border-cardBorder shadow-xs">
            <View className="flex-row items-center justify-between">
              <Text className="text-[10px] font-bold text-onSurfaceVariant uppercase">
                Total SKUs
              </Text>
              <AppIcon name="category" size={14} color={colors.primary} />
            </View>
            <View className="flex-row items-baseline gap-1 mt-1">
              <Text className="text-base font-bold text-onSurface">184</Text>
              <Text className="text-[10px] text-outline">items</Text>
            </View>
          </View>

          <Pressable
            onPress={() => setStatusFilter(statusFilter === 'low' ? 'all' : 'low')}
            className={`flex-1 p-2.5 rounded-xl border border-cardBorder shadow-xs ${
              statusFilter === 'low' ? 'bg-errorContainer' : 'bg-white'
            }`}
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-[10px] font-bold text-error uppercase">Low Stock</Text>
              <AppIcon name="warning" size={14} color={colors.error} />
            </View>
            <View className="flex-row items-baseline gap-1 mt-1">
              <Text className="text-base font-bold text-error">7</Text>
              <Text className="text-[10px] text-onSurfaceVariant">reorder</Text>
            </View>
          </Pressable>

          <View className="flex-1 bg-white p-2.5 rounded-xl border border-cardBorder shadow-xs">
            <View className="flex-row items-center justify-between">
              <Text className="text-[10px] font-bold text-onSurfaceVariant uppercase">
                Valuation
              </Text>
              <AppIcon name="payments" size={14} color={colors.secondary} />
            </View>
            <Text className="text-sm font-bold text-onSurface mt-1 truncate">₦8.45M</Text>
          </View>

          <View className="flex-1 bg-white p-2.5 rounded-xl border border-cardBorder shadow-xs">
            <View className="flex-row items-center justify-between">
              <Text className="text-[10px] font-bold text-tertiary uppercase">Expiring</Text>
              <AppIcon name="calendar_month" size={14} color={colors.tertiary} />
            </View>
            <View className="flex-row items-baseline gap-1 mt-1">
              <Text className="text-base font-bold text-tertiary">3</Text>
              <Text className="text-[10px] text-outline">&lt; 30d</Text>
            </View>
          </View>
        </View>

        {/* Search & Scanner Input */}
        <View className="relative flex-row items-center mb-3">
          <View className="absolute left-3 z-10">
            <AppIcon name="search" size={18} color={colors.slateMuted} />
          </View>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search product name, barcode or SKU..."
            placeholderTextColor={colors.slateMuted}
            className="w-full h-11 pl-9 pr-11 bg-white rounded-xl border border-cardBorder text-sm text-onSurface shadow-xs"
          />
          <Pressable
            onPress={() => router.push('/modal/add-product')}
            className="absolute right-2 w-7 h-7 rounded-lg bg-surfaceContainer items-center justify-center active:bg-secondaryContainer"
          >
            <AppIcon name="barcode_scanner" size={17} color={colors.onSurface} />
          </Pressable>
        </View>

        {/* Category Pills (Horizontal Scroll) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6, paddingBottom: 8 }}
          className="mb-2"
        >
          {[
            { id: 'all', label: 'All', count: '184' },
            { id: 'grains', label: 'Grains & Staples', count: '42' },
            { id: 'canned', label: 'Canned & Dairy', count: '38' },
            { id: 'beverages', label: 'Beverages', count: '51' },
            { id: 'oils', label: 'Oils & Condiments', count: '29' },
            { id: 'personal', label: 'Personal Care', count: '24' },
          ].map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() => setSelectedCategory(cat.id)}
              className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full shadow-xs active:scale-95 ${
                selectedCategory === cat.id
                  ? 'bg-primary'
                  : 'bg-white border border-cardBorder'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  selectedCategory === cat.id ? 'text-white' : 'text-onSurfaceVariant'
                }`}
              >
                {cat.label}
              </Text>
              <View
                className={`px-1.5 py-0.2 rounded-full ${
                  selectedCategory === cat.id ? 'bg-white/20' : 'bg-surfaceContainer'
                }`}
              >
                <Text
                  className={`text-[10px] font-semibold ${
                    selectedCategory === cat.id ? 'text-white' : 'text-onSurfaceVariant'
                  }`}
                >
                  {cat.count}
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        {/* Stock Status Switcher */}
        <View className="flex-row items-center justify-between mb-3.5">
          <View className="flex-row items-center gap-1 bg-surfaceContainerLow p-1 rounded-lg">
            <Pressable
              onPress={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-md ${
                statusFilter === 'all' ? 'bg-white shadow-xs' : ''
              }`}
            >
              <Text
                className={`text-xs ${
                  statusFilter === 'all'
                    ? 'font-bold text-onSurface'
                    : 'text-onSurfaceVariant'
                }`}
              >
                All Stock
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setStatusFilter('low')}
              className={`flex-row items-center gap-1 px-3 py-1 rounded-md ${
                statusFilter === 'low' ? 'bg-white shadow-xs' : ''
              }`}
            >
              <View className="w-1.5 h-1.5 rounded-full bg-error" />
              <Text
                className={`text-xs ${
                  statusFilter === 'low'
                    ? 'font-bold text-onSurface'
                    : 'text-onSurfaceVariant'
                }`}
              >
                Low (7)
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setStatusFilter('out')}
              className={`flex-row items-center gap-1 px-3 py-1 rounded-md ${
                statusFilter === 'out' ? 'bg-white shadow-xs' : ''
              }`}
            >
              <View className="w-1.5 h-1.5 rounded-full bg-outline" />
              <Text
                className={`text-xs ${
                  statusFilter === 'out'
                    ? 'font-bold text-onSurface'
                    : 'text-onSurfaceVariant'
                }`}
              >
                Out (2)
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => router.push('/modal/add-product')}
            className="flex-row items-center gap-1 px-2.5 py-1"
          >
            <AppIcon name="add" size={16} color={colors.primary} />
            <Text className="text-xs font-semibold text-primary">New SKU</Text>
          </Pressable>
        </View>

        {/* Product Cards Stream */}
        <View className="gap-3">
          {filteredProducts.map((product) => {
            const margin = product.sellingPrice - product.costPrice;
            const marginPct = ((margin / product.costPrice) * 100).toFixed(1);

            return (
              <View
                key={product.id}
                className="bg-white rounded-xl p-3.5 border border-cardBorder shadow-sm relative overflow-hidden"
              >
                {/* Left Status Color Bar */}
                <View
                  className={`absolute left-0 top-0 bottom-0 w-1 ${
                    product.status === 'low'
                      ? 'bg-error'
                      : product.status === 'out'
                      ? 'bg-outline'
                      : 'bg-primary'
                  }`}
                />

                {/* Top Item Info */}
                <View className="flex-row items-start justify-between mb-2 pl-1">
                  <View className="flex-1 mr-2">
                    <Text className="text-sm font-bold text-onSurface">
                      {product.name}
                    </Text>
                    <View className="flex-row items-center gap-1.5 mt-0.5">
                      <View className="bg-surfaceContainer px-1.5 py-0.5 rounded">
                        <Text className="text-[10px] font-mono font-bold text-onSurface">
                          {product.sku}
                        </Text>
                      </View>
                      <Text className="text-[11px] text-outline">•</Text>
                      <Text className="text-xs text-onSurfaceVariant">
                        {product.category}
                      </Text>
                    </View>
                  </View>

                  <Pressable className="p-1">
                    <AppIcon name="more_horiz" size={18} color={colors.outline} />
                  </Pressable>
                </View>

                {/* Stock Level Badge */}
                <View
                  className={`flex-row items-center justify-between px-2.5 py-1 rounded-md mb-2.5 ${
                    product.status === 'low'
                      ? 'bg-errorContainer/50'
                      : product.status === 'out'
                      ? 'bg-surfaceContainer'
                      : 'bg-secondaryContainer/40'
                  }`}
                >
                  <View className="flex-row items-center gap-1.5">
                    <AppIcon
                      name={
                        product.status === 'low'
                          ? 'notification_important'
                          : product.status === 'out'
                          ? 'warning'
                          : 'check_circle'
                      }
                      size={15}
                      color={
                        product.status === 'low'
                          ? colors.error
                          : product.status === 'out'
                          ? colors.outline
                          : colors.primary
                      }
                    />
                    <Text
                      className={`text-xs font-bold ${
                        product.status === 'low'
                          ? 'text-error'
                          : product.status === 'out'
                          ? 'text-outline'
                          : 'text-onSecondaryContainer'
                      }`}
                    >
                      {product.status === 'out'
                        ? 'Out of Stock (0 left)'
                        : `${product.stockLeft} ${product.stockUnit} left`}
                    </Text>
                  </View>
                  <Text className="text-[11px] text-onSurfaceVariant">
                    Min alert: {product.minAlert} {product.stockUnit}
                  </Text>
                </View>

                {/* Financial Metrics 3-Col Grid */}
                <View className="flex-row justify-between bg-surfaceContainerLow p-2.5 rounded-lg mb-2.5">
                  <View className="flex-1">
                    <Text className="text-[10px] text-onSurfaceVariant">Cost Price</Text>
                    <Text className="text-sm font-semibold text-onSurface mt-0.5">
                      ₦{product.costPrice.toLocaleString()}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-[10px] text-onSurfaceVariant">Selling Price</Text>
                    <Text className="text-sm font-bold text-primary mt-0.5">
                      ₦{product.sellingPrice.toLocaleString()}
                    </Text>
                  </View>
                  <View className="flex-1 items-end">
                    <Text className="text-[10px] text-onSurfaceVariant">Est Margin</Text>
                    <View className="self-end bg-secondaryContainer/80 px-1.5 py-0.5 rounded mt-0.5">
                      <Text className="text-[10px] font-bold text-onSecondaryContainer">
                        +₦{margin.toLocaleString()} (+{marginPct}%)
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Quick Actions Strip */}
                <View className="flex-row items-center justify-between pt-0.5">
                  <View className="flex-row items-center gap-1">
                    <AppIcon name="history" size={13} color={colors.outline} />
                    <Text className="text-[11px] text-outline">{product.recentNote}</Text>
                  </View>
                  <Pressable
                    onPress={() => router.push('/explore-sellers')}
                    className="flex-row items-center gap-1 px-3 py-1.5 rounded-full bg-primary active:scale-95"
                  >
                    <AppIcon name="add" size={14} color="#ffffff" />
                    <Text className="text-xs font-semibold text-white">Restock</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
