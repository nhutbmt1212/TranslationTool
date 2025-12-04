# Python OCR Integration Guide

## Tổng quan

Dự án đã được tích hợp Python OCR service để cải thiện độ chính xác của Image Translation. Python OCR sử dụng **EasyOCR** (hoặc Tesseract làm fallback) để nhận diện văn bản trong ảnh.

## Cài đặt

### 1. Setup Python Environment

```bash
# Di chuyển vào thư mục python
cd python

# Chạy script setup (tự động tạo venv và cài dependencies)
python setup.py

# Hoặc cài đặt thủ công:
python -m venv venv

# Activate venv
# Windows:
venv\Scripts\activate
# Unix/Mac:
source venv/bin/activate

# Cài đặt dependencies
pip install -r requirements.txt
```

### 2. Test Python OCR

```bash
# Test với một ảnh
python python/ocr_service.py path/to/image.png

# Test với ngôn ngữ cụ thể
python python/ocr_service.py path/to/image.png en vi ja
```

## Sử dụng trong Electron

### 1. Cập nhật Preload (electron/preload.ts)

Thêm vào cuối file, trước dòng `});`:

```typescript
  // Python OCR APIs
  pythonOCR: {
    checkAvailable: () => ipcRenderer.invoke('python-ocr:check-available'),
    processImage: (imagePath: string, languages?: string[]) => 
      ipcRenderer.invoke('python-ocr:process-image', imagePath, languages),
  },
```

### 2. Cập nhật Types (electron.d.ts)

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
```

### 3. Sử dụng trong React Component

```typescript
// Check if Python OCR is available
const checkPythonOCR = async () => {
  const result = await window.electronAPI.pythonOCR.checkAvailable();
  console.log('Python OCR available:', result.available);
};

// Process image with Python OCR
const processImageWithPython = async (imagePath: string) => {
  const result = await window.electronAPI.pythonOCR.processImage(imagePath, ['en', 'vi']);
  
  if (result.success) {
    console.log('Detected text:', result.text);
    console.log('Text blocks:', result.blocks);
    console.log('OCR engine:', result.engine);
  } else {
    console.error('OCR error:', result.error);
  }
};
```

## Tích hợp vào useOCR Hook

Cập nhật `src/hooks/useOCR.ts` để sử dụng Python OCR:

```typescript
const processImage = async (imageFile: File | string) => {
  try {
    setIsProcessingOCR(true);
    
    // Save image to temp file
    const tempPath = await saveTempImage(imageFile);
    
    // Try Python OCR first
    const pythonResult = await window.electronAPI.pythonOCR.processImage(tempPath);
    
    if (pythonResult.success && pythonResult.text) {
      // Use Python OCR result
      const translatedText = await translateText(pythonResult.text);
      return {
        originalText: pythonResult.text,
        translatedText,
        detectedLang: 'auto',
      };
    }
    
    // Fallback to Gemini OCR
    const geminiResult = await processWithGemini(imageFile);
    return geminiResult;
    
  } catch (error) {
    console.error('OCR error:', error);
    throw error;
  } finally {
    setIsProcessingOCR(false);
  }
};
```

## Ưu điểm của Python OCR

1. **Độ chính xác cao hơn**: EasyOCR sử dụng deep learning, cho kết quả tốt hơn Gemini trong nhiều trường hợp
2. **Offline**: Không cần internet, không tốn API quota
3. **Nhanh hơn**: Xử lý local, không cần gọi API
4. **Hỗ trợ nhiều ngôn ngữ**: 80+ ngôn ngữ
5. **Bounding boxes**: Trả về vị trí chính xác của từng text block

## So sánh với Gemini OCR

| Feature | Python OCR (EasyOCR) | Gemini OCR |
|---------|---------------------|------------|
| Độ chính xác | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Tốc độ | ⭐⭐⭐⭐⭐ (local) | ⭐⭐⭐ (API call) |
| Offline | ✅ | ❌ |
| Chi phí | Miễn phí | API quota |
| Bounding boxes | ✅ | ❌ |
| Ngôn ngữ | 80+ | Tất cả |

## Chiến lược Hybrid (Đề xuất)

Sử dụng cả hai để tối ưu:

1. **Python OCR**: Dùng cho OCR thông thường (nhanh, chính xác, offline)
2. **Gemini OCR**: Dùng khi Python OCR thất bại hoặc cho ngôn ngữ hiếm

```typescript
const processImageHybrid = async (imagePath: string) => {
  // Try Python OCR first
  const pythonResult = await window.electronAPI.pythonOCR.processImage(imagePath);
  
  if (pythonResult.success && pythonResult.text && pythonResult.text.length > 10) {
    return pythonResult;
  }
  
  // Fallback to Gemini if Python fails or returns too little text
  const geminiResult = await processWithGemini(imagePath);
  return geminiResult;
};
```

## Troubleshooting

### Python không tìm thấy

```bash
# Kiểm tra Python đã cài đặt
python --version
# hoặc
python3 --version

# Cài đặt Python nếu chưa có
# Windows: Download từ python.org
# Mac: brew install python
# Linux: sudo apt install python3
```

### EasyOCR cài đặt lỗi

```bash
# Cài đặt PyTorch trước
pip install torch torchvision

# Sau đó cài EasyOCR
pip install easyocr
```

### Lỗi "No module named 'easyocr'"

```bash
# Đảm bảo đang dùng đúng Python trong venv
which python  # Unix/Mac
where python  # Windows

# Activate venv và cài lại
source venv/bin/activate  # Unix/Mac
venv\Scripts\activate     # Windows
pip install -r requirements.txt
```

## Build & Distribution

Khi build app để distribute, cần:

1. **Include Python folder**: Đảm bảo folder `python/` được copy vào build
2. **Package venv**: Include `python/venv/` hoặc cài đặt dependencies khi first run
3. **Update electron-builder config**:

```json
{
  "extraResources": [
    {
      "from": "python",
      "to": "python",
      "filter": ["**/*"]
    }
  ]
}
```

## Next Steps

1. ✅ Setup Python environment
2. ✅ Test Python OCR service
3. ⬜ Cập nhật preload.ts và electron.d.ts
4. ⬜ Tích hợp vào useOCR hook
5. ⬜ Thêm UI toggle để chọn OCR engine
6. ⬜ Test và optimize performance
7. ⬜ Update build config cho distribution
