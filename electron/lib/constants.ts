import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { app } from 'electron';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const IS_DEV = process.env.NODE_ENV === 'development' || !app.isPackaged;

export const PATHS = {
  preload: join(__dirname, '../preload.js'),
  distHtml: join(__dirname, '../../../dist/index.html'),
  devUrl: 'http://localhost:5173',
  icon: IS_DEV
    ? join(__dirname, '../../../release/.icon-ico/icon.ico')
    : join(process.resourcesPath || '', 'icon.ico'),
  iconPaths: IS_DEV
    ? [
        join(__dirname, '../../../release/.icon-ico/icon.ico'),
        join(__dirname, '../../release/.icon-ico/icon.ico'),
      ]
    : [join(process.resourcesPath || '', 'icon.ico')],
};

export const WINDOW_CONFIG = {
  minWidth: 900,
  minHeight: 650,
  backgroundColor: '#1a1a1a',
};

export const SHORTCUTS = {
  screenCapture: 'CommandOrControl+Shift+0',
};
