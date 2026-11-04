# Trabajo de noche de Ride the Lightning

Hay **dos** trabajos de noche. El primero ya funciona solo; el segundo hay que activarlo una vez.

## 1) El actualizador construye la bolsa (automático)
`servidor/vivo.mjs` (el actualizador 24/7, también dentro del estudio) entre la **1:00 y las 6:00** baja a la biblioteca las empresas de la bolsa de EE. UU. que faltan, de las más grandes a las más pequeñas, con pausa entre peticiones, y retoma donde quedó. Además, cada 4 h lee el índice diario de la SEC y suma los reportes nuevos.
- A mano: `node scripts/trimestres.mjs universo [cuántas] [minutos]`.
- Resumen: `node scripts/trimestres.mjs indice` → `datos/trimestres/INDICE.md`.

## 2) Sesión programada de Claude que avanza la lista de prioridades (hay que activarla)
El 2026-11-03 el sistema de permisos **bloqueó** crear la tarea programada desde la sesión de trabajo (una tarea que corre sola, hace commit y push). Para activarla: pídele a Claude «crea la tarea rtl-trabajo-de-noche» y aprueba el permiso, o créala desde la app de Claude (Tareas programadas) con:
- **Nombre:** `rtl-trabajo-de-noche` · **Horario:** todos los días a la 1:07 a. m. (cron `7 1 * * *`, hora local).
- **Corre solo** con el PC encendido y la app de Claude abierta.
- **Prompt:**

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
