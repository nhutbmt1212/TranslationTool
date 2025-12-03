import { BrowserWindow, screen, desktopCapturer, globalShortcut, ipcMain } from 'electron';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { PATHS } from './constants.js';
import { getMainWindow } from './windowManager.js';
import { pauseSelectionMonitoring, resumeSelectionMonitoring } from './textSelectionPopup.js';

let overlayWindow: BrowserWindow | null = null;

// PowerShell capture
async function captureWithPowerShell(region: { x: number; y: number; width: number; height: number }): Promise<Buffer> {
  const tempFile = join(tmpdir(), `capture-${Date.now()}.png`);

  const powershellScript = `
try {
    Add-Type -AssemblyName System.Drawing
    Add-Type -AssemblyName System.Windows.Forms
    $Bitmap = New-Object System.Drawing.Bitmap(${region.width}, ${region.height})
    $Graphics = [System.Drawing.Graphics]::FromImage($Bitmap)
    $Graphics.CopyFromScreen(${region.x}, ${region.y}, 0, 0, [System.Drawing.Size]::new(${region.width}, ${region.height}))
    $Bitmap.Save("${tempFile.replace(/\\/g, '\\\\')}", [System.Drawing.Imaging.ImageFormat]::Png)
    $Graphics.Dispose()
    $Bitmap.Dispose()
}
catch {
    Write-Error $_.Exception.Message
    exit 1
}
`;

  return new Promise((resolve, reject) => {
    const process = spawn('powershell.exe', ['-ExecutionPolicy', 'Bypass', '-Command', powershellScript], {
      windowsHide: true,
      stdio: 'pipe',
    });

    let error = '';
    process.stderr?.on('data', (data) => { error += data.toString(); });

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

    const process = spawn('powershell.exe', ['-ExecutionPolicy', 'Bypass', '-Command', script], {
      windowsHide: true,
      stdio: 'pipe',
    });

    let output = '';
    process.stdout?.on('data', (data) => { output += data.toString(); });

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

// Overlay window for selection
function createOverlayWindow(): Promise<{ x: number; y: number; width: number; height: number } | null> {
  return new Promise((resolve) => {
    const { bounds } = screen.getPrimaryDisplay();
    let isResolved = false;

    const safeResolve = (result: { x: number; y: number; width: number; height: number } | null) => {
      if (isResolved) return;
      isResolved = true;

      if (overlayWindow && !overlayWindow.isDestroyed()) {
        overlayWindow.removeAllListeners();
        overlayWindow.webContents.removeAllListeners();
        overlayWindow.close();
      }
      overlayWindow = null;

      try { globalShortcut.unregister('Escape'); } catch {}
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
        preload: PATHS.preload,
      },
    });

    const overlayHTML = getOverlayHTML();
    overlayWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(overlayHTML)}`);

    overlayWindow.once('ready-to-show', () => {
      if (overlayWindow && !overlayWindow.isDestroyed()) {
        overlayWindow.show();
        overlayWindow.focus();
        overlayWindow.setAlwaysOnTop(true, 'screen-saver');
        try { globalShortcut.register('Escape', () => safeResolve(null)); } catch {}
      }
    });

    const overlayResultHandler = async (_event: unknown, result: { x: number; y: number; width: number; height: number } | null) => {
      ipcMain.removeListener('overlay-result', overlayResultHandler);
      if (overlayWindow && !overlayWindow.isDestroyed()) {
        overlayWindow.hide();
        await new Promise((r) => setTimeout(r, 100));
      }
      safeResolve(result);
    };

    ipcMain.once('overlay-result', overlayResultHandler);
    overlayWindow.on('closed', () => safeResolve(null));
    setTimeout(() => safeResolve(null), 60000);
  });
}

function getOverlayHTML(): string {
  return `<!DOCTYPE html>
<html><head><style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: rgba(0, 0, 0, 0.3); cursor: crosshair; user-select: none; overflow: hidden; font-family: system-ui, sans-serif; }
.instructions { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: rgba(0, 0, 0, 0.8); color: white; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 500; z-index: 1000; }
.selection { position: absolute; border: 2px solid #00aaff; background: rgba(0, 170, 255, 0.1); display: none; }
.size-info { position: absolute; top: -30px; left: 0; background: rgba(0, 0, 0, 0.8); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-family: monospace; }
</style></head><body>
<div class="instructions">🖱️ Drag to select area • Press ESC to cancel</div>
<div class="selection" id="selection"><div class="size-info" id="sizeInfo"></div></div>
<script>
let isSelecting = false, startX = 0, startY = 0, cancelled = false;
const selection = document.getElementById('selection');
const sizeInfo = document.getElementById('sizeInfo');
function cancelSelection() { if (cancelled) return; cancelled = true; document.body.style.display = 'none'; window.electronAPI?.overlayResult?.(null); }
function completeSelection(x, y, width, height) { if (cancelled) return; cancelled = true; document.body.style.display = 'none'; window.electronAPI?.overlayResult?.({ x, y, width, height }); }
document.addEventListener('mousedown', (e) => { if (cancelled) return; isSelecting = true; startX = e.clientX; startY = e.clientY; selection.style.display = 'block'; updateSelection(e.clientX, e.clientY); });
document.addEventListener('mousemove', (e) => { if (cancelled || !isSelecting) return; updateSelection(e.clientX, e.clientY); });
document.addEventListener('mouseup', (e) => { if (cancelled || !isSelecting) return; const x = Math.min(startX, e.clientX), y = Math.min(startY, e.clientY), width = Math.abs(e.clientX - startX), height = Math.abs(e.clientY - startY); if (width > 10 && height > 10) { setTimeout(() => completeSelection(x, y, width, height), 100); } else { cancelSelection(); } });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cancelSelection(); } });
window.addEventListener('load', () => { window.focus(); document.body.focus(); });
function updateSelection(currentX, currentY) { if (cancelled) return; const x = Math.min(startX, currentX), y = Math.min(startY, currentY), width = Math.abs(currentX - startX), height = Math.abs(currentY - startY); selection.style.left = x + 'px'; selection.style.top = y + 'px'; selection.style.width = width + 'px'; selection.style.height = height + 'px'; sizeInfo.textContent = width + ' × ' + height; }
</script></body></html>`;
}

// IPC Handlers
export function registerScreenCaptureIPC(): void {
  ipcMain.handle('screen-capture:get-size', async () => {
    try {
      return await getScreenSizeWithPowerShell();
    } catch {
      const primaryDisplay = screen.getPrimaryDisplay();
      return { width: primaryDisplay.bounds.width, height: primaryDisplay.bounds.height };
    }
  });

  ipcMain.handle('screen-capture:capture-full-screen', async () => {
    const mainWindow = getMainWindow();
    try {
      mainWindow?.hide();
      await new Promise((r) => setTimeout(r, 200));

      const screenSize = await getScreenSizeWithPowerShell();
      const result = await captureWithPowerShell({ x: 0, y: 0, width: screenSize.width, height: screenSize.height });

      mainWindow?.show();
      return result;
    } catch {
      mainWindow?.show();
      const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 1920, height: 1080 } });
      if (sources.length === 0) throw new Error('No screen sources available');
      return sources[0].thumbnail.toPNG();
    }
  });

  ipcMain.handle('screen-capture:capture-region', async (_event, region: { x: number; y: number; width: number; height: number }) => {
    const mainWindow = getMainWindow();
    try {
      mainWindow?.hide();
      await new Promise((r) => setTimeout(r, 200));

      const result = await captureWithPowerShell(region);
      mainWindow?.show();
      return result;
    } catch {
      mainWindow?.show();
      const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 1920, height: 1080 } });
      if (sources.length === 0) throw new Error('No screen sources available');
      const croppedImage = sources[0].thumbnail.crop({
        x: Math.round(region.x),
        y: Math.round(region.y),
        width: Math.round(region.width),
        height: Math.round(region.height),
      });
      return croppedImage.toPNG();
    }
  });

  ipcMain.handle('screen-capture:select-desktop-region', async () => {
    const mainWindow = getMainWindow();
    try {
      // Pause text selection monitoring to prevent popup during capture
      pauseSelectionMonitoring();
      
      mainWindow?.hide();
      await new Promise((r) => setTimeout(r, 300));

      const selectedRegion = await createOverlayWindow();

      if (selectedRegion) {
        await new Promise((r) => setTimeout(r, 300));
        const captureResult = await captureWithPowerShell(selectedRegion);
        mainWindow?.show();
        resumeSelectionMonitoring();
        return captureResult;
      } else {
        mainWindow?.show();
        resumeSelectionMonitoring();
        return null;
      }
    } catch (error) {
      mainWindow?.show();
      resumeSelectionMonitoring();
      throw new Error(`Desktop selection failed: ${error}`);
    }
  });
}
