@echo off
title ZORY Platform - Khoi dong he thong

echo ========================================================
echo        ZORY - Stories Beyond Imagination
echo    AI-Powered Reading, Storytelling and Audiobook
echo ========================================================
echo.

:: 1. Kiem tra Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [LOI] Khong tim thay Node.js tren he thong!
    echo Vui long cai dat Node.js tai https://nodejs.org
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do set NODE_VERSION=%%v
echo [OK] Node.js da duoc cai dat: %NODE_VERSION%

:: 2. Kiem tra file .env
if not exist ".env" (
    echo [THONG BAO] Chua co file .env, dang tao tu .env.example...
    copy .env.example .env >nul
    echo [OK] Da tao file .env
)

:: 3. Kiem tra node_modules
if not exist "node_modules" (
    echo [THONG BAO] Dang cai dat dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [LOI] Khong the cai dat dependencies.
        pause
        exit /b 1
    )
)

:: 4. Kiem tra Database
if not exist "prisma\dev.db" (
    echo [THONG BAO] Dang khoi tao database va seed du lieu...
    call npx prisma db push
    call node prisma\seed.js
    echo [OK] Khoi tao database thanh cong!
)

:: 5. Khoi dong dev server
echo.
echo ========================================================
echo   ZORY Platform san sang tai: http://localhost:3000
echo.
echo   Tai khoan demo:
echo   - Admin:  admin@zory.vn  / admin123
echo   - Author: author@zory.vn / author123
echo   - Reader: reader@zory.vn / reader123
echo.
echo   Nhan Ctrl+C de dung server.
echo ========================================================
echo.

call npm run dev
pause