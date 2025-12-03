import {
  BrowserWindow,
  clipboard,
  globalShortcut,
  screen,
  ipcMain,
} from 'electron';
import { uIOhook, UiohookKey } from 'uiohook-napi';
import { PATHS } from './constants.js';
import { getMainWindow } from './windowManager.js';

let popupWindow: BrowserWindow | null = null;
let lastClipboardText = '';
let isSelectionMonitoringEnabled = false;
let previousClipboard = '';

// Mouse tracking for text selection detection
let isMouseDown = false;
let mouseDownTime = 0;
let mouseDownX = 0;
let mouseDownY = 0;
const MIN_DRAG_DISTANCE = 10; // Minimum pixels to consider as drag/selection
const MIN_DRAG_TIME = 100; // Minimum ms to consider as drag/selection

// Double-click detection
let lastClickTime = 0;
let lastClickX = 0;
let lastClickY = 0;
const DOUBLE_CLICK_THRESHOLD = 200; // ms
const DOUBLE_CLICK_DISTANCE = 5; // pixels

// Auto-hide timeout
let autoHideTimeout: NodeJS.Timeout | null = null;
const AUTO_HIDE_DELAY = 5000; // 5 seconds

// Debounce for popup display
let popupDebounceTimeout: NodeJS.Timeout | null = null;
const POPUP_DEBOUNCE_DELAY = 220; // ms - prevent multiple popups in quick succession

// Debounce for copy action (to handle triple-click properly)
let copyDebounceTimeout: NodeJS.Timeout | null = null;
const COPY_DEBOUNCE_DELAY = 300; // ms - wait for triple-click to complete

// Store original clipboard before we copy selected text
let originalClipboard = '';

