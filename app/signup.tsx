import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AppIcon } from '@/components/icon';
import { BrandLogo } from '@/components/brand-logo';
import { colors } from '@/lib/theme';
import { signupMerchant } from '@/lib/auth';
import { resetStoreProfileToStandard, TRADING_HUBS } from '@/lib/store-profile';
import { useResponsive } from '@/hooks/use-responsive';

const tradingHubs = TRADING_HUBS;

export default function SignupScreen() {
  const router = useRouter();
  const { horizontalPadding } = useResponsive();
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedHub, setSelectedHub] = useState(tradingHubs[0]);
  const [isManualHub, setIsManualHub] = useState(false);
  const [customHub, setCustomHub] = useState('');
  const [showHubPicker, setShowHubPicker] = useState(false);
  const [hubSearchQuery, setHubSearchQuery] = useState('');

  const filteredHubs = tradingHubs.filter((hub) =>
    hub.toLowerCase().includes(hubSearchQuery.trim().toLowerCase())
  );

  const handleProceedToOtp = async () => {
    const finalBusiness = businessName.trim() || 'My Wholesale Depot';
    const finalOwner = ownerName.trim() || 'Store Manager';
    const finalPhone = phone.trim() ? `+234 ${phone.trim()}` : '+234 800 000 0000';
    const activeHub = isManualHub ? customHub.trim() : selectedHub;
    const finalHub = activeHub || selectedHub || 'Idumota Wholesale Hub, Lagos';

    await signupMerchant({
      businessName: finalBusiness,
      ownerName: finalOwner,
      phone: finalPhone,
      tradeHub: finalHub,
    });

    resetStoreProfileToStandard({
      businessName: finalBusiness,
      ownerName: finalOwner,
      phone: finalPhone,
      marketLocation: finalHub,
    });

    router.push({
      pathname: '/otp-verify',
      params: {
        phone: finalPhone,
        businessName: finalBusiness,
        tradeHub: finalHub,
        source: 'signup',
      },
    });
  };

  return (
    <View className="flex-1 bg-surface">
      {/* Top Header */}
      <View className="bg-white border-b border-cardBorder">
        <View className="max-w-md mx-auto w-full flex-row items-center justify-between px-4 py-3">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-full active:bg-surfaceContainer"
          >
            <AppIcon name="arrow_back" size={22} color={colors.onSurface} />
          </Pressable>
          <View className="flex-row items-center gap-2">
            <BrandLogo variant="emblem" size={26} />
            <Text className="text-base font-bold text-onSurface">StockPilot NG</Text>
          </View>
          <View className="w-10" />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingTop: 20, paddingBottom: 60 }}
      >
        <View className="max-w-md mx-auto w-full">
        <BrandLogo variant="full" width={135} className="mb-4" />

        {/* Step Indicator */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-1.5 px-3 py-1 rounded-full bg-secondaryContainer">
              <AppIcon name="verified" size={14} color={colors.secondary} />
              <Text className="text-xs font-bold text-onSecondaryContainer">
                Step 1 of 2: Business Profile
              </Text>
            </View>
            <Text className="text-xs font-semibold text-secondary">50% Complete</Text>
          </View>
          <View className="w-full h-1.5 bg-surfaceContainer rounded-full overflow-hidden">
            <View className="h-full bg-primary rounded-full w-1/2" />
          </View>
        </View>

        {/* Headline */}
        <View className="mb-6">
          <Text className="text-2xl font-extrabold text-onSurface">Create Business Account</Text>
          <Text className="text-sm text-onSurfaceVariant mt-1">
            Free 30-day merchant trial. Start tracking inventory and sending WhatsApp receipts in 60 seconds.
          </Text>
        </View>

        {/* Input Fields */}
        <View className="gap-4 mb-6">
          {/* Business / Trading Name */}
          <View>
            <Text className="text-xs font-bold text-onSurface mb-1.5">Registered / Trading Shop Name</Text>
            <View className="bg-white border border-cardBorder rounded-xl px-3 h-12 justify-center focus:border-primary">
              <TextInput
                value={businessName}
                onChangeText={setBusinessName}
                placeholder="e.g. Adeyemi Wholesale Stores"
                placeholderTextColor={colors.outline}
                className="text-sm text-onSurface font-medium outline-none"
              />
            </View>
          </View>

          {/* Owner / Manager Name */}
          <View>
            <Text className="text-xs font-bold text-onSurface mb-1.5">Owner or Principal Trader Name</Text>
            <View className="bg-white border border-cardBorder rounded-xl px-3 h-12 justify-center focus:border-primary">
              <TextInput
                value={ownerName}
                onChangeText={setOwnerName}
                placeholder="e.g. Babatunde Adeyemi"
                placeholderTextColor={colors.outline}
                className="text-sm text-onSurface font-medium outline-none"
              />
            </View>
          </View>

          {/* WhatsApp / Phone */}
          <View>
            <Text className="text-xs font-bold text-onSurface mb-1.5">WhatsApp Number for Receipts & Alerts</Text>
            <View className="flex-row items-center bg-white border border-cardBorder rounded-xl px-3 h-12 focus:border-primary">
              <Text className="text-sm font-bold text-onSurfaceVariant mr-2">+234</Text>
              <View className="w-px h-6 bg-cardBorder mr-2" />
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="803 123 4567"
                keyboardType="phone-pad"
                className="flex-1 text-sm text-onSurface font-medium outline-none"
              />
            </View>
          </View>

          {/* Market Trading Hub Section */}
          <View>
            <View className="flex-row items-center justify-between mb-1.5">
              <Text className="text-xs font-bold text-onSurface">Primary Trading Market / Hub</Text>
              <Pressable
                onPress={() => {
                  setIsManualHub(!isManualHub);
                  setShowHubPicker(false);
                }}
                className="flex-row items-center gap-1 px-2.5 py-1 rounded-full bg-secondaryContainer/60 active:bg-secondaryContainer"
              >
                <AppIcon name={isManualHub ? 'list' : 'edit'} size={12} color={colors.secondary} />
                <Text className="text-[11px] font-bold text-onSecondaryContainer">
                  {isManualHub ? 'Choose from list' : 'Input manually'}
                </Text>
              </Pressable>
            </View>

            {isManualHub ? (
              <View>
                <View className="bg-white border-2 border-primary/70 rounded-xl px-3 h-12 flex-row items-center focus:border-primary shadow-sm">
                  <AppIcon name="edit_location" size={18} color={colors.primary} />
                  <TextInput
                    value={customHub}
                    onChangeText={setCustomHub}
                    placeholder="e.g. Ariaria Market Aba, Singer Market Kano..."
                    placeholderTextColor={colors.outline}
                    className="flex-1 text-sm text-onSurface font-medium outline-none ml-2"
                    autoFocus
                  />
                  {customHub.length > 0 && (
                    <Pressable onPress={() => setCustomHub('')} className="p-1">
                      <AppIcon name="close" size={16} color={colors.outline} />
                    </Pressable>
                  )}
                </View>

                <View className="flex-row items-center justify-between mt-1.5 px-0.5">
                  <Text className="text-[11px] text-onSurfaceVariant">
                    Manual entry active • Custom market will be saved
                  </Text>
                  <Pressable
                    onPress={() => setIsManualHub(false)}
                    className="active:opacity-70"
                  >
                    <Text className="text-[11px] font-bold text-primary underline">
                      Switch to presets
                    </Text>
                  </Pressable>
                </View>

                {/* Popular Quick Suggestions */}
                <View className="mt-2.5 flex-row flex-wrap items-center gap-1.5">
                  <Text className="text-[10px] font-semibold text-onSurfaceVariant mr-0.5">
                    Quick Picks:
                  </Text>
                  {['Idumota', 'Alaba', 'Balogun', 'Onitsha', 'Dawanau', 'Ariaria', 'Wuse'].map(
                    (hubName) => (
                      <Pressable
                        key={hubName}
                        onPress={() => {
                          const match = tradingHubs.find((h) =>
                            h.toLowerCase().includes(hubName.toLowerCase())
                          );
                          if (match) {
                            setSelectedHub(match);
                            setIsManualHub(false);
                          } else {
                            setCustomHub(`${hubName} Market`);
                          }
                        }}
                        className="px-2 py-0.5 rounded-full bg-surfaceContainer border border-cardBorder active:bg-secondaryContainer"
                      >
                        <Text className="text-[10px] font-medium text-onSurface">{hubName}</Text>
                      </Pressable>
                    )
                  )}
                </View>
              </View>
            ) : (
              <View>
                <Pressable
                  onPress={() => setShowHubPicker(!showHubPicker)}
                  className="bg-white border border-cardBorder rounded-xl px-3 h-12 flex-row items-center justify-between active:bg-surfaceContainer"
                >
                  <View className="flex-row items-center gap-2 flex-1 min-w-0 mr-2">
                    <AppIcon name="location_on" size={18} color={colors.primary} />
                    <Text className="text-sm text-onSurface font-medium truncate">{selectedHub}</Text>
                  </View>
                  <AppIcon
                    name={showHubPicker ? 'arrow_drop_up' : 'arrow_drop_down'}
                    size={20}
                    color={colors.outline}
                  />
                </Pressable>

                {showHubPicker && (
                  <View className="bg-white border border-cardBorder rounded-xl mt-1.5 shadow-lg overflow-hidden">
                    {/* Search / Filter in dropdown */}
                    <View className="p-2.5 border-b border-cardBorder bg-surfaceContainerLow flex-row items-center gap-2">
                      <AppIcon name="search" size={16} color={colors.outline} />
                      <TextInput
                        value={hubSearchQuery}
                        onChangeText={setHubSearchQuery}
                        placeholder="Search markets or type custom name..."
                        placeholderTextColor={colors.outline}
                        className="flex-1 text-xs text-onSurface outline-none h-7"
                      />
                      {hubSearchQuery.length > 0 && (
                        <Pressable onPress={() => setHubSearchQuery('')} className="p-0.5">
                          <AppIcon name="close" size={14} color={colors.outline} />
                        </Pressable>
                      )}
                    </View>

                    {/* Direct action to use typed search query as custom market */}
                    {hubSearchQuery.trim().length > 0 && (
                      <Pressable
                        onPress={() => {
                          setCustomHub(hubSearchQuery.trim());
                          setIsManualHub(true);
                          setShowHubPicker(false);
                          setHubSearchQuery('');
                        }}
                        className="p-3 bg-secondaryContainer/50 flex-row items-center gap-2 border-b border-cardBorder active:bg-secondaryContainer"
                      >
                        <AppIcon name="add_location" size={16} color={colors.secondary} />
                        <View className="flex-1">
                          <Text className="text-xs font-bold text-onSecondaryContainer">
                            {`Use "${hubSearchQuery.trim()}" as custom market`}
                          </Text>
                          <Text className="text-[10px] text-onSecondaryContainer/80">
                            Tap to save as custom trading hub
                          </Text>
                        </View>
                        <Text className="text-[10px] font-bold text-secondary uppercase bg-white px-1.5 py-0.5 rounded shadow-sm">
                          Custom
                        </Text>
                      </Pressable>
                    )}

                    <ScrollView
                      style={{ maxHeight: 200 }}
                      nestedScrollEnabled
                      showsVerticalScrollIndicator
                    >
                      {filteredHubs.map((hub) => (
                        <Pressable
                          key={hub}
                          onPress={() => {
                            setSelectedHub(hub);
                            setShowHubPicker(false);
                            setHubSearchQuery('');
                          }}
                          className={`p-3 flex-row items-center justify-between border-b border-cardBorder/40 ${
                            selectedHub === hub
                              ? 'bg-secondaryContainer/40'
                              : 'active:bg-surfaceContainer'
                          }`}
                        >
                          <Text className="text-xs font-semibold text-onSurface">{hub}</Text>
                          {selectedHub === hub && (
                            <AppIcon name="check_circle" size={16} color={colors.primary} />
                          )}
                        </Pressable>
                      ))}

                      {filteredHubs.length === 0 && (
                        <View className="p-4 items-center justify-center">
                          <Text className="text-xs text-onSurfaceVariant">
                            No matching preset market found
                          </Text>
                        </View>
                      )}
                    </ScrollView>

                    {/* Bottom option: Input Market Hub Manually */}
                    <Pressable
                      onPress={() => {
                        if (hubSearchQuery.trim().length > 0) {
                          setCustomHub(hubSearchQuery.trim());
                        }
                        setIsManualHub(true);
                        setShowHubPicker(false);
                        setHubSearchQuery('');
                      }}
                      className="p-3 flex-row items-center justify-between bg-surfaceContainerLow border-t border-cardBorder active:bg-surfaceContainer"
                    >
                      <View className="flex-row items-center gap-2">
                        <AppIcon name="edit" size={16} color={colors.primary} />
                        <Text className="text-xs font-bold text-primary">
                          {"Can't find your market? Input manually"}
                        </Text>
                      </View>
                      <AppIcon name="chevron_right" size={16} color={colors.primary} />
                    </Pressable>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Benefits Pill Banner */}
        <View className="p-3.5 rounded-xl bg-secondaryContainer/50 border border-secondaryContainer mb-6 flex-row items-center gap-3">
          <View className="w-8 h-8 rounded-lg bg-secondaryContainer items-center justify-center">
            <AppIcon name="bolt" size={18} color={colors.secondary} />
          </View>
          <View className="flex-1">
            <Text className="text-xs font-bold text-onSecondaryContainer">
              100% Offline Database Preloaded
            </Text>
            <Text className="text-[11px] text-onSecondaryContainer/80">
              No internet required for POS checkout and daily inventory recording.
            </Text>
          </View>
        </View>

        {/* Submit Button */}
        <Pressable
          onPress={handleProceedToOtp}
          className="w-full h-12 rounded-xl bg-primary items-center justify-center flex-row gap-2 active:bg-secondary shadow-md mb-4"
        >
          <Text className="text-white font-bold text-sm">Next: Verify WhatsApp Number</Text>
          <AppIcon name="arrow_forward" size={18} color="#ffffff" />
        </Pressable>

        {/* Existing User Link */}
        <View className="items-center">
          <Text className="text-xs text-onSurfaceVariant">
            Already registered?{' '}
            <Text
              onPress={() => router.push('/login')}
              className="text-primary font-bold underline"
            >
              Sign In to Your Workspace
            </Text>
          </Text>
        </View>
      </View>
    </ScrollView>
  </View>
);
}
