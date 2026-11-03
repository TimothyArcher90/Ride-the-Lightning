@echo off
REM Arranca Ride the Lightning: se actualiza, abre el estudio en el navegador y deja el actualizador de datos en marcha.
REM Deja esta ventana abierta mientras lo usas. Para apagarlo, cierrala.
cd /d "%~dp0"
title Ride the Lightning
node servidorctualizar.mjs
node servidorstudio.mjs
if errorlevel 1 pause
