@echo off
REM Auto-install Python Embedded and EasyOCR for DALIT
REM This script downloads Python portable and installs dependencies automatically

REM ========================================
REM Auto-elevate to admin using PowerShell
REM ========================================
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Requesting administrative privileges...
    powershell -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /B
)

REM Now running as admin
cd /D "%~dp0"

setlocal enabledelayedexpansion

REM Define spinner characters
set "SPINNER_CHARS=/-\|"

echo ========================================
echo DALIT - Python OCR Auto Setup
echo ========================================
echo [Running as Administrator]
echo.

REM Get the directory where this script is located
set "SCRIPT_DIR=%~dp0"
set "PYTHON_DIR=%SCRIPT_DIR%..\python-embedded"
set "PYTHON_EXE=%PYTHON_DIR%\python.exe"

REM ========================================
REM Check and install VC++ Redistributable
REM ========================================
echo Checking Microsoft Visual C++ Redistributable...

REM Check if VC++ 2015-2022 x64 is installed via registry
reg query "HKLM\SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\x64" /v Version >nul 2>&1
if %errorlevel% == 0 (
    echo [OK] Visual C++ Redistributable is installed.
    goto :check_python
)

REM Alternative check for newer versions
reg query "HKLM\SOFTWARE\WOW6432Node\Microsoft\VisualStudio\14.0\VC\Runtimes\x64" /v Version >nul 2>&1
if %errorlevel% == 0 (
    echo [OK] Visual C++ Redistributable is installed.
    goto :check_python
)

REM VC++ not found, download and install
echo [!] Visual C++ Redistributable not found. Installing...
echo.

set "VCREDIST_URL=https://aka.ms/vs/17/release/vc_redist.x64.exe"
set "VCREDIST_EXE=%TEMP%\vc_redist.x64.exe"

echo Downloading Visual C++ Redistributable...
powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%VCREDIST_URL%' -OutFile '%VCREDIST_EXE%'}"

if %errorlevel% neq 0 (
    echo [ERROR] Failed to download Visual C++ Redistributable!
    echo Please download manually from: %VCREDIST_URL%
    pause
    exit /b 1
)

echo Installing Visual C++ Redistributable...
echo This may take 1-2 minutes, please wait...
echo.

REM Use /passive to show progress UI (not completely silent)
start /wait "" "%VCREDIST_EXE%" /install /passive /norestart

REM Check if installation succeeded
reg query "HKLM\SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\x64" /v Version >nul 2>&1
if %errorlevel% == 0 (
    echo [OK] Visual C++ Redistributable installed successfully!
) else (
    reg query "HKLM\SOFTWARE\WOW6432Node\Microsoft\VisualStudio\14.0\VC\Runtimes\x64" /v Version >nul 2>&1
    if %errorlevel% == 0 (
        echo [OK] Visual C++ Redistributable installed successfully!
    ) else (
        echo [WARNING] VC++ installation may have failed. Continuing anyway...
    )
)

REM Clean up
del "%VCREDIST_EXE%" >nul 2>&1
echo.

:check_python

REM Check if Python is already installed (system or embedded)
py --version >nul 2>&1
if %errorlevel% == 0 (
    echo [OK] Python launcher found!
    set "PYTHON_CMD=py"
    goto :install_deps
)

python --version >nul 2>&1
if %errorlevel% == 0 (
    echo [OK] Python found in PATH!
    set "PYTHON_CMD=python"
    goto :install_deps
)

if exist "%PYTHON_EXE%" (
    echo [OK] Python embedded found!
    set "PYTHON_CMD=%PYTHON_EXE%"
    goto :install_deps
)

REM Python not found, download Python embedded
echo [!] Python not found. Downloading Python embedded...
echo.

REM Create python-embedded directory
if not exist "%PYTHON_DIR%" mkdir "%PYTHON_DIR%"

REM Download Python 3.11 embedded (smaller, faster)
set "PYTHON_URL=https://www.python.org/ftp/python/3.11.9/python-3.11.9-embed-amd64.zip"
set "PYTHON_ZIP=%PYTHON_DIR%\python-embedded.zip"

echo Downloading Python from: %PYTHON_URL%
echo This may take a few minutes...
echo.

powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%PYTHON_URL%' -OutFile '%PYTHON_ZIP%'}"

if %errorlevel% neq 0 (
    echo [ERROR] Failed to download Python!
    echo Please check your internet connection.
    pause
    exit /b 1
)

echo [OK] Download complete!
echo.

REM Extract Python
echo Extracting Python...
powershell -Command "Expand-Archive -Path '%PYTHON_ZIP%' -DestinationPath '%PYTHON_DIR%' -Force"

if %errorlevel% neq 0 (
    echo [ERROR] Failed to extract Python!
    pause
    exit /b 1
)

REM Clean up zip file
del "%PYTHON_ZIP%"

REM Enable pip in embedded Python
echo Configuring Python...
echo import sys > "%PYTHON_DIR%\sitecustomize.py"
echo import os >> "%PYTHON_DIR%\sitecustomize.py"
echo sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'Lib', 'site-packages')) >> "%PYTHON_DIR%\sitecustomize.py"

REM Uncomment import site in python311._pth
powershell -Command "(Get-Content '%PYTHON_DIR%\python311._pth') -replace '#import site', 'import site' | Set-Content '%PYTHON_DIR%\python311._pth'"

