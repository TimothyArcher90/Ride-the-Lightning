# Investigación: animación de datos para video (Ride the Lightning)

Fecha: 2026-11-04. Método: búsquedas web + lectura de páginas.
Convención de fuentes:
- [LEÍDA] = abrí la página y extraje el contenido.
- [BÚSQUEDA] = solo vi el resumen del buscador, no la página.
- [HIPÓTESIS] = criterio mío o de blogs sin dato primario; hay que probarlo con nuestras propias curvas de retención.

## 0. Qué se pudo y no se pudo verificar

Fuentes leídas:
- Material Design 1, duración y easing: https://m1.material.io/motion/duration-easing.html [LEÍDA]
- Burn-Murdoch (FT), resumen de charla: https://lab.imedd.org/en/from-data-to-storytelling-concept-and-design-tips-from-the-financial-times-john-burn-murdoch/ [LEÍDA]
- FT Visual Vocabulary (README oficial): https://github.com/Financial-Times/chart-doctor/blob/main/visual-vocabulary/README.md [LEÍDA]
- Datawrapper, énfasis con color: https://www.datawrapper.de/blog/emphasize-with-color-in-data-visualizations [LEÍDA]
- Críticas a las barras en carrera: https://builtin.com/articles/bar-chart-races [LEÍDA]
- Tamaños de subtítulo y zonas muertas TikTok (blog de un proveedor): https://blitzcutai.com/blog/best-caption-size-tiktok-2026 [LEÍDA, no oficial]
- Heer y Robertson 2007, ficha: https://idl.uw.edu/papers/animated-transitions [LEÍDA, solo resumen]

Solo vistas en búsqueda (no abiertas):
- Johnny Harris usa After Effects + plugin GEOlayers para mapas: https://aescripts.com/learn/how-johnny-harris-makes-maps/ (403 al abrirla).
- Burn-Murdoch en GIJN: https://gijn.org/stories/data-visualization-storytelling-tips-john-burn-murdoch/ (403).
- PDF Heer y Robertson 2007: https://homes.cs.washington.edu/~jheer/files/2007-AnimatedTrans-InfoVis.pdf (PDF binario ilegible para la herramienta). Del resumen: dos principios (Congruencia y Aprehensión), la animación mejora la percepción, las transiciones por etapas rinden mejor, reescalar el eje antes de mover valores. Los números del paper NO verificados.
- Kurzgesagt, su proceso: https://kurzgesagt.org/youtube/ (guion primero, la voz del narrador fija el tiempo de la animación, After Effects).
- Alberto Cairo, cinco cualidades (veraz, funcional, bella, reveladora, esclarecedora): https://thedataschool.co.uk/laura-brylka/the-five-qualities-of-great-vizualizations-according-to-alberto-cairo (resumen de terceros).
- Mona Chalabi: sus dibujos a mano buscan mostrar incertidumbre y humanizar; https://www.dezeen.com/2023/11/16/mona-chalabi-pulitzer-prize-winner/ (solo búsqueda).
- The Pudding: parten de una pregunta, estructura de lo general a lo particular, exigen una conclusión clara; https://www.storybench.org/?p=8613 (solo búsqueda).

No encontré (no inventar): guías oficiales de Vox, Caspian Report, Bloomberg Graphics, Reuters Graphics ni NYT sobre animación de gráficas. Tampoco datos primarios de retención para videos de datos. Los benchmarks de "hook rate" de blogs son contradictorios (p. ej. 25-30 % vs 70-85 % según la definición) y no los uso como cifras. [HIPÓTESIS] todo lo que dependa de ellos.

## 1. Quince técnicas con parámetros (motor canvas 2D determinista)

Base: 30 fps, tiempo en segundos, `t` normalizado 0..1 por tramo. Todo valor es punto de partida a calibrar, salvo donde cito fuente.

