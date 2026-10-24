# VoltTrack Lite

VoltTrack Lite is a small Electron desktop demonstration for comparing monthly electricity meter readings. It calculates consumption, applies a clear threshold rule, displays a basic risk score, can export a JSON report, and shows a native desktop notification when a result is flagged for review.

This is a basic demonstration system. A flagged result only suggests further investigation; it does not prove electricity theft. No data is sent to a server or saved automatically.

## Requirements

- Node.js 18 or newer
- npm

## Install and run

```sh
npm install
npm start
```

## How the demonstration rule works

Monthly consumption is the current reading minus the previous reading. Consumption above 300 kWh is flagged for review. The risk score is a simple illustrative score from 0 to 100; it is not a validated risk model.

## Electron structure

- `src/main.js` creates the `BrowserWindow`, performs the reading analysis, opens the native save dialog, and shows desktop notifications.
- `src/preload.js` exposes only the required methods through `contextBridge`.
- `src/renderer.js` handles form interaction and presents analysis results.
- `src/index.html` and `src/styles.css` define the interface.

The window uses `contextIsolation: true` and `nodeIntegration: false`. The renderer uses `ipcRenderer.invoke()` through the preload bridge, with `ipcMain.handle()` handlers in the main process.
