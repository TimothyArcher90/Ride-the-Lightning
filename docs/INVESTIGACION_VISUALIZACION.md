# Investigación: visualización de datos animada para reels 9:16

Fecha: 2026-11-04. Todas las URLs de abajo se abrieron o aparecieron en búsqueda durante la investigación. Lo marcado **(no verificado)** viene de fuentes secundarias o de memoria y debe contrastarse antes de usarlo como cifra de marca.

## 1. Teoría: reglas para elegir gráfica automáticamente

Fuentes:
- Cleveland y McGill (1984), Graphical Perception, JASA 79(387). Resumen secundario: https://info3312.infosci.cornell.edu/slides/04-graphical-perception.html (PDF del curso: https://vis.pku.edu.cn/course/visclass_f25/material/Graphical_perception.pdf)
- Tufte, The Visual Display of Quantitative Information (1983): data-ink ratio. Resumen: https://freshspectrum.com/data-ink-ratio/ (fuente secundaria)
- Cairo, The Truthful Art (2016): gráfica veraz, funcional, bella, perspicaz, esclarecedora. Resumen: https://thedataschool.co.uk/laura-brylka/the-five-qualities-of-great-vizualizations-according-to-alberto-cairo
- Wilke, Fundamentals of Data Visualization (CC BY-NC-ND): https://clauswilke.com/dataviz/ (cap. 5 directorio, 6 cantidades, 10 proporciones, 13 series de tiempo, 14 tendencias, 17 "tinta proporcional", 20 codificación redundante, 29 contar una historia)
- From Data to Viz (árbol de decisión): https://www.data-to-viz.com/
- FT Visual Vocabulary (9 categorías): https://github.com/Financial-Times/chart-doctor/tree/main/visual-vocabulary
- Datawrapper, por qué barras parten de cero: https://www.datawrapper.de/academy/why-our-column-and-bar-charts-start-at-zero
- Datawrapper, líneas: https://www.datawrapper.de/academy/what-to-consider-when-creating-line-charts
- Datawrapper, anotaciones: https://www.datawrapper.de/academy/annotate-tab y https://www.datawrapper.de/blog/annotations-in-bar-charts
- Guía europea de etiquetado directo: https://data.europa.eu/apps/data-visualisation-guide/direct-labelling

### Jerarquía perceptual (Cleveland-McGill)
Orden de precisión (de mejor a peor, según resumen secundario): posición en escala común > posición en escalas no alineadas > longitud/dirección/ángulo > área > volumen/curvatura > sombreado/saturación.
Regla operativa: codificar el dato principal con posición o longitud. Área (burbujas, treemap) y ángulo (donut) solo para dato secundario o proporciones de pocas partes, siempre con la cifra escrita.

### Taxonomía FT (qué pregunta responde cada familia)
- Desviación: barras divergentes, superávit/déficit.
- Correlación: dispersión, burbujas, dispersión conectada.
- Ranking: barras ordenadas, slope, lollipop.
- Distribución: histograma, boxplot, violín, cuadrícula de puntos.
- Cambio en el tiempo: línea, área, calendario heatmap, candlestick, dispersión conectada.
- Partes del todo: apiladas, treemap, waffle, donut, cascada.
- Magnitud: columnas, isotipo (pictograma), lollipop.
- Espacial: coropleta, burbuja en mapa, flujo.
- Flujo: sankey, cascada, chord.

### Árbol de decisión de Data to Viz (resumen)
Entrada por formato de dato: numérico, categórico, numérico+categórico, serie de tiempo, mapa, red.
- Una serie temporal: línea, área, barras, lollipop. Varias series: línea, área apilada, streamgraph, heatmap, ridgeline.
- Una categórica: barras, lollipop, donut, waffle, treemap, circle packing.
- Categórica anidada: treemap, sunburst. Relaciones entre categorías: sankey, chord, heatmap.
- Numérico+categórico, un valor por grupo: barras o lollipop. Varias observaciones por grupo: violín, boxplot, ridgeline.
- Dos numéricas: dispersión (conectada si hay orden temporal).

