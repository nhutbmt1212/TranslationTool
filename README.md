# 🌍 Translate Tool

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Electron](https://img.shields.io/badge/Electron-47848F?style=flat-square&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)

> **AI-First Translation Cockpit** - An intelligent, modern, and powerful multi-language translation assistant.

![Translate Tool Interface](./src/assets/screenshot-main.png)

## 📖 Introduction

**Translate Tool** is not just a simple translation app. It is a translation "cockpit" designed for the ultimate user experience, delivering smoothness, speed, and precision. With a modern Dark Mode interface, refined effects, and powerful language processing capabilities, Translate Tool helps you break down language barriers in style.

Built on the most modern web technologies: **Electron**, **React**, **TypeScript**, and **Vite**, ensuring high performance and easy scalability.

## ✨ Key Features

| Feature | Description |
|-----------|-------|
| **🎨 Premium UI** | Luxurious Dark Mode design, Glassmorphism, and smooth animations. |
| **🚀 Instant Translation** | Ultra-fast response speed, supporting Real-time translation. |
| **🌍 Multi-language** | Support for over 100 languages (Vietnamese, English, Chinese, Japanese, Korean, French, German...). |
| **🧠 AI Detection** | Smart automatic source language detection. |
| **📸 Image Translation** | Paste or upload images to extract and translate text instantly using advanced OCR powered by Gemini AI. |
| **⌨️ Quick Paste** | Press Ctrl+V to paste text or images and translate automatically. |
| **💻 Powerful CLI** | Includes a command-line interface (CLI) for automation tasks. |

## 🛠️ Tech Stack

*   **Core**: [Electron](https://www.electronjs.org/) (Desktop Runtime)
*   **Frontend**: [React](https://reactjs.org/), [Vite](https://vitejs.dev/)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: Modern CSS (Variables, Flexbox/Grid, Animations)
*   **API**: Google Translate API, Gemini AI (for advanced features)

## 🚀 Quick Start

### System Requirements
*   Node.js >= 18.0.0
*   npm or yarn

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-username/translate-tool.git
    cd translate-tool
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Configuration**
    Create a `.env` file in the root directory and add your API Key (if needed for advanced features):
    ```env
    VITE_GEMINI_API_KEY=your_api_key_here
    ```

4.  **Run Application (Development)**
    ```bash
    npm run electron:dev
    ```
    *This command runs both the Vite Server and Electron App with Hot Reload enabled.*

## 📦 Build & Release

To package the application for Windows/macOS/Linux:

```bash
npm run electron:build
```
The installer will be created in the `release/` directory.

## 📸 Screenshots

### Main Interface
![Main Interface](./src/assets/screenshot-main.png)

### Language Selection
![Language Selection](./src/assets/screenshot-languages.png)

### Image Translation (OCR)
![Image Translation](./src/assets/screenshot-ocr.png)
*Paste or upload images to extract and translate text instantly using Gemini AI-powered OCR*

## 🤝 Contributing

We welcome all contributions! Please fork the project and create a Pull Request.

## 📄 License

This project is released under the [MIT License](LICENSE).