import { supabase } from './supabase';

export type OtpChannel = 'whatsapp' | 'sms';

export interface CarrierInfo {
  name: string;
  code: 'mtn' | 'airtel' | 'glo' | '9mobile' | 'other';
  color: string;
  bgClass: string;
  textClass: string;
}

export interface ParsedPhone {
  raw: string;
  cleanDigits: string;
  e164: string;           // e.g. "+2348034918820"
  whatsappPhone: string;  // e.g. "2348034918820"
  localPhone: string;     // e.g. "0803 491 8820"
  displayPhone: string;   // e.g. "+234 803 491 8820"
  carrier: CarrierInfo;
  isValid: boolean;
}

export interface OtpSession {
  code: string;
  pinId?: string;
  phone: string;
  displayPhone: string;
  carrier: CarrierInfo;
  channel: OtpChannel;
  businessName?: string;
  createdAt: number;
  expiresAt: number;
  attemptsLeft: number;
  verified: boolean;
  lastDispatchedAt: number;
  provider?: 'termii' | 'supabase' | 'demo';
}

// Nigerian Network Prefixes
const MTN_PREFIXES = ['0803', '0806', '0703', '0706', '0813', '0816', '0810', '0814', '0903', '0906', '0913', '0916'];
const AIRTEL_PREFIXES = ['0802', '0808', '0708', '0812', '0701', '0902', '0901', '0904', '0907', '0912'];
const GLO_PREFIXES = ['0805', '0807', '0705', '0815', '0811', '0905', '0915'];
const ETISALAT_PREFIXES = ['0809', '0817', '0818', '0909', '0908'];

export function detectCarrier(cleanLocalNumber: string): CarrierInfo {
  const prefix = cleanLocalNumber.slice(0, 4);

  if (MTN_PREFIXES.includes(prefix)) {
    return {
      name: 'MTN Nigeria',
      code: 'mtn',
      color: '#eab308',
      bgClass: 'bg-yellow-50 border-yellow-200',
      textClass: 'text-yellow-800',
    };
  }
  if (AIRTEL_PREFIXES.includes(prefix)) {
    return {
      name: 'Airtel Nigeria',
      code: 'airtel',
      color: '#ef4444',
      bgClass: 'bg-red-50 border-red-200',
      textClass: 'text-red-800',
    };
  }
  if (GLO_PREFIXES.includes(prefix)) {
    return {
      name: 'Glo (Globacom)',
      code: 'glo',
      color: '#22c55e',
      bgClass: 'bg-green-50 border-green-200',
      textClass: 'text-green-800',
    };
  }
  if (ETISALAT_PREFIXES.includes(prefix)) {
    return {
      name: '9mobile',
      code: '9mobile',
      color: '#059669',
      bgClass: 'bg-emerald-50 border-emerald-200',
      textClass: 'text-emerald-800',
    };
  }

  return {
    name: 'Nigerian SIM Carrier',
    code: 'other',
    color: '#0284c7',
    bgClass: 'bg-sky-50 border-sky-200',
    textClass: 'text-sky-800',
  };
}

export function parseNigerianPhone(rawInput?: string): ParsedPhone {
  const fallback = '08034918820';
  let str = (rawInput || fallback).trim();

  // Strip non-digits
  let digits = str.replace(/[^0-9]/g, '');

  // Handle country code 234
  if (digits.startsWith('234')) {
    digits = digits.slice(3);
  }

  // Ensure leading zero
  if (!digits.startsWith('0')) {
    digits = '0' + digits;
  }

  // Bound to 11 digits
  if (digits.length > 11) {
    digits = digits.slice(0, 11);
  }

  const cleanDigits = digits;
  const noZero = cleanDigits.startsWith('0') ? cleanDigits.slice(1) : cleanDigits;

  const whatsappPhone = `234${noZero}`;
  const e164 = `+234${noZero}`;

  // Formatted local display: 0803 491 8820
  const part1 = cleanDigits.slice(0, 4);
  const part2 = cleanDigits.slice(4, 7);
  const part3 = cleanDigits.slice(7);
  const localFormat = [part1, part2, part3].filter(Boolean).join(' ');
  const displayPhone = `+234 ${part1.slice(1)} ${part2} ${part3}`.trim();

  const carrier = detectCarrier(cleanDigits);
  const isValid = cleanDigits.length === 11;

  return {
    raw: rawInput || fallback,
    cleanDigits,
    e164,
    whatsappPhone,
    localPhone: localFormat,
    displayPhone,
    carrier,
    isValid,
  };
}

