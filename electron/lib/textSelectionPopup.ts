import {
  BrowserWindow,
  clipboard,
  globalShortcut,
  screen,
  ipcMain,
  app,
} from 'electron';
import {
  uIOhook,
  UiohookKey,
  UiohookMouseEvent,
  UiohookKeyboardEvent,
} from 'uiohook-napi';
import activeWin from 'active-win';
import * as fs from 'fs';
import * as path from 'path';
import { PATHS } from './constants.js';
import { getMainWindow } from './windowManager.js';

// ============================================================================
// Constants
// ============================================================================
const POPUP_SIZE = { width: 48, height: 48 };
const MIN_DRAG_DISTANCE = 10;
const MIN_DRAG_TIME = 100;
const DOUBLE_CLICK_THRESHOLD = 200;
const DOUBLE_CLICK_DISTANCE = 5;
const AUTO_HIDE_DELAY = 5000;
const POPUP_DEBOUNCE_DELAY = 220;
const COPY_DEBOUNCE_DELAY = 300;
const CTRL_PRIORITY_WINDOW = 500;
const CLIPBOARD_CHECK_DELAY = 100;

// Keycode constants
const RIGHT_CTRL_KEYCODE = 3613;
const LEFT_WIN_KEYCODE = 3675;
const RIGHT_WIN_KEYCODE = 3676;

// ============================================================================
// State
// ============================================================================
let popupWindow: BrowserWindow | null = null;
let lastClipboardText = '';
let isSelectionMonitoringEnabled = false;
let isSelectionMonitoringPaused = false;

// Text Selection Ignore Config
interface TextSelectionIgnoreConfig {
  ignoredApplications: string[];
  enabled: boolean;
}

let ignoreConfig: TextSelectionIgnoreConfig = {
  ignoredApplications: [],
  enabled: true,
};

// Mouse tracking
let isMouseDown = false;
let mouseDownTime = 0;
let mouseDownX = 0;
let mouseDownY = 0;

// Double-click detection
let lastClickTime = 0;
let lastClickX = 0;
let lastClickY = 0;

// Timeouts
let autoHideTimeout: NodeJS.Timeout | null = null;
let popupDebounceTimeout: NodeJS.Timeout | null = null;
let copyDebounceTimeout: NodeJS.Timeout | null = null;

// Ctrl key tracking
let isCtrlPressed = false;
let ctrlPressTime = 0;


// ============================================================================
// Popup HTML Template
// ============================================================================
const POPUP_HTML = `
<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      overflow: hidden;
    }
    .popup-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      -webkit-app-region: no-drag;
      animation: popIn 0.2s ease-out;
    }
    @keyframes popIn {
      0% { transform: scale(0); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }
    .popup-btn:hover { transform: scale(1.15); }
    .popup-btn:active { transform: scale(0.95); }
    .icon { width: 24px; height: 24px; fill: white; }
  </style>
</head>
<body>
  <button class="popup-btn" id="translateBtn" title="Dịch với DALIT">
    <svg class="icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0014.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
    </svg>
  </button>
  <script>
    document.getElementById('translateBtn').addEventListener('click', () => {
      window.electronAPI?.textSelectionPopup?.onPopupClick();
    });
  </script>
</body>
</html>
`;

// ============================================================================
// Utility Functions
// ============================================================================
function clearTimeoutSafe(timeout: NodeJS.Timeout | null): null {
  if (timeout) clearTimeout(timeout);
  return null;
}

function calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function isCtrlKey(keycode: number): boolean {
  return keycode === UiohookKey.Ctrl || keycode === RIGHT_CTRL_KEYCODE;
}

function isWindowSwitchKey(e: UiohookKeyboardEvent): boolean {
  const isAltTab = e.altKey && e.keycode === UiohookKey.Tab;
  const isWinKey = e.keycode === LEFT_WIN_KEYCODE || e.keycode === RIGHT_WIN_KEYCODE;
  const isEscape = e.keycode === UiohookKey.Escape;
  const isCtrlTab = e.ctrlKey && e.keycode === UiohookKey.Tab;
  return isAltTab || isWinKey || isEscape || isCtrlTab;
}

function isPopupActive(): boolean {
  return popupWindow !== null && !popupWindow.isDestroyed();
}

// ============================================================================
// Ignore Config Management
// ============================================================================
function loadIgnoreConfig(): void {
  try {
    const configPath = path.join(app.getPath('userData'), 'textSelectionIgnore.json');
    
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf-8');
      ignoreConfig = JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load text selection ignore config:', error);
  }
}

async function shouldIgnoreCurrentWindow(): Promise<boolean> {
  // If feature is disabled, don't ignore
  if (!ignoreConfig.enabled) {
    return false;
  }

  // If no apps in ignore list, don't ignore
  if (ignoreConfig.ignoredApplications.length === 0) {
    return false;
  }

  try {
    const activeWindow = await activeWin();
    
    if (!activeWindow || !activeWindow.owner) {
      return false;
    }

    const activeAppName = activeWindow.owner.name.toLowerCase();
    
    // Check if active app is in ignore list
    return ignoreConfig.ignoredApplications.some(
      (app) => activeAppName.includes(app.toLowerCase().replace('.exe', ''))
    );
  } catch (error) {
    console.error('Failed to get active window:', error);
    return false;
  }
}


