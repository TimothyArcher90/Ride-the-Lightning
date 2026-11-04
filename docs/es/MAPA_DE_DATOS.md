# Mapa de datos: dónde está cada cosa y cómo se usa en el estudio

Hay **tres familias** de datos. Las tres entran por el paso 1 del estudio («¿Qué quieres contar?») y las tres pasan por las mismas reglas de exactitud (fuente obligatoria, cada cifra sale de su fila, informe de verificación).

| Familia | Qué es | Dónde vive en disco | Cómo se ve en el estudio |
|---|---|---|---|
| **Mercados y economía** | 172 series históricas completas (Bitcoin, oro, petróleo, inflación, tasas, divisas, Polonia…), con datos vivos | `datos/biblioteca/*.csv` + `.meta.json` · catálogo en `catalogo/series.json` | «Algo que cambia en el tiempo» → buscador y categorías |
| **Empresas (SEC)** | Estado de resultados por trimestre de toda la bolsa de EE. UU.: Sankey, cascada y series (ingresos, utilidad, margen) | `datos/trimestres/<TICKER>/…` · lista en `datos/trimestres/_universo.json` · destacadas en `catalogo/empresas.json` | «Cómo gana y gasta dinero una empresa» (empresa + trimestre) y, en «Algo que cambia en el tiempo», «Resultados de una empresa» |
| **Tus archivos** | Excel, CSV, ODS, JSON propios; tablas de flujos o categorías | `entradas/` (no se sube a GitHub) · plantillas en `ejemplos/` | «Tu tabla» (se detecta sola por las columnas) |

## Cómo se conectan
- Todo dato llega a la pieza como una **spec** (`specs/*.json`): `datos` (archivo + fuente) y `capas`. La spec es el contrato; el estudio, el chat y el MCP la leen y la escriben igual.
- **Editar:** (1) los pasos del estudio; (2) el **chat** (botón abajo a la derecha; cambia la pieza abierta en vivo); (3) «Modo experto» (la spec en JSON). El chat usa las mismas herramientas MCP que cualquier agente.
- **Actualización:** las series de mercado cada 15 min–24 h (según la fuente); las empresas por el **índice diario de la SEC** (cada 4 h); la bolsa completa se construye de noche (1:00–6:00).
- **Ver el estado:** `GET /api/datos` (conteos), `datos/trimestres/INDICE.md`, `catalogo/actualizaciones.jsonl` (bitácora).

## Reglas que valen para las tres
1. Sin fuente no compila. 2. Ninguna cifra a mano en un texto. 3. Lo que no cuadra no se dibuja (y dice dónde). 4. Lo que la fuente no desglosa se muestra como «sin desglosar», nunca se inventa. 5. Licencias avisadas (Yahoo y Coin Metrics: no comercial; SEC: dominio público).
