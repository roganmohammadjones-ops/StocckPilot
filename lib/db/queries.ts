import type { AppDatabase } from './web-db';
import type {
  Product,
  Customer,
  SaleInput,
  SaleRecord,
  ExpenseRecord,
  DashboardMetrics,
  FinancialReportData,
  ShiftRecord,
} from './types';

export type SQLiteDatabase = AppDatabase;

// ==========================================
// PRODUCTS QUERIES
// ==========================================

export async function getProducts(
  db: SQLiteDatabase,
  search: string = '',
  categorySlug: string = 'all'
): Promise<Product[]> {
  let query = 'SELECT * FROM products WHERE 1=1';
  const params: (string | number)[] = [];

  if (categorySlug && categorySlug !== 'all') {
    query += ' AND category_slug = ?';
    params.push(categorySlug);
  }

  if (search.trim()) {
    query += ' AND (name LIKE ? OR sku LIKE ? OR category LIKE ?)';
    const term = `%${search.trim()}%`;
    params.push(term, term, term);
  }

  query += ' ORDER BY created_at DESC';

  interface ProductRow {
    id: string;
    name: string;
    sku: string;
    category: string;
    category_slug: string;
    stock_left: number;
    stock_unit: string;
    min_alert: number;
    cost_price: number;
    selling_price: number;
    wholesale_price: number | null;
    distributor_price: number | null;
    recent_note: string | null;
    created_at: string;
  }

  const rows = await db.getAllAsync<ProductRow>(query, params);

  return rows.map((r) => {
    let status: 'low' | 'healthy' | 'out' = 'healthy';
    if (r.stock_left <= 0) {
      status = 'out';
    } else if (r.stock_left <= r.min_alert) {
      status = 'low';
    }

    return {
      id: r.id,
      name: r.name,
      sku: r.sku,
      category: r.category,
      categorySlug: r.category_slug,
      stockLeft: r.stock_left,
      stockUnit: r.stock_unit,
      minAlert: r.min_alert,
      costPrice: r.cost_price,
      sellingPrice: r.selling_price,
      wholesalePrice: r.wholesale_price ?? undefined,
      distributorPrice: r.distributor_price ?? undefined,
      recentNote: r.recent_note ?? undefined,
      status,
      createdAt: r.created_at,
    };
  });
}

export async function addProduct(
  db: SQLiteDatabase,
  product: {
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
    distributorPrice?: number;
    recentNote?: string;
  }
): Promise<string> {
  const id = `prod_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  await db.runAsync(
    `INSERT INTO products (id, name, sku, category, category_slug, stock_left, stock_unit, min_alert, cost_price, selling_price, wholesale_price, distributor_price, recent_note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      product.name,
      product.sku,
      product.category,
      product.categorySlug,
      product.stockLeft,
      product.stockUnit,
      product.minAlert,
      product.costPrice,
      product.sellingPrice,
      product.wholesalePrice ?? null,
      product.distributorPrice ?? null,
      product.recentNote ?? null,
    ]
  );

  return id;
}

export async function updateProductStock(
  db: SQLiteDatabase,
  productId: string,
  stockDelta: number
): Promise<void> {
  await db.runAsync(
    `UPDATE products SET stock_left = MAX(0, stock_left + ?) WHERE id = ?`,
    [stockDelta, productId]
  );
}

