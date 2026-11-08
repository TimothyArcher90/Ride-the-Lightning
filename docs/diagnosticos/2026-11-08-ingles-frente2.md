# 2026-11-08 · English version, front 2 (studio interface)

Status log in case the session is cut. Owner of this front: `web/*`, `servidor/estudio.mjs`, `servidor/chat.mjs`, `servidor/cli.mjs`, `servidor/mcp.mjs`, `scripts/prueba-ui-idioma.mjs`.

## Done
- `web/i18n.js`: es/en dictionary (rows `D(key, es, en)`), `tr`, `tt` (template/camera texts by id), `num`, `setL`, `aplicarDOM`. Default English unless the browser is Spanish; saved in `localStorage` (`rtl_lang`). The same file is imported by the server for `srv_*` messages.
- `web/estudio.html`: EN | ES switch in the header; static texts via `data-i*` attributes. The partial stash (`english-ui-partial-agent-work`) was used only as a reference for the header markup/CSS (not popped, not dropped).
- `web/estudio.js`: every visible string through `T()`; every `/api` call carries `idioma`; the compiled plan gets `idioma`; switching language redraws the step and regenerates the piece.
- `servidor/estudio.mjs`: reads `idioma` on every route, passes it to `fichaPais`, `listarPaises`, `indicadoresPais`, `rankingPais`, `analizar`, `salud`, `licencia`, `generar`, `compilar` (the other fronts already accept it); messages through `tr(..., lang)`.
- `servidor/chat.mjs` (English system prompt + language line, `RTL_LANG` for the MCP child), `servidor/cli.mjs` (`--lang=` / `RTL_LANG`), `servidor/mcp.mjs` (English tool descriptions, messages, `idioma` param).

## Pending / to verify
- See the final report of the session.

## Final state
- `node scripts/prueba-ui-idioma.mjs` passes (471 keys per language). Verified on a second instance (port 5199, now closed) at 1280 and 375 px: steps 1-4, EN<->ES switch, persistence after reload, chat panel.
- Leaks still in English mode (belong to other fronts): visualizer reasons (`servidor/visualizador.mjs`, "★ Recommended: ..."), the LICENCIA warning from `compilar`, catalog source names ("API de gráficos, no oficial"), moment explanations only partly.
- MCP zod `.describe()` texts of two parameters remain Spanish.
