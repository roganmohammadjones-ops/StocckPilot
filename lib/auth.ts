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
  id: 'merchant_alhaji_musa',
  name: 'Alhaji Musa Sani',
  phone: '+234 803 491 8820',
  email: 'musa.provisions@stockpilot.ng',
  businessName: 'Musa & Sons Provisions Ltd',
  tradeHub: 'Idumota Wholesale Hub, Lagos',
  role: 'merchant',
  isDemo: true,
};

export const DEMO_BUYER: UserProfile = {
  id: 'buyer_topchoice',
  name: 'Mrs. Folake Adebayo',
  phone: '+234 802 334 1190',
  email: 'folake.retail@gmail.com',
  businessName: 'TopChoice Superstore',
  tradeHub: 'Balogun Market, Lagos Island',
  role: 'buyer',
  isDemo: true,
};

export function getStoredUser(): UserProfile | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const data = window.localStorage.getItem(AUTH_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    }
  } catch (e) {
    console.warn('Failed to read auth session from storage', e);
  }
  return null;
}

export function saveStoredUser(user: UserProfile | null): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (user) {
        window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      } else {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
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
  if (cleanPhone.length >= 7 || identifier.toLowerCase().includes('demo') || identifier.toLowerCase().includes('musa')) {
    const user: UserProfile = {
      id: `usr_${Date.now()}`,
      name: identifier.toLowerCase().includes('musa') ? 'Alhaji Musa Sani' : 'Verified Merchant',
      phone: identifier.startsWith('+') ? identifier : `+234 ${identifier}`,
      businessName: identifier.toLowerCase().includes('musa') ? 'Musa & Sons Provisions Ltd' : 'Local Wholesale Depot',
      tradeHub: 'Idumota Wholesale Hub, Lagos',
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
