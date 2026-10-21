import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import type { SaleRecord, Customer, FinancialReportData } from './db/types';
import { getStoredUser } from './auth';
import { getStoreProfile } from './store-profile';

export interface ReceiptItem {
  productName: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
}

export interface StoreDetails {
  businessName?: string;
  tradeHub?: string;
  phone?: string;
  cashierName?: string;
}

export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// --------------------------------------------------------------------------
// 1. Point of Sale (POS) Sales Receipt
// --------------------------------------------------------------------------

export function generateReceiptHtml(
  sale: SaleRecord,
  items?: ReceiptItem[],
  store?: StoreDetails
): string {
  const user = getStoredUser();
  const profile = getStoreProfile();
  const businessName = store?.businessName || profile.businessName || user?.businessName || 'StockPilot Store';
  const tradeHub = store?.tradeHub || profile.marketLocation || user?.tradeHub || 'Lagos, Nigeria';
  const phone = store?.phone || profile.phone || user?.phone || '';
  const cashier = store?.cashierName || 'Counter Till #1';
  const dateStr = sale.createdAt
    ? new Date(sale.createdAt).toLocaleString('en-NG', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    : new Date().toLocaleString();

  let parsedItems: ReceiptItem[] = items || [];
  if (parsedItems.length === 0 && sale.itemsSummary) {
    parsedItems = sale.itemsSummary.split(', ').map((str) => {
      const match = str.match(/^(.*?)\s*x(\d+(?:\.\d+)?)$/);
      if (match) {
        const qty = parseFloat(match[2]);
        const approxUnit = sale.itemCount > 0 ? Math.round(sale.netPayable / sale.itemCount) : sale.netPayable;
        return {
          productName: match[1],
          quantity: qty,
          unitPrice: approxUnit,
          totalPrice: qty * approxUnit,
        };
      }
      return {
        productName: str,
        quantity: 1,
        unitPrice: sale.netPayable,
        totalPrice: sale.netPayable,
      };
    });
  }

  const itemsHtml = parsedItems
    .map(
      (item) => `
      <tr>
        <td style="padding: 6px 0; border-bottom: 1px dashed #d1d5db; font-size: 13px; font-weight: 600; color: #111827;">
          ${item.productName}
          ${item.sku ? `<br/><span style="font-size: 10px; color: #6b7280; font-family: monospace;">SKU: ${item.sku}</span>` : ''}
        </td>
        <td style="padding: 6px 4px; border-bottom: 1px dashed #d1d5db; font-size: 13px; text-align: center; color: #374151;">
          ${item.quantity}
        </td>
        <td style="padding: 6px 4px; border-bottom: 1px dashed #d1d5db; font-size: 13px; text-align: right; color: #374151;">
          ${formatNaira(item.unitPrice)}
        </td>
        <td style="padding: 6px 0; border-bottom: 1px dashed #d1d5db; font-size: 13px; text-align: right; font-weight: 700; color: #111827;">
          ${formatNaira(item.totalPrice ?? item.quantity * item.unitPrice)}
        </td>
      </tr>
    `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt ${sale.invoiceNo}</title>
  <style>
    @page { margin: 4mm; size: 80mm auto; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 12px;
      color: #111827;
      background-color: #ffffff;
      max-width: 340px;
      margin: 0 auto;
      box-sizing: border-box;
    }
    .header {
      text-align: center;
      margin-bottom: 12px;
      border-bottom: 2px solid #16a34a;
      padding-bottom: 10px;
    }
    .brand-pill {
      display: inline-block;
      background-color: #00873a;
      color: #ffffff;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .biz-name {
      font-size: 17px;
      font-weight: 800;
      color: #021811;
      margin: 0 0 3px 0;
      line-height: 1.2;
    }
    .biz-info {
      font-size: 11px;
      color: #4b5563;
      margin: 2px 0;
      line-height: 1.3;
    }
    .meta-box {
      background-color: #f3f4f6;
      border-radius: 8px;
      padding: 8px 10px;
      margin-bottom: 12px;
      font-size: 11px;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      margin: 2px 0;
    }
    .meta-label { color: #6b7280; }
    .meta-val { font-weight: 700; color: #111827; }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
    }
    .items-table th {
      font-size: 10px;
      font-weight: 700;
      color: #4b5563;
      text-transform: uppercase;
      border-bottom: 1.5px solid #16a34a;
      padding: 4px 0;
    }
    .totals-box {
      border-top: 1.5px solid #111827;
      padding-top: 8px;
      margin-bottom: 14px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 2px 0;
      font-size: 12px;
    }
    .grand-total {
      display: flex;
      justify-content: space-between;
      background-color: #052e16;
      color: #ffffff;
      border-radius: 6px;
      padding: 8px 10px;
      margin-top: 6px;
      font-size: 16px;
      font-weight: 800;
    }
    .footer {
      text-align: center;
      border-top: 1px dashed #d1d5db;
      padding-top: 10px;
      font-size: 10px;
      color: #4b5563;
      line-height: 1.4;
    }
    .barcode {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 32px;
      margin: 10px auto;
      letter-spacing: 5px;
      font-family: monospace;
      font-size: 18px;
      font-weight: 900;
      background: repeating-linear-gradient(
        90deg,
        #111827,
        #111827 2px,
        transparent 2px,
        transparent 4px,
        #111827 4px,
        #111827 7px,
        transparent 7px,
        transparent 9px
      );
      width: 80%;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand-pill">StockPilot POS</div>
    <div class="biz-name">${businessName}</div>
    <div class="biz-info">${tradeHub}</div>
    <div class="biz-info">Tel: ${phone}</div>
  </div>

  <div class="meta-box">
    <div class="meta-row">
      <span class="meta-label">Invoice No:</span>
      <span class="meta-val" style="font-family: monospace; color: #00873a;">#${sale.invoiceNo}</span>
    </div>
    <div class="meta-row">
      <span class="meta-label">Date & Time:</span>
      <span class="meta-val">${dateStr}</span>
    </div>
    <div class="meta-row">
      <span class="meta-label">Cashier Till:</span>
      <span class="meta-val">${cashier}</span>
    </div>
    <div class="meta-row">
      <span class="meta-label">Customer:</span>
      <span class="meta-val">${sale.customerName || 'Walk-in Cash Customer'}</span>
    </div>
    <div class="meta-row">
      <span class="meta-label">Channel:</span>
      <span class="meta-val" style="text-transform: uppercase; color: #16a34a;">${sale.paymentChannel}</span>
    </div>
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th style="text-align: left;">Item Description</th>
        <th style="text-align: center;">Qty</th>
        <th style="text-align: right;">Price</th>
        <th style="text-align: right;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>

  <div class="totals-box">
    <div class="total-row">
      <span>Subtotal</span>
      <span style="font-weight: 600;">${formatNaira(sale.totalAmount)}</span>
    </div>
    ${
      sale.discountAmount > 0
        ? `
    <div class="total-row" style="color: #dc2626;">
      <span>Trade Discount</span>
      <span>-${formatNaira(sale.discountAmount)}</span>
    </div>
    `
        : ''
    }
    <div class="grand-total">
      <span>NET PAYABLE</span>
      <span>${formatNaira(sale.netPayable)}</span>
    </div>
    ${
      sale.amountTendered
        ? `
    <div class="total-row" style="margin-top: 6px;">
      <span>Amount Tendered</span>
      <span style="font-weight: 600;">${formatNaira(sale.amountTendered)}</span>
    </div>
    <div class="total-row" style="color: #059669; font-weight: 700;">
      <span>Change Returned</span>
      <span>${formatNaira(sale.changeReturned || 0)}</span>
    </div>
    `
        : ''
    }
  </div>

  <div class="barcode"></div>
  <div style="text-align: center; font-family: monospace; font-size: 11px; font-weight: bold; margin-bottom: 8px;">
    *${sale.invoiceNo}*
  </div>

  <div class="footer">
    <p style="margin: 3px 0; font-weight: 700; color: #111827;">Thank you for your patronage!</p>
    <p style="margin: 3px 0;">Goods properly sold and received in good condition cannot be returned.</p>
    <p style="margin: 6px 0 0 0; font-size: 9px; color: #9ca3af;">
      Powered by StockPilot Nigeria • Offline POS
    </p>
  </div>
</body>
</html>
  `;
}

export async function printReceipt(
  sale: SaleRecord,
  items?: ReceiptItem[],
  store?: StoreDetails
): Promise<void> {
  const html = generateReceiptHtml(sale, items, store);
  await Print.printAsync({ html });
}

export async function shareReceiptPdf(
  sale: SaleRecord,
  items?: ReceiptItem[],
  store?: StoreDetails
): Promise<string> {
  const html = generateReceiptHtml(sale, items, store);

  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return '';
  }

  const { uri } = await Print.printToFileAsync({ html });
  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Share Invoice #${sale.invoiceNo}`,
      UTI: 'com.adobe.pdf',
    });
  }
  return uri;
}

// --------------------------------------------------------------------------
// 2. Debt Payment Collection Voucher
// --------------------------------------------------------------------------

export function generatePaymentReceiptHtml(
  customer: Customer,
  amountPaid: number,
  method: string,
  remainingBalance: number,
  voucherNo?: string
): string {
  const user = getStoredUser();
  const profile = getStoreProfile();
  const businessName = profile.businessName || user?.businessName || 'StockPilot Store';
  const tradeHub = profile.marketLocation || user?.tradeHub || 'Lagos, Nigeria';
  const phone = profile.phone || user?.phone || '';
  const vNo = voucherNo || `PAY-${Math.floor(1000 + Math.random() * 9000)}`;
  const dateStr = new Date().toLocaleString('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payment Voucher ${vNo}</title>
  <style>
    @page { margin: 4mm; size: 80mm auto; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 12px;
      color: #111827;
      max-width: 340px;
      margin: 0 auto;
      box-sizing: border-box;
    }
    .header {
      text-align: center;
      margin-bottom: 12px;
      border-bottom: 2px solid #16a34a;
      padding-bottom: 8px;
    }
    .pill {
      display: inline-block;
      background-color: #16a34a;
      color: #ffffff;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .amount-box {
      background-color: #f0fdf4;
      border: 1.5px solid #16a34a;
      border-radius: 8px;
      padding: 12px;
      text-align: center;
      margin-bottom: 12px;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      margin: 4px 0;
      font-size: 11px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="pill">Official Payment Voucher</div>
    <div style="font-size: 16px; font-weight: 800; color: #021811;">${businessName}</div>
    <div style="font-size: 11px; color: #4b5563;">${tradeHub} • ${phone}</div>
  </div>

  <div class="amount-box">
    <div style="font-size: 11px; color: #166534; font-weight: 700; text-transform: uppercase;">Amount Collected</div>
    <div style="font-size: 24px; font-weight: 900; color: #15803d; margin: 4px 0;">${formatNaira(amountPaid)}</div>
    <div style="font-size: 11px; color: #166534;">Payment Method: <strong>${method.toUpperCase()}</strong></div>
  </div>

  <div style="background-color: #f9fafb; border-radius: 6px; padding: 10px; margin-bottom: 12px; font-size: 11px;">
    <div class="meta-row">
      <span style="color: #6b7280;">Voucher No:</span>
      <span style="font-family: monospace; font-weight: 700;">#${vNo}</span>
    </div>
    <div class="meta-row">
      <span style="color: #6b7280;">Date:</span>
      <span style="font-weight: 700;">${dateStr}</span>
    </div>
    <div class="meta-row">
      <span style="color: #6b7280;">Customer:</span>
      <span style="font-weight: 700;">${customer.name}</span>
    </div>
    <div class="meta-row">
      <span style="color: #6b7280;">Customer Phone:</span>
      <span>${customer.phone}</span>
    </div>
    <div class="meta-row" style="border-top: 1px dashed #d1d5db; padding-top: 6px; margin-top: 6px;">
      <span style="color: #6b7280;">Remaining Debt Balance:</span>
      <span style="font-weight: 800; color: ${remainingBalance > 0 ? '#b91c1c' : '#15803d'};">
        ${formatNaira(remainingBalance)}
      </span>
    </div>
  </div>

  <div style="text-align: center; border-top: 1px dashed #d1d5db; padding-top: 10px; font-size: 10px; color: #4b5563;">
    <p style="margin: 0; font-weight: 700;">Payment confirmed and deducted from customer ledger.</p>
    <p style="margin: 4px 0 0 0; color: #9ca3af;">StockPilot Nigeria • Merchant Credit Ledger</p>
  </div>
</body>
</html>
  `;
}

export async function printPaymentReceipt(
  customer: Customer,
  amountPaid: number,
  method: string,
  remainingBalance: number
): Promise<void> {
  const html = generatePaymentReceiptHtml(customer, amountPaid, method, remainingBalance);
  await Print.printAsync({ html });
}

export async function sharePaymentReceiptPdf(
  customer: Customer,
  amountPaid: number,
  method: string,
  remainingBalance: number
): Promise<string> {
  const html = generatePaymentReceiptHtml(customer, amountPaid, method, remainingBalance);
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return '';
  }
  const { uri } = await Print.printToFileAsync({ html });
  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Payment Voucher - ${customer.name}`,
      UTI: 'com.adobe.pdf',
    });
  }
  return uri;
}

