import { dialog, shell } from 'electron';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Check if Python is installed on the system
 */
export async function checkPythonInstalled(): Promise<boolean> {
  return new Promise((resolve) => {
    // Try 'py' first (Python launcher on Windows)
    const py = spawn('py', ['--version']);
    
    py.on('error', () => {
      // Try 'python' as fallback
      const python = spawn('python', ['--version']);
      
      python.on('error', () => {
        resolve(false);
      });
      
      python.on('close', (code) => {
        resolve(code === 0);
      });
    });
    
    py.on('close', (code) => {
      resolve(code === 0);
    });
  });
}

/**
 * Check if EasyOCR is installed
 */
export async function checkEasyOCRInstalled(): Promise<boolean> {
  return new Promise((resolve) => {
    const py = spawn('py', ['-c', 'import easyocr']);
    
    py.on('error', () => {
      resolve(false);
    });
    
    py.on('close', (code) => {
      resolve(code === 0);
    });
  });
}

/**
 * Show dialog to install Python and dependencies
 */
export async function promptPythonInstallation(resourcesPath: string): Promise<boolean> {
  const hasPython = await checkPythonInstalled();
  
  if (!hasPython) {
    const result = await dialog.showMessageBox({
      type: 'info',
      title: 'Python OCR Setup',
      message: 'Enable Python OCR for better accuracy?',
      detail: 'DALIT can use Python OCR (EasyOCR) for better text recognition.\n\n' +
              '✅ Automatic installation available!\n' +
              '   - Downloads Python embedded (~25MB)\n' +
              '   - Installs EasyOCR (~2GB total)\n' +
              '   - Takes 10-15 minutes\n\n' +
              '⚠️ Or skip and use Tesseract.js (JavaScript OCR)\n' +
              '   - Already included\n' +
              '   - Works offline\n' +
              '   - Slightly lower accuracy\n\n' +
              'Recommended: Install Python OCR for best results!',
      buttons: ['Auto Install Python OCR', 'Skip (Use Tesseract.js)', 'Remind Me Later'],
      defaultId: 0,
      cancelId: 2,
    });
    
    if (result.response === 0) {
      // Run automatic installation
      const scriptPath = path.join(resourcesPath, 'scripts', 'install-python.bat');
      
      if (fs.existsSync(scriptPath)) {
        console.log('🚀 Starting automatic Python installation...');
        
        spawn('cmd.exe', ['/c', 'start', 'cmd.exe', '/k', scriptPath], {
          detached: true,
          stdio: 'ignore',
        });
        
        await dialog.showMessageBox({
          type: 'info',
          title: 'Installing Python OCR',
          message: 'Automatic installation started',
          detail: 'A terminal window will open showing installation progress.\n\n' +
                  'Steps:\n' +
                  '1. Download Python embedded (~25MB)\n' +
                  '2. Install pip\n' +
                  '3. Install PyTorch (~1.5GB)\n' +
                  '4. Install EasyOCR (~500MB)\n\n' +
                  'Total time: 10-15 minutes\n\n' +
                  'After installation completes, restart DALIT.',
          buttons: ['OK'],
        });
      } else {
        console.error('❌ Installation script not found');
        
        await dialog.showMessageBox({
          type: 'warning',
          title: 'Installation Unavailable',
          message: 'Automatic installation not available',
          detail: 'Please install Python manually from:\n' +
                  'https://www.python.org/downloads/\n\n' +
                  'Then run: py -m pip install easyocr torch torchvision',
          buttons: ['OK'],
        });
      }
      
      return false;
    } else if (result.response === 1) {
      // User chose to skip
      console.log('⏭️ User skipped Python OCR installation');
      return false;
    } else {
      // Remind later
      console.log('⏰ User chose to be reminded later');
      return false;
    }
  }
  
  // Python is installed, check EasyOCR
  const hasEasyOCR = await checkEasyOCRInstalled();
  
  if (!hasEasyOCR) {
    const result = await dialog.showMessageBox({
      type: 'info',
      title: 'Python OCR Setup',
      message: 'Install EasyOCR?',
      detail: 'Python is installed, but EasyOCR is not.\n\n' +
              'EasyOCR provides better text recognition accuracy.\n' +
              'Installation will download ~2GB of data.\n\n' +
              'Would you like to install it now?',
      buttons: ['Install EasyOCR', 'Skip (Use Tesseract.js)', 'Remind Me Later'],
      defaultId: 0,
      cancelId: 2,
    });
    
    if (result.response === 0) {
      // Run installation script
      const scriptPath = path.join(resourcesPath, 'scripts', 'install-python.bat');
      
      if (fs.existsSync(scriptPath)) {
        console.log('🚀 Starting Python installation script:', scriptPath);
        
        // Open terminal and run script
        spawn('cmd.exe', ['/c', 'start', 'cmd.exe', '/k', scriptPath], {
          detached: true,
          stdio: 'ignore',
        });
        
        await dialog.showMessageBox({
          type: 'info',
          title: 'Installing Python OCR',
          message: 'Automatic installation started',
          detail: 'A terminal window will open to install Python and EasyOCR.\n\n' +
                  'The script will:\n' +
                  '1. Download Python embedded (~25MB)\n' +
                  '2. Install pip\n' +
                  '3. Install PyTorch (~1.5GB)\n' +
                  '4. Install EasyOCR (~500MB)\n\n' +
                  'Total time: 10-15 minutes\n' +
                  'Total download: ~2GB\n\n' +
                  'After installation completes, restart DALIT to use Python OCR.',
          buttons: ['OK'],
        });
      } else {
        console.error('❌ Installation script not found:', scriptPath);
        
        // Fallback: show manual instructions
        await dialog.showMessageBox({
          type: 'warning',
          title: 'Installation Script Not Found',
          message: 'Automatic installation unavailable',
          detail: 'Please install manually:\n\n' +
                  '1. Install Python from https://www.python.org/downloads/\n' +
                  '2. Open Command Prompt\n' +
                  '3. Run: py -m pip install easyocr torch torchvision\n\n' +
                  'After installation, restart DALIT.',
          buttons: ['OK'],
        });
      }
      
      return false;
    } else if (result.response === 1) {
      // User chose to skip
      return false;
    } else {
      // Remind later
      return false;
    }
  }
  
  // Both Python and EasyOCR are installed
  return true;
}

/**
 * Check if Python OCR was successfully installed (marker file exists)
 */
export function checkInstallationMarker(resourcesPath: string): boolean {
  const markerFile = path.join(resourcesPath, 'python-ocr-installed.flag');
  return fs.existsSync(markerFile);
}

/**
 * Check and prompt for Python setup on first run
 */
export async function checkAndSetupPython(resourcesPath: string): Promise<void> {
  // Check if we should skip the prompt (user already chose to skip)
  const skipPromptFile = path.join(resourcesPath, '.skip-python-prompt');
  
  if (fs.existsSync(skipPromptFile)) {
    console.log('⏭️ Skipping Python setup prompt (user preference)');
    return;
  }
  
  // Check if installation was already completed via marker file
  if (checkInstallationMarker(resourcesPath)) {
    console.log('✅ Python OCR installation marker found, skipping prompt');
    return;
  }
  
  const hasPython = await checkPythonInstalled();
  const hasEasyOCR = hasPython ? await checkEasyOCRInstalled() : false;
  
  if (!hasPython || !hasEasyOCR) {
    console.log('🔧 Python OCR not fully set up, prompting user...');
    await promptPythonInstallation(resourcesPath);
  } else {
    console.log('✅ Python OCR is ready!');
  }
}
