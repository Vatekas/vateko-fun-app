# Vateko.fun mobile

Phone version of the desktop player (`Programa/`). One web UI, two ways to ship it:

- **Android**: Capacitor shell around `www/` → `Vateko.fun.apk`. Installable from vateko.fun.
- **iPhone**: the same `www/` as a web app at `https://vateko.fun/app/`, added to the home screen from Safari. Free, no App Store.

The desktop app is untouched. Accounts and the listening streak use the same Supabase project and RPCs (`add_listening`, `touch_device`, `my_status`) as `Programa/cloud.js`.

## Layout

| Path | What |
| --- | --- |
| `www/login.html`, `login.js` | Copied from `Programa/` (same sign-in and sign-up screen). Only the CSP and script tags changed. |
| `www/ban.js` | Copied unchanged: the blocked-account card. |
| `www/api.js` | Replaces `Programa/preload.js` for the phone: the same `window.api` names, same Supabase calls as `cloud.js`. |
| `www/bar.html`, `phone.js`, `phone.css` | Phone UI: Home (Daily Mixes, charts, recent), Search, Library, Settings, mini and full player. |
| `www/sw.js`, `manifest.webmanifest` | Web app shell for the iPhone home screen. |
| `capacitor.config.json` | Capacitor config (`webDir: www`). |
| `android/` | Generated Android project (`npx cap add android`). |

## Playback

The desktop app plays full songs through yt-dlp. yt-dlp needs a PC, so it does not run on a phone. The phone plays **Deezer 30-second previews** (public API, no key, free and legal). Full songs stay desktop-only.

Trade-offs:
- A full-song path on the phone needs a server that runs yt-dlp (paid hosting or your PC online 24/7). Not built.
- Spotify's Web Playback SDK does not run in phone browsers. Not used on the phone.
- Background playback (screen off, app switched) is not implemented. Needs a media-session plugin and a native audio service.

## Build the Android APK

Needs JDK 21 and the Android SDK (platform 36, build-tools). Commands from `Mobile/`:

```bash
npm install
npx cap sync android
cd android
gradlew.bat assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk`, copy it to `_web/vateko/downloads/Vateko.fun.apk`.

Release signing: keep the keystore and its passwords safe (outside the repo). Losing the key means Android users cannot update the app over the old install.

## Deploy the iPhone web app

Copy `www/` to `_web/vateko/app/` (exclude `_preview_bar.html` and `_stub.js`), then redeploy the site as in the site notes.

## Known limits

- Android: foreground playback only (see above).
- iOS web app: localStorage (the sign-in) can be cleared by iOS after long unused periods.
- Android back button leaves the app (no in-app history stack).
- Android: needs an up-to-date Android System WebView (Chrome 103 or newer). Older WebViews break search and charts.
- iOS: Safari 16 or newer.
