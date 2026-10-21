import { Linking, Platform } from 'react-native';

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

  // Strip all non-digits
  let digits = str.replace(/[^0-9]/g, '');

  // Handle leading international code
  if (digits.startsWith('234')) {
    digits = digits.slice(3);
  }

  // Ensure leading zero
  if (!digits.startsWith('0') && digits.length === 10) {
    digits = '0' + digits;
  } else if (!digits.startsWith('0')) {
    digits = '0' + digits;
  }

  // Truncate or pad to 11 digits if needed
  if (digits.length > 11) {
    digits = digits.slice(0, 11);
  }

  const cleanDigits = digits;
  const localNum = cleanDigits; // e.g. 08034918820
  const noZero = cleanDigits.startsWith('0') ? cleanDigits.slice(1) : cleanDigits;

  const whatsappPhone = `234${noZero}`;
  const e164 = `+234${noZero}`;

  // Formatted local display: 0803 491 8820
  const part1 = localNum.slice(0, 4);
  const part2 = localNum.slice(4, 7);
  const part3 = localNum.slice(7);
  const localFormat = [part1, part2, part3].filter(Boolean).join(' ');
  const displayPhone = `+234 ${part1.slice(1)} ${part2} ${part3}`.trim();

  const carrier = detectCarrier(localNum);
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

function getSafeLocalStorage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    if (!('localStorage' in window)) return null;
    return window.localStorage;
  } catch {
    return null;
  }
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
 * Dispatches OTP code via WhatsApp
 * Uses whatsapp:// scheme on mobile devices or https://wa.me/ on web/fallbacks
 */
export async function sendOtpViaWhatsApp(
  phone: string,
  code: string,
  businessName?: string
): Promise<{ success: boolean; url: string; error?: string }> {
  const parsed = parseNigerianPhone(phone);
  const shopRef = businessName ? businessName.trim() : 'StockPilot Terminal';

  const messageText = [
    `*StockPilot Nigeria - Security Verification*`,
    ``,
    `Your single-use 6-digit identity code is:`,
    `👉 *${code}* 👈`,
    ``,
    `🏢 Account / Till: *${shopRef}*`,
    `📱 Verified Mobile: *${parsed.displayPhone}*`,
    `⏱️ Valid for: *10 minutes*`,
    ``,
    `⚠️ _Security Warning: StockPilot agents, market chairmen, and bank reps will NEVER ask for this code. Never disclose it._`,
  ].join('\n');

  const encodedText = encodeURIComponent(messageText);

  // Direct WhatsApp deep link URLs
  const nativeAppUrl = `whatsapp://send?phone=${parsed.whatsappPhone}&text=${encodedText}`;
  const webUrl = `https://wa.me/${parsed.whatsappPhone}?text=${encodedText}`;

  try {
    // Try opening native WhatsApp client first if possible
    let opened = false;
    if (Platform.OS !== 'web') {
      const canOpenNative = await Linking.canOpenURL(nativeAppUrl).catch(() => false);
      if (canOpenNative) {
        await Linking.openURL(nativeAppUrl);
        opened = true;
      }
    }

    if (!opened) {
      // Fallback to wa.me universal web link
      await Linking.openURL(webUrl);
    }

    return { success: true, url: webUrl };
  } catch (err: any) {
    console.warn('Failed to open WhatsApp via Linking:', err?.message);
    // Even if native intent fails (e.g. headless environment), return URL for UI fallback
    return { success: false, url: webUrl, error: err?.message || 'Could not launch WhatsApp' };
  }
}

/**
 * Dispatches OTP code via device carrier SMS (MTN, Airtel, Glo, 9mobile)
 * Opens device's native SMS composer pre-filled with the code and recipient
 */
export async function sendOtpViaDeviceCarrier(
  phone: string,
  code: string,
  businessName?: string
): Promise<{ success: boolean; url: string; error?: string }> {
  const parsed = parseNigerianPhone(phone);
  const shopRef = businessName ? businessName.trim() : 'StockPilot';

  const smsText = `StockPilot NG: Your 6-digit verification code is ${code} for ${shopRef}. Valid for 10 mins. Keep it secure and do not share.`;
  const encodedBody = encodeURIComponent(smsText);

  // Platform-specific SMS deep link schemas
  // iOS uses '&body=', Android & Web standard is '?body='
  const smsUrl = Platform.OS === 'ios'
    ? `sms:${parsed.e164}&body=${encodedBody}`
    : `sms:${parsed.e164}?body=${encodedBody}`;

  try {
    await Linking.openURL(smsUrl);
    return { success: true, url: smsUrl };
  } catch (err: any) {
    console.warn('Failed to open native SMS via Linking:', err?.message);
    return { success: false, url: smsUrl, error: err?.message || 'Could not launch SMS app' };
  }
}

/**
 * Universal OTP Dispatcher: generates code, records session, and triggers dispatch
 */
export async function dispatchOtp(
  channel: OtpChannel,
  phone: string,
  existingCode?: string,
  businessName?: string
): Promise<{ success: boolean; session: OtpSession; url: string; error?: string }> {
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

  let result: { success: boolean; url: string; error?: string };
  if (channel === 'whatsapp') {
    result = await sendOtpViaWhatsApp(parsed.e164, code, businessName);
  } else {
    result = await sendOtpViaDeviceCarrier(parsed.e164, code, businessName);
  }

  return {
    success: result.success,
    session,
    url: result.url,
    error: result.error,
  };
}

/**
 * Validates the entered 6-digit OTP code against the active session
 */
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

  // Allow fast developer / merchant demo test codes for frictionless onboarding testing
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
