import 'expo-sqlite/localStorage/install';
import { useState, useEffect, useCallback } from 'react';
import type { AppDatabase } from './db/web-db';
import type { Customer } from './db/types';
import type { StoreProfile } from './store-profile';
import { useAppDb, useDataRefresh } from './db/provider';
import { useStoreProfile } from './store-profile';

export type NotificationType = 'inventory' | 'debt' | 'sales' | 'system';
export type NotificationPriority = 'urgent' | 'warning' | 'info' | 'success';

export interface AppNotification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  timestamp: string;
  timestampRaw: number;
  isRead: boolean;
  actionText?: string;
  actionRoute?: string;
  actionType?: 'navigate' | 'whatsapp' | 'call';
  actionPayload?: any;
  iconName: string;
}

const READ_STORAGE_KEY = 'stockpilot_notifications_read_ids';
const DISMISSED_STORAGE_KEY = 'stockpilot_notifications_dismissed_ids';

function getSafeLocalStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    if (typeof localStorage !== 'undefined') {
      return localStorage;
    }
    return null;
  } catch {
    return null;
  }
}

// In-memory sets initialized from localStorage
let readNotificationIds = new Set<string>();
let dismissedNotificationIds = new Set<string>();
let isStorageInitialized = false;

function initStorageOnce(): void {
  if (isStorageInitialized) return;
  isStorageInitialized = true;
  try {
    const storage = getSafeLocalStorage();
    if (storage) {
      const readData = storage.getItem(READ_STORAGE_KEY);
      if (readData) {
        const parsed = JSON.parse(readData);
        if (Array.isArray(parsed)) {
          readNotificationIds = new Set(parsed);
        }
      }
      const dismissedData = storage.getItem(DISMISSED_STORAGE_KEY);
      if (dismissedData) {
        const parsed = JSON.parse(dismissedData);
        if (Array.isArray(parsed)) {
          dismissedNotificationIds = new Set(parsed);
        }
      }
    }
  } catch (e) {
    console.warn('Failed to initialize notifications storage:', e);
  }
}

function persistStorage(): void {
  try {
    const storage = getSafeLocalStorage();
    if (storage) {
      storage.setItem(READ_STORAGE_KEY, JSON.stringify(Array.from(readNotificationIds)));
      storage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(Array.from(dismissedNotificationIds)));
    }
  } catch (e) {
    console.warn('Failed to persist notifications storage:', e);
  }
}

// Event subscribers
const listeners = new Set<() => void>();
let cachedNotifications: AppNotification[] = [];
let cachedUnreadCount = 0;

function notifySubscribers(): void {
  persistStorage();
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.warn('Notification listener error:', e);
    }
  });
}

