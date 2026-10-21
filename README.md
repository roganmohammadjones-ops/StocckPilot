# StockPilot Nigeria

A minimal mobile foundation for inventory and credit management for Nigerian wholesalers and retailers. Built with Expo SDK 57, TypeScript, Expo Router and NativeWind 4.2.7.

## Run locally

Use Node.js 24 LTS and npm. Dependencies are locked in `package-lock.json`.

```sh
npm ci
npm start
```

Open the QR code in an SDK 57-compatible Expo Go client. Alternatively:

```sh
npm run web      # Browser
npm run android  # Android emulator / connected device
npm run ios      # iOS simulator (macOS, Xcode and a simulator runtime required)
```

After changing Babel, Metro or NativeWind configuration, restart with `npx expo start --clear`.

## Structure

```text
app/                 Expo Router routes and navigation only
  _layout.tsx        Root native stack and global CSS import
  index.tsx          Minimal landing screen
  setup-check.tsx    NativeWind and navigation smoke-test screen
  +not-found.tsx     Unknown-route recovery
components/          Reusable UI; Screen handles scrolling and bottom safe area
features/
  inventory/         Future inventory feature
  sales/             Future sales feature
  customers/         Future customer and credit feature
  reports/           Future reporting feature
lib/                 Shared utilities and integrations
hooks/               Reusable React hooks
types/               Shared TypeScript types
assets/              Images, fonts and icons
.agents/skills/      Installed official Expo skills
docs/                Setup record and validation results
```

The empty feature folders are intentional. No inventory, sales, customer, credit, authentication, storage, or reporting workflows are implemented. The amount on the check screen is a static styling sample. The counter resets when its screen unmounts. App icons remain Expo template placeholders. The starter uses a light appearance.

## Styling

Follow the [official NativeWind v4 installation guide](https://www.nativewind.dev/docs/getting-started/installation). NativeWind 4.2.7 supports SDK 57 and uses Tailwind 3. Configuration lives in `tailwind.config.js`, `global.css`, `babel.config.js`, `metro.config.js`, and `nativewind-env.d.ts`.

Add complete literal utility classes in `app/`, `components/`, or `features/`. If UI is added in another folder, include it in Tailwind's `content` list. Keep the global CSS import in the root layout. Do not mix in NativeWind 5 / Tailwind 4 instructions.

## Checks

```sh
npm run typecheck
npm run lint
npm run check:dependencies
npm run doctor
npm run export:all
```

Open **Open foundation check** from the home screen. Confirm the card is green, increment the counter to turn it blue, and use **Return to home** or the stack back button. A direct `/setup-check` URL should also load. An unknown path should offer a home link.

See [the setup record](docs/setup.md) for exact versions, executed setup commands, validation evidence, and environment limitations. Keep SDK 57 until an upgrade is explicitly agreed. Install new packages with `npx expo install <package>`.
