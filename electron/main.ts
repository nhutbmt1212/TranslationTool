/// <reference types="electron" />
import { app, BrowserWindow, ipcMain, screen, desktopCapturer, globalShortcut } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';

// Import electron-updater as CommonJS module
import pkg from 'electron-updater';
const { autoUpdater } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let overlayWindow: BrowserWindow | null = null;

function createWindow() {
  const { workArea } = screen.getPrimaryDisplay();
  const desiredWidth = Math.floor(workArea.width * 0.65);
  const desiredHeight = Math.floor(workArea.height * 0.6);

  mainWindow = new BrowserWindow({
    width: desiredWidth,
    height: desiredHeight,
    minWidth: 900,
    minHeight: 650,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js'),
      // Tắt cache trong dev mode để tránh lỗi quyền truy cập
      ...(process.env.NODE_ENV === 'development' && {
        partition: 'persist:dev',
        cache: false
      }),
    },
    titleBarStyle: 'default',
    backgroundColor: '#1a1a1a',
    show: false,
    autoHideMenuBar: true, // Ẩn thanh menu bar
  });

  const window = mainWindow;
  if (!window) {
    return;
  }

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev) {
    window.loadURL('http://localhost:5173');
    // Chỉ mở DevTools khi có biến môi trường DEBUG
    // Bạn có thể mở DevTools thủ công bằng Ctrl+Shift+I hoặc F12
    // window.webContents.openDevTools();
  } else {
    // Trong production, file được đóng gói trong app.asar
    // Đường dẫn: dist-electron/electron/main.js -> ../../dist/index.html
    window.loadFile(join(__dirname, '../../dist/index.html'));
  }

  // Ẩn menu bar hoàn toàn
  window.setMenuBarVisibility(false);

  window.once('ready-to-show', () => {
    window.show();
  });

  window.on('closed', () => {
    mainWindow = null;
  });
}

// Auto-updater configuration
autoUpdater.autoDownload = false; // Không tự động download, để user chọn
autoUpdater.autoInstallOnAppQuit = true;

// Auto-updater events
autoUpdater.on('checking-for-update', () => {
  mainWindow?.webContents.send('update-checking');
});

autoUpdater.on('update-available', (info) => {
  mainWindow?.webContents.send('update-available', info);
});

autoUpdater.on('update-not-available', (info) => {
  mainWindow?.webContents.send('update-not-available', info);
});

autoUpdater.on('error', (err) => {
  mainWindow?.webContents.send('update-error', err);
});

autoUpdater.on('download-progress', (progressObj) => {
  mainWindow?.webContents.send('update-download-progress', progressObj);
});

autoUpdater.on('update-downloaded', (info) => {
  mainWindow?.webContents.send('update-downloaded', info);
});

