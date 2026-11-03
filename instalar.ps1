# Instala Ride the Lightning la primera vez (comprobaciones, dependencias, datos de ejemplo y acceso directo en el escritorio).
# Mismo proceso que Electric Eye: después basta con el icono del escritorio.
$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $raiz
function Paso($t) { Write-Host "`n== $t" -ForegroundColor Yellow }

Paso 'Comprobando Node.js y FFmpeg'
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Write-Host 'Falta Node.js 22+ (https://nodejs.org). Instálalo y vuelve a ejecutar.' -ForegroundColor Red; exit 1 }
if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) { Write-Host 'Falta FFmpeg en el PATH (https://ffmpeg.org).' -ForegroundColor Red; exit 1 }
Write-Host ("Node " + (node -v))

Paso 'Instalando dependencias'
npm install --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { Write-Host 'npm install falló.' -ForegroundColor Red; exit 1 }

Paso 'Descargando una serie de ejemplo (balance de la Fed, historia completa)'
if (-not (Test-Path (Join-Path $raiz 'datos\biblioteca\fed_balance.csv'))) { node servidor\cli.mjs bajar fed_balance }

Paso 'Creando acceso directo en el escritorio'
$escritorio = [Environment]::GetFolderPath('Desktop')
$atajo = (New-Object -ComObject WScript.Shell).CreateShortcut((Join-Path $escritorio 'Ride the Lightning.lnk'))
$atajo.TargetPath = Join-Path $raiz 'Iniciar Ride the Lightning.bat'
$atajo.WorkingDirectory = $raiz
$atajo.IconLocation = (Join-Path $raiz 'marca\ride-the-lightning.ico') + ',0'
$atajo.Description = 'Ride the Lightning: gráficas animadas con datos trazables'
$atajo.Save()

Paso 'Arrancando Ride the Lightning'
Start-Process -FilePath (Join-Path $raiz 'Iniciar Ride the Lightning.bat') -WorkingDirectory $raiz

Write-Host "`nTodo listo." -ForegroundColor Green
Write-Host 'El estudio se abre en el navegador: http://127.0.0.1:5180 (deja esa ventana negra abierta mientras lo usas).'
Write-Host 'Para volver a abrirlo otro día: doble clic en "Ride the Lightning" en el escritorio.'
