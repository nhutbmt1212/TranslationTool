/**
 * Python OCR Integration Utilities
 * Provides helper functions to use Python OCR service from renderer process
 */

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

interface PythonOCRResult {
  success: boolean;
  text?: string;
  blocks?: OCRBlock[];
  engine?: string;
  error?: string;
}

/**
 * Check if Python OCR is available
 */
export async function isPythonOCRAvailable(): Promise<boolean> {
  try {
    if (!window.electronAPI) {
      return false;
    }
    const result = await window.electronAPI.pythonOCR.checkAvailable();
    return result.available;
  } catch (error) {
    console.error('Failed to check Python OCR availability:', error);
    return false;
  }
}

/**
 * Save File to temp path and return the path
 */
async function saveFileToTemp(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  
  // Create temp file path
  const tempPath = `${Date.now()}-${file.name}`;
  const fs = require('fs');
  const path = require('path');
  const os = require('os');
  
  const fullPath = path.join(os.tmpdir(), tempPath);
  
  // Write file
  fs.writeFileSync(fullPath, Buffer.from(uint8Array));
  
  return fullPath;
}

/**
 * Process image with Python OCR
 * @param imageFile Image file to process
 * @param languages Optional language codes (e.g., ['en', 'vi'])
 */
export async function processImageWithPythonOCR(
  imageFile: File,
  languages?: string[]
): Promise<PythonOCRResult> {
  try {
    if (!window.electronAPI) {
      return {
        success: false,
        error: 'Electron API not available',
      };
    }

    // For Electron, we need to save file to temp location first
    // because Python script needs file path
    const tempPath = await saveToTempFile(imageFile);
    
    const result = await window.electronAPI.pythonOCR.processImage(tempPath, languages);
    
    // Clean up temp file
    try {
      await cleanupTempFile(tempPath);
    } catch (error) {
      console.warn('Failed to cleanup temp file:', error);
    }
    
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
 * Save file to temp directory
 */
async function saveToTempFile(file: File): Promise<string> {
  if (!window.electronAPI) {
    throw new Error('Electron API not available');
  }

  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  
  // Convert Uint8Array to regular array for IPC transfer
  const buffer = Array.from(uint8Array);
  
  // Use IPC to save file in main process
  const tempPath = await window.electronAPI.saveToTemp(buffer, file.name);
  
  if (!tempPath) {
    throw new Error('Failed to save file to temp directory');
  }
  
  return tempPath;
}

/**
 * Clean up temp file
 */
async function cleanupTempFile(path: string): Promise<void> {
  if (!window.electronAPI) {
    return;
  }
  await window.electronAPI.cleanupTemp(path);
}

/**
 * Convert Python OCR blocks to TextRegion format
 * Compatible with existing imageTranslator.ts
 */
export function convertOCRBlocksToRegions(blocks: OCRBlock[]): Array<{
  text: string;
  translatedText: string;
  topLeft: { x: number; y: number };
  topRight: { x: number; y: number };
  bottomRight: { x: number; y: number };
  bottomLeft: { x: number; y: number };
  fontSize: number;
}> {
  return blocks.map((block) => {
    const { bbox } = block;
    const lineHeight = bbox.height;
    const estimatedFontSize = Math.round(lineHeight * 0.85);
    
    return {
      text: block.text,
      translatedText: '', // Will be filled by translation
      topLeft: { x: bbox.x, y: bbox.y },
      topRight: { x: bbox.x + bbox.width, y: bbox.y },
      bottomRight: { x: bbox.x + bbox.width, y: bbox.y + bbox.height },
      bottomLeft: { x: bbox.x, y: bbox.y + bbox.height },
      fontSize: estimatedFontSize,
    };
  });
}