app.whenReady().then(() => {
  createWindow();

  // Check for updates sau khi app ready (chỉ trong production)
  if (!process.env.NODE_ENV || process.env.NODE_ENV === 'production') {
    setTimeout(() => {
      autoUpdater.checkForUpdates();
    }, 3000); // Đợi 3 giây sau khi app mở
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
// Translation is now handled in renderer process via Gemini API
// These handlers are kept for backward compatibility but not used
ipcMain.handle('translate', async (_event: any, text: string, targetLang: string, sourceLang?: string) => {
  return {
    success: false,
    error: 'Translation moved to renderer process',
  };
});

ipcMain.handle('get-languages', async () => {
  // Return empty object, languages are loaded from JSON in renderer
  return {};
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// Auto-updater IPC handlers
ipcMain.handle('check-for-updates', async () => {
  // Kiểm tra nếu đang ở dev mode
  if (!app.isPackaged) {
    return {
      success: false,
      error: 'Auto-update chỉ hoạt động trong production build',
    };
  }

  try {
    const result = await autoUpdater.checkForUpdates();
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Lỗi kiểm tra update',
    };
  }
});

ipcMain.handle('download-update', async () => {
  try {
    await autoUpdater.downloadUpdate();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Lỗi tải update',
    };
  }
});

ipcMain.handle('install-update', () => {
  autoUpdater.quitAndInstall();
});

// Create overlay window for desktop selection
function createOverlayWindow(): Promise<{ x: number; y: number; width: number; height: number } | null> {
  return new Promise((resolve) => {
    const { bounds } = screen.getPrimaryDisplay();
    let isResolved = false;
    
    // Helper function to safely resolve once
    const safeResolve = (result: { x: number; y: number; width: number; height: number } | null) => {
      if (isResolved) return;
      isResolved = true;
      
      // Clean up overlay window
      if (overlayWindow && !overlayWindow.isDestroyed()) {
        overlayWindow.removeAllListeners();
        overlayWindow.webContents.removeAllListeners();
        overlayWindow.close();
      }
      overlayWindow = null;
      
      // Unregister global shortcut
      try {
        globalShortcut.unregister('Escape');
      } catch (e) {
        // Ignore errors when unregistering
      }
      
      resolve(result);
    };
    
    overlayWindow = new BrowserWindow({
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      movable: false,
      minimizable: false,
      maximizable: false,
      closable: true,
      focusable: true,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: join(__dirname, 'preload.js'),
      }
    });

    // Create overlay HTML content
    const overlayHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            background: rgba(0, 0, 0, 0.3); 
            cursor: crosshair; 
            user-select: none;
            overflow: hidden;
            font-family: system-ui, sans-serif;
          }
          .instructions {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            z-index: 1000;
          }
          .selection {
            position: absolute;
            border: 2px solid #00aaff;
            background: rgba(0, 170, 255, 0.1);
            display: none;
          }
          .size-info {
            position: absolute;
            top: -30px;
            left: 0;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-family: monospace;
          }
        </style>
      </head>
      <body>
        <div class="instructions">🖱️ Drag to select area • Press ESC to cancel</div>
        <div class="selection" id="selection">
          <div class="size-info" id="sizeInfo"></div>
        </div>
        <script>
          let isSelecting = false;
          let startX = 0, startY = 0;
          let cancelled = false;
          const selection = document.getElementById('selection');
          const sizeInfo = document.getElementById('sizeInfo');
          
          function cancelSelection() {
            if (cancelled) return;
            cancelled = true;
            document.body.style.display = 'none';
            if (window.electronAPI && window.electronAPI.overlayResult) {
              window.electronAPI.overlayResult(null);
            }
          }
          
          function completeSelection(x, y, width, height) {
            if (cancelled) return;
            cancelled = true;
            document.body.style.display = 'none';
            if (window.electronAPI && window.electronAPI.overlayResult) {
              window.electronAPI.overlayResult({ x, y, width, height });
            }
          }
          
          document.addEventListener('mousedown', (e) => {
            if (cancelled) return;
            isSelecting = true;
            startX = e.clientX;
            startY = e.clientY;
            selection.style.display = 'block';
            updateSelection(e.clientX, e.clientY);
          });
          
          document.addEventListener('mousemove', (e) => {
            if (cancelled || !isSelecting) return;
            updateSelection(e.clientX, e.clientY);
          });
          
          document.addEventListener('mouseup', (e) => {
            if (cancelled || !isSelecting) return;
            
            const x = Math.min(startX, e.clientX);
            const y = Math.min(startY, e.clientY);
            const width = Math.abs(e.clientX - startX);
            const height = Math.abs(e.clientY - startY);
            
            if (width > 10 && height > 10) {
              setTimeout(() => completeSelection(x, y, width, height), 100);
            } else {
              cancelSelection();
            }
          });
          
          // Single ESC key handler
          document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              e.stopPropagation();
              cancelSelection();
            }
          });
          
          // Focus the window when loaded
          window.addEventListener('load', () => {
            window.focus();
            document.body.focus();
          });
          
          function updateSelection(currentX, currentY) {
            if (cancelled) return;
            const x = Math.min(startX, currentX);
            const y = Math.min(startY, currentY);
            const width = Math.abs(currentX - startX);
            const height = Math.abs(currentY - startY);
            
            selection.style.left = x + 'px';
            selection.style.top = y + 'px';
            selection.style.width = width + 'px';
            selection.style.height = height + 'px';
            
            sizeInfo.textContent = width + ' × ' + height;
          }
        </script>
      </body>
      </html>
    `;

    overlayWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(overlayHTML)}`);

    // Show and focus window after loading
    overlayWindow.once('ready-to-show', () => {
      if (overlayWindow && !overlayWindow.isDestroyed()) {
        overlayWindow.show();
        overlayWindow.focus();
        overlayWindow.setAlwaysOnTop(true, 'screen-saver');
        
        // Register global ESC shortcut as backup
        try {
          globalShortcut.register('Escape', () => {
            safeResolve(null);
          });
        } catch (e) {
          // Ignore registration errors
        }
      }
    });

    // Handle overlay result
    const overlayResultHandler = async (_event: any, result: any) => {
      // Remove the handler to prevent multiple calls
      ipcMain.removeListener('overlay-result', overlayResultHandler);
      
      if (overlayWindow && !overlayWindow.isDestroyed()) {
        overlayWindow.hide();
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      safeResolve(result);
    };
    
    ipcMain.once('overlay-result', overlayResultHandler);

    overlayWindow.on('closed', () => {
      safeResolve(null);
    });

    // Timeout as safety net
    setTimeout(() => {
      safeResolve(null);
    }, 60000); // 60 second timeout
  });
}

