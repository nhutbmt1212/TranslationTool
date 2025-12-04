# 🎯 Hướng dẫn sử dụng Python OCR trong DALIT

## 📖 Giới thiệu

DALIT có 2 công nghệ nhận dạng chữ (OCR):

1. **Tesseract.js** (JavaScript) - Tích hợp sẵn, không cần cài gì thêm
2. **EasyOCR** (Python) - Chính xác hơn, nhưng cần Python

## 🚀 Cách hoạt động tự động

### Khi bạn mở DALIT lần đầu:

```
1. Bạn cài DALIT từ file Setup.exe
   ↓
2. Mở DALIT và thử dịch ảnh
   ↓
3. DALIT tự động kiểm tra:
   - ✅ Có Python trên máy không? (py, python, python3)
   - ✅ Có EasyOCR đã cài chưa?
   ↓
4a. NẾU CÓ Python + EasyOCR:
    → Dùng Python OCR (chính xác cao)
    → Bạn thấy: "✅ Using Python OCR (EasyOCR)"
   
4b. NẾU KHÔNG CÓ:
    → Dùng Tesseract.js (vẫn OK)
    → Bạn thấy: "❌ Python OCR not available, using Tesseract"
```

## 💡 Tại sao không tự động cài Python?

**Lý do:**
- Python + EasyOCR rất nặng (~2GB)
- Không phải ai cũng cần độ chính xác cao
- Tesseract.js đã đủ tốt cho hầu hết trường hợp

**Ưu điểm của cách này:**
- ✅ Installer nhỏ gọn (~100MB thay vì ~1GB)
- ✅ Cài đặt nhanh
- ✅ User tự quyết định có muốn Python OCR không

## 🔧 Cách bật Python OCR (nếu muốn)

### Bước 1: Cài Python

1. Tải Python từ: https://www.python.org/downloads/
2. Chọn phiên bản mới nhất (Python 3.8+)
3. **QUAN TRỌNG**: Tích ✅ "Add Python to PATH"
4. Cài đặt

### Bước 2: Cài EasyOCR

Mở Command Prompt (cmd) và chạy:

```cmd
py -m pip install easyocr torch torchvision
```

**Lưu ý:**
- Cần internet
- Tải ~2GB
- Mất 5-10 phút

### Bước 3: Khởi động lại DALIT

Đóng và mở lại DALIT. Thử dịch ảnh, bạn sẽ thấy:

```
✅ Using Python OCR (EasyOCR)
```

## 🎭 Demo: Trải nghiệm của User

### Scenario 1: User không có Python

```
User: *Cài DALIT từ Setup.exe*
User: *Mở app, thử dịch ảnh*
DALIT: "Đang dịch..." 
       (Dùng Tesseract.js)
User: "Ồ, dịch được rồi! Tuy nhiên có vài chữ sai..."
```

### Scenario 2: User có Python sẵn

```
User: *Đã có Python từ trước (lập trình viên)*
User: *Cài DALIT, mở app*
User: *Thử dịch ảnh*
DALIT: "Đang dịch..."
       (Tự động phát hiện Python)
       "Cần cài EasyOCR, bạn có muốn cài không?"
User: "OK" → DALIT tự động chạy: pip install easyocr
User: *Dịch lại*
DALIT: "✅ Using Python OCR"
User: "Wow, chính xác hơn nhiều!"
```

### Scenario 3: User muốn độ chính xác cao

```
User: "Sao app dịch sai nhiều vậy?"
User: *Đọc hướng dẫn*
User: "À, cần cài Python để chính xác hơn"
User: *Cài Python theo hướng dẫn*
User: *Cài EasyOCR*
User: *Khởi động lại DALIT*
User: "Perfect! Giờ chính xác 99%!"
```

## 🔍 Kiểm tra trạng thái

### Cách 1: Xem Console Logs

1. Mở DALIT
2. Nhấn `Ctrl + Shift + I` (DevTools)
3. Tab "Console"
4. Thử dịch ảnh
5. Xem logs:

```
✅ Using Python OCR (EasyOCR)  ← Đang dùng Python
hoặc
❌ Python OCR not available, using Tesseract  ← Đang dùng Tesseract
```

### Cách 2: Kiểm tra Python

Mở Command Prompt:

```cmd
py --version
```

Nếu thấy `Python 3.x.x` → Có Python

```cmd
py -c "import easyocr"
```

Nếu không lỗi → Có EasyOCR

## ❓ FAQ

### Q: Tại sao không tự động cài Python cho tôi?

A: Vì:
- Cần quyền admin
- Tải 2GB (không phải ai cũng muốn)
- User có thể đã có Python sẵn

### Q: Tesseract.js có tệ không?

A: Không! Vẫn OK cho hầu hết trường hợp. Python OCR chỉ tốt hơn 10-20%.

### Q: Tôi không biết code, có cài được không?

A: Có! Chỉ cần:
1. Tải Python (như cài phần mềm bình thường)
2. Copy-paste lệnh vào cmd
3. Đợi cài xong

### Q: Cài xong có tốn dung lượng không?

A: Có, ~2GB cho Python + EasyOCR. Nhưng bạn có thể gỡ bất cứ lúc nào.

### Q: App có chạy chậm hơn không?

A: Không! Python OCR thậm chí nhanh hơn Tesseract.js.

## 🎉 Tóm tắt

**Không cần làm gì:**
- DALIT hoạt động ngay với Tesseract.js
- Độ chính xác: Tốt (80-90%)

**Muốn tốt hơn:**
- Cài Python + EasyOCR (5-10 phút)
- Độ chính xác: Rất tốt (95-99%)
- DALIT tự động phát hiện và dùng

**Lựa chọn của bạn!** 🚀
