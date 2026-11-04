// Datos por país: catálogo de series `pais_<ISO3>_<indicador>` (Banco Mundial WDI y FMI WEO), ficha con el ÚLTIMO dato real
// de cada indicador y lista de ids para comparar países. Nada se interpola ni se inventa: sin dato → valor null + motivo.
// La descarga completa de cada serie sigue siendo bajo demanda (catalogo.mjs → descargar); la ficha usa un caché ligero
// (datos/paises-ultimos.json) llenado con ~14 peticiones por lotes (todos los países a la vez).
import fs from 'node:fs';
import path from 'node:path';
import {RAIZ} from './compilar.mjs';
import {leerCatalogo, rutaVerificado} from './catalogo.mjs';

export const rutaPaises = path.join(RAIZ, 'catalogo', 'paises.json');          // generado por scripts/construir-paises.mjs
const rutaCache = path.join(RAIZ, 'datos', 'paises-ultimos.json');
const TTL_DIAS = 7;

// ── Países (nombre en español, región) ──────────────────────────────────────────────────────────────────────────
const P = [
  ['USA', 'Estados Unidos', 'Norteamérica'], ['CAN', 'Canadá', 'Norteamérica'], ['MEX', 'México', 'Latinoamérica y Caribe'],
  ['CHN', 'China', 'Asia'], ['JPN', 'Japón', 'Asia'], ['IND', 'India', 'Asia'], ['KOR', 'Corea del Sur', 'Asia'], ['IDN', 'Indonesia', 'Asia'], ['SGP', 'Singapur', 'Asia'],
  ['VNM', 'Vietnam', 'Asia'], ['THA', 'Tailandia', 'Asia'], ['PHL', 'Filipinas', 'Asia'],
  ['DEU', 'Alemania', 'Europa'], ['GBR', 'Reino Unido', 'Europa'], ['FRA', 'Francia', 'Europa'], ['ITA', 'Italia', 'Europa'], ['ESP', 'España', 'Europa'], ['RUS', 'Rusia', 'Europa'],
  ['POL', 'Polonia', 'Europa'], ['NLD', 'Países Bajos', 'Europa'], ['CHE', 'Suiza', 'Europa'], ['IRL', 'Irlanda', 'Europa'], ['SWE', 'Suecia', 'Europa'], ['TUR', 'Turquía', 'Europa y Asia central'],
  ['AUS', 'Australia', 'Oceanía'],
  ['SAU', 'Arabia Saudita', 'Oriente Medio y norte de África'], ['ISR', 'Israel', 'Oriente Medio y norte de África'], ['ARE', 'Emiratos Árabes Unidos', 'Oriente Medio y norte de África'], ['EGY', 'Egipto', 'Oriente Medio y norte de África'],
  ['ZAF', 'Sudáfrica', 'África subsahariana'], ['NGA', 'Nigeria', 'África subsahariana'],
  ['COL', 'Colombia', 'Latinoamérica y Caribe'], ['BRA', 'Brasil', 'Latinoamérica y Caribe'], ['ARG', 'Argentina', 'Latinoamérica y Caribe'], ['CHL', 'Chile', 'Latinoamérica y Caribe'],
  ['PER', 'Perú', 'Latinoamérica y Caribe'], ['ECU', 'Ecuador', 'Latinoamérica y Caribe'], ['URY', 'Uruguay', 'Latinoamérica y Caribe'], ['PAN', 'Panamá', 'Latinoamérica y Caribe'],
  ['CRI', 'Costa Rica', 'Latinoamérica y Caribe'], ['VEN', 'Venezuela', 'Latinoamérica y Caribe'], ['BOL', 'Bolivia', 'Latinoamérica y Caribe'], ['PRY', 'Paraguay', 'Latinoamérica y Caribe'],
  ['DOM', 'República Dominicana', 'Latinoamérica y Caribe'], ['GTM', 'Guatemala', 'Latinoamérica y Caribe'],
  // Ampliación (2026-11-04): toda Latinoamérica continental + Cuba/Jamaica, resto de Europa occidental/central, Asia, Oriente Medio y África grandes
  ['HND', 'Honduras', 'Latinoamérica y Caribe'], ['SLV', 'El Salvador', 'Latinoamérica y Caribe'], ['NIC', 'Nicaragua', 'Latinoamérica y Caribe'], ['CUB', 'Cuba', 'Latinoamérica y Caribe'], ['JAM', 'Jamaica', 'Latinoamérica y Caribe'],
  ['PRT', 'Portugal', 'Europa'], ['BEL', 'Bélgica', 'Europa'], ['AUT', 'Austria', 'Europa'], ['DNK', 'Dinamarca', 'Europa'], ['NOR', 'Noruega', 'Europa'], ['FIN', 'Finlandia', 'Europa'], ['GRC', 'Grecia', 'Europa'],
  ['CZE', 'Chequia', 'Europa'], ['HUN', 'Hungría', 'Europa'], ['ROU', 'Rumania', 'Europa'], ['UKR', 'Ucrania', 'Europa'],
  ['PAK', 'Pakistán', 'Asia'], ['BGD', 'Bangladés', 'Asia'], ['MYS', 'Malasia', 'Asia'],
  ['IRN', 'Irán', 'Oriente Medio y norte de África'], ['IRQ', 'Irak', 'Oriente Medio y norte de África'], ['QAT', 'Catar', 'Oriente Medio y norte de África'], ['MAR', 'Marruecos', 'Oriente Medio y norte de África'],
  ['KEN', 'Kenia', 'África subsahariana'], ['ETH', 'Etiopía', 'África subsahariana'], ['GHA', 'Ghana', 'África subsahariana'],
  ['NZL', 'Nueva Zelanda', 'Oceanía'],
];
export const PAISES = P.map(([iso3, nombre, region]) => ({iso3, nombre, region}));

