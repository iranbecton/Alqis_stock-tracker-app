# ALQIS Brand Assets

This folder is the drop zone for production ALQIS brand assets once final vector files are ready.

## Expected website/app assets

- `alqis-wordmark.svg`
- `alqis-icon.svg`
- `alqis-lockup.svg`
- `alqis-wordmark-dark.svg`
- `alqis-wordmark-light.svg`
- `alqis-icon-dark.svg`
- `alqis-icon-light.svg`
- `alqis-favicon.svg`
- `icons/icon-192.png`
- `icons/icon-512.png`
- `icons/maskable-512.png`
- `icons/apple-touch-icon.png`
- `alqis-og-image.png`

## Asset guidance

- SVG is preferred for website and app UI because it stays sharp across device densities.
- PNG fallbacks are still needed for PWA, app-store, and touch-icon surfaces.
- Master brand files should be kept separately as AI, PDF, or EPS source files.
- Do not commit private font files. Keep typography implementation in CSS or licensed delivery systems.
- Keep filenames stable so the reusable ALQIS logo component can pick up final assets without code changes.

## PWA and app shell assets

- `icons/icon-192.png`: required PWA launcher icon, 192 x 192 PNG.
- `icons/icon-512.png`: required PWA launcher icon, 512 x 512 PNG.
- `icons/maskable-512.png`: Android maskable icon, 512 x 512 PNG with safe-area padding.
- `icons/apple-touch-icon.png`: iOS home-screen icon, 180 x 180 PNG.
- `alqis-favicon.svg`: preferred browser favicon. Add `.ico` later if legacy browser support is needed.
- `alqis-og-image.png`: Open Graph/social preview image. Recommended size: 1200 x 630 PNG.
- Future iOS app icon source should be exported from the master vector at Apple-required sizes.
- Future Android adaptive icon source should include foreground and background layers from the master vector.
- Add a splash/loading logo variant when the native app shell or install splash screen is designed.

## Current implementation notes

- The app manifest and metadata already reference the expected PWA paths.
- Missing icon files will not break React UI, but browser install audits will require the PNG assets before release.
- Do not cache protected user market data offline until an explicit offline-data policy is designed.
