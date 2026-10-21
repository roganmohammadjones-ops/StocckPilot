import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { AppIcon } from '@/components/icon';
import { colors } from '@/lib/theme';
import { addProduct } from '@/lib/db/queries';
import { useDataRefresh } from '@/lib/db/provider';

export default function AddProductModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const db = useSQLiteContext();
  const { triggerRefresh } = useDataRefresh();

  const [name, setName] = useState('Dangote Classic Seasoning Cubes (Carton 40x100)');
  const [sku, setSku] = useState('DNG-SEAS-40');
  const [category, setCategory] = useState('Spices & Seasonings');
  const [uom, setUom] = useState('Carton (Contains 40 packs)');
  const [costPrice, setCostPrice] = useState('42000');
  const [retailPrice, setRetailPrice] = useState('47500');
  const [tier2Price, setTier2Price] = useState('46800');
  const [openingStock, setOpeningStock] = useState('50');
  const [minAlert, setMinAlert] = useState('10');
  const [saving, setSaving] = useState(false);

  const cost = parseFloat(costPrice) || 0;
  const retail = parseFloat(retailPrice) || 0;
  const tier2 = parseFloat(tier2Price) || 0;

  const profit = retail - cost;
  const profitMarginPct = cost > 0 ? ((profit / cost) * 100).toFixed(1) : '0.0';

  const tier2Profit = tier2 - cost;
  const tier2MarginPct = cost > 0 ? ((tier2Profit / cost) * 100).toFixed(1) : '0.0';

  const isHealthyMargin = parseFloat(profitMarginPct) >= 8.0;

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter a product name');
      return;
    }
    if (!sku.trim()) {
      Alert.alert('Validation Error', 'Please enter or generate a SKU');
      return;
    }

    try {
      setSaving(true);
      await addProduct(db, {
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        category: category.trim(),
        categorySlug: category.toLowerCase().includes('grain')
          ? 'grains'
          : category.toLowerCase().includes('oil')
          ? 'oils'
          : category.toLowerCase().includes('canned')
          ? 'canned'
          : category.toLowerCase().includes('bev')
          ? 'beverages'
          : 'other',
        stockLeft: parseFloat(openingStock) || 0,
        stockUnit: uom.split(' ')[0].toLowerCase() || 'units',
        minAlert: parseFloat(minAlert) || 10,
        costPrice: cost,
        sellingPrice: retail,
        wholesalePrice: tier2 > 0 ? tier2 : undefined,
        recentNote: 'Recently registered SKU',
      });
      triggerRefresh();

      Alert.alert(
        'SKU Registered Successfully',
        `${name} (${sku}) has been saved to your local inventory ledger with ${openingStock} units.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (e: any) {
      console.error('Failed to save product', e);
      Alert.alert('Error', e?.message || 'Could not save product. Please check that the SKU is unique.');
    } finally {
      setSaving(false);
    }
  };

  const handleAutoGenerateSku = () => {
    const prefix = name
      .split(' ')
      .slice(0, 2)
      .map((w) => w.substring(0, 3).toUpperCase())
      .join('-');
    const randomNum = Math.floor(10 + Math.random() * 90);
    setSku(`${prefix}-${randomNum}`);
  };

  return (
    <View className="flex-1 bg-surface">
      {/* Top Header */}
      <View
        style={{ paddingTop: Math.max(insets.top, 16) }}
        className="bg-white border-b border-cardBorder px-4 pb-3"
      >
        <View className="w-12 h-1.5 bg-outlineVariant rounded-full self-center mb-2" />
        <View className="flex-row items-center justify-between">
          <View className="flex-1 mr-2">
            <View className="flex-row items-center gap-1.5">
              <AppIcon name="add_box" size={20} color={colors.primary} />
              <Text className="text-lg font-bold text-onSurface">Add New Product SKU</Text>
            </View>
            <Text className="text-xs text-onSurfaceVariant mt-0.5">
              Create SKU with instant landed margin calculation
            </Text>
          </View>
          <Pressable
            onPress={() => router.back()}
            className="w-9 h-9 rounded-full bg-surfaceContainerLow items-center justify-center active:bg-surfaceContainer"
          >
            <AppIcon name="close" size={20} color={colors.onSurfaceVariant} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 }}
      >
        {/* Quick Barcode Scan Card */}
        <View className="bg-white rounded-xl p-3.5 border border-cardBorder shadow-sm mb-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3 flex-1 mr-2">
              <View className="w-11 h-11 rounded-lg bg-surfaceContainer items-center justify-center">
                <AppIcon name="barcode_scanner" size={24} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-onSurface">Scan Carton Label</Text>
                <Text className="text-xs text-outline">Scan EAN-13 or pallet tag directly</Text>
              </View>
            </View>
            <Pressable
              onPress={() => Alert.alert('Scanner Camera', 'Camera scanner ready')}
              className="flex-row items-center gap-1.5 px-3 py-2 bg-primary rounded-lg active:bg-primaryContainer"
            >
              <AppIcon name="photo_camera" size={16} color="#ffffff" />
              <Text className="text-xs font-semibold text-white">Scan</Text>
            </Pressable>
          </View>
        </View>

        {/* Section 1: Specifications */}
        <View className="bg-white rounded-xl p-4 border border-cardBorder shadow-sm mb-4 gap-3.5">
          <View className="flex-row items-center gap-2">
            <AppIcon name="inventory_2" size={18} color={colors.primary} />
            <Text className="text-sm font-bold text-onSurface">Product Specifications</Text>
          </View>

          {/* Product Name */}
          <View>
            <Text className="text-xs font-semibold text-onSurfaceVariant mb-1">
              Item Trade Description
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              className="w-full h-11 px-3 bg-surfaceContainerLow rounded-xl border border-cardBorder text-sm text-onSurface"
            />
          </View>

          {/* SKU Code */}
          <View>
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-xs font-semibold text-onSurfaceVariant">
                SKU / Product Code
              </Text>
              <Pressable
                onPress={handleAutoGenerateSku}
                className="flex-row items-center gap-1"
              >
                <AppIcon name="auto_fix_high" size={13} color={colors.primary} />
                <Text className="text-xs font-bold text-primary">Auto-Generate</Text>
              </Pressable>
            </View>
            <View className="relative flex-row items-center">
              <TextInput
                value={sku}
                onChangeText={setSku}
                className="w-full h-11 px-3 bg-surfaceContainerLow rounded-xl border border-cardBorder text-xs font-mono font-bold text-onSurface"
              />
              <View className="absolute right-2.5 px-2 py-0.5 rounded bg-secondaryContainer">
                <Text className="text-[10px] font-bold text-onSecondaryContainer">
                  VERIFIED
                </Text>
              </View>
            </View>
          </View>

          {/* Commodity Category */}
          <View>
            <Text className="text-xs font-semibold text-onSurfaceVariant mb-1">
              Commodity Category
            </Text>
            <View className="flex-row flex-wrap gap-1.5">
              {[
                'Grains & Staples',
                'Canned & Dairy',
                'Beverages',
                'Spices & Seasonings',
                'Oils & Condiments',
              ].map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg border active:scale-95 ${
                    category === cat
                      ? 'bg-primary border-primary'
                      : 'bg-surfaceContainerLow border-cardBorder'
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      category === cat ? 'text-white font-bold' : 'text-onSurface'
                    }`}
                  >
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* UOM */}
          <View>
            <Text className="text-xs font-semibold text-onSurfaceVariant mb-1">
              Unit of Measurement (UOM)
            </Text>
            <TextInput
              value={uom}
              onChangeText={setUom}
              className="w-full h-11 px-3 bg-surfaceContainerLow rounded-xl border border-cardBorder text-sm text-onSurface"
            />
          </View>
        </View>

        {/* Section 2: Landed Cost & Price Matrix */}
        <View className="bg-white rounded-xl p-4 border border-cardBorder shadow-sm mb-4 gap-3.5">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <AppIcon name="calculate" size={18} color={colors.primary} />
              <Text className="text-sm font-bold text-onSurface">Landed Cost & Price Matrix</Text>
            </View>
            <View className="px-2 py-0.5 rounded-full bg-secondaryContainer">
              <Text className="text-[10px] font-bold text-onSecondaryContainer">Real-time</Text>
            </View>
          </View>

          {/* Cost Price */}
          <View>
            <Text className="text-xs font-semibold text-onSurfaceVariant mb-1">
              Landed Cost per Unit (Delivery & Offloading)
            </Text>
            <View className="flex-row items-center bg-surfaceContainerLow rounded-xl border border-cardBorder px-3 h-11">
              <Text className="text-sm font-bold text-outline mr-2">₦</Text>
              <TextInput
                value={costPrice}
                onChangeText={setCostPrice}
                keyboardType="numeric"
                className="flex-1 text-sm font-bold text-onSurface p-0"
              />
            </View>
          </View>

          {/* Retail Selling Price */}
          <View>
            <Text className="text-xs font-semibold text-onSurfaceVariant mb-1">
              Primary Selling / Counter Price
            </Text>
            <View className="flex-row items-center bg-surfaceContainerLow rounded-xl border border-cardBorder px-3 h-11">
              <Text className="text-sm font-bold text-outline mr-2">₦</Text>
              <TextInput
                value={retailPrice}
                onChangeText={setRetailPrice}
                keyboardType="numeric"
                className="flex-1 text-sm font-bold text-primary p-0"
              />
            </View>
          </View>

          {/* Wholesale Tier 2 Price */}
          <View>
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-xs font-semibold text-onSurfaceVariant">
                Wholesale Tier 2 Price
              </Text>
              <Text className="text-[11px] text-outline">Bulk ≥ 10 Cartons</Text>
            </View>
            <View className="flex-row items-center bg-surfaceContainerLow rounded-xl border border-cardBorder px-3 h-11">
              <Text className="text-sm font-bold text-outline mr-2">₦</Text>
              <TextInput
                value={tier2Price}
                onChangeText={setTier2Price}
                keyboardType="numeric"
                className="flex-1 text-sm font-bold text-onSurface p-0"
              />
            </View>
          </View>

          {/* Live Landed Margin Output Box */}
          <View
            className={`rounded-2xl p-3.5 gap-2 ${
              isHealthyMargin ? 'bg-secondaryContainer/50' : 'bg-errorContainer/50'
            }`}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-1.5">
                <AppIcon
                  name={isHealthyMargin ? 'trending_up' : 'warning'}
                  size={16}
                  color={isHealthyMargin ? colors.primary : colors.error}
                />
                <Text className="text-xs font-bold text-onSurface">Gross Profit per Unit</Text>
              </View>
              <View
                className={`px-2.5 py-0.5 rounded-full ${
                  isHealthyMargin ? 'bg-primary' : 'bg-error'
                }`}
              >
                <Text className="text-xs font-bold text-white">
                  {profit >= 0 ? `+${profitMarginPct}%` : `${profitMarginPct}%`}
                </Text>
              </View>
            </View>

            <View className="flex-row items-baseline justify-between pt-1">
              <Text className="text-2xl font-bold text-primary tracking-tight">
                {profit >= 0 ? `+₦${profit.toLocaleString()}` : `-₦${Math.abs(profit).toLocaleString()}`}
              </Text>
              <Text className="text-xs text-onSurfaceVariant">
                Tier 2: +₦{tier2Profit.toLocaleString()} ({tier2MarginPct}%)
              </Text>
            </View>

            <View className="flex-row items-center gap-1.5 pt-1">
              <AppIcon name="verified_user" size={14} color={colors.secondary} />
              <Text className="text-[11px] text-onSurfaceVariant flex-1">
                {isHealthyMargin
                  ? 'Safe wholesale threshold for FMCG is 8.0%. Margin is healthy.'
                  : 'Warning: Margin below 8.0% minimum threshold for FMCG wholesale.'}
              </Text>
            </View>
          </View>
        </View>

        {/* Section 3: Stock Allocation */}
        <View className="bg-white rounded-xl p-4 border border-cardBorder shadow-sm mb-5 gap-3.5">
          <View className="flex-row items-center gap-2">
            <AppIcon name="warehouse" size={18} color={colors.primary} />
            <Text className="text-sm font-bold text-onSurface">
              Stockroom & Inventory Allocation
            </Text>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="text-xs font-semibold text-onSurfaceVariant mb-1">
                Opening Physical Units
              </Text>
              <TextInput
                value={openingStock}
                onChangeText={setOpeningStock}
                keyboardType="numeric"
                className="w-full h-11 px-3 bg-surfaceContainerLow rounded-xl border border-cardBorder text-sm font-bold text-onSurface"
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-semibold text-onSurfaceVariant mb-1">
                Min Reorder Alert
              </Text>
              <TextInput
                value={minAlert}
                onChangeText={setMinAlert}
                keyboardType="numeric"
                className="w-full h-11 px-3 bg-surfaceContainerLow rounded-xl border border-cardBorder text-sm font-bold text-onSurface"
              />
            </View>
          </View>
        </View>

        {/* Save CTA */}
        <Pressable
          onPress={handleSave}
          disabled={saving}
          className={`w-full h-14 bg-primary rounded-2xl flex-row items-center justify-center gap-2 shadow-lg active:bg-primaryContainer ${
            saving ? 'opacity-60' : ''
          }`}
        >
          <AppIcon name="check_circle" size={20} color="#ffffff" />
          <Text className="text-base font-bold text-white">
            {saving ? 'Saving Product...' : 'Save Product & Update Warehouse'}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
