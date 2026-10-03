@echo off
title Ruang Bahagia - Backend API (Laravel)
echo ===================================================
echo   Menjalankan Backend API Ruang Bahagia (Laravel)
echo   URL: http://localhost:8000
echo ===================================================
echo.

cd /d "%~dp0backend"

if not exist .env (
    if exist .env.example (
        echo [INFO] Menyiapkan .env dari .env.example...
        copy .env.example .env
        call php artisan key:generate
    )
)

echo [INFO] Menjalankan server Laravel artisan...
call php artisan serve --port=8000
pause