// --------------------------------------------------------------------------
// 3. Customer Statement of Account
// --------------------------------------------------------------------------

export function generateStatementHtml(
  customer: Customer,
  transactions: SaleRecord[]
): string {
  const user = getStoredUser();
  const profile = getStoreProfile();
  const businessName = profile.businessName || user?.businessName || 'StockPilot Store';
  const tradeHub = profile.marketLocation || user?.tradeHub || 'Lagos, Nigeria';
  const phone = profile.phone || user?.phone || '';

  const rowsHtml = transactions
    .map(
      (tx) => `
      <tr>
        <td style="padding: 6px 4px; border-bottom: 1px solid #e5e7eb; font-size: 11px; font-family: monospace;">
          ${tx.invoiceNo}
        </td>
        <td style="padding: 6px 4px; border-bottom: 1px solid #e5e7eb; font-size: 11px; color: #4b5563;">
          ${new Date(tx.createdAt).toLocaleDateString('en-NG')}
        </td>
        <td style="padding: 6px 4px; border-bottom: 1px solid #e5e7eb; font-size: 11px; text-transform: uppercase;">
          ${tx.paymentChannel}
        </td>
        <td style="padding: 6px 4px; border-bottom: 1px solid #e5e7eb; font-size: 11px; text-align: right; font-weight: 700;">
          ${formatNaira(tx.netPayable)}
        </td>
      </tr>
    `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Statement - ${customer.name}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      padding: 24px;
      color: #111827;
      max-width: 650px;
      margin: 0 auto;
    }
    .header {
      border-bottom: 2px solid #16a34a;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .balance-card {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
    }
    th {
      background-color: #f3f4f6;
      font-size: 11px;
      text-transform: uppercase;
      padding: 8px 4px;
      text-align: left;
    }
  </style>
</head>
<body>
  <div class="header">
    <h2 style="margin: 0; color: #021811;">${businessName}</h2>
    <div style="font-size: 12px; color: #6b7280;">${tradeHub} • ${phone}</div>
    <h3 style="margin-top: 12px; color: #16a34a;">STATEMENT OF CREDIT ACCOUNT</h3>
  </div>

  <div class="balance-card">
    <div style="font-size: 12px; color: #374151;">Customer: <strong>${customer.name}</strong> (${customer.phone})</div>
    <div style="font-size: 12px; color: #374151;">Terms: ${customer.dueText} • Tier: ${customer.tier}</div>
    <div style="margin-top: 8px; font-size: 18px; font-weight: 800; color: ${customer.balance > 0 ? '#b91c1c' : '#15803d'};">
      Outstanding Balance: ${formatNaira(customer.balance)}
    </div>
  </div>

  <h4>Recent Trade Transactions</h4>
  <table>
    <thead>
      <tr>
        <th>Invoice</th>
        <th>Date</th>
        <th>Payment Channel</th>
        <th style="text-align: right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml || '<tr><td colspan="4" style="text-align:center; padding: 12px; color: #9ca3af;">No recent transactions recorded.</td></tr>'}
    </tbody>
  </table>

  <div style="margin-top: 30px; font-size: 10px; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 8px;">
    Generated by StockPilot Nigeria • CBN & CAC Compliant Ledger
  </div>
</body>
</html>
  `;
}

export async function shareStatementPdf(
  customer: Customer,
  transactions: SaleRecord[]
): Promise<void> {
  const html = generateStatementHtml(customer, transactions);
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Statement of Account - ${customer.name}`,
      UTI: 'com.adobe.pdf',
    });
  }
}

