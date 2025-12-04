import { spawn } from 'child_process';
import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

interface OCRBlock {
  text: string;
  confidence: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface OCRResult {
  success: boolean;
  text?: string;
  blocks?: OCRBlock[];
  engine?: string;
  error?: string;
}

/**
 * Python OCR Service Bridge
 * Spawns Python process to perform OCR on images
 */
export class PythonOCRService {
  private pythonPath: string = 'py'; // Default to Python launcher
  private scriptPath: string;

  constructor() {
    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
    
    // Get correct base path
    let basePath: string;
    if (isDev) {
      basePath = app.getAppPath();
    } else {
      // In production, check multiple possible locations
      const possiblePaths = [
        process.resourcesPath,
        path.join(path.dirname(app.getPath('exe')), 'resources'),
        path.dirname(app.getPath('exe')),
      ];
      
      // Find first path that exists
      basePath = possiblePaths.find(p => p && fs.existsSync(p)) || app.getAppPath();
      console.log('🔍 Searching for resources in:', possiblePaths);
      console.log('✅ Using basePath:', basePath);
    }
    
    // Paths to Python environment
    const pythonDir = path.join(basePath, 'python');
    this.scriptPath = path.join(pythonDir, 'ocr_service.py');
    
    // Try multiple Python paths in order of preference
    const pythonPaths = [
      // 1. Python embedded (installed by our script)
      path.join(basePath, 'python-embedded', 'python.exe'),
      // 2. Virtual environment (dev mode)
      path.join(pythonDir, 'venv', 'Scripts', 'python.exe'),
      path.join(pythonDir, 'venv', 'bin', 'python'),
    ];
    
    // Find first available Python
    let foundPython = false;
    for (const pyPath of pythonPaths) {
      if (fs.existsSync(pyPath)) {
        this.pythonPath = pyPath;
        foundPython = true;
        console.log(`✅ Found Python at: ${pyPath}`);
        break;
      }
    }
    
    // If no local Python, use system Python (prefer 'py' launcher on Windows)
    if (!foundPython) {
      if (process.platform === 'win32') {
        this.pythonPath = 'py';
      } else {
        this.pythonPath = 'python3';
      }
      console.log(`📌 Using system Python: ${this.pythonPath}`);
    }
    
    const debugInfo = {
      isDev,
      isPackaged: app.isPackaged,
      basePath,
      pythonDir,
      pythonPath: this.pythonPath,
      scriptPath: this.scriptPath,
      scriptExists: fs.existsSync(this.scriptPath),
      resourcesPath: process.resourcesPath,
      exePath: app.getPath('exe'),
      appPath: app.getAppPath(),
    };
    
    console.log('🔧 Python OCR configuration:', JSON.stringify(debugInfo, null, 2));
    
    // List files in python directory to debug
    try {
      if (fs.existsSync(pythonDir)) {
        const files = fs.readdirSync(pythonDir);
        console.log('📁 Files in python directory:', files);
      } else {
        console.error('❌ Python directory does not exist:', pythonDir);
      }
    } catch (error) {
      console.error('❌ Error reading python directory:', error);
    }
  }

  /**
   * Check if Python OCR service is available
   */
  async isAvailable(): Promise<boolean> {
    console.log('🔍 Checking Python OCR availability...');
    
    try {
      // Step 1: Check if OCR script exists
      const scriptExists = fs.existsSync(this.scriptPath);
      console.log(`📄 Script check: ${scriptExists ? '✅' : '❌'} ${this.scriptPath}`);
      
      if (!scriptExists) {
        console.error('❌ Python OCR script not found!');
        console.error('   Expected location:', this.scriptPath);
        console.error('   This means the python/ folder was not packaged correctly.');
        return false;
      }
      
      // Step 2: Try to run Python
      console.log(`🐍 Testing Python: ${this.pythonPath}`);
      try {
        const testResult = await this.runPython(['-c', 'import sys; print(sys.version)']);
        console.log('✅ Python is working!');
        console.log('   Version:', testResult);
      } catch (error) {
        console.error('❌ Python is not available or not working!');
        console.error('   Command tried:', this.pythonPath);
        console.error('   Error:', error instanceof Error ? error.message : error);
        console.error('');
        console.error('💡 To fix this:');
        console.error('   1. Install Python from https://www.python.org/downloads/');
        console.error('   2. Make sure to check "Add Python to PATH" during installation');
        console.error('   3. Restart this app');
        return false;
      }
      
      // Step 3: Check if EasyOCR is installed
      console.log('📦 Checking EasyOCR...');
      try {
        await this.runPython(['-c', 'import easyocr']);
        console.log('✅ EasyOCR is installed!');
        console.log('🎉 Python OCR is ready to use!');
        return true;
      } catch (error) {
        console.warn('⚠️ EasyOCR is not installed');
        console.warn('   Error:', error instanceof Error ? error.message : error);
        console.warn('');
        console.warn('💡 To enable Python OCR (better accuracy):');
        console.warn('   1. Open Command Prompt (cmd)');
        console.warn('   2. Run: py -m pip install easyocr torch torchvision');
        console.warn('   3. Wait 5-10 minutes for installation');
        console.warn('   4. Restart this app');
        console.warn('');
        console.warn('📝 For now, using Tesseract.js (still works fine!)');
        return false;
      }
    } catch (error) {
      console.error('❌ Unexpected error checking Python OCR:', error);
      return false;
    }
  }

  /**
   * Process image with Python OCR
   * @param imagePath Path to image file
   * @param languages Optional language codes
   */
  async processImage(imagePath: string, languages?: string[]): Promise<OCRResult> {
    try {
      if (!fs.existsSync(imagePath)) {
        return {
          success: false,
          error: `Image file not found: ${imagePath}`,
        };
      }

      const args = [this.scriptPath, imagePath];
      if (languages && languages.length > 0) {
        args.push(...languages);
      }

      const result = await this.runPython(args);
      return result;
    } catch (error) {
      console.error('Python OCR error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Run Python script and parse JSON output
   */
  private runPython(args: string[]): Promise<any> {
    return new Promise((resolve, reject) => {
      const python = spawn(this.pythonPath, args);
      
      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python process exited with code ${code}: ${stderr}`));
          return;
        }

        // If output looks like JSON, parse it
        const trimmed = stdout.trim();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          try {
            const result = JSON.parse(trimmed);
            resolve(result);
          } catch (error) {
            reject(new Error(`Failed to parse Python JSON output: ${trimmed}`));
          }
        } else {
          // Return raw output for simple commands (like version check)
          resolve(trimmed);
        }
      });

      python.on('error', (error) => {
        reject(new Error(`Failed to spawn Python process: ${error.message}`));
      });
    });
  }
}

// Singleton instance
let ocrService: PythonOCRService | null = null;

export function getPythonOCRService(): PythonOCRService {
  if (!ocrService) {
    ocrService = new PythonOCRService();
  }
  return ocrService;
}