export async function upsertProduct(
  db: SQLiteDatabase,
  product: {
    id: string;
    name: string;
    sku: string;
    category: string;
    categorySlug: string;
    stockLeft: number;
    stockUnit: string;
    minAlert?: number;
    costPrice: number;
    sellingPrice: number;
    wholesalePrice?: number;
    distributorPrice?: number;
    recentNote?: string;
  }
): Promise<void> {
  await db.runAsync(
    `INSERT INTO products (id, name, sku, category, category_slug, stock_left, stock_unit, min_alert, cost_price, selling_price, wholesale_price, distributor_price, recent_note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       sku = excluded.sku,
       category = excluded.category,
       category_slug = excluded.category_slug,
       stock_left = excluded.stock_left,
       stock_unit = excluded.stock_unit,
       min_alert = excluded.min_alert,
       cost_price = excluded.cost_price,
       selling_price = excluded.selling_price,
       wholesale_price = excluded.wholesale_price,
       distributor_price = excluded.distributor_price,
       recent_note = excluded.recent_note`,
    [
      product.id,
      product.name,
      product.sku,
      product.category,
      product.categorySlug,
      product.stockLeft,
      product.stockUnit,
      product.minAlert ?? 10,
      product.costPrice,
      product.sellingPrice,
      product.wholesalePrice ?? null,
      product.distributorPrice ?? null,
      product.recentNote ?? null,
    ]
  );
}

// ==========================================
// CUSTOMERS & DEBTORS QUERIES
// ==========================================

export async function getCustomers(
  db: SQLiteDatabase,
  search: string = '',
  filter: string = 'all'
): Promise<Customer[]> {
  let query = 'SELECT * FROM customers WHERE 1=1';
  const params: (string | number)[] = [];

  if (filter === 'overdue') {
    query += " AND balance > 0 AND due_text LIKE '%Overdue%'";
  } else if (filter === 'due_soon') {
    query += " AND balance > 0 AND due_text NOT LIKE '%Overdue%'";
  } else if (filter === 'settled') {
    query += ' AND balance = 0';
  }

  if (search.trim()) {
    query += ' AND (name LIKE ? OR phone LIKE ? OR location LIKE ?)';
    const term = `%${search.trim()}%`;
    params.push(term, term, term);
  }

  query += ' ORDER BY balance DESC, created_at DESC';

  interface CustomerRow {
    id: string;
    name: string;
    phone: string | null;
    location: string | null;
    tier: string;
    is_verified: number;
    credit_limit: number;
    balance: number;
    due_text: string | null;
    last_credit: string | null;
    last_payment: string | null;
    lifetime_volume: string | null;
    created_at: string;
  }

  const rows = await db.getAllAsync<CustomerRow>(query, params);

  return rows.map((r) => {
    let debtStatus: 'overdue' | 'due_soon' | 'settled' = 'settled';
    if (r.balance > 0) {
      debtStatus = (r.due_text ?? '').toLowerCase().includes('overdue')
        ? 'overdue'
        : 'due_soon';
    }

    return {
      id: r.id,
      name: r.name,
      phone: r.phone ?? '',
      location: r.location ?? 'Lagos, Nigeria',
      tier: r.tier || 'Silver Tier',
      isVerified: Boolean(r.is_verified),
      creditLimit: r.credit_limit,
      balance: r.balance,
      debtStatus,
      dueText: r.due_text ?? (r.balance > 0 ? 'Due soon' : 'Settled • All Cleared'),
      lastCredit: r.last_credit ?? undefined,
      lastPayment: r.last_payment ?? undefined,
      lifetimeVolume: r.lifetime_volume ?? `₦${r.balance.toLocaleString()}`,
      createdAt: r.created_at,
    };
  });
}

export async function addCustomer(
  db: SQLiteDatabase,
  customer: {
    name: string;
    phone: string;
    location: string;
    creditLimit?: number;
    balance?: number;
  }
): Promise<string> {
  const id = `cust_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  await db.runAsync(
    `INSERT INTO customers (id, name, phone, location, tier, is_verified, credit_limit, balance, due_text)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      customer.name,
      customer.phone,
      customer.location,
      'Silver Tier',
      1,
      customer.creditLimit ?? 500000,
      customer.balance ?? 0,
      customer.balance && customer.balance > 0 ? '14 Days Terms' : 'Settled • All Cleared',
    ]
  );

  return id;
}