### Reglas concretas para un selector automático (propuesta)
Entrada: tipo de dato (tiempo / categoría / flujo), nº de series (S), nº de categorías (C), nº de puntos (N), si suma 100% o es parte del todo, si hay dos periodos.

| Forma de los datos | Gráfica por defecto | Alternativa | Evitar |
|---|---|---|---|
| 1 serie temporal, N>12 | línea (con relleno suave opcional) | área | barras si N>30 |
| 1 serie temporal, N<=12, valores discretos (trimestres) | barras | lollipop | línea sin marcadores |
| 2-5 series temporales, misma unidad | líneas con etiqueta directa al final | índice base 100 | leyenda aparte |
| 6-10 series temporales | resaltar 1-2 y atenuar el resto (spaghetti con foco) | small multiples | 10 colores iguales |
| >10 series | small multiples (máx 6 por plano) o ranking | heatmap | una sola línea por serie |
| series con unidades o escalas muy distintas | índice base 100 o small multiples | eje doble solo como último recurso | eje doble por defecto |
| ranking que cambia en el tiempo | barras en carrera (top 8 máx.) | bump chart | más de 10 filas en 9:16 |
| comparar dos momentos, muchas categorías | slope chart (dos puntos) | dumbbell | barras agrupadas |
| comparar categorías, 1 periodo | barras horizontales ordenadas | lollipop | pie |
| partes del todo, 2-5 partes | donut o barra apilada 100% | waffle | pie 3D, >6 rebanadas |
| partes del todo, 6-30 partes | treemap | waffle por grupos | donut |
| partes del todo en el tiempo | área apilada 100% | streamgraph | líneas superpuestas |
| de A a B con pérdidas/transformación | sankey (máx 3 columnas) | cascada | sankey con >12 nodos |
| contribuciones aditivas a un total | cascada | barras apiladas | donut |
| dos variables numéricas, N de grupos | dispersión/burbuja con 3-6 etiquetas | dispersión conectada si hay tiempo | etiquetar todos los puntos |
| distribución (muchos valores) | histograma/densidad | beeswarm, dot strip | boxplot sin explicar |
| calendario / estacionalidad | heatmap de calendario | líneas por año superpuestas | -- |
| precio con rango intradía | velas (candlestick) | línea de cierre | -- |
| acumulado / cuota de mercado vs total | área apilada | marimekko (2 dimensiones) | -- |

Reglas de desempate (sacadas de Cleveland-McGill, Wilke y Datawrapper):
1. Prefiere posición/longitud sobre ángulo/área.
2. Ordena categorías por valor, salvo que exista orden natural (tiempo, edad).
3. Etiqueta directamente; la leyenda solo si hay más de 6 colores.
4. Máximo 1 color de énfasis; el resto en gris atenuado.
5. Si el mensaje es "esto subió/bajó", la gráfica debe mostrar el cambio (índice, slope, diferencia), no dos valores absolutos lejanos.

## 2. Catálogo de modelos de gráfica (librerías y galerías)

Referencias para aprender implementaciones:
- d3-sankey (BSD-3): https://github.com/d3/d3-sankey
- d3-hierarchy treemap (squarify, resquarify, binary, dice, slice, sliceDice; resquarify pensado para animar): https://d3js.org/d3-hierarchy/treemap
- d3-force (centro, colisión, enlace, carga, posición; sirve para burbujas sin solape y beeswarm): https://d3js.org/d3-force
- Observable Plot: https://observablehq.com/plot/ (la página /plot/marks devolvió 429 al verificar; reintentar)
- Vega-Lite marks (area, bar, circle, line, point, rect, rule, square, text, tick, geoshape + boxplot, errorband, errorbar): https://vega.github.io/vega-lite/docs/mark.html
- RAWGraphs (casi 30 modelos visuales): https://www.rawgraphs.io/
- Flourish (plantillas; la página de plantillas no listó nombres al consultarla): https://flourish.studio/visualisations/
- Apache ECharts ejemplos: https://echarts.apache.org/examples/en/index.html
- Plotly: https://plotly.com/javascript/ (no verificado en detalle)

