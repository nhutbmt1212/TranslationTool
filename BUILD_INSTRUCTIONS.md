# 🚀 Hướng dẫn Build Ứng dụng Translate Tool

## 📋 Các cách build

### ⚡ **Cách 1: Sử dụng PowerShell Script (Khuyến nghị)**

```powershell
# Chạy script tự động
.\build.ps1
```

Script này sẽ tự động:
1. ✅ Build source code
2. ✅ Tạo thư mục unpacked
3. ✅ Tạo file portable ZIP

---

### 🔧 **Cách 2: Sử dụng npm scripts**

#### Build source code + unpacked
```bash
npm run build:portable
```

Sau đó tạo file ZIP:
```powershell
Compress-Archive -Path "release\win-unpacked\*" -DestinationPath "release\Translate-Tool-Portable.zip" -Force
```

---

### 📦 **Cách 3: Build từng bước thủ công**

#### Bước 1: Build source code
```bash
npm run build:electron
```

Lệnh này sẽ:
- Compile TypeScript → JavaScript
- Build React app với Vite
- Tạo thư mục `dist/` và `dist-electron/`

#### Bước 2: Tạo thư mục unpacked
```bash
npx electron-builder build --win --x64 --dir
```

Tạo thư mục `release/win-unpacked/` với file `Translate Tool.exe`

#### Bước 3: Tạo file Portable ZIP
```powershell
Compress-Archive -Path "release\win-unpacked\*" -DestinationPath "release\Translate-Tool-Portable.zip" -Force
```

---

## 📝 Tất cả các lệnh npm có sẵn

```bash
# Development
npm run dev                 # Chạy Vite dev server
npm run electron:dev        # Chạy ứng dụng Electron ở chế độ dev

# Build
npm run build:electron      # Build source code only
npm run build:portable      # Build source + tạo unpacked
npm run electron:build      # Build + tạo installer (có thể lỗi)

# CLI
npm run cli:dev             # Chạy CLI ở chế độ dev
npm run cli:build           # Build CLI
npm run cli:start           # Chạy CLI đã build

# Preview
npm run preview             # Preview build Vite
```

---

## 📂 Kết quả sau khi build

```
release/
├── win-unpacked/                    # Thư mục ứng dụng
│   ├── Translate Tool.exe          # File chính ✅
│   ├── resources/
│   │   └── app.asar               # Code đã đóng gói
│   └── ...
│
└── Translate-Tool-Portable.zip     # File portable ✅
```

---

## ⚙️ Cấu hình Build

### File quan trọng:
- `package.json` - Cấu hình npm scripts và electron-builder
- `tsconfig.*.json` - Cấu hình TypeScript
- `vite.config.ts` - Cấu hình Vite
- `electron-builder.config.js` - Cấu hình electron-builder (tùy chọn)

### Thư mục build:
- `dist/` - React app đã build
- `dist-electron/` - Electron code đã compile
- `release/` - Output cuối cùng

---

## 🐛 Xử lý lỗi

### Lỗi: "winCodeSign error"
**Nguyên nhân**: electron-builder không thể tải xuống winCodeSign tools

**Giải pháp**: Bỏ qua lỗi này, file `win-unpacked` vẫn được tạo thành công

### Lỗi: "Unable to move the cache" (Dev mode)
**Nguyên nhân**: Warning về cache trong dev mode

**Giải pháp**: Không ảnh hưởng chức năng, có thể bỏ qua

### Lỗi: "Màn hình đen khi chạy app"
**Nguyên nhân**: Đường dẫn file HTML không đúng

**Giải pháp**: Đã fix trong `electron/main.ts` (dòng 46)

---

## 🎯 Quick Start

```powershell
# Build nhanh nhất
.\build.ps1

# Hoặc
npm run build:portable
Compress-Archive -Path "release\win-unpacked\*" -DestinationPath "release\Translate-Tool-Portable.zip" -Force
```

---

## 📦 Phân phối

Sau khi build, bạn có thể phân phối:
1. **File Portable**: `release/Translate-Tool-Portable.zip` (109 MB)
2. **Thư mục Unpacked**: `release/win-unpacked/`

Người dùng chỉ cần:
1. Giải nén file ZIP
2. Chạy `Translate Tool.exe`
3. Xong!

---

**Chúc bạn build thành công! 🎉**
