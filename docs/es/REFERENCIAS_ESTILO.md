# Referencias de estilo: Johnny Harris y Caspian Report

Investigación del 2026-11-03. Objetivo: saber qué hacen de verdad en sus gráficas de datos y qué le falta a Ride the Lightning para igualarlos o superarlos **con datos trazables** (algo que ellos no ofrecen).

**Cómo leer los niveles de confianza**
- **Medido** = visto en fotogramas de los dos videos analizados (ver sección 4 sobre la precisión real).
- **Inferido** = deducido de lo medido o de fuentes secundarias coherentes.
- **Rumor** = dicho por terceros (foros, Fiverr, resúmenes automáticos), sin comprobar.

## 0. Qué se analizó

| Canal | Video | Duración | Tramos mirados |
|---|---|---|---|
| Johnny Harris | «The REAL reason China built so much» (`axRhjqd-rus`) | 50 min 25 s | Hoja de contactos completa (1 fotograma / 45 s) + tramo de línea en 2018–2058 s a 1 fps |
| Caspian Report | «The hidden geography of AI» (`K-qll_Yhfms`) | 14 min 48 s | Hoja de contactos completa (1 fotograma / 18 s) + barras en 52–64 s a 2 fps + área/barras apiladas en 340–364 s a 1 fps |

Descargados a 480p (854×480; 23,98 y 29,97 fps) en una carpeta temporal fuera del repo, ya borrada. Solo 2 videos, 2 tramos de gráfica cada uno: **es una muestra pequeña**, no un estudio del canal.

---

## 1. Qué hacen (técnicas)

### Johnny Harris

