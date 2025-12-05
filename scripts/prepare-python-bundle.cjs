/**
 * Script to prepare Python embedded bundle for distribution
 * Downloads Python embedded and installs required packages
 * 
 * Optimizations:
 * - Skip if python-embedded already exists and is valid
 * - Use pip cache for faster reinstalls
 * - Only install missing packages instead of all
 * - Cache VC++ Redistributable
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

const PYTHON_VERSION = '3.11.9';
const PYTHON_URL = `https://www.python.org/ftp/python/${PYTHON_VERSION}/python-${PYTHON_VERSION}-embed-amd64.zip`;
const BUNDLE_DIR = path.join(__dirname, '..', 'python-embedded');
const GET_PIP_URL = 'https://bootstrap.pypa.io/get-pip.py';
const VCREDIST_URL = 'https://aka.ms/vs/17/release/vc_redist.x64.exe';
const REDIST_DIR = path.join(__dirname, '..', 'redist');
const MARKER_FILE = path.join(BUNDLE_DIR, '.bundle-complete');

// Required packages to check
const REQUIRED_PACKAGES = ['torch', 'torchvision', 'easyocr', 'edge_tts'];

console.log('========================================');
console.log('  DALIT - Python Bundle Preparation');
console.log('========================================\n');

// Check if a specific package is installed
function isPackageInstalled(pythonExe, packageName) {
  try {
    execSync(`"${pythonExe}" -c "import ${packageName}"`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

// Check if bundle already exists and is complete
function isBundleValid() {
  if (!fs.existsSync(MARKER_FILE)) return false;
  const pythonExe = path.join(BUNDLE_DIR, 'python.exe');
  if (!fs.existsSync(pythonExe)) return false;
  
  try {
    // Quick check if all required packages are installed
    for (const pkg of REQUIRED_PACKAGES) {
      if (!isPackageInstalled(pythonExe, pkg)) {
        console.log(`  Package "${pkg}" is missing, will install...`);
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

// Get list of missing packages
function getMissingPackages(pythonExe) {
  const missing = [];
  for (const pkg of REQUIRED_PACKAGES) {
    if (!isPackageInstalled(pythonExe, pkg)) {
      missing.push(pkg);
    }
  }
  return missing;
}

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading: ${url}`);
    const file = fs.createWriteStream(dest);
    
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        https.get(response.headers.location, (res) => {
          res.pipe(file);
          file.on('finish', () => { file.close(); resolve(); });
        }).on('error', reject);
      } else {
        response.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
      }
    }).on('error', reject);
  });
}

async function extractZip(zipPath, destDir) {
  console.log(`Extracting to: ${destDir}`);
  const cmd = `powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${destDir}' -Force"`;
  execSync(cmd, { stdio: 'inherit' });
}

function runPython(pythonPath, args) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${pythonPath} ${args.join(' ')}`);
    const proc = spawn(pythonPath, args, { stdio: 'inherit' });
    proc.on('close', (code) => code === 0 ? resolve() : reject(new Error(`Exit code ${code}`)));
    proc.on('error', reject);
  });
}


async function main() {
  try {
    const pythonExe = path.join(BUNDLE_DIR, 'python.exe');
    
    // Check if bundle already exists and is valid - SKIP if so
    if (isBundleValid()) {
      console.log('✓ Python bundle already exists and is valid!');
      console.log('  Skipping preparation to save time.');
      console.log('  Delete python-embedded folder to force rebuild.\n');
      
      // Still check VC++ Redistributable
      const vcredistPath = path.join(REDIST_DIR, 'vc_redist.x64.exe');
      if (!fs.existsSync(vcredistPath)) {
        if (!fs.existsSync(REDIST_DIR)) {
          fs.mkdirSync(REDIST_DIR, { recursive: true });
        }
        await downloadFile(VCREDIST_URL, vcredistPath);
        console.log('VC++ Redistributable downloaded!\n');
      }
      
      console.log('========================================');
      console.log('  Python bundle ready! (cached)');
      console.log('========================================\n');
      return;
    }
    
    // Check if Python exists but some packages are missing - only install missing ones
    if (fs.existsSync(pythonExe)) {
      const missingPackages = getMissingPackages(pythonExe);
      if (missingPackages.length > 0) {
        console.log('✓ Python bundle exists, updating packages...');
        console.log(`  Missing/Outdated: ${missingPackages.join(', ')}\n`);
        
        // Ensure pip is available
        try {
          execSync(`"${pythonExe}" -m pip --version`, { stdio: 'pipe' });
        } catch {
          console.log('Installing pip...');
          const getPipPath = path.join(BUNDLE_DIR, 'get-pip.py');
          await downloadFile(GET_PIP_URL, getPipPath);
          await runPython(pythonExe, [getPipPath, '--no-warn-script-location']);
          fs.unlinkSync(getPipPath);
          console.log('pip installed!\n');
        }
        
        // Install missing packages (using cache for speed)
        if (missingPackages.includes('torch') || missingPackages.includes('torchvision')) {
          console.log('Installing/Updating PyTorch CPU (using cache)...');
          await runPython(pythonExe, [
            '-m', 'pip', 'install', 'torch', 'torchvision',
            '--index-url', 'https://download.pytorch.org/whl/cpu',
            '--no-warn-script-location'
          ]);
          console.log('PyTorch ready!\n');
        }
        
        if (missingPackages.includes('easyocr')) {
          console.log('Installing/Updating EasyOCR (using cache)...');
          await runPython(pythonExe, ['-m', 'pip', 'install', 'easyocr', '--no-warn-script-location']);
          console.log('EasyOCR ready!\n');
        }
        
        if (missingPackages.includes('edge_tts')) {
          console.log('Installing/Updating edge-tts (using cache)...');
          await runPython(pythonExe, ['-m', 'pip', 'install', 'edge-tts', '--no-warn-script-location']);
          console.log('edge-tts ready!\n');
        }
        
        // Mark bundle as complete
        fs.writeFileSync(MARKER_FILE, `Bundle updated: ${new Date().toISOString()}\nPython: ${PYTHON_VERSION}`);
        
        console.log('========================================');
        console.log('  Python bundle updated successfully!');
        console.log('========================================\n');
        return;
      }
    }
    
    // Step 1: Create bundle directory
    if (fs.existsSync(BUNDLE_DIR)) {
      console.log('Removing existing bundle...');
      fs.rmSync(BUNDLE_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(BUNDLE_DIR, { recursive: true });
    
    // Step 2: Download Python embedded
    const zipPath = path.join(BUNDLE_DIR, 'python.zip');
    await downloadFile(PYTHON_URL, zipPath);
    console.log('Python downloaded!\n');
    
    // Step 3: Extract Python
    await extractZip(zipPath, BUNDLE_DIR);
    fs.unlinkSync(zipPath);
    console.log('Python extracted!\n');
    
    // Step 4: Enable pip by modifying python311._pth
    const pthFile = path.join(BUNDLE_DIR, 'python311._pth');
    if (fs.existsSync(pthFile)) {
      let content = fs.readFileSync(pthFile, 'utf8');
      content = content.replace('#import site', 'import site');
      content += '\nLib/site-packages\n';
      fs.writeFileSync(pthFile, content);
      console.log('Enabled pip support!\n');
    }
    
    // Step 5: Download and install pip
    const getPipPath = path.join(BUNDLE_DIR, 'get-pip.py');
    await downloadFile(GET_PIP_URL, getPipPath);
    console.log('get-pip.py downloaded!\n');
    
    console.log('Installing pip...');
    await runPython(pythonExe, [getPipPath, '--no-warn-script-location']);
    fs.unlinkSync(getPipPath);
    console.log('pip installed!\n');
    
    // Step 6: Install edge-tts first (smaller package)
    console.log('Installing edge-tts...');
    await runPython(pythonExe, ['-m', 'pip', 'install', 'edge-tts', '--no-warn-script-location']);
    console.log('edge-tts installed!\n');
    
    // Step 7: Install PyTorch CPU + EasyOCR (10-15 minutes)
    console.log('Installing PyTorch CPU + EasyOCR (10-15 minutes)...');
    await runPython(pythonExe, [
      '-m', 'pip', 'install', 'torch', 'torchvision',
      '--index-url', 'https://download.pytorch.org/whl/cpu',
      '--no-warn-script-location'
    ]);
    await runPython(pythonExe, ['-m', 'pip', 'install', 'easyocr', '--no-warn-script-location']);
    console.log('EasyOCR installed!\n');

    // Step 8: Cleanup to reduce size (only __pycache__)
    console.log('Cleaning up cache...');
    function removePycache(dir) {
      if (!fs.existsSync(dir)) return;
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        try {
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            if (item === '__pycache__') {
              fs.rmSync(fullPath, { recursive: true, force: true });
            } else {
              removePycache(fullPath);
            }
          } else if (stat.isFile() && fullPath.endsWith('.pyc')) {
            fs.unlinkSync(fullPath);
          }
        } catch (e) { /* ignore */ }
      }
    }
    removePycache(BUNDLE_DIR);
    console.log('Cache cleaned!\n');
    
    // Step 9: Download Visual C++ Redistributable
    console.log('Downloading Visual C++ Redistributable...');
    if (!fs.existsSync(REDIST_DIR)) {
      fs.mkdirSync(REDIST_DIR, { recursive: true });
    }
    const vcredistPath = path.join(REDIST_DIR, 'vc_redist.x64.exe');
    if (!fs.existsSync(vcredistPath)) {
      await downloadFile(VCREDIST_URL, vcredistPath);
      console.log('VC++ Redistributable downloaded!\n');
    } else {
      console.log('VC++ Redistributable already exists, skipping download.\n');
    }
    
    // Mark bundle as complete
    fs.writeFileSync(MARKER_FILE, `Bundle created: ${new Date().toISOString()}\nPython: ${PYTHON_VERSION}`);
    
    console.log('========================================');
    console.log('  Python bundle ready!');
    console.log('  Location: ' + BUNDLE_DIR);
    console.log('  VC++ Redist: ' + vcredistPath);
    console.log('========================================\n');
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