// PowerShell Screen Capture Functions
async function captureWithPowerShell(region: { x: number; y: number; width: number; height: number }): Promise<Buffer> {
  const scriptPath = join(__dirname, '../../scripts/screen-capture.ps1');
  const tempFile = join(tmpdir(), `capture-${Date.now()}.png`);
  
  return new Promise((resolve, reject) => {
    const args = [
      '-ExecutionPolicy', 'Bypass',
      '-File', scriptPath,
      '-X', region.x.toString(),
      '-Y', region.y.toString(),
      '-Width', region.width.toString(),
      '-Height', region.height.toString(),
      '-OutputPath', tempFile
    ];

    const process = spawn('powershell.exe', args, {
      windowsHide: true,
      stdio: 'pipe'
    });

    let error = '';

    process.stderr?.on('data', (data) => {
      error += data.toString();
    });

    process.on('close', async (code) => {
      if (code === 0) {
        try {
          const buffer = await fs.readFile(tempFile);
          await fs.unlink(tempFile).catch(() => {});
          resolve(buffer);
        } catch (err) {
          reject(new Error(`Failed to read captured image: ${err}`));
        }
      } else {
        reject(new Error(`PowerShell capture failed: ${error || 'Unknown error'}`));
      }
    });

    process.on('error', (err) => {
      reject(new Error(`Failed to start PowerShell: ${err.message}`));
    });
  });
}

async function getScreenSizeWithPowerShell(): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const script = `
      Add-Type -AssemblyName System.Windows.Forms
      $Screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
      Write-Output "$($Screen.Width),$($Screen.Height)"
    `;

    const process = spawn('powershell.exe', [
      '-ExecutionPolicy', 'Bypass',
      '-Command', script
    ], {
      windowsHide: true,
      stdio: 'pipe'
    });

    let output = '';

    process.stdout?.on('data', (data) => {
      output += data.toString();
    });

    process.on('close', (code) => {
      if (code === 0) {
        const [width, height] = output.trim().split(',').map(Number);
        resolve({ width, height });
      } else {
        reject(new Error('Failed to get screen size'));
      }
    });
  });
}

// Screen Capture IPC handlers
ipcMain.handle('screen-capture:get-size', async () => {
  try {
    // Try PowerShell first
    return await getScreenSizeWithPowerShell();
  } catch (error) {
    // Fallback to Electron's screen API
    const primaryDisplay = screen.getPrimaryDisplay();
    return {
      width: primaryDisplay.bounds.width,
      height: primaryDisplay.bounds.height
    };
  }
});

ipcMain.handle('screen-capture:capture-full-screen', async () => {
  try {
    // Hide main window to capture desktop
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.hide();
      // Wait a bit for window to hide
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    const screenSize = await getScreenSizeWithPowerShell();
    const result = await captureWithPowerShell({
      x: 0,
      y: 0,
      width: screenSize.width,
      height: screenSize.height
    });

    // Show window again
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
    }

    return result;
  } catch (error) {
    
    // Show window again even if failed
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
    }
    
    // Fallback to Electron's desktopCapturer
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 1920, height: 1080 }
    });

    if (sources.length === 0) {
      throw new Error('No screen sources available');
    }

    return sources[0].thumbnail.toPNG();
  }
});

ipcMain.handle('screen-capture:capture-region', async (_event, region: { x: number; y: number; width: number; height: number }) => {
  try {
    // Hide main window to capture desktop
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.hide();
      // Wait a bit for window to hide
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Use PowerShell for high-quality capture
    const result = await captureWithPowerShell(region);

    // Show window again
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
    }

    return result;
  } catch (error) {
    
    // Show window again even if failed
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
    }
    
    // Fallback to Electron's desktopCapturer
    try {
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: 1920, height: 1080 }
      });

      if (sources.length === 0) {
        throw new Error('No screen sources available');
      }

      const primarySource = sources[0];
      const fullImage = primarySource.thumbnail;
      
      // Crop the region
      const croppedImage = fullImage.crop({
        x: Math.round(region.x),
        y: Math.round(region.y),
        width: Math.round(region.width),
        height: Math.round(region.height)
      });
      
      return croppedImage.toPNG();
    } catch (fallbackError) {
      throw new Error(`Both PowerShell and Electron capture failed: ${fallbackError}`);
    }
  }
});

// Desktop selection with overlay
ipcMain.handle('screen-capture:select-desktop-region', async () => {
  try {
    // Hide main window
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.hide();
      // Wait for window to hide
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Show overlay for selection
    const selectedRegion = await createOverlayWindow();

    if (selectedRegion) {
      
      // Wait a bit more to ensure all windows are hidden
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Capture the selected region with PowerShell
      const captureResult = await captureWithPowerShell(selectedRegion);
      
      // Show main window again after capture
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
      }
      
      return captureResult;
    } else {
      // Show main window again if cancelled
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
      }
      return null; // User cancelled
    }
  } catch (error) {
    // Show main window again even if failed
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
    }
    throw new Error(`Desktop selection failed: ${error}`);
  }
});