// ── Indicadores. fmt: usd | usdpc | pob | pct | pctpib | anios | indice ─────────────────────────────────────────────
const WB = 'worldbank', IMF = 'imf';
export const INDICADORES = [
  {clave: 'pib', nombre: 'PIB (US$ corrientes)', unidad: 'US$ corrientes', tema: 'Economía', ad: WB, cod: 'NY.GDP.MKTP.CD', fmt: 'usd'},
  {clave: 'pib_pc', nombre: 'PIB per cápita (US$ corrientes)', unidad: 'US$ corrientes por habitante', tema: 'Economía', ad: WB, cod: 'NY.GDP.PCAP.CD', fmt: 'usdpc'},
  {clave: 'crec_pib', nombre: 'Crecimiento real del PIB', unidad: '% anual', tema: 'Economía', ad: WB, cod: 'NY.GDP.MKTP.KD.ZG', fmt: 'pct', sufijo: 'anual'},
  {clave: 'inflacion', nombre: 'Inflación (IPC, variación anual)', unidad: '% anual', tema: 'Precios', ad: WB, cod: 'FP.CPI.TOTL.ZG', fmt: 'pct', sufijo: 'anual'},
  {clave: 'desempleo', nombre: 'Desempleo (estimación modelada OIT)', unidad: '% de la fuerza laboral', tema: 'Empleo', ad: WB, cod: 'SL.UEM.TOTL.ZS', fmt: 'pct', sufijo: 'de la fuerza laboral'},
  {clave: 'poblacion', nombre: 'Población total', unidad: 'Personas', tema: 'Población', ad: WB, cod: 'SP.POP.TOTL', fmt: 'pob'},
  {clave: 'esperanza_vida', nombre: 'Esperanza de vida al nacer', unidad: 'Años', tema: 'Población', ad: WB, cod: 'SP.DYN.LE00.IN', fmt: 'anios'},
  {clave: 'gini', nombre: 'Índice de Gini (desigualdad del ingreso)', unidad: 'Índice 0–100 (100 = máxima desigualdad)', tema: 'Población', ad: WB, cod: 'SI.POV.GINI', fmt: 'indice'},
  {clave: 'cuenta_corriente', nombre: 'Cuenta corriente (balanza de pagos)', unidad: '% del PIB', tema: 'Sector externo', ad: WB, cod: 'BN.CAB.XOKA.GD.ZS', fmt: 'pct', sufijo: 'del PIB'},
  {clave: 'reservas', nombre: 'Reservas internacionales (incluye oro)', unidad: 'US$ corrientes', tema: 'Sector externo', ad: WB, cod: 'FI.RES.TOTL.CD', fmt: 'usd'},
  {clave: 'exportaciones', nombre: 'Exportaciones de bienes y servicios', unidad: '% del PIB', tema: 'Sector externo', ad: WB, cod: 'NE.EXP.GNFS.ZS', fmt: 'pct', sufijo: 'del PIB'},
  {clave: 'ied', nombre: 'Inversión extranjera directa, entradas netas', unidad: '% del PIB', tema: 'Sector externo', ad: WB, cod: 'BX.KLT.DINV.WD.GD.ZS', fmt: 'pct', sufijo: 'del PIB'},
  // ── Ampliación (2026-11-04): energía, clima, salud, educación, comercio, deuda externa, tasas, tipo de cambio y estructura. Todo Banco Mundial (WDI). ──
  {clave: 'energia_pc', nombre: 'Uso de energía por habitante', unidad: 'kg de petróleo equivalente por habitante', tema: 'Energía', ad: WB, cod: 'EG.USE.PCAP.KG.OE', fmt: 'num', dec: 0, sufijo: 'kg de petróleo equivalente por habitante'},
  {clave: 'electricidad_pc', nombre: 'Consumo de electricidad por habitante', unidad: 'kWh por habitante', tema: 'Energía', ad: WB, cod: 'EG.USE.ELEC.KH.PC', fmt: 'num', dec: 0, sufijo: 'kWh por habitante'},
  {clave: 'renovables_energia', nombre: 'Energía renovable en el consumo final de energía', unidad: '% del consumo final', tema: 'Energía', ad: WB, cod: 'EG.FEC.RNEW.ZS', fmt: 'pct', sufijo: 'del consumo final'},
  {clave: 'renovables_electricidad', nombre: 'Electricidad renovable (% del total generado)', unidad: '% de la generación', tema: 'Energía', ad: WB, cod: 'EG.ELC.RNEW.ZS', fmt: 'pct', sufijo: 'de la generación'},
  {clave: 'acceso_electricidad', nombre: 'Acceso a la electricidad', unidad: '% de la población', tema: 'Energía', ad: WB, cod: 'EG.ELC.ACCS.ZS', fmt: 'pct', sufijo: 'de la población'},
  {clave: 'co2_total', nombre: 'Emisiones de CO₂ (sin uso del suelo)', unidad: 'Mt de CO₂', tema: 'Clima', ad: WB, cod: 'EN.GHG.CO2.MT.CE.AR5', fmt: 'num', sufijo: 'Mt de CO₂'},
  {clave: 'co2_pc', nombre: 'Emisiones de CO₂ por habitante (sin uso del suelo)', unidad: 't de CO₂ por habitante', tema: 'Clima', ad: WB, cod: 'EN.GHG.CO2.PC.CE.AR5', fmt: 'num', dec: 1, sufijo: 't de CO₂ por habitante'},
  {clave: 'ghg_total', nombre: 'Emisiones totales de gases de efecto invernadero (sin uso del suelo)', unidad: 'Mt de CO₂ equivalente', tema: 'Clima', ad: WB, cod: 'EN.GHG.ALL.MT.CE.AR5', fmt: 'num', sufijo: 'Mt de CO₂ equivalente'},
  {clave: 'gasto_salud', nombre: 'Gasto corriente en salud', unidad: '% del PIB', tema: 'Salud', ad: WB, cod: 'SH.XPD.CHEX.GD.ZS', fmt: 'pct', sufijo: 'del PIB'},
  {clave: 'gasto_salud_pc', nombre: 'Gasto corriente en salud por habitante', unidad: 'US$ corrientes por habitante', tema: 'Salud', ad: WB, cod: 'SH.XPD.CHEX.PC.CD', fmt: 'usdpc'},
  {clave: 'mortalidad_infantil', nombre: 'Mortalidad infantil (menores de 1 año)', unidad: 'Por 1.000 nacidos vivos', tema: 'Salud', ad: WB, cod: 'SP.DYN.IMRT.IN', fmt: 'num', dec: 1, sufijo: 'por 1.000 nacidos vivos'},
  {clave: 'mortalidad_menores5', nombre: 'Mortalidad de menores de 5 años', unidad: 'Por 1.000 nacidos vivos', tema: 'Salud', ad: WB, cod: 'SH.DYN.MORT', fmt: 'num', dec: 1, sufijo: 'por 1.000 nacidos vivos'},
  {clave: 'medicos', nombre: 'Médicos', unidad: 'Por 1.000 habitantes', tema: 'Salud', ad: WB, cod: 'SH.MED.PHYS.ZS', fmt: 'num', dec: 2, sufijo: 'por 1.000 habitantes'},
  {clave: 'fertilidad', nombre: 'Tasa de fertilidad', unidad: 'Hijos por mujer', tema: 'Población', ad: WB, cod: 'SP.DYN.TFRT.IN', fmt: 'num', dec: 2, sufijo: 'hijos por mujer'},
  {clave: 'crec_poblacion', nombre: 'Crecimiento de la población', unidad: '% anual', tema: 'Población', ad: WB, cod: 'SP.POP.GROW', fmt: 'pct', sufijo: 'anual'},
  {clave: 'urbanizacion', nombre: 'Población urbana', unidad: '% de la población total', tema: 'Población', ad: WB, cod: 'SP.URB.TOTL.IN.ZS', fmt: 'pct', sufijo: 'de la población'},
  {clave: 'gasto_educacion', nombre: 'Gasto del gobierno en educación', unidad: '% del PIB', tema: 'Educación', ad: WB, cod: 'SE.XPD.TOTL.GD.ZS', fmt: 'pct', sufijo: 'del PIB'},
  {clave: 'matricula_secundaria', nombre: 'Matrícula en secundaria (tasa bruta)', unidad: '% bruto', tema: 'Educación', ad: WB, cod: 'SE.SEC.ENRR', fmt: 'pct', sufijo: 'bruto'},
  {clave: 'matricula_terciaria', nombre: 'Matrícula en educación superior (tasa bruta)', unidad: '% bruto', tema: 'Educación', ad: WB, cod: 'SE.TER.ENRR', fmt: 'pct', sufijo: 'bruto'},
  {clave: 'alfabetismo', nombre: 'Alfabetismo de adultos (15+)', unidad: '% de la población de 15+', tema: 'Educación', ad: WB, cod: 'SE.ADT.LITR.ZS', fmt: 'pct', sufijo: 'de los adultos'},
  {clave: 'importaciones', nombre: 'Importaciones de bienes y servicios', unidad: '% del PIB', tema: 'Comercio', ad: WB, cod: 'NE.IMP.GNFS.ZS', fmt: 'pct', sufijo: 'del PIB'},
  {clave: 'apertura_comercial', nombre: 'Comercio total (exportaciones + importaciones)', unidad: '% del PIB', tema: 'Comercio', ad: WB, cod: 'NE.TRD.GNFS.ZS', fmt: 'pct', sufijo: 'del PIB'},
  {clave: 'exp_mercancias', nombre: 'Exportaciones de mercancías', unidad: 'US$ corrientes', tema: 'Comercio', ad: WB, cod: 'TX.VAL.MRCH.CD.WT', fmt: 'usd'},
  {clave: 'imp_mercancias', nombre: 'Importaciones de mercancías', unidad: 'US$ corrientes', tema: 'Comercio', ad: WB, cod: 'TM.VAL.MRCH.CD.WT', fmt: 'usd'},
  {clave: 'remesas', nombre: 'Remesas recibidas', unidad: '% del PIB', tema: 'Sector externo', ad: WB, cod: 'BX.TRF.PWKR.DT.GD.ZS', fmt: 'pct', sufijo: 'del PIB'},
  {clave: 'deuda_externa', nombre: 'Deuda externa total (stock)', unidad: 'US$ corrientes', tema: 'Deuda externa', ad: WB, cod: 'DT.DOD.DECT.CD', fmt: 'usd'},
  {clave: 'deuda_externa_ingreso', nombre: 'Deuda externa (stock) / ingreso nacional bruto', unidad: '% del INB', tema: 'Deuda externa', ad: WB, cod: 'DT.DOD.DECT.GN.ZS', fmt: 'pct', sufijo: 'del INB'},
  {clave: 'servicio_deuda', nombre: 'Servicio de la deuda externa', unidad: '% de las exportaciones de bienes, servicios e ingreso primario', tema: 'Deuda externa', ad: WB, cod: 'DT.TDS.DECT.EX.ZS', fmt: 'pct', sufijo: 'de las exportaciones'},
  {clave: 'tasa_real', nombre: 'Tasa de interés real', unidad: '% anual', tema: 'Tasas de interés', ad: WB, cod: 'FR.INR.RINR', fmt: 'pct', sufijo: 'anual'},
  {clave: 'tasa_prestamos', nombre: 'Tasa de interés de los préstamos', unidad: '% anual', tema: 'Tasas de interés', ad: WB, cod: 'FR.INR.LEND', fmt: 'pct', sufijo: 'anual'},
  {clave: 'tasa_depositos', nombre: 'Tasa de interés de los depósitos', unidad: '% anual', tema: 'Tasas de interés', ad: WB, cod: 'FR.INR.DPST', fmt: 'pct', sufijo: 'anual'},
  {clave: 'tipo_cambio', nombre: 'Tipo de cambio oficial (moneda local por US$, promedio del periodo)', unidad: 'Moneda local por US$', tema: 'Tipo de cambio', ad: WB, cod: 'PA.NUS.FCRF', fmt: 'num', sufijo: 'por US$'},
  {clave: 'tipo_cambio_real', nombre: 'Tipo de cambio efectivo real (índice)', unidad: 'Índice (base en la fuente)', tema: 'Tipo de cambio', ad: WB, cod: 'PX.REX.REER', fmt: 'indice'},
  {clave: 'ppa', nombre: 'Factor de conversión de paridad de poder adquisitivo (PPA)', unidad: 'Moneda local por US$ internacional', tema: 'Tipo de cambio', ad: WB, cod: 'PA.NUS.PPP', fmt: 'num', sufijo: 'por US$ internacional'},
  {clave: 'part_laboral', nombre: 'Participación en la fuerza laboral (15+)', unidad: '% de la población de 15+', tema: 'Empleo', ad: WB, cod: 'SL.TLF.CACT.ZS', fmt: 'pct', sufijo: 'de la población de 15+'},
  {clave: 'desempleo_juvenil', nombre: 'Desempleo juvenil (15-24, estimación modelada OIT)', unidad: '% de la fuerza laboral de 15-24', tema: 'Empleo', ad: WB, cod: 'SL.UEM.1524.ZS', fmt: 'pct', sufijo: 'de la fuerza laboral joven'},
  {clave: 'valor_industria', nombre: 'Industria (valor agregado)', unidad: '% del PIB', tema: 'Estructura económica', ad: WB, cod: 'NV.IND.TOTL.ZS', fmt: 'pct', sufijo: 'del PIB'},
  {clave: 'valor_agro', nombre: 'Agricultura (valor agregado)', unidad: '% del PIB', tema: 'Estructura económica', ad: WB, cod: 'NV.AGR.TOTL.ZS', fmt: 'pct', sufijo: 'del PIB'},
  {clave: 'valor_servicios', nombre: 'Servicios (valor agregado)', unidad: '% del PIB', tema: 'Estructura económica', ad: WB, cod: 'NV.SRV.TOTL.ZS', fmt: 'pct', sufijo: 'del PIB'},
  {clave: 'inversion', nombre: 'Formación bruta de capital fijo', unidad: '% del PIB', tema: 'Estructura económica', ad: WB, cod: 'NE.GDI.FTOT.ZS', fmt: 'pct', sufijo: 'del PIB'},
  {clave: 'ahorro', nombre: 'Ahorro bruto', unidad: '% del PIB', tema: 'Estructura económica', ad: WB, cod: 'NY.GDS.TOTL.ZS', fmt: 'pct', sufijo: 'del PIB'},
  {clave: 'ingresos_gobierno', nombre: 'Ingresos del gobierno central (sin donaciones)', unidad: '% del PIB', tema: 'Finanzas públicas', ad: WB, cod: 'GC.REV.XGRT.GD.ZS', fmt: 'pct', sufijo: 'del PIB'},
  {clave: 'credito_privado', nombre: 'Crédito de los bancos al sector privado', unidad: '% del PIB', tema: 'Finanzas', ad: WB, cod: 'FS.AST.PRVT.GD.ZS', fmt: 'pct', sufijo: 'del PIB'},
  {clave: 'capitalizacion_bolsa', nombre: 'Capitalización de las empresas que cotizan en bolsa', unidad: '% del PIB', tema: 'Finanzas', ad: WB, cod: 'CM.MKT.LCAP.GD.ZS', fmt: 'pct', sufijo: 'del PIB'},
  {clave: 'internet', nombre: 'Personas que usan internet', unidad: '% de la población', tema: 'Tecnología', ad: WB, cod: 'IT.NET.USER.ZS', fmt: 'pct', sufijo: 'de la población'},
  {clave: 'deuda_pib', nombre: 'Deuda pública bruta', unidad: '% del PIB', tema: 'Finanzas públicas', ad: IMF, cod: 'GGXWDG_NGDP', fmt: 'pct', sufijo: 'del PIB'},
  {clave: 'deficit_pib', nombre: 'Balance fiscal (superávit + / déficit −)', unidad: '% del PIB', tema: 'Finanzas públicas', ad: IMF, cod: 'GGXCNL_NGDP', fmt: 'pct', sufijo: 'del PIB'},
];
export const indicadoresPais = () => INDICADORES.map((i) => ({clave: i.clave, nombre: i.nombre, unidad: i.unidad, tema: i.tema, fuente: i.ad === WB ? 'Banco Mundial — WDI' : 'FMI — World Economic Outlook'}));
const indDe = (clave) => INDICADORES.find((i) => i.clave === clave);

