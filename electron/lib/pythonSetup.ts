import { dialog } from 'electron';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';

interface DependencyStatus {
  python: boolean;
  easyocr: boolean;
  edgetts: boolean;
  torch: boolean;
}

/**
 * Get Python executable path
 */
function getPythonCmd(): string {
  const isDev = !app.isPackaged;
  
  if (isDev) {
    return 'python';
  }
  
  // Production: check embedded Python first
  const embeddedPython = path.join(process.resourcesPath, 'python-embedded', 'python.exe');
  if (fs.existsSync(embeddedPython)) {
    return embeddedPython;
  }
  
  return 'python';
}

/**
 * Check if a Python module is installed
 */
async function checkPythonModule(moduleName: string): Promise<boolean> {
  return new Promise((resolve) => {
    const pythonCmd = getPythonCmd();
    const proc = spawn(pythonCmd, ['-c', `import ${moduleName}`]);
    
    proc.on('error', () => resolve(false));
    proc.on('close', (code) => resolve(code === 0));
  });
}

/**
 * Check if Python is installed
 */
export async function checkPythonInstalled(): Promise<boolean> {
  return new Promise((resolve) => {
    const pythonCmd = getPythonCmd();
    const proc = spawn(pythonCmd, ['--version']);
    
    proc.on('error', () => {
      // Try 'py' launcher on Windows
      const py = spawn('py', ['--version']);
      py.on('error', () => resolve(false));
      py.on('close', (code) => resolve(code === 0));
    });
    
    proc.on('close', (code) => resolve(code === 0));
  });
}

/**
 * Check all required dependencies
 */
export async function checkAllDependencies(): Promise<DependencyStatus> {
  const python = await checkPythonInstalled();
  
  if (!python) {
    return {
      python: false,
      easyocr: false,
      edgetts: false,
      torch: false,
    };
  }
  
  const [easyocr, edgetts, torch] = await Promise.all([
    checkPythonModule('easyocr'),
    checkPythonModule('edge_tts'),
    checkPythonModule('torch'),
  ]);
  
  return { python, easyocr, edgetts, torch };
}

/**
 * Get missing dependencies message
 */
function getMissingDepsMessage(status: DependencyStatus): string {
  const missing: string[] = [];
  
  if (!status.python) missing.push('Python');
  if (!status.torch) missing.push('PyTorch');
  if (!status.easyocr) missing.push('EasyOCR');
  if (!status.edgetts) missing.push('edge-tts');
  
  return missing.join(', ');
}

/**
 * Force install all dependencies - no skip option
 */
export async function forceInstallDependencies(resourcesPath: string): Promise<void> {
  const status = await checkAllDependencies();
  
  // Check if all dependencies are installed
  if (status.python && status.easyocr && status.edgetts && status.torch) {
    console.log('✅ All Python dependencies are installed!');
    return;
  }
  
  const missingDeps = getMissingDepsMessage(status);
  console.log(`❌ Missing dependencies: ${missingDeps}`);
  
  // Show mandatory installation dialog
  await dialog.showMessageBox({
    type: 'warning',
    title: 'Cài đặt thư viện Python',
    message: 'Thiếu thư viện Python cần thiết!',
    detail: `DALIT cần các thư viện sau để hoạt động:\n\n` +
            `❌ Thiếu: ${missingDeps}\n\n` +
            `Bạn BẮT BUỘC phải cài đặt để sử dụng đầy đủ tính năng:\n` +
            `• OCR (nhận dạng chữ trong ảnh)\n` +
            `• TTS (đọc văn bản)\n\n` +
            `Nhấn OK để bắt đầu cài đặt tự động.\n` +
            `Quá trình cài đặt mất khoảng 10-15 phút.`,
    buttons: ['OK - Cài đặt ngay'],
    defaultId: 0,
    noLink: true,
  });
  
  // Run installation script with admin privileges
  const scriptPath = path.join(resourcesPath, 'scripts', 'install-python.bat');
  
  if (fs.existsSync(scriptPath)) {
    console.log('🚀 Starting mandatory Python installation with admin...');
    
    // Use PowerShell to run script as admin (triggers UAC)
    spawn('powershell.exe', [
      '-Command',
      `Start-Process -FilePath 'cmd.exe' -ArgumentList '/k', '"${scriptPath}"' -Verb RunAs`
    ], {
      detached: true,
      stdio: 'ignore',
      shell: true,
    });
    
    await dialog.showMessageBox({
      type: 'info',
      title: 'Đang cài đặt...',
      message: 'Cài đặt đã bắt đầu',
      detail: 'Một cửa sổ terminal sẽ mở ra hiển thị tiến trình.\n\n' +
              'Các bước cài đặt:\n' +
              '1. Cài Visual C++ Redistributable\n' +
              '2. Cài Python embedded (~25MB)\n' +
              '3. Cài PyTorch (~1.5GB)\n' +
              '4. Cài EasyOCR (~500MB)\n' +
              '5. Cài edge-tts (~1MB)\n\n' +
              'Tổng thời gian: 10-15 phút\n\n' +
              'DALIT sẽ tự động khởi động lại sau khi cài xong.',
      buttons: ['OK'],
    });
    
    // Exit app to let installation complete
    app.quit();
  } else {
    console.error('❌ Installation script not found:', scriptPath);
    
    await dialog.showMessageBox({
      type: 'error',
      title: 'Lỗi',
      message: 'Không tìm thấy script cài đặt',
      detail: 'Vui lòng cài đặt thủ công:\n\n' +
              '1. Cài Python từ https://www.python.org/downloads/\n' +
              '2. Mở Command Prompt\n' +
              '3. Chạy: pip install easyocr torch torchvision edge-tts\n\n' +
              'Sau đó khởi động lại DALIT.',
      buttons: ['OK'],
    });
    
    app.quit();
  }
}

/**
 * Check and setup Python on app start - MANDATORY
 */
export async function checkAndSetupPython(resourcesPath: string): Promise<void> {
  await forceInstallDependencies(resourcesPath);
}
