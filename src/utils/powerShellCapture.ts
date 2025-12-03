import { spawn } from 'child_process';
import { join } from 'path';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';

export interface CaptureRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class PowerShellScreenCapture {
  private scriptPath: string;

  constructor() {
    this.scriptPath = join(process.cwd(), 'scripts', 'screen-capture.ps1');
  }

  /**
   * Capture screen region using PowerShell
   */
  async captureRegion(region: CaptureRegion): Promise<Buffer> {
    const tempFile = join(tmpdir(), `capture-${Date.now()}.png`);
    
    return new Promise((resolve, reject) => {
      const args = [
        '-ExecutionPolicy', 'Bypass',
        '-File', this.scriptPath,
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

      let output = '';
      let error = '';

      process.stdout?.on('data', (data) => {
        output += data.toString();
      });

      process.stderr?.on('data', (data) => {
        error += data.toString();
      });

      process.on('close', async (code) => {
        if (code === 0) {
          try {
            const buffer = await fs.readFile(tempFile);
            // Clean up temp file
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

  /**
   * Get screen dimensions
   */
  async getScreenSize(): Promise<{ width: number; height: number }> {
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
}