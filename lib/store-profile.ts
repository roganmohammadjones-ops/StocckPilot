import { useState, useEffect } from 'react';
import { getStoredUser, saveStoredUser, type UserProfile } from './auth';

export interface SettlementAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  accountType?: 'Current' | 'Savings' | 'Till POS';
  isDefault: boolean;
}

export interface StoreProfile {
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  cacNumber: string;
  isCacVerified: boolean;
  marketLocation: string;
  marketStall: string;
  settlementAccounts: SettlementAccount[];
  hardware: {
    posPrinterConnected: boolean;
    posPrinterName: string;
    barcodeReaderEnabled: boolean;
  };
}

export const NIGERIAN_BANKS = [
  'Moniepoint MFB',
  'OPay Digital Services',
  'Access Bank Plc',
  'Guaranty Trust Bank (GTBank)',
  'Zenith Bank Plc',
  'First Bank of Nigeria',
  'United Bank for Africa (UBA)',
  'Kuda Microfinance Bank',
  'PalmPay',
  'Stanbic IBTC Bank',
  'Fidelity Bank Plc',
  'Wema Bank / ALAT',
  'Sterling Bank Plc',
  'First City Monument Bank (FCMB)',
  'Union Bank of Nigeria',
  'Ecobank Nigeria',
  'Taj Bank',
  'Jaiz Bank',
];

export const TRADING_HUBS = [
  'Idumota Wholesale Hub, Lagos',
  'Alaba International Market, Lagos',
  'Balogun Market, Lagos Island',
  'Trade Fair Complex (ASPAAM), Lagos',
  'Dawanau Grain Market, Kano',
  'Onitsha Main Market, Anambra',
  'Mile 12 Food Market, Lagos',
  'Bodija Market, Ibadan',
  'Ariaria International Market, Aba',
  'Wuse Market, Abuja',
  'Main Market, Jos',
  'Ogbete Main Market, Enugu',
];

const STORE_PROFILE_STORAGE_KEY = 'stockpilot_store_profile_v1';

let cachedProfile: StoreProfile | null = null;
const listeners = new Set<() => void>();

function getSafeLocalStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
    if (typeof localStorage !== 'undefined') return localStorage;
    return null;
  } catch {
    return null;
  }
}

export function getDefaultStoreProfile(): StoreProfile {
  const user = getStoredUser();
  return {
    businessName: user?.businessName || 'My Wholesale Depot',
    ownerName: user?.name || 'Store Manager',
    phone: user?.phone || '+234 800 000 0000',
    email: user?.email || '',
    cacNumber: 'Unregistered (Sole Trader)',
    isCacVerified: false,
    marketLocation: user?.tradeHub || 'Lagos Central Market, Lagos',
    marketStall: 'Main Stall',
    settlementAccounts: [],
    hardware: {
      posPrinterConnected: false,
      posPrinterName: 'Thermal POS 58mm',
      barcodeReaderEnabled: true,
    },
  };
}

export function getStoreProfile(): StoreProfile {
  if (cachedProfile) return cachedProfile;

  try {
    const storage = getSafeLocalStorage();
    if (storage) {
      const saved = storage.getItem(STORE_PROFILE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        cachedProfile = {
          ...getDefaultStoreProfile(),
          ...parsed,
        };
        return cachedProfile!;
      }
    }
  } catch (e) {
    console.warn('Failed to load store profile from storage', e);
  }

  cachedProfile = getDefaultStoreProfile();
  return cachedProfile;
}

export function saveStoreProfile(profile: StoreProfile): void {
  cachedProfile = { ...profile };

  try {
    const storage = getSafeLocalStorage();
    if (storage) {
      storage.setItem(STORE_PROFILE_STORAGE_KEY, JSON.stringify(profile));
    }
  } catch (e) {
    console.warn('Failed to save store profile to storage', e);
  }

  // Also sync with auth user profile if changed
  const user = getStoredUser();
  if (user) {
    const updatedUser: UserProfile = {
      ...user,
      businessName: profile.businessName,
      name: profile.ownerName,
      phone: profile.phone,
      tradeHub: profile.marketLocation,
    };
    saveStoredUser(updatedUser);
  }

  listeners.forEach((listener) => {
    try {
      listener();
    } catch {}
  });
}

export function updateStoreProfile(partial: Partial<StoreProfile>): StoreProfile {
  const current = getStoreProfile();
  const updated: StoreProfile = {
    ...current,
    ...partial,
  };
  saveStoreProfile(updated);
  return updated;
}

export function addSettlementAccount(account: Omit<SettlementAccount, 'id'>): SettlementAccount {
  const current = getStoreProfile();
  const newAccount: SettlementAccount = {
    ...account,
    id: `acc_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
  };

  let accounts = [...current.settlementAccounts];
  if (newAccount.isDefault || accounts.length === 0) {
    newAccount.isDefault = true;
    accounts = accounts.map((a) => ({ ...a, isDefault: false }));
  }

  accounts.push(newAccount);
  updateStoreProfile({ settlementAccounts: accounts });
  return newAccount;
}

export function updateSettlementAccount(id: string, updates: Partial<SettlementAccount>): void {
  const current = getStoreProfile();
  let accounts = current.settlementAccounts.map((acc) => {
    if (acc.id === id) {
      return { ...acc, ...updates };
    }
    return acc;
  });

  if (updates.isDefault) {
    accounts = accounts.map((acc) => ({
      ...acc,
      isDefault: acc.id === id,
    }));
  }

  updateStoreProfile({ settlementAccounts: accounts });
}

export function removeSettlementAccount(id: string): void {
  const current = getStoreProfile();
  const accounts = current.settlementAccounts.filter((acc) => acc.id !== id);
  if (accounts.length > 0 && !accounts.some((a) => a.isDefault)) {
    accounts[0].isDefault = true;
  }
  updateStoreProfile({ settlementAccounts: accounts });
}

export function setDefaultSettlementAccount(id: string): void {
  const current = getStoreProfile();
  const accounts = current.settlementAccounts.map((acc) => ({
    ...acc,
    isDefault: acc.id === id,
  }));
  updateStoreProfile({ settlementAccounts: accounts });
}

export function resetStoreProfileToStandard(details?: {
  businessName?: string;
  ownerName?: string;
  phone?: string;
  marketLocation?: string;
}): void {
  const defaults = getDefaultStoreProfile();
  const fresh: StoreProfile = {
    ...defaults,
    businessName: details?.businessName || defaults.businessName,
    ownerName: details?.ownerName || defaults.ownerName,
    phone: details?.phone || defaults.phone,
    marketLocation: details?.marketLocation || defaults.marketLocation,
    settlementAccounts: [],
  };
  saveStoreProfile(fresh);
}

export function subscribeStoreProfile(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function useStoreProfile(): StoreProfile {
  const [profile, setProfile] = useState<StoreProfile>(() => getStoreProfile());

  useEffect(() => {
    return subscribeStoreProfile(() => {
      setProfile({ ...getStoreProfile() });
    });
  }, []);

  return profile;
}

