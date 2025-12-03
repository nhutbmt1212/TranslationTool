import { Tray, Menu, nativeImage, app } from 'electron';
import { PATHS } from './constants.js';
import { getMainWindow, setQuitting } from './windowManager.js';
import {
  showPopupAtCursor,
  startSelectionMonitoring,
  stopSelectionMonitoring,
  isMonitoringActive,
} from './textSelectionPopup.js';

let tray: Tray | null = null;

export function createTray(): Tray {
  let trayIcon: Electron.NativeImage = nativeImage.createEmpty();

  for (const iconPath of PATHS.iconPaths) {
    try {
      const icon = nativeImage.createFromPath(iconPath);
      if (!icon.isEmpty()) {
        trayIcon = icon;
        break;
      }
    } catch {
      continue;
    }
  }

  tray = new Tray(trayIcon);
  tray.setToolTip('DALIT - Translation Tool');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open DALIT',
      click: () => {
        const mainWindow = getMainWindow();
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    {
      label: 'Screen Capture (Ctrl+Shift+0)',
      accelerator: 'CommandOrControl+Shift+0',
      click: () => {
        const mainWindow = getMainWindow();
        mainWindow?.webContents.send('trigger-screen-capture');
      },
    },
    {
      label: 'Quick Translate (Ctrl+Shift+C)',
      accelerator: 'CommandOrControl+Shift+C',
      click: () => {
        showPopupAtCursor();
      },
    },
    { type: 'separator' },
    {
      label: 'Auto Translate on Copy',
      type: 'checkbox',
      checked: true,
      click: (menuItem) => {
        if (menuItem.checked) {
          startSelectionMonitoring();
        } else {
          stopSelectionMonitoring();
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        setQuitting(true);
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    const mainWindow = getMainWindow();
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  return tray;
}
