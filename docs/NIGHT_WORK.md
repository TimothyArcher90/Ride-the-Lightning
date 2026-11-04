Spanish original: [es/TRABAJO_NOCTURNO.md](es/TRABAJO_NOCTURNO.md)

# Ride the Lightning night work

There are **two** night jobs. The first already runs by itself; the second must be activated once.

## 1) The updater builds the stock-market library (automatic)
`servidor/vivo.mjs` (the 24/7 updater, also embedded in the studio) downloads, **between 1:00 and 6:00**, the US-listed companies still missing from the library, from largest to smallest, pausing between requests and resuming where it left off. In addition, every 4 h it reads the SEC daily index and adds new reports.
- By hand: `node scripts/trimestres.mjs universo [how many] [minutes]`.
- Summary: `node scripts/trimestres.mjs indice` → `datos/trimestres/INDICE.md`.

## 2) Scheduled Claude session that works through the priority list (must be activated)
On 2026-11-03 the permission system **blocked** creating the scheduled task from the working session (a task that runs on its own, commits and pushes). To activate it: ask Claude "create the task rtl-trabajo-de-noche" and approve the permission, or create it from the Claude app (Scheduled tasks) with:
- **Name:** `rtl-trabajo-de-noche` · **Schedule:** every day at 1:07 a.m. (cron `7 1 * * *`, local time).
- **It only runs** while the PC is on and the Claude app is open.
- **Prompt** (kept in Spanish, since that is what the scheduled agent receives; an English gloss follows the block):

```
Eres el trabajo de noche de Ride the Lightning (repo local C:\Users\tante\Projects\Ride-the-Lightning, GitHub TimothyArcher90/Ride-the-Lightning, rama main). David Arango NO usa la terminal: todo lo ejecutas tú. No necesitas pedir confirmación entre pasos (dentro de las reglas de seguridad).

ANTES DE EMPEZAR
1. Lee CLAUDE.md (reglas y aprendizajes), docs\PRIORIDADES.md (la lista viva) y docs\MAPA_DE_DATOS.md.
2. Comprueba que el estudio responde (http://127.0.0.1:5180/) y mira catalogo\actualizaciones.jsonl (últimas 50 líneas) por errores. Si no corre, arráncalo oculto con RTL_SIN_NAVEGADOR=1 (node servidor/estudio.mjs) desde la carpeta del repo.
3. Escribe el avance de la construcción de la bolsa (node scripts/trimestres.mjs indice). El actualizador ya la construye de 1:00 a 6:00: no lances otra en paralelo.

TRABAJO
- Recorre docs\PRIORIDADES.md de la primera tarea ⬜ hacia abajo. Hasta las 6:30 a. m. hora local; una tarea a medias se anota, no se deja rota.
- Exactitud (CLAUDE.md): ninguna cifra a mano; cada dato con fuente; lo que no cuadra no se dibuja; lo que la fuente no desglosa se muestra «sin desglosar». Nunca inventes datos de empresas.
- Tras cada tarea: corre las pruebas que toquen (scripts\prueba.mjs, prueba-tablas.mjs, prueba-plantillas.mjs, prueba-trimestres.mjs), mira los fotogramas si tocaste el motor, y solo entonces commit (con Co-Authored-By de Claude) y git push. Si una prueba falla, arréglalo o revierte; nunca dejes main roto.
- No escribas código por shell con \s, \n, \d en heredocs o node -e (se corrompen): usa Edit/Write.
- No borres trabajo de David (01_RAW, specs, salidas, entradas). No toques datos\ a mano. No gastes dinero ni uses APIs de pago.
- SEC: menos de 10 peticiones por segundo y User-Agent con contacto (servidor/xbrl.mjs ya lo hace).

AL TERMINAR
1. Actualiza docs\PRIORIDADES.md (✅/⬜/🔄) y añade lecciones a CLAUDE.md (Aprendizajes, con fecha).
2. Escribe docs\diagnosticos\AAAA-MM-DD-noche.md: qué hiciste, rutas completas, qué debe revisar David, qué quedó fuera y por qué, cobertura de la bolsa (con trimestres / sin datos).
3. Commit + push final.
4. Último mensaje: EXACTAMENTE 3 bullets cortos en español (qué hiciste, qué revisar, qué quedó fuera).
```

> Path note: in the prompt, `docs\PRIORIDADES.md` and `docs\MAPA_DE_DATOS.md` now live at [ROADMAP.md](ROADMAP.md) and [DATA_MAP.md](DATA_MAP.md) (Spanish originals in `docs/es/`). Update the scheduled task's prompt accordingly when you create it.

**English gloss of the prompt.** You are the Ride the Lightning night job (local repo and GitHub repo as above, branch `main`). The owner does not use the terminal: you run everything yourself, with no need to ask for confirmation between steps (within the safety rules).

*Before starting:*
1. Read `CLAUDE.md` (rules and learnings), the live priority list and the data map.
2. Check that the studio responds at `http://127.0.0.1:5180/` and scan the last 50 lines of `catalogo/actualizaciones.jsonl` for errors. If it is not running, start it hidden with `RTL_SIN_NAVEGADOR=1` (`node servidor/estudio.mjs`) from the repo folder.
3. Write out the library-build progress (`node scripts/trimestres.mjs indice`). The updater already builds the library from 1:00 to 6:00: do not launch a parallel build.

*Work:*
- Go through the priority list from the first pending task downward, until 6:30 a.m. local time; a half-finished task is noted, never left broken.
- Accuracy (`CLAUDE.md`): no hand-typed figures; every dataset has a source; what does not balance is not drawn; what the source does not break down is shown as "sin desglosar"; never invent company data.
- After each task: run the relevant tests (`scripts/prueba.mjs`, `prueba-tablas.mjs`, `prueba-plantillas.mjs`, `prueba-trimestres.mjs`), inspect frames if the engine was touched, and only then commit (with Claude's Co-Authored-By) and `git push`. If a test fails, fix or revert; never leave `main` broken.
- Do not write code through shell heredocs or `node -e` containing `\s`, `\n`, `\d` (they get corrupted): use Edit/Write.
- Never delete the owner's work (`01_RAW`, specs, outputs, inputs). Do not edit `datos/` by hand. Spend no money and use no paid APIs.
- SEC: fewer than 10 requests per second and a User-Agent with contact details (`servidor/xbrl.mjs` already does this).

*When finished:*
1. Update the priority list (done / pending / in progress) and add dated lessons to `CLAUDE.md` (Learnings).
2. Write `docs/diagnosticos/YYYY-MM-DD-noche.md`: what was done, full paths, what the owner should review, what was left out and why, library coverage (with quarters / without data).
3. Final commit + push.
4. The last message is exactly 3 short bullets in Spanish (what was done, what to review, what was left out).

**Honest limit:** it only runs while the PC is on and the Claude app is open.