REM Download get-pip.py
echo Downloading pip...
powershell -Command "Invoke-WebRequest -Uri 'https://bootstrap.pypa.io/get-pip.py' -OutFile '%PYTHON_DIR%\get-pip.py'"

REM Install pip
echo Installing pip...
"%PYTHON_EXE%" "%PYTHON_DIR%\get-pip.py" --no-warn-script-location

if %errorlevel% neq 0 (
    echo [ERROR] Failed to install pip!
    pause
    exit /b 1
)

echo [OK] Python embedded installed successfully!
echo.

set "PYTHON_CMD=%PYTHON_EXE%"

:install_deps
echo ========================================
echo Installing EasyOCR and dependencies...
echo This will download ~2GB of data
echo Please be patient, this may take 10-15 minutes
echo ========================================
echo.

REM Upgrade pip first
echo.
echo ^> [1/4] Upgrading pip...
call :run_with_spinner "%PYTHON_CMD% -m pip install --upgrade pip --no-warn-script-location -q"
if %errorlevel% neq 0 (
    echo   [X] Failed to upgrade pip!
    pause
    exit /b 1
)
echo   [OK] pip upgraded successfully

REM Install PyTorch
echo.
echo ^> [2/4] Installing PyTorch (~1.5GB)...
echo   This may take several minutes, please wait...
"%PYTHON_CMD%" -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu --no-warn-script-location --progress-bar on
if %errorlevel% neq 0 (
    echo   [X] Failed to install PyTorch!
    pause
    exit /b 1
)
echo   [OK] PyTorch installed successfully

REM Install EasyOCR
echo.
echo ^> [3/5] Installing EasyOCR (~500MB)...
"%PYTHON_CMD%" -m pip install easyocr --no-warn-script-location --progress-bar on
if %errorlevel% neq 0 (
    echo   [X] Failed to install EasyOCR!
    pause
    exit /b 1
)
echo   [OK] EasyOCR installed successfully

REM Install edge-tts for Text-to-Speech
echo.
echo ^> [4/5] Installing edge-tts (Text-to-Speech)...
"%PYTHON_CMD%" -m pip install edge-tts --no-warn-script-location --progress-bar on
if %errorlevel% neq 0 (
    echo   [WARNING] Failed to install edge-tts, TTS will use fallback
) else (
    echo   [OK] edge-tts installed successfully
)

echo.
echo ^> [5/5] Verifying installation...
"%PYTHON_CMD%" -c "import easyocr; print('   EasyOCR version:', easyocr.__version__)"

if %errorlevel% neq 0 (
    echo   [X] EasyOCR verification failed!
    pause
    exit /b 1
)

"%PYTHON_CMD%" -c "import edge_tts; print('   edge-tts: OK')" 2>nul
if %errorlevel% neq 0 (
    echo   [WARNING] edge-tts not available, using fallback TTS
)

:success
echo.
echo ========================================
echo [SUCCESS] Installation complete!
echo ========================================
echo.
echo Python OCR is now ready to use.
echo.
echo Installation details:
if exist "%PYTHON_EXE%" (
    echo - Python location: %PYTHON_DIR%
) else (
    echo - Using system Python
)
echo - EasyOCR: Installed
echo - PyTorch: Installed
echo - edge-tts: Installed (Text-to-Speech)
echo.

REM Create success marker file so DALIT knows installation completed
echo %date% %time% > "%SCRIPT_DIR%..\python-ocr-installed.flag"

REM Find and restart DALIT
echo Restarting DALIT...
echo.

REM Kill existing DALIT process
taskkill /IM "DALIT.exe" /F >nul 2>&1

REM Wait a moment for process to fully close
timeout /t 2 /nobreak >nul

REM Find DALIT executable and restart
set "DALIT_EXE="
if exist "%LOCALAPPDATA%\Programs\DALIT\DALIT.exe" (
    set "DALIT_EXE=%LOCALAPPDATA%\Programs\DALIT\DALIT.exe"
)
if exist "%ProgramFiles%\DALIT\DALIT.exe" (
    set "DALIT_EXE=%ProgramFiles%\DALIT\DALIT.exe"
)
if exist "%SCRIPT_DIR%..\..\..\DALIT.exe" (
    set "DALIT_EXE=%SCRIPT_DIR%..\..\..\DALIT.exe"
)

if defined DALIT_EXE (
    echo Starting DALIT from: %DALIT_EXE%
    start "" "%DALIT_EXE%"
    echo.
    echo DALIT is restarting...
    timeout /t 3 /nobreak >nul
) else (
    echo Could not find DALIT executable.
    echo Please restart DALIT manually.
    pause
)

exit /b 0

REM ========================================
REM Spinner function for quick commands
REM ========================================
:run_with_spinner
setlocal
set "CMD=%~1"

powershell -Command "$spinner = '|','/','-','\'; $i=0; $job = Start-Job { Invoke-Expression '%CMD%' }; while($job.State -eq 'Running') { Write-Host \"`r   $($spinner[$i %% 4]) Working...\" -NoNewline; Start-Sleep -Milliseconds 120; $i++ }; Write-Host \"`r                    `r\" -NoNewline; Receive-Job $job; if($job.State -eq 'Failed'){exit 1}"

endlocal & exit /b %errorlevel%