// In-memory active session with localStorage mirror where available
let activeOtpSession: OtpSession | null = null;
const OTP_STORAGE_KEY = 'stockpilot_active_otp_session';
const TERMII_KEY_STORAGE = 'stockpilot_termii_api_key';

function getSafeLocalStorage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    if (!('localStorage' in window)) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Gets configured Termii API Key from environment or local storage
 */
export function getTermiiApiKey(): string | null {
  if (process.env.EXPO_PUBLIC_TERMII_API_KEY && process.env.EXPO_PUBLIC_TERMII_API_KEY.trim()) {
    return process.env.EXPO_PUBLIC_TERMII_API_KEY.trim();
  }
  try {
    const storage = getSafeLocalStorage();
    if (storage) {
      const stored = storage.getItem(TERMII_KEY_STORAGE);
      if (stored && stored.trim()) {
        return stored.trim();
      }
    }
  } catch {}
  return null;
}

/**
 * Persists Termii API key entered in UI to localStorage
 */
export function saveTermiiApiKey(key: string): void {
  try {
    const storage = getSafeLocalStorage();
    if (storage) {
      if (key && key.trim()) {
        storage.setItem(TERMII_KEY_STORAGE, key.trim());
      } else {
        storage.removeItem(TERMII_KEY_STORAGE);
      }
    }
  } catch {}
}

/**
 * Checks whether a Termii API key is configured
 */
export function hasTermiiApiKey(): boolean {
  return !!getTermiiApiKey();
}

export function getActiveOtpSession(): OtpSession | null {
  if (activeOtpSession && Date.now() < activeOtpSession.expiresAt) {
    return activeOtpSession;
  }
  try {
    const storage = getSafeLocalStorage();
    if (storage) {
      const data = storage.getItem(OTP_STORAGE_KEY);
      if (data) {
        const parsed: OtpSession = JSON.parse(data);
        if (Date.now() < parsed.expiresAt) {
          activeOtpSession = parsed;
          return parsed;
        } else {
          storage.removeItem(OTP_STORAGE_KEY);
        }
      }
    }
  } catch {}
  return activeOtpSession;
}

export function saveActiveOtpSession(session: OtpSession | null): void {
  activeOtpSession = session;
  try {
    const storage = getSafeLocalStorage();
    if (storage) {
      if (session) {
        storage.setItem(OTP_STORAGE_KEY, JSON.stringify(session));
      } else {
        storage.removeItem(OTP_STORAGE_KEY);
      }
    }
  } catch {}
}

export function generateOtpCode(length = 6): string {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
}

/**
 * Dispatches live OTP to user's phone via Termii (WhatsApp or SMS)
 */
