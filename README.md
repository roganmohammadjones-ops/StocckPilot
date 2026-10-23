# StockPilot Nigeria

<p align="center">
  <img src="./assets/images/stockpilot-logo.png" alt="StockPilot Nigeria Logo" width="220" />
</p>

<p align="center">
  <strong>Offline-First FMCG Inventory, POS Till, and Trade Credit Engine for Nigerian Open-Market Wholesalers & Distributors</strong>
</p>

<p align="center">
  <a href="https://roganmohammadjones-ops.github.io/StocckPilot"><strong>🌐 Launch Live Web App</strong></a> •
  <a href="https://github.com/roganmohammadjones-ops/StocckPilot/releases/latest"><strong>📱 Download Android APK (v1.0.7)</strong></a> •
  <a href="https://expo.dev/accounts/stockpilotng/projects/stockpilotng"><strong>⚡ EAS Project Dashboard</strong></a>
</p>

---

## 📦 Overview

**StockPilot Nigeria** is a high-performance cross-platform inventory, Point-of-Sale (POS), and customer credit management system engineered specifically for Nigeria's open-market trade hubs—including **Idumota**, **Alaba International**, **Balogun**, **Trade Fair Complex**, **Kano Dawanau**, and **Onitsha Main Market**.

Built with **Expo SDK 57**, **React Native 0.86**, **Expo Router**, **TypeScript**, and **NativeWind (Tailwind CSS)**, StockPilot operates **100% offline-first**. Merchants can ring up sales, print thermal receipts, scan carton barcodes, track customer credit ledgers, and reconcile cashier shifts with zero latency and zero dependency on constant network connectivity or grid power.

---

## ✨ Core Capabilities

- **⚡ Offline-First SQLite Architecture**: 100% offline resilience powered by `expo-sqlite` on Android/iOS and a high-performance database adapter on Web. Zero lag during network drops or power outages.
- **🏪 Instant POS Sales Register**: Lightning-fast till checkout supporting multi-channel settlement:
  - **Cash** (with automatic change calculation)
  - **Direct Bank Transfer** (with instant bank reference tagging)
  - **POS Card Terminal** (Moniepoint, OPay, Palmpay)
  - **Trade Credit / IOU** (instant posting to debtor ledgers)
- **🏷 Real-Time Barcode & SKU Management**: Camera-powered carton and product barcode scanning (`expo-camera`) with live search, categorization (Grains, Canned Goods, Beverages, Oils, Personal Care), cost-basis tracking, and low-stock alerts.
- **🧾 Thermal ESC/POS & PDF Receipts**: Native 58mm/80mm thermal receipt generation, digital WhatsApp receipt slips, customer payment vouchers, and full account statements via `expo-print` and `expo-sharing`.
- **💳 Debt Recovery & Credit Ledger**: Granular customer credit limits, aging analysis (Current, Due Soon, Overdue), and one-tap generation of formal WhatsApp demand letters embedded with verified merchant settlement bank accounts.
- **🔐 Termii Carrier & WhatsApp OTP Auth**: Secure Nigerian phone verification featuring automatic carrier detection (**MTN**, **Airtel**, **Glo**, **9mobile**) and dual-channel OTP delivery via WhatsApp Business and carrier SMS.
- **📊 Shift Reconciliation & P&L Reporting**: End-of-day register closing with physical cash counting, variance/shortage audits, expense voucher tracking, and instant gross profit margin analytics.
- **📱 Responsive Universal Layout**: Mobile-first design that scales fluidly from compact Android smartphones to tablets, iPads, POS counter terminals, and desktop browsers.

---

## 📱 Mobile APK Download (Android)

The production Android release is packaged and verified through Continuous Native Generation (CNG):

