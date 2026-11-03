# Referencia de capas y spec

## Spec
```jsonc
{
  "version": 1, "titulo": "…", "formato": "horizontal|vertical", "fps": 30, "duracion": 20,
  "fondo": {"imagen": "entradas/foto.jpg", "tono": 0.78, "puntos": true},
  "sello": true,                       // sello de fuente automático (false para quitarlo)
  "vivo": {"render": "final", "alfa": true, "minEntreRendersMin": 360},   // re-render automático al cambiar los datos
  "datos": {
    "id": {
      "archivo": "datos/biblioteca/fed_balance.csv",   // csv tsv txt json xlsx xls xlsb ods
      "hoja": "Hoja1", "filaEncabezado": 1,
      "x": "fecha", "tipoX": "fecha|anio|num|cat",
      "decimal": ",", "formatoFecha": "dmy|mdy", "fechaSerial": false,   // solo si el archivo lo exige
      "desde": "inicio", "hasta": "fin",               // recorte explícito (queda avisado)
      "fuente": {"nombre": "…", "url": "…", "obtenido": "2026-11-03", "licencia": "…"},   // la biblioteca la trae sola
      "columnas": [{"col": "WALCL", "nombre": "…", "color": "oro|teal|purpura|piedra|#hex", "divisor": 1000000,
                    "prefijo": "US$ ", "sufijo": " bill.", "decimales": 2, "unidad": "billones de US$"}]   // decimales: número o "auto"
    }
  },
  "capas": [ … ]
}
```
Combinar series de la biblioteca en una tabla ancha (unión por fecha **exacta**, sin remuestrear): `combinar({ids, nombre, id})` en `servidor/biblioteca.mjs` (herramienta MCP `combinar_series`). Queda con su receta y se reconstruye sola cuando cambia un componente.

## Gráficas (cada una con `caja:[x,y,w,h]` en fracciones del lienzo y `t:[inicio,fin]` en segundos)
| tipo | uso | opciones |
|---|---|---|
| `linea` | evolución temporal | `datos`, `series:[i]`, `ejeDer:[i]`, `area`, `escala:"log"`, `camara:[{t,x:[a,b]\|"auto",y:[c,d]\|"auto"\|"ajustar",mov}]`, `id` |
| `barras` | categorías / periodos | `orientacion:"v\|h"`, `orden:"desc"`, `maxBarras`, `colorSigno`, `formatoX:"anio\|mes\|dia"` |
| `carrera` | ranking que cambia | series = entidades, x = fecha; `top`, `formatoX` |
| `dispersion` | relación x–y | `tipoX:"num"`; calcula OLS y R² (`regresion:false` para ocultar); `etiquetaX`, `etiquetaY` |
| `calor` | correlación | `series:[…]`, `sobre:"variaciones\|niveles"` (por defecto variaciones) |

La escala `log` es obligatoria para series de varios órdenes de magnitud (Bitcoin, S&P desde 1927, población desde el 10.000 a. C.). En modo log la cámara solo admite `"auto"`/`"ajustar"` en `y`.

## Anotaciones (se anclan a una gráfica con `capa:"id"`; la gráfica va antes)
| tipo | campos |
|---|---|
| `llamada` | `ancla:{fecha\|x\|max\|min\|ultimo\|primero\|indice, rango?}`, `serie`, `texto`, `detalle`, `lado:"arriba\|abajo"`, `dx`, `dy`, `color`, `t:[in,out]` |
| `zona` | `desde`, `hasta` (fechas), `texto`, `color`, `t` |
| `contador` | `serie`, `etiqueta`, `pos:[fx,fy]`, `formatoX` — sigue la cabeza de la línea |

Marcadores en `texto`/`detalle`/`sub`: `{valor}` `{fecha[:dia\|mes\|anio]}` `{cambio:N}` `{pct:N}` `{max}` `{min}` `{desde[:fmt]}` `{hasta[:fmt]}` `{n}` `{serie}`. `N` = número de filas hacia atrás (en datos semanales, 52 ≈ un año: el informe indica la fila base).

## Presentación
`titulo` (`texto`, `sub`, `pos`, `tam`, `color`, `t`) · `imagen` (`archivo`, `caja`, `ajuste:"cubrir\|contener"`, `zoom:[1,1.08]`, `opacidad`, `borde`, `t`) · `cortina` (`t`, `color`; barrido duro entre capítulos).

## Orden por defecto (`z`)
imagen 5 · zona 8 · gráficas 10 · llamada 20 · contador 25 · título 30 · cortina 40 · sello 50. Se puede forzar con `"z": n`.

## Salidas
`salidas/<pieza>/<pieza>_vN.mp4` (referencia), `…_alfa.mov` (ProRes 4444 con alfa: solo gráficas y texto, sin fondo), `…_contacto.png` (12 fotogramas), `…_vN.json` (informe de verificación). Las tarjetas son opacas a propósito.
