# AGENTS.md

## Project overview
- Expo React Native app using expo-router (`expo-router/entry`).
- Frontend-only code in `app/`, `components/`, `context/`, `lib/`.
- Environment variables loaded from `.env` (public Expo vars).

## Local development
- Install dependencies: `npm install`
- Start Expo dev server: `npx expo start`
- Android device/emulator: `npx expo start --android`
- Clear cache if env changes: `npx expo start -c`

## Conventions
- TypeScript/TSX throughout.
- Styling via `StyleSheet` and Nativewind.
- Keep logic in `lib/` and state in `context/`.

## Safety
- Do not edit `.env` directly; update `.env.example` instead.
- Avoid touching `node_modules/`.
