import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Linking,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/icon';
import { colors } from '@/lib/theme';
import { createSale, getProducts, getCustomers } from '@/lib/db/queries';
import { useDataRefresh, useAppDb } from '@/lib/db/provider';
import type { Product, Customer } from '@/lib/db/types';
import { printReceipt, shareReceiptPdf } from '@/lib/receipt';

interface CartItem {
  id: string;
  name: string;
  sku: string;
  unitPrice: number;
  costPrice: number;
  quantity: number;
  profitPerUnit: number;
  icon: string;
  stockLeft: number;
  stockUnit: string;
}

function generateInvoiceNo(): string {
  return `SP-${Math.floor(1000 + Math.random() * 9000)}`;
}

export default function NewSaleModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const db = useAppDb();
  const { triggerRefresh } = useDataRefresh();

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([
    {
      id: 'prod_1',
      name: 'Dangote Refined Sugar 50kg',
      sku: 'DNG-SUG-50',
      unitPrice: 71000,
      costPrice: 64500,
      quantity: 1,
      profitPerUnit: 6500,
      icon: 'inventory_2',
      stockLeft: 45,
      stockUnit: 'bags',
    },
    {
      id: 'prod_3',
      name: 'Peak Evaporated Milk 160g',
      sku: 'PEAK-CAN-48',
      unitPrice: 28500,
      costPrice: 25800,
      quantity: 2,
      profitPerUnit: 2700,
      icon: 'local_drink',
      stockLeft: 60,
      stockUnit: 'cartons',
    },
  ]);

  // Customer State
  const [customerType, setCustomerType] = useState<'walkin' | 'registered'>('walkin');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('cust_1');
  const [phoneNumber, setPhoneNumber] = useState('+234 803 491 8820');

  // Payment State
  const [paymentChannel, setPaymentChannel] = useState<'cash' | 'transfer' | 'pos' | 'credit'>('cash');
  const [tenderedAmount, setTenderedAmount] = useState('130,000');
  const [discount, setDiscount] = useState(500);

  // Modals for SKU picker, Barcode Scanner, and Sale Completion
  const [showAddSkuModal, setShowAddSkuModal] = useState(false);
  const [showBarcodeScannerModal, setShowBarcodeScannerModal] = useState(false);
  const [skuSearchQuery, setSkuSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [completedSale, setCompletedSale] = useState<{
    invoiceNo: string;
    netPayable: number;
    customerName: string;
    paymentChannel: 'cash' | 'transfer' | 'pos' | 'credit';
    amountTendered?: number;
    changeReturned?: number;
    totalAmount: number;
    discountAmount: number;
    items: CartItem[];
  } | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  // Load products and customers from SQLite
  useEffect(() => {
    async function loadCatalog() {
      try {
        const [prods, custs] = await Promise.all([
          getProducts(db),
          getCustomers(db),
        ]);
        setProducts(prods);
        setCustomers(custs);
        if (custs.length > 0) {
          setSelectedCustomerId(custs[0].id);
          setPhoneNumber(custs[0].phone);
        }
      } catch (e) {
        console.error('Failed to load catalog for checkout', e);
      }
    }
    loadCatalog();
  }, [db]);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId),
    [customers, selectedCustomerId]
  );

  const handleSelectCustomer = (cust: Customer) => {
    setSelectedCustomerId(cust.id);
    setPhoneNumber(cust.phone);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const addItemToCart = (prod: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === prod.id || item.sku === prod.sku);
      if (existing) {
        return prev.map((item) =>
          item.id === existing.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: prod.id,
          name: prod.name,
          sku: prod.sku,
          unitPrice: prod.sellingPrice,
          costPrice: prod.costPrice,
          quantity: 1,
          profitPerUnit: Math.max(0, prod.sellingPrice - prod.costPrice),
          icon: 'inventory_2',
          stockLeft: prod.stockLeft,
          stockUnit: prod.stockUnit,
        },
      ];
    });
  };

  const handleScanBarcode = (barcode: string) => {
    const term = barcode.trim().toUpperCase();
    if (!term) return;

    const matched = products.find(
      (p) => p.sku.toUpperCase() === term || p.name.toUpperCase().includes(term)
    );

    if (matched) {
      addItemToCart(matched);
      setBarcodeInput('');
      setShowBarcodeScannerModal(false);
      Alert.alert('Item Added', `${matched.name} added to cart.`);
    } else {
      Alert.alert('Barcode Not Found', `No product matching "${term}" in your catalog.`);
    }
  };

  // Calculations
  const grossSubtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const totalProfit = cart.reduce((sum, item) => sum + item.profitPerUnit * item.quantity, 0);
  const totalUnits = cart.reduce((sum, item) => sum + item.quantity, 0);
  const netPayable = Math.max(0, grossSubtotal - discount);

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
        customerId: customerType === 'registered' ? selectedCustomerId : undefined,
        customerName:
          customerType === 'registered'
            ? selectedCustomer?.name || 'Registered Customer'
            : 'Walk-in Cash Customer',
        totalAmount: grossSubtotal,
        discountAmount: discount,
        netPayable,
        paymentChannel,
        amountTendered: paymentChannel === 'cash' ? parsedTendered : undefined,
        changeReturned: paymentChannel === 'cash' ? Math.max(0, changeDue) : undefined,
        items: cart.map((item) => ({
          productId: item.id,
          productName: item.name,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      });

      triggerRefresh();

      setCompletedSale({
        invoiceNo,
        netPayable,
        customerName:
          customerType === 'registered'
            ? selectedCustomer?.name || 'Registered Customer'
            : 'Walk-in Cash Customer',
        paymentChannel,
        amountTendered: paymentChannel === 'cash' ? parsedTendered : undefined,
        changeReturned: paymentChannel === 'cash' ? Math.max(0, changeDue) : undefined,
        totalAmount: grossSubtotal,
        discountAmount: discount,
        items: [...cart],
      });
    } catch (err: any) {
      console.error('Failed to create sale', err);
      Alert.alert('Error', err?.message || 'Could not record sale. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrintSaleReceipt = async () => {
    if (!completedSale) return;
    try {
      setIsPrinting(true);
      await printReceipt(
        {
          id: `sale_${Date.now()}`,
          invoiceNo: completedSale.invoiceNo,
          customerName: completedSale.customerName,
          totalAmount: completedSale.totalAmount,
          discountAmount: completedSale.discountAmount,
          netPayable: completedSale.netPayable,
          paymentChannel: completedSale.paymentChannel,
          amountTendered: completedSale.amountTendered,
          changeReturned: completedSale.changeReturned,
          createdAt: new Date().toISOString(),
          itemCount: completedSale.items.length,
        },
        completedSale.items.map((it) => ({
          productName: it.name,
          sku: it.sku,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          totalPrice: it.quantity * it.unitPrice,
        }))
      );
    } catch (e: any) {
      Alert.alert('Printing Error', e?.message || 'Could not print receipt.');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleShareSalePdf = async () => {
    if (!completedSale) return;
    try {
      setIsPrinting(true);
      await shareReceiptPdf(
        {
          id: `sale_${Date.now()}`,
          invoiceNo: completedSale.invoiceNo,
          customerName: completedSale.customerName,
          totalAmount: completedSale.totalAmount,
          discountAmount: completedSale.discountAmount,
          netPayable: completedSale.netPayable,
          paymentChannel: completedSale.paymentChannel,
          amountTendered: completedSale.amountTendered,
          changeReturned: completedSale.changeReturned,
          createdAt: new Date().toISOString(),
          itemCount: completedSale.items.length,
        },
        completedSale.items.map((it) => ({
          productName: it.name,
          sku: it.sku,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          totalPrice: it.quantity * it.unitPrice,
        }))
      );
    } catch (e: any) {
      Alert.alert('PDF Error', e?.message || 'Could not generate PDF receipt.');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleShareSaleWhatsApp = () => {
    if (!completedSale) return;
    const customerPhone = phoneNumber.replace(/[^0-9]/g, '');
    const msg =
      `*RECEIPT #${completedSale.invoiceNo}*%0A` +
      `*Store:* Bamidele & Sons Provisions%0A` +
      `*Total Paid:* ₦${completedSale.netPayable.toLocaleString()}%0A` +
      `*Channel:* ${completedSale.paymentChannel.toUpperCase()}%0A` +
      `*Items:* ${completedSale.items.map((c) => `${c.name} x${c.quantity}`).join(', ')}%0A` +
      `Thank you for your patronage!`;
    Linking.openURL(`https://wa.me/${customerPhone}?text=${msg}`);
  };

  const handleStartNextSale = () => {
    setCart([]);
    setCompletedSale(null);
  };

  const filteredCatalog = products.filter(
    (p) =>
      p.name.toLowerCase().includes(skuSearchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(skuSearchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(skuSearchQuery.toLowerCase())
  );

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
                <Text className="text-[11px] font-bold text-primary">POS Mode</Text>
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
            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={() => setShowBarcodeScannerModal(true)}
                className="flex-row items-center gap-1 px-2.5 py-1 rounded-lg bg-surfaceContainer border border-cardBorder active:bg-surfaceContainerHigh"
              >
                <AppIcon name="barcode_scanner" size={15} color={colors.primary} />
                <Text className="text-xs font-bold text-primary">Scan</Text>
              </Pressable>
              <Pressable
                onPress={() => setShowAddSkuModal(true)}
                className="flex-row items-center gap-1 px-2.5 py-1 rounded-lg bg-primary active:bg-primaryContainer"
              >
                <AppIcon name="add" size={15} color="#ffffff" />
                <Text className="text-xs font-bold text-white">+ SKU</Text>
              </Pressable>
            </View>
          </View>

          {cart.length === 0 ? (
            <View className="bg-white p-6 rounded-xl border border-dashed border-cardBorder items-center justify-center">
              <AppIcon name="shopping_cart" size={28} color={colors.outline} />
              <Text className="text-xs font-semibold text-onSurfaceVariant mt-2">
                Cart is currently empty.
              </Text>
              <Pressable
                onPress={() => setShowAddSkuModal(true)}
                className="mt-2 px-3 py-1.5 rounded-lg bg-primary"
              >
                <Text className="text-xs font-bold text-white">Add Products from Catalog</Text>
              </Pressable>
            </View>
          ) : (
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
                        <Text className="text-[10px] font-semibold text-primary">
                          +₦{item.profitPerUnit.toLocaleString()} profit
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Quantity Stepper & Subtotal */}
                  <View className="flex-row items-center gap-3">
                    <View className="flex-row items-center bg-surfaceContainerLow rounded-lg border border-cardBorder p-0.5">
                      <Pressable
                        onPress={() => updateQuantity(item.id, -1)}
                        className="w-7 h-7 rounded items-center justify-center active:bg-surfaceContainer"
                      >
                        <AppIcon name="remove" size={14} color={colors.onSurface} />
                      </Pressable>
                      <Text className="w-6 text-center text-xs font-bold text-onSurface">
                        {item.quantity}
                      </Text>
                      <Pressable
                        onPress={() => updateQuantity(item.id, 1)}
                        className="w-7 h-7 rounded items-center justify-center active:bg-surfaceContainer"
                      >
                        <AppIcon name="add" size={14} color={colors.onSurface} />
                      </Pressable>
                    </View>
                    <Text className="text-xs font-bold text-onSurface min-w-[65px] text-right">
                      ₦{(item.unitPrice * item.quantity).toLocaleString()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
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

          {/* Registered Customer Directory Selector */}
          {customerType === 'registered' && (
            <View className="bg-white p-3 rounded-xl border border-cardBorder shadow-xs mb-2">
              <Text className="text-xs font-semibold text-onSurfaceVariant mb-2">
                Select Client Account
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {customers.map((c) => (
                  <Pressable
                    key={c.id}
                    onPress={() => handleSelectCustomer(c)}
                    className={`p-2.5 rounded-xl border min-w-[130px] ${
                      selectedCustomerId === c.id
                        ? 'bg-secondaryContainer/50 border-primary'
                        : 'bg-surfaceContainerLow border-cardBorder'
                    }`}
                  >
                    <Text className="text-xs font-bold text-onSurface truncate">{c.name}</Text>
                    <Text className="text-[10px] text-onSurfaceVariant mt-0.5">{c.location}</Text>
                    <Text
                      className={`text-[10px] font-bold mt-1 ${
                        c.balance > 0 ? 'text-error' : 'text-primary'
                      }`}
                    >
                      {c.balance > 0 ? `Owing ₦${c.balance.toLocaleString()}` : 'Settled'}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

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
            <Pressable
              onPress={() => {
                Alert.alert('Market Discount', 'Select courtesy discount to apply:', [
                  { text: 'No Discount (₦0)', onPress: () => setDiscount(0) },
                  { text: '₦500 Discount', onPress: () => setDiscount(500) },
                  { text: '₦1,000 Discount', onPress: () => setDiscount(1000) },
                  { text: '₦2,000 Discount', onPress: () => setDiscount(2000) },
                  { text: 'Cancel', style: 'cancel' },
                ]);
              }}
              className="flex-row items-center gap-1"
            >
              <AppIcon name="price_change" size={14} color={colors.secondary} />
              <Text className="text-xs text-secondary font-medium">
                Market Courtesy Discount ✎
              </Text>
            </Pressable>
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
                  Est. Margin: +₦{totalProfit.toLocaleString()}
                </Text>
              </View>
            </View>
            <Text className="text-3xl font-bold text-onSurface tracking-tight">
              ₦{netPayable.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Payment Channel Selector */}
        <View className="mb-4">
          <Text className="text-xs font-bold text-onSurfaceVariant uppercase tracking-wider mb-2">
            Settlement Channel
          </Text>
          <View className="flex-row gap-2">
            {[
              { id: 'cash', label: 'Cash Till', icon: 'payments' },
              { id: 'transfer', label: 'Bank Transfer', icon: 'account_balance' },
              { id: 'pos', label: 'Moniepoint POS', icon: 'credit_card' },
              { id: 'credit', label: 'Credit (IOU)', icon: 'schedule' },
            ].map((method) => (
              <Pressable
                key={method.id}
                onPress={() => setPaymentChannel(method.id as any)}
                className={`flex-1 p-2.5 rounded-xl border items-center justify-center ${
                  paymentChannel === method.id
                    ? 'bg-primary border-primary'
                    : 'bg-white border-cardBorder'
                }`}
              >
                <AppIcon
                  name={method.icon}
                  size={18}
                  color={paymentChannel === method.id ? '#ffffff' : colors.onSurfaceVariant}
                />
                <Text
                  className={`text-[11px] font-bold mt-1 text-center ${
                    paymentChannel === method.id ? 'text-white' : 'text-onSurface'
                  }`}
                >
                  {method.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Cash Tendered Section */}
        {paymentChannel === 'cash' && (
          <View className="bg-white rounded-xl p-3.5 border border-cardBorder shadow-xs mb-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs font-semibold text-onSurfaceVariant">
                Cash Tendered & Change
              </Text>
              <Pressable onPress={() => setTenderedAmount(netPayable.toString())}>
                <Text className="text-xs font-bold text-primary">Exact Cash</Text>
              </Pressable>
            </View>
            <View className="flex-row items-center justify-between gap-3">
              <View className="flex-1 flex-row items-center bg-surfaceContainerLow px-3 h-11 rounded-lg border border-cardBorder">
                <Text className="text-sm font-bold text-onSurface mr-1">₦</Text>
                <TextInput
                  value={tenderedAmount}
                  onChangeText={setTenderedAmount}
                  keyboardType="numeric"
                  className="flex-1 text-sm font-bold text-onSurface p-0"
                />
              </View>
              <View className="flex-1 items-end justify-center">
                <Text className="text-[10px] text-onSurfaceVariant uppercase font-bold">
                  Change Returned
                </Text>
                <Text
                  className={`text-lg font-bold ${
                    changeDue < 0 ? 'text-error' : 'text-secondary'
                  }`}
                >
                  ₦{Math.max(0, changeDue).toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Primary Final Action CTA */}
        <Pressable
          onPress={handleConfirmSale}
          disabled={submitting || cart.length === 0}
          className={`w-full h-14 bg-primary rounded-2xl flex-row items-center justify-center gap-2 shadow-lg active:bg-primaryContainer mb-2 ${
            submitting || cart.length === 0 ? 'opacity-60' : ''
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

      {/* Add SKU Modal */}
      <Modal
        visible={showAddSkuModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddSkuModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-5 border-t border-cardBorder max-h-[85%]">
            <View className="w-12 h-1 bg-outlineVariant rounded-full self-center mb-3" />

            <View className="flex-row items-center justify-between mb-3">
              <View>
                <Text className="text-lg font-bold text-onSurface">Add Product to Cart</Text>
                <Text className="text-xs text-onSurfaceVariant">
                  Search by SKU, item name, or category
                </Text>
              </View>
              <Pressable
                onPress={() => setShowAddSkuModal(false)}
                className="w-8 h-8 rounded-full bg-surfaceContainer items-center justify-center"
              >
                <AppIcon name="close" size={18} color={colors.onSurfaceVariant} />
              </Pressable>
            </View>

            {/* Search Input */}
            <View className="relative flex-row items-center mb-3">
              <View className="absolute left-3 z-10">
                <AppIcon name="search" size={18} color={colors.slateMuted} />
              </View>
              <TextInput
                value={skuSearchQuery}
                onChangeText={setSkuSearchQuery}
                placeholder="Search products or SKU code..."
                placeholderTextColor={colors.slateMuted}
                className="w-full h-11 pl-9 pr-4 bg-surfaceContainerLow rounded-xl border border-cardBorder text-sm text-onSurface"
              />
            </View>

            {/* Product List */}
            <ScrollView showsVerticalScrollIndicator={false} className="gap-2 mb-4">
              {filteredCatalog.map((prod) => (
                <View
                  key={prod.id}
                  className="p-3 rounded-xl border border-cardBorder bg-surfaceContainerLow flex-row items-center justify-between"
                >
                  <View className="flex-1 mr-2">
                    <Text className="text-xs font-bold text-onSurface">{prod.name}</Text>
                    <View className="flex-row items-center gap-1.5 mt-0.5">
                      <Text className="text-[11px] font-mono text-primary font-bold">
                        {prod.sku}
                      </Text>
                      <Text className="text-xs text-outline">•</Text>
                      <Text className="text-[11px] text-onSurfaceVariant">
                        {prod.stockLeft} {prod.stockUnit} left
                      </Text>
                    </View>
                  </View>
                  <View className="items-end gap-1">
                    <Text className="text-xs font-bold text-onSurface">
                      ₦{prod.sellingPrice.toLocaleString()}
                    </Text>
                    <Pressable
                      onPress={() => {
                        addItemToCart(prod);
                        setShowAddSkuModal(false);
                      }}
                      className="px-3 py-1 bg-primary rounded-lg active:bg-primaryContainer"
                    >
                      <Text className="text-[11px] font-bold text-white">+ Add</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Barcode Scanner Modal */}
      <Modal
        visible={showBarcodeScannerModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBarcodeScannerModal(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white rounded-t-3xl p-5 border-t border-cardBorder max-h-[85%]">
            <View className="w-12 h-1 bg-outlineVariant rounded-full self-center mb-3" />

            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-lg font-bold text-onSurface">Barcode / QR Scanner</Text>
                <Text className="text-xs text-onSurfaceVariant">
                  Point at SKU barcode or enter code directly
                </Text>
              </View>
              <Pressable
                onPress={() => setShowBarcodeScannerModal(false)}
                className="w-8 h-8 rounded-full bg-surfaceContainer items-center justify-center"
              >
                <AppIcon name="close" size={18} color={colors.onSurfaceVariant} />
              </Pressable>
            </View>

            {/* Scanner Viewfinder Box */}
            <View className="w-full h-44 bg-surfaceContainerHighest rounded-2xl items-center justify-center border-2 border-dashed border-primary mb-4 relative overflow-hidden">
              <AppIcon name="barcode_scanner" size={48} color={colors.primary} />
              <Text className="text-xs font-bold text-onSurface mt-2">
                Scanner Viewfinder Active
              </Text>
              <Text className="text-[10px] text-onSurfaceVariant">
                Position barcode within frame
              </Text>
              <View className="absolute top-1/2 left-4 right-4 h-0.5 bg-error opacity-80" />
            </View>

            {/* Quick Barcode Testing Buttons */}
            <Text className="text-xs font-semibold text-onSurfaceVariant mb-1.5">
              Quick SKU Barcode Presets:
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {['DNG-SUG-50', 'PEAK-CAN-48', 'SEMO-10KG', 'GINO-TOM-50', 'IND-SUP-40'].map(
                (code) => (
                  <Pressable
                    key={code}
                    onPress={() => handleScanBarcode(code)}
                    className="px-2.5 py-1.5 bg-surfaceContainerLow border border-cardBorder rounded-lg active:bg-secondaryContainer"
                  >
                    <Text className="text-xs font-mono font-bold text-primary">{code}</Text>
                  </Pressable>
                )
              )}
            </View>

            {/* Manual Code Input */}
            <View className="flex-row items-center gap-2">
              <TextInput
                value={barcodeInput}
                onChangeText={setBarcodeInput}
                placeholder="Or type SKU code..."
                placeholderTextColor={colors.outline}
                className="flex-1 h-12 px-3 bg-surfaceContainerLow rounded-xl border border-cardBorder text-xs font-mono font-bold text-onSurface"
              />
              <Pressable
                onPress={() => handleScanBarcode(barcodeInput)}
                className="h-12 px-4 bg-primary rounded-xl items-center justify-center active:bg-primaryContainer"
              >
                <Text className="text-xs font-bold text-white">Scan SKU</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* 3. Sale Completion & Receipt Modal */}
      <Modal
        visible={!!completedSale}
        animationType="slide"
        transparent
        onRequestClose={() => setCompletedSale(null)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white rounded-t-3xl max-h-[85%] p-5 border-t border-cardBorder shadow-2xl">
            {/* Success Celebration Header */}
            <View className="items-center text-center pb-4 border-b border-cardBorder mb-4">
              <View className="w-16 h-16 rounded-full bg-secondaryContainer items-center justify-center mb-2 shadow-sm">
                <AppIcon name="check_circle" size={36} color={colors.primary} />
              </View>
              <Text className="text-xl font-bold text-onSurface">Sale Successfully Recorded!</Text>
              <Text className="text-xs text-onSurfaceVariant mt-0.5">
                Committed to encrypted local SQLite ledger
              </Text>
              <View className="mt-2 px-3 py-1 bg-surfaceContainerLow rounded-full border border-cardBorder">
                <Text className="text-xs font-mono font-bold text-primary">
                  Invoice #{completedSale?.invoiceNo}
                </Text>
              </View>
            </View>

            {/* Transaction Readout */}
            <View className="bg-surfaceContainerLow p-3.5 rounded-2xl mb-4 gap-2">
              <View className="flex-row justify-between">
                <Text className="text-xs text-onSurfaceVariant">Customer:</Text>
                <Text className="text-xs font-bold text-onSurface">
                  {completedSale?.customerName}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-xs text-onSurfaceVariant">Payment Channel:</Text>
                <Text className="text-xs font-bold text-primary uppercase">
                  {completedSale?.paymentChannel}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-xs text-onSurfaceVariant">Items Count:</Text>
                <Text className="text-xs font-bold text-onSurface">
                  {completedSale?.items.length} SKUs
                </Text>
              </View>
              <View className="flex-row justify-between pt-2 border-t border-cardBorder">
                <Text className="text-sm font-bold text-onSurface">Total Amount Paid:</Text>
                <Text className="text-lg font-black text-primary">
                  ₦{completedSale?.netPayable.toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="gap-2.5">
              <View className="flex-row gap-2">
                <Pressable
                  disabled={isPrinting}
                  onPress={handlePrintSaleReceipt}
                  className="flex-1 h-12 bg-primary rounded-xl flex-row items-center justify-center gap-2 active:bg-primaryContainer shadow-sm"
                >
                  {isPrinting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <AppIcon name="print" size={18} color="#ffffff" />
                      <Text className="text-xs font-bold text-white">Print Thermal</Text>
                    </>
                  )}
                </Pressable>

                <Pressable
                  disabled={isPrinting}
                  onPress={handleShareSalePdf}
                  className="flex-1 h-12 bg-surfaceContainer rounded-xl flex-row items-center justify-center gap-2 active:bg-surfaceContainerHigh"
                >
                  <AppIcon name="picture_as_pdf" size={18} color={colors.onSurface} />
                  <Text className="text-xs font-bold text-onSurface">Share PDF</Text>
                </Pressable>
              </View>

              <Pressable
                onPress={handleShareSaleWhatsApp}
                className="w-full h-12 bg-secondaryContainer rounded-xl flex-row items-center justify-center gap-2 active:opacity-90 shadow-xs"
              >
                <AppIcon name="chat" size={18} color={colors.onSecondaryContainer} />
                <Text className="text-xs font-bold text-onSecondaryContainer">
                  Send WhatsApp Customer Slip
                </Text>
              </Pressable>

              <View className="flex-row gap-2 mt-1">
                <Pressable
                  onPress={handleStartNextSale}
                  className="flex-1 h-11 bg-surfaceContainer rounded-xl items-center justify-center active:bg-surfaceContainerHigh"
                >
                  <Text className="text-xs font-bold text-onSurface">New Sale</Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setCompletedSale(null);
                    router.back();
                  }}
                  className="flex-1 h-11 bg-surfaceContainerLow border border-cardBorder rounded-xl items-center justify-center active:bg-surfaceContainer"
                >
                  <Text className="text-xs font-semibold text-onSurfaceVariant">Back to Till</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
