# 🔐 Hệ thống Quản lý API Key - Hướng dẫn sử dụng

## ✨ Tính năng đã triển khai

### 1. **Mã hóa AES-GCM chuyên nghiệp**
- Sử dụng thuật toán mã hóa AES-GCM 256-bit
- Key derivation với PBKDF2 (100,000 iterations)
- Device-specific encryption key (dựa trên đặc điểm thiết bị)
- Random salt và IV cho mỗi lần mã hóa

### 2. **Lưu trữ an toàn**
- API key được mã hóa trước khi lưu vào `sessionStorage`
- Tự động xóa khi đóng trình duyệt
- Không lưu vào localStorage hay file
- Cache trong memory để tối ưu hiệu suất

### 3. **UI/UX chuyên nghiệp**
- Settings Modal với thiết kế hiện đại
- Show/Hide password functionality
- Validation API key format (Google API keys)
- Masked display của API key hiện tại
- Success/Error feedback với animations
- Responsive design

### 4. **Đa ngôn ngữ**
- Hỗ trợ tiếng Anh và tiếng Việt
- Tự động theo ngôn ngữ giao diện

## 📁 Cấu trúc File

```
src/
├── utils/
│   ├── crypto.ts              # Mã hóa/giải mã AES-GCM
│   └── apiKeyManager.ts       # Quản lý API key
├── components/
│   └── SettingsModal.tsx      # Modal cài đặt
├── styles/
│   └── settings-modal.css     # Styles cho modal
└── hooks/
    └── useTranslationLogic.ts # Đã cập nhật để dùng ApiKeyManager
```

## 🚀 Cách sử dụng

### Cho người dùng:

1. **Mở Settings**
   - Click vào nút ⚙️ Settings ở góc trên bên phải

2. **Nhập API Key**
   - Nhập API key từ [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Click nút 👁️ để xem/ẩn key
   - Click "Save" để lưu

3. **Quản lý API Key**
   - Xem API key hiện tại (đã được mask)
   - Cập nhật API key mới
   - Xóa API key (nút 🗑️)

### Cho developer:

#### Sử dụng ApiKeyManager:

```typescript
import { ApiKeyManager } from './utils/apiKeyManager';

// Lưu API key
await ApiKeyManager.saveApiKey('AIza...');

// Lấy API key
const apiKey = await ApiKeyManager.getApiKey();

// Kiểm tra có API key không
const hasKey = ApiKeyManager.hasApiKey();

// Xóa API key
ApiKeyManager.clearApiKey();

// Validate format
const validation = ApiKeyManager.validateApiKeyFormat(apiKey);
if (!validation.valid) {
  console.error(validation.error);
}

// Lấy masked key để hiển thị
const masked = await ApiKeyManager.getMaskedApiKey();
// Returns: "AIzaSyBx...Ab12"
```

## 🔒 Bảo mật

### Các biện pháp bảo mật:

1. **Mã hóa mạnh mẽ**
   - AES-GCM 256-bit
   - PBKDF2 với 100,000 iterations
   - Random salt và IV

2. **Device-specific key**
   - Encryption key dựa trên:
     - User agent
     - Language
     - Timezone
     - Screen resolution
   - Khó reverse engineer

3. **Session-only storage**
   - Chỉ lưu trong sessionStorage
   - Tự động xóa khi đóng tab/browser
   - Không persist qua sessions

4. **Validation**
   - Kiểm tra format API key
   - Chỉ chấp nhận Google API key format
   - Error handling an toàn

### Lưu ý bảo mật:

⚠️ **QUAN TRỌNG:**
- API key chỉ được gửi đến Google AI API
- Không bao giờ gửi đến server khác
- Không log API key ra console
- Không share sessionStorage giữa các tabs

## 🎨 Customization

### Thay đổi validation rules:

Edit `src/utils/apiKeyManager.ts`:

```typescript
static validateApiKeyFormat(apiKey: string): { valid: boolean; error?: string } {
  // Thêm rules của bạn ở đây
}
```

### Thay đổi encryption parameters:

Edit `src/utils/crypto.ts`:

```typescript
const KEY_LENGTH = 256;      // 128, 192, or 256
const ITERATIONS = 100000;   // Tăng để bảo mật hơn (chậm hơn)
const IV_LENGTH = 12;        // 96 bits for GCM
```

## 🐛 Troubleshooting

### API key không lưu được:
- Kiểm tra format API key (phải bắt đầu với "AIza", 39 ký tự)
- Kiểm tra browser có hỗ trợ Web Crypto API không
- Xem console có lỗi không

### Không decrypt được:
- API key có thể bị corrupt
- Clear sessionStorage và nhập lại
- Kiểm tra không có lỗi trong crypto.ts

### Translation không hoạt động:
- Mở Settings và kiểm tra có API key không
- Thử xóa và nhập lại API key
- Kiểm tra API key còn valid không

## 📝 Migration từ .env

Nếu bạn đang dùng `.env`:

1. Lấy API key từ file `.env`
2. Mở Settings trong app
3. Nhập API key vào modal
4. Click Save
5. Xóa file `.env` (optional)

## 🔄 Updates

### Version 1.0
- ✅ AES-GCM encryption
- ✅ SessionStorage storage
- ✅ Settings modal UI
- ✅ API key validation
- ✅ Multi-language support
- ✅ Device-specific encryption

### Planned features:
- [ ] Import/Export settings (encrypted)
- [ ] Multiple API key profiles
- [ ] API usage statistics
- [ ] Key rotation reminders

## 📞 Support

Nếu có vấn đề, hãy:
1. Check console logs
2. Clear browser cache
3. Restart app
4. Tạo issue trên GitHub

---

**Tạo bởi:** Antigravity AI Assistant
**Ngày:** 2025-11-29
**Version:** 1.0.0
