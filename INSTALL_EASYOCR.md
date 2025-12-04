# Cài đặt EasyOCR cho DALIT

## Tại sao cần cài?

DALIT đã được build và cài đặt thành công, nhưng để sử dụng **Python OCR (EasyOCR)** - công nghệ nhận dạng chữ chính xác hơn, bạn cần cài thêm Python và EasyOCR.

**Không cài cũng được!** App vẫn hoạt động với Tesseract.js (JavaScript OCR).

## Bước 1: Kiểm tra Python

Mở Command Prompt (cmd) và chạy:

```cmd
py --version
```

### Nếu thấy: `Python 3.x.x`
✅ Bạn đã có Python! Chuyển sang Bước 2.

### Nếu thấy: `'py' is not recognized...`
❌ Cần cài Python:

1. Tải từ: https://www.python.org/downloads/
2. Chọn phiên bản mới nhất (Python 3.8+)
3. **QUAN TRỌNG**: Tích ✅ "Add Python to PATH"
4. Cài đặt
5. Khởi động lại Command Prompt
6. Test lại: `py --version`

## Bước 2: Cài EasyOCR

Mở Command Prompt và chạy:

```cmd
py -m pip install easyocr torch torchvision
```

**Lưu ý:**
- Cần kết nối internet
- Tải khoảng **2GB** dữ liệu
- Mất **5-10 phút**
- Có thể thấy nhiều text chạy - đừng lo, đó là bình thường!

### Nếu gặp lỗi "pip is not recognized"

Cài pip trước:

```cmd
py -m ensurepip --upgrade
```

Sau đó chạy lại lệnh cài EasyOCR.

## Bước 3: Khởi động lại DALIT

1. Đóng DALIT hoàn toàn
2. Mở lại DALIT
3. Thử dịch ảnh
4. Mở DevTools (Ctrl+Shift+I)
5. Xem Console, bạn sẽ thấy:

```
✅ Using Python OCR (EasyOCR)
```

## Kiểm tra cài đặt

Test EasyOCR:

```cmd
py -c "import easyocr; print('EasyOCR OK')"
```

Nếu thấy `EasyOCR OK` → Thành công!

## So sánh Tesseract vs EasyOCR

| Tính năng | Tesseract.js | EasyOCR (Python) |
|-----------|--------------|------------------|
| Cài đặt | ✅ Tích hợp sẵn | ⚠️ Cần cài thêm |
| Kích thước | Nhỏ (~10MB) | Lớn (~2GB) |
| Tốc độ | Trung bình | Nhanh |
| Độ chính xác | Tốt (80-90%) | Rất tốt (95-99%) |
| Chữ nghiêng | OK | Xuất sắc |
| Tiếng Việt | Tốt | Rất tốt |

## Gỡ lỗi

### "ModuleNotFoundError: No module named 'easyocr'"

→ EasyOCR chưa cài hoặc cài lỗi. Chạy lại:

```cmd
py -m pip install --upgrade easyocr torch torchvision
```

### "Python OCR not available, using Tesseract"

Kiểm tra:

1. Python đã cài chưa: `py --version`
2. EasyOCR đã cài chưa: `py -c "import easyocr"`
3. Khởi động lại DALIT

### Vẫn không được?

Mở DevTools (Ctrl+Shift+I) trong DALIT, xem logs chi tiết:

```
🔧 Python OCR configuration: { ... }
```

Copy logs và báo lỗi trên GitHub.

## Gỡ cài đặt (nếu không muốn dùng nữa)

```cmd
py -m pip uninstall easyocr torch torchvision
```

DALIT sẽ tự động quay về dùng Tesseract.js.
