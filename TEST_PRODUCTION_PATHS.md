# Test Production Paths

## Cách test trong production build

### 1. Build app
```bash
npm run build
```

### 2. Chạy app từ release/win-unpacked/DALIT.exe

### 3. Mở DevTools (Ctrl+Shift+I)

### 4. Xem logs trong Console

Bạn sẽ thấy:
```
🔧 Python OCR configuration: {
  "isDev": false,
  "isPackaged": true,
  "basePath": "C:\\...\\resources",
  "pythonDir": "C:\\...\\resources\\python",
  "pythonPath": "py",
  "scriptPath": "C:\\...\\resources\\python\\ocr_service.py",
  "scriptExists": true/false,  ← Quan trọng!
  ...
}

📁 Files in python directory: [
  "ocr_service.py",
  "requirements.txt",
  ...
]
```

### 5. Kiểm tra

**Nếu `scriptExists: false`:**
- Python scripts không được copy vào build
- Kiểm tra package.json > build > extraResources

**Nếu `scriptExists: true` nhưng vẫn lỗi:**
- Python không có trên máy
- Hoặc EasyOCR chưa cài

### 6. Verify files manually

Mở File Explorer, đi đến:
```
release\win-unpacked\resources\python\
```

Phải có các file:
- ocr_service.py
- requirements.txt
- setup.py
- install_deps.py

## Expected paths

### Development
```
basePath: D:\Workspace\TranslateTool
pythonDir: D:\Workspace\TranslateTool\python
scriptPath: D:\Workspace\TranslateTool\python\ocr_service.py
```

### Production (unpacked)
```
basePath: C:\...\release\win-unpacked\resources
pythonDir: C:\...\release\win-unpacked\resources\python
scriptPath: C:\...\release\win-unpacked\resources\python\ocr_service.py
```

### Production (installed)
```
basePath: C:\Program Files\DALIT\resources
pythonDir: C:\Program Files\DALIT\resources\python
scriptPath: C:\Program Files\DALIT\resources\python\ocr_service.py
```