const LIC = {
  [WB]: 'CC BY 4.0 (Banco Mundial)',
  // Texto real de imf.org/en/About/copyright-and-terms (leído 2026-11-04): datos redistribuibles con atribución y sin alterar su naturaleza; descarga sistemática y uso comercial del «Contenido» piden permiso escrito.
  [IMF]: 'Términos del FMI: datos citando al IMF y sin alterarlos; descarga sistemática y uso comercial requieren permiso escrito (copyright@imf.org). Sin permiso, tratar como uso personal/investigación.',
};

const leerJson = (f, def) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return def; } };
const sinDatos = () => leerJson(rutaPaises, {}).sinDatos ?? {};   // {ISO3: {clave: motivo}} — series que la fuente NO tiene: no se crean

/** Entradas del catálogo (pura, sin red). Omite las series que la fuente no publica para ese país (ver catalogo/paises.json). */
export function entradasPaises() {
  const nada = sinDatos(), out = [];
  for (const p of PAISES) for (const i of INDICADORES) {
    if (nada[p.iso3]?.[i.clave]) continue;
    const wb = i.ad === WB;
    out.push({
      id: `pais_${p.iso3}_${i.clave}`, nombre: `${p.nombre} — ${i.nombre}`, categoria: 'Países', tema: i.tema, pais: {iso3: p.iso3, nombre: p.nombre, region: p.region},
      etiquetas: ['país', p.nombre.toLowerCase(), p.iso3.toLowerCase(), i.clave, i.tema.toLowerCase(), wb ? 'banco mundial' : 'fmi'],
      adaptador: i.ad, args: wb ? {indicador: i.cod, pais: p.iso3} : {indicador: i.cod, pais: p.iso3},
      unidad: i.unidad, frecuencia: 'Anual',
      fuente_original: wb ? 'Banco Mundial — World Development Indicators (API v2)' : 'FMI — World Economic Outlook, DataMapper',
      fuente_corto: wb ? `Banco Mundial · WDI · ${i.cod} · ${p.iso3}` : `FMI · WEO · ${i.cod} · ${p.iso3}`, licencia: LIC[i.ad],
      nota: wb ? 'Años sin dato omitidos, nunca interpolados. El último año publicado varía por país y por indicador.' : 'Se excluyen las proyecciones del WEO (años posteriores al año en curso menos uno); los últimos años incluidos pueden ser estimaciones del FMI.',
    });
  }
  return out;
}

