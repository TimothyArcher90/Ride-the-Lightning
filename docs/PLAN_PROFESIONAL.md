# Plan profesional de Ride the Lightning (2026-11-04)

Origen: David, tras usar el estudio: «innavegable, ilegible, inentendible… burdo… no sé cómo usarlo ni para qué sirve».
Meta: un **visualizador universal** de datos reales — cualquier dato, cualquier país, cualquier gráfica — con interfaz clara y salida de nivel profesional, sin que David tenga que saber de gráficas.

## 1. Diagnóstico (medido en capturas, no supuesto)

| Problema | Evidencia | Arreglo |
|---|---|---|
| Página de 5.382 px, 185 tarjetas iguales | captura completa del paso 1 | Lista «Los más usados», búsqueda, categorías, «Ver más» (24 por página) |
| No dice para qué sirve | cero texto de propósito | Bloque «Para qué sirve + 3 pasos» |
| Primer paso sin acción obvia | vista previa negra vacía | Entradas por intención (6 tarjetas), botón «Ver un ejemplo ya hecho» |
| El usuario elige un «tipo de gráfico» a ciegas | dibujitos genéricos | **Galería viva**: cada estilo muestra TU dato dibujado de verdad |
| Avisos técnicos filtrados | «datos.d: ninguna capa…» | Filtrados; mensajes en español claro |
| Letra de la salida ilegible en celular | 19–26 px sobre 1080 | Sistema de diseño con tamaños mínimos medidos (ver §4) |
| Faltan países, deuda, PIB | catálogo sin datos por país | 45 países × ~11 indicadores, ficha de país y comparación (ver §3) |
| Faltan gráficas | 16 modelos | +11 modelos (radar, área apilada, velas, histograma, dumbbell, calendario…) |

## 2. Arquitectura del flujo (4 pasos, siempre visibles)

1. **Qué mostrar** — 6 entradas agrupadas: *Mercados y economía* (un dato en el tiempo) · *Países* (un país; comparar países) · *Empresas* (cómo gana y gasta; qué sumó y restó) · *Mis datos* (Excel/CSV).
2. **Cómo verlo** — galería viva con todos los estilos que encajan; la mejor va primero con ★ y el porqué. Título, formato (16:9 / 9:16), momentos clave.
3. **Cámara y ritmo** — una recomendada; avanzado plegado.
4. **Revisar y descargar** — resumen (dato, estilo, formato, duración), fuentes y exactitud, borrador (~30 s) o versión final (MP4 + ProRes con alfa + informe).

Principios UX aplicados (Nielsen, divulgación progresiva, «reconocer antes que recordar»): un solo objetivo por pantalla; lo avanzado plegado; todo estado visible (paso actual, qué hay elegido, qué falta); textos en español claro; objetivos táctiles ≥ 44 px; foco visible; sin desborde horizontal en 390 px.

## 3. Datos

- **Países** (`servidor/paises.mjs`): ficha con el último dato de cada indicador (valor, año, fuente) y series completas `pais_<ISO3>_<indicador>`. Fuentes: Banco Mundial (CC BY 4.0) y FMI DataMapper.
- **Verificación de fuentes**: cruce Banco Mundial ↔ FMI en PIB, deuda/PIB, inflación y población; discrepancias registradas en `catalogo/verificado.json`. Sin interpolar jamás. Cada cifra en pantalla lleva su fuente y fecha.
- **Pendiente de decisión legal**: reutilización comercial de datos del FMI (términos a confirmar con su texto oficial).

## 4. Salida (lo que se exporta)

Sistema de diseño único (`motor/diseno.js`): jerarquía título/subtítulo/cuerpo/cifra, tamaños mínimos por formato medidos con pruebas, contraste ≥ 4,5:1, pie obligatorio «Fuente · fecha del último dato», zona segura de reels, movimiento con easing y entradas escalonadas. Checklist automatizado (`scripts/prueba-calidad.mjs`) para los modelos × 2 formatos.

## 5. Visualizador universal

Modelos nuevos en `motor/capas_extra.js`: radar/perfil, área apilada y 100 %, velas/OHLC, histograma, dumbbell, calendario de calor, barras agrupadas, bullet, serie con bandas, pictograma, ranking por país. El visualizador autónomo (`servidor/visualizador.mjs`) los recomienda por forma del dato y la galería los muestra.

## 6. Orden de entrega y estado

| Fase | Contenido | Estado |
|---|---|---|
| A | Interfaz: guía, lista compacta, pasos claros, móvil | Hecho (ab68f11, cc2e9c9) |
| B | Países: ficha, comparación, verificación de fuentes | En curso |
| C | Salida profesional: diseño, pie de fuente, checklist | En curso |
| D | Modelos universales + galería viva | En curso (galería lista; modelos en curso) |
| E | Prueba con una persona no técnica, video final de muestra | Pendiente |
| F | Biblioteca de plantillas guardadas / «Sorpréndeme» multi-opción | Pendiente |
