# Prioridades de Ride the Lightning (lista viva del trabajo de noche)

Orden de trabajo para la sesión nocturna (ver «Trabajo de noche» abajo). Cada tarea termina con: pruebas en verde, commit, push y una línea en el diario `docs/diagnosticos/AAAA-MM-DD-noche.md`.
Estado: ✅ hecho · 🔄 en curso · ⬜ pendiente.

## P0 · Lo pedido el 2026-11-03 (hecho el mismo día)
- ✅ Sankey, anillo y cascada; estudio por historias; temas; cámara «seguir»; píldora y círculo.
- ✅ Biblioteca de trimestres (SEC): 16 destacadas con toda la historia desde 2009 + **toda la bolsa de EE. UU.** (7.200+ empresas) con los últimos 3 años, bajada al elegirla o de noche.
- ✅ Detalle fino del último año (4 trimestres): líneas propias de gasto (Fulfillment, Technology…) e ingresos por producto/segmento (AWS, Online stores…), desde el XBRL completo.
- ✅ Agente vigilante por el índice diario de la SEC (toda la biblioteca con 2 peticiones) + borrador automático.
- ✅ Resultados de una empresa como series (ingresos, utilidad, margen) para las plantillas de series.
- ✅ Chat para editar la pieza hablando (Claude Code + 18 herramientas MCP).

## P1 · Datos y exactitud (lo más importante)
1. ⬜ **Detalle fino en todos los trimestres de las destacadas** (hoy: último año). Tarea nocturna: `node scripts/trimestres.mjs construir` con `detalle` alto (la caché hace que se pueda repetir).
2. ⬜ **Verificar la cobertura del universo** al amanecer: `node scripts/trimestres.mjs universo` → cuántas empresas con trimestres, cuántas sin datos y por qué (bancos, aseguradoras, REITs, empresas nuevas). Escribir el resumen en el diario.
3. ⬜ **Bancos y aseguradoras**: estructura propia (ingresos por intereses, provisiones, gastos no financieros). Diseñar su Sankey específico o dejarlos documentados como «no aplica».
4. ⬜ **Traducciones**: revisar las etiquetas en inglés que quedaron sin traducir en las empresas más grandes (`servidor/xbrl.mjs`, diccionario `ES`). No traducir lo dudoso.
5. ⬜ **Comparativo a/a** (variación contra el mismo trimestre del año anterior) en cada nodo del Sankey: ya existe en el motor (`anterior`); falta escribir la columna en los CSV.
6. ⬜ **Q4 con detalle fino** para empresas con año fiscal raro (probar Apple, Walmart, Costco, Nvidia, Oracle).

## P2 · Experiencia de usuario
7. ⬜ Probarlo con una persona no técnica (10 minutos, sin ayuda). Anotar dónde se traba.
8. ⬜ Pantalla de inicio con tres puertas claras: «Empresas (SEC)», «Mercados y economía (172 series)» y «Mis archivos»; con el mapa de datos (`GET /api/datos`).
9. ⬜ Buscador de series del paso 1 con sugerencias («oro», «petróleo»…) y categorías con iconos.
10. ⬜ Editar la pieza con el chat y con controles a la vez sin que se pisen (hoy, tocar los pasos rehace la pieza).
11. ⬜ Accesibilidad: foco visible, lectores de pantalla en el chat, contraste.

## P3 · Chat
12. ⬜ Más herramientas para el chat: cambiar color de una serie, añadir/quitar momentos, duplicar la pieza en otro formato, comparar dos empresas.
13. ⬜ El chat debe poder **explicar la fuente de cada cifra** («¿de dónde sale este 79,3?») leyendo el informe de verificación.
14. ⬜ Historial por pieza (guardar la conversación junto a la spec).

## P4 · Visual / cine
15. ⬜ Fondo claro tipo papel (Harris/Caspian) como cuarto tema.
16. ⬜ Modo punto a punto en líneas, banderas al final de cada serie, línea base discontinua.
17. ⬜ Ranking horizontal y pictogramas como tipos nativos; pista de sonido (golpe en cada momento).
18. ⬜ Sankey con comparación trimestre a trimestre (morfado de un Q al siguiente).

## P5 · Calidad y operación
19. ⬜ Una sola suite: `npm test` que corra prueba.mjs, prueba-plantillas, prueba-tablas y prueba-trimestres.
20. ⬜ Copia de seguridad semanal de `catalogo/` y `specs/`; límite de disco de `datos/` (hoy ~gigas por las cachés de la SEC).
21. ⬜ Arranque único: que un solo icono levante el estudio y el actualizador (hoy son dos procesos y pueden duplicar el trabajo).
22. ⬜ Documentar cada cambio de contrato en `CLAUDE.md` (aprendizajes) y en `docs/`.

## Trabajo de noche
- **Quién:** (a) el actualizador 24/7 (`servidor/vivo.mjs`) construye la bolsa entre la 1:00 y las 6:00 sin intervención; (b) una sesión programada de Claude (`rtl-trabajo-de-noche`, 1:07 a. m.) recorre esta lista en orden.
- **Reglas de la sesión de noche:** leer `CLAUDE.md` y esta lista; trabajar de la tarea ⬜ más alta hacia abajo; no tocar `datos/` a mano; correr las pruebas antes de cada commit; nunca borrar trabajo; si algo exige una decisión de David, dejarlo escrito en el diario y seguir con lo siguiente; al terminar, actualizar esta lista (✅/⬜) y escribir el diario con: qué se hizo, rutas, qué debe revisar David, qué quedó fuera.
- **Límite honesto:** corre solo con el PC encendido y la app de Claude abierta.
