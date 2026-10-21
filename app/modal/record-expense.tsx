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
import { addExpense } from '@/lib/db/queries';
import { useDataRefresh } from '@/lib/db/provider';

export default function RecordExpenseModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const db = useSQLiteContext();
  const { triggerRefresh } = useDataRefresh();

  const [category, setCategory] = useState('Generator & Diesel');
  const [amount, setAmount] = useState('7500');
  const [source, setSource] = useState<'till' | 'bank'>('till');
  const [description, setDescription] = useState('Market Union Levy & Power token payment');
  const [voucherNo, setVoucherNo] = useState('EXP-441');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { id: 'diesel', label: 'Generator & Diesel', icon: 'local_gas_station' },
    { id: 'union', label: 'Market Union Levy', icon: 'receipt' },
    { id: 'transport', label: 'Transport & Offloading', icon: 'local_shipping' },
    { id: 'wages', label: 'Attendant Wages', icon: 'person' },
    { id: 'repairs', label: 'Shop Maintenance', icon: 'store' },
  ];

  const handleSave = async () => {
    const parsedAmount = parseInt(amount || '0', 10);
    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid expense outflow amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addExpense(db, {
        category,
        amount: parsedAmount,
        recipient: source === 'till' ? 'Daily Cash Till #1' : 'Bank Transfer',
        notes: `${description} (Voucher: ${voucherNo})`,
        paymentMethod: source === 'till' ? 'cash' : 'transfer',
      });

      triggerRefresh();

      Alert.alert(
        'Expense Recorded',
        `₦${parsedAmount.toLocaleString()} recorded under ${category} from ${
          source === 'till' ? 'Daily Cash Till #1' : 'Bank Transfer'
        }.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to record expense.');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <View className="flex-1 bg-surface">
      {/* Header */}
      <View
        style={{ paddingTop: Math.max(insets.top, 16) }}
        className="bg-white border-b border-cardBorder px-4 pb-3"
      >
        <View className="w-12 h-1.5 bg-outlineVariant rounded-full self-center mb-2" />
        <View className="flex-row items-center justify-between">
          <View className="flex-1 mr-2">
            <View className="flex-row items-center gap-1.5">
              <AppIcon name="wallet" size={20} color={colors.error} />
              <Text className="text-lg font-bold text-onSurface">Record Cash Outflow</Text>
            </View>
            <Text className="text-xs text-onSurfaceVariant mt-0.5">
              Log store overhead, diesel, union levies & staff expenses
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
        {/* Amount Input */}
        <View className="bg-white rounded-xl p-4 border border-cardBorder shadow-sm mb-4">
          <Text className="text-xs font-semibold text-onSurfaceVariant mb-1.5">
            Expense Outflow Amount
          </Text>
          <View className="flex-row items-center bg-surfaceContainerLow rounded-xl px-3 h-12 border border-cardBorder">
            <Text className="text-xl font-bold text-error mr-2">₦</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              className="flex-1 text-2xl font-bold text-error p-0"
            />
          </View>
        </View>

        {/* Expense Category */}
        <View className="bg-white rounded-xl p-4 border border-cardBorder shadow-sm mb-4">
          <Text className="text-xs font-semibold text-onSurfaceVariant mb-2.5">
            Expense Category
          </Text>
          <View className="gap-2">
            {categories.map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => setCategory(cat.label)}
                className={`p-3 rounded-xl flex-row items-center justify-between border ${
                  category === cat.label
                    ? 'bg-secondaryContainer/40 border-primary'
                    : 'bg-surfaceContainerLow border-cardBorder'
                }`}
              >
                <View className="flex-row items-center gap-2.5">
                  <AppIcon
                    name={cat.icon}
                    size={18}
                    color={category === cat.label ? colors.primary : colors.onSurfaceVariant}
                  />
                  <Text
                    className={`text-xs ${
                      category === cat.label
                        ? 'font-bold text-primary'
                        : 'text-onSurface'
                    }`}
                  >
                    {cat.label}
                  </Text>
                </View>
                {category === cat.label && (
                  <AppIcon name="check_circle" size={16} color={colors.primary} />
                )}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Funding Source */}
        <View className="bg-white rounded-xl p-4 border border-cardBorder shadow-sm mb-4">
          <Text className="text-xs font-semibold text-onSurfaceVariant mb-2">
            Paid From Account / Till
          </Text>
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => setSource('till')}
              className={`flex-1 p-3 rounded-xl border items-center justify-center ${
                source === 'till'
                  ? 'bg-primary border-primary'
                  : 'bg-white border-cardBorder'
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  source === 'till' ? 'text-white' : 'text-onSurface'
                }`}
              >
                Counter Till #1 (Cash)
              </Text>
              <Text
                className={`text-[10px] mt-0.5 ${
                  source === 'till' ? 'text-white/80' : 'text-onSurfaceVariant'
                }`}
              >
                Balance: ₦185,000
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setSource('bank')}
              className={`flex-1 p-3 rounded-xl border items-center justify-center ${
                source === 'bank'
                  ? 'bg-primary border-primary'
                  : 'bg-white border-cardBorder'
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  source === 'bank' ? 'text-white' : 'text-onSurface'
                }`}
              >
                Moniepoint Transfer
              </Text>
              <Text
                className={`text-[10px] mt-0.5 ${
                  source === 'bank' ? 'text-white/80' : 'text-onSurfaceVariant'
                }`}
              >
                Direct Shop Debit
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Description & Voucher Details */}
        <View className="bg-white rounded-xl p-4 border border-cardBorder shadow-sm mb-5 gap-3">
          <View>
            <Text className="text-xs font-semibold text-onSurfaceVariant mb-1">
              Purpose & Notes
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="e.g. 10L diesel for generator"
              placeholderTextColor={colors.outline}
              className="w-full h-11 px-3 bg-surfaceContainerLow rounded-xl border border-cardBorder text-xs text-onSurface"
            />
          </View>
          <View>
            <Text className="text-xs font-semibold text-onSurfaceVariant mb-1">
              Receipt / Voucher Reference
            </Text>
            <TextInput
              value={voucherNo}
              onChangeText={setVoucherNo}
              className="w-full h-11 px-3 bg-surfaceContainerLow rounded-xl border border-cardBorder text-xs font-mono font-bold text-onSurface"
            />
          </View>
        </View>

        {/* Submit Expense */}
        <Pressable
          onPress={handleSave}
          disabled={isSubmitting}
          className={`w-full h-14 bg-error rounded-2xl flex-row items-center justify-center gap-2 shadow-lg active:opacity-90 ${
            isSubmitting ? 'opacity-60' : ''
          }`}
        >
          <AppIcon name="receipt" size={20} color="#ffffff" />
          <Text className="text-base font-bold text-white">
            {isSubmitting ? 'Recording Outflow...' : 'Record Outflow & Deduct from Register'}
          </Text>
        </Pressable>
      </ScrollView>
    </View>

  );
}