1. **Entrada con deceleración (ease-out).** Elementos que entran frenan al llegar. Curva Material "Deceleration" cubic-bezier(0, 0, .2, 1) [LEÍDA]. Duración de entrada en móvil ~225 ms; salida ~195 ms; por encima de 400 ms se siente lento [LEÍDA]. Para gráfica de video (no UI) escalar x2-x3: 0.45-0.7 s [HIPÓTESIS].
2. **Movimiento interno con ease-in-out.** Cambios de valor y reposicionado: cubic-bezier(.4, 0, .2, 1) [LEÍDA]. Trazado de línea: 1.2-2.4 s según nº de puntos.
3. **Salida con aceleración (ease-in).** cubic-bezier(.4, 0, 1, 1) [LEÍDA]. Salida más corta que la entrada (~70-85 %).
4. **Duración proporcional a la distancia.** Material recomienda escalar por distancia y cambio de superficie [LEÍDA]. Fórmula: `dur = clamp(0.35 + dist_px/2400, 0.35, 1.2)` s [HIPÓTESIS en la constante].
5. **Escalonado (stagger) de barras/puntos.** Retardo 40-90 ms entre elementos, tope total del grupo 0.8 s (si hay muchos, subir velocidad, no retardo) [HIPÓTESIS]. Orden por valor descendente o por posición, nunca aleatorio.
6. **Transición por etapas.** Heer y Robertson: lo escalonado rinde mejor que la interpolación directa; primero reescalar eje, luego mover valores [BÚSQUEDA]. Receta: etapa A (eje, 0.5 s) → pausa 0.15 s → etapa B (valores, 0.8 s).
7. **Anticipación breve.** 80-120 ms de retroceso (3-6 % de escala o 4-8 px) antes de un golpe grande [HIPÓTESIS, principio Disney].
8. **Golpe de énfasis (pop) con sobreimpulso.** Escala 1 → 1.06-1.10 → 1 en 0.28-0.4 s, easeOutBack suave (overshoot 1.2-1.5) [HIPÓTESIS]. Solo en el protagonista del plano; máximo 2 golpes por plano.
9. **Foco y atenuación.** Al resaltar un elemento, el resto baja a 25-35 % de opacidad o a gris, en 0.3 s. Alineado con Datawrapper (gris para contexto, 1-2 colores de énfasis) [LEÍDA] y Burn-Murdoch ("minimizar distracción, maximizar contraste") [LEÍDA].
10. **Contador numérico.** Cifra de 0 al valor con ease-out en 0.8-1.4 s; congelar y mantener ≥ 1.5 s tras llegar. Ancho fijo con dígitos tabulares para que no tiemble.
11. **Dibujo de línea con punta viva.** `stroke-dashoffset`/recorte; marcador circular (r 8-12 px) en la punta con etiqueta que la sigue; si la línea tiene salto brusco, ralentizar tramo (tiempo ∝ 1/pendiente^0.5) [HIPÓTESIS].
12. **Anotación sincronizada con la voz.** La anotación aparece 0.1-0.2 s ANTES de que la voz diga la cifra (la mirada llega primero) y se mantiene hasta 0.4 s después [HIPÓTESIS]. El audio manda; las escenas se derivan de los timestamps de palabra (ya es regla del proyecto).
13. **Tiempo de lectura.** Cada texto visible ≥ 3 s (regla Electric Eye). Cifra suelta ≥ 1.5 s tras terminar su animación. Texto largo: 0.25 s por palabra + 1 s [HIPÓTESIS].
14. **Mantener quieto el final.** Último frame de cada plano estable 0.5-1.0 s antes del corte; sin movimiento residual (microtemblor = amateur).
15. **Movimiento de cámara lento y constante.** Zoom 100 → 103-106 % durante todo el plano (ken burns sutil) para evitar sensación de imagen congelada; nunca durante un golpe de énfasis [HIPÓTESIS].

Tabla rápida de curvas (cubic-bezier): entrada (0,0,.2,1); estándar (.4,0,.2,1); salida (.4,0,1,1); afilada (.4,0,.6,1) [todas LEÍDA, Material 1]. Pop: easeOutBack con overshoot ~1.3 (no es de Material).

## 2. Checklist amateur vs pro (convertible en pruebas automáticas)

Cada fila lleva una prueba sobre la escena (JSON/frames) y un umbral.