export async function upsertCustomer(
  db: SQLiteDatabase,
  customer: {
    id: string;
    name: string;
    phone?: string;
    location?: string;
    tier?: string;
    isVerified?: boolean;
    creditLimit?: number;
    balance?: number;
    dueText?: string;
  }
): Promise<void> {
  await db.runAsync(
    `INSERT INTO customers (id, name, phone, location, tier, is_verified, credit_limit, balance, due_text)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       phone = excluded.phone,
       location = excluded.location,
       tier = excluded.tier,
       is_verified = excluded.is_verified,
       credit_limit = excluded.credit_limit,
       balance = excluded.balance,
       due_text = excluded.due_text`,
    [
      customer.id,
      customer.name,
      customer.phone ?? null,
      customer.location ?? null,
      customer.tier ?? 'Silver Tier',
      customer.isVerified ? 1 : 0,
      customer.creditLimit ?? 500000,
      customer.balance ?? 0,
      customer.dueText ?? 'Settled • All Cleared',
    ]
  );
}

export async function recordDebtPayment(
  db: SQLiteDatabase,
  customerId: string,
  amount: number,
  paymentMethod: string = 'cash',
  notes: string = ''
): Promise<void> {
  const paymentId = `pmt_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  await db.withTransactionAsync(async () => {
    // 1. Record payment history
    await db.runAsync(
      `INSERT INTO debt_payments (id, customer_id, amount_paid, payment_method, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [paymentId, customerId, amount, paymentMethod, notes]
    );

    // 2. Reduce customer balance
    await db.runAsync(
      `UPDATE customers
       SET balance = MAX(0, balance - ?),
           last_payment = ?
       WHERE id = ?`,
      [
        amount,
        `₦${amount.toLocaleString()} on ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`,
        customerId,
      ]
    );

    // 3. If balance reaches 0, update due text
    await db.runAsync(
      `UPDATE customers
       SET due_text = 'Settled • All Cleared'
       WHERE id = ? AND balance <= 0`,
      [customerId]
    );
  });
}

// ==========================================
// SALES & CHECKOUT QUERIES
// ==========================================

export async function getSales(
  db: SQLiteDatabase,
  limit: number = 50,
  customerId?: string
): Promise<SaleRecord[]> {
  interface SaleRow {
    id: string;
    invoice_no: string;
    customer_id: string | null;
    customer_name: string | null;
    total_amount: number;
    discount_amount: number;
    net_payable: number;
    payment_channel: 'cash' | 'transfer' | 'pos' | 'credit';
    amount_tendered: number | null;
    change_returned: number | null;
    created_at: string;
    item_count: number;
    items_summary: string | null;
  }

  const query = customerId
    ? `
    SELECT
      s.*,
      COUNT(si.id) as item_count,
      GROUP_CONCAT(si.product_name || ' x' || si.quantity, ', ') as items_summary
    FROM sales s
    LEFT JOIN sale_items si ON s.id = si.sale_id
    WHERE s.customer_id = ?
    GROUP BY s.id
    ORDER BY s.created_at DESC
    LIMIT ?
  `
    : `
    SELECT
      s.*,
      COUNT(si.id) as item_count,
      GROUP_CONCAT(si.product_name || ' x' || si.quantity, ', ') as items_summary
    FROM sales s
    LEFT JOIN sale_items si ON s.id = si.sale_id
    GROUP BY s.id
    ORDER BY s.created_at DESC
    LIMIT ?
  `;

  const rows = customerId
    ? await db.getAllAsync<SaleRow>(query, [customerId, limit])
    : await db.getAllAsync<SaleRow>(query, [limit]);

  return rows.map((r) => ({
    id: r.id,
    invoiceNo: r.invoice_no,
    customerId: r.customer_id ?? undefined,
    customerName: r.customer_name ?? 'Walk-in Cash Customer',
    totalAmount: r.total_amount,
    discountAmount: r.discount_amount,
    netPayable: r.net_payable,
    paymentChannel: r.payment_channel,
    amountTendered: r.amount_tendered ?? undefined,
    changeReturned: r.change_returned ?? undefined,
    createdAt: r.created_at,
    itemCount: r.item_count,
    itemsSummary: r.items_summary ?? undefined,
  }));
}

export interface SaleItemRecord {
  id: string;
  saleId: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  priceTier?: 'retail' | 'wholesale' | 'distributor';
}

