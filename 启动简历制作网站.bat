@echo off
setlocal
cd /d "%~dp0"

powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $web = Invoke-WebRequest -Uri 'http://127.0.0.1:5173/' -UseBasicParsing -TimeoutSec 2; $api = Invoke-WebRequest -Uri 'http://127.0.0.1:8787/api/health' -UseBasicParsing -TimeoutSec 2; if ($web.StatusCode -eq 200 -and $api.StatusCode -eq 200) { Start-Process 'http://127.0.0.1:5173/'; exit 0 } } catch { exit 1 }; exit 1"
if not errorlevel 1 exit /b 0

if not exist "node_modules\vite\bin\vite.js" (
  echo Installing dependencies with China mirror...
  call npm install --registry=https://registry.npmmirror.com --fetch-timeout=600000 --fetch-retries=3
  if errorlevel 1 (
    echo.
    echo Dependency installation failed. Please check the network and try again.
    pause
    exit /b 1
  )
)

call npm run dev
pause
