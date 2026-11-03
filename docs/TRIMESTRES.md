# Biblioteca de trimestres (diagrama de flujo por Q)

Cubre **toda la bolsa de EE. UU. (Nasdaq, NYSE, CBOE: ~6.300 empresas operativas)**. Las **16 destacadas** (`catalogo/empresas.json`) tienen **todos los trimestres desde 2009** (el año en que la SEC empezó a exigir datos estructurados); las demás se bajan **al elegirlas** (10–20 s) o **de noche**, con los **últimos 3 años**. Cada trimestre queda guardado y listo para animarse: un **Sankey** («de dónde viene y adónde va el dinero») y una **cascada** («qué sumó y qué restó»). La cascada existe incluso en trimestres con pérdida, donde el Sankey no se puede dibujar.

## De dónde sale cada número
- **Fuente única:** SEC EDGAR, API pública «XBRL company facts» (`data.sec.gov`). Son los números que cada empresa declara en sus reportes oficiales 10-Q y 10-K. Dominio público, sin llaves ni cuentas.
- **Cada cifra es una de dos cosas:** un dato reportado (se guarda con su concepto XBRL, p. ej. `OperatingIncomeLoss`) o una resta/suma exacta de datos reportados. Las derivadas se listan en el `.meta.json` de cada trimestre:
  - Utilidad bruta = ingresos − costo de ventas.
  - Gastos operativos = utilidad bruta − utilidad operativa.
  - Otros (no operativos) = utilidad neta + impuestos − utilidad operativa.
  - **Q4 no se reporta aparte:** se calcula como año completo − acumulado de 9 meses (o − Q1−Q2−Q3). Queda marcado (`q4Calculado`).
- **El diagrama cuadra por construcción**, y el compilador lo vuelve a comprobar: si algo no cuadra (>5 %) no se dibuja; entre 0,5 % y 5 % se dibuja y se avisa (redondeo de la fuente).
- **Lo que la fuente resumida no desglosa**, no se inventa. Ejemplo real: Amazon etiqueta sus gastos de logística y de tecnología con conceptos propios que la API resumida no incluye; salen juntos como «Gastos operativos sin desglosar» (82 % de sus gastos operativos) y la pieza lo avisa.

## Dónde vive
```
datos/trimestres/<TICKER>/indice.json                 lista de trimestres, último reporte visto, omitidos
datos/trimestres/<TICKER>/<AAAA-MM-DD>.csv            flujos del trimestre (origen, destino, valor, tipo) en US$
datos/trimestres/<TICKER>/<AAAA-MM-DD>.puente.csv     la cascada del mismo trimestre
datos/trimestres/<TICKER>/<…>.csv.meta.json           procedencia, conceptos XBRL usados, derivaciones, notas, sha256
datos/trimestres/INDICE.md                            resumen de lo que hay (se regenera)
catalogo/empresas.json                                empresas vigiladas (ticker, CIK, nombre)
```
`datos/` no se sube a GitHub (se reconstruye en minutos con un comando).