export function listarPaises() {
  const n = {};
  for (const e of leerCatalogo()) if (e.pais?.iso3) n[e.pais.iso3] = (n[e.pais.iso3] ?? 0) + 1;
  return PAISES.map((p) => ({...p, nIndicadores: n[p.iso3] ?? 0}));
}

// ── Red con reintentos ──────────────────────────────────────────────────────────────────────────────────────────
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
async function json(url) {
  let ultimo;
  for (let k = 0; k < 4; k++) {
    try {
      const r = await fetch(url, {headers: {'User-Agent': 'RideTheLightning/0.1 (investigacion local)'}, signal: AbortSignal.timeout(90000)});
      if (r.status === 429 || r.status >= 500) { ultimo = new Error(`HTTP ${r.status} en ${url}`); await dormir(2500 * (k + 1)); continue; }
      if (!r.ok) throw new Error(`HTTP ${r.status} en ${url}`);
      return await r.json();
    } catch (e) { ultimo = e; await dormir(1500 * (k + 1)); }
  }
  throw ultimo;
}

/** Último dato de cada indicador para TODOS los países, por lotes. Banco Mundial: mrnev=1 (valor más reciente no nulo). FMI: último año ≤ año en curso − 1 (sin proyecciones). */
export async function actualizarUltimos() {
  const isos = PAISES.map((p) => p.iso3), res = {}, fuentes = {}, tope = new Date().getUTCFullYear() - 1;
  for (const i of INDICADORES) {
    res[i.clave] = {};
    if (i.ad === WB) {
      for (let k = 0; k < isos.length; k += 40) {   // lotes de 40 países por petición
        const u = `https://api.worldbank.org/v2/country/${isos.slice(k, k + 40).join(';')}/indicator/${i.cod}?format=json&mrnev=1&per_page=1000`;
        const j = await json(u);
        if (!Array.isArray(j) || !Array.isArray(j[1])) throw new Error(`Banco Mundial no devolvió datos para ${i.cod}: ${JSON.stringify(j?.[0]?.message ?? j).slice(0, 200)}`);
        fuentes[i.clave] = {urlDatos: u.replace(/country\/[^/]+/, 'country/<lote de países>'), actualizadoPorLaFuente: j[0].lastupdated};
        for (const r of j[1]) if (r.value != null && r.date.length === 4) res[i.clave][r.countryiso3code] = {valor: r.value, anio: +r.date, iso2: r.country.id};
        await dormir(100);
      }
    } else {
      const u = `https://www.imf.org/external/datamapper/api/v1/${i.cod}`;
      const j = await json(u), v = j.values?.[i.cod] ?? {};
      const meta = (await json('https://www.imf.org/external/datamapper/api/v1/indicators')).indicators?.[i.cod] ?? {};
      fuentes[i.clave] = {urlDatos: u, actualizadoPorLaFuente: meta['last-modified'] ?? null};
      for (const iso of isos) {
        const f = Object.entries(v[iso] ?? {}).filter(([a, x]) => typeof x === 'number' && a.length === 4 && +a <= tope).sort((a, b) => a[0].localeCompare(b[0])).pop();
        if (f) res[i.clave][iso] = {valor: f[1], anio: +f[0]};
      }
    }
    await dormir(150);
  }
  const cache = {actualizado: new Date().toISOString().slice(0, 10), ultimos: res, fuentes};
  fs.mkdirSync(path.dirname(rutaCache), {recursive: true});
  fs.writeFileSync(rutaCache, JSON.stringify(cache));
  return cache;
}

