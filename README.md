# Translate Tool

Ứng dụng dịch thuật desktop sử dụng Google Translate API, được xây dựng bằng Electron + React + TypeScript.

## Tính năng

- ✨ Dịch văn bản giữa nhiều ngôn ngữ
- 🖼️ OCR từ ảnh (paste hoặc chọn file)
- 🌙 Dark/Light mode
- 🔐 API key được mã hóa và lưu trữ an toàn
- 🌍 Hỗ trợ đa ngôn ngữ giao diện (UI)
- 💾 Lưu trữ cài đặt người dùng

## Cài đặt

```bash
npm install
```

## Development

Chạy ứng dụng ở chế độ development:

```bash
npm run electron:dev
```

## Build

Build ứng dụng thành file executable:

```bash
npm run build
```

Ứng dụng sẽ được build vào thư mục `release/win-unpacked/`.

## Scripts

- `npm run dev` - Chạy Vite dev server
- `npm run electron:dev` - Chạy ứng dụng Electron ở chế độ development
- `npm run build:src` - Compile TypeScript và build Vite
- `npm run build` - Build ứng dụng hoàn chỉnh
- `npm run preview` - Preview production build

## Cấu trúc thư mục

```
├── src/
│   ├── components/     # React components
│   ├── hooks/          # Custom React hooks
│   ├── styles/         # CSS files
│   ├── utils/          # Utility functions
│   ├── data/           # Static data (languages)
│   ├── locales/        # i18n translations
│   └── App.tsx         # Main app component
├── electron/
│   ├── main.ts         # Electron main process
│   └── preload.ts      # Preload script
├── translator/
│   └── translator.ts   # Translation logic
└── dist-electron/      # Compiled Electron files
```

## API Key

Ứng dụng yêu cầu Google Gemini API key để hoạt động:

1. Lấy API key từ [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Mở Settings trong ứng dụng (nút ⚙️)
3. Nhập API key và lưu

API key được mã hóa bằng AES-GCM và lưu trữ an toàn trong localStorage.

## License

MIT
