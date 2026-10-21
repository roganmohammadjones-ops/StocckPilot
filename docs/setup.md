# StockPilot Nigeria — Setup Record

Foundation setup record and validation report for StockPilot Nigeria, an inventory and credit management mobile application built with Expo SDK 57, TypeScript, Expo Router, and NativeWind 4.2.7.

---

## 1. Environment & Package Versions

- **Node.js**: v24.21.0 LTS
- **npm**: 11.19.0
- **Expo SDK**: 57.0.30 (`~57.0.30`)
- **React**: 19.2.3
- **React Native**: 0.86.3
- **Expo Router**: ~57.0.28
- **NativeWind**: 4.2.7
- **Tailwind CSS**: ^3.4.17
- **TypeScript**: ~6.0.3
- **Package Manager**: npm with committed `package-lock.json`

---

## 2. Setup Commands Executed

1. **Expo Skills Installation**:
   ```bash
   npx skills add expo/skills
   ```
   Installed 25+ official Expo skills in `.agents/skills/` and generated `skills-lock.json`.

2. **Dependency Configuration & Installation**:
   - Pinned `nativewind: 4.2.7` in `dependencies`.
   - Pinned `tailwindcss: ^3.4.17` in `devDependencies`.
   - Installed `expo-font: ~57.0.4` as required peer dependency for `@expo/vector-icons`.
   - Pinned `eslint-config-expo: ~57.0.2` and `eslint`.
   ```bash
   npm install
   ```
   Locked all 872 audited dependencies in `package-lock.json`.

3. **NativeWind Configuration**:
   - Configured `tailwind.config.js` with `nativewind/preset` and content scanning for `app/`, `components/`, `features/`, `hooks/`, `lib/`.
   - Configured `metro.config.js` with `withNativeWind(config, { input: './global.css' })`.
   - Configured `babel.config.js` with `jsxImportSource: 'nativewind'` and `'nativewind/babel'`.
   - Configured `nativewind-env.d.ts` with type references and wildcard CSS module declarations.
   - Imported `../global.css` in root `app/_layout.tsx`.

---

## 3. Validation Results

All checks were executed and verified locally:

| Check | Command | Result | Notes |
|---|---|---|---|
| **TypeScript Typecheck** | `npm run typecheck` (`tsc --noEmit`) | **Passed (0 errors)** | Full project compiled without any TypeScript errors. |
| **ESLint** | `npm run lint` (`eslint .`) | **Passed (0 errors)** | Zero syntax or formatting errors across all screens and components. |
| **Dependency Doctor** | `npx expo-doctor` | **Passed (1 advisory)** | Resolved peer dependency `expo-font`. Reported Xcode 15.2 vs >=26.4 local mismatch (handled via EAS cloud builds / Expo Go). |
| **Dependency Check** | `npx expo install --check` | **Passed** | All dependencies matched SDK 57 bundled modules. |
| **Multi-Platform Bundler Export** | `npm run export:all` (`expo export --platform all`) | **Passed** | Built and exported Metro bundles for iOS, Android, and Web (`dist/`) successfully. |

---

## 4. Folder Structure

```text
app/                     Expo Router file-based screens and navigation
  (tabs)/                Main bottom tab navigator (Home, Sales, Inventory, Customers, More)
  modal/                 Modal screens (e.g. new-sale)
  _layout.tsx            Root native stack layout with global CSS import
  index.tsx              Landing screen
  setup-check.tsx        NativeWind and navigation smoke-test screen
  +not-found.tsx         Unknown route handler
components/              Reusable UI components (Screen, AppHeader, AppIcon, etc.)
features/                Feature domain modules
  inventory/             Future inventory workflows
  sales/                 Future sales workflows
  customers/             Future customer and credit workflows
  reports/               Future reports workflows
lib/                     Shared utilities (formatting, theme, constants)
hooks/                   Reusable React hooks
types/                   TypeScript types
assets/                  Images, adaptive icons, and fonts
.agents/skills/          Official Expo developer skills
docs/                    Setup documentation and validation reports
```

---

## 5. Starting the Project

```bash
# Start development server
npm start

# Clear cache if changing Babel/Metro/NativeWind configuration
npx expo start --clear

# Run on specific platforms
npm run android   # Android emulator or connected device
npm run ios       # iOS simulator (macOS)
npm run web       # Browser
```

---

## 6. Environment Limitations & Notes

1. **Local iOS Native Compilation**:
   Local Xcode is version 15.2.0. Full local native builds (`npx expo run:ios`) for SDK 57 require newer Xcode tooling. Use **Expo Go** for local development or **EAS Build** (`eas build --platform ios`) in the cloud for native binaries.
2. **Offline Telemetry in Restricted Environments**:
   When running Expo CLI commands in sandboxed environments without access to home directory `~/.expo`, pass `__UNSAFE_EXPO_HOME_DIRECTORY="$PWD/.expo"` and `EXPO_NO_TELEMETRY=1`.
