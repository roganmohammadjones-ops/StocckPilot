export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  categorySlug: string;
  stockLeft: number;
  stockUnit: string;
  minAlert: number;
  costPrice: number;
  sellingPrice: number;
  wholesalePrice?: number;
  recentNote?: string;
  status: 'low' | 'healthy' | 'out';
  createdAt?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  location: string;
  tier: string;
  isVerified: boolean;
  creditLimit: number;
  balance: number;
  debtStatus: 'overdue' | 'due_soon' | 'settled';
  dueText: string;
  lastCredit?: string;
  lastPayment?: string;
  lifetimeVolume?: string;
  createdAt?: string;
}

export interface SaleItemInput {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
}

export interface SaleInput {
  invoiceNo: string;
  customerId?: string;
  customerName?: string;
  totalAmount: number;
  discountAmount: number;
  netPayable: number;
  paymentChannel: 'cash' | 'transfer' | 'pos' | 'credit';
  amountTendered?: number;
  changeReturned?: number;
  items: SaleItemInput[];
}

export interface SaleRecord {
  id: string;
  invoiceNo: string;
  customerId?: string;
  customerName?: string;
  totalAmount: number;
  discountAmount: number;
  netPayable: number;
  paymentChannel: 'cash' | 'transfer' | 'pos' | 'credit';
  amountTendered?: number;
  changeReturned?: number;
  createdAt: string;
  itemCount: number;
  itemsSummary?: string;
}

export interface ExpenseRecord {
  id: string;
  category: string;
  amount: number;
  recipient?: string;
  notes?: string;
  paymentMethod: string;
  createdAt: string;
}

export interface DashboardMetrics {
  todaySales: number;
  salesGrowthPct: number;
  salesCount: number;
  cashCollected: number;
  transferCollected: number;
  posCollected: number;
  creditOutstanding: number;
  overdueDebtorsCount: number;
  owingCustomersCount: number;
  totalCustomersCount: number;
  lowStockCount: number;
  totalProductsCount: number;
  totalStockValuation: number;
}

export interface FinancialReportData {
  grossSales: number;
  totalCost: number;
  grossProfit: number;
  grossMarginPct: number;
  totalExpenses: number;
  netTakeHome: number;
  salesCount: number;
  currentReceivables: number;
  dueSoonReceivables: number;
  overdueReceivables: number;
  totalReceivables: number;
  topSellingProducts: {
    productName: string;
    totalQuantity: number;
    totalRevenue: number;
  }[];
  expensesByCategory: {
    category: string;
    totalAmount: number;
  }[];
}

export interface ShiftRecord {
  id: string;
  cashierName: string;
  openedAt: string;
  closedAt?: string;
  expectedCash: number;
  countedCash?: number;
  discrepancy?: number;
  notes?: string;
  status: 'open' | 'closed';
}



