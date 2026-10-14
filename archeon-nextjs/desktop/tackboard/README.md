# TackBoard Desktop — Archeon

A real desktop companion rather than a Chrome/Firefox extension. A small, movable, always-on-top sticky-note board with compact layered cards and a larger expanded pinboard. Task changes sync via the existing Archeon Neon API.

## Quick start (Windows)

1. Open `archeon/archeon-nextjs/desktop/tackboard` in a terminal.
2. Install Node.js 22+ if needed.
3. Run `npm install` then `npm run dev`.
4. Click the gear icon in the companion.
5. Log in to `http://localhost:3000/app/tackboard` (for local testing) or `https://archeon.vercel.app/app/tackboard`.
6. In web TackBoard's sidebar click **Desktop companion → Generate pairing key**. The key appears once. Do not share it.
7. Select the same server in Desktop Settings, paste the key, click **Connect cloud**.
8. Check a task in the compact companion; it should appear in your web board after sync or refresh.

**No new Neon migration.** The existing `tack_sync_documents` and `tack_extension_tokens` tables are reused; `tack_extension_tokens` is an internal legacy table name, not a browser-extension dependency.

## How to use

- Compact is the default: a small stack of notes; tick tasks, click `⋯` to edit title, color, status, checklist and description. Add notes from the text input.
- `⤢` expands to a full responsive note grid; `⤡` returns to compact.
- Pin toggle keeps the window **always on top** of other desktop applications. Drag the header to position it anywhere on the screen.
- `×` hides TackBoard to the system tray. Double-click the tray icon to restore; tray → Quit fully exits.
- Note peel-off animation archives a note when all tasks are checked, or when you press the peel control. Use `▣` to view completed notes and restore.
- `☼`/`☾` switches between Archeon graphite dark and paper-light themes.
- Cloud edits are queued locally immediately and uploaded after a short debounce; normal saves don't show toast notifications. Offline edits retry in the background.
- The token is held in Electron's main process, never passed back into the UI. It is OS-encrypted where Electron safeStorage is available (on Windows, DPAPI). Without usable secure storage, pairing survives only until you exit.

## Build a Windows .exe

From this folder on Windows:

```powershell
npm install
npm test
npm run dist:win
```

This generates an installer and portable executable in `desktop/tackboard/dist/`. These developer builds are **unsigned** and Windows SmartScreen may warn. Do not bypass warnings for builds you don't trust. Sign the binaries before distributing broadly.

Alternatively, push the `desktop/tackboard` folder to GitHub and run Actions → **TackBoard Desktop (Windows)** → **Run workflow**. Download the `tackboard-desktop-windows-unsigned` artifact and extract the `.exe` files.

To enable the web download button after hosting your own installer over HTTPS, set `NEXT_PUBLIC_TACKBOARD_WINDOWS_DOWNLOAD_URL` to its full URL in Vercel's environment settings, and redeploy.

## Sync & reliability boundaries

- Same Archeon account and per-user Neon document as the browser version; no separate credentials or database.
- Conflicts: local pending edits are replayed over the latest cloud revision, preserving unrelated remote edits. If the edited note was deleted remotely, syncing halts instead of discarding edits silently. Back up the local file in Electron's userData directory before resetting.
- A single local JSON file records workspace + pending edits; this is the offline recovery copy. Do not edit it by hand.
- The companion currently uses short-interval cloud polling (14s) rather than realtime push. This is sufficient for personal use; multi-user collaboration is not enabled.
- Device tokens expire after 90 days and can be revoked on the TackBoard website. A paired device counts towards the current quota of four simultaneous device keys.
- If you click `×`, the app stays in the tray. Use tray → Quit to stop it.
- No Chrome/Firefox add-on is necessary.

## Tests / files

`src/core.cjs` — note operation model and conflict rebasing, shared with renderer through `core-browser.js`.

`src/main.cjs` — native window, tray, secure token storage, cloud API and restricted IPC.

`src/preload.cjs` — minimal context bridge.

`src/index.html`, `renderer.js`, `style.css` — compact and expanded desktop UI.

`npm test` runs pure Node model tests. A real installed Electron/Windows + Neon acceptance test is still required before release.
