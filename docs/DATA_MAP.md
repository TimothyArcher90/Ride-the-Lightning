Spanish original: [es/MAPA_DE_DATOS.md](es/MAPA_DE_DATOS.md)

# Data map: where everything lives and how the studio uses it

There are **three families** of data. All three enter through step 1 of the studio ("¿Qué quieres contar?", "What do you want to tell?") and all three go through the same accuracy rules (mandatory source, every figure comes from its row, verification report).

| Family | What it is | Where it lives on disk | How it appears in the studio |
|---|---|---|---|
| **Markets and economy** | 812 complete historical series in the catalog (Bitcoin, gold, oil, inflation, rates, currencies, Poland, 45 countries…), with live data | `datos/biblioteca/*.csv` + `.meta.json` · catalog in `catalogo/series.json` | "Algo que cambia en el tiempo" ("Something that changes over time") → search box and categories |
| **Companies (SEC)** | Quarterly income statement for the whole US stock market: Sankey, waterfall and series (revenue, profit, margin) | `datos/trimestres/<TICKER>/…` · list in `datos/trimestres/_universo.json` · featured companies in `catalogo/empresas.json` | "Cómo gana y gasta dinero una empresa" ("How a company earns and spends money"; company + quarter) and, under "Algo que cambia en el tiempo", "Resultados de una empresa" ("A company's results") |
| **Your files** | Your own Excel, CSV, ODS, JSON; flow or category tables | `entradas/` (not pushed to GitHub) · templates in `ejemplos/` | "Tu tabla" ("Your table"; detected automatically from the columns) |

## How they connect
- Every dataset reaches the piece as a **spec** (`specs/*.json`): `datos` (file + source) and `capas` (layers). The spec is the contract; the studio, the chat and the MCP server all read and write it the same way.
- **Editing:** (1) the studio steps; (2) the **chat** (button at bottom right; changes the open piece live); (3) "Modo experto" ("Expert mode"; the spec as JSON). The chat uses the same MCP tools as any agent.
- **Updating:** market series every 15 min–24 h (depending on the source); companies via the **SEC daily index** (every 4 h); the full stock market is built overnight (1:00–6:00).
- **Checking status:** `GET /api/datos` (counts), `datos/trimestres/INDICE.md`, `catalogo/actualizaciones.jsonl` (change log).

## Rules that apply to all three
1. No source, no compile. 2. No figure typed by hand in any text. 3. What does not balance is not drawn (and the report says where). 4. What the source does not break down is shown as "sin desglosar" ("not broken down"), never invented. 5. Licenses are flagged (Yahoo and Coin Metrics: non-commercial; SEC: public domain).