| # | Amateur | Pro | Prueba automática | Umbral |
|---|---|---|---|---|
| 1 | Movimiento lineal | Easing con curva | Detectar tramos con velocidad constante > 0.3 s en objetos que se mueven | 0 tramos |
| 2 | Todo entra a la vez | Escalonado o foco | Contar elementos con mismo `t_inicio` en un grupo > 3 | 0 grupos |
| 3 | Texto < 3 s en pantalla | Texto ≥ 3 s | `t_fin - t_inicio` por texto | ≥ 3.0 s |
| 4 | Texto pisa texto | Cajas separadas | Intersección de bounding boxes por frame muestreado cada 0.1 s | 0 solapes |
| 5 | Texto en zona de UI de TikTok | Dentro de zona segura | Caja fuera del rectángulo seguro | 0 violaciones |
| 6 | Letra pequeña (< ~48 px en 1080x1920) | Tamaños legibles | Tamaño de fuente mínimo en canvas | ≥ 48 px (rótulos), ≥ 60 px (cifras) [HIPÓTESIS, cifra de blog] |
| 7 | Más de 1 protagonista | Un protagonista por plano | Nº de elementos con opacidad > 0.8 y animándose a la vez | ≤ 1 |
| 8 | Arcoíris de colores | 1-2 colores de énfasis + gris | Nº de tonos distintos con saturación alta por plano | ≤ 3 |
| 9 | Contraste bajo | Contraste fuerte | Contraste texto/fondo (WCAG) por rótulo | ≥ 4.5:1 (≥ 7:1 recomendado) |
| 10 | Cifra sin fuente | Fuente visible | Cada cifra rotulada tiene campo `fuente` no vacío | 100 % |
| 11 | Eje que salta o cambia de escala sin aviso | Eje estable o etapa de reescalado | Cambio de dominio entre frames fuera de etapa | 0 |
| 12 | Eje truncado engañoso en barras | Barras desde 0 | Barras con base ≠ 0 | 0 (salvo marcado) |
| 13 | Leyenda separada | Etiqueta directa en la serie | Gráfica con >1 serie y sin etiqueta a ≤ 40 px de la línea | 0 [LEÍDA, Burn-Murdoch] |
| 14 | Título descriptivo vacío ("Ventas") | Título que dice la conclusión | Título contiene verbo o cifra | sí |
| 15 | Rebote excesivo | Sobreimpulso sutil | Overshoot máximo del pop | ≤ 12 % |
| 16 | Animación demasiado larga o lenta | Duración justificada | Entrada > 1.2 s sin ser trazado | 0 |
| 17 | Frame final con movimiento | Final estático | Diferencia de píxel entre últimos 6 frames del plano | < umbral |
| 18 | Parpadeo por redondeo (jitter de píxel) | Posiciones subpíxel suavizadas | Varianza de posición frame a frame en objetos "quietos" | ~0 |
| 19 | Muchas barras en carrera sin guía | Carrera con anotación o alternativa | Barras en carrera sin ≥ 1 anotación | 0 [LEÍDA, builtin: se recomienda guía] |
| 20 | Colores no distinguibles en daltonismo | Paleta segura | Simular deuteranopía y medir distancia entre series | ΔE mínimo [HIPÓTESIS] |
| 21 | Sin fondo definido / ruido | Fondo opaco de marca | Tarjetas con alfa < 1 (regla: opacas) | 0 |
| 22 | Anotación desfasada de la voz | Sincronizada | |t_anotación - t_palabra| | ≤ 0.2 s |

## 3. Guiones visuales segundo a segundo (30 / 45 / 60 s)

Principios de partida: Pudding = pregunta primero y conclusión clara [BÚSQUEDA]; FT = el título dice el mensaje y las anotaciones responden "qué muestra / por qué importa" [LEÍDA]. La importancia de los primeros 3 s es consenso cualitativo en blogs; los porcentajes concretos son [HIPÓTESIS].

### 30 s (1 dato, 1 gráfica)
- 0-3 s GANCHO: cifra grande o pregunta ("¿Cuánto cayó…?") sobre fondo vacío; 1 elemento. Sin logo.
- 3-8 s CONTEXTO: eje y serie apenas visibles; la línea empieza a dibujarse.
- 8-20 s DATO: línea completa; punta viva; resalte del máximo/mínimo con pop y atenuación del resto; anotación con año + qué pasó + cifra.
- 20-26 s GIRO: segundo dato que cambia la lectura (p. ej. recuperación o comparación); transición por etapas (eje primero).
- 26-30 s CIERRE: frase aforística + fuente visible ≥ 3 s + marca.

### 45 s (2 gráficas)
- 0-3 s gancho (cifra o contradicción).
- 3-6 s pregunta ancla que se contestará al final.
- 6-18 s gráfica A (línea o barras) con 1 anotación.
- 18-22 s puente: corte limpio, cambio de modelo de gráfica (p. ej. de línea a barras) para reiniciar atención.
- 22-36 s gráfica B con el giro (comparación o pendiente).
- 36-42 s respuesta a la pregunta ancla con la cifra final en contador.
- 42-45 s fuente + marca.

### 60 s (3 bloques)
- 0-3 s gancho.
- 3-8 s planteamiento + pregunta ancla.
- 8-22 s bloque 1: gráfica base; 2 anotaciones máx.
- 22-26 s pausa visual (corte con silencio o respiración de 0.5 s).
- 26-42 s bloque 2: giro; cambiar tipo de gráfica.
- 42-52 s bloque 3: consecuencia o comparación; contador final.
- 52-58 s cierre que responde la pregunta ancla, frase citable.
- 58-60 s fuente y marca. Si hay 2+ fuentes, listarlas en la tarjeta final ≥ 3 s.

Reglas de ritmo comunes: una "novedad visual" (cambio de gráfica, etapa, resalte) cada 4-6 s [HIPÓTESIS]; nunca dos textos nuevos a la vez; cada cifra con fuente.

## 4. Diez modelos de gráfica nuevos (no existen ya)

Referencia de familias del FT (Visual Vocabulary) [LEÍDA]: desviación, correlación, ranking, distribución, cambio en el tiempo, parte-del-todo, magnitud, espacial, flujo. Los siguientes salen de ahí o de variantes.