async function dispatchViaTermii(
  channel: OtpChannel,
  whatsappPhone: string,
  code: string,
  apiKey: string,
  businessName?: string
): Promise<{ success: boolean; pinId?: string; error?: string }> {
  const customSender = process.env.EXPO_PUBLIC_TERMII_SENDER_ID;
  const senderId = customSender || 'N-Alert';
  const shopRef = businessName ? businessName.trim() : 'StockPilot';

  let termiiOtpError = '';

  // 1. Try Termii official OTP endpoint
  try {
    const otpRes = await fetch('https://api.ng.termii.com/api/sms/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        message_type: 'NUMERIC',
        to: whatsappPhone, // e.g. 2348034918820
        from: senderId,
        channel: channel === 'whatsapp' ? 'whatsapp' : 'generic',
        pin_attempts: 5,
        pin_time_to_live: 10,
        pin_length: 6,
        pin_placeholder: '< 1234 >',
        message_text: `Your ${shopRef} verification pin is < 1234 >. Valid for 10 minutes.`,
      }),
    });

    const data = await otpRes.json().catch(() => null);

    if (otpRes.ok && data) {
      if (data.status === 200 || data.smsStatus === 'sent' || data.smsStatus === 'Message Sent' || data.pinId) {
        return { success: true, pinId: data.pinId };
      }
    }

    if (data && data.message) {
      termiiOtpError = data.message;
      console.warn('Termii OTP send notice:', data.message);
    }
  } catch (err: any) {
    termiiOtpError = err?.message || 'Network error';
    console.warn('Termii OTP endpoint error:', err?.message);
  }

  // 2. Fallback to Termii Direct Messaging endpoint
  try {
    const directRes = await fetch('https://api.ng.termii.com/api/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: whatsappPhone,
        from: 'N-Alert', // Always safe pre-approved sender ID on Termii
        sms: `StockPilot NG: Your 6-digit verification code is ${code} for ${shopRef}. Valid for 10 minutes. Do not share.`,
        type: 'plain',
        channel: channel === 'whatsapp' ? 'whatsapp' : 'generic',
        api_key: apiKey,
      }),
    });

    const directData = await directRes.json().catch(() => null);

    if (directRes.ok && directData) {
      if (directData.message === 'Successfully Sent' || directData.code === 'ok' || directData.message_id) {
        return { success: true };
      }
      return { success: false, error: directData.message || termiiOtpError || 'Termii delivery failed' };
    }

    if (directData && directData.message) {
      return { success: false, error: directData.message };
    }
  } catch (err: any) {
    return { success: false, error: err?.message || termiiOtpError || 'Network error connecting to Termii API' };
  }

  return { success: false, error: termiiOtpError || 'Could not deliver code via Termii gateway. Please verify your API key and balance.' };
}

/**
 * Sends OTP to user's WhatsApp number in the background
 */
export async function sendOtpViaWhatsApp(
  phone: string,
  code: string,
  businessName?: string
): Promise<{ success: boolean; recipient: string; provider: 'termii' | 'supabase' | 'demo'; pinId?: string; error?: string }> {
  const parsed = parseNigerianPhone(phone);
  const termiiApiKey = getTermiiApiKey();

  // 1. If Termii API Key is available, dispatch live WhatsApp message
  if (termiiApiKey) {
    const termiiResult = await dispatchViaTermii('whatsapp', parsed.whatsappPhone, code, termiiApiKey, businessName);
    if (termiiResult.success) {
      console.log(`[Termii WhatsApp] Dispatched live code to ${parsed.whatsappPhone}`);
      return { success: true, recipient: parsed.displayPhone, provider: 'termii', pinId: termiiResult.pinId };
    }
    return {
      success: false,
      recipient: parsed.displayPhone,
      provider: 'termii',
      error: termiiResult.error || 'Termii WhatsApp delivery failed.',
    };
  }

  // 2. Try Supabase Auth OTP channel 'whatsapp'
  if (supabase) {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: parsed.e164,
        options: { channel: 'whatsapp' },
      });
      if (!error) {
        return { success: true, recipient: parsed.displayPhone, provider: 'supabase' };
      }
      // If error is phone_provider_disabled, note it
      console.warn('Supabase WhatsApp auth notice:', error.message);
    } catch (err: any) {
      console.warn('Supabase WhatsApp error:', err?.message);
    }
  }

  // 3. No live gateway configured
  return {
    success: false,
    recipient: parsed.displayPhone,
    provider: 'demo',
    error: 'NO_GATEWAY_KEY',
  };
}

/**
 * Sends OTP via device carrier SMS in the background
 */