export async function getSaleItems(
  db: SQLiteDatabase,
  saleId: string
): Promise<SaleItemRecord[]> {
  interface ItemRow {
    id: string;
    sale_id: string;
    product_id: string;
    product_name: string;
    sku: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    price_tier?: 'retail' | 'wholesale' | 'distributor' | null;
  }
  const query = `
    SELECT * FROM sale_items
    WHERE sale_id = ?
    ORDER BY id ASC
  `;
  const rows = await db.getAllAsync<ItemRow>(query, [saleId]);
  return rows.map((r) => ({
    id: r.id,
    saleId: r.sale_id,
    productId: r.product_id,
    productName: r.product_name,
    sku: r.sku,
    quantity: r.quantity,
    unitPrice: r.unit_price,
    totalPrice: r.total_price,
    priceTier: (r.price_tier as any) || 'retail',
  }));
}

export async function createSale(
  db: SQLiteDatabase,
  input: SaleInput
): Promise<string> {
  const saleId = `sale_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  await db.withTransactionAsync(async () => {
    // 1. Insert Sales Header
    await db.runAsync(
      `INSERT INTO sales (id, invoice_no, customer_id, customer_name, total_amount, discount_amount, net_payable, payment_channel, amount_tendered, change_returned)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        saleId,
        input.invoiceNo,
        input.customerId ?? null,
        input.customerName ?? 'Walk-in Customer',
        input.totalAmount,
        input.discountAmount,
        input.netPayable,
        input.paymentChannel,
        input.amountTendered ?? null,
        input.changeReturned ?? null,
      ]
    );

    // 2. Insert Line Items and deduct inventory stock
    for (const item of input.items) {
      const itemId = `item_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      const totalPrice = item.quantity * item.unitPrice;

      await db.runAsync(
        `INSERT INTO sale_items (id, sale_id, product_id, product_name, sku, quantity, unit_price, total_price, price_tier)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          itemId,
          saleId,
          item.productId,
          item.productName,
          item.sku,
          item.quantity,
          item.unitPrice,
          totalPrice,
          item.priceTier ?? 'retail',
        ]
      );

      // Decrement stock
      await db.runAsync(
        `UPDATE products SET stock_left = MAX(0, stock_left - ?) WHERE id = ?`,
        [item.quantity, item.productId]
      );
    }

    // 3. If credit sale, update customer debt balance
    if (input.paymentChannel === 'credit' && input.customerId) {
      await db.runAsync(
        `UPDATE customers
         SET balance = balance + ?,
             due_text = '14 Days Terms',
             last_credit = ?
         WHERE id = ?`,
        [
          input.netPayable,
          `${input.items.length} SKUs (#${input.invoiceNo})`,
          input.customerId,
        ]
      );
    }
  });

  return saleId;
}

// ==========================================
// EXPENSES QUERIES
// ==========================================

export async function getExpenses(
  db: SQLiteDatabase,
  limit: number = 50
): Promise<ExpenseRecord[]> {
  interface ExpenseRow {
    id: string;
    category: string;
    amount: number;
    recipient: string | null;
    notes: string | null;
    payment_method: string;
    created_at: string;
  }

  const rows = await db.getAllAsync<ExpenseRow>(
    'SELECT * FROM expenses ORDER BY created_at DESC LIMIT ?',
    [limit]
  );

  return rows.map((r) => ({
    id: r.id,
    category: r.category,
    amount: r.amount,
    recipient: r.recipient ?? undefined,
    notes: r.notes ?? undefined,
    paymentMethod: r.payment_method,
    createdAt: r.created_at,
  }));
}

export async function addExpense(
  db: SQLiteDatabase,
  expense: {
    category: string;
    amount: number;
    recipient?: string;
    notes?: string;
    paymentMethod?: string;
  }
): Promise<string> {
  const id = `exp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  await db.runAsync(
    `INSERT INTO expenses (id, category, amount, recipient, notes, payment_method)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      id,
      expense.category,
      expense.amount,
      expense.recipient ?? null,
      expense.notes ?? null,
      expense.paymentMethod ?? 'cash',
    ]
  );

  return id;
}