export function subscribeNotifications(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function markNotificationAsRead(id: string): void {
  initStorageOnce();
  readNotificationIds.add(id);
  cachedNotifications = cachedNotifications.map((n) =>
    n.id === id ? { ...n, isRead: true } : n
  );
  cachedUnreadCount = cachedNotifications.filter((n) => !n.isRead).length;
  notifySubscribers();
}

export function markAllNotificationsAsRead(ids?: string[]): void {
  initStorageOnce();
  const targetIds = ids || cachedNotifications.map((n) => n.id);
  targetIds.forEach((id) => readNotificationIds.add(id));
  cachedNotifications = cachedNotifications.map((n) => ({ ...n, isRead: true }));
  cachedUnreadCount = 0;
  notifySubscribers();
}

export function dismissNotification(id: string): void {
  initStorageOnce();
  dismissedNotificationIds.add(id);
  cachedNotifications = cachedNotifications.filter((n) => n.id !== id);
  cachedUnreadCount = cachedNotifications.filter((n) => !n.isRead).length;
  notifySubscribers();
}

export function clearAllNotifications(): void {
  initStorageOnce();
  cachedNotifications.forEach((n) => dismissedNotificationIds.add(n.id));
  cachedNotifications = [];
  cachedUnreadCount = 0;
  notifySubscribers();
}

export function restoreAllNotifications(): void {
  initStorageOnce();
  dismissedNotificationIds.clear();
  try {
    const storage = getSafeLocalStorage();
    if (storage) {
      storage.removeItem(DISMISSED_STORAGE_KEY);
    }
  } catch {}
  notifySubscribers();
}

/**
 * Builds live dynamic notifications based on SQLite state
 */
export async function buildLiveNotifications(
  db: AppDatabase,
  store: StoreProfile
): Promise<AppNotification[]> {
  initStorageOnce();
  const items: AppNotification[] = [];
  const now = Date.now();

  try {
    // 1. Fetch Out-of-Stock and Low-Stock products
    interface ProductAlertRow {
      id: string;
      name: string;
      sku: string;
      stock_left: number;
      stock_unit: string;
      min_alert: number;
    }

    const lowStockRows = await db.getAllAsync<ProductAlertRow>(
      'SELECT id, name, sku, stock_left, stock_unit, min_alert FROM products WHERE stock_left <= min_alert ORDER BY stock_left ASC'
    );

    lowStockRows.forEach((prod) => {
      const isOutOfStock = prod.stock_left <= 0;
      const id = isOutOfStock ? `stock_out_${prod.id}` : `stock_low_${prod.id}`;

      if (dismissedNotificationIds.has(id)) return;

      if (isOutOfStock) {
        items.push({
          id,
          type: 'inventory',
          priority: 'urgent',
          title: `Out of Stock: ${prod.name}`,
          message: `Inventory is depleted (0 ${prod.stock_unit} left). Restock immediately to fulfill customer demand.`,
          timestamp: 'Action Required',
          timestampRaw: now - 3600000,
          isRead: readNotificationIds.has(id),
          actionText: 'Restock in Inventory',
          actionRoute: '/(tabs)/inventory',
          actionType: 'navigate',
          iconName: 'notification_important',
        });
      } else {
        items.push({
          id,
          type: 'inventory',
          priority: 'warning',
          title: `Low Stock Alert: ${prod.name}`,
          message: `Only ${prod.stock_left} ${prod.stock_unit} remaining, below the safety threshold of ${prod.min_alert} ${prod.stock_unit}.`,
          timestamp: 'Safety Threshold',
          timestampRaw: now - 7200000,
          isRead: readNotificationIds.has(id),
          actionText: 'View Product',
          actionRoute: '/(tabs)/inventory',
          actionType: 'navigate',
          iconName: 'warning',
        });
      }
    });

    // 2. Fetch Overdue & Owing Customers
    interface CustomerAlertRow {
      id: string;
      name: string;
      phone: string;
      location: string;
      tier: string;
      is_verified: number;
      credit_limit: number;
      balance: number;
      due_text: string;
      last_credit?: string;
      last_payment?: string;
    }

    const owingCustomers = await db.getAllAsync<CustomerAlertRow>(
      'SELECT * FROM customers WHERE balance > 0 ORDER BY balance DESC'
    );

    owingCustomers.forEach((cust) => {
      const isOverdue =
        cust.tier?.toLowerCase().includes('overdue') ||
        cust.due_text?.toLowerCase().includes('overdue') ||
        cust.due_text?.toLowerCase().includes('expired') ||
        cust.due_text?.toLowerCase().includes('30');

      const id = isOverdue ? `debt_overdue_${cust.id}` : `debt_duesoon_${cust.id}`;
      if (dismissedNotificationIds.has(id)) return;

      const customerObj: Customer = {
        id: cust.id,
        name: cust.name,
        phone: cust.phone || '',
        location: cust.location || '',
        tier: cust.tier || 'Silver Tier',
        isVerified: Boolean(cust.is_verified),
        creditLimit: cust.credit_limit || 0,
        balance: cust.balance,
        debtStatus: isOverdue ? 'overdue' : 'due_soon',
        dueText: cust.due_text || 'Payment Terms',
        lastCredit: cust.last_credit,
        lastPayment: cust.last_payment,
      };

      if (isOverdue) {
        items.push({
          id,
          type: 'debt',
          priority: 'urgent',
          title: `Overdue Debt: ${cust.name}`,
          message: `Outstanding balance of ₦${cust.balance.toLocaleString()} is overdue (${cust.due_text || 'Past Due'}). Automated WhatsApp formal demand is prepared.`,
          timestamp: 'Overdue Notice',
          timestampRaw: now - 10800000,
          isRead: readNotificationIds.has(id),
          actionText: 'Send WhatsApp Demand',
          actionType: 'whatsapp',
          actionPayload: customerObj,
          iconName: 'payments',
        });
      } else {
        items.push({
          id,
          type: 'debt',
          priority: 'warning',
          title: `Payment Due Soon: ${cust.name}`,
          message: `₦${cust.balance.toLocaleString()} trade credit balance is maturing (${cust.due_text || 'Active Terms'}).`,
          timestamp: 'Due Soon',
          timestampRaw: now - 18000000,
          isRead: readNotificationIds.has(id),
          actionText: 'View Customer Ledger',
          actionRoute: '/(tabs)/customers',
          actionType: 'navigate',
          iconName: 'account_balance_wallet',
        });
      }
    });

    // 3. Fetch Today's Sales
    const todaySalesRow = await db.getFirstAsync<{ total: number | null; count: number }>(
      `SELECT sum(net_payable) as total, count(*) as count 
       FROM sales 
       WHERE date(created_at) = date('now')`
    );

    if (todaySalesRow && todaySalesRow.count > 0 && todaySalesRow.total && todaySalesRow.total > 0) {
      const todayStr = new Date().toISOString().slice(0, 10);
      const id = `sales_today_${todayStr}`;
      if (!dismissedNotificationIds.has(id)) {
        items.push({
          id,
          type: 'sales',
          priority: 'success',
          title: `Sales Milestone: ₦${Math.round(todaySalesRow.total).toLocaleString()} Today`,
          message: `${todaySalesRow.count} transaction${todaySalesRow.count > 1 ? 's' : ''} recorded today with all digital and cash tenders reconciled.`,
          timestamp: 'Today',
          timestampRaw: now - 1800000,
          isRead: readNotificationIds.has(id),
          actionText: 'View Sales Register',
          actionRoute: '/(tabs)/sales',
          actionType: 'navigate',
          iconName: 'trending_up',
        });
      }
    }

    // 4. System Notices
    const syncNotifId = 'system_offline_sync';
    if (!dismissedNotificationIds.has(syncNotifId)) {
      items.push({
        id: syncNotifId,
        type: 'system',
        priority: 'info',
        title: 'Offline Database Ready & Synced',
        message:
          'StockPilot SQLite engine is active on this device. All POS invoices, customer credit records, and stock counts work without internet.',
        timestamp: 'System Status',
        timestampRaw: now - 86400000,
        isRead: readNotificationIds.has(syncNotifId),
        actionText: 'Settings & Profile',
        actionRoute: '/settings',
        actionType: 'navigate',
        iconName: 'verified_user',
      });
    }

    const marketNotifId = 'system_market_hub';
    if (!dismissedNotificationIds.has(marketNotifId)) {
      items.push({
        id: marketNotifId,
        type: 'system',
        priority: 'info',
        title: `${store.marketLocation || 'Lagos Hub'} Trading Network`,
        message:
          'Connect directly with verified wholesale dealers in Idumota, Trade Fair (ASPAAM), and Kano for bulk depot restocks.',
        timestamp: 'Market Intelligence',
        timestampRaw: now - 172800000,
        isRead: readNotificationIds.has(marketNotifId),
        actionText: 'Explore Wholesalers',
        actionRoute: '/explore-sellers',
        actionType: 'navigate',
        iconName: 'warehouse',
      });
    }
  } catch (err) {
    console.error('Failed to build live notifications:', err);
  }

  // Sort by priority and time: urgent first, then warning, then success/info
  const priorityOrder: Record<NotificationPriority, number> = {
    urgent: 0,
    warning: 1,
    success: 2,
    info: 3,
  };

  items.sort((a, b) => {
    if (a.isRead !== b.isRead) {
      return a.isRead ? 1 : -1;
    }
    const prioDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (prioDiff !== 0) return prioDiff;
    return b.timestampRaw - a.timestampRaw;
  });

  cachedNotifications = items;
  cachedUnreadCount = items.filter((n) => !n.isRead).length;

  return items;
}

/**
 * Main React hook for notifications across the app
 */
export function useNotifications() {
  const db = useAppDb();
  const { dataVersion } = useDataRefresh();
  const store = useStoreProfile();

  const [notifications, setNotifications] = useState<AppNotification[]>(cachedNotifications);
  const [unreadCount, setUnreadCount] = useState<number>(cachedUnreadCount);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      const items = await buildLiveNotifications(db, store);
      setNotifications(items);
      setUnreadCount(items.filter((n) => !n.isRead).length);
    } catch (e) {
      console.warn('Error loading notifications:', e);
    } finally {
      setIsLoading(false);
    }
  }, [db, store]);

  useEffect(() => {
    load();
  }, [load, dataVersion]);

  // Subscribe to markRead / dismiss state changes
  useEffect(() => {
    return subscribeNotifications(() => {
      setNotifications([...cachedNotifications]);
      setUnreadCount(cachedNotifications.filter((n) => !n.isRead).length);
    });
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead: markNotificationAsRead,
    markAllAsRead: () => markAllNotificationsAsRead(notifications.map((n) => n.id)),
    dismiss: dismissNotification,
    clearAll: clearAllNotifications,
    restoreAll: () => {
      restoreAllNotifications();
      load();
    },
    refresh: load,
  };
}