// ============================================================================
// Popup Window Management
// ============================================================================
function calculatePopupPosition(
  cursorX: number,
  cursorY: number,
  bounds: Electron.Rectangle
): { x: number; y: number } {
  let posX = cursorX + 10;
  let posY = cursorY - POPUP_SIZE.height - 10;

  if (posX + POPUP_SIZE.width > bounds.x + bounds.width) {
    posX = cursorX - POPUP_SIZE.width - 10;
  }
  if (posY < bounds.y) {
    posY = cursorY + 20;
  }

  return { x: posX, y: posY };
}

function createPopupWindow(x: number, y: number, selectedText: string): void {
  if (isPopupActive()) {
    popupWindow!.close();
  }

  const display = screen.getDisplayNearestPoint({ x, y });
  const position = calculatePopupPosition(x, y, display.bounds);

  popupWindow = new BrowserWindow({
    width: POPUP_SIZE.width,
    height: POPUP_SIZE.height,
    x: position.x,
    y: position.y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    focusable: false,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: PATHS.preload,
    },
  });

  (popupWindow as any).selectedText = selectedText;
  popupWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(POPUP_HTML)}`);

  // Setup auto-hide
  autoHideTimeout = clearTimeoutSafe(autoHideTimeout);
  autoHideTimeout = setTimeout(() => hidePopup(), AUTO_HIDE_DELAY);
}

function hidePopup(clearClipboardOnCancel = true): void {
  autoHideTimeout = clearTimeoutSafe(autoHideTimeout);

  if (isPopupActive()) {
    popupWindow!.close();
    popupWindow = null;

    if (clearClipboardOnCancel) {
      clipboard.clear();
    }
  }

  lastClipboardText = '';
}

function showPopupWithText(text: string): void {
  const trimmedText = text?.trim();
  if (!trimmedText) return;

  popupDebounceTimeout = clearTimeoutSafe(popupDebounceTimeout);
  popupDebounceTimeout = setTimeout(() => {
    const cursorPos = screen.getCursorScreenPoint();
    createPopupWindow(cursorPos.x, cursorPos.y, trimmedText);
    popupDebounceTimeout = null;
  }, POPUP_DEBOUNCE_DELAY);
}

function showPopupAtCursor(): void {
  const currentClipboard = clipboard.readText()?.trim();
  if (currentClipboard && currentClipboard !== lastClipboardText) {
    lastClipboardText = currentClipboard;
    showPopupWithText(currentClipboard);
  }
}

function isClickInsidePopup(x: number, y: number): boolean {
  if (!isPopupActive()) return false;
  const bounds = popupWindow!.getBounds();
  return (
    x >= bounds.x &&
    x <= bounds.x + bounds.width &&
    y >= bounds.y &&
    y <= bounds.y + bounds.height
  );
}


// ============================================================================
// Copy Simulation
// ============================================================================
function shouldSkipAutoCopy(): boolean {
  return isCtrlPressed || Date.now() - ctrlPressTime < CTRL_PRIORITY_WINDOW;
}

async function simulateCopy(): Promise<void> {
  if (isCtrlPressed) return;

  copyDebounceTimeout = clearTimeoutSafe(copyDebounceTimeout);
  copyDebounceTimeout = setTimeout(async () => {
    copyDebounceTimeout = null;

    if (shouldSkipAutoCopy()) return;

    // Check if current window should be ignored
    const shouldIgnore = await shouldIgnoreCurrentWindow();
    if (shouldIgnore) {
      return;
    }

    if (isPopupActive()) {
      hidePopup(false);
    }

    clipboard.clear();
    uIOhook.keyTap(UiohookKey.C, [UiohookKey.Ctrl]);

    setTimeout(() => {
      const newClipboard = clipboard.readText()?.trim();
      if (newClipboard) {
        lastClipboardText = newClipboard;
        showPopupWithText(newClipboard);
      }
    }, CLIPBOARD_CHECK_DELAY);
  }, COPY_DEBOUNCE_DELAY);
}

// ============================================================================
// Event Handlers
// ============================================================================
function handleMouseDown(e: UiohookMouseEvent): void {
  if (e.button !== 1 || isSelectionMonitoringPaused) return;

  if (isPopupActive() && !isClickInsidePopup(e.x, e.y)) {
    hidePopup();
  }

  isMouseDown = true;
  mouseDownTime = Date.now();
  mouseDownX = e.x;
  mouseDownY = e.y;
}

function handleMouseUp(e: UiohookMouseEvent): void {
  if (e.button !== 1 || !isMouseDown || isSelectionMonitoringPaused) return;

  isMouseDown = false;
  const now = Date.now();

  const dragTime = now - mouseDownTime;
  const dragDistance = calculateDistance(e.x, e.y, mouseDownX, mouseDownY);
  const timeSinceLastClick = now - lastClickTime;
  const distanceFromLastClick = calculateDistance(e.x, e.y, lastClickX, lastClickY);

  const isDoubleClick =
    timeSinceLastClick <= DOUBLE_CLICK_THRESHOLD &&
    distanceFromLastClick <= DOUBLE_CLICK_DISTANCE;

  // Update last click info
  lastClickTime = now;
  lastClickX = e.x;
  lastClickY = e.y;

  if (isDoubleClick) {
    simulateCopy();
    return;
  }

  if (dragTime >= MIN_DRAG_TIME && dragDistance >= MIN_DRAG_DISTANCE) {
    simulateCopy();
  }
}

function handleCtrlPress(): void {
  isCtrlPressed = true;
  ctrlPressTime = Date.now();

  copyDebounceTimeout = clearTimeoutSafe(copyDebounceTimeout);
  popupDebounceTimeout = clearTimeoutSafe(popupDebounceTimeout);

  if (isPopupActive()) {
    hidePopup(false);
  }
}

function handleKeyDown(e: UiohookKeyboardEvent): void {
  if (isCtrlKey(e.keycode)) {
    handleCtrlPress();
  }

  if (isWindowSwitchKey(e) && isPopupActive()) {
    hidePopup();
  }
}

function handleKeyUp(e: UiohookKeyboardEvent): void {
  if (isCtrlKey(e.keycode)) {
    isCtrlPressed = false;
  }
}


// ============================================================================
// Selection Monitoring
// ============================================================================
function startSelectionMonitoring(): void {
  if (isSelectionMonitoringEnabled) return;

  // Load ignore config when starting monitoring
  loadIgnoreConfig();

  isSelectionMonitoringEnabled = true;

  uIOhook.on('mousedown', (e) => handleMouseDown(e));
  uIOhook.on('mouseup', (e) => handleMouseUp(e));
  uIOhook.on('keydown', (e) => handleKeyDown(e));
  uIOhook.on('keyup', (e) => handleKeyUp(e));

  uIOhook.start();
}

function stopSelectionMonitoring(): void {
  if (!isSelectionMonitoringEnabled) return;

  isSelectionMonitoringEnabled = false;
  uIOhook.stop();
}

function isMonitoringActive(): boolean {
  return isSelectionMonitoringEnabled;
}

function pauseSelectionMonitoring(): void {
  isSelectionMonitoringPaused = true;
  // Clear any pending timeouts
  copyDebounceTimeout = clearTimeoutSafe(copyDebounceTimeout);
  popupDebounceTimeout = clearTimeoutSafe(popupDebounceTimeout);
  // Hide popup if visible
  if (isPopupActive()) {
    hidePopup(false);
  }
  // Reset mouse state
  isMouseDown = false;
}

function resumeSelectionMonitoring(): void {
  isSelectionMonitoringPaused = false;
  // Reset state to prevent stale events
  isMouseDown = false;
  lastClipboardText = '';
}

// ============================================================================
// Shortcut Management
// ============================================================================
function registerTextSelectionShortcut(): void {
  globalShortcut.register('CommandOrControl+Shift+C', showPopupAtCursor);
}

function unregisterTextSelectionShortcut(): void {
  globalShortcut.unregister('CommandOrControl+Shift+C');
}

// ============================================================================
// Popup Click Handler
// ============================================================================
function handlePopupClick(): void {
  const selectedText = popupWindow
    ? (popupWindow as any).selectedText
    : lastClipboardText;

  if (selectedText) {
    const mainWindow = getMainWindow();
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.send('text-selection-translate', selectedText);
    }
  }

  hidePopup(true);
}

// ============================================================================
// Config Reload
// ============================================================================
function reloadIgnoreConfig(): void {
  loadIgnoreConfig();
}

// ============================================================================
// IPC Registration
// ============================================================================
export function registerTextSelectionIPC(): void {
  ipcMain.handle('text-selection:show-popup', showPopupAtCursor);
  ipcMain.handle('text-selection:hide-popup', () => hidePopup());
  ipcMain.handle('text-selection:start-monitoring', startSelectionMonitoring);
  ipcMain.handle('text-selection:stop-monitoring', stopSelectionMonitoring);
  ipcMain.handle('text-selection:is-monitoring', isMonitoringActive);
  ipcMain.handle('text-selection:reload-ignore-config', reloadIgnoreConfig);
  ipcMain.on('text-selection:popup-click', handlePopupClick);

  registerTextSelectionShortcut();
  // Don't auto-start monitoring here - let main.ts control it based on config
}

export function cleanupTextSelection(): void {
  unregisterTextSelectionShortcut();
  stopSelectionMonitoring();
}

// ============================================================================
// Exports
// ============================================================================
export {
  showPopupAtCursor,
  hidePopup,
  startSelectionMonitoring,
  stopSelectionMonitoring,
  isMonitoringActive,
  pauseSelectionMonitoring,
  resumeSelectionMonitoring,
  reloadIgnoreConfig,
};