// --------------------------------------------------------------------------
// 4. Financial Closeout / P&L Audit Report
// --------------------------------------------------------------------------

export function generateFinancialReportHtml(
  report: FinancialReportData,
  rangeName: string
): string {
  const user = getStoredUser();
  const profile = getStoreProfile();
  const businessName = profile.businessName || user?.businessName || 'StockPilot Store';
  const tradeHub = profile.marketLocation || user?.tradeHub || 'Lagos, Nigeria';
  const dateStr = new Date().toLocaleDateString('en-NG', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>P&L Closeout Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      padding: 24px;
      color: #111827;
      max-width: 650px;
      margin: 0 auto;
    }
    .header {
      border-bottom: 2px solid #00873a;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .stat-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 20px;
    }
    .stat-card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 12px;
    }
    .stat-title { font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 700; }
    .stat-val { font-size: 20px; font-weight: 800; color: #111827; margin-top: 4px; }
  </style>
</head>
<body>
  <div class="header">
    <div style="font-size: 11px; font-weight: 800; color: #16a34a; text-transform: uppercase;">Official Financial Audit</div>
    <h2 style="margin: 2px 0; color: #021811;">${businessName}</h2>
    <div style="font-size: 12px; color: #6b7280;">${tradeHub} • Range: ${rangeName} • Generated: ${dateStr}</div>
  </div>

  <div class="stat-grid">
    <div class="stat-card" style="border-left: 4px solid #16a34a;">
      <div class="stat-title">Gross Revenue</div>
      <div class="stat-val" style="color: #166534;">${formatNaira(report.grossSales)}</div>
      <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">${report.salesCount} Completed Orders</div>
    </div>
    <div class="stat-card" style="border-left: 4px solid #059669;">
      <div class="stat-title">Landed Gross Profit</div>
      <div class="stat-val" style="color: #047857;">${formatNaira(report.grossProfit)}</div>
      <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">Margin: ${report.grossMarginPct}%</div>
    </div>
    <div class="stat-card" style="border-left: 4px solid #ef4444;">
      <div class="stat-title">Shop Expenses & Overhead</div>
      <div class="stat-val" style="color: #b91c1c;">${formatNaira(report.totalExpenses)}</div>
      <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">Generator, Union, Wages</div>
    </div>
    <div class="stat-card" style="border-left: 4px solid #3b82f6; background-color: #eff6ff;">
      <div class="stat-title">Net Take-Home Cash</div>
      <div class="stat-val" style="color: #1d4ed8;">${formatNaira(report.netTakeHome)}</div>
      <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">Net Retained Profit</div>
    </div>
  </div>

  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 20px;">
    <div style="font-size: 12px; font-weight: 700; margin-bottom: 6px;">Receivables & Credit Health</div>
    <div style="display: flex; justify-content: space-between; font-size: 12px; margin: 4px 0;">
      <span>Current Terms (Healthy):</span>
      <strong>${formatNaira(report.currentReceivables)}</strong>
    </div>
    <div style="display: flex; justify-content: space-between; font-size: 12px; margin: 4px 0; color: #d97706;">
      <span>Due Soon (< 7 Days):</span>
      <strong>${formatNaira(report.dueSoonReceivables)}</strong>
    </div>
    <div style="display: flex; justify-content: space-between; font-size: 12px; margin: 4px 0; color: #dc2626;">
      <span>Overdue (> 14 Days):</span>
      <strong>${formatNaira(report.overdueReceivables)}</strong>
    </div>
  </div>

  <div style="text-align: center; border-top: 1px dashed #d1d5db; padding-top: 12px; font-size: 10px; color: #9ca3af;">
    StockPilot Nigeria • Financial Management Engine
  </div>
</body>
</html>
  `;
}

export async function shareFinancialReportPdf(
  report: FinancialReportData,
  rangeName: string
): Promise<void> {
  const html = generateFinancialReportHtml(report, rangeName);
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `StockPilot P&L Report - ${rangeName}`,
      UTI: 'com.adobe.pdf',
    });
  }
}