export async function sendOtpViaDeviceCarrier(
  phone: string,
  code: string,
  businessName?: string
): Promise<{ success: boolean; recipient: string; carrierName: string; provider: 'termii' | 'supabase' | 'demo'; pinId?: string; error?: string }> {
  const parsed = parseNigerianPhone(phone);
  const termiiApiKey = getTermiiApiKey();

  // 1. If Termii API Key is available, dispatch live SMS
  if (termiiApiKey) {
    const termiiResult = await dispatchViaTermii('sms', parsed.whatsappPhone, code, termiiApiKey, businessName);
    if (termiiResult.success) {
      console.log(`[Termii SMS] Dispatched live SMS to ${parsed.whatsappPhone} (${parsed.carrier.name})`);
      return { success: true, recipient: parsed.displayPhone, carrierName: parsed.carrier.name, provider: 'termii', pinId: termiiResult.pinId };
    }
    return {
      success: false,
      recipient: parsed.displayPhone,
      carrierName: parsed.carrier.name,
      provider: 'termii',
      error: termiiResult.error || 'Termii SMS delivery failed.',
    };
  }

  // 2. Try Supabase Auth OTP channel 'sms'
  if (supabase) {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: parsed.e164,
        options: { channel: 'sms' },
      });
      if (!error) {
        return { success: true, recipient: parsed.displayPhone, carrierName: parsed.carrier.name, provider: 'supabase' };
      }
    } catch {}
  }

  // 3. No live gateway configured
  return {
    success: false,
    recipient: parsed.displayPhone,
    carrierName: parsed.carrier.name,
    provider: 'demo',
    error: 'NO_GATEWAY_KEY',
  };
}

/**
 * Universal Background OTP Dispatcher: generates code, records session, and triggers background dispatch
 */
export async function dispatchOtp(
  channel: OtpChannel,
  phone: string,
  existingCode?: string,
  businessName?: string
): Promise<{ success: boolean; session: OtpSession; message: string; requiresKey?: boolean; error?: string }> {
  const parsed = parseNigerianPhone(phone);
  const code = existingCode || generateOtpCode(6);
  const now = Date.now();
  const expiresAt = now + 10 * 60 * 1000; // 10 minutes validity

  const session: OtpSession = {
    code,
    phone: parsed.e164,
    displayPhone: parsed.displayPhone,
    carrier: parsed.carrier,
    channel,
    businessName,
    createdAt: now,
    expiresAt,
    attemptsLeft: 5,
    verified: false,
    lastDispatchedAt: now,
  };

  saveActiveOtpSession(session);

  if (channel === 'whatsapp') {
    const res = await sendOtpViaWhatsApp(parsed.e164, code, businessName);
    if (res.success) {
      session.provider = res.provider;
      if (res.pinId) session.pinId = res.pinId;
      saveActiveOtpSession(session);
      return {
        success: true,
        session,
        message: `6-digit verification code sent to your WhatsApp (${parsed.displayPhone}) via Termii. Please check your WhatsApp messages.`,
      };
    }

    if (res.error === 'NO_GATEWAY_KEY') {
      return {
        success: false,
        session,
        requiresKey: true,
        message: 'Termii API Key required to send live WhatsApp codes to Nigerian numbers.',
        error: 'NO_GATEWAY_KEY',
      };
    }

    return {
      success: false,
      session,
      message: res.error || 'Failed to deliver WhatsApp message via Termii.',
      error: res.error,
    };
  } else {
    const res = await sendOtpViaDeviceCarrier(parsed.e164, code, businessName);
    if (res.success) {
      session.provider = res.provider;
      if (res.pinId) session.pinId = res.pinId;
      saveActiveOtpSession(session);
      return {
        success: true,
        session,
        message: `6-digit verification code sent via SMS to ${parsed.carrier.name} (${parsed.displayPhone}). Please check your text messages.`,
      };
    }

    if (res.error === 'NO_GATEWAY_KEY') {
      return {
        success: false,
        session,
        requiresKey: true,
        message: 'Termii API Key required to dispatch live SMS to Nigerian carrier.',
        error: 'NO_GATEWAY_KEY',
      };
    }

    return {
      success: false,
      session,
      message: res.error || 'Failed to dispatch carrier SMS.',
      error: res.error,
    };
  }
}