Nota de implementación: d3-sankey, d3-hierarchy y d3-force se pueden ejecutar en Node sin DOM. Para mantener la función pura del tiempo, calcula el layout una vez (en la fase de preparación, con semilla fija, y para d3-force un número fijo de ticks) y dibuja interpolando entre layouts precalculados.

### Modelos (viabilidad en canvas 2D determinista y 1080x1920)
Ya existen en la herramienta: líneas, barras en carrera, área, sankey, donut, cascada, llamadas, zonas, cámara.

| # | Modelo | Mejor uso | Canvas 2D | Legible en vertical |
|---|---|---|---|---|
| 1 | Slope chart | Antes/después de 5-12 categorías | Fácil | Muy bien (usa la altura) |
| 2 | Bump chart | Cambios de ranking a lo largo del tiempo | Fácil | Bien con <=8 series |
| 3 | Dumbbell | Brecha entre dos valores por categoría | Fácil | Muy bien horizontal con filas |
| 4 | Lollipop | Ranking con menos tinta que barras | Fácil | Muy bien |
| 5 | Índice base 100 | Comparar series con distinta escala | Fácil | Bien |
| 6 | Área apilada / 100% | Composición en el tiempo | Fácil | Bien |
| 7 | Streamgraph | Composición con estética (muchas categorías) | Media (baseline de d3.stack offset wiggle) | Bien, difícil de leer valores |
| 8 | Treemap (squarify) | Partes del todo con muchas partes | Media (layout precalculado) | Bien: tarda en explicar |
| 9 | Waffle / isotipo | Cifras comprensibles ("1 de cada 10") | Fácil | Muy bien |
| 10 | Small multiples | Muchas series sin spaghetti | Media | Regular: máx 2x3 o 3x2 |
| 11 | Heatmap de calendario | Estacionalidad, rachas | Fácil | Regular (muchas celdas) |
| 12 | Beeswarm | Distribución con puntos nombrados | Media (simulación precalculada) | Bien con <=60 puntos |
| 13 | Bubble race (burbujas en carrera) | Dos variables en el tiempo, tipo Gapminder | Media | Regular: 6-10 burbujas |
| 14 | Radial/polar | Estacionalidad, ciclos | Media | Regular; evitar para comparar valores |
| 15 | Marimekko | Cuota por segmento x tamaño de segmento | Media | Regular |
| 16 | Candlestick | Precios con rango | Fácil | Bien con <=40 velas |
| 17 | Dispersión conectada | Dos variables que evolucionan (inflación vs paro) | Fácil | Bien |
| 18 | Circle packing | Jerarquía en burbujas | Media (d3.pack) | Bien |
| 19 | Fan chart (proyección con banda) | Pronósticos con incertidumbre | Fácil | Bien |
| 20 | Densidad/ridgeline | Distribuciones por grupo | Media | Regular |

Fáciles y de alto impacto para el reel: slope, bump, dumbbell, lollipop, waffle, índice base 100, fan chart. Más caros: treemap, streamgraph, beeswarm, bubble race.

## 3. Animación: principios y qué retiene

Fuentes:
- Heer y Robertson (2007), Animated Transitions in Statistical Data Graphics, IEEE TVCG 13(6). PDF: https://idl.cs.washington.edu/files/2007-AnimatedTransitions-InfoVis.pdf (el contenido binario no se pudo leer; las pautas vienen de diapositivas de curso: https://courses.cs.washington.edu/courses/cse442/24au/lectures/CSE442-Animation.pdf)
- Robertson, Fernandez, Fisher, Lee, Stasko (2008), Effectiveness of Animation in Trend Visualization, IEEE TVCG 14(6). PDF: https://faculty.cc.gatech.edu/~stasko/papers/infovis08-anim.pdf