// ==========================================
// DASHBOARD AGGREGATE METRICS
// ==========================================

export async function getDashboardMetrics(
  db: SQLiteDatabase
): Promise<DashboardMetrics> {
  interface SalesSummary {
    totalSales: number | null;
    salesCount: number | null;
    cash: number | null;
    transfer: number | null;
    pos: number | null;
    credit: number | null;
  }

  const salesSummary = await db.getFirstAsync<SalesSummary>(`
    SELECT
      SUM(net_payable) as totalSales,
      COUNT(*) as salesCount,
      SUM(CASE WHEN payment_channel = 'cash' THEN net_payable ELSE 0 END) as cash,
      SUM(CASE WHEN payment_channel = 'transfer' THEN net_payable ELSE 0 END) as transfer,
      SUM(CASE WHEN payment_channel = 'pos' THEN net_payable ELSE 0 END) as pos,
      SUM(CASE WHEN payment_channel = 'credit' THEN net_payable ELSE 0 END) as credit
    FROM sales
  `);

  interface CustomerSummary {
    totalCustomers: number | null;
    owingCustomers: number | null;
    overdueCount: number | null;
    totalBalance: number | null;
  }

  const customerSummary = await db.getFirstAsync<CustomerSummary>(`
    SELECT
      COUNT(*) as totalCustomers,
      COUNT(CASE WHEN balance > 0 THEN 1 END) as owingCustomers,
      COUNT(CASE WHEN balance > 0 AND due_text LIKE '%Overdue%' THEN 1 END) as overdueCount,
      SUM(balance) as totalBalance
    FROM customers
  `);

  interface StockSummary {
    totalProducts: number;
    lowStock: number;
    totalValuation: number | null;
  }

  const stockSummary = await db.getFirstAsync<StockSummary>(`
    SELECT
      COUNT(*) as totalProducts,
      COUNT(CASE WHEN stock_left <= min_alert THEN 1 END) as lowStock,
      SUM(stock_left * selling_price) as totalValuation
    FROM products
  `);

  return {
    todaySales: salesSummary?.totalSales ?? 0,
    salesGrowthPct: (salesSummary?.totalSales ?? 0) > 0 ? 14.8 : 0,
    salesCount: salesSummary?.salesCount ?? 0,
    cashCollected: salesSummary?.cash ?? 0,
    transferCollected: salesSummary?.transfer ?? 0,
    posCollected: salesSummary?.pos ?? 0,
    creditOutstanding: customerSummary?.totalBalance ?? 0,
    overdueDebtorsCount: customerSummary?.overdueCount ?? 0,
    owingCustomersCount: customerSummary?.owingCustomers ?? 0,
    totalCustomersCount: customerSummary?.totalCustomers ?? 0,
    lowStockCount: stockSummary?.lowStock ?? 0,
    totalProductsCount: stockSummary?.totalProducts ?? 0,
    totalStockValuation: stockSummary?.totalValuation ?? 0,
  };
}

// ==========================================
// FINANCIAL REPORT & P&L QUERIES
// ==========================================

