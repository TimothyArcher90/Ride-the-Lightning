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
