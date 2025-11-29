# Script build ứng dụng Translate Tool
# Chạy: .\build.ps1

Write-Host "🚀 Bắt đầu build ứng dụng Translate Tool..." -ForegroundColor Green

# Bước 1: Build source code
Write-Host "`n📦 Bước 1: Build source code..." -ForegroundColor Cyan
npm run build:electron

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Lỗi khi build source code!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build source code thành công!" -ForegroundColor Green

# Bước 2: Tạo thư mục unpacked
Write-Host "`n📦 Bước 2: Tạo thư mục unpacked..." -ForegroundColor Cyan
npx electron-builder build --win --x64 --dir

# Kiểm tra xem file exe có tồn tại không (bỏ qua lỗi winCodeSign)
if (Test-Path "release\win-unpacked\Translate Tool.exe") {
    Write-Host "✅ Tạo unpacked thành công!" -ForegroundColor Green
} else {
    Write-Host "❌ Không tìm thấy file exe!" -ForegroundColor Red
    exit 1
}

# Bước 3: Tạo file portable
Write-Host "`n📦 Bước 3: Tạo file portable..." -ForegroundColor Cyan

# Xóa file zip cũ nếu có
if (Test-Path "release\Translate-Tool-Portable.zip") {
    Remove-Item "release\Translate-Tool-Portable.zip" -Force
    Write-Host "🗑️  Đã xóa file zip cũ" -ForegroundColor Yellow
}

# Tạo file zip mới
Compress-Archive -Path "release\win-unpacked\*" -DestinationPath "release\Translate-Tool-Portable.zip" -Force

if (Test-Path "release\Translate-Tool-Portable.zip") {
    $fileSize = (Get-Item "release\Translate-Tool-Portable.zip").Length / 1MB
    Write-Host "✅ Tạo file portable thành công!" -ForegroundColor Green
    Write-Host "📦 File: release\Translate-Tool-Portable.zip" -ForegroundColor Cyan
    Write-Host "📊 Kích thước: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Cyan
} else {
    Write-Host "❌ Lỗi khi tạo file portable!" -ForegroundColor Red
    exit 1
}

# Hoàn thành
Write-Host "`n🎉 Build hoàn tất!" -ForegroundColor Green
Write-Host "📂 Các file đã tạo:" -ForegroundColor Cyan
Write-Host "   - release\win-unpacked\Translate Tool.exe" -ForegroundColor White
Write-Host "   - release\Translate-Tool-Portable.zip" -ForegroundColor White
Write-Host "`n✨ Bạn có thể sử dụng file portable để phân phối!" -ForegroundColor Green
