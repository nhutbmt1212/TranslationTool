# 🚀 Auto Python Setup - Hướng dẫn

## Tính năng mới

DALIT giờ đây tự động kiểm tra và hướng dẫn cài đặt Python OCR khi khởi động lần đầu!

## Cách hoạt động

### Lần đầu mở DALIT:

```
1. App khởi động
   ↓
2. Sau 3 giây, kiểm tra:
   - ✅ Có Python không?
   - ✅ Có EasyOCR không?
   ↓
3a. NẾU THIẾU PYTHON:
    → Hiện dialog: "Python is not installed"
    → Options:
      [Install Python] → Mở trang download Python
      [Skip] → Dùng Tesseract.js
      [Remind Me Later] → Hỏi lại lần sau
   
3b. NẾU CÓ PYTHON NHƯNG THIẾU EASYOCR:
    → Hiện dialog: "Install EasyOCR?"
    → Options:
      [Install EasyOCR] → Chạy script tự động cài
      [Skip] → Dùng Tesseract.js
      [Remind Me Later] → Hỏi lại lần sau
   
3c. NẾU ĐÃ CÓ ĐẦY ĐỦ:
    → Không hiện gì, tự động dùng Python OCR
```

## User Experience

### Scenario 1: User không có Python

```
[Dialog xuất hiện]
┌─────────────────────────────────────┐
│ Python OCR Setup                    │
├─────────────────────────────────────┤
│ Python is not installed             │
│                                     │
│ DALIT can use Python OCR (EasyOCR) │
│ for better text recognition.       │
│                                     │
│ Would you like to install Python?  │
│                                     │
│ Note: You can skip and use         │
│ Tesseract.js instead.               │
├─────────────────────────────────────┤
│ [Install Python] [Skip] [Later]    │
└─────────────────────────────────────┘

User clicks "Install Python"
→ Browser mở: https://www.python.org/downloads/
→ Dialog: "Please install Python and check 'Add to PATH'"
→ User cài Python
→ Khởi động lại DALIT
→ Lần sau sẽ hỏi cài EasyOCR
```

### Scenario 2: User có Python, chưa có EasyOCR

```
[Dialog xuất hiện]
┌─────────────────────────────────────┐
│ Python OCR Setup                    │
├─────────────────────────────────────┤
│ Install EasyOCR?                    │
│                                     │
│ Python is installed, but EasyOCR   │
│ is not.                             │
│                                     │
│ Installation will download ~2GB.   │
│                                     │
│ Would you like to install it now?  │
├─────────────────────────────────────┤
│ [Install EasyOCR] [Skip] [Later]   │
└─────────────────────────────────────┘

User clicks "Install EasyOCR"
→ Terminal window mở
→ Chạy: py -m pip install easyocr torch torchvision
→ Hiện progress trong terminal
→ Sau 5-10 phút: "Installation complete!"
→ User khởi động lại DALIT
→ Python OCR ready! ✅
```

### Scenario 3: User đã có đầy đủ

```
[Không có dialog nào]
→ App khởi động bình thường
→ Console log: "✅ Python OCR is ready!"
→ Khi dịch ảnh: "✅ Using Python OCR (EasyOCR)"
```

## Files được tạo

### 1. `scripts/install-python.bat`
Script Windows để cài EasyOCR tự động

### 2. `electron/lib/pythonSetup.ts`
Logic kiểm tra và prompt user

### 3. Tích hợp vào `electron/main.ts`
Chạy check sau 3 giây khi app khởi động

## Cấu hình

### Bỏ qua prompt (cho user không muốn Python OCR)

Khi user chọn "Skip", app tạo file:
```
%APPDATA%/DALIT/.skip-python-prompt
```

Để reset (hỏi lại):
```
Xóa file: %APPDATA%/DALIT/.skip-python-prompt
```

## Testing

### Test trong development:

```bash
npm run dev
```

Sau 3 giây, dialog sẽ xuất hiện (nếu chưa có Python/EasyOCR)

### Test trong production:

```bash
npm run build
release\win-unpacked\DALIT.exe
```

## Lợi ích

✅ **User-friendly**: Không cần đọc docs, app tự hướng dẫn
✅ **Non-intrusive**: Chỉ hỏi 1 lần, không spam
✅ **Flexible**: User có thể skip hoặc cài sau
✅ **Automatic**: Script tự động cài EasyOCR
✅ **Fallback**: Vẫn dùng được Tesseract.js nếu không cài

## Cải tiến trong tương lai

1. **Progress bar** cho quá trình cài đặt
2. **Download Python portable** tự động (không cần user cài)
3. **Background installation** (cài trong khi dùng app)
4. **Settings panel** để bật/tắt Python OCR