export async function getFinancialReportData(
  db: SQLiteDatabase
): Promise<FinancialReportData> {
  interface SalesSummaryRow {
    grossSales: number | null;
    salesCount: number | null;
  }

  const salesSummary = await db.getFirstAsync<SalesSummaryRow>(`
    SELECT
      SUM(net_payable) as grossSales,
      COUNT(*) as salesCount
    FROM sales
  `);

  interface CostSummaryRow {
    totalCost: number | null;
    totalRevenue: number | null;
  }

  const costSummary = await db.getFirstAsync<CostSummaryRow>(`
    SELECT
      SUM(si.quantity * COALESCE(p.cost_price, si.unit_price * 0.85)) as totalCost,
      SUM(si.total_price) as totalRevenue
    FROM sale_items si
    LEFT JOIN products p ON si.product_id = p.id
  `);

  interface ExpenseSummaryRow {
    totalExpenses: number | null;
  }

  const expenseSummary = await db.getFirstAsync<ExpenseSummaryRow>(`
    SELECT SUM(amount) as totalExpenses FROM expenses
  `);

  interface ReceivablesSummaryRow {
    overdue: number | null;
    dueSoon: number | null;
    current: number | null;
    total: number | null;
  }

  const receivablesSummary = await db.getFirstAsync<ReceivablesSummaryRow>(`
    SELECT
      SUM(CASE WHEN balance > 0 AND due_text LIKE '%Overdue%' THEN balance ELSE 0 END) as overdue,
      SUM(CASE WHEN balance > 0 AND due_text LIKE '%due in%' THEN balance ELSE 0 END) as dueSoon,
      SUM(CASE WHEN balance > 0 AND due_text NOT LIKE '%Overdue%' AND due_text NOT LIKE '%due in%' THEN balance ELSE 0 END) as current,
      SUM(balance) as total
    FROM customers
  `);

  interface TopProductRow {
    productName: string;
    totalQuantity: number;
    totalRevenue: number;
  }

  const topProducts = await db.getAllAsync<TopProductRow>(`
    SELECT
      product_name as productName,
      SUM(quantity) as totalQuantity,
      SUM(total_price) as totalRevenue
    FROM sale_items
    GROUP BY product_name
    ORDER BY totalRevenue DESC
    LIMIT 5
  `);

  interface ExpenseCategoryRow {
    category: string;
    totalAmount: number;
  }

  const expenseCategories = await db.getAllAsync<ExpenseCategoryRow>(`
    SELECT
      category,
      SUM(amount) as totalAmount
    FROM expenses
    GROUP BY category
    ORDER BY totalAmount DESC
    LIMIT 5
  `);

  const grossSales = salesSummary?.grossSales ?? 0;
  const totalCost = costSummary?.totalCost ?? 0;
  const grossProfit = Math.max(0, grossSales - totalCost);
  const grossMarginPct = grossSales > 0 ? Number(((grossProfit / grossSales) * 100).toFixed(1)) : 0;
  const totalExpenses = expenseSummary?.totalExpenses ?? 0;
  const netTakeHome = grossProfit - totalExpenses;

  return {
    grossSales,
    totalCost,
    grossProfit,
    grossMarginPct,
    totalExpenses,
    netTakeHome,
    salesCount: salesSummary?.salesCount ?? 0,
    currentReceivables: receivablesSummary?.current ?? 0,
    dueSoonReceivables: receivablesSummary?.dueSoon ?? 0,
    overdueReceivables: receivablesSummary?.overdue ?? 0,
    totalReceivables: receivablesSummary?.total ?? 0,
    topSellingProducts: topProducts.map((p) => ({
      productName: p.productName,
      totalQuantity: p.totalQuantity,
      totalRevenue: p.totalRevenue,
    })),
    expensesByCategory: expenseCategories.map((e) => ({
      category: e.category,
      totalAmount: e.totalAmount,
    })),
  };
}

// ==========================================
// SHIFT & CASH DRAWER RECONCILIATION QUERIES
// ==========================================