1. **Fondo crema liso, no oscuro.** Gráficas y mapas sobre un papel de tono cálido: muestreo de píxel en el fotograma de la gráfica = **RGB 218,213,208 (#DAD5D0)**. Se alterna con planos oscuros del presentador. *Medido (hoja de contactos y píxel).*
2. **La gráfica de líneas muestra varias series, pero resalta UNA.** En «percent of population in extreme poverty» hay 5 países/mundo en el subtítulo, cada nombre con su color; la línea de China va en rojo grueso y las demás en gris/tenue de fondo. *Observado en el video JH, ≈2043–2058 s.*
3. **Un solo dato por fecha = una barra vertical amarilla.** Para marcar el año ≈2013 aparece una barra amarilla que crece de abajo arriba en ≈1 s y se queda. No hay tarjeta de texto en ese tramo: el dato lo dice la voz. *Observado, fotogramas 2051–2057 s.*
4. **Cámara en el espacio de los datos, con ritmo «plano general → punch-in → plano general».** La gráfica entra entera (≈5 s quieta con título y leyenda), hace zoom a la esquina inferior derecha (eje X 2000-2020 ampliado, ejes reescalados) en ≈1–2 s, pone la barra amarilla y vuelve a abrir. *Observado, fotogramas 2043–2058 s.* Esto es justo el modelo `camara:[{t,x,y}]` que ya tiene el motor.
5. **Poquísimo texto.** En el plano de línea: título de una línea, leyenda coloreada en la misma línea, 4-5 etiquetas de eje y una línea de fuente en cuerpo diminuto. Sin subtítulos ni párrafos. Hay **2 cifras en pantalla** (los ejes) más lo que diga la voz. *Medido en la muestra.*
6. **Tipografía.** Titulares condensados en mayúsculas tipo grotesca condensada («PERCENT OF POPULATION IN EXTREME POVERTY») y ejes en sans fina. Capítulos con rótulo grande sobre fondo sólido (verde esmeralda con rejilla, «6. LYING FLAT») y el término en chino en grande. *Observado; no identifiqué la fuente exacta (rumor: no verificada).*
7. **Color con significado por capítulo.** Mapas en rosa/rojo pastel y gris; verde esmeralda para los rótulos de capítulo; amarillo solo para «el momento». Paleta corta y repetida en todo el video. *Observado.*
8. **Infografía de unidades (pictogramas).** Rejillas de figuritas (10.000 funcionarios, comité central) en vez de barras cuando el dato es un conteo. *Observado en hoja de contactos.*
9. **Línea de tiempo con paneo.** Eje 1990-2000-2010-2020 que se desplaza horizontalmente bajo los líderes (Mao, Deng, Jiang, Hu, Xi) con una zona de color que avanza. *Observado, fotogramas ≈2115 s y ≈2295 s.*
10. **Mapas: reveals con máscara.** El hilo de Adobe Community (marzo 2025) sobre su mapa de ocupación japonesa concluye: mapa duplicado, capa inferior con patrón (no color liso), **matte de seguimiento que revela** la capa de patrón, y escalado para imitar el zoom-out. *Rumor/foro, respuesta marcada como correcta, no confirmado por él.*
11. **Herramientas.** After Effects + el plugin **GEOlayers 3** (aescripts.com publica «How Johnny Harris Makes Maps»; estilos de mapa vía Mapbox/MapTiler según resúmenes). Freelancer habitual: Boone Loves Video (curso con Illustrator + Photoshop + AE). *Inferido de fuentes de terceros; ver URLs.*
12. **Cortes.** Detección de cambios de plano (umbral 0,3 sobre 3.025 s): **643 cortes → 1 corte cada ≈4,7 s en todo el video** (incluye cámara, entrevistas y gráficas). Cortes duros dominan en la muestra; no vi wipes largos. *Medido (cifra) / inferido (tipo de transición).*
13. **Cierre de escena de gráfica.** Tras el punch-in y la barra, la cámara vuelve al plano general de la gráfica con la barra ya fija y entonces corta al presentador. *Observado una vez.*

### Caspian Report

1. **Fondo azul marino casi negro con trama de puntos y filete fino.** Es el «cuaderno de datos»: título pequeño blanco arriba a la izquierda, subtítulo en mayúsculas diminutas, una línea de separación. *Observado, 3 gráficas distintas.*
2. **Una sola tonalidad por gráfica.** Barras en periwinkle (azul lila) con borde redondeado en la de «Electricity needed for the same computing power» (3 barras: 109, 117 y 128 «units», con etiqueta sobre cada una). Para series múltiples (área apilada, barras apiladas) usa una escala azul + dorado/naranja/verde con leyenda pequeña. *Observado.*
3. **Barras que suben en ≈1 s y se quedan quietas.** En el tramo 52–64 s a 2 fps, las 3 barras crecen en 2-3 fotogramas (≈1–1,5 s) y la gráfica se mantiene **≈4–5 s sin movimiento** mientras habla el narrador. *Medido (con error de ±0,5 s).*
4. **La etiqueta del dato acompaña a cada barra («109 UNITS»).** Sale con la barra, no con una tarjeta aparte. *Observado.*
5. **Área apilada con zona «ESTIMATE» sombreada.** El área se dibuja de izquierda a derecha en ≈2–3 s y una banda gris marca la parte proyectada. *Observado a 1 fps (≈345–350 s).*
6. **Transformación entre gráficas, no corte.** La gráfica de área se «funde y se morfa» en la siguiente (barras apiladas): se ve el título viejo disolviéndose mientras entra el nuevo. *Observado (fotogramas ≈351–352 s).*
7. **Mucho más texto en pantalla que Harris.** Título + subtítulo + leyenda de 5 entradas + etiquetas de eje + 3 cifras destacadas («+112 GW BY 2030», «≈20 % AT RISK OF DELAY») en el panel lateral. *Medido en la muestra: ≈25-40 elementos de texto en las gráficas más densas, frente a ≈6-8 en Harris.*
8. **Mapas 3D terreno con pines.** Relieve en tono arena/azul, nombres de países en 3D tipo «letras tumbadas» sobre el terreno (STATES, AMSTERDAM), pines negros circulares con números y chinchetas rojas con etiqueta. Marca de agua «Powered by deltasweep.com». *Observado en ≈15 de 49 fotogramas de la hoja de contactos. Herramienta no identificada (rumor).*
9. **Cámara en los mapas: inclinada y orbital.** Vistas 3D con inclinación y flyover entre países; flechas/rutas punteadas (el cable submarino, rutas de lógicas de oferta). *Observado.*
10. **Imágenes de archivo entre gráficas.** Cada 1-3 gráficas entra metraje de stock (data centers, ingenieros) como respiro. *Observado; la hoja de contactos muestra ≈12 planos de stock de 49.*
11. **Artículos como prueba.** Capturas de noticias con la frase clave resaltada en azul/amarillo. *Observado (FT/Reuters, varios).*
12. **Cortes.** **115 cortes en 888 s → ≈1 corte cada 7,7 s** (umbral 0,3). Más pausado que Harris. *Medido.*
13. **Marca fija.** Logo de la ficha blanca en la esquina inferior izquierda en todo el video (≈5 % de la altura). *Observado.*
14. **Cierre.** Créditos con rótulos sobre plano de paisaje; ningún cierre tipo «tarjeta final con cifra». *Observado.*

---

## 2. Parámetros aproximados medibles

| Parámetro | Johnny Harris | Caspian Report | Confianza |
|---|---|---|---|
| Duración de una gráfica de línea en pantalla | ≈14-16 s (de plano general a cierre) | ≈10-12 s | Medido en 1 gráfica de cada uno |
| Quieta antes de la primera acción | ≈4-5 s | ≈4-5 s | Medido (±1 s) |
| Entrada de barra/trazo | ≈0,5-1 s (barra amarilla) | ≈1-1,5 s (barras) | Medido (±0,5 s) |
| Punch-in de cámara | ≈1-2 s, 1 sola vez por gráfica | no observado en gráficas 2D; sí en mapas 3D | Medido / inferido |
| Easing | Salida suave (desacelera al final); no medido con precisión | Sube con rebote suave en barras | Inferido |
| Elementos simultáneos (gráfica) | 3-5 (líneas, leyenda, ejes, barra) | 8-15 (título, subtítulo, barras, etiquetas, leyenda) | Medido (conteo manual) |
| Texto en pantalla | Mínimo: título + leyenda + fuente | Alto: título + subtítulo + leyenda + panel de cifras | Medido |
| Cifras rotuladas a la vez | 0 (las dice la voz) | 3-6 (etiquetas sobre barras + cifras destacadas) | Medido |
| Resaltado de un dato | Barra vertical amarilla + silenciar las demás líneas a gris | Etiqueta numérica sobre la barra | Medido |
| Fondo | Crema #DAD5D0 | Azul casi negro con trama de puntos | Medido (Harris píxel) / observado |
| Ritmo de cortes (todo el video) | 1 cada ≈4,7 s | 1 cada ≈7,7 s | Medido (umbral 0,3; puede subcontar fundidos) |
| Transición entre gráficas | Corte duro | Fundido/morfado entre gráficas | Observado |
| Sonido/música | No analizado (no se extrajo el audio) | No analizado | **No verificado** |

---

## 3. Comparación con nuestro motor

Fuente de lo que «ya tenemos»: `README.md`, `docs/CAPAS.md`, `servidor/guia-de-direccion.md`.

| Técnica | ¿La tenemos? | Qué falta |
|---|---|---|
| Cámara en el espacio de datos con punch-in | Sí (`camara:[{t,x,y,mov}]`, `y:"ajustar"`) | Easing configurable (hoy `io2` fijo); presets «plano general → zoom → plano general» |
| Un dato por fecha con golpe visual | Sí, `llamada` con onda de impacto | **Resalte mínimo sin tarjeta:** barra vertical de fecha («barra-fecha») que crece en 1 s; hoy toda llamada lleva tarjeta |
| Series múltiples con una resaltada y el resto atenuado | No explícito | Opción `foco:{serie}` que baja las demás a gris tenue y la principal gruesa |
| Poco texto en pantalla | Sí (año · qué pasó · dato) | Modo «mudo»: llamada sin texto, solo marca, para que la voz lleve el dato |
| Colores con significado | Sí (oro/teal/púrpura/piedra) | Paleta clara tipo crema (#DAD5D0) como fondo alterno; hoy solo oscuro |
| Fondo oscuro con trama de puntos | Sí (`fondo.puntos`) | Cubierto |
| Barras que suben ≈1 s con etiqueta propia | Parcial (`barras`) | Etiqueta numérica pegada a cada barra al terminar de subir |
| Área con zona «ESTIMATE» sombreada | `zona` existe | Plantilla de «proyección» que combine zona + borde discontinuo |
| Barra apilada y morfado entre gráficas | No | Transición `morfa` entre dos capas (mismas categorías) |
| Pictogramas de unidades (10.000 figuras) | No | Gráfica `unidades` (rejilla de iconos con conteo real) |
| Eje de tiempo con paneo + zona de color | Parcial (cámara en X) | Capa `regimen`/`periodo` con bandas etiquetadas que se desplazan |
| Mapas 3D con pines y flyover | No (fuera del alcance; está en Electric Eye) | Integración: pieza que alterne mapa (Electric Eye) y gráfica |
| Reveal con máscara sobre mapa | No | Fuera de alcance de este motor |
| Cortinas duras entre capítulos | Sí | Cubierto |
| Sonido (golpe, whoosh) en cada llamada | No | Pista de efectos de sonido separada, editable en Premiere |
| Cifras verificables y trazables | **Sí, mejor que ellos** | Ventaja nuestra: ni Harris ni Caspian publican la fila de datos de cada gráfica |

### Mejoras priorizadas

**P1 (más impacto cinematográfico, bajo costo)**
1. **Barra-fecha amarilla/oro** al estilo Harris: marca vertical que crece en ≈0,7-1 s, sin tarjeta, ligada a `ancla.fecha`. Cierra la brecha del «un dato por fecha».
2. **Opción `foco`**: serie protagonista gruesa y saturada, el resto atenuado (opacidad ≈25 %), como en la gráfica de China.
3. **Presets de cámara** `plano-golpe-plano`: general ≈4-5 s → punch-in ≈1,2 s sobre el evento → vuelve a abrir. Hoy se escribe a mano.
4. **Modo «voz lleva el dato»**: llamada sin texto (solo marca) para piezas con narración.
5. **Fondo claro tipo papel** (crema ≈#DAD5D0, líneas en tinta) como variante de marca.

**P2**
6. Etiqueta numérica pegada a cada barra al subir, con cifras siempre derivadas de datos (marcador `{valor}`).
7. Plantilla de proyección (`zona` + línea discontinua + etiqueta «estimado»).
8. Morfado entre gráficas (línea → área → barras apiladas con las mismas series).
9. Pista de sonido de efectos sincronizada con cada llamada, exportada aparte.

**P3**
10. Gráfica de pictogramas (`unidades`).
11. Eje de tiempo con bandas por periodo y paneo.
12. Integración con Electric Eye para alternar mapa 3D ↔ gráfica.
13. Marca fija en esquina (logo) con zona segura.

---

## 4. Límites honestos (qué NO pude verificar)

- **Resolución y muestreo.** Trabajé con 480p y con **1 fotograma por segundo** en las gráficas (2 fps en un tramo corto). Las duraciones de entrada de trazo tienen **±0,5-1 s de error**. Los easings exactos no se pueden medir así.
- **No vi dibujarse la línea.** En el tramo de Harris la gráfica aparecía ya completa en el primer fotograma de gráfica: el trazo (si existió) duró menos de 1 s o entró fundido. No tengo medida del «ritmo del trazo».
- **Muestra mínima.** Una gráfica de línea de Harris, tres de Caspian. No sé si es su estilo habitual en todos los videos ni de qué año es cada recurso.
- **Sonido y música: no analizados.** No extraje el audio ni medí golpes de llamada o mezclas.
- **Herramientas de Caspian desconocidas.** No hay fuente pública sobre su flujo; la marca «Powered by deltasweep.com» salió en los mapas, pero la búsqueda web no devolvió información de esa herramienta.
- **Tipografía no identificada** con certeza (ni en Harris ni en Caspian).
- **Detalles de máscara de mapas de Harris:** solo foro de Adobe (marcado como correcto, no confirmado por él) y resúmenes de terceros; el artículo de aescripts «How Johnny Harris Makes Maps» devolvió 403 al intentar leerlo.
- **Conteos de cortes** son por detección de cambio de escena (umbral 0,3): subcuentan fundidos y sobrecuentan cambios dentro de un mismo plano.
- **Paletas:** solo medí un píxel (fondo crema de Harris). Los demás colores son lecturas visuales.

## 5. Qué material pedirle a David

1. **2-3 videos concretos de cada canal en 1080p** con las gráficas que más le gustan (URL y minuto exacto), o descargarlos él (yo no tengo cookies de su cuenta).
2. **Capturas o clips de 10-15 s** de: trazo de línea desde cero, ranking en carrera, y la entrada de una barra con su etiqueta. Con eso mido a 24 fps o más.
3. **Un video de referencia con sonido** para medir golpes y whoosh de las llamadas (audio aislado ayuda).
4. **Cuál de los dos estilos prefiere** para MacroWise: crema editorial (Harris) o noche con trama (Caspian), o un híbrido. Define si el P1 5 (fondo claro) sube de prioridad.
5. **Lista de 3 gráficas objetivo** de MacroWise (serie y mensaje) para probar las mejoras sobre casos reales.

## 6. Fuentes

- Video Johnny Harris analizado: https://www.youtube.com/watch?v=axRhjqd-rus
- Video Caspian Report analizado: https://www.youtube.com/watch?v=K-qll_Yhfms
- aescripts, «Making maps for Johnny Harris» (GEOlayers): https://aescripts.com/learn/making-maps-for-johnny-harris---volcanoes/ (403 al leer; solo el título y el resumen del buscador)
- aescripts, «How Johnny Harris makes maps»: https://aescripts.com/learn/how-johnny-harris-makes-maps/ (no leído)
- Adobe Community, reveal de mapa de Johnny Harris: https://community.adobe.com/t5/after-effects-discussions/how-does-johnny-harris-do-this-mask-reveal-animation-in-after-effects/td-p/15191636
- PremiumBeat, «Making maps for Johnny Harris»: https://www.premiumbeat.com/blog/making-maps-for-johnny-harris/
- Boone Loves Video (curso, freelancer de mapas para Harris): https://boonelovesvideo.teachable.com/
- Glasp, resumen automático de «How to Create Animated Maps with AfterEffects» (rumor, no verificado): https://glasp.co/youtube/GsojLuJpe_0
- Repo del motor: `README.md`, `docs/CAPAS.md`, `servidor/guia-de-direccion.md`

---

## 7. Segunda ronda (2026-11-03): 8 videos con gráficas protagonistas

Método: búsqueda con `yt-dlp ytsearch` (WebSearch no devolvió videos útiles), descarga de solo video a 480p, hoja de contactos (1 fotograma/10 s) y, sobre los tramos con gráfica, fotogramas a 4 fps (12 s) o 2 fps (24 s) con marca de tiempo. Frames y videos en carpeta temporal fuera del repo. Cortes = detección de escena (umbral 0,3).

### 7.1 Videos revisados

| # | Canal | Título (URL) | Duración | Gráficas (minuto aprox.) | Uso |
|---|---|---|---|---|---|
| 1 | Johnny Harris | Why Recessions Happen (https://www.youtube.com/watch?v=EhyOQ0QMINg) | 15:43 | 0:50-1:10 puntos y línea de PIB; 3:20-4:30 PIB Inglaterra; 5:00-5:40 PIB y barras USA; 7:20-7:50 línea + etiqueta «Recession»; ≈13:00 desempleo | **Tramos 0:52-1:04 (4 fps) y 5:00-5:24 (2 fps)** |
| 2 | Caspian Report | How France is becoming a "third-world" economy (https://www.youtube.com/watch?v=mC5NdpSMDks) | 18:23 | ≈15 gráficas (bonos ≈11:35, partidos ≈10:00, déficit ≈14:00, deuda/PIB ≈15:00) | **Tramo 11:35-11:59 (2 fps)** |
| 3 | Caspian Report | Why global debt keeps growing (https://www.youtube.com/watch?v=EzCiEv1IqiA) | 15:43 | Barras de deuda mundial ≈0:30; intereses ≈9:00 | Solo hoja de contactos; el tramo elegido cayó en un mapa |
| 4 | Caspian Report | US National Debt, Part 1 (https://www.youtube.com/watch?v=WWCoDORgs3A) | 11:36 | Pastel y barras (2018) | Solo hoja de contactos (estilo antiguo) |
| 5 | Johnny Harris | INFLATION, Explained in 6 Minutes (https://www.youtube.com/watch?v=zIbNJCSCEjk) | 8:44 | Barras «movie ticket prices» ≈1:50 | Solo hoja de contactos (2021, collage) |
| 6 | Johnny Harris | Our New Global Economy (https://www.youtube.com/watch?v=pQCJmxEOzhs) | 21:16 | Capítulo «Global Trade Explodes» 3:48 | Descargado, **no analizado** |
| 7 | Caspian Report | How Putinomics works (https://www.youtube.com/watch?v=nhu3n8vkJSg) | 12:29 | — | Descargado, solo conteo de cortes |
| 8 | Caspian Report | UK "third-world" economy (https://www.youtube.com/watch?v=OTWDzMjgsEY) | 15:36 | — | Solo localizado |

Candidatos sin tocar: 1955 vs 2025 (https://www.youtube.com/watch?v=J4qqIJ312zI), Why most of our money isn't real (https://www.youtube.com/watch?v=E_VKZ6dzauo), Caspian US National Debt Parte 2 y 3.

### 7.2 Hallazgos

**Johnny Harris (estilo actual; medido en 2 tramos del video 1)**
1. **Fondo casi negro, línea rosa-roja.** Histograma de color: fondo ≈ #101010-#181818; línea y puntos rosa-rojo (≈ #C05040 en los píxeles más saturados). Difiere del fondo crema de la sección 1 (otro video). Confianza: **alta** (colores), media (que sea la paleta de toda la serie).
2. **La línea se construye punto a punto.** Tramo 0:52-1:04: cada punto entra rebotando desde la derecha, aterriza y se conecta con segmento en ≈0,5 s; cadencia ≈1-1,5 s por punto. En «GDP USA» (≈5:08-5:12) la línea se dibuja de izquierda a derecha en ≈3,5 s mientras la cámara reescala el eje. Confianza: **alta** (4 fps, ±0,25 s).
3. **Cámara viva todo el rato.** Zoom/pan continuo que reencuadra la línea mientras crece (el eje Y se reescala ≈3 veces en 12 s); luego punch-in a las barras de recesión en ≈4 s (barras finas a bandas anchas, ≈5:16-5:22). Confianza: **alta**.
4. **Etiqueta = píldora amarilla.** Nace como punto amarillo, se alarga a píldora en ≈0,5 s y el texto («GDP», «Recession», «GDP USA») se escribe letra a letra en ≈0,75 s; serif negrita sobre amarillo; se queda fija. Confianza: **alta**.
5. **Recesiones = barras verticales naranja translúcidas** que aparecen escalonadas en ≈1 s sobre la línea; después la cámara las ensancha. Un **círculo amarillo** se dibuja en arco (≈0,5-1 s) alrededor del bache concreto. Confianza: **alta**.
6. **Línea base discontinua** blanca que entra al inicio y acompaña el reencuadre; **caja roja** pequeña con texto monoespaciado, sin cifra grande. Confianza: media.
7. **Ritmo.** Cortes: Recessions 214 en 942 s = **1 cada ≈4,4 s**; Inflation (2021) 150 en 523 s = ≈3,5 s. Las gráficas duran 6-25 s continuas: el movimiento es de cámara dentro de la gráfica, no corte. Confianza: media (umbral 0,3).
8. **El estilo evolucionó.** 2021: collage crema/salmón con recortes y etiquetas «$1350»; casi sin gráficas de datos. 2025: gráficas de datos oscuras, línea roja y píldoras. No es una sola estética. Confianza: media (2 puntos en el tiempo).

**Caspian Report (France y Global debt)**
9. **Fondo gris oscuro (≈ #404040-#505050) con viñeta; series teal y gris; ejes en blanco diminuto.** No es el navy con puntos de la sección 1. El video de deuda global usa **papel arrugado claro** con teal/azul. Confianza: **alta** (hoja de contactos de 2 videos).
10. **Gráfica quieta ≈7 s antes de actuar.** Bonos a 10 años (≈11:35): 7 s de gráfica completa con 4-5 países; luego las series secundarias bajan a gris tenue en ≈1,5 s (técnica de foco); a ≈11,5 s del tramo se dibuja una **elipse amarilla** en el bache de 2008-2012 (≈1 s) y a ≈12-13 s se escribe «Eurozone sovereign debt crisis» al lado; la anotación se queda ≈10 s. Confianza: **alta**.
11. **Tipos de gráfica repetidos:** línea con banderas al final de cada serie, barras horizontales de ranking, donut/semi-donut grande, rejilla de pictogramas (retirados vs. población activa, 1997/2025/2040), mapa 3D con tarjetas negras de datos. Confianza: **alta**.
12. **Artículos como prueba con la frase resaltada en verde lima** (no azul/amarillo). Confianza: media.
13. **Cortes:** France 181 en 1103 s ≈ 6,1 s; Debt P1 (2018) 38 en 696 s ≈ 18 s (estilo antiguo, plano largo); Global debt 278 en 943 s ≈ 3,4 s (cuenta fundidos de papel, poco fiable). Confianza: baja.
14. **Marca fija** (logo de torre blanco) abajo-izquierda en todo el video. Confianza: alta.

### 7.3 Correcciones a la sección 1
- «Navy con puntos» (Caspian) **no es general**: en 2025-26 usa gris carbón o papel claro, con teal como color de dato. Confianza: media-alta.
- El amarillo de Harris sigue siendo el color del «momento», pero en Recessions se manifiesta como píldora y círculo en arco, no solo como barra vertical. Confianza: media.

### 7.4 Brechas nuevas para el motor
1. **Construcción punto a punto** (`modo:"puntos"`): cada punto entra con rebote corto y conecta la línea en ≈0,5 s; cadencia 1-1,5 s por punto configurable.
2. **Cámara que sigue el extremo de la línea** con eje auto-reescalado (`camara:"seguir"`), además del `camara:[{t,x,y}]` manual.
3. **Píldora de etiqueta**: punto, píldora, texto escrito letra a letra (≈1,25 s), color «momento» con serif negrita.
4. **Círculo en arco** dibujado sobre un bache o pico (≈0,7 s) con anotación que se escribe al lado.
5. **Bandas de recesión/periodo** translúcidas que aparecen escalonadas en ≈1 s, más zoom que las ensancha.
6. **Foco temporal medido:** ≈7 s de plano general y luego las series secundarias a gris en ≈1,5 s (concreta el `foco` de la sección 3).
7. **Línea base discontinua** que acompaña el reencuadre.
8. **Banderas/etiquetas al final de cada serie** (cabeza de línea con nombre o icono).
9. **Tres temas nuevos:** casi negro + línea rosa-roja, gris carbón + teal, y papel claro (además del oscuro actual).
10. **Ranking horizontal y donut/semi-donut** como tipos nativos; pictogramas por periodo.
11. **Marca fija con logo** en esquina (confirmada en Caspian).
12. **Guion de escena de gráfica:** 6-25 s continuos sin cortes con 2-3 acciones encadenadas (línea, etiqueta, círculo), una acción cada 4-6 s.

### 7.5 Qué NO pude verificar
- **Sonido, música y whoosh:** no analizados (videos descargados sin audio).
- **Transcripción:** no usé la skill `watch` ni extraje subtítulos; los minutos de gráficas salen de la hoja de contactos (±10 s) y de los capítulos de YouTube.
- **Videos 3-8:** solo hoja de contactos (3, 4, 5) o ni eso (6, 7, 8); el tramo de «Global debt» cayó en un mapa, así que no medí sus barras.
- **Easing exacto y duración del rebote del punto:** a 4 fps solo hay ±0,25 s.
- **Fuente tipográfica:** sin identificar (la píldora parece serif tipo Playfair o DM Serif; sin comprobar).
- Resolución 480p; colores por histograma de 1 fotograma, no muestreo exhaustivo.
- Si es el estilo estable de cada canal o solo de estos videos.

### 7.6 Qué ya está implementado (2026-11-03)
Lo medido en 7.2 se aplicó al motor. Cada punto sale de una brecha de 7.4:
- **Cámara que sigue la línea** (brecha 2): `"camara": "seguir"` en una capa `linea`. Ventana que acompaña la punta, eje Y reescalado (envolvente de unos instantes alrededor, así la línea nunca se sale), y al terminar se abre al plano completo. En el estudio: «Sigue la línea (estilo Johnny Harris)».
- **Píldora de etiqueta** (brecha 3): `"estilo": "pildora"` en una `llamada`. Punto → píldora amarilla → frase escrita letra a letra (≈1,25 s), serif negrita. Va anclada a una fila de datos como todas las llamadas.
- **Círculo en arco** (brecha 4): `"estilo": "circulo"`. Elipse dibujada en ≈0,7 s sobre el dato y anotación escrita al lado.
- **Bandas de periodo** (brecha 5): `"estilo": "banda"` en una `zona` (relleno más visible, sin guías discontinuas).
- **Temas** (brecha 9, parcial): `"tema": "oscuro" | "harris" | "carbon"` en la spec. `harris` = casi negro + línea rosa-roja + amarillo de momento; `carbon` = gris carbón + teal. **Sigue pendiente el tema «papel claro»** (cambia el color de todos los textos).
- **Pendientes de 7.4:** modo punto a punto (1), foco temporal medido (6), línea base discontinua (7), banderas al final de cada serie (8), ranking horizontal/donut/pictogramas (10), marca fija con logo (11), guion de 6-25 s por gráfica (12).
