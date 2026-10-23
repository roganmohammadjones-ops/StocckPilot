# StockPilot Nigeria

<p align="center">
  <img src="./assets/images/stockpilot-logo.png" alt="StockPilot Nigeria Logo" width="220" />
</p>

<p align="center">
  <strong>Offline-First FMCG Inventory, POS Till, and Trade Credit Engine for Nigerian Open-Market Wholesalers & Distributors</strong>
</p>

<p align="center">
  <a href="https://roganmohammadjones-ops.github.io/StocckPilot"><strong>🌐 Launch Live Web App</strong></a> •
  <a href="https://github.com/roganmohammadjones-ops/StocckPilot/releases/latest"><strong>📱 Download Android APK (v1.0.8)</strong></a> •
  <a href="https://expo.dev/accounts/stockpilotng/projects/stockpilotng"><strong>⚡ EAS Project Dashboard</strong></a>
</p>

---

## 📦 Overview

**StockPilot Nigeria** is a high-performance cross-platform inventory, Point-of-Sale (POS), and customer credit management system engineered specifically for Nigeria's open-market trade hubs—including **Idumota**, **Alaba International**, **Balogun**, **Trade Fair Complex**, **Kano Dawanau**, and **Onitsha Main Market**.

Built with **Expo SDK 57**, **React Native 0.86**, **Expo Router**, **TypeScript**, and **NativeWind (Tailwind CSS)**, StockPilot operates **100% offline-first**. Merchants can ring up sales, print thermal receipts, scan carton barcodes, track customer credit ledgers, and reconcile cashier shifts with zero latency and zero dependency on constant network connectivity or grid power.

---

## ✨ Core Capabilities

- **⚡ 100% Offline-First SQLite Architecture**: Complete offline operational resilience powered by `expo-sqlite` on Android and iOS, backed by a persistent localStorage database adapter on Web. Zero lag during network blackouts or power outages.
- **🏪 Instant POS Counter Sales Till**: Lightning-fast counter checkout supporting multi-channel settlement:
  - **Cash** (with automatic balance and change calculation)
  - **Direct Bank Transfer** (with instant bank reference tagging)
  - **POS Card Terminal** (Moniepoint, OPay, Palmpay)
  - **Trade Credit / IOU** (instant posting to customer credit ledgers)
- **🔔 Automated In-App Notifications Hub**: Proactive real-time alert center for stock reorder thresholds, overdue debtor repayment dates, and daily cashier shift closing summaries.
- **🏷 Real-Time Barcode & SKU Management**: Camera-powered carton and product barcode scanning (`expo-camera`) with live search, categorization (Grains, Canned Goods, Beverages, Oils, Personal Care), cost-basis tracking, and low-stock indicators.
- **🧾 Thermal ESC/POS & PDF Receipts**: Native 58mm/80mm thermal receipt generation, digital WhatsApp receipt slips, customer payment vouchers, and full account statements via `expo-print` and `expo-sharing`.
- **⚖️ Debt Recovery & Overdue Escalation Hub**: Granular customer credit limits, aging analysis (Current, Due Soon, Overdue), and one-tap generation of tiered formal WhatsApp demand letters embedded with verified merchant settlement bank accounts.
- **🔐 Termii Carrier & WhatsApp OTP Auth**: Secure Nigerian phone verification featuring automatic carrier detection (**MTN**, **Airtel**, **Glo**, **9mobile**) and dual-channel OTP delivery via WhatsApp Business and carrier SMS.
- **🚚 Interstate Waybill & Park Dispatch**: Track cross-state consignments with dedicated waybill numbering, driver phone contacts, vehicle plate numbers, motor park loading bays (e.g., Ojota, Maza Maza, Upper Iweka), carriage/porter fees, and live loading/in-transit/delivered status updates.
- **📊 Shift Reconciliation & P&L Reporting**: End-of-day register closing with physical cash counting, variance/shortage audits, expense voucher tracking, and instant gross profit margin analytics.
- **📱 Responsive Universal Layout**: Mobile-first design that scales fluidly from compact Android smartphones to tablets, iPads, POS counter terminals, and desktop browsers.

---

## 📱 Mobile APK Download (Android)

The production Android release is packaged and verified through Continuous Native Generation (CNG) with automated signing:

