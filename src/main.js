const { app, BrowserWindow, dialog, ipcMain, Notification } = require('electron');
const path = require('node:path');
const fs = require('node:fs/promises');

function createWindow() {
  const window = new BrowserWindow({
    width: 960,
    height: 760,
    minWidth: 680,
    minHeight: 620,
    title: 'VoltTrack Lite',
    backgroundColor: '#f4f7fb',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  window.loadFile(path.join(__dirname, 'index.html'));
}

function analyzeReadings(input) {
  const meterId = typeof input?.meterId === 'string' ? input.meterId.trim() : '';
  const previous = Number(input?.previousReading);
  const current = Number(input?.currentReading);

  if (!meterId || meterId.length > 50) {
    throw new Error('Enter a meter ID (up to 50 characters).');
  }
  if (!Number.isFinite(previous) || !Number.isFinite(current) || previous < 0 || current < 0) {
    throw new Error('Enter valid, non-negative meter readings.');
  }
  if (current < previous) {
    throw new Error('The current reading must be at least as high as the previous reading.');
  }

  const consumption = current - previous;
  // Demonstration rule: flag monthly consumption above 300 kWh.
  const unusuallyHigh = consumption > 300;
  const score = unusuallyHigh
    ? Math.min(100, Math.round(50 + Math.max(0, consumption - 300) / 10))
    : Math.min(49, Math.round(consumption / 10));

  return {
    meterId,
    previousReading: previous,
    currentReading: current,
    consumption,
    riskScore: score,
    status: unusuallyHigh ? 'investigate' : 'normal',
    analyzedAt: new Date().toISOString()
  };
}

ipcMain.handle('meter:analyze', (_event, input) => analyzeReadings(input));

ipcMain.handle('report:export', async (_event, report) => {
  if (!report || typeof report !== 'object' || !['normal', 'investigate'].includes(report.status)) {
    throw new Error('Analyze a meter before exporting a report.');
  }

  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Export VoltTrack report',
    defaultPath: `volttrack-${String(report.meterId).replace(/[^a-z0-9_-]/gi, '_')}.json`,
    filters: [{ name: 'JSON report', extensions: ['json'] }]
  });
  if (canceled || !filePath) return { canceled: true };

  await fs.writeFile(filePath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return { canceled: false, filePath };
});

ipcMain.handle('notification:high-risk', (_event, meterId) => {
  if (!Notification.isSupported()) return { shown: false };
  new Notification({
    title: 'VoltTrack Lite: review suggested',
    body: `Meter ${String(meterId).slice(0, 50)} has unusually high consumption. Review the readings.`
  }).show();
  return { shown: true };
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
