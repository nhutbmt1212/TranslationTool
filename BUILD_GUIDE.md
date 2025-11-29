# 📦 Hướng dẫn đóng gói ứng dụng Translate Tool

## ✅ Kết quả hiện tại

Ứng dụng của bạn đã được build thành công! Bạn có thể sử dụng ngay:

### 1. **File Portable** (Khuyến nghị) 
📁 **Vị trí**: `release/Translate-Tool-Portable.zip` (109 MB)

**Cách sử dụng**:
```
1. Giải nén file Translate-Tool-Portable.zip
2. Chạy file "Translate Tool.exe"
3. Hoàn tất! Không cần cài đặt
```

**Ưu điểm**:
- ✅ Không cần cài đặt
- ✅ Không cần quyền admin
- ✅ Có thể chạy từ USB
- ✅ Dễ phân phối

### 2. **Thư mục Unpacked**
📁 **Vị trí**: `release/win-unpacked/`

Chứa tất cả file ứng dụng đã build, có thể chạy trực tiếp `Translate Tool.exe`

---

## 🔧 Tạo file Installer (.exe)

### Vấn đề gặp phải
Electron-builder đang gặp lỗi khi tạo NSIS installer do vấn đề với winCodeSign tools:
```
ERROR: Cannot create winCodeSign cache
```

### Giải pháp 1: Sử dụng Inno Setup (Đơn giản nhất)

#### Bước 1: Cài đặt Inno Setup
```powershell
winget install --id=JRSoftware.InnoSetup.6 -e
```

Hoặc tải từ: https://jrsoftware.org/isdl.php

#### Bước 2: Build installer
```powershell
# Mở Inno Setup Compiler
iscc installer.iss
```

File installer sẽ được tạo tại: `release/Translate-Tool-Setup.exe`

**Lưu ý**: File `installer.iss` đã được tạo sẵn trong thư mục gốc của dự án.

---

### Giải pháp 2: Sử dụng electron-builder với portable target

Thay vì NSIS, bạn có thể tạo file portable .exe:

```powershell
# Cập nhật package.json
# Thay "target": "nsis" thành "target": "portable"

# Sau đó chạy:
npm run electron:build
```

---

### Giải pháp 3: Tạo installer thủ công với NSIS

#### Bước 1: Cài đặt NSIS (đã cài)
```powershell
winget install --id=NSIS.NSIS -e
```

#### Bước 2: Tạo script NSIS
Tạo file `installer.nsi` với nội dung tương tự Inno Setup script.

#### Bước 3: Build
```powershell
makensis installer.nsi
```

---

## 📋 Các lệnh build đã sử dụng

```powershell
# 1. Build source code
npm run build:electron

# 2. Tạo file portable zip (Thành công ✅)
Compress-Archive -Path "release\win-unpacked\*" -DestinationPath "release\Translate-Tool-Portable.zip" -Force

# 3. Thử tạo NSIS installer (Thất bại ❌)
npx electron-builder --win nsis
```

---

## 🎯 Khuyến nghị

### Cho người dùng cuối:
**Sử dụng file Portable** (`Translate-Tool-Portable.zip`) - Đơn giản, nhanh chóng, không cần cài đặt.

### Nếu cần file installer chuyên nghiệp:
**Sử dụng Inno Setup** - Dễ dàng, miễn phí, và tạo installer chất lượng cao.

---

## 📝 Cấu trúc file đã build

```
release/
├── win-unpacked/              # Thư mục chứa ứng dụng đã build
│   ├── Translate Tool.exe     # File thực thi chính
│   ├── resources/             # Tài nguyên ứng dụng
│   └── ...                    # Các file DLL và dependencies
├── Translate-Tool-Portable.zip # File portable (109 MB) ✅
└── (Translate-Tool-Setup.exe) # File installer (sẽ tạo bằng Inno Setup)
```

---

## 🐛 Troubleshooting

### Lỗi: "electron-builder winCodeSign error"
**Nguyên nhân**: electron-builder không thể tải xuống hoặc giải nén winCodeSign tools.

**Giải pháp**:
1. Sử dụng file portable đã có
2. Hoặc tạo installer bằng Inno Setup
3. Hoặc thử xóa cache và build lại:
   ```powershell
   Remove-Item -Path "$env:LOCALAPPDATA\electron-builder\Cache" -Recurse -Force
   npm run electron:build
   ```

### Ứng dụng không chạy
- Kiểm tra Windows Defender/Antivirus
- Chạy với quyền administrator
- Kiểm tra .NET Framework đã cài đặt

---

## 🚀 Phân phối ứng dụng

### Cách 1: File Portable
Gửi file `Translate-Tool-Portable.zip` cho người dùng.

### Cách 2: File Installer
Sau khi tạo bằng Inno Setup, gửi file `Translate-Tool-Setup.exe`.

### Cách 3: Microsoft Store
Đóng gói thành MSIX package để đưa lên Microsoft Store.

---

## 📞 Hỗ trợ

Nếu gặp vấn đề, hãy kiểm tra:
1. File `BUILD_GUIDE.md` - Hướng dẫn chi tiết
2. File `installer.iss` - Script Inno Setup
3. Thư mục `release/` - Các file đã build

---

**Chúc bạn thành công! 🎉**