1. **Lollipop de ranking.** Palos + círculos. Animación: palos crecen escalonados (60 ms), círculos hacen pop al llegar; el líder se agranda. (Familia ranking/magnitud.)
2. **Barras divergentes (desviación).** Barras desde un cero central hacia izquierda/derecha. Animación: eje se dibuja, barras salen del centro en dos direcciones; las positivas con color de énfasis y negativas en gris, o al revés.
3. **Dispersión conectada (connected scatter).** Puntos unidos en orden temporal. Animación: trazo avanza año a año con punto vivo y etiqueta de años clave; zoom a cuadrantes.
4. **Fan chart (proyección).** Banda de incertidumbre alrededor de una proyección. Animación: línea histórica sólida; al llegar al presente se abre un abanico en 3 etapas (cono 50 %, 80 %, 95 %). Coherente con la idea de Chalabi de mostrar incertidumbre [BÚSQUEDA].
5. **Histograma / distribución que se llena.** Puntos "caen" y se apilan en cajones (efecto cascada). Animación: caída escalonada con ease-in y rebote mínimo; el dato del protagonista cae de último y se resalta.
6. **Pirámide poblacional / mariposa.** Dos histogramas espejo por edad. Animación: barras crecen desde el centro por cohorte; un deslizador de año avanza (barra de tiempo visible).
7. **Calendario de calor (calendar heatmap).** Rejilla de días. Animación: barrido en onda diagonal con retardo por celda (20-30 ms); resalte de un día extremo con pop y atenuación.
8. **Línea de tiempo de eventos (Priestley/circle timeline).** Eventos sobre un eje con tarjetas. Animación: cámara se desplaza; cada evento aparece cuando la voz lo dice; tarjeta con año + qué pasó + dato.
9. **Dot strip / dot plot de dos momentos (dumbbell).** Cada categoría con dos puntos unidos por una barra (antes/después). Animación: ambos puntos nacen en "antes", el segundo viaja a "después" con ease-in-out; la barra se estira; ordenar por tamaño del cambio.
10. **Cartograma / isotipo (pictograma).** Iconos que representan unidades (p. ej. 1 icono = X). Animación: los iconos se llenan en bloques escalonados; el exceso se tiñe con color de énfasis. (Magnitud/isotype del FT.)

Evitar: más barras en carrera sin alternativa (críticas de Cotgreave y Bostock, mapear tiempo al espacio como bump chart es mejor para tendencias) [LEÍDA, builtin].

## 5. Top 10 priorizado de implementación

Criterio: impacto en "se ve pro" por esfuerzo, y coherencia con reglas Electric Eye (3 s de lectura, un protagonista, sin solapes, zona segura, fuente siempre).

1. **Linter automático de escena** (checklist sección 2, filas 3, 4, 5, 7, 10, 22): bloquea render si falla. Esfuerzo bajo, impacto alto.
2. **Biblioteca de easings** (entrada, estándar, salida, pop) con las curvas de Material [LEÍDA] + easeOutBack. Esfuerzo bajo.
3. **Foco y atenuación automática** (gris para contexto, 1-2 colores de énfasis) [LEÍDA]. Esfuerzo medio, impacto muy alto.
4. **Motor de anotaciones sincronizadas con la voz** (aparece 0.1-0.2 s antes de la palabra) con tarjeta año · qué pasó · dato. Esfuerzo medio.
5. **Escalonado y transición por etapas** (eje → valores). [BÚSQUEDA, Heer y Robertson]. Esfuerzo medio.
6. **Contador numérico + tiempo de lectura garantizado** (≥ 1.5 s tras llegar, ≥ 3 s texto). Esfuerzo bajo.
7. **Plantilla de guion visual 30/45/60 s** con gancho, pregunta ancla, giro y cierre-aforismo (sección 3). Esfuerzo bajo.
8. **Pop de énfasis con anticipación y sobreimpulso acotado** (≤ 12 %). Esfuerzo bajo.
9. **Nuevos modelos: lollipop, barras divergentes, dumbbell y fan chart** (sección 4, 1, 2, 9, 4). Esfuerzo medio-alto, mayor variedad visual y mensaje (desviación, antes/después, incertidumbre).
10. **Prueba de legibilidad** (contraste ≥ 4.5:1, tamaño mínimo, simulación de daltonismo, etiqueta directa en la línea). Esfuerzo medio.

Siguiente paso recomendado (no verificado): medir en nuestros propios reels la curva de retención por segundo (TikTok Studio / Instagram) y comparar versiones con y sin foco/atenuación. Mientras no haya ese dato, todos los umbrales marcados [HIPÓTESIS] son puntos de partida a calibrar, no verdades.
