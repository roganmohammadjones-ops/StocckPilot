import type { SQLiteDatabase } from 'expo-sqlite';

export async function initDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sku TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL,
      category_slug TEXT NOT NULL,
      stock_left REAL NOT NULL DEFAULT 0,
      stock_unit TEXT NOT NULL,
      min_alert REAL NOT NULL DEFAULT 10,
      cost_price REAL NOT NULL,
      selling_price REAL NOT NULL,
      wholesale_price REAL,
      recent_note TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      location TEXT,
      tier TEXT DEFAULT 'Silver Tier',
      is_verified INTEGER DEFAULT 1,
      credit_limit REAL DEFAULT 500000,
      balance REAL DEFAULT 0,
      due_text TEXT DEFAULT '14 Days Terms',
      last_credit TEXT,
      last_payment TEXT,
      lifetime_volume TEXT DEFAULT '₦0',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      invoice_no TEXT NOT NULL UNIQUE,
      customer_id TEXT,
      customer_name TEXT,
      total_amount REAL NOT NULL,
      discount_amount REAL DEFAULT 0,
      net_payable REAL NOT NULL,
      payment_channel TEXT NOT NULL,
      amount_tendered REAL,
      change_returned REAL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id TEXT PRIMARY KEY,
      sale_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      sku TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL,
      FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS debt_payments (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      amount_paid REAL NOT NULL,
      payment_method TEXT NOT NULL,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      recipient TEXT,
      notes TEXT,
      payment_method TEXT DEFAULT 'cash',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS shifts (
      id TEXT PRIMARY KEY,
      cashier_name TEXT NOT NULL,
      opened_at TEXT DEFAULT CURRENT_TIMESTAMP,
      closed_at TEXT,
      expected_cash REAL NOT NULL DEFAULT 0,
      counted_cash REAL,
      discrepancy REAL,
      notes TEXT,
      status TEXT DEFAULT 'open'
    );
  `);

  const productCount = await db.getFirstAsync<{ count: number }>(
    'SELECT count(*) as count FROM products'
  );

  if (!productCount || productCount.count === 0) {
    await seedInitialData(db);
  }
}

async function seedInitialData(db: SQLiteDatabase): Promise<void> {
  // 1. Seed Products
  await db.runAsync(
    `INSERT INTO products (id, name, sku, category, category_slug, stock_left, stock_unit, min_alert, cost_price, selling_price, recent_note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'prod_1',
      'Dangote Refined Sugar 50kg',
      'DNG-SUG-50',
      'Grains & Staples',
      'grains',
      2,
      'bags',
      10,
      68000,
      74500,
      'Sold 18 yesterday',
    ]
  );

  await db.runAsync(
    `INSERT INTO products (id, name, sku, category, category_slug, stock_left, stock_unit, min_alert, cost_price, selling_price, recent_note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'prod_2',
      'Golden Penny Semovita 10kg (Pack of 5)',
      'GP-SEMO-10K',
      'Grains & Staples',
      'grains',
      4,
      'packs',
      8,
      32000,
      36000,
      'Supplier: Flour Mills Nig',
    ]
  );

  await db.runAsync(
    `INSERT INTO products (id, name, sku, category, category_slug, stock_left, stock_unit, min_alert, cost_price, selling_price, recent_note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'prod_3',
      'Peak Evaporated Milk 160g (Carton of 48)',
      'PEAK-CAN-48',
      'Canned & Dairy',
      'canned',
      86,
      'cartons',
      15,
      24500,
      28500,
      'Promo batch arriving Friday',
    ]
  );

  await db.runAsync(
    `INSERT INTO products (id, name, sku, category, category_slug, stock_left, stock_unit, min_alert, cost_price, selling_price, recent_note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'prod_4',
      'Gino Tomato Paste 70g (Carton of 50)',
      'GINO-TOM-50',
      'Canned & Dairy',
      'canned',
      120,
      'cartons',
      20,
      11000,
      13200,
      'Fast mover in morning',
    ]
  );

  await db.runAsync(
    `INSERT INTO products (id, name, sku, category, category_slug, stock_left, stock_unit, min_alert, cost_price, selling_price, recent_note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'prod_5',
      'Indomie Instant Noodles Super Pack (Carton 40)',
      'IND-SUP-40',
      'Grains & Staples',
      'grains',
      42,
      'cartons',
      15,
      16500,
      18800,
      'High turnover SKU',
    ]
  );

  await db.runAsync(
    `INSERT INTO products (id, name, sku, category, category_slug, stock_left, stock_unit, min_alert, cost_price, selling_price, recent_note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'prod_6',
      'Kings Pure Vegetable Oil 25L',
      'KNG-OIL-25L',
      'Oils & Condiments',
      'oils',
      14,
      'jerrycans',
      5,
      48000,
      52500,
      'Devon King brand',
    ]
  );

  // 2. Seed Customers
  await db.runAsync(
    `INSERT INTO customers (id, name, phone, location, tier, is_verified, balance, due_text, last_credit, last_payment, lifetime_volume)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'cust_1',
      'Mama Nkechi Stores',
      '+234 803 491 8820',
      'Balogun Mkt, Line 3B',
      'Gold Tier',
      1,
      145000,
      '12 Days Overdue',
      '3 ctns Peak Milk (5d ago)',
      '₦50,000 on Oct 02',
      '₦1,850,000',
    ]
  );

  await db.runAsync(
    `INSERT INTO customers (id, name, phone, location, tier, is_verified, balance, due_text, last_credit, last_payment, lifetime_volume)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'cust_2',
      'Emeka Wholesales & Retail',
      '+234 802 119 4432',
      'Idumota Block C, Shop 14',
      'Silver Tier',
      1,
      80000,
      'Due in 3 days',
      '10 bags Dangote Sugar',
      '₦40,000 on Sep 28',
      '₦920,000',
    ]
  );

  await db.runAsync(
    `INSERT INTO customers (id, name, phone, location, tier, is_verified, balance, due_text, last_credit, last_payment, lifetime_volume)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'cust_3',
      'Alhaji Bello Grains Enterprise',
      '+234 813 555 0192',
      'Mile 12 Market Stall 8',
      'Silver Tier',
      0,
      220000,
      '28 Days Overdue',
      '15 bags Semovita',
      '₦100,000 on Sep 15',
      '₦3,100,000',
    ]
  );

  await db.runAsync(
    `INSERT INTO customers (id, name, phone, location, tier, is_verified, balance, due_text, last_credit, last_payment, lifetime_volume)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'cust_4',
      'Mama Bose Canteen',
      '+234 809 332 9901',
      'Oyingbo Food Market',
      'Bronze Tier',
      1,
      0,
      'Settled • All Cleared',
      '2 ctns Gino Paste',
      '₦26,400 on Oct 19',
      '₦430,000',
    ]
  );

  // 3. Seed Initial Sales (matching the ₦486,500 total)
  await db.runAsync(
    `INSERT INTO sales (id, invoice_no, customer_id, customer_name, total_amount, discount_amount, net_payable, payment_channel)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['sale_1', 'SP-1094', 'cust_1', 'Mama Nkechi Stores', 185000, 0, 185000, 'transfer']
  );
  await db.runAsync(
    `INSERT INTO sale_items (id, sale_id, product_id, product_name, sku, quantity, unit_price, total_price)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['item_1', 'sale_1', 'prod_3', 'Peak Evaporated Milk 160g', 'PEAK-CAN-48', 5, 28500, 142500]
  );
  await db.runAsync(
    `INSERT INTO sale_items (id, sale_id, product_id, product_name, sku, quantity, unit_price, total_price)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['item_2', 'sale_1', 'prod_4', 'Gino Tomato Paste 70g', 'GINO-TOM-50', 3, 13200, 39600]
  );

  await db.runAsync(
    `INSERT INTO sales (id, invoice_no, customer_id, customer_name, total_amount, discount_amount, net_payable, payment_channel)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['sale_2', 'SP-1093', null, 'Walk-in Cash Customer', 142000, 0, 142000, 'cash']
  );
  await db.runAsync(
    `INSERT INTO sale_items (id, sale_id, product_id, product_name, sku, quantity, unit_price, total_price)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['item_3', 'sale_2', 'prod_1', 'Dangote Refined Sugar 50kg', 'DNG-SUG-50', 2, 71000, 142000]
  );

  await db.runAsync(
    `INSERT INTO sales (id, invoice_no, customer_id, customer_name, total_amount, discount_amount, net_payable, payment_channel)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['sale_3', 'SP-1092', 'cust_2', 'Emeka Wholesales & Retail', 110000, 0, 110000, 'credit']
  );
  await db.runAsync(
    `INSERT INTO sale_items (id, sale_id, product_id, product_name, sku, quantity, unit_price, total_price)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['item_4', 'sale_3', 'prod_5', 'Indomie Super Pack (Carton 40)', 'IND-SUP-40', 5, 18800, 94000]
  );

  await db.runAsync(
    `INSERT INTO sales (id, invoice_no, customer_id, customer_name, total_amount, discount_amount, net_payable, payment_channel)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['sale_4', 'SP-1091', null, 'Iya Basira Provisions', 49500, 0, 49500, 'pos']
  );

  // 4. Seed Expenses
  await db.runAsync(
    `INSERT INTO expenses (id, category, amount, recipient, notes, payment_method)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['exp_1', 'Store Security & NEPA', 15000, 'Market Association', 'Weekly market security & diesel contribution', 'cash']
  );
}
