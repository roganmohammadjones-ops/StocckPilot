import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  Linking,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { AppIcon } from './icon';
import { colors } from '@/lib/theme';
import type { SaleRecord, WaybillRecord, WaybillInput } from '@/lib/db/types';
import { useDatabase } from '@/lib/db/provider';
import {
  createWaybill,
  getWaybillBySaleId,
  updateWaybillStatus,
  getSaleItems,
} from '@/lib/db/queries';
import {
  printWaybill,
  shareWaybillPdf,
  generateWaybillWhatsAppMessage,
} from '@/lib/receipt';
import { getStoreProfile } from '@/lib/store-profile';

interface WaybillModalProps {
  visible: boolean;
  onClose: () => void;
  sale: SaleRecord | null;
  onWaybillCreated?: (waybill: WaybillRecord) => void;
}

const COMMON_TRANSPORTERS = [
  'Young Shall Grow',
  'GIG Logistics',
  'GUO Transport',
  'Peace Mass',
  'ANIDS Logistics',
  'Chisco Transport',
  'Local Park Haulage',
];

const COMMON_PARKS = [
  'Ojota Luxury Park',
  'Mile 2 Park',
  'Maza-Maza Bay',
  'Trade Fair Bay 4',
  'Alaba Int’l Bay 2',
  'Upper Iweka Park',
  'Sabon Gari Kano',
];

const POPULAR_DESTINATIONS = [
  'Onitsha',
  'Kano',
  'Aba',
  'Abuja',
  'Port Harcourt',
  'Ibadan',
  'Enugu',
  'Jos',
  'Benin City',
  'Kaduna',
];

const PACKAGE_TYPES = ['cartons', 'bags', 'bales', 'drums', 'crates', 'mixed'];