// Create small popup window with app logo
function createPopupWindow(x: number, y: number, selectedText: string): void {
  // Close existing popup if any
  if (popupWindow && !popupWindow.isDestroyed()) {
    popupWindow.close();
  }

  // Get display bounds to ensure popup stays on screen
  const display = screen.getDisplayNearestPoint({ x, y });
  const { bounds } = display;

  // Popup size
  const popupWidth = 48;
  const popupHeight = 48;

  // Adjust position to stay within screen bounds - show above cursor
  let posX = x + 10;
  let posY = y - popupHeight - 10;

  if (posX + popupWidth > bounds.x + bounds.width) {
    posX = x - popupWidth - 10;
  }
  if (posY < bounds.y) {
    posY = y + 20;
  }

  popupWindow = new BrowserWindow({
    width: popupWidth,
    height: popupHeight,
    x: posX,
    y: posY,
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

  const popupHtml = `
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
        .popup-btn:hover {
          transform: scale(1.15);
        }
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

  popupWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(popupHtml)}`);

  // Clear previous timeout
  if (autoHideTimeout) {
    clearTimeout(autoHideTimeout);
  }

  // Auto-hide after 5 seconds
  autoHideTimeout = setTimeout(() => {
    hidePopup();
  }, AUTO_HIDE_DELAY);
}

function hidePopup(clearClipboardOnCancel = true): void {
  if (autoHideTimeout) {
    clearTimeout(autoHideTimeout);
    autoHideTimeout = null;
  }
  if (popupWindow && !popupWindow.isDestroyed()) {
    popupWindow.close();
    popupWindow = null;

    // Clear clipboard when popup is cancelled (timeout or click outside)
    if (clearClipboardOnCancel) {
      clipboard.clear();
    }
  }
  // Reset tracking
  lastClipboardText = '';
  originalClipboard = '';
}

function showPopupWithText(text: string): void {
  if (!text || !text.trim()) return;

  // Debounce: cancel pending popup and schedule new one
  if (popupDebounceTimeout) {
    clearTimeout(popupDebounceTimeout);
  }

  popupDebounceTimeout = setTimeout(() => {
    const cursorPos = screen.getCursorScreenPoint();
    createPopupWindow(cursorPos.x, cursorPos.y, text.trim());
    popupDebounceTimeout = null;
  }, POPUP_DEBOUNCE_DELAY);
}

function showPopupAtCursor(): void {
  const currentClipboard = clipboard.readText();
  if (currentClipboard && currentClipboard.trim() && currentClipboard !== lastClipboardText) {
    lastClipboardText = currentClipboard;
    showPopupWithText(currentClipboard);
  }
}

// Simulate Ctrl+C to copy selected text (debounced to handle triple-click)
function simulateCopy(): void {
  // Cancel any pending copy action
  if (copyDebounceTimeout) {
    clearTimeout(copyDebounceTimeout);
  }

  // Debounce: wait for user to finish clicking (double/triple click)
  copyDebounceTimeout = setTimeout(() => {
    copyDebounceTimeout = null;

    // If popup is showing, close it without clearing clipboard
    if (popupWindow && !popupWindow.isDestroyed()) {
      hidePopup(false);
    }

    // Clear clipboard before copy to ensure we detect new text
    const clipboardBeforeClear = clipboard.readText() || '';
    clipboard.clear();

    // Simulate Ctrl+C using uiohook
    uIOhook.keyTap(UiohookKey.C, [UiohookKey.Ctrl]);

    // Check clipboard after a short delay
    setTimeout(() => {
      const newClipboard = clipboard.readText();
      // Show popup if we got new text (clipboard was empty before, now has text)
      if (newClipboard && newClipboard.trim()) {
        lastClipboardText = newClipboard;
        showPopupWithText(newClipboard);
      }
    }, 100);
  }, COPY_DEBOUNCE_DELAY);
}

// Check if click is inside popup window
function isClickInsidePopup(x: number, y: number): boolean {
  if (!popupWindow || popupWindow.isDestroyed()) return false;
  const bounds = popupWindow.getBounds();
  return (
    x >= bounds.x &&
    x <= bounds.x + bounds.width &&
    y >= bounds.y &&
    y <= bounds.y + bounds.height
  );
}

// Start mouse hook for text selection detection
function startSelectionMonitoring(): void {
  if (isSelectionMonitoringEnabled) return;

  isSelectionMonitoringEnabled = true;
  previousClipboard = clipboard.readText() || '';

  // Mouse down handler
  uIOhook.on('mousedown', (e) => {
    // Only track left mouse button (button 1)
    if (e.button === 1) {
      // If popup is showing and click is outside, hide it (but continue tracking mouse)
      if (popupWindow && !popupWindow.isDestroyed()) {
        if (!isClickInsidePopup(e.x, e.y)) {
          hidePopup();
          // Don't return - continue to track this mouse action for new selection
        }
      }

      isMouseDown = true;
      mouseDownTime = Date.now();
      mouseDownX = e.x;
      mouseDownY = e.y;
    }
  });

  // Mouse up handler - detect text selection or double-click
  uIOhook.on('mouseup', (e) => {
    if (e.button === 1 && isMouseDown) {
      isMouseDown = false;

      const now = Date.now();
      const dragTime = now - mouseDownTime;
      const dragDistance = Math.sqrt(
        Math.pow(e.x - mouseDownX, 2) + Math.pow(e.y - mouseDownY, 2)
      );

      // Check for double-click (select word)
      const timeSinceLastClick = now - lastClickTime;
      const distanceFromLastClick = Math.sqrt(
        Math.pow(e.x - lastClickX, 2) + Math.pow(e.y - lastClickY, 2)
      );

      const isDoubleClick =
        timeSinceLastClick <= DOUBLE_CLICK_THRESHOLD &&
        distanceFromLastClick <= DOUBLE_CLICK_DISTANCE;

      // Update last click info
      lastClickTime = now;
      lastClickX = e.x;
      lastClickY = e.y;

      // If double-click detected (selecting word)
      if (isDoubleClick) {
        simulateCopy();
        return;
      }

      // If user dragged (likely selecting text)
      if (dragTime >= MIN_DRAG_TIME && dragDistance >= MIN_DRAG_DISTANCE) {
        simulateCopy();
      }
    }
  });

  // Keyboard handler - hide popup on Alt+Tab or other window switching keys
  uIOhook.on('keydown', (e) => {
    // Hide popup when Alt+Tab, Win key, or Escape is pressed
    const isAltTab = e.altKey && e.keycode === UiohookKey.Tab;
    const isWinKey = e.keycode === 3675 || e.keycode === 3676; // Left/Right Meta (Win) keys
    const isEscape = e.keycode === UiohookKey.Escape;
    const isCtrlTab = e.ctrlKey && e.keycode === UiohookKey.Tab;

    if ((isAltTab || isWinKey || isEscape || isCtrlTab) && popupWindow && !popupWindow.isDestroyed()) {
      hidePopup();
    }
  });

  // Start the hook
  uIOhook.start();
  console.log('[TextSelection] Mouse hook started - monitoring text selection');
}

function stopSelectionMonitoring(): void {
  if (!isSelectionMonitoringEnabled) return;

  isSelectionMonitoringEnabled = false;
  uIOhook.stop();
  console.log('[TextSelection] Mouse hook stopped');
}

function isMonitoringActive(): boolean {
  return isSelectionMonitoringEnabled;
}

function registerTextSelectionShortcut(): void {
  globalShortcut.register('CommandOrControl+Shift+C', () => {
    showPopupAtCursor();
  });
}

function unregisterTextSelectionShortcut(): void {
  globalShortcut.unregister('CommandOrControl+Shift+C');
}

function handlePopupClick(): void {
  const selectedText = popupWindow ? (popupWindow as any).selectedText : lastClipboardText;

  if (selectedText) {
    const mainWindow = getMainWindow();
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.send('text-selection-translate', selectedText);
    }
  }

  // Close popup and clear clipboard
  hidePopup(true);
}

export function registerTextSelectionIPC(): void {
  ipcMain.handle('text-selection:show-popup', () => {
    showPopupAtCursor();
  });

  ipcMain.handle('text-selection:hide-popup', () => {
    hidePopup();
  });

  ipcMain.handle('text-selection:start-monitoring', () => {
    startSelectionMonitoring();
  });

  ipcMain.handle('text-selection:stop-monitoring', () => {
    stopSelectionMonitoring();
  });

  ipcMain.handle('text-selection:is-monitoring', () => {
    return isMonitoringActive();
  });

  ipcMain.on('text-selection:popup-click', () => {
    handlePopupClick();
  });

  registerTextSelectionShortcut();

  // Auto-start monitoring
  startSelectionMonitoring();
}

export function cleanupTextSelection(): void {
  unregisterTextSelectionShortcut();
  stopSelectionMonitoring();
}

export {
  showPopupAtCursor,
  hidePopup,
  startSelectionMonitoring,
  stopSelectionMonitoring,
  isMonitoringActive,
};
