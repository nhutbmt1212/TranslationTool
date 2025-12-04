# Python OCR Setup for Production

## Vấn đề
Khi build installer, Python OCR không hoạt động vì:
- Python virtual environment không thể đóng gói (chứa đường dẫn tuyệt đối)
- Dependencies (EasyOCR, PyTorch) rất lớn (~2GB)

## Giải pháp

### Option 1: Yêu cầu Python system (Đơn giản - Đang dùng)
App sẽ tự động:
1. Tìm Python trên máy user (py, python, python3)
2. Kiểm tra dependencies
3. Tự động cài đặt nếu thiếu (lần đầu chạy)

**Ưu điểm:**
- Installer nhỏ gọn
- Dễ maintain
- User có thể update Python độc lập

**Nhược điểm:**
- Yêu cầu user có Python (>= 3.8)
- Lần đầu chạy cần internet để tải dependencies

### Option 2: Đóng gói Python portable (Phức tạp)
Đóng gói Python + dependencies vào installer

**Ưu điểm:**
- Không cần Python trên máy user
- Hoạt động offline

**Nhược điểm:**
- Installer rất lớn (~500MB - 1GB)
- Khó maintain
- Build time lâu

### Option 3: Tải Python runtime khi cần (Hybrid)
App tải Python portable khi user bật tính năng OCR lần đầu

## Cấu hình hiện tại

### electron/lib/pythonOCR.ts
```typescript
// Tự động tìm Python theo thứ tự:
// 1. Virtual env (dev mode)
// 2. Python launcher (py)
// 3. System Python (python/python3)
```

### package.json
```json
"files": [
  "python/**/*",        // Include Python scripts
  "!python/venv/**/*",  // Exclude venv
  "!python/__pycache__/**/*"
]
```

## Hướng dẫn cho User

### Windows
1. Cài Python từ https://www.python.org/downloads/ (>= 3.8)
2. Chọn "Add Python to PATH" khi cài
3. Chạy app, Python OCR sẽ tự động setup

### Kiểm tra Python
```cmd
py --version
# hoặc
python --version
```

## Build Production

```bash
# Build installer
npm run build:installer

# Installer sẽ chứa:
# - App code
# - Python scripts (ocr_service.py)
# - KHÔNG chứa Python runtime và dependencies
```

## Testing Production Build

```bash
# 1. Build installer
npm run build:installer

# 2. Cài đặt từ release/DALIT-Setup-x.x.x.exe

# 3. Kiểm tra logs
# - Mở DevTools (Ctrl+Shift+I)
# - Check console logs về Python paths
```

## Troubleshooting

### "Python OCR not available"
- Kiểm tra Python đã cài chưa: `py --version`
- Kiểm tra PATH: Python phải trong system PATH
- Xem logs trong DevTools

### "Module not found: easyocr"
- App sẽ tự động cài lần đầu
- Nếu lỗi, cài thủ công: `py -m pip install easyocr torch torchvision`

### Logs quan trọng
```
✅ Found Python at: py
Python OCR configuration: { ... }
✅ Using Python OCR (EasyOCR)
```