export async function getCurrentShift(
  db: SQLiteDatabase
): Promise<ShiftRecord> {
  interface ShiftRow {
    id: string;
    cashier_name: string;
    opened_at: string;
    closed_at: string | null;
    expected_cash: number;
    counted_cash: number | null;
    discrepancy: number | null;
    notes: string | null;
    status: 'open' | 'closed';
  }

  const row = await db.getFirstAsync<ShiftRow>(
    `SELECT * FROM shifts WHERE status = 'open' ORDER BY opened_at DESC LIMIT 1`
  );

  if (row) {
    // Dynamically calculate expected cash from cash sales minus cash expenses
    const cashSales = await db.getFirstAsync<{ total: number | null }>(
      `SELECT SUM(net_payable) as total FROM sales WHERE payment_channel = 'cash'`
    );
    const cashExpenses = await db.getFirstAsync<{ total: number | null }>(
      `SELECT SUM(amount) as total FROM expenses WHERE payment_method = 'cash'`
    );

    const netCashInDrawer = (cashSales?.total ?? 0) - (cashExpenses?.total ?? 0);

    return {
      id: row.id,
      cashierName: row.cashier_name,
      openedAt: row.opened_at,
      closedAt: row.closed_at ?? undefined,
      expectedCash: Math.max(0, netCashInDrawer),
      countedCash: row.counted_cash ?? undefined,
      discrepancy: row.discrepancy ?? undefined,
      notes: row.notes ?? undefined,
      status: row.status,
    };
  }

  // Create default initial open shift if none exists
  const newId = `shift_${Date.now()}`;
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO shifts (id, cashier_name, opened_at, expected_cash, status)
     VALUES (?, ?, ?, ?, ?)`,
    [newId, 'Attendant Tunde', now, 0, 'open']
  );

  return {
    id: newId,
    cashierName: 'Attendant Tunde',
    openedAt: now,
    expectedCash: 0,
    status: 'open',
  };
}

export async function closeShift(
  db: SQLiteDatabase,
  shiftId: string,
  countedCash: number,
  expectedCash: number,
  notes: string = ''
): Promise<void> {
  const discrepancy = countedCash - expectedCash;
  const closedAt = new Date().toISOString();

  await db.runAsync(
    `UPDATE shifts
     SET closed_at = ?,
         expected_cash = ?,
         counted_cash = ?,
         discrepancy = ?,
         notes = ?,
         status = 'closed'
     WHERE id = ?`,
    [closedAt, expectedCash, countedCash, discrepancy, notes, shiftId]
  );
}

export async function openNewShift(
  db: SQLiteDatabase,
  cashierName: string = 'Attendant Tunde'
): Promise<ShiftRecord> {
  // 1. Close any lingering open shifts
  await db.runAsync(`UPDATE shifts SET status = 'closed' WHERE status = 'open'`);

  // 2. Open new shift
  const newId = `shift_${Date.now()}`;
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO shifts (id, cashier_name, opened_at, expected_cash, status)
     VALUES (?, ?, ?, ?, ?)`,
    [newId, cashierName, now, 0, 'open']
  );

  return {
    id: newId,
    cashierName,
    openedAt: now,
    expectedCash: 0,
    status: 'open',
  };
}

export async function clearAllDatabaseRecords(db: SQLiteDatabase): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.execAsync(`
      DELETE FROM sale_items;
      DELETE FROM sales;
      DELETE FROM products;
      DELETE FROM customers;
      DELETE FROM debt_payments;
      DELETE FROM expenses;
      DELETE FROM shifts;
    `);
  });
}

export async function seedStandardSampleCatalog(db: SQLiteDatabase): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT OR REPLACE INTO products (id, name, sku, category, category_slug, stock_left, stock_unit, min_alert, cost_price, selling_price, recent_note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['prod_1', 'Dangote Refined Sugar 50kg', 'DNG-SUG-50', 'Grains & Staples', 'grains', 25, 'bags', 10, 68000, 74500, 'Standard FMCG Bag']
    );
    await db.runAsync(
      `INSERT OR REPLACE INTO products (id, name, sku, category, category_slug, stock_left, stock_unit, min_alert, cost_price, selling_price, recent_note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['prod_2', 'Golden Penny Semovita 10kg', 'GP-SEMO-10K', 'Grains & Staples', 'grains', 15, 'packs', 8, 32000, 36000, 'Flour Mills Nig']
    );
    await db.runAsync(
      `INSERT OR REPLACE INTO products (id, name, sku, category, category_slug, stock_left, stock_unit, min_alert, cost_price, selling_price, recent_note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['prod_3', 'Peak Evaporated Milk 160g (Carton 48)', 'PEAK-CAN-48', 'Canned & Dairy', 'canned', 40, 'cartons', 15, 24500, 28500, 'FrieslandCampina']
    );
  });
}
