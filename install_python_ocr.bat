@echo off
echo ========================================
echo   DALIT - Python OCR Installation
echo ========================================
echo.
echo This will install EasyOCR for better OCR accuracy.
echo.
echo Requirements:
echo - Internet connection
echo - ~2GB download
echo - ~3GB disk space
echo - 5-10 minutes
echo.
pause

echo.
echo [1/3] Checking Python...
py --version
if errorlevel 1 (
    echo.
    echo ERROR: Python not found!
    echo Please install Python from: https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation.
    pause
    exit /b 1
)

echo.
echo [2/3] Upgrading pip...
py -m pip install --upgrade pip

echo.
echo [3/3] Installing EasyOCR (this may take 5-10 minutes)...
py -m pip install easyocr torch torchvision

echo.
echo ========================================
echo   Installation Complete!
echo ========================================
echo.
echo You can now close this window and restart DALIT.
echo Python OCR will be automatically detected.
echo.
pause
