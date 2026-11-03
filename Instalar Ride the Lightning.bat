@echo off
title Instalar Ride the Lightning
echo Comprobando Node.js...
node -v >nul 2>&1 || (echo Falta Node.js 22+ - instalalo desde https://nodejs.org y vuelve a ejecutar & pause & exit /b 1)
ffmpeg -version >nul 2>&1 || (echo Falta FFmpeg en el PATH - https://ffmpeg.org & pause & exit /b 1)
cd /d "%~dp0"
call npm install --no-audit --no-fund
if not exist datosiblioteca node servidor\cli.mjs bajar fed_balance
echo.
echo Listo. Abre "Iniciar Ride the Lightning.bat".
pause
