export interface AppDatabase {
  getAllAsync<T = any>(sql: string, params?: any[]): Promise<T[]>;
  getFirstAsync<T = any>(sql: string, params?: any[]): Promise<T | null>;
  runAsync(sql: string, params?: any[]): Promise<{ changes: number; lastInsertRowId: number }>;
  execAsync(sql: string): Promise<void>;
  withTransactionAsync<T>(task: (txn: AppDatabase) => Promise<T>): Promise<T>;
}

interface ProductRecord {
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
  recent_note: string | null;
  created_at: string;
}

interface CustomerRecord {
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

interface SaleRecordRow {
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
}

interface SaleItemRecord {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface ExpenseRecordRow {
  id: string;
  category: string;
  amount: number;
  recipient: string | null;
  notes: string | null;
  payment_method: string;
  created_at: string;
}

interface DebtPaymentRecord {
  id: string;
  customer_id: string;
  amount_paid: number;
  payment_method: string;
  notes: string | null;
  created_at: string;
}

interface ShiftRecordRow {
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

interface WebStoreData {
  products: ProductRecord[];
  customers: CustomerRecord[];
  sales: SaleRecordRow[];
  saleItems: SaleItemRecord[];
  expenses: ExpenseRecordRow[];
  debtPayments: DebtPaymentRecord[];
  shifts: ShiftRecordRow[];
}

const STORAGE_KEY = 'stockpilot_web_db_v2';

function getSeedData(): WebStoreData {
  return {
    products: [
      {
        id: 'prod_1',
        name: 'Dangote Refined Sugar 50kg',
        sku: 'DNG-SUG-50',
        category: 'Grains & Staples',
        category_slug: 'grains',
        stock_left: 2,
        stock_unit: 'bags',
        min_alert: 10,
        cost_price: 68000,
        selling_price: 74500,
        wholesale_price: 72000,
        recent_note: 'Sold 18 yesterday',
        created_at: '2026-10-18T08:00:00Z',
      },
      {
        id: 'prod_2',
        name: 'Golden Penny Semovita 10kg (Pack of 5)',
        sku: 'GP-SEMO-10K',
        category: 'Grains & Staples',
        category_slug: 'grains',
        stock_left: 4,
        stock_unit: 'packs',
        min_alert: 8,
        cost_price: 32000,
        selling_price: 36000,
        wholesale_price: 34500,
        recent_note: 'Supplier: Flour Mills Nig',
        created_at: '2026-10-18T09:00:00Z',
      },
      {
        id: 'prod_3',
        name: 'Peak Evaporated Milk 160g (Carton of 48)',
        sku: 'PEAK-CAN-48',
        category: 'Canned & Dairy',
        category_slug: 'canned',
        stock_left: 86,
        stock_unit: 'cartons',
        min_alert: 15,
        cost_price: 24500,
        selling_price: 28500,
        wholesale_price: 27000,
        recent_note: 'Promo batch arriving Friday',
        created_at: '2026-10-18T10:00:00Z',
      },
      {
        id: 'prod_4',
        name: 'Gino Tomato Paste 70g (Carton of 50)',
        sku: 'GINO-TOM-50',
        category: 'Canned & Dairy',
        category_slug: 'canned',
        stock_left: 120,
        stock_unit: 'cartons',
        min_alert: 20,
        cost_price: 11000,
        selling_price: 13200,
        wholesale_price: 12500,
        recent_note: 'Fast mover in morning',
        created_at: '2026-10-18T11:00:00Z',
      },
      {
        id: 'prod_5',
        name: 'Indomie Instant Noodles Super Pack (Carton 40)',
        sku: 'IND-SUP-40',
        category: 'Grains & Staples',
        category_slug: 'grains',
        stock_left: 42,
        stock_unit: 'cartons',
        min_alert: 15,
        cost_price: 16500,
        selling_price: 18800,
        wholesale_price: 17800,
        recent_note: 'High turnover SKU',
        created_at: '2026-10-18T12:00:00Z',
      },
      {
        id: 'prod_6',
        name: 'Kings Pure Vegetable Oil 25L',
        sku: 'KNG-OIL-25L',
        category: 'Oils & Condiments',
        category_slug: 'oils',
        stock_left: 14,
        stock_unit: 'jerrycans',
        min_alert: 5,
        cost_price: 48000,
        selling_price: 52500,
        wholesale_price: 50500,
        recent_note: 'Devon King brand',
        created_at: '2026-10-18T13:00:00Z',
      },
    ],
    customers: [
      {
        id: 'cust_1',
        name: 'Mama Nkechi Stores',
        phone: '+234 803 491 8820',
        location: 'Balogun Mkt, Line 3B',
        tier: 'Gold Tier',
        is_verified: 1,
        credit_limit: 500000,
        balance: 145000,
        due_text: '12 Days Overdue',
        last_credit: '3 ctns Peak Milk (5d ago)',
        last_payment: '₦50,000 on Oct 02',
        lifetime_volume: '₦1,850,000',
        created_at: '2026-10-15T08:00:00Z',
      },
      {
        id: 'cust_2',
        name: 'Emeka Wholesales & Retail',
        phone: '+234 802 119 4432',
        location: 'Idumota Block C, Shop 14',
        tier: 'Silver Tier',
        is_verified: 1,
        credit_limit: 500000,
        balance: 80000,
        due_text: 'Due in 3 days',
        last_credit: '10 bags Dangote Sugar',
        last_payment: '₦40,000 on Sep 28',
        lifetime_volume: '₦920,000',
        created_at: '2026-10-16T08:00:00Z',
      },
      {
        id: 'cust_3',
        name: 'Alhaji Bello Grains Enterprise',
        phone: '+234 813 555 0192',
        location: 'Mile 12 Market Stall 8',
        tier: 'Silver Tier',
        is_verified: 0,
        credit_limit: 500000,
        balance: 220000,
        due_text: '28 Days Overdue',
        last_credit: '15 bags Semovita',
        last_payment: '₦100,000 on Sep 15',
        lifetime_volume: '₦3,100,000',
        created_at: '2026-10-17T08:00:00Z',
      },
      {
        id: 'cust_4',
        name: 'Mama Bose Canteen',
        phone: '+234 809 332 9901',
        location: 'Oyingbo Food Market',
        tier: 'Bronze Tier',
        is_verified: 1,
        credit_limit: 200000,
        balance: 0,
        due_text: 'Settled • All Cleared',
        last_credit: '2 ctns Gino Paste',
        last_payment: '₦26,400 on Oct 19',
        lifetime_volume: '₦430,000',
        created_at: '2026-10-18T08:00:00Z',
      },
    ],
    sales: [
      {
        id: 'sale_1',
        invoice_no: 'SP-1094',
        customer_id: 'cust_1',
        customer_name: 'Mama Nkechi Stores',
        total_amount: 185000,
        discount_amount: 0,
        net_payable: 185000,
        payment_channel: 'transfer',
        amount_tendered: null,
        change_returned: null,
        created_at: '2026-10-21T09:15:00Z',
      },
      {
        id: 'sale_2',
        invoice_no: 'SP-1093',
        customer_id: null,
        customer_name: 'Walk-in Cash Customer',
        total_amount: 142000,
        discount_amount: 0,
        net_payable: 142000,
        payment_channel: 'cash',
        amount_tendered: 150000,
        change_returned: 8000,
        created_at: '2026-10-21T10:30:00Z',
      },
      {
        id: 'sale_3',
        invoice_no: 'SP-1092',
        customer_id: 'cust_2',
        customer_name: 'Emeka Wholesales & Retail',
        total_amount: 110000,
        discount_amount: 0,
        net_payable: 110000,
        payment_channel: 'credit',
        amount_tendered: null,
        change_returned: null,
        created_at: '2026-10-21T11:00:00Z',
      },
      {
        id: 'sale_4',
        invoice_no: 'SP-1091',
        customer_id: null,
        customer_name: 'Iya Basira Provisions',
        total_amount: 49500,
        discount_amount: 0,
        net_payable: 49500,
        payment_channel: 'pos',
        amount_tendered: null,
        change_returned: null,
        created_at: '2026-10-21T11:45:00Z',
      },
    ],
    saleItems: [
      {
        id: 'item_1',
        sale_id: 'sale_1',
        product_id: 'prod_3',
        product_name: 'Peak Evaporated Milk 160g',
        sku: 'PEAK-CAN-48',
        quantity: 5,
        unit_price: 28500,
        total_price: 142500,
      },
      {
        id: 'item_2',
        sale_id: 'sale_1',
        product_id: 'prod_4',
        product_name: 'Gino Tomato Paste 70g',
        sku: 'GINO-TOM-50',
        quantity: 3,
        unit_price: 13200,
        total_price: 39600,
      },
      {
        id: 'item_3',
        sale_id: 'sale_2',
        product_id: 'prod_1',
        product_name: 'Dangote Refined Sugar 50kg',
        sku: 'DNG-SUG-50',
        quantity: 2,
        unit_price: 71000,
        total_price: 142000,
      },
      {
        id: 'item_4',
        sale_id: 'sale_3',
        product_id: 'prod_5',
        product_name: 'Indomie Super Pack (Carton 40)',
        sku: 'IND-SUP-40',
        quantity: 5,
        unit_price: 18800,
        total_price: 94000,
      },
    ],
    expenses: [
      {
        id: 'exp_1',
        category: 'Store Security & NEPA',
        amount: 15000,
        recipient: 'Market Association',
        notes: 'Weekly market security & diesel contribution',
        payment_method: 'cash',
        created_at: '2026-10-21T08:00:00Z',
      },
    ],
    debtPayments: [],
    shifts: [
      {
        id: 'shift_1',
        cashier_name: 'Attendant Tunde',
        opened_at: new Date().toISOString(),
        closed_at: null,
        expected_cash: 127000,
        counted_cash: null,
        discrepancy: null,
        notes: null,
        status: 'open',
      },
    ],
  };
}

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
    // Graceful fallback for Safari private browsing, sandboxed iframes, or disabled storage
    return null;
  }
}

class WebDatabaseImpl implements AppDatabase {
  private data: WebStoreData;

