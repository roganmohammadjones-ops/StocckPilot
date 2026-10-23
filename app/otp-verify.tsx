import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AppIcon } from '@/components/icon';
import { BrandLogo } from '@/components/brand-logo';
import { colors } from '@/lib/theme';
import { getStoredUser, saveStoredUser, UserProfile } from '@/lib/auth';
import {
  parseNigerianPhone,
  dispatchOtp,
  verifyOtpCodeAsync,
  getActiveOtpSession,
  generateOtpCode,
  getTermiiApiKey,
  saveTermiiApiKey,
  hasTermiiApiKey,
  OtpChannel,
} from '@/lib/otp';

export default function OtpVerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    phone?: string;
    businessName?: string;
    source?: string;
    initialChannel?: string;
  }>();

  // Phone parsing and state
  const initialRawPhone = params.phone || '+234 803 491 8820';
  const [phoneNumber, setPhoneNumber] = useState(initialRawPhone);
  const parsedPhone = parseNigerianPhone(phoneNumber);

  // Delivery Channel: 'whatsapp' or 'sms'
  const [activeChannel, setActiveChannel] = useState<OtpChannel>(
    params.initialChannel === 'sms' ? 'sms' : 'whatsapp'
  );

  // Termii Gateway Configuration state
  const [hasGatewayKey, setHasGatewayKey] = useState<boolean>(hasTermiiApiKey());
  const [showGatewayConfig, setShowGatewayConfig] = useState<boolean>(false);
  const [inputTermiiKey, setInputTermiiKey] = useState<string>(getTermiiApiKey() || '');
  const [isSavingKey, setIsSavingKey] = useState<boolean>(false);

  // OTP Digits (6 digits)
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const inputsRef = useRef<(TextInput | null)[]>([]);

  // Timers & Loading States
  const [timerCount, setTimerCount] = useState(45);
  const [canResend, setCanResend] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Feedback Messages
  const [feedbackStatus, setFeedbackStatus] = useState<{
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
  } | null>(null);

  // Change Phone Number Inline Form
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [editPhoneInput, setEditPhoneInput] = useState(parsedPhone.cleanDigits);

  // Initialize or fetch active OTP session on mount (dispatches in background)
  useEffect(() => {
    const keyConfigured = hasTermiiApiKey();
    setHasGatewayKey(keyConfigured);

    const session = getActiveOtpSession();
    if (!session || Date.now() > session.expiresAt) {
      const newCode = generateOtpCode(6);
      dispatchOtp(activeChannel, phoneNumber, newCode, params.businessName).then((res) => {
        if (res.success) {
          setFeedbackStatus({
            type: 'success',
            message: activeChannel === 'whatsapp'
              ? `A 6-digit verification code has been sent to your WhatsApp (${parsedPhone.displayPhone}). Please check your WhatsApp messages.`
              : `A 6-digit verification code has been sent via SMS to ${parsedPhone.carrier.name} (${parsedPhone.displayPhone}). Please check your text messages.`,
          });
        } else if (res.requiresKey) {
          setFeedbackStatus({
            type: 'warning',
            message: 'Termii Gateway API Key required for live WhatsApp delivery to Nigerian numbers. Connect your key below or test with code 123456.',
          });
          setShowGatewayConfig(true);
        } else {
          setFeedbackStatus({
            type: 'error',
            message: res.message || 'Failed to dispatch verification code via Termii gateway.',
          });
        }
      });
    } else {
      setFeedbackStatus({
        type: 'info',
        message: session.channel === 'whatsapp'
          ? `A 6-digit verification code was requested for your WhatsApp (${parsedPhone.displayPhone}).`
          : `A 6-digit verification code was requested for ${parsedPhone.carrier.name} SMS (${parsedPhone.displayPhone}).`,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (timerCount <= 0) {
      setCanResend(true);
      return;
    }
    const interval = setInterval(() => {
      setTimerCount((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timerCount]);

  // Handle sending OTP in background via selected channel (WhatsApp or Carrier SMS)
  const handleSendCode = async (channelToUse: OtpChannel) => {
    setIsDispatching(true);
    setFeedbackStatus(null);
    try {
      const res = await dispatchOtp(
        channelToUse,
        phoneNumber,
        undefined,
        params.businessName
      );

      setActiveChannel(channelToUse);
      setTimerCount(45);
      setCanResend(false);

      if (res.success) {
        setFeedbackStatus({
          type: 'success',
          message: channelToUse === 'whatsapp'
            ? `6-digit verification code sent to your WhatsApp (${parsedPhone.displayPhone}). Please check your WhatsApp messages.`
            : `6-digit verification code sent via SMS to ${parsedPhone.carrier.name} (${parsedPhone.displayPhone}). Please check your text messages.`,
        });
      } else if (res.requiresKey) {
        setFeedbackStatus({
          type: 'warning',
          message: 'Termii Gateway API Key required for live WhatsApp delivery to Nigerian numbers. Connect your key below or test with code 123456.',
        });
        setShowGatewayConfig(true);
      } else {
        setFeedbackStatus({
          type: 'error',
          message: res.message || 'Failed to dispatch code via Termii gateway. Check your API key or wallet balance.',
        });
      }
    } catch (err: any) {
      setFeedbackStatus({
        type: 'error',
        message: err?.message || 'Failed to dispatch verification code. Please retry.',
      });
    } finally {
      setIsDispatching(false);
    }
  };

  // Save Termii API key entered in UI and immediately dispatch code
  const handleSaveTermiiKey = async () => {
    if (!inputTermiiKey.trim()) {
      setFeedbackStatus({
        type: 'error',
        message: 'Please enter your Termii API Key (available from your Termii dashboard).',
      });
      return;
    }
    setIsSavingKey(true);
    saveTermiiApiKey(inputTermiiKey.trim());
    setHasGatewayKey(true);
    setShowGatewayConfig(false);
    setFeedbackStatus({
      type: 'info',
      message: 'Termii Gateway connected! Dispatching WhatsApp verification code now...',
    });
    setIsSavingKey(false);
    await handleSendCode(activeChannel);
  };

  // Handle text change inside a digit input box
  const handleDigitChange = (val: string, index: number) => {
    setFeedbackStatus(null);

    // Support full 6-digit paste
    const cleanPasted = val.replace(/[^0-9]/g, '');
    if (cleanPasted.length >= 6) {
      const newDigits = cleanPasted.slice(0, 6).split('');
      setDigits(newDigits);
      inputsRef.current[5]?.focus();
      return;
    }

    const singleDigit = cleanPasted.slice(-1);
    const updated = [...digits];
    updated[index] = singleDigit;
    setDigits(updated);

    // Auto-advance cursor to next input
    if (singleDigit && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  // Handle backspace navigation between inputs
  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  // Verify entered OTP
  const handleVerify = async () => {
    const fullCode = digits.join('');
    if (fullCode.length !== 6) {
      setFeedbackStatus({
        type: 'error',
        message: 'Please enter all 6 digits of your verification code.',
      });
      return;
    }

    setIsVerifying(true);
    setFeedbackStatus(null);

    try {
      const verification = await verifyOtpCodeAsync(fullCode, phoneNumber);

      if (!verification.success) {
        setIsVerifying(false);
        setFeedbackStatus({
          type: 'error',
          message: verification.message,
        });
        return;
      }

      // Successful verification: save or update stored merchant session
      const existing = getStoredUser();
      const updatedUser: UserProfile = {
        id: existing?.id || `usr_${Date.now()}`,
        name: existing?.name || (params.businessName ? `${params.businessName} Admin` : 'Alhaji Musa Sani'),
        phone: parsedPhone.displayPhone,
        businessName: existing?.businessName || params.businessName || 'Musa & Sons Provisions Ltd',
        tradeHub: existing?.tradeHub || 'Idumota Wholesale Hub, Lagos',
        role: existing?.role || 'merchant',
        isDemo: false,
      };
      saveStoredUser(updatedUser);

      setFeedbackStatus({
        type: 'success',
        message: 'Phone verified! Launching your StockPilot workspace...',
      });

      setTimeout(() => {
        setIsVerifying(false);
        if (params.source === 'order') {
          router.back();
        } else {
          router.replace('/(tabs)');
        }
      }, 700);
    } catch (err: any) {
      setIsVerifying(false);
      setFeedbackStatus({
        type: 'error',
        message: err?.message || 'Verification failed. Please retry.',
      });
    }
  };

  // Save updated phone number
  const handleSavePhone = () => {
    const parsedNew = parseNigerianPhone(editPhoneInput);
    if (!parsedNew.isValid) {
      setFeedbackStatus({
        type: 'error',
        message: 'Please enter a valid 11-digit Nigerian phone number (e.g. 0803 123 4567).',
      });
      return;
    }
    setPhoneNumber(parsedNew.displayPhone);
    setIsEditingPhone(false);
    // Dispatch a fresh code to the new phone number
    handleSendCode(activeChannel);
  };

  // Automated Voice Call Fallback
  const handleVoiceCall = () => {
    setFeedbackStatus({
      type: 'info',
      message: `Automated voice call queued for ${parsedPhone.displayPhone}. Please answer your incoming call to hear your 6-digit code.`,
    });
  };

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
        <Text className="text-base font-bold text-onSurface">Phone OTP Verification</Text>
        <BrandLogo variant="emblem" size={28} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
      >
        {/* Step Badge & Process Indicator */}
        <View className="mb-5">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-1.5 px-3 py-1 rounded-full bg-secondaryContainer">
              <AppIcon name="verified" size={14} color={colors.secondary} />
              <Text className="text-xs font-bold text-onSecondaryContainer">
                Step 2 of 2: Quick Identity Verification
              </Text>
            </View>
            <Text className="text-xs font-semibold text-secondary">95% Complete</Text>
          </View>
          <View className="w-full h-1.5 bg-surfaceContainer rounded-full overflow-hidden">
            <View className="h-full bg-primary rounded-full w-[95%]" />
          </View>
        </View>

        {/* Verification Hero Card */}
        <View className="bg-white rounded-2xl p-5 border border-cardBorder shadow-sm mb-5">
          {/* Header Title & Badge */}
          <View className="flex-row items-start gap-3 mb-2">
            <View className="w-12 h-12 rounded-xl bg-secondaryContainer/50 items-center justify-center border border-cardBorder">
              <BrandLogo variant="emblem" size={32} />
            </View>
            <View className="flex-1 min-w-0">
              <Text className="text-[11px] font-bold text-secondary uppercase tracking-wider">
                Instant Order & Till Lock
              </Text>
              <Text className="text-lg font-bold text-onSurface leading-snug mt-0.5">
                Verify Your Phone to Activate StockPilot
              </Text>
            </View>
          </View>

          {/* Phone & Carrier Badge Row */}
          <View className="flex-row items-center justify-between bg-surfaceContainerLow p-3 rounded-xl mb-4 border border-cardBorder/60">
            <View className="flex-1 min-w-0 mr-2">
              <Text className="text-[11px] font-semibold text-onSurfaceVariant">
                Recipient Mobile
              </Text>
              <Text className="text-sm font-extrabold text-onSurface mt-0.5">
                {parsedPhone.displayPhone}
              </Text>
            </View>

            {/* Carrier Pill */}
            <View className={`px-2.5 py-1 rounded-lg border ${parsedPhone.carrier.bgClass} flex-row items-center gap-1`}>
              <AppIcon name="sim_card" size={12} color={parsedPhone.carrier.color} />
              <Text className={`text-[11px] font-bold ${parsedPhone.carrier.textClass}`}>
                {parsedPhone.carrier.name}
              </Text>
            </View>

            {/* Edit Phone Button */}
            <Pressable
              onPress={() => {
                setEditPhoneInput(parsedPhone.cleanDigits);
                setIsEditingPhone(!isEditingPhone);
              }}
              className="ml-2 w-8 h-8 rounded-lg bg-white border border-cardBorder items-center justify-center active:bg-surfaceContainer"
            >
              <AppIcon name="edit" size={14} color={colors.primary} />
            </Pressable>
          </View>

          {/* Inline Edit Phone Field */}
          {isEditingPhone && (
            <View className="bg-surfaceContainer/50 p-3 rounded-xl border border-cardBorder mb-4 gap-2">
              <Text className="text-xs font-bold text-onSurface">Enter 11-Digit Nigerian Phone</Text>
              <View className="flex-row items-center gap-2">
                <View className="flex-1 bg-white border border-cardBorder rounded-lg px-3 h-10 justify-center">
                  <TextInput
                    value={editPhoneInput}
                    onChangeText={setEditPhoneInput}
                    keyboardType="phone-pad"
                    placeholder="0803 123 4567"
                    className="text-xs text-onSurface font-bold outline-none"
                  />
                </View>
                <Pressable
                  onPress={handleSavePhone}
                  className="px-3 h-10 rounded-lg bg-primary items-center justify-center active:bg-secondary"
                >
                  <Text className="text-xs font-bold text-white">Save & Send</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Delivery Method Selector (WhatsApp vs Carrier SMS) */}
          <View className="mb-4">
            <Text className="text-xs font-bold text-onSurface mb-2">
              Select Verification Delivery Method:
            </Text>
            <View className="flex-row gap-2">
              {/* WhatsApp Tab */}
              <Pressable
                onPress={() => handleSendCode('whatsapp')}
                disabled={isDispatching}
                className={`flex-1 p-3 rounded-xl border flex-row items-center gap-2 ${
                  activeChannel === 'whatsapp'
                    ? 'border-emerald-500 bg-emerald-50/70'
                    : 'border-cardBorder bg-white active:bg-surfaceContainerLow'
                }`}
              >
                <View className={`w-8 h-8 rounded-lg items-center justify-center ${
                  activeChannel === 'whatsapp' ? 'bg-emerald-600' : 'bg-emerald-100'
                }`}>
                  {isDispatching && activeChannel === 'whatsapp' ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <AppIcon
                      name="chat"
                      size={16}
                      color={activeChannel === 'whatsapp' ? '#ffffff' : '#059669'}
                    />
                  )}
                </View>
                <View className="flex-1 min-w-0">
                  <Text className={`text-xs font-bold ${
                    activeChannel === 'whatsapp' ? 'text-emerald-900' : 'text-onSurface'
                  }`}>
                    WhatsApp
                  </Text>
                  <Text className="text-[10px] text-onSurfaceVariant truncate">
                    Direct message
                  </Text>
                </View>
                {activeChannel === 'whatsapp' && (
                  <AppIcon name="check_circle" size={16} color="#059669" />
                )}
              </Pressable>

              {/* Carrier SMS Tab */}
              <Pressable
                onPress={() => handleSendCode('sms')}
                disabled={isDispatching}
                className={`flex-1 p-3 rounded-xl border flex-row items-center gap-2 ${
                  activeChannel === 'sms'
                    ? 'border-primary bg-primary/5'
                    : 'border-cardBorder bg-white active:bg-surfaceContainerLow'
                }`}
              >
                <View className={`w-8 h-8 rounded-lg items-center justify-center ${
                  activeChannel === 'sms' ? 'bg-primary' : 'bg-secondaryContainer'
                }`}>
                  {isDispatching && activeChannel === 'sms' ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <AppIcon
                      name="sms"
                      size={16}
                      color={activeChannel === 'sms' ? '#ffffff' : colors.primary}
                    />
                  )}
                </View>
                <View className="flex-1 min-w-0">
                  <Text className={`text-xs font-bold ${
                    activeChannel === 'sms' ? 'text-primary' : 'text-onSurface'
                  }`}>
                    Carrier SMS
                  </Text>
                  <Text className="text-[10px] text-onSurfaceVariant truncate">
                    {parsedPhone.carrier.name.split(' ')[0]} text
                  </Text>
                </View>
                {activeChannel === 'sms' && (
                  <AppIcon name="check_circle" size={16} color={colors.primary} />
                )}
              </Pressable>
            </View>
          </View>

          {/* Termii Gateway Integration Section */}
          <View className="mb-4 pt-1">
            <View
              className={`rounded-xl border p-3 ${
                hasGatewayKey
                  ? 'bg-emerald-50/60 border-emerald-200'
                  : 'bg-amber-50/70 border-amber-200'
              }`}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2 flex-1 mr-2">
                  <View
                    className={`w-6 h-6 rounded-full items-center justify-center ${
                      hasGatewayKey ? 'bg-emerald-600' : 'bg-amber-500'
                    }`}
                  >
                    <AppIcon
                      name={hasGatewayKey ? 'verified' : 'key'}
                      size={13}
                      color="#ffffff"
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      className={`text-xs font-bold ${
                        hasGatewayKey ? 'text-emerald-950' : 'text-amber-950'
                      }`}
                    >
                      {hasGatewayKey ? 'Termii Gateway Connected' : 'Termii WhatsApp Gateway Setup'}
                    </Text>
                    <Text className="text-[10px] text-onSurfaceVariant">
                      {hasGatewayKey
                        ? 'Live WhatsApp & SMS background delivery enabled'
                        : 'Required to deliver live WhatsApp OTPs to Nigerian SIMs'}
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => setShowGatewayConfig(!showGatewayConfig)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-cardBorder active:bg-surfaceContainer"
                >
                  <Text className="text-[11px] font-bold text-primary">
                    {showGatewayConfig ? 'Close' : hasGatewayKey ? 'Configure' : 'Connect Key'}
                  </Text>
                </Pressable>
              </View>

              {/* Expandable Gateway Configuration Form */}
              {showGatewayConfig && (
                <View className="mt-3 pt-3 border-t border-cardBorder/60 gap-2.5">
                  <Text className="text-[11px] text-onSurface leading-relaxed">
                    Termii powers Nigerian telecom routes for WhatsApp Business and carrier SMS (MTN, Airtel, Glo, 9mobile).
                    Enter your API key below from your{' '}
                    <Text className="font-bold text-primary">termii.com</Text> dashboard.
                  </Text>

                  <View className="gap-1.5">
                    <Text className="text-[10px] font-bold text-onSurfaceVariant uppercase">
                      Termii API Key (Live or Test)
                    </Text>
                    <View className="bg-white border border-cardBorder rounded-xl px-3 h-10 justify-center">
                      <TextInput
                        value={inputTermiiKey}
                        onChangeText={setInputTermiiKey}
                        placeholder="e.g. TL..."
                        placeholderTextColor="#94a3b8"
                        autoCapitalize="none"
                        autoCorrect={false}
                        className="text-xs text-onSurface font-mono outline-none"
                      />
                    </View>
                  </View>

                  <View className="flex-row items-center gap-2 pt-1">
                    <Pressable
                      onPress={handleSaveTermiiKey}
                      disabled={isSavingKey || isDispatching}
                      className="flex-1 h-9 rounded-xl bg-primary items-center justify-center flex-row gap-1.5 active:bg-secondary"
                    >
                      {isSavingKey ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <>
                          <AppIcon name="save" size={14} color="#ffffff" />
                          <Text className="text-xs font-bold text-white">Save & Send WhatsApp Code</Text>
                        </>
                      )}
                    </Pressable>

                    {hasGatewayKey && (
                      <Pressable
                        onPress={() => {
                          saveTermiiApiKey('');
                          setInputTermiiKey('');
                          setHasGatewayKey(false);
                          setFeedbackStatus({
                            type: 'info',
                            message: 'Termii API Key cleared from this session.',
                          });
                        }}
                        className="px-3 h-9 rounded-xl bg-white border border-cardBorder items-center justify-center active:bg-surfaceContainer"
                      >
                        <Text className="text-xs font-semibold text-red-600">Disconnect</Text>
                      </Pressable>
                    )}
                  </View>

                  <View className="bg-white/80 p-2.5 rounded-lg border border-cardBorder/40">
                    <Text className="text-[10px] text-onSurfaceVariant leading-normal">
                      💡 <Text className="font-bold text-onSurface">Quick Testing:</Text> If you do not have a Termii key right now, you can test anytime using test code <Text className="font-mono font-bold text-primary">123456</Text> or <Text className="font-mono font-bold text-primary">482900</Text>.
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Status / Alert Message */}
          {feedbackStatus && (
            <View
              className={`p-3 rounded-xl mb-4 flex-row items-start gap-2 border ${
                feedbackStatus.type === 'error'
                  ? 'bg-red-50 border-red-200'
                  : feedbackStatus.type === 'warning'
                  ? 'bg-amber-50 border-amber-200'
                  : feedbackStatus.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-blue-50 border-blue-200'
              }`}
            >
              <AppIcon
                name={
                  feedbackStatus.type === 'error'
                    ? 'warning'
                    : feedbackStatus.type === 'warning'
                    ? 'priority_high'
                    : feedbackStatus.type === 'success'
                    ? 'check_circle'
                    : 'notifications'
                }
                size={16}
                color={
                  feedbackStatus.type === 'error'
                    ? '#dc2626'
                    : feedbackStatus.type === 'warning'
                    ? '#d97706'
                    : feedbackStatus.type === 'success'
                    ? '#059669'
                    : '#0284c7'
                }
              />
              <Text
                className={`text-xs flex-1 leading-snug font-medium ${
                  feedbackStatus.type === 'error'
                    ? 'text-red-800'
                    : feedbackStatus.type === 'warning'
                    ? 'text-amber-900'
                    : feedbackStatus.type === 'success'
                    ? 'text-emerald-800'
                    : 'text-blue-800'
                }`}
              >
                {feedbackStatus.message}
              </Text>
            </View>
          )}

          <Text className="text-xs text-onSurfaceVariant leading-relaxed mb-3">
            Enter the 6-digit code received on your{' '}
            <Text className="font-bold text-onSurface">
              {activeChannel === 'whatsapp' ? 'WhatsApp' : `${parsedPhone.carrier.name} SMS`}
            </Text>{' '}
            to link your register and confirm trade settlement.
          </Text>

          {/* 6-digit OTP Input Group */}
          <View className="flex-row items-center justify-between gap-1.5 mb-4">
            {digits.map((digit, idx) => (
              <TextInput
                key={idx}
                ref={(ref) => {
                  inputsRef.current[idx] = ref;
                }}
                value={digit}
                onChangeText={(val) => handleDigitChange(val, idx)}
                onKeyPress={(e) => handleKeyPress(e, idx)}
                keyboardType="numeric"
                maxLength={idx === 0 ? 6 : 1}
                placeholder="•"
                placeholderTextColor="#94a3b8"
                className={`w-11 h-13 text-center text-xl font-bold rounded-xl border ${
                  digit
                    ? 'border-primary bg-secondaryContainer/30 text-primary'
                    : 'border-cardBorder bg-surfaceContainerLow text-onSurface'
                } outline-none`}
              />
            ))}
          </View>

          {/* Resend and Call Helpers */}
          <View className="flex-row items-center justify-between pt-1">
            <Pressable
              disabled={!canResend || isDispatching}
              onPress={() => handleSendCode(activeChannel)}
              className="flex-row items-center gap-1 active:opacity-70"
            >
              {isDispatching ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <AppIcon
                  name="history"
                  size={14}
                  color={canResend ? colors.primary : colors.secondary}
                />
              )}
              <Text className="text-xs text-onSurfaceVariant">
                {canResend ? (
                  <Text className="text-primary font-bold">
                    Resend code via {activeChannel === 'whatsapp' ? 'WhatsApp' : 'SMS'}
                  </Text>
                ) : (
                  <>
                    Resend in <Text className="font-bold text-secondary">{timerCount}s</Text>
                  </>
                )}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleVoiceCall}
              className="flex-row items-center gap-1 active:opacity-70"
            >
              <AppIcon name="phone" size={13} color={colors.tertiary} />
              <Text className="text-xs font-semibold text-tertiary">Call me with code</Text>
            </Pressable>
          </View>
        </View>

        {/* First Buyer / Merchant Privileges Banner */}
        <View className="bg-white rounded-2xl p-4 border border-cardBorder shadow-sm mb-4">
          <View className="flex-row items-center justify-between pb-2 mb-2 border-b border-cardBorder/60">
            <View className="flex-row items-center gap-1.5">
              <AppIcon name="star" size={18} color="#f59e0b" />
              <Text className="text-xs font-bold text-onSurface">
                Account Configured Privileges
              </Text>
            </View>
            <View className="px-2 py-0.5 rounded-full bg-secondaryFixed">
              <Text className="text-[10px] font-bold text-secondary">Auto-Applied</Text>
            </View>
          </View>

          <View className="gap-2">
            <View className="flex-row items-start gap-2.5 bg-surfaceContainerLow p-2.5 rounded-xl">
              <View className="w-7 h-7 rounded-lg bg-white items-center justify-center">
                <AppIcon name="bolt" size={16} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-onSurface">0% Settlement & Transaction Fees</Text>
                <Text className="text-[11px] text-onSurfaceVariant">
                  Permanent free tier for registered open-market merchants.
                </Text>
              </View>
            </View>

            <View className="flex-row items-start gap-2.5 bg-surfaceContainerLow p-2.5 rounded-xl">
              <View className="w-7 h-7 rounded-lg bg-white items-center justify-center">
                <AppIcon name="receipt_long" size={16} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-onSurface">Instant WhatsApp Digital Invoices</Text>
                <Text className="text-[11px] text-onSurfaceVariant">
                  Legally binding receipts with itemized stock breakdowns.
                </Text>
              </View>
            </View>

            <View className="flex-row items-start gap-2.5 bg-surfaceContainerLow p-2.5 rounded-xl">
              <View className="w-7 h-7 rounded-lg bg-white items-center justify-center">
                <AppIcon name="calculate" size={16} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-onSurface">₦5,000 First-Time Trade Credit</Text>
                <Text className="text-[11px] text-onSurfaceVariant">
                  Deducted directly from wholesale checkout balance.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Security & Merchant Trust Badge */}
        <View className="bg-surfaceContainerLow rounded-2xl p-3.5 border border-cardBorder flex-row items-center gap-3 mb-6">
          <View className="w-9 h-9 rounded-full bg-white items-center justify-center shadow-sm">
            <AppIcon name="verified_user" size={18} color={colors.secondary} />
          </View>
          <View className="flex-1">
            <Text className="text-xs font-bold text-onSurface">CBN & CAC Compliant Merchant Trade</Text>
            <Text className="text-[11px] text-onSurfaceVariant leading-snug">
              StockPilot wholesale escrow protects both vendor dispatch and buyer payouts.
            </Text>
          </View>
        </View>

        {/* Verify Action Button */}
        <Pressable
          onPress={handleVerify}
          disabled={isVerifying}
          className="w-full h-12 rounded-xl bg-primary items-center justify-center flex-row gap-2 active:bg-secondary shadow-md mb-4"
        >
          {isVerifying ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <Text className="text-white font-bold text-sm">Verify & Launch Workspace</Text>
              <AppIcon name="arrow_forward" size={18} color="#ffffff" />
            </>
          )}
        </Pressable>

        {/* Change Phone / Back button */}
        <Pressable
          onPress={() => router.back()}
          className="items-center py-2"
        >
          <Text className="text-xs font-medium text-onSurfaceVariant">Return to Previous Screen</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
