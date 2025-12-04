# Hướng dẫn cài đặt Python OCR

## Tại sao cần Python?

DALIT sử dụng **EasyOCR** (Python) để nhận dạng chữ trong ảnh chính xác hơn. Đây là tính năng tùy chọn - nếu không có Python, app vẫn hoạt động với Tesseract.js (JavaScript OCR).

## Cài đặt Python (Windows)

### Bước 1: Tải Python
1. Truy cập: https://www.python.org/downloads/
2. Tải phiên bản mới nhất (Python 3.8 trở lên)
3. Chạy file cài đặt

### Bước 2: Cài đặt
⚠️ **QUAN TRỌNG**: Tích chọn **"Add Python to PATH"** trước khi cài!

![Python Installation](https://docs.python.org/3/_images/win_installer.png)

### Bước 3: Kiểm tra
Mở Command Prompt và chạy:
```cmd
py --version
```

Nếu thấy `Python 3.x.x` là thành công!

## Cài đặt EasyOCR

Sau khi có Python, cài EasyOCR:

```cmd
py -m pip install easyocr torch torchvision
```

**Lưu ý**: 
- Cần kết nối internet
- Tải khoảng 2GB dữ liệu
- Mất 5-10 phút

## Kiểm tra trong DALIT

1. Mở DALIT
2. Mở DevTools (Ctrl+Shift+I)
3. Thử dịch ảnh
4. Xem console logs:
   - ✅ `Using Python OCR (EasyOCR)` - Thành công!
   - ❌ `Python OCR not available, using Tesseract` - Cần cài Python

## Không muốn cài Python?

Không sao! DALIT vẫn hoạt động với Tesseract.js (OCR JavaScript). Chỉ là độ chính xác thấp hơn một chút.

## Gỡ lỗi

### "py is not recognized"
→ Python chưa được thêm vào PATH. Cài lại Python và tích "Add to PATH"

### "No module named 'easyocr'"
→ Chạy: `py -m pip install easyocr torch torchvision`

### Vẫn không hoạt động?
→ Mở issue trên GitHub với logs từ DevTools
