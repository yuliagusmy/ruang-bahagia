@echo off
title Ruang Bahagia - Jalankan Backend & Frontend
echo ===================================================
echo   Memulai Ruang Bahagia (Lokal)
echo ===================================================
echo.

start "Ruang Bahagia - Backend (Port 8000)" cmd /k "%~dp0run-backend.bat"
timeout /t 2 /nobreak >nul
start "Ruang Bahagia - Frontend (Port 5173)" cmd /k "%~dp0run-frontend.bat"

echo [SUKSES] Backend dan Frontend telah dijalankan di jendela terminal terpisah:
echo  - Backend API : http://localhost:8000
echo  - Frontend Web: http://localhost:5173
echo.
echo Anda dapat menutup jendela ini (layanan tetap berjalan di terminal masing-masing).
pause