### Hallazgos clave
- Heer-Robertson: las transiciones animadas bien diseñadas superan a las estáticas en seguimiento de objetos y estimación de valores. Pautas (de las diapositivas): mantener la gráfica válida durante toda la transición, mapeos consistentes, respetar la correspondencia semántica entre elementos, evitar ambigüedad; agrupar transiciones similares, minimizar oclusión, maximizar predictibilidad, transiciones simples, escalonar (staging) las complejas, que duren lo justo.
- Robertson 2008: para análisis, la animación fue la peor (más lenta que líneas superpuestas o small multiples; small multiples más precisa). Con un presentador y datos interesantes, ayuda al público a entender. Consecuencia: en reel (presentación guiada) la animación sirve, pero cada plano debe tener un solo mensaje y el dato final debe quedar quieto y legible el tiempo suficiente; no confiar en que el espectador compare valores mientras se mueven.

### Técnicas concretas (propuestas, a validar con tu ojo en pruebas)
- Staging: eje y contexto primero (0.3-0.5 s), después el dato, después la anotación. Nunca todo a la vez.
- Revelado progresivo: línea que se dibuja de izquierda a derecha con la punta marcada (punto + cifra viva). Barras que crecen desde cero (nunca desde otra base).
- Easing por tipo de dato:
  - Magnitudes que crecen (barras, contadores): ease-out cúbico, ataque rápido y asentamiento.
  - Series temporales dibujándose: casi lineal en el tramo, para no distorsionar la velocidad percibida de cambio, con ease-in-out solo en inicio y fin.
  - Reordenamientos (ranking, bump): ease-in-out suave, 0.6-0.9 s.
  - Cámara: ease-in-out largo, sin rebotes. Evitar overshoot en datos financieros: sugiere cifras que no existen.
- Stagger: 40-80 ms entre elementos de la misma familia (barras, celdas de waffle). Más de 120 ms se siente lento.
- Foco con atenuación: al resaltar una serie, el resto baja a ~20-30% de opacidad y gris; la serie foco sube grosor y color. Transición de foco 0.3-0.4 s.
- Cámara: seguir la punta de la línea o hacer zoom a un segmento (crisis, giro). Mantener el zoom dentro de ejes legibles; mostrar la escala nueva.
- Contadores: cifras que suben con la animación y se quedan quietas al llegar; usar fuente tabular para que no baile el ancho.
- Anotación sincronizada con voz: marcar el instante de aparición de cada llamada con el tiempo de la palabra (timestamps por palabra del guion) para que la gráfica "diga" lo mismo que la voz en el mismo segundo.
- Pausa final: dejar 1-1.5 s sin movimiento con la conclusión escrita antes del corte.
- Qué retiene (hipótesis de oficio, no resultado de estudio): gancho con la cifra o el giro en los primeros 2 s, un cambio visual cada 2-4 s, una pregunta que la gráfica contesta, y el elemento más importante siempre en el centro visual, no en los bordes.

Referencias de estilo meta (no se extrajeron reglas de ellas; revisar a mano): Our World in Data https://ourworldindata.org/, Datawrapper https://www.datawrapper.de/blog, The Pudding https://pudding.cool/, FT Visual Vocabulary arriba.

## 4. Exactitud e integridad

