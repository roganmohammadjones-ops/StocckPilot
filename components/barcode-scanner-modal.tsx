import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { AppIcon } from './icon';
import { colors } from '@/lib/theme';

interface BarcodeScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
  title?: string;
  subtitle?: string;
  quickCodes?: string[];
}

const DEFAULT_DEMO_CODES = [
  'DNG-SUG-50',
  'SEMO-10KG',
  'PEAK-CAN-48',
  'GINO-SACH-50',
  'IND-ONION-40',
];

export function BarcodeScannerModal({
  visible,
  onClose,
  onScan,
  title = 'Barcode & SKU Scanner',
  subtitle = 'Point camera at product barcode or type SKU below',
  quickCodes = DEFAULT_DEMO_CODES,
}: BarcodeScannerModalProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [manualInput, setManualInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const lastScannedRef = useRef<{ code: string; time: number } | null>(null);

  const handleBarcodeScanned = useCallback(
    ({ data }: { data: string }) => {
      const code = data?.trim();
      if (!code) return;

      const now = Date.now();
      // Debounce: ignore same barcode within 1.5 seconds
      if (
        lastScannedRef.current &&
        lastScannedRef.current.code === code &&
        now - lastScannedRef.current.time < 1500
      ) {
        return;
      }

      lastScannedRef.current = { code, time: now };
      setIsProcessing(true);

      setTimeout(() => {
        setIsProcessing(false);
        onScan(code);
      }, 250);
    },
    [onScan]
  );

  const handleManualSubmit = () => {
    const code = manualInput.trim();
    if (!code) return;
    setManualInput('');
    onScan(code);
  };

  const hasPermission = permission?.granted;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/75 justify-end">
        <View className="bg-white rounded-t-3xl max-h-[92%] p-5 border-t border-cardBorder shadow-2xl">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-cardBorder mb-4">
            <View className="flex-1 mr-2">
              <View className="flex-row items-center gap-2">
                <Text className="text-base font-bold text-onSurface">{title}</Text>
                <View className="px-2 py-0.5 rounded-full bg-secondaryContainer">
                  <Text className="text-[10px] font-bold text-onSecondaryContainer">
                    Camera Live
                  </Text>
                </View>
              </View>
              <Text className="text-xs text-onSurfaceVariant mt-0.5">{subtitle}</Text>
            </View>
            <Pressable
              onPress={onClose}
              className="w-9 h-9 rounded-full bg-surfaceContainerLow items-center justify-center active:bg-surfaceContainer"
            >
              <AppIcon name="close" size={20} color={colors.onSurface} />
            </Pressable>
          </View>

          {/* Camera Viewfinder Box */}
          <View className="w-full h-56 rounded-2xl bg-black mb-4 relative overflow-hidden items-center justify-center border-2 border-primary">
            {hasPermission ? (
              <View className="w-full h-full relative">
                <CameraView
                  facing={facing}
                  enableTorch={torchEnabled}
                  barcodeScannerSettings={{
                    barcodeTypes: [
                      'qr',
                      'ean13',
                      'ean8',
                      'code128',
                      'code39',
                      'upc_a',
                      'upc_e',
                    ],
                  }}
                  onBarcodeScanned={isProcessing ? undefined : handleBarcodeScanned}
                  style={{ width: '100%', height: '100%' }}
                />

                {/* Reticle / Viewfinder Targeting Overlay */}
                <View className="absolute inset-0 items-center justify-center pointer-events-none">
                  {/* Targeting corners */}
                  <View className="w-48 h-28 border-2 border-white/80 rounded-xl relative items-center justify-center">
                    {/* Corner accents */}
                    <View className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-primary rounded-tl-sm" />
                    <View className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-primary rounded-tr-sm" />
                    <View className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-primary rounded-bl-sm" />
                    <View className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-primary rounded-br-sm" />

                    {/* Animated Scanning Laser Line */}
                    <View className="w-full h-0.5 bg-error shadow-sm" />
                  </View>

                  <Text className="text-[11px] font-semibold text-white/90 bg-black/50 px-2.5 py-1 rounded-full mt-3">
                    Align barcode within reticle
                  </Text>
                </View>

                {/* Torch & Camera Controls Overlay */}
                <View className="absolute top-2.5 right-2.5 flex-row gap-2">
                  {Platform.OS !== 'web' && (
                    <Pressable
                      onPress={() => setTorchEnabled(!torchEnabled)}
                      className={`w-9 h-9 rounded-full items-center justify-center ${
                        torchEnabled ? 'bg-primary' : 'bg-black/60'
                      }`}
                    >
                      <AppIcon
                        name="flash_on"
                        size={18}
                        color={torchEnabled ? '#ffffff' : '#f8fafc'}
                      />
                    </Pressable>
                  )}

                  <Pressable
                    onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}
                    className="w-9 h-9 rounded-full bg-black/60 items-center justify-center"
                  >
                    <AppIcon name="flip_camera_ios" size={18} color="#ffffff" />
                  </Pressable>
                </View>

                {isProcessing && (
                  <View className="absolute inset-0 bg-primary/40 items-center justify-center">
                    <ActivityIndicator size="large" color="#ffffff" />
                    <Text className="text-xs font-bold text-white mt-2">
                      Barcode Detected!
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              /* Fallback view when camera permission is pending or unavailable */
              <View className="p-4 items-center justify-center text-center">
                <View className="w-12 h-12 rounded-full bg-surfaceContainerHighest items-center justify-center mb-2">
                  <AppIcon name="camera_alt" size={26} color={colors.primary} />
                </View>
                <Text className="text-sm font-bold text-white mb-1">
                  Camera Access Required
                </Text>
                <Text className="text-[11px] text-white/70 text-center max-w-xs mb-3">
                  StockPilot needs camera permission to scan product barcodes and cartons directly into the till.
                </Text>
                <Pressable
                  onPress={() => requestPermission()}
                  className="px-4 py-2 bg-primary rounded-xl active:bg-primaryContainer flex-row items-center gap-1.5"
                >
                  <AppIcon name="check" size={16} color="#ffffff" />
                  <Text className="text-xs font-bold text-white">Enable Camera Access</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Quick SKU Chips for Instant Testing */}
          <View className="mb-3">
            <Text className="text-[11px] font-bold text-onSurfaceVariant uppercase tracking-wider mb-2">
              Quick SKU Codes / Test Barcodes
            </Text>
            <View className="flex-row flex-wrap gap-1.5">
              {quickCodes.map((code) => (
                <Pressable
                  key={code}
                  onPress={() => onScan(code)}
                  className="px-2.5 py-1.5 bg-surfaceContainerLow border border-cardBorder rounded-lg active:bg-secondaryContainer"
                >
                  <Text className="text-xs font-mono font-bold text-primary">{code}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Manual Barcode / SKU Code Text Input */}
          <View className="flex-row items-center gap-2">
            <TextInput
              value={manualInput}
              onChangeText={setManualInput}
              onSubmitEditing={handleManualSubmit}
              placeholder="Or type SKU / Barcode numbers..."
              placeholderTextColor={colors.outline}
              autoCapitalize="characters"
              returnKeyType="done"
              className="flex-1 h-12 px-3.5 bg-surfaceContainerLow rounded-xl border border-cardBorder text-xs font-mono font-bold text-onSurface"
            />
            <Pressable
              onPress={handleManualSubmit}
              className="h-12 px-4 bg-primary rounded-xl items-center justify-center active:bg-primaryContainer"
            >
              <Text className="text-xs font-bold text-white">Scan SKU</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
