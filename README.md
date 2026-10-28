# Vateko.fun

A dark music player for Windows, Android and iPhone: the whole Deezer catalog played in full through YouTube, Spotify Premium playback, Daily Mixes, synced lyrics, your own files, Discord status, a listening streak and a web dashboard.

Website and downloads: https://vateko.fun

## What is here

| Folder | What it is |
|---|---|
| `Programa/` | Windows app (Electron). `npm run dist` builds the installer; `build/setup-ui/` is the custom setup window (C#, .NET Framework 4.8). |
| `Mobile/` | Phone app (Capacitor): Android APK and the iPhone web app. |
| `website/` | vateko.fun: landing page, login, dashboard (streak, top listeners, profile). Deployed as a Cloudflare Worker. |
| `Programa/supabase.sql` | Database schema (accounts, listening streak, devices, avatars). |

## Run the Windows app

1. Copy `Programa/*.example.json` to the same names without `.example` and fill in your own Supabase project, Spotify Client ID and Discord app ID.
2. Put `yt-dlp` in `Programa/bin/yt-dlp/` for full songs.
3. `cd Programa`, `npm install`, `npm start`.

Optional: `VATEKO_SERVER_URL` and `VATEKO_SERVER_KEY` point the app at your own song-resolving server when local yt-dlp fails.

## License

MIT