### Buenas prácticas
- Barras y columnas: siempre base cero (Datawrapper bloquea mínimo >0 en barras: https://www.datawrapper.de/academy/why-our-column-and-bar-charts-start-at-zero). Las líneas pueden no partir de cero, pero hay que declarar el rango y no exagerar la pendiente.
- Si el eje se corta o se usa escala log, escribirlo en la gráfica ("escala logarítmica").
- Evitar doble eje; si es inevitable, rotular cada eje con el color de su serie y avisar. Preferir índice base 100 o dos planos.
- Dinero a lo largo de años: decir si es nominal o real. Deflactar con IPC (FRED CPIAUCSL, BLS CPI) y escribir el año base ("USD de 2020").
- Siempre en pantalla: fuente (organismo + serie/ID) y fecha del último dato. Es una afirmación de marca (regla de David): cifra no verificada contra fuente oficial no se publica.
- No mezclar frecuencias sin decirlo; no suavizar sin avisarlo; cuidado con revisiones: los datos recientes (PIB, empleo) cambian.
- Si un tramo es proyección, estilo distinto (línea punteada/banda) y rótulo "estimación".
- Mapas de colores con contraste suficiente y no depender solo del color (codificación redundante, Wilke cap. 20).
- Cairo: la gráfica debe ser veraz antes que bella (ver sección 1).

### Fuentes de datos abiertas (estado verificado el 2026-11-04)

| Fuente | Llave | Endpoint de ejemplo | Notas |
|---|---|---|---|
| FRED | Sí (gratis) | `https://api.stlouisfed.org/fred/series/observations?series_id=GNPCA&api_key=TU_KEY&file_type=json` | Docs: https://fred.stlouisfed.org/docs/api/fred/series_observations.html. Parámetros `units` (pch, pc1, etc.) y `frequency` útiles |
| World Bank | No | `https://api.worldbank.org/v2/country/MEX/indicator/NY.GDP.MKTP.CD?format=json&per_page=100` | Probado: devuelve JSON, [meta, registros]. Docs: https://datahelpdesk.worldbank.org/knowledgebase/topics/125589 (no verificada) |
| IMF DataMapper | No | `https://www.imf.org/external/datamapper/api/v1/NGDP_RPCH/MEX` | Probado: JSON `values.INDICADOR.PAÍS.AÑO`. Incluye proyecciones WEO: marcarlas como estimación |
| OECD (SDMX) | No | `https://sdmx.oecd.org/public/rest/dataflow/all` | Probado: devuelve XML SDMX 2.1 con la lista de dataflows. Datos: `/public/rest/data/{AGENCIA,FLUJO,VERSION}/{filtro}?format=jsondata` (patrón SDMX, no verificado) |
| BLS | v2: registro gratis recomendado | `https://api.bls.gov/publicAPI/v2/timeseries/data/LNS14000000` | Probado el GET (paro EE. UU.): REQUEST_SUCCEEDED. Con llave: hasta 20 años y 50 series por consulta. Docs: https://www.bls.gov/developers/api_signature_v2.htm |
| BEA | Sí (UserID gratis) | `https://apps.bea.gov/api/data/?UserID=TU_KEY&method=GetData&datasetname=NIPA&TableName=T10101&Frequency=A&Year=X&ResultFormat=JSON` | Registro: https://apps.bea.gov/API/signup/index.cfm. Parámetros según paquete R bea.R; confirmar en la guía de BEA |
| Census | Sí (gratis) | `https://api.census.gov/data/2022/acs/acs5?get=NAME,B01001_001E&for=state:*&key=TU_KEY` | Probado sin llave: pide llave. Registro: https://api.census.gov/data/key_signup.html (no verificado); guía https://www.census.gov/data/developers/guidance/api-user-guide.html |
| Eurostat | No | `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/prc_hicp_manr?format=JSON&lang=EN&geo=ES&coicop=CP00&sinceTimePeriod=2025-01` | Probado: JSON-stat 2.0 (inflación armonizada). Docs: https://ec.europa.eu/eurostat/web/user-guides/data-browser/api-data-access/api-getting-started |
| Banxico SIE | Sí, token (gratis) en cabecera `Bmx-Token` | `https://www.banxico.org.mx/SieAPIRest/service/v1/series/SF43783/datos/oportuno` | Doc: https://www.banxico.org.mx/SieAPIRest/service/v1/?locale=en. Límites de consulta en `/SieAPIRest/service/v1/doc/limiteConsultas` |
| Colombia: TRM | No (app token opcional) | `https://www.datos.gov.co/resource/32sa-8pi3.json?$limit=2` | Probado: campos valor, unidad, vigenciadesde, vigenciahasta. La TRM la certifica la Superfinanciera (el Banco de la República la toma de ahí desde nov-2016). Histórico en el portal de estadísticas del Banco: https://banrep.gov.co/es/como-consultar-datos-historicos-tasa-representativa-mercado-trm-nuevo-portal-estadisticas |
| SEC EDGAR | No; cabecera User-Agent obligatoria | `https://data.sec.gov/api/xbrl/companyfacts/CIK##########.json` y `https://data.sec.gov/submissions/CIK##########.json` | Máx. 10 peticiones/s. Política: https://www.sec.gov/os/accessing-edgar-data. Ya integrado |
| Treasury FiscalData | No | `https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny?format=json` | Docs: https://fiscaldata.treasury.gov/api-documentation/ |
| UN Comtrade | Preview sin llave (limitado); completo con llave | `https://comtradeapi.un.org/public/v1/preview/C/A/HS?flowCode=X&reporterCode=156&period=2023` | Solo 500 registros por consulta, un producto y un periodo; sin descripciones. Fuente secundaria: https://comtradewiki.azurewebsites.net/?p=382. No se pudo abrir la página oficial (404 en comtradeapi.un.org raíz) |
| OWID | No | `https://ourworldindata.org/grapher/life-expectancy.csv?v=1&csvType=full&useColumnShortNames=true` | Probado: CSV `entity,code,year,columna`. Metadatos en `.metadata.json`. Licencia CC BY 4.0 (https://docs.owid.io/projects/etl/api/): citar a OWID y a la fuente original de cada serie |

Pendiente de verificar: límite diario de Census sin llave, límites de Banxico, licencias de reutilización por fuente (World Bank CC BY 4.0 es lo habitual, confirmar).

## 5. Formato reel 9:16

Fuentes de zonas seguras (terceros; no hay especificación única): 
- https://www.revid.ai/instagram-reels-safe-zone (Reels/Shorts/TikTok en 1080x1920: ~270 px arriba, ~670 abajo, 65 izquierda, 120 derecha)
- https://www.socialync.io/tools/safe-zones/tiktok (TikTok: 240 arriba, 660 abajo, 120 por lado)
- https://www.revid.ai/tiktok-safe-zone (TikTok: 220 arriba, 480 abajo, 60 izquierda, 140 derecha)
- https://houseofmarketers.com/guide-to-safe-zones-tiktok-facebook-instagram-stories-reels/
Las cifras discrepan hasta 300 px en el borde inferior. Verificar con la plantilla oficial de TikTok (In-Feed Ads) y la vista previa dentro de la app antes de dar por buena una cifra.

### Reglas recomendadas (unión conservadora de lo anterior)
- Zona segura para texto y datos clave: x 120-940 (820 px de ancho), y 270-1250 (unos 980 px de alto). Fondo, color y elementos decorativos sí pueden llegar a los bordes.
- Los últimos 670 px de abajo se reservan para título/subtítulos de la plataforma: no poner cifras ahí. Si los subtítulos de la voz van abajo, queda aún menos espacio útil para la gráfica.
- Tamaños de fuente en 1080 px de ancho (guía propia; verificar en teléfono real): cifra protagonista 140-220 px; título 64-80 px; etiquetas de datos 40-48 px mínimo; fuente de datos/nota 30-34 px (solo texto no esencial); nada por debajo de 28 px.
- Contraste: texto claro sobre fondo oscuro de la marca (paleta MacroWise), tarjetas opacas (regla de David), sin degradados que bajen el contraste.
- Grosor de línea: 6-10 px en 1080 de ancho; puntos de 14-20 px; barras con al menos 40 px de alto.
- Densidad: máximo 1 idea por plano; 1 cifra protagonista; máx. 3 anotaciones simultáneas; máx. 8 filas en ranking; máx. 5 líneas con etiqueta; máx. 6 segmentos en donut; ejes con 3-4 marcas, no más.
- Duración por plano: 4-8 s para una idea; si la animación dura más de 8 s, dividir en dos planos.
- Eje x en vertical: aprovechar la altura (slope, ranking, cascada vertical, bump). Las series temporales largas se leen mejor con zoom de cámara que apretadas en 820 px.
- Orientación de etiquetas: horizontales siempre; nunca texto rotado.
- Subtítulos como pista editable (regla de David), no quemados; dejar libre la banda donde irán.

## Qué implementar primero (top 10)

| # | Prioridad | Qué | Por qué | Dificultad en canvas 2D |
|---|---|---|---|---|
| 1 | Selector automático de gráfica | Función que, dado el esquema de datos, elige la gráfica con la tabla de la sección 1 y avisa si el dato no lo permite | Convierte la investigación en producto y evita decisiones ad hoc | Baja (lógica, sin dibujo) |
| 2 | Capa de integridad y fuente | Obligar a rotular fuente, serie e fecha del último dato; avisos automáticos (barras con base distinta de cero, eje doble, nominal vs real) | Cifra rotulada = afirmación de marca; evita errores públicos | Baja |
| 3 | Zona segura y reglas de legibilidad en el renderizador | Márgenes 120/270/670, tamaños mínimos de fuente y límites de densidad como validación previa al render | Todo reel lo necesita; hoy es el error más fácil de cometer | Baja |
| 4 | Slope chart animado | Alta legibilidad en vertical; la mejor gráfica para "antes vs después" | Responde la pregunta típica de un reel financiero en 1 plano | Baja |
| 5 | Índice base 100 con foco y etiquetado directo | Comparar activos/países de distinta escala sin eje doble; atenuar el resto | Sustituye al spaghetti y al eje doble, muy frecuentes en finanzas | Baja-media |
| 6 | Dumbbell y lollipop | Rankings y brechas con menos tinta que barras | Rellenan el hueco entre barras en carrera y el slope; fáciles de animar con stagger | Baja |
| 7 | Bump chart | Cambios de ranking en el tiempo; complementa la carrera de barras | Muy atractivo y narrativo; vertical lo favorece con pocas series | Media (curvas suaves y cruces) |
| 8 | Waffle / isotipo | Hacer tangibles cifras como "1 de cada 8" | Gran retención por simplicidad; casi sin cálculo | Baja |
| 9 | Fan chart (proyección con bandas) y línea proyectada | Pronósticos honestos con incertidumbre (IMF, bancos centrales) | Evita dar falsa precisión y encaja con la regla de rotular estimaciones | Baja-media |
| 10 | Treemap con layout precalculado (squarify/resquarify) | Partes del todo con muchas categorías (presupuestos, carteras, sectores) | Cubre el caso que donut/sankey no resuelven; resquarify permite animar cambios | Media (requiere puerto de d3-hierarchy y layout precalculado determinista) |

Siguientes en la cola: candlestick, dispersión conectada, small multiples, bubble race, streamgraph, beeswarm.

Orden de trabajo sugerido: 1-3 en paralelo (sin dibujo nuevo, mejoran todo lo existente), luego 4-6 (mismas primitivas: líneas, círculos, texto), después 8-10.

## Fuera de alcance / no resuelto
- No se leyó el texto completo de Heer-Robertson ni de Cleveland-McGill; las pautas vienen de diapositivas y resúmenes (enlazadas).
- No hay estudio citado sobre qué retiene en reels; esas frases están marcadas como hipótesis.
- Johnny Harris, Caspian Report, Bloomberg, NYT y Reuters Graphics no se analizaron directamente en esta ronda.
- No se confirmaron los endpoints de datos de OECD ni BEA con una llamada real, ni las licencias de reutilización por fuente.
