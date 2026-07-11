# Vitality Prep

A bilingual (German / Persian) iOS meal-prep app built with **Expo** + **React Native**.
Designed to work on Windows — you do **not** need a Mac to run or test it.

![Vitality Prep](./design/code.html)

## Features

- **3 seed recipes** out of the box (Persian Saffron Chicken, Lemon Salmon Quinoa Bowl, Mediterranean Chickpea Bowl)
- **Add your own recipes** through an in-app form (name, image, calories, prep time, macros, ingredients, steps)
- Each recipe shows **exact calories** and protein/carb/fat macros
- Tap the basket icon next to any ingredient (or "Alle zur Liste") to push it to the **shopping list**
- **Shopping list** with check / uncheck, "clear checked" and "clear all" — perfect to use in the store
- **One-button language toggle** between Deutsch (DE) and فارسی (FA), with RTL-aware layout and the Vazirmatn font for Persian
- Recipes, the planner, and the shopping list sync through Firestore for two enrolled users; language preference stays on the device

## Tech stack

- Expo SDK 54 with the new architecture enabled
- TypeScript, file-based routing via `expo-router`
- Zustand state with Firestore real-time synchronization and Firebase Storage images
- Passkey / Face ID authentication through the Vercel API routes
- `@expo-google-fonts` (Plus Jakarta Sans, Inter, Vazirmatn)
- `@expo/vector-icons` Material Icons
- `expo-image` for fast remote image loading
- Reanimated v4 + `react-native-worklets` for the language-toggle slider

## Prerequisites (Windows)

1. Install **Node.js 22 LTS** (22.12 or newer) from <https://nodejs.org/>
2. Install the **Expo Go** app on your iPhone from the App Store
3. Make sure your iPhone and your Windows PC are on the **same Wi-Fi network**

That's it. No Xcode, no Mac required for development.

## Setup

```powershell
cd c:\Projects\MealPrep
npm install
npx expo start
```

A QR code will appear in the terminal.

- **iPhone:** open the Camera app, point it at the QR code, tap the banner that appears — Expo Go will launch with your app
- **Optional Android phone:** install Expo Go and scan the QR with it
- **Optional browser preview:** press `w` in the Expo terminal (some native features behave differently on web)

## Common commands

| Task | Command |
| --- | --- |
| Start dev server | `npm run start` |
| Type-check | `npm run typecheck` |
| Run data-integrity tests | `npm test` |
| Validate frontend, API, and web build | `npm run check` |
| Force iOS QR target | `npm run ios` |
| Run on Android emulator | `npm run android` |

## Project structure

```
MealPrep/
├── app/                      # File-based routes (expo-router)
│   ├── _layout.tsx           # Root layout, fonts, splash
│   ├── (tabs)/
│   │   ├── _layout.tsx       # Bottom tab bar
│   │   ├── index.tsx         # Recipes list (home)
│   │   ├── list.tsx          # Shopping list
│   │   └── profile.tsx       # Settings: language, reset data
│   ├── recipe/
│   │   ├── [id].tsx          # Recipe detail (matches design)
│   │   └── new.tsx           # Add-recipe form (modal)
│   └── +not-found.tsx
├── src/
│   ├── components/           # AppHeader, IngredientRow, MacroBox, …
│   ├── data/recipes.ts       # The 3 seed recipes (bilingual)
│   ├── hooks/useTranslation.ts
│   ├── i18n/                 # de.ts, fa.ts, index.ts
│   ├── store/                # zustand stores: settings, recipes, shopping
│   ├── theme/                # colors, spacing, typography
│   └── types/index.ts
├── design/                   # Original HTML/MD design reference
├── app.json
├── package.json
└── tsconfig.json
```

## How the language toggle works

- The pill labelled `DE | FA` in the top app bar (also surfaced on the Profile tab) calls `useSettings().toggleLocale()`.
- All UI strings are looked up via `useTranslation().t(key)` against `src/i18n/de.ts` and `src/i18n/fa.ts`.
- All recipe content is stored as `{ de, fa }` and read via `tr(value)`.
- For RTL, components conditionally use `flexDirection: 'row-reverse'`, `textAlign: 'right'`, and `writingDirection: 'rtl'`. The app does **not** call `I18nManager.forceRTL`, so the toggle is instant — no reload.

## Building a real .ipa from Windows

When you're ready to ship a real `.ipa`:

```powershell
npm install -g eas-cli
npx eas login
npx eas build --platform ios --profile preview
```

EAS Build runs the iOS build in the cloud, so you still don't need a Mac. You'll need an Apple Developer account ($99/year) to install on a physical device outside of Expo Go.

## Adding more recipes

- **In-app:** Tap the green `+` floating button on the Recipes tab.
- **In code:** Append a `Recipe` object to `src/data/recipes.ts` (both `de` and `fa` strings). Seeds are written when the shared recipe collection is first initialized.

## Resetting state

Profile tab → "Eigene Rezepte zurücksetzen" removes recipes created by the signed-in user. "Einkaufsliste leeren" clears the shared shopping list for both users.

## Why `.npmrc` and `package.json` `overrides` exist

In June 2026 a batch of `@babel/*@7.29.7` packages were published with broken transitive references to `@babel/helper-plugin-utils@^7.29.7` (which was never published). The long `overrides` block in `package.json` pins those packages to the last known-good 7.x versions so `npm install` resolves. `.npmrc` sets `legacy-peer-deps=true` because Expo Router 6's React Server transitive peer is slightly newer than the React pinned by Expo SDK 54. Once Babel republishes the missing helper, both workarounds can safely be removed.
