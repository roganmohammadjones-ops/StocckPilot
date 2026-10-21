import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { AppIcon } from '@/components/icon';
import { colors } from '@/lib/theme';
import { createSale } from '@/lib/db/queries';
import { useDataRefresh } from '@/lib/db/provider';

interface CartItem {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
  profitPerUnit: number;
  icon: string;
}

function generateInvoiceNo(): string {
  return `SP-${Math.floor(1000 + Math.random() * 9000)}`;
}

export default function NewSaleModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const db = useSQLiteContext();
  const { triggerRefresh } = useDataRefresh();
  const [submitting, setSubmitting] = useState(false);

  const [cart, setCart] = useState<CartItem[]>([
    {
      id: '1',
      name: 'Dangote Refined Sugar 50kg',
      unitPrice: 74500,
      quantity: 1,
      profitPerUnit: 6500,
      icon: 'inventory_2',
    },
    {
      id: '3',
      name: 'Peak Evaporated Milk 160g (Carton 48)',
      unitPrice: 34200,
      quantity: 2,
      profitPerUnit: 2700,
      icon: 'category',
    },
    {
      id: '2',
      name: 'Golden Penny Semovita 10kg',
      unitPrice: 36000,
      quantity: 1,
      profitPerUnit: 6300,
      icon: 'grain',
    },
  ]);

  const [customerType, setCustomerType] = useState<'walkin' | 'registered'>('walkin');
  const [phoneNumber, setPhoneNumber] = useState('+234 803 491 8820');
  const [paymentChannel, setPaymentChannel] = useState<'cash' | 'transfer' | 'pos' | 'credit'>('cash');
  const [tenderedAmount, setTenderedAmount] = useState('180000');
  const [discount] = useState(900);

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nextQty = Math.max(1, item.quantity + delta);
            return { ...item, quantity: nextQty };
          }
          return item;
        })
    );
  };

  const grossSubtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const totalProfit = cart.reduce((sum, item) => sum + item.profitPerUnit * item.quantity, 0);
  const netPayable = Math.max(0, grossSubtotal - discount);
  const totalUnits = cart.reduce((sum, item) => sum + item.quantity, 0);

  const parsedTendered = parseInt(tenderedAmount.replace(/[^0-9]/g, ''), 10) || 0;
  const changeDue = parsedTendered - netPayable;

  const handleConfirmSale = async () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add at least one product to the sale.');
      return;
    }

    const invoiceNo = generateInvoiceNo();

    try {
      setSubmitting(true);
      await createSale(db, {
        invoiceNo,
        customerId: customerType === 'registered' ? 'cust_1' : undefined,
        customerName: customerType === 'registered' ? 'Mama Nkechi Stores' : 'Walk-in Cash Customer',
        totalAmount: grossSubtotal,
        discountAmount: discount,
        netPayable,
        paymentChannel,
        amountTendered: paymentChannel === 'cash' ? parsedTendered : undefined,
        changeReturned: paymentChannel === 'cash' ? Math.max(0, changeDue) : undefined,
        items: cart.map((item) => ({
          productId: item.id.startsWith('prod_') ? item.id : `prod_${item.id}`,
          productName: item.name,
          sku: item.name.substring(0, 3).toUpperCase(),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      });

      triggerRefresh();

      Alert.alert(
        'Sale Recorded Successfully',
        `Invoice #${invoiceNo} for ₦${netPayable.toLocaleString()} has been committed to the local ledger.`,
        [
          {
            text: 'Send WhatsApp Slip',
            onPress: () => {
              Linking.openURL(
                `https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}?text=Receipt%20#${invoiceNo}%20from%20StockPilot%20Store:%20Amount%20₦${netPayable.toLocaleString()}%20recorded.%20Thank%20you%20for%20your%20patronage!`
              );
              router.back();
            },
          },
          {
            text: 'Done',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (err: any) {
      console.error('Failed to create sale', err);
      Alert.alert('Error', err?.message || 'Could not record sale. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-surface">
      {/* Top Modal Navigation Header */}
      <View
        style={{ paddingTop: Math.max(insets.top, 16) }}
        className="bg-white border-b border-cardBorder px-4 pb-3"
      >
        <View className="w-12 h-1.5 bg-outlineVariant rounded-full self-center mb-2" />
        <View className="flex-row items-center justify-between">
          <View className="flex-1 mr-2">
            <View className="flex-row items-center gap-1.5">
              <AppIcon name="shopping_cart_checkout" size={20} color={colors.primary} />
              <Text className="text-lg font-bold text-onSurface">New Sale Checkout</Text>
            </View>
            <View className="flex-row items-center gap-1.5 mt-0.5">
              <View className="bg-surfaceContainer px-2 py-0.5 rounded">
                <Text className="text-[11px] font-bold text-primary">#SP-1095</Text>
              </View>
              <Text className="text-xs text-outline">•</Text>
              <Text className="text-xs text-onSurfaceVariant">Counter Till #1</Text>
              <Text className="text-xs text-outline">•</Text>
              <Text className="text-xs font-semibold text-secondary">
                {cart.length} SKUs ({totalUnits} units)
              </Text>
            </View>
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
        {/* Scanned Cart Items */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xs font-bold text-onSurfaceVariant uppercase tracking-wider">
              Scanned Cart ({cart.length})
            </Text>
            <Pressable
              onPress={() => router.push('/(tabs)/inventory')}
              className="flex-row items-center gap-1"
            >
              <AppIcon name="add" size={16} color={colors.primary} />
              <Text className="text-xs font-semibold text-primary">Add More SKUs</Text>
            </Pressable>
          </View>

          <View className="gap-2.5">
            {cart.map((item) => (
              <View
                key={item.id}
                className="bg-white p-3 rounded-xl border border-cardBorder shadow-xs flex-row items-center justify-between"
              >
                <View className="flex-row items-center gap-2.5 flex-1 mr-2">
                  <View className="w-10 h-10 rounded-lg bg-surfaceContainerHighest items-center justify-center">
                    <AppIcon name={item.icon} size={20} color={colors.primary} />
                  </View>
                  <View className="flex-1 min-w-0">
                    <Text className="text-xs font-bold text-onSurface truncate">
                      {item.name}
                    </Text>
                    <View className="flex-row items-center gap-1.5 mt-0.5">
                      <Text className="text-[11px] text-onSurfaceVariant">
                        ₦{item.unitPrice.toLocaleString()} / unit
                      </Text>
                      <Text className="text-[11px] text-outline">•</Text>
                      <Text className="text-[11px] font-semibold text-primary">
                        +₦{(item.profitPerUnit * item.quantity).toLocaleString()} profit
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Quantity Controls & Line Total */}
                <View className="flex-row items-center gap-2">
                  <View className="flex-row items-center bg-surfaceContainerLow rounded-lg p-0.5">
                    <Pressable
                      onPress={() => updateQuantity(item.id, -1)}
                      className="w-7 h-7 rounded items-center justify-center active:bg-surfaceContainer"
                    >
                      <AppIcon name="remove" size={14} color={colors.onSurfaceVariant} />
                    </Pressable>
                    <Text className="w-6 text-center text-xs font-bold text-onSurface">
                      {item.quantity}
                    </Text>
                    <Pressable
                      onPress={() => updateQuantity(item.id, 1)}
                      className="w-7 h-7 rounded items-center justify-center active:bg-surfaceContainer"
                    >
                      <AppIcon name="add" size={14} color={colors.onSurfaceVariant} />
                    </Pressable>
                  </View>
                  <Text className="text-xs font-bold text-onSurface min-w-[65px] text-right">
                    ₦{(item.unitPrice * item.quantity).toLocaleString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Customer Segment Selector */}
        <View className="mb-4">
          <View className="flex-row bg-surfaceContainerLow p-1 rounded-xl mb-2">
            <Pressable
              onPress={() => setCustomerType('walkin')}
              className={`flex-1 py-2 rounded-lg flex-row items-center justify-center gap-1.5 ${
                customerType === 'walkin' ? 'bg-white shadow-xs' : ''
              }`}
            >
              <AppIcon
                name="person"
                size={16}
                color={customerType === 'walkin' ? colors.primary : colors.onSurfaceVariant}
              />
              <Text
                className={`text-xs ${
                  customerType === 'walkin' ? 'font-bold text-primary' : 'text-onSurfaceVariant'
                }`}
              >
                Walk-in Customer
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setCustomerType('registered')}
              className={`flex-1 py-2 rounded-lg flex-row items-center justify-center gap-1.5 ${
                customerType === 'registered' ? 'bg-white shadow-xs' : ''
              }`}
            >
              <AppIcon
                name="badge"
                size={16}
                color={customerType === 'registered' ? colors.primary : colors.onSurfaceVariant}
              />
              <Text
                className={`text-xs ${
                  customerType === 'registered' ? 'font-bold text-primary' : 'text-onSurfaceVariant'
                }`}
              >
                Registered Ledger
              </Text>
            </Pressable>
          </View>

          {/* Customer Input Detail Strip */}
          <View className="bg-white p-2.5 rounded-xl border border-cardBorder shadow-xs flex-row items-center justify-between">
            <View className="flex-row items-center gap-2 flex-1 mr-2">
              <AppIcon name="chat" size={18} color={colors.outline} />
              <TextInput
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="WhatsApp receipt number (080...)"
                placeholderTextColor={colors.outline}
                className="flex-1 text-xs text-onSurface font-medium p-0"
                keyboardType="phone-pad"
              />
            </View>
            <View className="bg-secondaryContainer px-2 py-0.5 rounded">
              <Text className="text-[10px] font-bold text-onSecondaryContainer">
                Instant e-Slip
              </Text>
            </View>
          </View>
        </View>

        {/* Financial Calculation Breakdown Card */}
        <View className="bg-surfaceContainerLow rounded-2xl p-4 mb-4 gap-2 border border-cardBorder">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs text-onSurfaceVariant">
              Gross Subtotal ({totalUnits} units)
            </Text>
            <Text className="text-xs font-semibold text-onSurface">
              ₦{grossSubtotal.toLocaleString()}
            </Text>
          </View>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1">
              <AppIcon name="price_change" size={14} color={colors.secondary} />
              <Text className="text-xs text-secondary font-medium">
                Market Courtesy Discount
              </Text>
            </View>
            <Text className="text-xs font-bold text-secondary">
              -₦{discount.toLocaleString()}
            </Text>
          </View>
          <View className="pt-2.5 border-t border-cardBorder flex-row items-baseline justify-between">
            <View>
              <Text className="text-[10px] uppercase font-bold text-outline tracking-wider">
                Net Total Payable
              </Text>
              <View className="self-start mt-0.5 bg-secondaryContainer px-2 py-0.5 rounded-full">
                <Text className="text-[10px] font-bold text-onSecondaryContainer">
                  Margin: ₦{totalProfit.toLocaleString()} (
                  {((totalProfit / (grossSubtotal || 1)) * 100).toFixed(1)}%)
                </Text>
              </View>
            </View>
            <Text className="text-3xl font-bold text-onSurface tracking-tight">
              ₦{netPayable.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Payment Channels (4 Channels from Stitch) */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xs font-bold text-onSurfaceVariant uppercase tracking-wider">
              Payment Channel
            </Text>
            <Text className="text-[11px] text-outline">Select Active Mode</Text>
          </View>

          <View className="flex-row gap-2 mb-3">
            {[
              { id: 'cash', label: 'Cash', icon: 'payments' },
              { id: 'transfer', label: 'Transfer', icon: 'account_balance' },
              { id: 'pos', label: 'Moniepoint', icon: 'point_of_sale' },
              { id: 'credit', label: 'Credit / IOU', icon: 'receipt_long' },
            ].map((channel) => (
              <Pressable
                key={channel.id}
                onPress={() => setPaymentChannel(channel.id as any)}
                className={`flex-1 py-2.5 rounded-xl items-center justify-center active:scale-95 shadow-xs ${
                  paymentChannel === channel.id
                    ? 'bg-primary'
                    : 'bg-white border border-cardBorder'
                }`}
              >
                <AppIcon
                  name={channel.icon}
                  size={20}
                  color={paymentChannel === channel.id ? '#ffffff' : colors.onSurfaceVariant}
                />
                <Text
                  className={`text-[11px] mt-1 ${
                    paymentChannel === channel.id
                      ? 'font-bold text-white'
                      : 'text-onSurfaceVariant'
                  }`}
                >
                  {channel.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Cash Tendering Panel (When Cash Selected) */}
          {paymentChannel === 'cash' && (
            <View className="bg-white p-3.5 rounded-2xl border border-cardBorder shadow-sm gap-2.5">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs text-onSurfaceVariant">Tendered Cash Amount:</Text>
                <Text className="text-xs font-semibold text-primary">Auto-Calculate Change</Text>
              </View>
              <View className="flex-row items-center bg-surfaceContainerLow px-3 py-2 rounded-xl">
                <Text className="text-base font-bold text-outline mr-1.5">₦</Text>
                <TextInput
                  value={tenderedAmount}
                  onChangeText={setTenderedAmount}
                  keyboardType="numeric"
                  className="flex-1 text-lg font-bold text-onSurface p-0"
                />
              </View>

              {/* Cash Presets */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {[
                  { label: `Exact ₦${netPayable.toLocaleString()}`, val: netPayable.toString() },
                  { label: '₦180,000', val: '180000' },
                  { label: '₦190,000', val: '190000' },
                  { label: '₦200,000', val: '200000' },
                ].map((preset, idx) => (
                  <Pressable
                    key={idx}
                    onPress={() => setTenderedAmount(preset.val)}
                    className="px-3 py-1.5 rounded-lg bg-surfaceContainer active:bg-secondaryContainer"
                  >
                    <Text className="text-xs font-medium text-onSurface">{preset.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              {/* Change Return Readout */}
              <View
                className={`flex-row items-center justify-between p-2.5 rounded-xl ${
                  changeDue >= 0 ? 'bg-secondaryContainer/50' : 'bg-errorContainer/50'
                }`}
              >
                <View className="flex-row items-center gap-1.5">
                  <AppIcon
                    name="change_circle"
                    size={18}
                    color={changeDue >= 0 ? colors.primary : colors.error}
                  />
                  <Text className="text-xs font-bold text-onSurface">
                    {changeDue >= 0 ? 'Customer Change Due:' : 'Short Amount:'}
                  </Text>
                </View>
                <Text
                  className={`text-base font-bold ${
                    changeDue >= 0 ? 'text-primary' : 'text-error'
                  }`}
                >
                  {changeDue >= 0
                    ? `₦${changeDue.toLocaleString()}`
                    : `-₦${Math.abs(changeDue).toLocaleString()}`}
                </Text>
              </View>
            </View>
          )}

          {/* Bank Transfer Panel (When Transfer Selected) */}
          {paymentChannel === 'transfer' && (
            <View className="bg-white p-3.5 rounded-2xl border border-cardBorder shadow-sm gap-2.5">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs text-onSurfaceVariant">
                  Merchant Receiving Account:
                </Text>
                <View className="px-2 py-0.5 rounded bg-primary/10">
                  <Text className="text-[10px] font-bold text-primary">Active POS</Text>
                </View>
              </View>
              <View className="bg-surfaceContainerLow p-3 rounded-xl flex-row items-center justify-between">
                <View className="flex-row items-center gap-2.5">
                  <View className="w-8 h-8 rounded-full bg-tertiary items-center justify-center">
                    <Text className="text-xs font-bold text-white">MP</Text>
                  </View>
                  <View>
                    <Text className="text-xs font-bold text-onSurface">Moniepoint MFB</Text>
                    <Text className="text-xs font-mono text-onSurfaceVariant">
                      8219044812 • Bamidele Ent.
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => Alert.alert('Copied', 'Account 8219044812 copied')}
                  className="w-8 h-8 rounded-lg bg-surfaceContainer items-center justify-center"
                >
                  <AppIcon name="content_copy" size={16} color={colors.primary} />
                </Pressable>
              </View>
              <View className="flex-row items-start gap-1.5 p-2 bg-errorContainer/40 rounded-lg">
                <AppIcon name="verified_user" size={16} color={colors.error} />
                <Text className="text-[11px] text-onErrorContainer flex-1">
                  Confirm instant credit alert on the merchant phone before giving customer the goods.
                </Text>
              </View>
            </View>
          )}

          {/* POS Terminal Panel */}
          {paymentChannel === 'pos' && (
            <View className="bg-white p-3.5 rounded-2xl border border-cardBorder shadow-sm gap-2">
              <Text className="text-xs font-bold text-onSurface">Card Terminal Reference</Text>
              <Text className="text-xs text-onSurfaceVariant">
                Swipe or insert ATM card on terminal #MP-Lagos-09. Amount: ₦{netPayable.toLocaleString()}
              </Text>
            </View>
          )}

          {/* Credit / IOU Panel */}
          {paymentChannel === 'credit' && (
            <View className="bg-white p-3.5 rounded-2xl border border-cardBorder shadow-sm gap-2">
              <View className="flex-row items-center gap-1.5">
                <AppIcon name="warning" size={16} color={colors.error} />
                <Text className="text-xs font-bold text-error">Debit Ledger Entry</Text>
              </View>
              <Text className="text-xs text-onSurfaceVariant">
                This transaction will be posted to the customer&apos;s outstanding balance under 14-day trade terms.
              </Text>
            </View>
          )}
        </View>

        {/* Quick Action Switches (WhatsApp, Print Slip, Park) */}
        <View className="flex-row gap-2 mb-4">
          <Pressable
            onPress={() => {
              Linking.openURL(
                `https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}?text=Receipt%20#SP-1095:%20Total%20₦${netPayable.toLocaleString()}`
              );
            }}
            className="flex-1 py-2.5 rounded-xl bg-white border border-cardBorder flex-row items-center justify-center gap-1.5 active:bg-surfaceContainer"
          >
            <AppIcon name="share" size={16} color={colors.primary} />
            <Text className="text-xs font-semibold text-onSurface">WhatsApp</Text>
          </Pressable>

          <Pressable
            onPress={() => Alert.alert('Printing Slip', 'Sending job to Bluetooth thermal printer...')}
            className="flex-1 py-2.5 rounded-xl bg-white border border-cardBorder flex-row items-center justify-center gap-1.5 active:bg-surfaceContainer"
          >
            <AppIcon name="receipt_long" size={16} color={colors.outline} />
            <Text className="text-xs font-semibold text-onSurface">Print Slip</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              Alert.alert('Cart Parked', 'This order has been held. You can resume it anytime.');
              router.back();
            }}
            className="flex-1 py-2.5 rounded-xl bg-white border border-cardBorder flex-row items-center justify-center gap-1.5 active:bg-surfaceContainer"
          >
            <AppIcon name="pause" size={16} color={colors.outline} />
            <Text className="text-xs font-semibold text-onSurface">Park / Hold</Text>
          </Pressable>
        </View>

        {/* Primary Final Action CTA */}
        <Pressable
          onPress={handleConfirmSale}
          disabled={submitting}
          className={`w-full h-14 bg-primary rounded-2xl flex-row items-center justify-center gap-2 shadow-lg active:bg-primaryContainer mb-2 ${
            submitting ? 'opacity-60' : ''
          }`}
        >
          <AppIcon name="check_circle" size={22} color="#ffffff" />
          <Text className="text-base font-bold text-white">
            {submitting ? 'Recording Sale...' : `Confirm & Record ₦${netPayable.toLocaleString()}`}
          </Text>
        </Pressable>

        {/* Offline Sync Guarantee Badge */}
        <View className="flex-row items-center justify-center gap-1.5">
          <AppIcon name="bolt" size={15} color={colors.secondary} />
          <Text className="text-[11px] text-onSurfaceVariant">
            Offline Ledger Guaranteed • Instantly committed to Idumota node
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
