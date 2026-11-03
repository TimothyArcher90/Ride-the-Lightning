@echo off
title Ride the Lightning - actualizador 24-7
cd /d "%~dp0"
echo Actualizador de datos vivo. Deja esta ventana abierta (Ctrl+C para cerrar).
node servidor\cli.mjs vivo
pause
