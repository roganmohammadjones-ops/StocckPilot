import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AppIcon } from '@/components/icon';
import { colors } from '@/lib/theme';

export default function OrderReviewScreen() {
  const router = useRouter();
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');

  const subtotal = 108700;
  const porterage = 2000;
  const logisticsFee = deliveryMethod === 'delivery' ? 6500 : 0;
  const total = subtotal + porterage + logisticsFee;

  return (
    <View className="flex-1 bg-surface">
      {/* Top Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-cardBorder">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full active:bg-surfaceContainer"
        >
          <AppIcon name="arrow_back" size={22} color={colors.onSurface} />
        </Pressable>
        <Text className="text-base font-bold text-onSurface">Cart & Checkout Review</Text>
        <View className="w-8 h-8 rounded-full bg-primary items-center justify-center">
          <AppIcon name="person" size={16} color="#ffffff" />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      >
        {/* Stepper & Lock Pill */}
        <View className="flex-row items-center justify-between py-2 mb-3">
          <View className="flex-row items-center gap-1.5">
            <View className="w-5 h-5 rounded-full bg-primary items-center justify-center">
              <Text className="text-[11px] font-bold text-white">1</Text>
            </View>
            <Text className="text-xs font-bold text-primary">Order Review</Text>
            <AppIcon name="chevron_right" size={14} color={colors.outline} />
            <View className="w-5 h-5 rounded-full bg-surfaceContainerHigh items-center justify-center">
              <Text className="text-[11px] font-bold text-onSurfaceVariant">2</Text>
            </View>
            <Text className="text-xs text-onSurfaceVariant">Instant Verify</Text>
          </View>

          <View className="flex-row items-center gap-1 bg-secondaryContainer px-2 py-0.5 rounded-full">
            <View className="w-2 h-2 rounded-full bg-primary" />
            <Text className="text-[10px] font-bold text-onSecondaryContainer">
              Live Stock Locked
            </Text>
          </View>
        </View>

        {/* Welcome Merchant Alert */}
        <View className="bg-secondaryContainer p-3.5 rounded-2xl flex-row items-start gap-3 mb-4">
          <AppIcon name="bolt" size={22} color={colors.primary} />
          <View className="flex-1">
            <Text className="text-xs font-bold text-onSecondaryContainer">
              Wholesale Direct Trade Order
            </Text>
            <Text className="text-[11px] text-onSecondaryContainer/80 mt-0.5 leading-snug">
              Batch pricing locked with Idumota depot vendor. Proceed directly to verify receipt disbursement.
            </Text>
          </View>
        </View>

        {/* Order Summary Card */}
        <View className="bg-white rounded-2xl p-4 border border-cardBorder shadow-sm mb-4">
          <View className="flex-row items-center justify-between pb-2 mb-3 border-b border-cardBorder">
            <View className="flex-row items-center gap-2">
              <AppIcon name="receipt_long" size={18} color={colors.primary} />
              <Text className="text-sm font-bold text-onSurface">Wholesale Order Summary</Text>
            </View>
            <View className="px-2 py-0.5 rounded-full bg-surfaceContainer">
              <Text className="text-[11px] font-semibold text-onSurfaceVariant">2 Bales / Bags</Text>
            </View>
          </View>

          {/* Item 1 */}
          <View className="flex-row items-center gap-3 bg-surfaceContainerLow p-3 rounded-xl mb-2.5">
            <View className="w-12 h-12 rounded-xl bg-primary/10 items-center justify-center">
              <AppIcon name="inventory" size={22} color={colors.primary} />
            </View>
            <View className="flex-1 min-w-0">
              <Text className="text-xs font-bold text-onSurface truncate">
                Dangote Pure Granulated Sugar
              </Text>
              <Text className="text-[11px] text-onSurfaceVariant">50kg Heavy Sacking • Qty: 1</Text>
            </View>
            <View className="items-end">
              <Text className="text-xs font-bold text-onSurface">₦74,500</Text>
              <Text className="text-[10px] font-semibold text-primary">Wholesale Rate</Text>
            </View>
          </View>

          {/* Item 2 */}
          <View className="flex-row items-center gap-3 bg-surfaceContainerLow p-3 rounded-xl mb-3">
            <View className="w-12 h-12 rounded-xl bg-secondaryContainer items-center justify-center">
              <AppIcon name="category" size={22} color={colors.secondary} />
            </View>
            <View className="flex-1 min-w-0">
              <Text className="text-xs font-bold text-onSurface truncate">
                Peak Full Cream Evap Milk
              </Text>
              <Text className="text-[11px] text-onSurfaceVariant">24ct Full Carton • Qty: 1</Text>
            </View>
            <View className="items-end">
              <Text className="text-xs font-bold text-onSurface">₦34,200</Text>
              <Text className="text-[10px] font-semibold text-primary">Trade Standard</Text>
            </View>
          </View>

          {/* Subtotal Breakdown */}
          <View className="bg-surfaceContainer/50 p-3 rounded-xl gap-2">
            <View className="flex-row justify-between items-center">
              <Text className="text-xs text-onSurfaceVariant">Cart Subtotal</Text>
              <Text className="text-xs font-semibold text-onSurface">₦{subtotal.toLocaleString()}</Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-xs text-onSurfaceVariant">Loading & Kaya Porterage</Text>
              <Text className="text-xs font-semibold text-onSurface">₦{porterage.toLocaleString()}</Text>
            </View>
            {deliveryMethod === 'delivery' && (
              <View className="flex-row justify-between items-center">
                <Text className="text-xs text-onSurfaceVariant">Interstate Waybill / Truck</Text>
                <Text className="text-xs font-semibold text-onSurface">₦{logisticsFee.toLocaleString()}</Text>
              </View>
            )}

            <View className="flex-row justify-between items-center pt-2 mt-1 border-t border-cardBorder">
              <View>
                <Text className="text-sm font-bold text-onSurface">Total Payable</Text>
                <Text className="text-[10px] text-onSurfaceVariant">VAT & handling inclusive</Text>
              </View>
              <Text className="text-lg font-extrabold text-primary">₦{total.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Collection / Dispatch Options */}
        <View className="bg-white rounded-2xl p-4 border border-cardBorder shadow-sm mb-4">
          <View className="flex-row items-center gap-2 mb-3">
            <AppIcon name="local_shipping" size={18} color={colors.primary} />
            <Text className="text-sm font-bold text-onSurface">Collection Method</Text>
          </View>

          <View className="flex-row gap-2">
            <Pressable
              onPress={() => setDeliveryMethod('pickup')}
              className={`flex-1 p-3 rounded-xl border ${
                deliveryMethod === 'pickup'
                  ? 'border-primary bg-secondaryContainer/20'
                  : 'border-cardBorder bg-white'
              }`}
            >
              <Text className="text-xs font-bold text-onSurface">Self-Pickup at Depot</Text>
              <Text className="text-[11px] text-onSurfaceVariant mt-0.5">Idumota Block B, Lagos</Text>
            </Pressable>

            <Pressable
              onPress={() => setDeliveryMethod('delivery')}
              className={`flex-1 p-3 rounded-xl border ${
                deliveryMethod === 'delivery'
                  ? 'border-primary bg-secondaryContainer/20'
                  : 'border-cardBorder bg-white'
              }`}
            >
              <Text className="text-xs font-bold text-onSurface">Interstate Waybill</Text>
              <Text className="text-[11px] text-onSurfaceVariant mt-0.5">+₦6,500 delivery fee</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Checkout Dock */}
      <View className="absolute bottom-0 inset-x-0 bg-white/95 border-t border-cardBorder px-4 py-3 pb-6 shadow-xl">
        <Pressable
          onPress={() =>
            router.push({
              pathname: '/otp-verify',
              params: { phone: '+234 803 491 8820', businessName: 'Wholesale Depot Order' },
            })
          }
          className="w-full h-12 rounded-xl bg-primary items-center justify-center flex-row gap-2 active:bg-secondary shadow-md"
        >
          <Text className="text-white font-bold text-sm">
            Verify & Confirm Order (₦{total.toLocaleString()})
          </Text>
          <AppIcon name="arrow_forward" size={18} color="#ffffff" />
        </Pressable>
      </View>
    </View>
  );
}
