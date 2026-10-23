import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/app-header';
import { AppIcon } from '@/components/icon';
import { colors } from '@/lib/theme';
import { useResponsive } from '@/hooks/use-responsive';
import { useStoreProfile } from '@/lib/store-profile';
import {
  useNotifications,
  type AppNotification,
  type NotificationType,
  type NotificationPriority,
} from '@/lib/notifications';
import { openDebtorWhatsApp, shareDebtorNotice } from '@/lib/debt-recovery';

export default function NotificationsScreen() {
  const router = useRouter();
  const store = useStoreProfile();
  const { isWide, horizontalPadding } = useResponsive();

  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    dismiss,
    clearAll,
    restoreAll,
    refresh,
  } = useNotifications();

  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | NotificationType>('all');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'unread') return !item.isRead;
      return item.type === activeFilter;
    });
  }, [notifications, activeFilter]);

  // Counts for filter pills
  const counts = useMemo(() => {
    return {
      all: notifications.length,
      unread: notifications.filter((n) => !n.isRead).length,
      inventory: notifications.filter((n) => n.type === 'inventory').length,
      debt: notifications.filter((n) => n.type === 'debt').length,
      system: notifications.filter((n) => n.type === 'system' || n.type === 'sales').length,
    };
  }, [notifications]);

  const handleActionPress = (item: AppNotification) => {
    // Mark as read upon acting on it
    if (!item.isRead) {
      markAsRead(item.id);
    }

    if (item.actionType === 'whatsapp' && item.actionPayload) {
      openDebtorWhatsApp(item.actionPayload, store);
    } else if (item.actionRoute) {
      router.push(item.actionRoute as any);
    }
  };

  const handleShareDebtNotice = (item: AppNotification) => {
    if (item.actionPayload) {
      shareDebtorNotice(item.actionPayload, store);
    }
  };

  const handleClearAllConfirm = () => {
    if (notifications.length === 0) return;
    Alert.alert(
      'Clear Notifications',
      'Are you sure you want to dismiss all current notifications? You can restore them anytime.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: clearAll },
      ]
    );
  };

  const getPriorityTheme = (priority: NotificationPriority) => {
    switch (priority) {
      case 'urgent':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          badgeBg: 'bg-red-100',
          badgeText: 'text-red-700',
          iconColor: colors.error,
          iconBg: 'bg-red-100',
          accent: 'bg-error',
        };
      case 'warning':
        return {
          bg: 'bg-amber-50/60',
          border: 'border-amber-200',
          badgeBg: 'bg-amber-100',
          badgeText: 'text-amber-800',
          iconColor: '#b45309',
          iconBg: 'bg-amber-100',
          accent: 'bg-amber-500',
        };
      case 'success':
        return {
          bg: 'bg-emerald-50/60',
          border: 'border-emerald-200',
          badgeBg: 'bg-emerald-100',
          badgeText: 'text-emerald-800',
          iconColor: '#059669',
          iconBg: 'bg-emerald-100',
          accent: 'bg-emerald-500',
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-50/50',
          border: 'border-blue-200',
          badgeBg: 'bg-blue-100',
          badgeText: 'text-blue-800',
          iconColor: colors.primary,
          iconBg: 'bg-blue-100',
          accent: 'bg-primary',
        };
    }
  };

  return (
    <View className="flex-1 bg-surface">
      <AppHeader
        title="Notifications"
        subtitle="Alerts, Stock & Reminders"
        showBack
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing || isLoading} onRefresh={onRefresh} />}
        contentContainerStyle={{
          paddingHorizontal: horizontalPadding,
          paddingTop: isWide ? 20 : 14,
          paddingBottom: 90,
        }}
      >
        <View className="w-full max-w-4xl mx-auto">
          {/* Top Overview & Actions Bar */}
          <View className="bg-white rounded-2xl p-4 border border-cardBorder shadow-sm mb-4">
            <View className="flex-row items-center justify-between flex-wrap gap-2">
              <View className="flex-row items-center gap-2.5">
                <View className="w-10 h-10 rounded-xl bg-secondaryContainer/50 items-center justify-center">
                  <AppIcon name="notifications" size={22} color={colors.primary} />
                </View>
                <View>
                  <Text className="text-base font-bold text-onSurface">
                    {unreadCount > 0
                      ? `${unreadCount} Unread Alert${unreadCount > 1 ? 's' : ''}`
                      : 'All Notifications Caught Up'}
                  </Text>
                  <Text className="text-xs text-onSurfaceVariant">
                    Live triggers from {store.businessName || 'Store Depot'}
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View className="flex-row items-center gap-2">
                {unreadCount > 0 && (
                  <Pressable
                    onPress={markAllAsRead}
                    accessibilityRole="button"
                    accessibilityLabel="Mark all as read"
                    className="flex-row items-center gap-1.5 px-3 py-2 rounded-xl bg-secondaryContainer/70 active:opacity-75"
                  >
                    <AppIcon name="check_circle" size={16} color={colors.primary} />
                    <Text className="text-xs font-semibold text-primary">Mark All Read</Text>
                  </Pressable>
                )}

                {notifications.length > 0 ? (
                  <Pressable
                    onPress={handleClearAllConfirm}
                    accessibilityRole="button"
                    accessibilityLabel="Clear all notifications"
                    className="flex-row items-center gap-1 px-2.5 py-2 rounded-xl bg-surfaceContainer active:opacity-75"
                  >
                    <AppIcon name="close" size={16} color={colors.onSurfaceVariant} />
                    <Text className="text-xs font-medium text-onSurfaceVariant">Clear</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={restoreAll}
                    accessibilityRole="button"
                    accessibilityLabel="Restore cleared notifications"
                    className="flex-row items-center gap-1.5 px-3 py-2 rounded-xl bg-surfaceContainer active:opacity-75"
                  >
                    <AppIcon name="refresh" size={16} color={colors.primary} />
                    <Text className="text-xs font-semibold text-primary">Restore Alerts</Text>
                  </Pressable>
                )}
              </View>
            </View>
          </View>

          {/* Filter Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
            contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
          >
            <Pressable
              onPress={() => setActiveFilter('all')}
              className={`flex-row items-center gap-1.5 px-3.5 py-2 rounded-full border ${
                activeFilter === 'all'
                  ? 'bg-onSurface border-onSurface'
                  : 'bg-white border-cardBorder'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  activeFilter === 'all' ? 'text-white' : 'text-onSurface'
                }`}
              >
                All
              </Text>
              <View
                className={`px-1.5 py-0.2 rounded-full ${
                  activeFilter === 'all' ? 'bg-white/20' : 'bg-surfaceContainer'
                }`}
              >
                <Text
                  className={`text-[11px] font-bold ${
                    activeFilter === 'all' ? 'text-white' : 'text-onSurfaceVariant'
                  }`}
                >
                  {counts.all}
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => setActiveFilter('unread')}
              className={`flex-row items-center gap-1.5 px-3.5 py-2 rounded-full border ${
                activeFilter === 'unread'
                  ? 'bg-error border-error'
                  : 'bg-white border-cardBorder'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  activeFilter === 'unread' ? 'text-white' : 'text-onSurface'
                }`}
              >
                Unread
              </Text>
              {counts.unread > 0 && (
                <View
                  className={`px-1.5 py-0.2 rounded-full ${
                    activeFilter === 'unread' ? 'bg-white/30' : 'bg-errorContainer'
                  }`}
                >
                  <Text
                    className={`text-[11px] font-bold ${
                      activeFilter === 'unread' ? 'text-white' : 'text-error'
                    }`}
                  >
                    {counts.unread}
                  </Text>
                </View>
              )}
            </Pressable>

            <Pressable
              onPress={() => setActiveFilter('inventory')}
              className={`flex-row items-center gap-1.5 px-3.5 py-2 rounded-full border ${
                activeFilter === 'inventory'
                  ? 'bg-onSurface border-onSurface'
                  : 'bg-white border-cardBorder'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  activeFilter === 'inventory' ? 'text-white' : 'text-onSurface'
                }`}
              >
                Stock Alerts
              </Text>
              <View
                className={`px-1.5 py-0.2 rounded-full ${
                  activeFilter === 'inventory' ? 'bg-white/20' : 'bg-surfaceContainer'
                }`}
              >
                <Text
                  className={`text-[11px] font-bold ${
                    activeFilter === 'inventory' ? 'text-white' : 'text-onSurfaceVariant'
                  }`}
                >
                  {counts.inventory}
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => setActiveFilter('debt')}
              className={`flex-row items-center gap-1.5 px-3.5 py-2 rounded-full border ${
                activeFilter === 'debt'
                  ? 'bg-onSurface border-onSurface'
                  : 'bg-white border-cardBorder'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  activeFilter === 'debt' ? 'text-white' : 'text-onSurface'
                }`}
              >
                Debts & Recovery
              </Text>
              <View
                className={`px-1.5 py-0.2 rounded-full ${
                  activeFilter === 'debt' ? 'bg-white/20' : 'bg-surfaceContainer'
                }`}
              >
                <Text
                  className={`text-[11px] font-bold ${
                    activeFilter === 'debt' ? 'text-white' : 'text-onSurfaceVariant'
                  }`}
                >
                  {counts.debt}
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => setActiveFilter('system')}
              className={`flex-row items-center gap-1.5 px-3.5 py-2 rounded-full border ${
                activeFilter === 'system'
                  ? 'bg-onSurface border-onSurface'
                  : 'bg-white border-cardBorder'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  activeFilter === 'system' ? 'text-white' : 'text-onSurface'
                }`}
              >
                Sales & System
              </Text>
              <View
                className={`px-1.5 py-0.2 rounded-full ${
                  activeFilter === 'system' ? 'bg-white/20' : 'bg-surfaceContainer'
                }`}
              >
                <Text
                  className={`text-[11px] font-bold ${
                    activeFilter === 'system' ? 'text-white' : 'text-onSurfaceVariant'
                  }`}
                >
                  {counts.system}
                </Text>
              </View>
            </Pressable>
          </ScrollView>

          {/* Notifications List */}
          {filteredNotifications.length > 0 ? (
            <View className="gap-3">
              {filteredNotifications.map((item) => {
                const theme = getPriorityTheme(item.priority);
                return (
                  <View
                    key={item.id}
                    className={`bg-white rounded-2xl border ${
                      item.isRead ? 'border-cardBorder opacity-95' : `${theme.border} shadow-sm`
                    } overflow-hidden`}
                  >
                    {/* Top status bar inside card */}
                    <View className="flex-row items-center justify-between gap-2 px-4 pt-3.5 pb-1">
                      <View className="flex-row items-center gap-2 shrink min-w-0">
                        {/* Priority Pill */}
                        <View className={`px-2 py-0.5 rounded-md shrink-0 ${theme.badgeBg}`}>
                          <Text className={`text-[10px] font-bold uppercase tracking-wider ${theme.badgeText}`}>
                            {item.priority}
                          </Text>
                        </View>

                        {/* Category Label */}
                        <Text numberOfLines={1} className="text-[11px] font-medium text-onSurfaceVariant capitalize shrink truncate">
                          {item.type === 'inventory'
                            ? 'Inventory Control'
                            : item.type === 'debt'
                            ? 'Credit & Receivables'
                            : item.type === 'sales'
                            ? 'Sales Ledger'
                            : 'System Notice'}
                        </Text>
                      </View>

                      {/* Header controls: timestamp, unread dot, dismiss */}
                      <View className="flex-row items-center gap-1.5 shrink-0">
                        <Text className="text-[11px] text-outline">{item.timestamp}</Text>
                        {!item.isRead && (
                          <View className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
                        )}
                        <Pressable
                          onPress={() => dismiss(item.id)}
                          accessibilityRole="button"
                          accessibilityLabel="Dismiss notification"
                          className="w-7 h-7 rounded-full items-center justify-center active:bg-surfaceContainer ml-0.5"
                        >
                          <AppIcon name="close" size={14} color={colors.outline} />
                        </Pressable>
                      </View>
                    </View>

                    {/* Content Body */}
                    <View className="px-4 py-2.5 flex-row items-start gap-3">
                      <View className={`w-10 h-10 rounded-xl ${theme.iconBg} items-center justify-center mt-0.5`}>
                        <AppIcon name={item.iconName} size={20} color={theme.iconColor} />
                      </View>
                      <View className="flex-1 min-w-0">
                        <Text className="text-sm font-bold text-onSurface mb-1">
                          {item.title}
                        </Text>
                        <Text className="text-xs text-onSurfaceVariant leading-relaxed">
                          {item.message}
                        </Text>
                      </View>
                    </View>

                    {/* Bottom Actions Row */}
                    <View className="px-4 pb-3 pt-1 flex-row items-center justify-between border-t border-cardBorder/60 bg-surface/40 mt-1">
                      <View className="flex-row items-center gap-2">
                        {item.actionText && (
                          <Pressable
                            onPress={() => handleActionPress(item)}
                            className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary active:opacity-85 shadow-2xs"
                          >
                            {item.actionType === 'whatsapp' ? (
                              <AppIcon name="chat" size={14} color="#ffffff" />
                            ) : (
                              <AppIcon name="arrow_forward" size={14} color="#ffffff" />
                            )}
                            <Text className="text-xs font-semibold text-white">
                              {item.actionText}
                            </Text>
                          </Pressable>
                        )}

                        {item.actionType === 'whatsapp' && (
                          <Pressable
                            onPress={() => handleShareDebtNotice(item)}
                            className="flex-row items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surfaceContainer active:opacity-75"
                          >
                            <AppIcon name="share" size={14} color={colors.onSurfaceVariant} />
                            <Text className="text-xs font-medium text-onSurfaceVariant">Share Slip</Text>
                          </Pressable>
                        )}
                      </View>

                      {/* Mark read toggle */}
                      {!item.isRead ? (
                        <Pressable
                          onPress={() => markAsRead(item.id)}
                          className="px-2 py-1 active:opacity-70"
                        >
                          <Text className="text-xs font-medium text-primary">Mark as read</Text>
                        </Pressable>
                      ) : (
                        <View className="flex-row items-center gap-1">
                          <AppIcon name="check" size={14} color={colors.outline} />
                          <Text className="text-[11px] text-outline">Read</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            /* Empty State */
            <View className="bg-white rounded-2xl p-8 border border-cardBorder shadow-sm items-center justify-center text-center mt-2">
              <View className="w-16 h-16 rounded-full bg-secondaryContainer/50 items-center justify-center mb-3">
                <AppIcon name="check_circle" size={32} color={colors.secondary} />
              </View>
              <Text className="text-base font-bold text-onSurface mb-1">
                {activeFilter === 'unread' ? 'No Unread Notifications' : 'All Caught Up!'}
              </Text>
              <Text className="text-xs text-onSurfaceVariant text-center max-w-sm mb-4 leading-relaxed">
                {activeFilter === 'unread'
                  ? 'All pending alerts have been read. Switch to "All" to inspect your notification history.'
                  : 'No active alerts in this category. Your stock inventory thresholds and customer credit accounts are running smoothly.'}
              </Text>
              <Pressable
                onPress={restoreAll}
                className="flex-row items-center gap-1.5 px-4 py-2 rounded-xl bg-secondaryContainer/80 active:opacity-75"
              >
                <AppIcon name="refresh" size={16} color={colors.primary} />
                <Text className="text-xs font-bold text-primary">Refresh & Restore All Alerts</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
