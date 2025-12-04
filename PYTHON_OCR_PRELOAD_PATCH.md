# Python OCR Preload Patch

Thêm code sau vào `electron/preload.ts` trong cả 2 `contextBridge.exposeInMainWorld` (electronAPI và electron):

## Thêm vào cuối, trước dòng `});`

```typescript
  // Python OCR APIs
  pythonOCR: {
    checkAvailable: () => ipcRenderer.invoke('python-ocr:check-available'),
    processImage: (imagePath: string, languages?: string[]) => 
      ipcRenderer.invoke('python-ocr:process-image', imagePath, languages),
  },

  // Temp file helpers
  saveToTemp: (buffer: Buffer, filename: string) => 
    ipcRenderer.invoke('save-to-temp', buffer, filename),
  cleanupTemp: (filePath: string) => 
    ipcRenderer.invoke('cleanup-temp', filePath),
```

## Cập nhật electron.d.ts

Thêm vào interface `ElectronAPI`:

```typescript
  // Python OCR APIs
  pythonOCR: {
    checkAvailable: () => Promise<{ success: boolean; available: boolean }>;
    processImage: (imagePath: string, languages?: string[]) => Promise<{
      success: boolean;
      text?: string;
      blocks?: Array<{
        text: string;
        confidence: number;
        bbox: { x: number; y: number; width: number; height: number };
      }>;
      engine?: string;
      error?: string;
    }>;
  };

  // Temp file helpers
  saveToTemp?: (buffer: Buffer, filename: string) => Promise<string>;
  cleanupTemp?: (filePath: string) => Promise<void>;
```
