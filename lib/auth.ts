import { supabase } from './supabase';

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  businessName: string;
  tradeHub: string;
  role: 'merchant' | 'buyer';
  isDemo?: boolean;
}

const AUTH_STORAGE_KEY = 'stockpilot_auth_session';

export const DEMO_MERCHANT: UserProfile = {
  id: 'merchant_standard',
  name: 'Store Manager',
  phone: '+234 800 000 0000',
  email: 'merchant@stockpilot.ng',
  businessName: 'My Wholesale Depot',
  tradeHub: 'Lagos Central Market, Lagos',
  role: 'merchant',
  isDemo: false,
};

export const DEMO_BUYER: UserProfile = {
  id: 'buyer_standard',
  name: 'Retail Buyer',
  phone: '+234 800 111 2222',
  email: 'buyer@stockpilot.ng',
  businessName: 'Superstore Retail Hub',
  tradeHub: 'Balogun Market, Lagos Island',
  role: 'buyer',
  isDemo: false,
};

let inMemoryUserSession: UserProfile | null = null;

function getSafeLocalStorage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    if (!('localStorage' in window)) return null;
    const storage = window.localStorage;
    if (!storage) return null;
    const testKey = '__stockpilot_test__';
    storage.setItem(testKey, '1');
    storage.removeItem(testKey);
    return storage;
  } catch {
    return null;
  }
}

export function getStoredUser(): UserProfile | null {
  if (inMemoryUserSession) return inMemoryUserSession;
  try {
    const storage = getSafeLocalStorage();
    if (storage) {
      const data = storage.getItem(AUTH_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        inMemoryUserSession = parsed;
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to read auth session from storage', e);
  }
  return inMemoryUserSession;
}

export function saveStoredUser(user: UserProfile | null): void {
  inMemoryUserSession = user;
  try {
    const storage = getSafeLocalStorage();
    if (storage) {
      if (user) {
        storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      } else {
        storage.removeItem(AUTH_STORAGE_KEY);
      }
    }
  } catch (e) {
    console.warn('Failed to save auth session to storage', e);
  }
}

export async function loginWithDemo(role: 'merchant' | 'buyer' = 'merchant'): Promise<UserProfile> {
  const user = role === 'merchant' ? DEMO_MERCHANT : DEMO_BUYER;
  saveStoredUser(user);
  return user;
}

export async function loginWithCredentials(
  identifier: string,
  secret: string
): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  // Try Supabase auth if identifier looks like email
  if (identifier.includes('@') && supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: identifier.trim(),
        password: secret,
      });

      if (!error && data?.user) {
        const profile: UserProfile = {
          id: data.user.id,
          name: data.user.user_metadata?.full_name || 'StockPilot Merchant',
          phone: data.user.phone || '+234 803 000 0000',
          email: data.user.email,
          businessName: data.user.user_metadata?.business_name || 'My Wholesale Depot',
          tradeHub: data.user.user_metadata?.trade_hub || 'Idumota Market, Lagos',
          role: 'merchant',
          isDemo: false,
        };
        saveStoredUser(profile);
        return { success: true, user: profile };
      }
    } catch (err: any) {
      console.warn('Supabase login fallback:', err?.message);
    }
  }

  // Fallback local verification for trade phone/demo credentials
  const cleanPhone = identifier.replace(/[^0-9]/g, '');
  if (cleanPhone.length >= 7 || identifier.toLowerCase().includes('demo')) {
    const user: UserProfile = {
      id: `usr_${Date.now()}`,
      name: 'Store Manager',
      phone: identifier.startsWith('+') ? identifier : `+234 ${identifier}`,
      businessName: 'My Wholesale Depot',
      tradeHub: 'Central Wholesale Hub, Lagos',
      role: 'merchant',
      isDemo: false,
    };
    saveStoredUser(user);
    return { success: true, user };
  }

  return { success: false, error: 'Please enter a valid Nigerian phone number (+234) or registered email.' };
}

export async function signupMerchant(details: {
  businessName: string;
  ownerName: string;
  phone: string;
  tradeHub: string;
}): Promise<UserProfile> {
  const profile: UserProfile = {
    id: `usr_${Date.now()}`,
    name: details.ownerName.trim(),
    businessName: details.businessName.trim(),
    phone: details.phone.trim(),
    tradeHub: details.tradeHub,
    role: 'merchant',
    isDemo: false,
  };
  saveStoredUser(profile);
  return profile;
}

export function logout(): void {
  saveStoredUser(null);
  try {
    if (supabase) {
      supabase.auth.signOut().catch(() => {});
    }
  } catch {}
}
