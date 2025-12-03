import { BrowserWindow, screen } from 'electron';
import { PATHS, WINDOW_CONFIG, IS_DEV } from './constants.js';

let mainWindow: BrowserWindow | null = null;
let isQuitting = false;

export const getMainWindow = () => mainWindow;
export const setQuitting = (value: boolean) => { isQuitting = value; };
export const getIsQuitting = () => isQuitting;

export function createMainWindow(): BrowserWindow {
  const { workArea } = screen.getPrimaryDisplay();
  const desiredWidth = Math.floor(workArea.width * 0.65);
  const desiredHeight = Math.floor(workArea.height * 0.8);

  mainWindow = new BrowserWindow({
    width: desiredWidth,
    height: desiredHeight,
    minWidth: WINDOW_CONFIG.minWidth,
    minHeight: WINDOW_CONFIG.minHeight,
    icon: PATHS.icon,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: PATHS.preload,
      ...(IS_DEV && { partition: 'persist:dev', cache: false }),
    },
    titleBarStyle: 'default',
    backgroundColor: WINDOW_CONFIG.backgroundColor,
    show: false,
    autoHideMenuBar: true,
  });

  if (IS_DEV) {
    mainWindow.loadURL(PATHS.devUrl);
  } else {
    mainWindow.loadFile(PATHS.distHtml);
  }

  mainWindow.setMenuBarVisibility(false);

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}
