import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';

interface TTSResult {
  success: boolean;
  audio_data?: string; // base64 encoded audio
  voice?: string;
  engine?: string;
  error?: string;
}

/**
 * Get Python executable path
 */
function getPythonPath(): string {
  const isDev = !app.isPackaged;
  
  if (isDev) {
    // Development: use system Python or venv
    return 'python';
  }
  
  // Production: use embedded Python
  const resourcesPath = process.resourcesPath;
  const embeddedPython = path.join(resourcesPath, 'python-embedded', 'python.exe');
  
  if (fs.existsSync(embeddedPython)) {
    return embeddedPython;
  }
  
  // Fallback to system Python
  return 'python';
}

/**
 * Get TTS service script path
 */
function getTTSScriptPath(): string {
  const isDev = !app.isPackaged;
  
  if (isDev) {
    // Development: use app path (project root)
    const appPath = app.getAppPath();
    return path.join(appPath, 'python', 'tts_service.py');
  }
  
  return path.join(process.resourcesPath, 'python', 'tts_service.py');
}

/**
 * Check if Python TTS is available
 */
export async function checkPythonTTSAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const pythonPath = getPythonPath();
    
    const proc = spawn(pythonPath, ['-c', 'import edge_tts; print("ok")']);
    
    proc.on('error', () => resolve(false));
    proc.on('close', (code) => resolve(code === 0));
  });
}

/**
 * Synthesize text to speech using Python edge-tts
 */
export async function synthesizeSpeech(
  text: string,
  language: string,
  outputPath?: string
): Promise<TTSResult> {
  return new Promise((resolve) => {
    const pythonPath = getPythonPath();
    const scriptPath = getTTSScriptPath();
    
    if (!fs.existsSync(scriptPath)) {
      resolve({
        success: false,
        error: 'TTS service script not found'
      });
      return;
    }
    
    const args = [scriptPath, text, language];
    if (outputPath) {
      args.push(outputPath);
    }
    
    const proc = spawn(pythonPath, args, {
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
    });
    
    let stdout = '';
    let stderr = '';
    
    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    proc.on('error', (error) => {
      resolve({
        success: false,
        error: `Failed to start Python: ${error.message}`
      });
    });
    
    proc.on('close', (code) => {
      if (code !== 0) {
        resolve({
          success: false,
          error: stderr || `Python exited with code ${code}`
        });
        return;
      }
      
      try {
        const result = JSON.parse(stdout.trim());
        
        // Read audio file and convert to base64
        if (result.success && result.audio_path && fs.existsSync(result.audio_path)) {
          const audioBuffer = fs.readFileSync(result.audio_path);
          const base64Audio = audioBuffer.toString('base64');
          
          // Cleanup temp file
          fs.unlinkSync(result.audio_path);
          
          resolve({
            success: true,
            audio_data: base64Audio,
            voice: result.voice,
            engine: result.engine
          });
        } else {
          resolve(result);
        }
      } catch (e) {
        resolve({
          success: false,
          error: `Failed to parse TTS result: ${stdout}`
        });
      }
    });
  });
}


