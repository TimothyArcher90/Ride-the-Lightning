@echo off
REM Instala Ride the Lightning la primera vez (dependencias, datos de ejemplo, acceso directo).
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0instalar.ps1"
pause
