import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AppIcon } from '@/components/icon';
import { getStoredUser } from '@/lib/auth';

interface Step {
  pct: number;
  label: string;
  node: string;
  records: string;
}

const steps: Step[] = [
  { pct: 18, label: 'Mounting Encrypted SQLite Ledger...', node: 'LAG-IDUMOTA-04', records: '24 SKUs' },
  { pct: 39, label: 'Verifying Offline Cashflow Vault...', node: 'LAG-IDUMOTA-04', records: '96 SKUs' },
  { pct: 64, label: 'Indexing 184 SKUs & Price Matrices...', node: 'LAG-CENTRAL-01', records: '184 SKUs' },
  { pct: 88, label: 'Syncing Delinquent Debtor Register...', node: 'KAN-DAWANAU-02', records: '184 SKUs' },
  { pct: 100, label: 'Merchant Workspace Ready.', node: 'OFFLINE-SYNCHRONIZED', records: '184 SKUs Loaded' },
];

export default function LaunchSplashScreen() {
  const router = useRouter();
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStepIdx((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(timer);
          setIsComplete(true);
          return prev;
        }
      });
    }, 450);

    return () => clearInterval(timer);
  }, []);

  const handleProceed = () => {
    const user = getStoredUser();
    if (user) {
      router.replace('/(tabs)');
    } else {
      router.replace('/onboarding');
    }
  };

  const currentStep = steps[currentStepIdx];

  return (
    <View className="flex-1 bg-[#021811] justify-between px-4 py-8 select-none">
      {/* Top System & Connectivity Status Header */}
      <View className="w-full flex-row items-center justify-between pt-2">
        {/* Resilience Badge */}
        <View className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#053322]/80 border border-[#166534]">
          <View className="w-2 h-2 rounded-full bg-[#22c55e]" />
          <Text className="text-[11px] font-semibold text-[#8bd79b] tracking-wider uppercase">
            Offline Engine Active
          </Text>
        </View>

        {/* Security / Encryption Indicator */}
        <View className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#032317] border border-[#166534]">
          <AppIcon name="lock" size={14} color="#a6f4b5" />
          <Text className="text-[11px] font-bold text-[#a6f4b5]">AES-256</Text>
        </View>
      </View>

      {/* Center Stage: Brand Iconography, Wordmark & Tagline */}
      <View className="items-center justify-center py-6 text-center">
        {/* Logo Symbol Assembly */}
        <View className="relative items-center justify-center mb-6">
          {/* Outer Glow Ring */}
          <View className="absolute w-28 h-28 rounded-full bg-[#16a34a]/25 blur-xl" />

          {/* Pilot Cube Geometric Container */}
          <View className="w-24 h-24 rounded-2xl bg-gradient-to-b from-[#00873a] to-[#004d1f] p-0.5 shadow-2xl items-center justify-center border border-[#7ffc97]/30">
            <View className="w-full h-full rounded-[14px] bg-[#03261a] items-center justify-center relative overflow-hidden">
              {Platform.OS === 'web' ? (
                // SVG rendering directly on web
                <svg
                  width="56"
                  height="56"
                  viewBox="0 0 64 64"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <polygon points="32,8 52,19 32,30 12,19" fill="#7ffc97" opacity="0.95" />
                  <polygon points="12,19 32,30 32,54 12,43" fill="#00873a" />
                  <polygon points="32,30 52,19 52,43 32,54" fill="#16a34a" />
                  <line x1="32" y1="30" x2="32" y2="54" stroke="#8bd79b" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
                  <path d="M48 24 L59 18 L55 27 L48 29 Z" fill="#ffffff" opacity="0.95" />
                  <path d="M16 24 L5 18 L9 27 L16 29 Z" fill="#ffffff" opacity="0.95" />
                  <circle cx="32" cy="30" r="2.5" fill="#ffffff" />
                </svg>
              ) : (
                <View className="items-center justify-center">
                  <AppIcon name="warehouse" size={38} color="#7ffc97" />
                </View>
              )}
            </View>
          </View>

          {/* Verified Merchant Tick Orb */}
          <View className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#16a34a] items-center justify-center border-2 border-[#021811] shadow-md">
            <AppIcon name="bolt" size={16} color="#ffffff" />
          </View>
        </View>

        {/* Wordmark Identity & Region Badge */}
        <View className="flex-row items-center gap-2 mb-2 justify-center">
          <Text className="text-3xl font-extrabold text-white tracking-tight">StockPilot</Text>
          <View className="px-2 py-0.5 rounded bg-[#16a34a]">
            <Text className="text-[10px] font-extrabold text-white tracking-widest">NG</Text>
          </View>
        </View>

        {/* Commercial Descriptor Tagline */}
        <Text className="text-sm text-[#a4f1b2] max-w-[280px] text-center leading-relaxed">
          The Operating System for Nigerian Commerce & High-Velocity Trade
        </Text>

        {/* Market Hub Distribution Badges */}
        <View className="flex-row flex-wrap items-center justify-center gap-1.5 mt-4 max-w-xs">
          {['Idumota', 'Alaba Intl', 'Dawanau Kano', 'Onitsha Main'].map((hub) => (
            <View key={hub} className="px-2.5 py-1 rounded-full bg-[#053120] border border-[#166534]">
              <Text className="text-[10px] font-medium text-[#7ffc97]">{hub}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Bottom Initialization & Audit Tray */}
      <View className="w-full gap-3 pb-2">
        <View className="w-full p-4 rounded-2xl bg-[#032015] border border-[#0d4f30] shadow-xl">
          {/* Live Loading Log Text */}
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-2 flex-1 mr-2">
              <AppIcon
                name={isComplete ? 'check_circle' : 'sync'}
                size={16}
                color={isComplete ? '#7ffc97' : '#62df7d'}
              />
              <Text className="text-xs text-white font-medium truncate flex-1">
                {currentStep.label}
              </Text>
            </View>
            <Text className="text-xs text-[#62df7d] font-bold tabular-nums">
              {currentStep.pct}%
            </Text>
          </View>

          {/* High-Contrast Segmented Linear Progress Bar */}
          <View className="w-full h-2 rounded-full bg-[#053824] overflow-hidden">
            <View
              className="h-full rounded-full bg-gradient-to-r from-[#166534] via-[#16a34a] to-[#7ffc97]"
              style={{ width: `${currentStep.pct}%` }}
            />
          </View>

          {/* Telemetry Details Sub-row */}
          <View className="flex-row items-center justify-between mt-2.5">
            <View className="flex-row items-center gap-1">
              <AppIcon name="dns" size={13} color="#62df7d" />
              <Text className="text-[11px] text-[#8bd79b]">
                Node: {currentStep.node}
              </Text>
            </View>
            <Text className="text-[11px] text-[#8bd79b]">
              {currentStep.records}
            </Text>
          </View>
        </View>

        {/* Enter Button or Continue */}
        <Pressable
          onPress={handleProceed}
          className="w-full h-12 rounded-xl bg-[#16a34a] items-center justify-center flex-row gap-2 active:bg-[#15803d] shadow-lg"
        >
          <Text className="text-white font-bold text-sm">
            {isComplete ? 'Enter StockPilot NG' : 'Skip & Launch Workspace'}
          </Text>
          <AppIcon name="arrow_forward" size={18} color="#ffffff" />
        </Pressable>

        {/* Trust Pillars & Compliance Badges */}
        <View className="items-center text-center gap-0.5 mt-1">
          <Text className="text-[11px] text-[#7ffc97]/80 text-center">
            Trusted by 12,000+ FMCG & Wholesale Hubs Nationwide
          </Text>
          <Text className="text-[10px] text-[#4d7e63] text-center">
            StockPilot v2.4.8 (Enterprise Offline Build) • CBN & CAC Compliant Architecture
          </Text>
        </View>
      </View>
    </View>
  );
}