## Cómo se usa
- **Estudio:** paso 1 → «Cómo gana y gasta dinero una empresa» → elige empresa y trimestre. Todo lo demás se resuelve solo.
- **Reconstruir la biblioteca:** `node scripts/trimestres.mjs construir` (todas) o `… construir AMZN AAPL`.
- **Agregar una empresa:** añade `{ticker, cik, nombre}` a `catalogo/empresas.json` (el CIK está en https://www.sec.gov/search-filings) y corre `construir TICKER`.
- **Probar:** `node scripts/prueba-trimestres.mjs` (cada trimestre compila y cuadra, piezas sin textos pisados, y Amazon Q3 FY2026 coincide con su 10-Q) y `node scripts/prueba-tablas.mjs` (reglas de exactitud).

## El agente que vigila los reportes nuevos
Dentro del actualizador 24/7 (`servidor/vivo.mjs`), **cada 4 horas** pregunta a la SEC si alguna empresa de la biblioteca publicó un 10-Q/10-K nuevo (una petición pequeña por empresa). Si sí:
1. Reconstruye sus trimestres (suma el nuevo).
2. Guarda la pieza lista en `specs/trimestre-<TICKER>-<AÑO>-<Q>.json`.
3. Avisa en el estudio («Amazon publicó su Q4 FY2026…») y deja un **borrador en video** en `salidas/`.
4. Si la SEC ya publicó el reporte pero sus datos estructurados aún no incluyen el trimestre (puede tardar horas), lo reintenta en el siguiente ciclo.

Se puede lanzar a mano: `node scripts/trimestres.mjs vigilar`. **Límite honesto:** el agente vive dentro del actualizador, así que solo trabaja con el PC encendido; los reportes se recogen en cuanto el PC vuelva a estar activo (la SEC los conserva).

## Límites conocidos
- **Sin desglose por producto o segmento** (p. ej. AWS vs. tiendas): la API resumida no lo trae. El detalle fino (líneas propias de la empresa y segmentos) sale del archivo XBRL completo de cada reporte, que está en `www.sec.gov`; la SEC exige identificarse con un contacto real para ese acceso, y eso no está activado.
- **Trimestres con pérdida** (operativa o neta): Sankey no, cascada sí. Un flujo no puede ser negativo.
- **Empresas con estados financieros distintos** (bancos, aseguradoras, REITs) no encajan con esta estructura; no están en la lista.
- **Dólares nominales**, sin ajustar por inflación.
- Se descarta cualquier trimestre sin ingresos, utilidad operativa, impuestos o utilidad neta reportados (Intel tiene 14 por esta causa; aparecen en `omitidos` del índice).

## Tablas propias
El mismo Sankey, anillo y cascada sirven para **cualquier tabla** tuya (Excel o CSV). Plantillas en `ejemplos/` (cifras de demostración, rotuladas como tales). Reglas: flujos con valores positivos que cuadren por nodo; en la cascada, los subtotales marcados `total` deben coincidir con la suma anterior; siempre con fuente.

## Actualización (2026-11-03, noche): detalle fino y toda la bolsa
- **Detalle fino del último año** (4 trimestres por empresa): se lee el archivo XBRL completo del reporte (`www.sec.gov`, con el contacto autorizado por David) y se traen (a) las **líneas de gasto propias de la empresa** según su archivo de cálculo (Amazon: Logística 30,0 y Tecnología e infraestructura 34,8) y (b) los **ingresos por producto o segmento** (Amazon: Tiendas online 68,5, AWS 46,0…). Cada desglose se comprueba: si no suma lo que la empresa reporta (±0,5 %), se descarta y se usa el resumen. Prioridad de ejes: producto/servicio > segmentos de negocio > otros > geografía.
- **Los trimestres anteriores al último año** salen con el resumen oficial (sin las líneas propias): se avisa en cada pieza.
- **Q4** con detalle fino = año completo (10-K) − acumulado de 9 meses (10-Q del Q3).
- **Series de tiempo por empresa** (`datos/trimestres/<T>/serie.csv`): ingresos, utilidad operativa, utilidad neta y margen operativo por trimestre, para las plantillas de líneas/comparar/panel. Una sola empresa por pieza.
- **Agente vigilante de toda la biblioteca:** lee el índice diario de la SEC (hoy y 2 días antes: 3 peticiones para toda la bolsa) y actualiza solo a quien presentó un 10-Q/10-K. Si el reporte ya está pero los datos estructurados aún no, queda «pendiente» hasta 3 días.
- **Trabajo de noche:** el actualizador construye la bolsa de 1:00 a 6:00 (`node scripts/trimestres.mjs universo` a mano). Disco: solo las destacadas guardan el JSON crudo de la SEC; las demás guardan únicamente CSV, metadatos y una caché mínima del XBRL.
- **Fuera de alcance hoy:** bancos y aseguradoras (estructura distinta), fondos cerrados/ETF/SPAC (se excluyen de la lista), empresas sin ingresos y costos reportados como industria o servicios.
