import React from 'react';
import { ColorValue } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

// Map stitch material symbols to MaterialIcons names
const iconNameMap: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  dashboard: 'dashboard',
  inventory_2: 'inventory',
  inventory: 'inventory',
  point_of_sale: 'point-of-sale',
  group: 'group',
  people: 'people',
  more_horiz: 'more-horiz',
  payments: 'payments',
  query_stats: 'query-stats',
  receipt_long: 'receipt-long',
  receipt: 'receipt',
  warehouse: 'store',
  add_box: 'add-box',
  wallet: 'account-balance-wallet',
  account_balance_wallet: 'account-balance-wallet',
  person_add: 'person-add',
  verified: 'verified',
  notifications: 'notifications',
  location_on: 'location-on',
  arrow_drop_down: 'arrow-drop-down',
  search: 'search',
  barcode_scanner: 'qr-code-scanner',
  qr_code_scanner: 'qr-code-scanner',
  add: 'add',
  remove: 'remove',
  chat: 'chat',
  shopping_cart: 'shopping-cart',
  shopping_cart_checkout: 'shopping-cart-checkout',
  shopping_bag: 'shopping-bag',
  account_balance: 'account-balance',
  check_circle: 'check-circle',
  trending_up: 'trending-up',
  warning: 'warning',
  notification_important: 'notification-important',
  calendar_today: 'calendar-today',
  calendar_month: 'calendar-month',
  arrow_back: 'arrow-back',
  arrow_forward: 'arrow-forward',
  chevron_right: 'chevron-right',
  close: 'close',
  person: 'person',
  badge: 'badge',
  category: 'category',
  grain: 'grain',
  price_change: 'price-change',
  tune: 'tune',
  share: 'share',
  pause: 'pause',
  bolt: 'bolt',
  calculate: 'calculate',
  auto_fix_high: 'auto-fix-high',
  photo_camera: 'photo-camera',
  widgets: 'widgets',
  local_gas_station: 'local-gas-station',
  savings: 'savings',
  help_outline: 'help-outline',
  verified_user: 'verified-user',
  history: 'history',
  local_shipping: 'local-shipping',
  local_fire_department: 'local-fire-department',
  lock_clock: 'lock-clock',
  picture_as_pdf: 'picture-as-pdf',
  near_me: 'near-me',
  star: 'star',
  edit: 'edit',
  content_copy: 'content-copy',
  change_circle: 'change-circle',
};

interface IconProps {
  name: string;
  size?: number;
  color?: string | ColorValue;
}

export function AppIcon({ name, size = 22, color = '#131b2e' }: IconProps) {
  const glyphName = iconNameMap[name] || (name as keyof typeof MaterialIcons.glyphMap);
  return <MaterialIcons name={glyphName} size={size} color={color as string} />;
}