export function WaybillModal({
  visible,
  onClose,
  sale,
  onWaybillCreated,
}: WaybillModalProps) {
  const { width } = useWindowDimensions();
  const isWide = width >= 768;
  const db = useDatabase();
  const store = getStoreProfile();

  // State
  const [loading, setLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [existingWaybill, setExistingWaybill] = useState<WaybillRecord | null>(null);

  // Form Fields
  const [transporterName, setTransporterName] = useState('Young Shall Grow');
  const [parkLoadingBay, setParkLoadingBay] = useState('Ojota Luxury Park');
  const [destinationCity, setDestinationCity] = useState('Onitsha');
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [packagesCount, setPackagesCount] = useState('1');
  const [packageType, setPackageType] = useState('cartons');
  const [carriageFee, setCarriageFee] = useState('');
  const [porterFee, setPorterFee] = useState('');
  const [notes, setNotes] = useState('');

  // Load existing waybill for this sale if available
  useEffect(() => {
    if (visible && sale) {
      setLoading(true);
      getWaybillBySaleId(db, sale.id)
        .then((wb) => {
          setExistingWaybill(wb);
          if (!wb) {
            // Pre-fill creation form
            setReceiverName(
              sale.customerName && sale.customerName !== 'Walk-in Cash Customer'
                ? sale.customerName
                : ''
            );
            setPackagesCount(String(sale.itemCount || 1));
            setPackageType('cartons');
            setTransporterName('Young Shall Grow');
            setParkLoadingBay('Ojota Luxury Park');
            setDestinationCity('Onitsha');
            setDriverPhone('');
            setVehiclePlate('');
            setCarriageFee('');
            setPorterFee('');
            setNotes('');
          }
        })
        .catch((err) => {
          console.error('Failed to load waybill', err);
        })
        .finally(() => setLoading(false));
    } else {
      setExistingWaybill(null);
    }
  }, [visible, sale, db]);

  if (!sale) return null;

  const handleSaveWaybill = async () => {
    if (!receiverName.trim()) {
      Alert.alert('Required Field', 'Please enter the receiver / consignee name.');
      return;
    }
    if (!driverPhone.trim()) {
      Alert.alert('Required Field', 'Please enter the driver or transporter contact phone.');
      return;
    }

    try {
      setLoading(true);
      const input: WaybillInput = {
        saleId: sale.id,
        invoiceNo: sale.invoiceNo,
        transporterName: transporterName.trim(),
        parkLoadingBay: parkLoadingBay.trim(),
        driverPhone: driverPhone.trim(),
        vehiclePlate: vehiclePlate.trim() || undefined,
        destinationCity: destinationCity.trim(),
        receiverName: receiverName.trim(),
        receiverPhone: receiverPhone.trim() || driverPhone.trim(),
        packagesCount: parseInt(packagesCount, 10) || 1,
        packageType,
        carriageFee: carriageFee ? parseFloat(carriageFee) : 0,
        porterFee: porterFee ? parseFloat(porterFee) : 0,
        status: 'in_transit',
        notes: notes.trim() || undefined,
      };

      const newId = await createWaybill(db, input);
      const created = await getWaybillBySaleId(db, sale.id);
      if (created) {
        setExistingWaybill(created);
        onWaybillCreated?.(created);
      } else {
        const fallbackWb: WaybillRecord = {
          id: newId,
          ...input,
          waybillNo: `WB-${Date.now().toString().slice(-6)}`,
          packageType: input.packageType || 'cartons',
          status: 'in_transit',
          createdAt: new Date().toISOString(),
        };
        setExistingWaybill(fallbackWb);
        onWaybillCreated?.(fallbackWb);
      }
      Alert.alert(
        'Waybill Issued',
        `Interstate dispatch manifest created successfully.`
      );
    } catch (e: any) {
      console.error('Failed to save waybill', e);
      Alert.alert('Error', e?.message || 'Could not generate waybill manifest.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: 'loading' | 'in_transit' | 'delivered') => {
    if (!existingWaybill) return;
    try {
      await updateWaybillStatus(db, existingWaybill.id, newStatus);
      const updated: WaybillRecord = { ...existingWaybill, status: newStatus };
      setExistingWaybill(updated);
      onWaybillCreated?.(updated);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not update status');
    }
  };

  const handlePrint = async () => {
    if (!existingWaybill) return;
    try {
      setIsPrinting(true);
      const items = await getSaleItems(db, sale.id);
      await printWaybill(existingWaybill, sale, items, {
        businessName: store.businessName,
        tradeHub: `${store.marketLocation} • ${store.marketStall}`,
        phone: store.phone,
        cashierName: store.ownerName,
      });
    } catch (e: any) {
      Alert.alert('Print Error', e?.message || 'Failed to print waybill.');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleSharePdf = async () => {
    if (!existingWaybill) return;
    try {
      setIsPrinting(true);
      const items = await getSaleItems(db, sale.id);
      await shareWaybillPdf(existingWaybill, sale, items, {
        businessName: store.businessName,
        tradeHub: `${store.marketLocation} • ${store.marketStall}`,
        phone: store.phone,
        cashierName: store.ownerName,
      });
    } catch (e: any) {
      Alert.alert('PDF Error', e?.message || 'Failed to share waybill PDF.');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleWhatsAppDriver = () => {
    if (!existingWaybill) return;
    const msg = generateWaybillWhatsAppMessage(existingWaybill, sale, {
      businessName: store.businessName,
      tradeHub: `${store.marketLocation} • ${store.marketStall}`,
      phone: store.phone,
    }, 'driver');
    const phoneParam = existingWaybill.driverPhone.replace(/[^0-9]/g, '');
    const cleanPhone = phoneParam.startsWith('0')
      ? `234${phoneParam.slice(1)}`
      : phoneParam;
    Linking.openURL(`https://wa.me/${cleanPhone || ''}?text=${msg}`);
  };

  const handleWhatsAppReceiver = () => {
    if (!existingWaybill) return;
    const msg = generateWaybillWhatsAppMessage(existingWaybill, sale, {
      businessName: store.businessName,
      tradeHub: `${store.marketLocation} • ${store.marketStall}`,
      phone: store.phone,
    }, 'receiver');
    const phoneParam = existingWaybill.receiverPhone.replace(/[^0-9]/g, '');
    const cleanPhone = phoneParam.startsWith('0')
      ? `234${phoneParam.slice(1)}`
      : phoneParam;
    Linking.openURL(`https://wa.me/${cleanPhone || ''}?text=${msg}`);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View
        className={`flex-1 bg-black/60 ${
          isWide ? 'justify-center items-center p-4' : 'justify-end'
        }`}
      >
        <View
          className={`bg-white ${
            isWide
              ? 'rounded-3xl max-w-2xl w-full p-6 shadow-2xl max-h-[90%]'
              : 'rounded-t-3xl p-5 border-t border-cardBorder max-h-[92%]'
          }`}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-cardBorder mb-3">
            <View className="flex-row items-center gap-2">
              <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center">
                <AppIcon name="local_shipping" size={22} color={colors.primary} />
              </View>
              <View>
                <Text className="text-base font-bold text-onSurface">
                  {existingWaybill ? 'Waybill & Dispatch Manifest' : 'Issue Interstate Waybill'}
                </Text>
                <Text className="text-xs text-onSurfaceVariant">
                  Ref Invoice #{sale.invoiceNo} • {sale.customerName}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-surfaceContainerLow items-center justify-center active:bg-surfaceContainer"
            >
              <AppIcon name="close" size={18} color={colors.onSurfaceVariant} />
            </Pressable>
          </View>

          {loading ? (
            <View className="py-12 items-center justify-center">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="text-xs text-onSurfaceVariant mt-2">Loading manifest details...</Text>
            </View>
          ) : existingWaybill ? (
            /* ========================================================== */
            /* VIEW MODE: Existing Waybill Manifest                      */
            /* ========================================================== */
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {/* Waybill Status Banner */}
              <View className="bg-surfaceContainerLow p-4 rounded-2xl mb-4 border border-cardBorder">
                <View className="flex-row items-center justify-between mb-2">
                  <View>
                    <Text className="text-[11px] font-semibold text-onSurfaceVariant uppercase">
                      Waybill Number
                    </Text>
                    <Text className="text-lg font-mono font-black text-primary">
                      #{existingWaybill.waybillNo}
                    </Text>
                  </View>
                  <View
                    className={`px-3 py-1 rounded-full ${
                      existingWaybill.status === 'delivered'
                        ? 'bg-secondaryContainer'
                        : existingWaybill.status === 'in_transit'
                        ? 'bg-blue-100'
                        : 'bg-amber-100'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold uppercase ${
                        existingWaybill.status === 'delivered'
                          ? 'text-onSecondaryContainer'
                          : existingWaybill.status === 'in_transit'
                          ? 'text-blue-800'
                          : 'text-amber-800'
                      }`}
                    >
                      {existingWaybill.status.replace('_', ' ')}
                    </Text>
                  </View>
                </View>

                {/* Status Switcher Pills */}
                <View className="flex-row gap-1.5 mt-2 pt-2 border-t border-cardBorder">
                  <Pressable
                    onPress={() => handleStatusChange('loading')}
                    className={`flex-1 py-1.5 rounded-lg items-center ${
                      existingWaybill.status === 'loading'
                        ? 'bg-amber-600'
                        : 'bg-white border border-cardBorder'
                    }`}
                  >
                    <Text
                      className={`text-[11px] font-bold ${
                        existingWaybill.status === 'loading' ? 'text-white' : 'text-onSurfaceVariant'
                      }`}
                    >
                      Loading Bay
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => handleStatusChange('in_transit')}
                    className={`flex-1 py-1.5 rounded-lg items-center ${
                      existingWaybill.status === 'in_transit'
                        ? 'bg-blue-600'
                        : 'bg-white border border-cardBorder'
                    }`}
                  >
                    <Text
                      className={`text-[11px] font-bold ${
                        existingWaybill.status === 'in_transit' ? 'text-white' : 'text-onSurfaceVariant'
                      }`}
                    >
                      In Transit
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => handleStatusChange('delivered')}
                    className={`flex-1 py-1.5 rounded-lg items-center ${
                      existingWaybill.status === 'delivered'
                        ? 'bg-primary'
                        : 'bg-white border border-cardBorder'
                    }`}
                  >
                    <Text
                      className={`text-[11px] font-bold ${
                        existingWaybill.status === 'delivered' ? 'text-white' : 'text-onSurfaceVariant'
                      }`}
                    >
                      Delivered
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Transit Route Strip */}
              <View className="bg-primary/10 p-3 rounded-xl mb-4 flex-row items-center justify-between border border-primary/20">
                <View className="flex-row items-center gap-1.5">
                  <AppIcon name="place" size={16} color={colors.primary} />
                  <Text className="text-xs font-bold text-primary">
                    {store.marketLocation?.split('•')[0].trim() || 'Lagos'}
                  </Text>
                </View>
                <AppIcon name="arrow_forward" size={16} color={colors.primary} />
                <View className="flex-row items-center gap-1.5">
                  <AppIcon name="flag" size={16} color={colors.primary} />
                  <Text className="text-xs font-black text-primary uppercase">
                    {existingWaybill.destinationCity}
                  </Text>
                </View>
              </View>

              {/* Details Readout Grid */}
              <View className="gap-2.5 mb-4">
                {/* Consignee */}
                <View className="p-3 bg-surfaceContainerLow rounded-xl border border-cardBorder">
                  <Text className="text-[10px] font-bold text-onSurfaceVariant uppercase mb-1">
                    Consignee (Receiver)
                  </Text>
                  <Text className="text-sm font-bold text-onSurface">
                    {existingWaybill.receiverName}
                  </Text>
                  <Text className="text-xs text-onSurfaceVariant mt-0.5">
                    Phone: {existingWaybill.receiverPhone}
                  </Text>
                  <Text className="text-xs font-semibold text-primary mt-0.5">
                    Destination: {existingWaybill.destinationCity}
                  </Text>
                </View>

                {/* Transporter */}
                <View className="p-3 bg-surfaceContainerLow rounded-xl border border-cardBorder">
                  <Text className="text-[10px] font-bold text-onSurfaceVariant uppercase mb-1">
                    Logistics Transporter & Driver
                  </Text>
                  <Text className="text-sm font-bold text-onSurface">
                    {existingWaybill.transporterName}
                  </Text>
                  <Text className="text-xs text-onSurfaceVariant mt-0.5">
                    Park Bay: {existingWaybill.parkLoadingBay}
                  </Text>
                  <View className="flex-row items-center justify-between mt-1 pt-1 border-t border-cardBorder">
                    <Text className="text-xs font-semibold text-onSurface">
                      Driver: {existingWaybill.driverPhone}
                    </Text>
                    {existingWaybill.vehiclePlate ? (
                      <Text className="text-xs font-mono font-bold text-onSurfaceVariant">
                        Plate: {existingWaybill.vehiclePlate}
                      </Text>
                    ) : null}
                  </View>
                </View>

                {/* Parcels & Fees */}
                <View className="p-3 bg-secondaryContainer/50 rounded-xl border border-secondary/20">
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-xs text-onSurfaceVariant">Consignment Parcels:</Text>
                    <Text className="text-xs font-bold text-primary">
                      {existingWaybill.packagesCount} {existingWaybill.packageType.toUpperCase()}
                    </Text>
                  </View>
                  {existingWaybill.carriageFee ? (
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-xs text-onSurfaceVariant">Carriage / Freight:</Text>
                      <Text className="text-xs font-bold text-onSurface">
                        ₦{existingWaybill.carriageFee.toLocaleString()}
                      </Text>
                    </View>
                  ) : null}
                  {existingWaybill.porterFee ? (
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-xs text-onSurfaceVariant">Porterage / Kaya Fee:</Text>
                      <Text className="text-xs font-bold text-onSurface">
                        ₦{existingWaybill.porterFee.toLocaleString()}
                      </Text>
                    </View>
                  ) : null}
                  <View className="flex-row justify-between pt-1 border-t border-secondary/30">
                    <Text className="text-xs font-bold text-onSurface">Declared Goods Value:</Text>
                    <Text className="text-xs font-black text-primary">
                      ₦{sale.netPayable.toLocaleString()}
                    </Text>
                  </View>
                </View>

                {existingWaybill.notes ? (
                  <View className="p-2.5 bg-amber-50 rounded-xl border border-amber-200">
                    <Text className="text-[11px] text-amber-900">
                      <strong>Notes:</strong> {existingWaybill.notes}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Action Buttons */}
              <View className="gap-2">
                <View className="flex-row gap-2">
                  <Pressable
                    disabled={isPrinting}
                    onPress={handlePrint}
                    className="flex-1 h-12 bg-primary rounded-xl flex-row items-center justify-center gap-1.5 active:bg-primaryContainer shadow-sm"
                  >
                    {isPrinting ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <AppIcon name="print" size={18} color="#ffffff" />
                        <Text className="text-xs font-bold text-white">Print Waybill</Text>
                      </>
                    )}
                  </Pressable>

                  <Pressable
                    disabled={isPrinting}
                    onPress={handleSharePdf}
                    className="flex-1 h-12 bg-surfaceContainer rounded-xl flex-row items-center justify-center gap-1.5 active:bg-surfaceContainerHigh"
                  >
                    <AppIcon name="picture_as_pdf" size={18} color={colors.onSurface} />
                    <Text className="text-xs font-bold text-onSurface">Share PDF</Text>
                  </Pressable>
                </View>

                <View className="flex-row gap-2">
                  <Pressable
                    onPress={handleWhatsAppDriver}
                    className="flex-1 h-11 bg-secondaryContainer rounded-xl flex-row items-center justify-center gap-1.5 active:opacity-90 shadow-xs"
                  >
                    <AppIcon name="chat" size={16} color={colors.onSecondaryContainer} />
                    <Text className="text-[11px] font-bold text-onSecondaryContainer">
                      WhatsApp Driver
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={handleWhatsAppReceiver}
                    className="flex-1 h-11 bg-surfaceContainerLow border border-cardBorder rounded-xl flex-row items-center justify-center gap-1.5 active:bg-surfaceContainer"
                  >
                    <AppIcon name="chat" size={16} color={colors.primary} />
                    <Text className="text-[11px] font-bold text-primary">
                      Notify Receiver
                    </Text>
                  </Pressable>
                </View>
              </View>
            </ScrollView>
          ) : (
            /* ========================================================== */
            /* CREATE MODE: Generate New Waybill Manifest                 */
            /* ========================================================== */
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              <Text className="text-xs text-onSurfaceVariant mb-3">
                Logistics manifest for interstate transport lines (Lagos ➔ Onitsha, Kano, Aba, Bodija, etc.)
              </Text>

              {/* 1. Destination City */}
              <View className="mb-3.5">
                <Text className="text-xs font-bold text-onSurface mb-1">
                  Destination City / Market Hub *
                </Text>
                <TextInput
                  value={destinationCity}
                  onChangeText={setDestinationCity}
                  placeholder="e.g. Onitsha, Kano, Aba"
                  placeholderTextColor={colors.onSurfaceVariant}
                  className="w-full h-11 bg-surfaceContainerLow border border-cardBorder rounded-xl px-3.5 text-xs font-semibold text-onSurface"
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-1.5 mt-2">
                  {POPULAR_DESTINATIONS.map((city) => (
                    <Pressable
                      key={city}
                      onPress={() => setDestinationCity(city)}
                      className={`px-2.5 py-1 rounded-lg border ${
                        destinationCity.toLowerCase() === city.toLowerCase()
                          ? 'bg-primary border-primary'
                          : 'bg-surfaceContainerLow border-cardBorder'
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-bold ${
                          destinationCity.toLowerCase() === city.toLowerCase()
                            ? 'text-white'
                            : 'text-onSurfaceVariant'
                        }`}
                      >
                        {city}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {/* 2. Receiver Details */}
              <View className="mb-3.5">
                <Text className="text-xs font-bold text-onSurface mb-1">
                  Receiver / Consignee Name *
                </Text>
                <TextInput
                  value={receiverName}
                  onChangeText={setReceiverName}
                  placeholder="e.g. Chief Emeka Okafor"
                  placeholderTextColor={colors.onSurfaceVariant}
                  className="w-full h-11 bg-surfaceContainerLow border border-cardBorder rounded-xl px-3.5 text-xs font-semibold text-onSurface mb-2"
                />
                <TextInput
                  value={receiverPhone}
                  onChangeText={setReceiverPhone}
                  keyboardType="phone-pad"
                  placeholder="Receiver Phone (e.g. 0803 123 4567)"
                  placeholderTextColor={colors.onSurfaceVariant}
                  className="w-full h-11 bg-surfaceContainerLow border border-cardBorder rounded-xl px-3.5 text-xs font-semibold text-onSurface"
                />
              </View>

              {/* 3. Transporter & Park */}
              <View className="mb-3.5">
                <Text className="text-xs font-bold text-onSurface mb-1">
                  Transporter Company / Line *
                </Text>
                <TextInput
                  value={transporterName}
                  onChangeText={setTransporterName}
                  placeholder="e.g. Young Shall Grow, GIG, GUO"
                  placeholderTextColor={colors.onSurfaceVariant}
                  className="w-full h-11 bg-surfaceContainerLow border border-cardBorder rounded-xl px-3.5 text-xs font-semibold text-onSurface"
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-1.5 mt-2">
                  {COMMON_TRANSPORTERS.map((t) => (
                    <Pressable
                      key={t}
                      onPress={() => setTransporterName(t)}
                      className={`px-2.5 py-1 rounded-lg border ${
                        transporterName === t
                          ? 'bg-secondaryContainer border-secondary'
                          : 'bg-surfaceContainerLow border-cardBorder'
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-bold ${
                          transporterName === t ? 'text-onSecondaryContainer' : 'text-onSurfaceVariant'
                        }`}
                      >
                        {t}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {/* Motor Park Loading Bay */}
              <View className="mb-3.5">
                <Text className="text-xs font-bold text-onSurface mb-1">
                  Motor Park / Loading Bay
                </Text>
                <TextInput
                  value={parkLoadingBay}
                  onChangeText={setParkLoadingBay}
                  placeholder="e.g. Ojota Luxury Park, Mile 2"
                  placeholderTextColor={colors.onSurfaceVariant}
                  className="w-full h-11 bg-surfaceContainerLow border border-cardBorder rounded-xl px-3.5 text-xs font-semibold text-onSurface"
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-1.5 mt-2">
                  {COMMON_PARKS.map((p) => (
                    <Pressable
                      key={p}
                      onPress={() => setParkLoadingBay(p)}
                      className={`px-2.5 py-1 rounded-lg border ${
                        parkLoadingBay === p
                          ? 'bg-primary/20 border-primary'
                          : 'bg-surfaceContainerLow border-cardBorder'
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-bold ${
                          parkLoadingBay === p ? 'text-primary' : 'text-onSurfaceVariant'
                        }`}
                      >
                        {p}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {/* Driver & Vehicle */}
              <View className="flex-row gap-2 mb-3.5">
                <View className="flex-1">
                  <Text className="text-xs font-bold text-onSurface mb-1">
                    Driver Phone *
                  </Text>
                  <TextInput
                    value={driverPhone}
                    onChangeText={setDriverPhone}
                    keyboardType="phone-pad"
                    placeholder="0803 000 0000"
                    placeholderTextColor={colors.onSurfaceVariant}
                    className="w-full h-11 bg-surfaceContainerLow border border-cardBorder rounded-xl px-3.5 text-xs font-semibold text-onSurface"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-onSurface mb-1">
                    Vehicle Plate No.
                  </Text>
                  <TextInput
                    value={vehiclePlate}
                    onChangeText={setVehiclePlate}
                    autoCapitalize="characters"
                    placeholder="e.g. KTU-482-XA"
                    placeholderTextColor={colors.onSurfaceVariant}
                    className="w-full h-11 bg-surfaceContainerLow border border-cardBorder rounded-xl px-3.5 text-xs font-semibold text-onSurface font-mono"
                  />
                </View>
              </View>

              {/* Packages Count & Type */}
              <View className="flex-row gap-2 mb-3.5">
                <View className="w-28">
                  <Text className="text-xs font-bold text-onSurface mb-1">
                    Packages Qty
                  </Text>
                  <TextInput
                    value={packagesCount}
                    onChangeText={setPackagesCount}
                    keyboardType="numeric"
                    placeholder="1"
                    placeholderTextColor={colors.onSurfaceVariant}
                    className="w-full h-11 bg-surfaceContainerLow border border-cardBorder rounded-xl px-3.5 text-xs font-bold text-onSurface text-center"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-onSurface mb-1">
                    Package Type
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-1.5 pt-1">
                    {PACKAGE_TYPES.map((type) => (
                      <Pressable
                        key={type}
                        onPress={() => setPackageType(type)}
                        className={`px-3 py-2 rounded-lg border ${
                          packageType === type
                            ? 'bg-primary border-primary'
                            : 'bg-surfaceContainerLow border-cardBorder'
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold uppercase ${
                            packageType === type ? 'text-white' : 'text-onSurfaceVariant'
                          }`}
                        >
                          {type}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              </View>

              {/* Freight & Porterage Fees */}
              <View className="flex-row gap-2 mb-3.5">
                <View className="flex-1">
                  <Text className="text-xs font-bold text-onSurface mb-1">
                    Carriage / Freight (₦)
                  </Text>
                  <TextInput
                    value={carriageFee}
                    onChangeText={setCarriageFee}
                    keyboardType="numeric"
                    placeholder="e.g. 15,000"
                    placeholderTextColor={colors.onSurfaceVariant}
                    className="w-full h-11 bg-surfaceContainerLow border border-cardBorder rounded-xl px-3.5 text-xs font-semibold text-onSurface"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-onSurface mb-1">
                    Porterage (Kaya) Fee (₦)
                  </Text>
                  <TextInput
                    value={porterFee}
                    onChangeText={setPorterFee}
                    keyboardType="numeric"
                    placeholder="e.g. 2,000"
                    placeholderTextColor={colors.onSurfaceVariant}
                    className="w-full h-11 bg-surfaceContainerLow border border-cardBorder rounded-xl px-3.5 text-xs font-semibold text-onSurface"
                  />
                </View>
              </View>

              {/* Notes */}
              <View className="mb-4">
                <Text className="text-xs font-bold text-onSurface mb-1">
                  Park / Waybill Instructions
                </Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="e.g. Consignee will collect at Upper Iweka ANIDS office with ID card"
                  placeholderTextColor={colors.onSurfaceVariant}
                  className="w-full h-12 bg-surfaceContainerLow border border-cardBorder rounded-xl px-3.5 text-xs text-onSurface"
                />
              </View>

              {/* Submit CTA */}
              <Pressable
                onPress={handleSaveWaybill}
                className="w-full h-12 bg-primary rounded-xl flex-row items-center justify-center gap-2 active:bg-primaryContainer shadow-sm"
              >
                <AppIcon name="local_shipping" size={20} color="#ffffff" />
                <Text className="text-sm font-bold text-white">
                  Issue Waybill & Dispatch Manifest
                </Text>
              </Pressable>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
