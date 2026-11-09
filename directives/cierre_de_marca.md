# Cierre de marca (logo animado de MacroWise): cuándo SÍ y cuándo NO

**Regla permanente (David, 2026-11-09): el logo es OPT-IN. Ninguna gráfica lo lleva por defecto.**

Ride the Lightning produce gráficas que pueden ser (a) el video completo de un canal de MacroWise o (b) una pieza que otro agente, otro producto o un video largo usa como componente. El logo animado solo tiene sentido en (a). Poner el logo al final de una gráfica que va en medio de un video largo es un ERROR.

## Cuándo pedir el cierre (`cierre: true`)
- La gráfica ES el video individual que se publica (p. ej. el M2 interanual para redes de MacroWise) y David lo pidió o el encargo dice «con logo / cierre de marca».
- Cómo pedirlo: `cierre: true` en la spec · casilla «Cierre con el logo de MacroWise» en el estudio · `--cierre` en `node servidor/cli.mjs render` · parámetro `cierre: true` en `generar_pieza` (MCP).

## Cuándo NO pedirlo (por defecto)
- La gráfica se insertará en un video más largo (un reel, un podcast, una presentación, un episodio).
- Otro agente o producto llama a Ride the Lightning para obtener una gráfica/ProRes.
- Nadie pidió logo. Ante la duda: NO ponerlo y preguntar si el destino es un video individual de MacroWise.

## Qué hace cuando se pide
1. `compilar.mjs::conCierre`: la gráfica final queda quieta `hold` s (5) — las capas que duraban hasta el final se prolongan.
2. `render.mjs::anexarCierre`: fundido a negro (0,8 s) y entra el cierre aprobado `marca/cierre/macrowise-cierre-h.mp4` (horizontal) o `-v.mp4` (vertical, encajado en la zona segura de reels). Fondo negro mate total. El render FALLA si falta el video de cierre (se regenera con `node scripts/construir-cierre.mjs`).
3. El ProRes 4444 con alfa NUNCA lleva cierre (se monta en el editor).

## Verificación obligatoria al usarlo
Barrer el MP4 final (`node scripts/barrido-video.mjs <mp4> ...`), horizontal y vertical, y comprobar el final con el logo sobre negro mate (ver `prueba-cierre.mjs`).
