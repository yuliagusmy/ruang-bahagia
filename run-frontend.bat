@echo off
title Ruang Bahagia - Frontend (Vite)
echo ===================================================
echo   Menjalankan Frontend Ruang Bahagia (Vite PWA)
echo   URL: http://localhost:5173
echo ===================================================
echo.

cd /d "%~dp0frontend"

if not exist node_modules (
    echo [INFO] Folder node_modules belum ada, menginstall dependensi...
    call npm install
)

echo [INFO] Menjalankan server dev Vite...
call npm run dev
pause