  constructor() {
    this.data = this.loadStore();
  }

  private loadStore(): WebStoreData {
    const seed = getSeedData();
    const storage = getSafeLocalStorage();
    if (storage) {
      try {
        const stored = storage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          return {
            products: Array.isArray(parsed.products) ? parsed.products : seed.products,
            customers: Array.isArray(parsed.customers) ? parsed.customers : seed.customers,
            sales: Array.isArray(parsed.sales) ? parsed.sales : seed.sales,
            saleItems: Array.isArray(parsed.saleItems) ? parsed.saleItems : seed.saleItems,
            expenses: Array.isArray(parsed.expenses) ? parsed.expenses : seed.expenses,
            debtPayments: Array.isArray(parsed.debtPayments) ? parsed.debtPayments : seed.debtPayments,
            shifts: Array.isArray(parsed.shifts) ? parsed.shifts : seed.shifts,
          };
        }
      } catch (e) {
        console.warn('Failed to load localStorage web DB', e);
      }
    }
    return seed;
  }

  private saveStore(): void {
    const storage = getSafeLocalStorage();
    if (storage) {
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      } catch (e) {
        console.warn('Failed to save localStorage web DB', e);
      }
    }
  }

  async execAsync(sql: string): Promise<void> {
    let changed = false;
    if (sql.includes('DELETE FROM sale_items')) { this.data.saleItems = []; changed = true; }
    if (sql.includes('DELETE FROM sales')) { this.data.sales = []; changed = true; }
    if (sql.includes('DELETE FROM products')) { this.data.products = []; changed = true; }
    if (sql.includes('DELETE FROM customers')) { this.data.customers = []; changed = true; }
    if (sql.includes('DELETE FROM debt_payments')) { this.data.debtPayments = []; changed = true; }
    if (sql.includes('DELETE FROM expenses')) { this.data.expenses = []; changed = true; }
    if (sql.includes('DELETE FROM shifts')) { this.data.shifts = []; changed = true; }
    if (changed) {
      this.saveStore();
    }
  }

  async withTransactionAsync<T>(task: (txn: AppDatabase) => Promise<T>): Promise<T> {
    return await task(this);
  }

  async runAsync(sql: string, params: any[] = []): Promise<{ changes: number; lastInsertRowId: number }> {
    const s = sql.trim();

    // 1. INSERT INTO products
    if (s.startsWith('INSERT INTO products') || s.startsWith('INSERT OR REPLACE INTO products')) {
      const [id, name, sku, category, category_slug, stock_left, stock_unit, min_alert, cost_price, selling_price, recent_note] = params;
      this.data.products = this.data.products.filter(p => p.id !== id && p.sku !== sku);
      this.data.products.unshift({
        id,
        name,
        sku,
        category,
        category_slug,
        stock_left: Number(stock_left),
        stock_unit,
        min_alert: Number(min_alert),
        cost_price: Number(cost_price),
        selling_price: Number(selling_price),
        wholesale_price: null,
        recent_note: recent_note || null,
        created_at: new Date().toISOString(),
      });
      this.saveStore();
      return { changes: 1, lastInsertRowId: Date.now() };
    }


    // 2. UPDATE products SET stock_left
    if (s.startsWith('UPDATE products SET stock_left')) {
      const [delta, id] = params;
      const prod = this.data.products.find((p) => p.id === id);
      if (prod) {
        prod.stock_left = Math.max(0, prod.stock_left + Number(delta));
        this.saveStore();
      }
      return { changes: 1, lastInsertRowId: 0 };
    }

    // 3. INSERT INTO customers
    if (s.startsWith('INSERT INTO customers')) {
      const [id, name, phone, location, tier, is_verified, credit_limit, balance, due_text] = params;
      this.data.customers.unshift({
        id,
        name,
        phone: phone || null,
        location: location || null,
        tier: tier || 'Silver Tier',
        is_verified: Number(is_verified),
        credit_limit: Number(credit_limit),
        balance: Number(balance),
        due_text: due_text || 'Settled • All Cleared',
        last_credit: null,
        last_payment: null,
        lifetime_volume: `₦${Number(balance).toLocaleString()}`,
        created_at: new Date().toISOString(),
      });
      this.saveStore();
      return { changes: 1, lastInsertRowId: Date.now() };
    }

    // 4. UPDATE customers
    if (s.startsWith('UPDATE customers')) {
      if (s.includes('balance = MAX(0, balance - ?)')) {
        const [amount, last_payment, customerId] = params;
        const cust = this.data.customers.find((c) => c.id === customerId);
        if (cust) {
          cust.balance = Math.max(0, cust.balance - Number(amount));
          cust.last_payment = last_payment;
          if (cust.balance <= 0) cust.due_text = 'Settled • All Cleared';
          this.saveStore();
        }
      } else if (s.includes('balance = balance + ?')) {
        const [amount, last_credit, customerId] = params;
        const cust = this.data.customers.find((c) => c.id === customerId);
        if (cust) {
          cust.balance = cust.balance + Number(amount);
          cust.due_text = '14 Days Terms';
          cust.last_credit = last_credit;
          this.saveStore();
        }
      } else if (s.includes("due_text = 'Settled • All Cleared'")) {
        const [customerId] = params;
        const cust = this.data.customers.find((c) => c.id === customerId);
        if (cust && cust.balance <= 0) {
          cust.due_text = 'Settled • All Cleared';
          this.saveStore();
        }
      }
      return { changes: 1, lastInsertRowId: 0 };
    }

    // 5. INSERT INTO sales
    if (s.startsWith('INSERT INTO sales')) {
      const [id, invoice_no, customer_id, customer_name, total_amount, discount_amount, net_payable, payment_channel, amount_tendered, change_returned] = params;
      this.data.sales.unshift({
        id,
        invoice_no,
        customer_id: customer_id || null,
        customer_name: customer_name || null,
        total_amount: Number(total_amount),
        discount_amount: Number(discount_amount || 0),
        net_payable: Number(net_payable),
        payment_channel,
        amount_tendered: amount_tendered != null ? Number(amount_tendered) : null,
        change_returned: change_returned != null ? Number(change_returned) : null,
        created_at: new Date().toISOString(),
      });
      this.saveStore();
      return { changes: 1, lastInsertRowId: Date.now() };
    }

    // 6. INSERT INTO sale_items
    if (s.startsWith('INSERT INTO sale_items')) {
      const [id, sale_id, product_id, product_name, sku, quantity, unit_price, total_price] = params;
      this.data.saleItems.push({
        id,
        sale_id,
        product_id,
        product_name,
        sku,
        quantity: Number(quantity),
        unit_price: Number(unit_price),
        total_price: Number(total_price),
      });
      this.saveStore();
      return { changes: 1, lastInsertRowId: Date.now() };
    }

    // 7. INSERT INTO expenses
    if (s.startsWith('INSERT INTO expenses')) {
      const [id, category, amount, recipient, notes, payment_method] = params;
      this.data.expenses.unshift({
        id,
        category,
        amount: Number(amount),
        recipient: recipient || null,
        notes: notes || null,
        payment_method: payment_method || 'cash',
        created_at: new Date().toISOString(),
      });
      this.saveStore();
      return { changes: 1, lastInsertRowId: Date.now() };
    }

    // 8. INSERT INTO debt_payments
    if (s.startsWith('INSERT INTO debt_payments')) {
      const [id, customer_id, amount_paid, payment_method, notes] = params;
      this.data.debtPayments.unshift({
        id,
        customer_id,
        amount_paid: Number(amount_paid),
        payment_method,
        notes: notes || null,
        created_at: new Date().toISOString(),
      });
      this.saveStore();
      return { changes: 1, lastInsertRowId: Date.now() };
    }

    // 9. SHIFTS
    if (s.startsWith('INSERT INTO shifts')) {
      const [id, cashier_name, opened_at, expected_cash, status] = params;
      this.data.shifts.unshift({
        id,
        cashier_name,
        opened_at,
        closed_at: null,
        expected_cash: Number(expected_cash || 0),
        counted_cash: null,
        discrepancy: null,
        notes: null,
        status: status || 'open',
      });
      this.saveStore();
      return { changes: 1, lastInsertRowId: Date.now() };
    }

    if (s.includes("UPDATE shifts SET status = 'closed' WHERE status = 'open'")) {
      this.data.shifts.forEach((sh) => {
        if (sh.status === 'open') sh.status = 'closed';
      });
      this.saveStore();
      return { changes: 1, lastInsertRowId: 0 };
    }

    if (s.startsWith('UPDATE shifts')) {
      const [closed_at, expected_cash, counted_cash, discrepancy, notes, shiftId] = params;
      const sh = this.data.shifts.find((x) => x.id === shiftId);
      if (sh) {
        sh.closed_at = closed_at;
        sh.expected_cash = Number(expected_cash);
        sh.counted_cash = Number(counted_cash);
        sh.discrepancy = Number(discrepancy);
        sh.notes = notes;
        sh.status = 'closed';
        this.saveStore();
      }
      return { changes: 1, lastInsertRowId: 0 };
    }

    return { changes: 1, lastInsertRowId: 0 };
  }

  async getFirstAsync<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const list = await this.getAllAsync<T>(sql, params);
    return list.length > 0 ? list[0] : null;
  }

  async getAllAsync<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const s = sql.trim();

    // 1. SELECT count(*) as count FROM products
    if (s.includes('count(*) as count FROM products')) {
      return [{ count: this.data.products.length } as unknown as T];
    }

    // 2. SELECT * FROM products
    if (s.includes('FROM products') && s.includes('SELECT *')) {
      let list = [...this.data.products];
      let pIdx = 0;

      if (s.includes('category_slug = ?')) {
        const cat = params[pIdx++];
        list = list.filter((p) => p.category_slug === cat);
      }

      if (s.includes('name LIKE ? OR sku LIKE ? OR category LIKE ?')) {
        const term = String(params[pIdx] || '').replace(/%/g, '').toLowerCase();
        list = list.filter(
          (p) =>
            p.name.toLowerCase().includes(term) ||
            p.sku.toLowerCase().includes(term) ||
            p.category.toLowerCase().includes(term)
        );
      }

      return list as unknown as T[];
    }

    // 3. SELECT * FROM customers
    if (s.includes('FROM customers') && s.includes('SELECT *')) {
      let list = [...this.data.customers];
      let pIdx = 0;

      if (s.includes("balance > 0 AND due_text LIKE '%Overdue%'")) {
        list = list.filter((c) => c.balance > 0 && (c.due_text ?? '').includes('Overdue'));
      } else if (s.includes("balance > 0 AND due_text NOT LIKE '%Overdue%'")) {
        list = list.filter((c) => c.balance > 0 && !(c.due_text ?? '').includes('Overdue'));
      } else if (s.includes('balance = 0')) {
        list = list.filter((c) => c.balance === 0);
      }

      if (s.includes('name LIKE ? OR phone LIKE ? OR location LIKE ?')) {
        const term = String(params[pIdx] || '').replace(/%/g, '').toLowerCase();
        list = list.filter(
          (c) =>
            c.name.toLowerCase().includes(term) ||
            (c.phone ?? '').toLowerCase().includes(term) ||
            (c.location ?? '').toLowerCase().includes(term)
        );
      }

      return list as unknown as T[];
    }

    // 4. Sales Summary for Dashboard
    if (s.includes('FROM sales') && s.includes('SUM(net_payable) as totalSales')) {
      const totalSales = this.data.sales.reduce((sum, sale) => sum + sale.net_payable, 0);
      const salesCount = this.data.sales.length;
      const cash = this.data.sales.filter((x) => x.payment_channel === 'cash').reduce((sum, x) => sum + x.net_payable, 0);
      const transfer = this.data.sales.filter((x) => x.payment_channel === 'transfer').reduce((sum, x) => sum + x.net_payable, 0);
      const pos = this.data.sales.filter((x) => x.payment_channel === 'pos').reduce((sum, x) => sum + x.net_payable, 0);
      const credit = this.data.sales.filter((x) => x.payment_channel === 'credit').reduce((sum, x) => sum + x.net_payable, 0);

      return [
        {
          totalSales,
          salesCount,
          cash,
          transfer,
          pos,
          credit,
        } as unknown as T,
      ];
    }

    // 5. Customer Summary for Dashboard
    if (s.includes('FROM customers') && s.includes('COUNT(*) as totalCustomers')) {
      const totalCustomers = this.data.customers.length;
      const owingCustomers = this.data.customers.filter((c) => c.balance > 0).length;
      const overdueCount = this.data.customers.filter((c) => c.balance > 0 && (c.due_text ?? '').includes('Overdue')).length;
      const totalBalance = this.data.customers.reduce((sum, c) => sum + c.balance, 0);

      return [
        {
          totalCustomers,
          owingCustomers,
          overdueCount,
          totalBalance,
        } as unknown as T,
      ];
    }

    // 6. Stock Summary for Dashboard
    if (s.includes('FROM products') && s.includes('COUNT(*) as totalProducts')) {
      const totalProducts = this.data.products.length;
      const lowStock = this.data.products.filter((p) => p.stock_left <= p.min_alert).length;
      const totalValuation = this.data.products.reduce((sum, p) => sum + p.stock_left * p.selling_price, 0);

      return [
        {
          totalProducts,
          lowStock,
          totalValuation,
        } as unknown as T,
      ];
    }

    // 7. Get Sales List (with joined item summaries)
    if (s.includes('FROM sales s') && s.includes('LEFT JOIN sale_items si')) {
      let salesList = this.data.sales;
      let limit = 50;
      if (s.includes('WHERE s.customer_id = ?')) {
        const custId = params[0];
        limit = params[1] || 50;
        salesList = salesList.filter((sale) => sale.customer_id === custId);
      } else {
        limit = params[0] || 50;
      }

      const result = salesList.slice(0, limit).map((sale) => {
        const items = this.data.saleItems.filter((it) => it.sale_id === sale.id);
        const item_count = items.length;
        const items_summary = items.map((it) => `${it.product_name} x${it.quantity}`).join(', ');

        return {
          ...sale,
          item_count,
          items_summary,
        };
      });

      return result as unknown as T[];
    }

    // 7b. Get Line Items for a specific sale
    if (s.includes('FROM sale_items') && s.includes('sale_id = ?')) {
      const saleId = params[0];
      const items = this.data.saleItems.filter((it) => it.sale_id === saleId);
      return items as unknown as T[];
    }

    // 8. Cost Summary for Financial Reports
    if (s.includes('FROM sale_items si') && s.includes('totalCost')) {
      let totalCost = 0;
      let totalRevenue = 0;
      for (const item of this.data.saleItems) {
        const prod = this.data.products.find((p) => p.id === item.product_id);
        const costPrice = prod ? prod.cost_price : item.unit_price * 0.85;
        totalCost += item.quantity * costPrice;
        totalRevenue += item.total_price;
      }
      return [{ totalCost, totalRevenue } as unknown as T];
    }

    // 9. Top Selling Products
    if (s.includes('FROM sale_items') && s.includes('GROUP BY product_name')) {
      const productMap: Record<string, { totalQuantity: number; totalRevenue: number }> = {};
      for (const it of this.data.saleItems) {
        if (!productMap[it.product_name]) {
          productMap[it.product_name] = { totalQuantity: 0, totalRevenue: 0 };
        }
        productMap[it.product_name].totalQuantity += it.quantity;
        productMap[it.product_name].totalRevenue += it.total_price;
      }
      const topProducts = Object.entries(productMap)
        .map(([productName, stats]) => ({
          productName,
          ...stats,
        }))
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 5);

      return topProducts as unknown as T[];
    }

    // 10. Expenses List
    if (s.includes('FROM expenses') && s.includes('SELECT *')) {
      const limit = params[0] || 50;
      return this.data.expenses.slice(0, limit) as unknown as T[];
    }

    // 11. Expenses Total
    if (s.includes('SELECT SUM(amount) as totalExpenses FROM expenses')) {
      const total = this.data.expenses.reduce((sum, e) => sum + e.amount, 0);
      return [{ totalExpenses: total } as unknown as T];
    }

    // 12. Expenses By Category
    if (s.includes('FROM expenses') && s.includes('GROUP BY category')) {
      const catMap: Record<string, number> = {};
      for (const e of this.data.expenses) {
        catMap[e.category] = (catMap[e.category] || 0) + e.amount;
      }
      const list = Object.entries(catMap)
        .map(([category, totalAmount]) => ({ category, totalAmount }))
        .sort((a, b) => b.totalAmount - a.totalAmount)
        .slice(0, 5);
      return list as unknown as T[];
    }

    // 13. Receivables Summary for Financial Reports
    if (s.includes('FROM customers') && s.includes('as overdue')) {
      let overdue = 0;
      let dueSoon = 0;
      let current = 0;
      let total = 0;

      for (const c of this.data.customers) {
        if (c.balance > 0) {
          total += c.balance;
          const dt = (c.due_text ?? '').toLowerCase();
          if (dt.includes('overdue')) overdue += c.balance;
          else if (dt.includes('due in')) dueSoon += c.balance;
          else current += c.balance;
        }
      }

      return [{ overdue, dueSoon, current, total } as unknown as T];
    }

    // 14. Shifts
    if (s.includes('FROM shifts WHERE status =')) {
      const openShift = this.data.shifts.find((sh) => sh.status === 'open');
      return (openShift ? [openShift] : []) as unknown as T[];
    }

    if (s.includes("FROM sales WHERE payment_channel = 'cash'")) {
      const cashTotal = this.data.sales
        .filter((x) => x.payment_channel === 'cash')
        .reduce((sum, x) => sum + x.net_payable, 0);
      return [{ total: cashTotal } as unknown as T];
    }

    if (s.includes("FROM expenses WHERE payment_method = 'cash'")) {
      const cashExp = this.data.expenses
        .filter((x) => x.payment_method === 'cash')
        .reduce((sum, x) => sum + x.amount, 0);
      return [{ total: cashExp } as unknown as T];
    }

    return [];
  }
}

let singletonWebDb: WebDatabaseImpl | null = null;

export function getWebDatabase(): AppDatabase {
  if (!singletonWebDb) {
    singletonWebDb = new WebDatabaseImpl();
  }
  return singletonWebDb;
}
