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
      distributor_price REAL,
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
      price_tier TEXT DEFAULT 'retail',
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

    CREATE TABLE IF NOT EXISTS waybills (
      id TEXT PRIMARY KEY,
      sale_id TEXT NOT NULL,
      invoice_no TEXT NOT NULL,
      waybill_no TEXT NOT NULL UNIQUE,
      transporter_name TEXT NOT NULL,
      park_loading_bay TEXT NOT NULL,
      driver_phone TEXT NOT NULL,
      vehicle_plate TEXT,
      destination_city TEXT NOT NULL,
      receiver_name TEXT NOT NULL,
      receiver_phone TEXT NOT NULL,
      packages_count INTEGER NOT NULL DEFAULT 1,
      package_type TEXT DEFAULT 'cartons',
      carriage_fee REAL DEFAULT 0,
      porter_fee REAL DEFAULT 0,
      status TEXT DEFAULT 'in_transit',
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
    );
  `);

  // Migrations for existing databases
  try {
    await db.execAsync(`ALTER TABLE products ADD COLUMN distributor_price REAL;`);
  } catch {
    // column may already exist
  }

  try {
    await db.execAsync(`ALTER TABLE sale_items ADD COLUMN price_tier TEXT DEFAULT 'retail';`);
  } catch {
    // column may already exist
  }

  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS waybills (
        id TEXT PRIMARY KEY,
        sale_id TEXT NOT NULL,
        invoice_no TEXT NOT NULL,
        waybill_no TEXT NOT NULL UNIQUE,
        transporter_name TEXT NOT NULL,
        park_loading_bay TEXT NOT NULL,
        driver_phone TEXT NOT NULL,
        vehicle_plate TEXT,
        destination_city TEXT NOT NULL,
        receiver_name TEXT NOT NULL,
        receiver_phone TEXT NOT NULL,
        packages_count INTEGER NOT NULL DEFAULT 1,
        package_type TEXT DEFAULT 'cartons',
        carriage_fee REAL DEFAULT 0,
        porter_fee REAL DEFAULT 0,
        status TEXT DEFAULT 'in_transit',
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
      );
    `);
  } catch {
    // table may already exist
  }

  // Remove any legacy customer records/debtors and demo sales so users start with a clean ledger
  await db.execAsync(`
    DELETE FROM sale_items WHERE sale_id IN ('sale_1', 'sale_2', 'sale_3', 'sale_4') 
       OR sale_id IN (SELECT id FROM sales WHERE invoice_no IN ('SP-1091', 'SP-1092', 'SP-1093', 'SP-1094'));
    DELETE FROM sales WHERE id IN ('sale_1', 'sale_2', 'sale_3', 'sale_4') 
       OR invoice_no IN ('SP-1091', 'SP-1092', 'SP-1093', 'SP-1094');
    DELETE FROM debt_payments;
    DELETE FROM customers;
  `);

  const productCount = await db.getFirstAsync<{ count: number }>(
    'SELECT count(*) as count FROM products'
  );

  if (!productCount || productCount.count === 0) {
    await seedInitialData(db);
  }
}

async function seedInitialData(db: SQLiteDatabase): Promise<void> {
  // 1. Seed Products with 3-Tier Nigerian wholesale & distributor pricing
  await db.runAsync(
    `INSERT INTO products (id, name, sku, category, category_slug, stock_left, stock_unit, min_alert, cost_price, selling_price, wholesale_price, distributor_price, recent_note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      72000,
      70500,
      'Sold 18 yesterday',
    ]
  );

  await db.runAsync(
    `INSERT INTO products (id, name, sku, category, category_slug, stock_left, stock_unit, min_alert, cost_price, selling_price, wholesale_price, distributor_price, recent_note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      34500,
      33800,
      'Supplier: Flour Mills Nig',
    ]
  );

  await db.runAsync(
    `INSERT INTO products (id, name, sku, category, category_slug, stock_left, stock_unit, min_alert, cost_price, selling_price, wholesale_price, distributor_price, recent_note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      27000,
      26200,
      'Promo batch arriving Friday',
    ]
  );

  await db.runAsync(
    `INSERT INTO products (id, name, sku, category, category_slug, stock_left, stock_unit, min_alert, cost_price, selling_price, wholesale_price, distributor_price, recent_note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      12500,
      12000,
      'Fast mover in morning',
    ]
  );

  await db.runAsync(
    `INSERT INTO products (id, name, sku, category, category_slug, stock_left, stock_unit, min_alert, cost_price, selling_price, wholesale_price, distributor_price, recent_note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      17800,
      17200,
      'High turnover SKU',
    ]
  );

  await db.runAsync(
    `INSERT INTO products (id, name, sku, category, category_slug, stock_left, stock_unit, min_alert, cost_price, selling_price, wholesale_price, distributor_price, recent_note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      50500,
      49500,
      'Devon King brand',
    ]
  );

  // 2. Seed Expenses
  await db.runAsync(
    `INSERT INTO expenses (id, category, amount, recipient, notes, payment_method)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['exp_1', 'Store Security & NEPA', 15000, 'Market Association', 'Weekly market security & diesel contribution', 'cash']
  );
}