- **Latest Version**: `v1.0.7` (Build code `7`)
- **Package Identifier**: `com.stockpilotng.app`
- **Direct APK Download**: [Download StockPilot-Nigeria-v1.0.7.apk](https://github.com/roganmohammadjones-ops/StocckPilot/releases/latest)
- **All Releases & Changelogs**: [GitHub Releases Page](https://github.com/roganmohammadjones-ops/StocckPilot/releases)

> **Installation Note**: On Android, allow "Install from Unknown Sources" or your browser's package installer permission when installing the standalone APK.

---

## 🌐 Web App Deployment

StockPilot Nigeria is exported and deployed for instant desktop and browser access:

- **Live Production URL**: [https://roganmohammadjones-ops.github.io/StocckPilot](https://roganmohammadjones-ops.github.io/StocckPilot)
- **EAS Web Hosting**: [https://stockpilotng.expo.app](https://stockpilotng.expo.app)
- **CI/CD Pipeline**: Automated Android APK compilation and GitHub Pages deployment on push to `main` via [`.github/workflows/release.yml`](./.github/workflows/release.yml).

---

## 🛠 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Core Framework** | [Expo SDK 57](https://expo.dev), [React Native 0.86](https://reactnative.dev) |
| **Navigation & Routing** | [Expo Router v4](https://docs.expo.dev/router/introduction/) (Typed file-based routes) |
| **Language & Engine** | [TypeScript 5.9](https://www.typescriptlang.org/) (Strict typing, 0 errors, React Compiler enabled) |
| **Styling & Design** | [Tailwind CSS v3](https://tailwindcss.com/) via [NativeWind v4.2.7](https://www.nativewind.dev/) |
| **Local Database** | [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) (Native SQLite) + Web LocalStorage Adapter |
| **Cloud & Auth** | [Supabase](https://supabase.com) (PostgreSQL, Remote Sync) |
| **SMS & WhatsApp Gateway**| [Termii API](https://termii.com) (Nigerian Carrier SMS & WhatsApp OTP Delivery) |
| **Barcode Scanner** | [expo-camera](https://docs.expo.dev/versions/latest/sdk/camera/) (Hardware Barcode & QR Scanning) |
| **Printing & Sharing** | [expo-print](https://docs.expo.dev/versions/latest/sdk/print/), [expo-sharing](https://docs.expo.dev/versions/latest/sdk/sharing/) (Thermal & PDF Vouchers) |
| **Iconography** | `@expo/vector-icons` (Material Symbols & Ionicons) |

---

## 📁 Project Structure

```text
StockPilot-Ng/
├── app/                      # Expo Router screens and navigation
│   ├── (tabs)/               # Bottom tab navigation
│   │   ├── index.tsx         # Executive dashboard & daily cash pulse
│   │   ├── sales.tsx         # Sales register & till transactions
│   │   ├── inventory.tsx     # Product catalog & stock balances
│   │   ├── customers.tsx     # Customer credit ledger & debt recovery
│   │   └── more.tsx          # Store settings, accounts & shortcuts
│   ├── modal/                # Modal workflows
│   │   ├── new-sale.tsx      # POS counter till checkout modal
│   │   ├── add-product.tsx   # SKU creation & cost configuration
│   │   └── record-expense.tsx# Cash outflow & expense voucher modal
│   ├── explore-sellers.tsx   # B2B wholesale marketplace supplier directory
│   ├── reports.tsx           # P&L financial reports & revenue breakdown
│   ├── settings.tsx          # Store profile, market stall & bank accounts
│   ├── login.tsx             # Phone number carrier login
│   ├── signup.tsx            # New merchant onboarding & market registration
│   ├── otp-verify.tsx        # WhatsApp & SMS OTP verification
│   └── _layout.tsx           # Root navigation stack and global styling
├── components/               # Modular UI components
│   ├── app-header.tsx        # Branded header with store selector & profile
│   ├── barcode-scanner-modal.tsx # Camera-driven SKU barcode scanner
│   ├── brand-logo.tsx        # Official 3D emblem with rocket arrow
│   ├── brand-loader.tsx      # Branded pulsing launch indicator
│   └── responsive-container.tsx  # Multi-column grid wrapper
├── lib/                      # Business logic & native integrations
│   ├── db/                   # Offline SQLite schema, queries & adapters
│   ├── otp.ts                # Termii carrier detection & OTP dispatcher
│   ├── receipt.ts            # 58mm/80mm ESC/POS thermal & PDF receipts
│   ├── debt-recovery.ts      # Automated WhatsApp debt demand generator
│   ├── store-profile.ts      # Merchant profile & bank settlement accounts
│   └── supabase.ts           # Supabase client configuration
└── assets/                   # Vector assets, app icons, and logos
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) (v22 LTS or higher recommended)
- [npm](https://npmjs.com) (packaged with Node.js)
- [Expo Go](https://expo.dev/go) (SDK 57 compatible client for mobile testing)

### Installation

```bash
# Clone the repository
git clone https://github.com/roganmohammadjones-ops/StocckPilot.git
cd StocckPilot

# Install locked dependencies
npm ci

# Start the Expo Metro development server
npm start
```

### Run on Platforms

```bash
# Run in Web Browser
npm run web

# Run on Android Emulator or connected physical device
npm run android

# Run on iOS Simulator (macOS & Xcode required)
npm run ios
```

### Quality Verification

```bash
# TypeScript strict type checking (0 errors)
npm run typecheck

# ESLint code quality audit
npm run lint

# Check SDK package compatibility
npm run check:dependencies

# Expo project health diagnostic
npm run doctor

# Production web bundle export
npm run export:web
```

---

## 🏦 Market Corridors Supported

StockPilot Nigeria comes preconfigured with trade profiles, market union customs, and carrier routing optimized for:

- **Idumota & Balogun Markets** (Lagos Island FMCG Wholesale)
- **Alaba International Market** (Ojo Electronics & Distribution)
- **Trade Fair Complex / ASPAMDA** (Badagry Expressway)
- **Onitsha Main Market** (Anambra State Commercial Hub)
- **Kano Dawanau Grain Market** (West African Grains & Staples Hub)
- **Bodija & Dugbe Markets** (Ibadan Commercial Centers)

---

## 📄 License & Attribution

- **StockPilot Nigeria** © 2026. All rights reserved.
- Engineered for commercial retailers, wholesalers, and FMCG trade distributors across Nigeria.