async function ultimos() {
  const c = leerJson(rutaCache, null);
  const viejo = !c || (Date.now() - Date.parse(c.actualizado)) / 86400000 > TTL_DIAS;
  if (!viejo) return c;
  try { return await actualizarUltimos(); } catch (e) { if (c) return {...c, aviso: `No se pudo refrescar (${e.message}); datos del caché del ${c.actualizado}.`}; throw e; }
}

// ── Formato en español (separador de miles «.», decimal «,») ─────────────────────────────────────────────────────
const num = (v, d) => new Intl.NumberFormat('es-CO', {minimumFractionDigits: d, maximumFractionDigits: d}).format(v);
const dec = (v) => { const a = Math.abs(v); return a >= 100 ? 0 : a >= 10 ? 1 : 2; };
export function formatear(i, v) {
  if (v == null) return null;
  const a = Math.abs(v), s = v < 0 ? '−' : '';
  switch (i.fmt) {
    case 'usd': return a >= 1e12 ? `US$ ${s}${num(a / 1e12, 1)} ${num(a / 1e12, 1) === '1,0' ? 'billón' : 'billones'}` : a >= 1e9 ? `US$ ${s}${num(a / 1e9, dec(a / 1e9))} mil millones` : `US$ ${s}${num(a / 1e6, dec(a / 1e6))} millones`;
    case 'usdpc': return `US$ ${s}${num(a, 0)}`;
    case 'pob': return a >= 1e9 ? `${num(a / 1e9, 2)} mil millones de habitantes` : a >= 1e6 ? `${num(a / 1e6, a >= 1e8 ? 0 : 1)} millones de habitantes` : `${num(a, 0)} habitantes`;
    case 'num': return `${num(v, i.dec ?? dec(v))} ${i.sufijo ?? ''}`.trim();
    case 'anios': return `${num(v, 1)} años`;
    case 'indice': return num(v, 1);
    case 'pct': return `${num(v, 1).replace('-', '−')} % ${i.sufijo}`;
    default: return String(v);
  }
}

