# Instrucciones para el agente — Ride the Lightning

Herramienta local para animar gráficas de datos. Lee `servidor/guia-de-direccion.md` antes de dirigir una pieza y `docs/CAPAS.md` para la spec.

## Reglas
- **Exactitud 100 %**: ninguna cifra a mano; marcadores o `verificada`. Toda serie con fuente. Mira SIEMPRE el informe de compilación. Lo que no se pueda verificar contra fuente oficial: preguntar, no inventar ni omitir.
- **Historia completa** desde el primer dato (`desde: "inicio"`); recortar solo si David lo pide y decirlo.
- **Orden de trabajo**: `buscar_series` → `descargar_serie` → `compilar_spec` → `vista_previa` (mirar las imágenes) → `exportar_video` borrador → final + alfa.
- **Entregables de video**: MP4 de referencia + ProRes 4444 con alfa. Tarjetas opacas. Sin subtítulos quemados.
- **Marca MacroWise**: oro = valor/opinión de Guillermo, teal = técnico/energía/computación, púrpura = geopolítica. Geist / Geist Mono.
- Dry-run antes de gastar: todo aquí es gratis y local; no hay APIs de pago.
- Respuestas de David: siempre 3 bullets (regla global).

## Arquitectura
- `motor/` (navegador, puro y determinista): `nucleo.js` (easing, formato, ticks, paleta) · `capas.js` (dibujo de cada capa) · `escena.js` (z-order, fondo, modos `graficas`/`texto` para que el texto no se desenfoque).
- `servidor/`: `datos.mjs` (ingesta multiformato) · `compilar.mjs` (validación + anclas + plantillas + informe) · `catalogo.mjs` (adaptadores de fuentes + procedencia) · `biblioteca.mjs` (combinar, ad hoc) · `vivo.mjs` (actualizador 24/7) · `render.mjs` (Playwright + ffmpeg) · `estudio.mjs` (UI local) · `mcp.mjs`.
- `catalogo/series.json` se **genera** con `scripts/construir-catalogo.mjs`; `datos/` no se versiona (licencias de las fuentes).

## Aprendizajes
- **2026-11-03 — Escribir código con `node -e`/heredocs que contienen `\b` o `\s` corrompe expresiones regulares EN SILENCIO** (se convirtieron en caracteres de control o perdieron la barra: «Banco» pasó a contar como licencia NC y un título quedó vacío). Los parches se escriben con la herramienta Write a un `.cjs` (usando `String.fromCharCode(92)` si hace falta) o con Edit, y después se verifica con una prueba funcional y un barrido de caracteres de control. **Por qué importa:** un parche que compila pero cambia el significado de un regex es el peor error: no hace ruido.
- **2026-11-03 — Mezclar series de frecuencia distinta por fecha exacta deja la mayoría vacía** (oro mensual el día 1 vs. S&P diario): las plantillas llevan todo a la frecuencia más lenta con el último dato de cada periodo y lo declaran. La tolerancia de «atrasada» de una serie mensual es 80 días (se fecha el día 1 y se publica con semanas de retraso).
- **2026-11-03 — `printf` en bash corrompe las rutas de un .bat:** `servidorestudio.mjs` se convirtió en `servidor<ESC>tudio.mjs` (y `a` en un pitido), y el icono del escritorio «no hacía nada». Los .bat se escriben con PowerShell here-string `@'...'@` (sin escapes) y se **prueban ejecutándolos** (el estudio debe responder en 5180). **Por qué importa:** probar el script por dentro no prueba el lanzador que usa David.
- **2026-11-03 — Los textos se pisan si se colocan a ojo; en Electric Eye ya estaba resuelto:** cada texto reserva una caja (`rotulosBajo`/`ocupadas`), el nuevo elige el primer hueco libre y una auditoría recorre la pieza. Aquí: registro `env.registro`, `colocar()` (decide con la cámara de referencia, no con el instante dibujado, para que sea función pura) y `auditarColisiones` como compuerta del render. **Por qué importa:** una tarjeta que salta de lugar entre fotogramas es peor que una que choca; la decisión debe ser determinista.
- **2026-11-03 — David pide limpieza, no densidad:** «la gente no tiene tiempo»; por fecha clave solo año + qué pasó + dato. Subtítulos, etiquetas repetidas y dos cifras por tarjeta se eliminaron. **Por qué importa:** si se ve lleno de datos, no se ve profesional.
- **2026-11-03 — Marcas de eje que mienten:** con pasos de 2,5 y cero decimales, 2,5 se rotulaba «3». Los pasos de eje son solo 1-2-5-10.
- **2026-11-03 — Stooq bloquea descargas automáticas (403 «Access denied»):** no se elude; el camino es exportar en el navegador y subir el archivo. **Por qué importa:** un adaptador que depende de una fuente que bloquea scripts se rompe en silencio; mejor declararlo.
- **2026-11-03 — Las fechas de Excel de SheetJS salen en hora local al ESCRIBIR:** al probar, los datos del test se desplazaron un día. El lector es correcto; el escritor de pruebas debe usar el número de serie. **Por qué importa:** nunca validar la ingesta con archivos escritos con la misma librería sin verificar la fecha civil.
- **2026-11-03 — Un `$'` en `String.replace` corrompe el archivo:** «US$» dentro de la cadena de reemplazo se interpreta como patrón especial. Usar funciones de reemplazo o la herramienta Edit.
- **2026-11-03 — Licencias:** Coin Metrics (CC BY-NC) y Yahoo (uso personal) no sirven sin más para contenido monetizado; el compilador avisa.