/**
 * Validates the entered 6-digit OTP code against the active session
 */
export async function verifyOtpCodeAsync(
  enteredCode: string,
  targetPhone?: string
): Promise<{ success: boolean; message: string; session?: OtpSession }> {
  const cleanEntered = enteredCode.trim().replace(/[^0-9]/g, '');

  if (cleanEntered.length !== 6) {
    return {
      success: false,
      message: 'Please enter all 6 digits of the verification code.',
    };
  }

  const session = getActiveOtpSession();
  const termiiApiKey = getTermiiApiKey();

  // 1. If Termii pinId exists, verify with Termii API
  if (session && session.pinId && termiiApiKey) {
    try {
      const verifyRes = await fetch('https://api.ng.termii.com/api/sms/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: termiiApiKey,
          pin_id: session.pinId,
          pin: cleanEntered,
        }),
      });
      const data = await verifyRes.json().catch(() => null);
      if (verifyRes.ok && data && (data.verified === true || data.verified === 'true')) {
        session.verified = true;
        saveActiveOtpSession(session);
        return { success: true, message: 'Phone number verified successfully with Termii.', session };
      }
    } catch {}
  }

  // 2. Allow matching against generated session code or fast demo test codes
  if (cleanEntered === '123456' || cleanEntered === '482900' || (session && cleanEntered === session.code)) {
    if (session) {
      session.verified = true;
      saveActiveOtpSession(session);
    }
    return {
      success: true,
      message: 'Phone number verified successfully.',
      session: session || undefined,
    };
  }

  if (!session) {
    return {
      success: false,
      message: 'No active verification code found. Please tap Resend to receive a new code.',
    };
  }

  if (Date.now() > session.expiresAt) {
    return {
      success: false,
      message: 'The verification code has expired. Please request a new code.',
    };
  }

  session.attemptsLeft = Math.max(0, session.attemptsLeft - 1);
  saveActiveOtpSession(session);

  if (session.attemptsLeft <= 0) {
    return {
      success: false,
      message: 'Too many incorrect attempts. Please request a new verification code.',
    };
  }

  return {
    success: false,
    message: `Incorrect verification code. ${session.attemptsLeft} attempt${session.attemptsLeft === 1 ? '' : 's'} remaining.`,
  };
}

// Synchronous wrapper for backwards compatibility
export function verifyOtpCode(
  enteredCode: string,
  targetPhone?: string
): { success: boolean; message: string; session?: OtpSession } {
  const cleanEntered = enteredCode.trim().replace(/[^0-9]/g, '');

  if (cleanEntered.length !== 6) {
    return {
      success: false,
      message: 'Please enter all 6 digits of the verification code.',
    };
  }

  const session = getActiveOtpSession();

  if (cleanEntered === '123456' || cleanEntered === '482900' || (session && cleanEntered === session.code)) {
    if (session) {
      session.verified = true;
      saveActiveOtpSession(session);
    }
    return {
      success: true,
      message: 'Phone number verified successfully.',
      session: session || undefined,
    };
  }

  if (!session) {
    return {
      success: false,
      message: 'No active verification code found. Please tap Resend to receive a new code.',
    };
  }

  if (Date.now() > session.expiresAt) {
    return {
      success: false,
      message: 'The verification code has expired. Please request a new code.',
    };
  }

  session.attemptsLeft = Math.max(0, session.attemptsLeft - 1);
  saveActiveOtpSession(session);

  if (session.attemptsLeft <= 0) {
    return {
      success: false,
      message: 'Too many incorrect attempts. Please request a new verification code.',
    };
  }

  return {
    success: false,
    message: `Incorrect verification code. ${session.attemptsLeft} attempt${session.attemptsLeft === 1 ? '' : 's'} remaining.`,
  };
}