/** Ficha de un país: último dato real de cada indicador, con fuente, serie del catálogo y notas de verificación. */
export async function fichaPais(iso3) {
  iso3 = String(iso3).toUpperCase();
  const pais = PAISES.find((p) => p.iso3 === iso3);
  if (!pais) throw new Error(`País desconocido: ${iso3}. Usa listarPaises().`);
  const c = await ultimos(), ver = leerJson(rutaVerificado, {})._verificacion_paises?.comparaciones ?? [], nada = sinDatos()[iso3] ?? {};
  const indicadores = INDICADORES.map((i) => {
    const d = c.ultimos[i.clave]?.[iso3], wb = i.ad === WB;
    const base = {clave: i.clave, nombre: i.nombre, unidad: i.unidad, tema: i.tema, serieId: nada[i.clave] ? null : `pais_${iso3}_${i.clave}`};
    const fuente = wb ? {nombre: 'Banco Mundial — World Development Indicators', url: d ? `https://data.worldbank.org/indicator/${i.cod}?locations=${d.iso2}` : `https://data.worldbank.org/indicator/${i.cod}`}
      : {nombre: 'FMI — World Economic Outlook (DataMapper)', url: `https://www.imf.org/external/datamapper/${i.cod}@WEO/${iso3}`};
    if (!d) return {...base, valor: null, valorFormateado: null, anio: null, fuente, motivo: nada[i.clave] ?? `${wb ? 'El Banco Mundial' : 'El FMI'} no publica ${i.nombre.toLowerCase()} para ${pais.nombre}${wb ? '' : ` hasta ${new Date().getUTCFullYear() - 1}`}.`};
    const notas = [];
    if (!wb) notas.push(`Cifra del FMI (WEO) para ${d.anio}: puede ser estimación.`);
    for (const x of ver) if (x.iso3 === iso3 && x.indicador === i.clave && x.veredicto === 'discrepancia' && x.nota) notas.push(x.nota);
    return {...base, valor: d.valor, valorFormateado: formatear(i, d.valor), anio: d.anio, fuente, ...(notas.length ? {nota: notas.join(' ')} : {})};
  });
  return {pais, actualizado: c.actualizado, ...(c.aviso ? {aviso: c.aviso} : {}), indicadores};
}

/** Ids de series `pais_<ISO3>_<clave>` listos para la biblioteca. Los países sin esa serie salen en `.omitidos` (nunca se descartan en silencio). */
export function compararPaises(isos, clave) {
  if (!indDe(clave)) throw new Error(`Indicador desconocido: ${clave}. Válidos: ${INDICADORES.map((i) => i.clave).join(', ')}`);
  const en = new Set(leerCatalogo().map((e) => e.id)), ids = [], omitidos = [];
  for (const iso of isos) {
    const id = `pais_${String(iso).toUpperCase()}_${clave}`;
    if (en.has(id)) ids.push(id); else omitidos.push({iso3: String(iso).toUpperCase(), motivo: sinDatos()[String(iso).toUpperCase()]?.[clave] ?? 'No está en el catálogo (país no incluido o fuente sin datos).'});
  }
  ids.omitidos = omitidos;
  return ids;
}