- **Current Release**: `v1.0.8` (Build code `8`)
- **Package Identifier**: `com.stockpilotng.app`
- **Tagged Release APK**: **[Download StockPilot-Nigeria-v1.0.8.apk](https://github.com/roganmohammadjones-ops/StocckPilot/releases/latest)**
- **Continuous Latest APK**: **[Download StockPilot-Nigeria.apk](https://github.com/roganmohammadjones-ops/StocckPilot/releases/latest)**
- **GitHub Releases Page**: **[All Releases & Version Changelogs](https://github.com/roganmohammadjones-ops/StocckPilot/releases)**

> **Installation Note**: On Android, allow "Install from Unknown Sources" or your browser's package installer permission when prompted. The APK is pre-signed and ready for direct installation on physical smartphones and Android POS terminals.

---

## 🌐 Web App Deployment

StockPilot Nigeria is exported and deployed for instant desktop, tablet, and browser access:

- **Live Production URL**: [https://roganmohammadjones-ops.github.io/StocckPilot](https://roganmohammadjones-ops.github.io/StocckPilot)
- **EAS Web Hosting**: [https://stockpilotng.expo.app](https://stockpilotng.expo.app)
- **Automated CI/CD Pipeline**: GitHub Actions automatically compiles, signs, and bundles the Android release APK, uploads release assets, and deploys the web bundle on push to `main` via [`.github/workflows/release.yml`](./.github/workflows/release.yml).

---

## 🛠 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Core Framework** | [Expo SDK 57](https://expo.dev) (`~57.0.30`), [React Native 0.86](https://reactnative.dev) (`0.86.3`) |
| **Navigation & Routing** | [Expo Router v4](https://docs.expo.dev/router/introduction/) (`~57.0.28`, Typed file-based routing) |
| **Language & Engine** | [TypeScript](https://www.typescriptlang.org/) (Strict mode, React Compiler enabled, 0 type errors) |
| **Styling & Design** | [Tailwind CSS v3](https://tailwindcss.com/) (`^3.4.17`) via [NativeWind v4.2.7](https://www.nativewind.dev/) |
| **Local Database** | [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) (`~57.0.4`) + Web LocalStorage SQLite Adapter |
| **Cloud & Auth** | [Supabase](https://supabase.com) (`^2.118.0`, PostgreSQL, Cloud Sync) |
| **SMS & WhatsApp Gateway**| [Termii API](https://termii.com) (Nigerian Carrier SMS & WhatsApp OTP Delivery) |
| **Barcode Scanner** | [expo-camera](https://docs.expo.dev/versions/latest/sdk/camera/) (`~57.0.6`, Hardware Barcode & QR Scanning) |
| **Printing & Sharing** | [expo-print](https://docs.expo.dev/versions/latest/sdk/print/) (`~57.0.2`), [expo-sharing](https://docs.expo.dev/versions/latest/sdk/sharing/) (`~57.0.24`) |
| **Iconography** | `@expo/vector-icons` (`^15.0.2`, Material Symbols & Ionicons) |

---

## 📁 Project Structure

```text
StockPilot-Ng/
├── app/                          # Expo Router screens and routes
│   ├── (tabs)/                   # Bottom tab navigators
│   │   ├── index.tsx             # Executive dashboard & daily cash pulse
│   │   ├── sales.tsx             # Sales register & till transactions
│   │   ├── inventory.tsx         # Product catalog & stock balances
│   │   ├── customers.tsx         # Customer credit ledger & debt recovery
│   │   └── more.tsx              # Store settings, bank accounts & shortcuts
│   ├── modal/                    # Modal user flows
│   │   ├── new-sale.tsx          # POS counter till checkout modal
│   │   ├── add-product.tsx       # SKU creation & cost configuration
│   │   └── record-expense.tsx    # Cash outflow & expense voucher modal
│   ├── explore-sellers.tsx       # B2B wholesale marketplace supplier directory
│   ├── notifications.tsx         # In-app notifications & low-stock alert center
│   ├── reports.tsx               # P&L financial reports & revenue breakdown
│   ├── settings.tsx              # Store profile, market stall & settlement accounts
│   ├── login.tsx                 # Phone carrier number login
│   ├── signup.tsx                # New merchant onboarding & market registration
│   ├── otp-verify.tsx            # WhatsApp & carrier SMS OTP verification
│   └── _layout.tsx               # Root navigation stack and theme provider
├── components/                   # Modular UI components
│   ├── app-header.tsx            # Branded header with store selector & notification badge
│   ├── barcode-scanner-modal.tsx # Camera-driven SKU barcode scanner
│   ├── waybill-modal.tsx         # Interstate motor park waybill dispatch modal
│   ├── brand-logo.tsx            # Official 3D emblem with rocket arrow
│   ├── brand-loader.tsx          # Branded pulsing launch indicator
│   ├── responsive-container.tsx  # Multi-column grid wrapper
│   └── screen.tsx                # Safe-area responsive screen container
├── lib/                          # Business logic & native integrations
│   ├── db/                       # Offline SQLite schema, queries & adapters
│   │   ├── init.ts               # Schema creation and migration engine
│   │   ├── provider.tsx          # Unified SQLite/Web database React context
│   │   ├── queries.ts            # Typed database queries (sales, products, debts)
│   │   ├── types.ts              # Data contracts and entity schemas
│   │   └── web-db.ts             # Web fallback database adapter
│   ├── notifications.ts          # Alert generation (stock threshold, debt aging)
│   ├── otp.ts                    # Termii carrier detection & OTP dispatcher
│   ├── receipt.ts                # 58mm/80mm ESC/POS thermal & PDF receipts
│   ├── debt-recovery.ts          # Automated WhatsApp debt demand letter generator
│   ├── store-profile.ts          # Merchant profile & bank settlement accounts
│   └── supabase.ts               # Supabase cloud client configuration
├── scripts/                      # Build & automation scripts
│   └── build-apk.sh              # Standalone Android APK build & signing script
├── assets/                       # Vector assets, app icons, and logos
└── .github/workflows/            # GitHub Actions CI/CD pipelines
    ├── ci.yml                    # Typecheck, lint & bundle export verification
    └── release.yml               # Production APK build, signing & GitHub Releases
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

### Build Android Release APK

```bash
# Compile and sign standalone Android APK locally (JDK 17 required)
npm run build:apk

# Outputs signed APK to: build-artifacts/StockPilot-Nigeria-v1.0.7.apk
```

### Quality Verification

```bash
# TypeScript strict type checking (0 errors)
npm run typecheck

# ESLint code quality audit (0 errors)
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
