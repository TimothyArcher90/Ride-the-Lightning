# Guía de dirección — Ride the Lightning

Lee esto antes de dirigir una pieza. Resume cómo se construye una animación de datos que se sienta Johnny Harris / Caspian Report, sin sacrificar exactitud.

## 0. Reglas de exactitud (no negociables)
- **Ninguna cifra se escribe a mano.** Todo número en pantalla sale de los datos mediante marcadores: `{valor}` `{fecha}` `{cambio:N}` `{pct:N}` `{max}` `{min}` `{desde}` `{hasta}` `{n}`. Un dígito suelto en un texto es un **error de compilación**, salvo que la capa declare `"verificada":{"fuente","url"}`.
- **Toda serie lleva fuente** (`.meta.json` de la biblioteca, o `fuente` declarada). Sin fuente no compila.
- **Serie completa desde su primer dato.** Recortar con `desde` queda avisado. Dilo en la narración si recortas.
- Un ancla (`{"fecha":"2020-06-03"}`) debe caer en una fila real (tolerancia 1,5 pasos). Si no hay dato cerca, **no se inventa un punto**.
- Lo que no puedas verificar contra fuente oficial: pregúntale a David, no lo pongas ni lo omitas en silencio.
- Mira siempre el informe de compilación: lista cada cifra con su serie, fecha y fila.

## 1. Flujo
1. `buscar_series` → `descargar_serie` (historia completa) — o `inspeccionar_datos` si David comparte un Excel/CSV.
2. Escribe la spec (JSON). Una gráfica = capas: `linea` | `barras` | `carrera` | `dispersion` | `calor`, más anotaciones ancladas a datos: `llamada`, `zona`, `contador`, y presentación: `titulo`, `imagen`, `cortina`.
3. `compilar_spec` → corrige errores/avisos.
4. `vista_previa` con 4-6 instantes (inicio, a mitad del trazo, en cada zoom, en cada llamada, final). **Mira las imágenes**: tarjetas solapadas, texto fuera de cuadro, cámara que no encuadra.
5. `exportar_video` (borrador primero; final + alfa al aprobar).

## 2. Lenguaje de movimiento (lo que hace que se vea "de documental")
- **El trazo se narra**: la línea se dibuja con la voz; una cabeza con pulso lidera la mirada. `t:[inicio,fin]` de la capa `linea` = ritmo del trazo.
- **Cámara en el espacio de los datos**: `camara:[{t, x:[a,b], y:"ajustar"}]`. Cada keyframe se alcanza en `t` tras moverse `mov` s (por defecto 1,1). Haz *punch-in* sobre el evento y vuelve a abrir al final. `y:"ajustar"` encuadra el rango visible; `"auto"` = serie completa.
- **Una idea por zoom**: máximo una llamada principal por encuadre; la segunda llega 0,5-1 s después, no a la vez.
- **Llamadas con golpe seco**: onda de impacto + tarjeta que entra con rebote corto. Tarjetas **opacas** (Premiere mezcla las semitransparentes en gris).
- **Cortinas duras** (`cortina`) entre capítulos, no fundidos.
- Ritmo: 20 s para una serie larga con 3-4 hitos; 8-12 s para un solo dato. Deja 1 s de respiro final.
- Color con significado (marca MacroWise): **oro** = valor/opinión, **teal** = indicadores técnicos/energía/computación, **púrpura** = geopolítica, piedra = estructura. No inventes otra paleta.
- Formatos: `horizontal` 1920×1080 y `vertical` 1080×1920 salen de la misma spec (usa `caja:[x,y,w,h]` en fracciones si necesitas recolocar).

## 3. Qué gráfica para qué (criterio de analista de datos)
- Evolución en el tiempo, una o pocas series → `linea` (`area:true` para magnitudes acumuladas; `ejeDer:[i]` para dos escalas, **rotula las dos unidades**).
- Comparar categorías o periodos discretos → `barras` (`orden:"desc"`, `orientacion:"h"` para rankings, `colorSigno:true` para variaciones).
- Quién lidera y cómo cambia el ranking → `carrera` (series = entidades, x = fecha).
- Relación entre dos variables → `dispersion` (tipoX `num`; calcula OLS y R² en la compilación).
- Relación entre muchas series → `calor` con matriz de correlación. **Por defecto sobre variaciones**, no sobre niveles (las series con tendencia correlacionan por casualidad). El método queda en el informe.
- No mezcles escalas distintas en un eje sin decirlo. No uses dos ejes si podrías indexar a 100.

## 4. Límites honestos
- Precios de Yahoo son **no oficiales**; futuros continuos van empalmados sin ajuste de rolleo. Para una cifra de marca, contrasta con fuente oficial.
- La unidad del catálogo de FRED es de catálogo: confírmala en la página de la serie antes de rotular.
- Las series históricas ultralargas (oro desde 1257, etc.) no están en fuentes abiertas descargables sin fricción: si David pide una, búscala y súbela como archivo con su fuente.
