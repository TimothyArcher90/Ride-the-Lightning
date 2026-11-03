# Ride the Lightning

Estudio **local** para animar gráficas financieras y de datos con el lenguaje visual de Johnny Harris / Caspian Report (trazo narrado, cámara en el espacio de los datos, llamadas con golpe seco), pero con una regla que ellos no cumplen: **cada cifra en pantalla sale de una fila de datos verificable**.

Nace de [Electric Eye](https://github.com/TimothyArcher90/Electric_Eye) (mapas animados): reutiliza su arquitectura probada —render determinista en un navegador sin ventana, control por MCP, revisión por fotogramas— y cambia el motor de dibujo por uno de gráficas.

## Instalar y abrir (Windows)
Después de la primera vez: **doble clic en «Ride the Lightning» en el escritorio** (junto a Electric Eye). Mismo proceso: se actualiza solo desde GitHub, abre el estudio en el navegador y deja el actualizador de datos en marcha.

1. Instala [Node.js](https://nodejs.org) 22+ y [FFmpeg](https://ffmpeg.org) (debe estar en el PATH). Necesitas Edge o Chrome.
2. Doble clic en `Instalar Ride the Lightning.bat` (una sola vez).
3. Doble clic en `Iniciar Ride the Lightning.bat` → se abre el estudio en `http://127.0.0.1:5180`.

Todo corre en tu equipo; el servidor solo escucha en `127.0.0.1`.

## Para quien no sabe de código ni de finanzas
Abre el estudio y sigue los **4 pasos**: tus datos → cómo verlo → cámara y ritmo → revisar y exportar. Guía: [`docs/GUIA_USUARIO.md`](docs/GUIA_USUARIO.md). Qué se pidió y qué está hecho (con límites): [`docs/CUMPLIMIENTO.md`](docs/CUMPLIMIENTO.md). Cómo trabajan Johnny Harris y Caspian Report: [`docs/REFERENCIAS_ESTILO.md`](docs/REFERENCIAS_ESTILO.md).

## Qué hace
| Necesidad | Cómo |
|---|---|
| **Historia completa**, desde el primer dato | Biblioteca de ~170 series (commodities, mercados, macro, cripto, Polonia, historia larga). Se descargan completas y se mide el inicio real. |
| **Tus datos** | Suelta en el estudio Excel (`xlsx xls xlsb ods`), `csv tsv txt`, `json`, e imágenes. |
| **Datos vivos 24/7** | El actualizador refresca cada serie según su frecuencia y re-renderiza las piezas marcadas `"vivo"`. |
| **Plantillas** | 5 estilos (historia de una cifra, una contra las demás, panel, carrera, correlación) × 4 cámaras × 2 estilos de momento × horizontal/vertical. Los momentos clave se detectan **en los datos**. |
| **Tipos de gráfica** | `linea` (multi-serie, doble eje, escala log, área) · `barras` · `carrera` · `dispersion` (OLS y R²) · `calor` (matriz de correlación). |
| **Pantalla múltiple** | Cada capa gráfica tiene su `caja`: paneles 2×2, ranking + línea, etc. |
| **Entregables** | MP4 de referencia (h264, crf 17, yuv420p) **y** `.mov` ProRes 4444 con alfa para Premiere. Sin subtítulos quemados. |
| **Dirigir con Claude** | Servidor MCP (`.mcp.json`): buscar series, compilar, previsualizar fotogramas, exportar. |

## Exactitud (reglas duras, las aplica el compilador)
1. **Ninguna cifra se teclea.** Los textos usan marcadores —`{valor}` `{fecha}` `{cambio:N}` `{pct:N}` `{max}` `{min}` `{desde}` `{hasta}` `{n}`— que se calculan de los datos. Un dígito suelto es un error (salvo `"verificada":{"fuente","url"}`).
2. **Toda serie lleva fuente** (url, fecha de descarga, sha256, primer y último dato reales). Sin fuente no compila.
3. **Serie completa por defecto.** Recortar con `desde`/`hasta` queda avisado.
4. **No se adivina:** fecha ambigua (`03/04/2020`), decimal con coma sin declarar, texto en una columna numérica, o un ancla sin dato cercano → error con fila y valor.
5. **Informe de verificación** en cada compilación y junto a cada render (`salidas/<pieza>/<pieza>_vN.json`): cada cifra → serie, columna, fecha, fila, valor crudo.
6. **Licencias:** si la fuente restringe el uso comercial (p. ej. CC BY-NC, Yahoo) el compilador lo avisa.

## Diseño: limpio, un héroe por fecha
- **Menos texto.** Título corto, sin subtítulos. La tarjeta de una llamada son tres cosas: **año · qué pasó (3-4 palabras) · el dato**. Nada de párrafos ni dos cifras por tarjeta.
- **El año nunca se pierde:** año grande arriba a la derecha que sigue a la cabeza de la línea, marca dorada con el año bajo la cabeza, y la tarjeta lleva su propio año.
- **Una idea a la vez:** el contador se aparta mientras hay una tarjeta; el compilador avisa si dos llamadas de una gráfica coinciden.
- **Sin choques (aprendizaje de Electric Eye):** cada texto reserva su caja; las tarjetas se colocan en el primer hueco libre —sin pisar título, contador, ejes, fuente ni la línea— y `auditar` recorre toda la pieza. El render se **niega** a salir con textos que se pisen.

## Capas (cómo se monta una animación)
Una pieza es una spec JSON: `datos` (de dónde) + `capas` (qué se ve y cuándo). Orden de apilado por `z`: fondo → imágenes → zonas → **gráficas** → **llamadas** → contador → título → cortina → sello de fuente.
Las gráficas publican su proyección datos→píxel; las anotaciones (`llamada`, `zona`, `contador`) se **anclan a datos** (`{"fecha":"2020-06-03"}`, `{"max":true}`, `{"ultimo":true}`), nunca a píxeles. La cámara es de keyframes en el espacio de los datos (`camara:[{t,x:[a,b],y:"ajustar"}]`), así que el texto siempre queda nítido. Referencia completa: [`docs/CAPAS.md`](docs/CAPAS.md). Guía de dirección: [`servidor/guia-de-direccion.md`](servidor/guia-de-direccion.md).

## Línea de comandos
```
node servidor/cli.mjs buscar oro            # buscar en la biblioteca
node servidor/cli.mjs bajar bm_gold         # historia completa + procedencia
node servidor/cli.mjs compilar specs/fed-balance.json
node servidor/cli.mjs vista specs/fed-balance.json 4,12,18   # PNG de esos segundos
node servidor/cli.mjs auditar specs/fed-balance.json          # ningún texto debe pisar a otro (se comprueba cada 0,2 s)
node servidor/cli.mjs render specs/fed-balance.json           # MP4 + ProRes alfa (--borrador, --sin-alfa)
node servidor/cli.mjs vivo                  # actualizador permanente
node scripts/prueba.mjs                     # formatos, reglas de exactitud, 5 tipos de gráfica
```

## Datos vivos
`vivo` refresca cada serie descargada: mercados y cripto cada **15 min**, NBP 2 h, FRED 6 h, Banco Mundial 12 h, el resto a diario; si una fuente falla, espera el doble (máx. 6 h). Cuando un dato cambia: evento al estudio (se recompila solo), reconstrucción de las tablas combinadas y, si la spec lleva `"vivo":{"render":"final","alfa":true,"minEntreRendersMin":360}`, render nuevo versionado (v1, v2…). *Tiempo real* = sondeo frecuente de fuentes públicas: ninguna ofrece streaming gratuito. Para que corra 24/7 el proceso debe estar encendido (`Iniciar actualizador 24-7.bat`).

## Fuentes y límites honestos
- Integradas: FRED, Banco Mundial (Pink Sheet), Yahoo Finance (no oficial), Coin Metrics (BTC desde 2010-07-18), Shiller/Yale (desde 1871; el archivo público termina en 2023-09), Our World in Data (desde el 10.000 a. C.), **NBP** (API oficial; tipos de cambio desde 2002, oro desde 2013) y **GUS/BDL** (API oficial).
- **Stooq** devuelve «Access denied» a toda descarga automática: no se elude. Exporta el CSV desde el navegador y suéltalo en el estudio. **GPW** solo publica estadísticas en HTML/XLS sin API estable. Los archivos del NBP anteriores a 2002 no están en su API.
- Oro desde 1257, series de siglos de precios: las fuentes abiertas descargables sin fricción no existen; súbelas como archivo con su fuente.
- Las unidades de las series FRED en el catálogo son de catálogo: confírmalas en la página de la serie antes de rotular.
- Datos de Coin Metrics: CC BY-NC (no comercial). Yahoo: uso personal. Revisa antes de monetizar.

Licencia del código: MIT. Fuentes Geist: SIL OFL (`fuentes/OFL-Geist.txt`).

## Estilo Harris / Caspian (novedades)
- **Cámara «seguir»**, **píldora** y **círculo** para marcar momentos, **bandas** de periodo y **temas** de color (`oscuro`, `harris`, `carbon`). Se eligen en el paso 3 del estudio o en la spec (`camara`, `estilo`, `tema`). Detalle y límites: `docs/REFERENCIAS_ESTILO.md` §7.6.
