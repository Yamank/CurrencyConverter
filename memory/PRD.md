# Currency Converter — PRD

## Overview
A premium-feel mobile currency converter built with Expo (React Native) + FastAPI + MongoDB. Inspired by a clean reference UI but elevated with a fintech aesthetic, dark/light themes, smooth interactions, and richer features.

## Goals
- Convert between 150+ world currencies with live mid-market rates.
- Look and feel "cooler" than the reference (depth, motion, themes, charts).
- Be publishable to GitHub, Google Play, and Apple App Store.

## Tech Stack
- **Frontend**: Expo SDK 54, expo-router (tabs + modal), TypeScript, react-native-svg, AsyncStorage, expo-haptics, @expo/vector-icons.
- **Backend**: FastAPI + Motor (MongoDB).
- **Rates source**: open.er-api.com (latest, 150+ currencies) + Frankfurter (timeseries history); synthesized fallback for unsupported pairs.

## Features
1. **Convert tab**: Custom keypad (0-9, ., CE, ⌫), dual currency cards with flags, animated swap button, live exchange rate, last-updated timestamp + offline indicator, manual "Update rates" link.
2. **Compare tab**: One amount → multiple favorite currencies at once. Favorite star to pin, add-currency button.
3. **Trends tab**: 7D / 1M / 3M / 1Y line chart of selected pair, percent-change pill, plus full conversion History (auto-saved, deletable).
4. **Settings tab**: Light / Dark / Auto theme toggle, last update info, manual refresh, GitHub link.
5. **Currency picker modal**: Searchable list of 150+ currencies (code + country name + flag), favorite star, current selection check.
6. **Offline cache**: AsyncStorage caches currencies and last rates; backend cache TTL 30 min.
7. **Haptic feedback** on keypad press (mobile only).

## API (all under `/api`)
- `GET /currencies` — list of supported currencies
- `GET /rates/latest?base=USD&force=` — latest rates
- `GET /rates/timeseries?base&target&days` — historical
- `POST/GET/DELETE /history` — conversion history CRUD
- `POST/GET /favorites`, `DELETE /favorites/{code}` — favorites

## Smart Business Enhancement
The History + Trends combo feeds future engagement: power users who travel/freelance can pin pairs they care about and watch trends, increasing retention. The free open API choice keeps unit-cost at zero, so the app is App-Store-ready without backend cost.

## Publishing
- **GitHub**: use Save to GitHub from Emergent.
- **Play Store / App Store**: use Emergent's Publish (top-right) — no EAS setup needed.

## Status
MVP COMPLETE — 14/14 backend tests passed, frontend e2e flows verified by testing agent.
