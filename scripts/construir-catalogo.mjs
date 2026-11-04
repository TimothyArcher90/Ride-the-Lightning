// Genera catalogo/series.json. El Pink Sheet se lista leyendo el archivo vigente del Banco Mundial (nombres y unidades
// reales); el resto son listas curadas. Luego `node servidor/cli.mjs bajar todo` descarga TODO y mide el inicio real.
import fs from 'node:fs';
import path from 'node:path';
import {rutaCatalogo} from '../servidor/catalogo.mjs';
import {listarPinkSheet} from '../servidor/biblioteca.mjs';
import {entradasPaises} from '../servidor/paises.mjs';

const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const E = [];

// ── Banco Mundial · Pink Sheet ───────────────────────────────────────────────────────────────────────────────
const ES = {'Crude oil, average': 'Petróleo crudo (promedio)', 'Crude oil, Brent': 'Petróleo Brent', 'Crude oil, Dubai': 'Petróleo Dubái', 'Crude oil, WTI': 'Petróleo WTI',
  'Coal, Australian': 'Carbón australiano', 'Coal, South African': 'Carbón sudafricano', 'Natural gas, US': 'Gas natural EE. UU.', 'Natural gas, Europe': 'Gas natural Europa',
  'Liquefied natural gas, Japan': 'GNL Japón', Cocoa: 'Cacao', 'Coffee, Arabica': 'Café arábica', 'Coffee, Robusta': 'Café robusta', Soybeans: 'Soya', Maize: 'Maíz', 'Wheat, US HRW': 'Trigo HRW (EE. UU.)',
  'Wheat, US SRW': 'Trigo SRW (EE. UU.)', 'Sugar, world': 'Azúcar (mundial)', 'Cotton, A Index': 'Algodón (índice A)', Aluminum: 'Aluminio', 'Iron ore, cfr spot': 'Mineral de hierro',
  Copper: 'Cobre', Lead: 'Plomo', Tin: 'Estaño', Nickel: 'Níquel', Zinc: 'Zinc', Gold: 'Oro', Platinum: 'Platino', Silver: 'Plata', 'Palm oil': 'Aceite de palma', Urea: 'Urea', 'Rubber, RSS3': 'Caucho RSS3',
  'Rice, Thai 5%': 'Arroz tailandés 5 %', Barley: 'Cebada', 'Phosphate rock': 'Roca fosfórica', 'Potassium chloride': 'Cloruro de potasio', DAP: 'Fosfato diamónico (DAP)', Orange: 'Naranja'};
const categoria = (c) => /crude|coal|gas/i.test(c) ? 'Energía' : /^(gold|silver|platinum)$/i.test(c) ? 'Metales preciosos' : /alumin|iron|copper|lead|^tin|nickel|zinc/i.test(c) ? 'Metales industriales'
  : /phosph|dap|tsp|urea|potass/i.test(c) ? 'Fertilizantes' : /logs|sawnwood|plywood|rubber/i.test(c) ? 'Materiales' : 'Agrícolas y alimentos';
for (const {columna, unidad} of await listarPinkSheet()) {
  if (/index$/i.test(columna)) continue;
  E.push({id: 'bm_' + slug(columna), nombre: `${ES[columna] ?? columna} — precio nominal mensual`, categoria: categoria(columna), etiquetas: ['commodity', 'banco mundial', 'pink sheet', columna.toLowerCase()],
    adaptador: 'bancomundial', args: {columna}, unidad: `US$ (${unidad})`, frecuencia: 'Mensual', fuente_original: 'World Bank Commodity Price Data (The Pink Sheet)',
    fuente_corto: `Banco Mundial · Pink Sheet · ${columna}`, licencia: 'CC BY 4.0 (Banco Mundial)', nota: 'Precios nominales en US$; la unidad es la de la hoja original.'});
}

// ── FRED (sin clave; historia completa) ──────────────────────────────────────────────────────────────────────
const FRED = [
  ['WTISPLC', 'Petróleo WTI spot — mensual', 'Energía', 'US$ por barril', 'Mensual'], ['DCOILWTICO', 'Petróleo WTI spot — diario', 'Energía', 'US$ por barril', 'Diaria'],
  ['DCOILBRENTEU', 'Petróleo Brent spot — diario', 'Energía', 'US$ por barril', 'Diaria'], ['GASREGW', 'Gasolina regular EE. UU. — semanal', 'Energía', 'US$ por galón', 'Semanal'],
  ['PPIACO', 'Índice de precios al productor: todas las materias primas', 'Precios', 'Índice 1982=100', 'Mensual'], ['CPIAUCNS', 'IPC EE. UU. (sin ajuste estacional)', 'Precios', 'Índice 1982-84=100', 'Mensual'],
  ['CPIAUCSL', 'IPC EE. UU. (ajustado)', 'Precios', 'Índice 1982-84=100', 'Mensual'], ['M2SL', 'Oferta monetaria M2 EE. UU.', 'Banca central', 'Miles de millones de US$', 'Mensual'],
  ['M1SL', 'Oferta monetaria M1 EE. UU.', 'Banca central', 'Miles de millones de US$', 'Mensual'], ['BOGMBASE', 'Base monetaria EE. UU.', 'Banca central', 'Millones de US$', 'Mensual'],
  ['FEDFUNDS', 'Tasa de los fondos federales (mensual)', 'Tasas', '% anual', 'Mensual'], ['DFF', 'Tasa de los fondos federales (diaria)', 'Tasas', '% anual', 'Diaria'],
  ['GS10', 'Bono del Tesoro 10 años (mensual)', 'Tasas', '% anual', 'Mensual'], ['DGS10', 'Bono del Tesoro 10 años (diario)', 'Tasas', '% anual', 'Diaria'],
  ['DGS2', 'Bono del Tesoro 2 años (diario)', 'Tasas', '% anual', 'Diaria'], ['DGS30', 'Bono del Tesoro 30 años (diario)', 'Tasas', '% anual', 'Diaria'],
  ['T10Y2Y', 'Diferencial 10 años − 2 años del Tesoro', 'Tasas', 'Puntos porcentuales', 'Diaria'], ['AAA', "Rendimiento de bonos corporativos AAA (Moody's)", 'Tasas', '% anual', 'Mensual'],
  ['BAA', "Rendimiento de bonos corporativos BAA (Moody's)", 'Tasas', '% anual', 'Mensual'], ['MORTGAGE30US', 'Hipoteca fija a 30 años EE. UU.', 'Tasas', '% anual', 'Semanal'],
  ['UNRATE', 'Tasa de desempleo EE. UU.', 'Empleo', '%', 'Mensual'], ['PAYEMS', 'Empleo no agrícola EE. UU.', 'Empleo', 'Miles de personas', 'Mensual'],
  ['GDP', 'PIB nominal EE. UU. (trimestral)', 'Crecimiento', 'Miles de millones de US$', 'Trimestral'], ['GDPA', 'PIB nominal EE. UU. (anual)', 'Crecimiento', 'Miles de millones de US$', 'Anual'],
  ['GFDEBTN', 'Deuda pública federal bruta', 'Deuda', 'Millones de US$', 'Trimestral'], ['GFDEGDQ188S', 'Deuda pública federal / PIB', 'Deuda', '% del PIB', 'Trimestral'],
  ['HOUST', 'Inicios de vivienda EE. UU.', 'Vivienda', 'Miles de unidades', 'Mensual'], ['CSUSHPINSA', 'Índice Case-Shiller de precios de vivienda', 'Vivienda', 'Índice ene-2000=100', 'Mensual'],
  ['DEXUSEU', 'Tipo de cambio US$ por euro', 'Divisas', 'US$ por EUR', 'Diaria'], ['DEXJPUS', 'Tipo de cambio yen por US$', 'Divisas', 'JPY por US$', 'Diaria'],
  ['DEXUSUK', 'Tipo de cambio US$ por libra', 'Divisas', 'US$ por GBP', 'Diaria'], ['DEXCHUS', 'Tipo de cambio yuan por US$', 'Divisas', 'CNY por US$', 'Diaria'],
  ['DEXMXUS', 'Tipo de cambio peso mexicano por US$', 'Divisas', 'MXN por US$', 'Diaria'], ['VIXCLS', 'Índice de volatilidad VIX', 'Mercados', 'Índice', 'Diaria'],
  ['NASDAQCOM', 'Nasdaq Composite', 'Mercados', 'Índice', 'Diaria'], ['USREC', 'Recesiones de EE. UU. (NBER)', 'Ciclo', '1 = recesión', 'Mensual'],
  ['INDPRO', 'Producción industrial EE. UU.', 'Crecimiento', 'Índice 2017=100', 'Mensual'], ['UMCSENT', 'Confianza del consumidor (U. de Michigan)', 'Sentimiento', 'Índice', 'Mensual'],
  ['RRPONTSYD', 'Repos inversos overnight de la Fed', 'Banca central', 'Miles de millones de US$', 'Diaria'], ['WTREGEN', 'Cuenta general del Tesoro en la Fed', 'Banca central', 'Millones de US$', 'Semanal'],
];
for (const [id, nombre, cat, unidad, frec] of FRED) E.push({id: 'fred_' + id.toLowerCase(), nombre, categoria: cat, etiquetas: ['fred', id.toLowerCase()], adaptador: 'fred', args: {id}, unidad, frecuencia: frec,
  fuente_original: 'FRED (Federal Reserve Bank of St. Louis)', fuente_corto: `FRED · ${id}`, licencia: 'Ver términos de la serie en FRED', nota: `Página de la serie: https://fred.stlouisfed.org/series/${id} (unidades y fuente original oficial allí). La unidad indicada aquí es de catálogo: confírmala en esa página antes de rotular.`});

// ── Yahoo Finance: precios de mercado (no oficial; se marca como tal) ──────────────────────────────────────────
const YH = [
  ['^GSPC', 'S&P 500', 'Mercados'], ['^DJI', 'Dow Jones Industrial', 'Mercados'], ['^IXIC', 'Nasdaq Composite', 'Mercados'], ['^RUT', 'Russell 2000', 'Mercados'], ['^FTSE', 'FTSE 100', 'Mercados'],
  ['^GDAXI', 'DAX', 'Mercados'], ['^FCHI', 'CAC 40', 'Mercados'], ['^N225', 'Nikkei 225', 'Mercados'], ['^HSI', 'Hang Seng', 'Mercados'], ['^BVSP', 'Bovespa', 'Mercados'], ['^MXX', 'IPC México', 'Mercados'],
  ['000001.SS', 'Shanghai Composite', 'Mercados'], ['^TNX', 'Rendimiento bono 10 años (Yahoo)', 'Tasas'], ['DX-Y.NYB', 'Índice dólar (DXY)', 'Divisas'], ['EURUSD=X', 'EUR/USD', 'Divisas'], ['JPY=X', 'USD/JPY', 'Divisas'],
  ['GC=F', 'Oro — futuro continuo COMEX', 'Metales preciosos'], ['SI=F', 'Plata — futuro continuo COMEX', 'Metales preciosos'], ['HG=F', 'Cobre — futuro continuo COMEX', 'Metales industriales'],
  ['PL=F', 'Platino — futuro continuo NYMEX', 'Metales preciosos'], ['PA=F', 'Paladio — futuro continuo NYMEX', 'Metales preciosos'], ['CL=F', 'Petróleo WTI — futuro continuo NYMEX', 'Energía'], ['BZ=F', 'Petróleo Brent — futuro continuo', 'Energía'],
  ['NG=F', 'Gas natural — futuro continuo NYMEX', 'Energía'], ['ZW=F', 'Trigo — futuro continuo CBOT', 'Agrícolas y alimentos'], ['ZC=F', 'Maíz — futuro continuo CBOT', 'Agrícolas y alimentos'],
  ['ZS=F', 'Soya — futuro continuo CBOT', 'Agrícolas y alimentos'], ['KC=F', 'Café — futuro continuo ICE', 'Agrícolas y alimentos'], ['CC=F', 'Cacao — futuro continuo ICE', 'Agrícolas y alimentos'],
  ['SB=F', 'Azúcar — futuro continuo ICE', 'Agrícolas y alimentos'], ['CT=F', 'Algodón — futuro continuo ICE', 'Agrícolas y alimentos'], ['BTC-USD', 'Bitcoin (Yahoo)', 'Cripto'], ['ETH-USD', 'Ether (Yahoo)', 'Cripto'],
];
for (const [s, nombre, cat] of YH) E.push({id: 'yf_' + slug(s), nombre: `${nombre} — cierre diario`, categoria: cat, etiquetas: ['yahoo', s.toLowerCase()], adaptador: 'yahoo', args: {simbolo: s}, unidad: 'Precio / nivel de cierre (moneda y unidad del instrumento)', frecuencia: 'Diaria',
  fuente_original: 'Yahoo Finance (API de gráficos, no oficial)', fuente_corto: `Yahoo Finance · ${s}`, licencia: 'Uso personal/investigación; no redistribuir', nota: /=F$/.test(s) ? 'Futuro continuo: empalme de contratos sin ajustar por rolleo.' : null});

// ── Cripto: Coin Metrics (desde el primer precio) ───────────────────────────────────────────────────────────
E.push({id: 'cm_btc_precio', nombre: 'Bitcoin — precio de referencia diario (desde el primer precio)', categoria: 'Cripto', etiquetas: ['bitcoin', 'btc', 'cripto'], adaptador: 'coinmetrics', args: {activo: 'btc', metrica: 'PriceUSD', inicio: '2009-01-01'}, unidad: 'US$', frecuencia: 'Diaria',
  fuente_original: 'Coin Metrics Community Network Data', fuente_corto: 'Coin Metrics · BTC PriceUSD', licencia: 'CC BY-NC 4.0 (datos comunitarios de Coin Metrics)'});
E.push({id: 'cm_eth_precio', nombre: 'Ether — precio de referencia diario (desde el primer precio)', categoria: 'Cripto', etiquetas: ['ethereum', 'eth', 'cripto'], adaptador: 'coinmetrics', args: {activo: 'eth', metrica: 'PriceUSD', inicio: '2015-01-01'}, unidad: 'US$', frecuencia: 'Diaria',
  fuente_original: 'Coin Metrics Community Network Data', fuente_corto: 'Coin Metrics · ETH PriceUSD', licencia: 'CC BY-NC 4.0 (datos comunitarios de Coin Metrics)'});

// ── Shiller (desde 1871) ─────────────────────────────────────────────────────────────────────────────────────
for (const [c, n, u] of [['P', 'S&P Composite — precio nominal', 'Índice'], ['D', 'S&P Composite — dividendos nominales', 'Puntos de índice'], ['E', 'S&P Composite — beneficios nominales', 'Puntos de índice'],
  ['CPI', 'IPC EE. UU. (empalme Shiller)', 'Índice'], ['GS10', 'Rendimiento bono 10 años EE. UU. (empalme Shiller)', '% anual'], ['Real Price', 'S&P Composite — precio real', 'Índice (US$ constantes)']])
  E.push({id: 'sh_' + slug(c), nombre: `${n} (desde 1871)`, categoria: 'Mercados (historia larga)', etiquetas: ['shiller', 'sp500', 'historia larga'], adaptador: 'shiller', args: {columna: c}, unidad: u, frecuencia: 'Mensual',
    fuente_original: 'Robert J. Shiller, Yale — Online Data (Irrational Exuberance)', fuente_corto: `Shiller (Yale) · ${c}`, licencia: 'Datos públicos del autor; citar a Shiller', nota: 'Valores mensuales; precios = promedio del mes.'});

// ── Our World in Data (historia larga mundial; CC BY) ────────────────────────────────────────────────────────
const OW = [
  ['population', 'World', null, 'Población mundial (desde el 10.000 a. C.)', 'Población', 'Personas', 'Anual'],
  ['gdp-per-capita-maddison-project-database', 'World', 'gdp_per_capita', 'PIB per cápita mundial (Maddison Project)', 'Crecimiento', 'US$ internacionales 2011', 'Anual'],
  ['life-expectancy', 'World', null, 'Esperanza de vida mundial', 'Población', 'Años', 'Anual'],
  ['annual-co2-emissions-per-country', 'World', null, 'Emisiones anuales de CO₂ mundiales', 'Clima y energía', 'Toneladas', 'Anual'],
  ['coal-production-by-country', 'World', null, 'Producción mundial de carbón', 'Energía', 'TWh', 'Anual'],
  ['oil-production-by-country', 'World', null, 'Producción mundial de petróleo', 'Energía', 'TWh', 'Anual'],
  ['primary-energy-cons', 'World', null, 'Consumo mundial de energía primaria', 'Energía', 'TWh', 'Anual'],
  ['global-energy-substitution', 'World', 'coal_twh', 'Consumo mundial de carbón (sustitución energética)', 'Energía', 'TWh', 'Anual'],
  ['global-energy-substitution', 'World', 'oil_twh', 'Consumo mundial de petróleo (sustitución energética)', 'Energía', 'TWh', 'Anual'],
  ['global-energy-substitution', 'World', 'gas_twh', 'Consumo mundial de gas (sustitución energética)', 'Energía', 'TWh', 'Anual'],
  ['global-energy-substitution', 'World', 'hydro_twh', 'Consumo mundial de hidroeléctrica', 'Energía', 'TWh', 'Anual'],
  ['global-energy-substitution', 'World', 'nuclear_twh', 'Consumo mundial de nuclear', 'Energía', 'TWh', 'Anual'],
  ['temperature-anomaly', 'Northern Hemisphere', null, 'Anomalía de temperatura, hemisferio norte', 'Clima y energía', '°C (ver página de la serie para la base)', 'Anual'],
];
for (const [slugOw, ent, col, nombre, cat, unidad, frec] of OW) E.push({id: 'ow_' + slug(slugOw) + (col ? '_' + slug(col) : '') + (ent === 'World' ? '' : '_' + slug(ent)), nombre, categoria: cat, etiquetas: ['our world in data', 'historia larga', slugOw],
  adaptador: 'owid', args: {slug: slugOw, entidad: ent, ...(col ? {columna: col} : {})}, unidad, frecuencia: frec, fuente_original: 'Our World in Data (fuentes primarias en la página del gráfico)',
  fuente_corto: `Our World in Data · ${slugOw}`, licencia: 'CC BY 4.0 (OWID); revisar licencia de la fuente primaria'});


// ── Polonia: NBP (API oficial) y GUS (Bank Danych Lokalnych) ───────────────────────────────────────────────────
for (const [cod, n] of [['usd', 'dólar estadounidense'], ['eur', 'euro'], ['chf', 'franco suizo'], ['gbp', 'libra esterlina']])
  E.push({id: 'nbp_pln_' + cod, nombre: `Zloty por ${n} — tipo de cambio medio oficial NBP`, categoria: 'Polonia', etiquetas: ['polonia', 'nbp', 'zloty', 'pln', cod], adaptador: 'nbp', args: {tipo: 'kurs', tabla: 'a', codigo: cod},
    unidad: `PLN por 1 ${cod.toUpperCase()}`, frecuencia: 'Diaria (días hábiles)', fuente_original: 'Narodowy Bank Polski — Tabla A de tipos de cambio medios', fuente_corto: `NBP · tabla A · ${cod.toUpperCase()}/PLN`, licencia: 'Datos públicos del NBP', nota: 'La API oficial entrega desde 2002-01-02; el archivo anterior (1984-2001) no está en la API.'});
E.push({id: 'nbp_oro_pln_gramo', nombre: 'Precio del oro (1 g, ley 1000) — NBP', categoria: 'Polonia', etiquetas: ['polonia', 'nbp', 'oro', 'pln'], adaptador: 'nbp', args: {tipo: 'zloto'}, unidad: 'PLN por gramo', frecuencia: 'Diaria (días hábiles)',
  fuente_original: 'Narodowy Bank Polski — Precio del oro', fuente_corto: 'NBP · precio del oro (PLN/g)', licencia: 'Datos públicos del NBP'});
E.push({id: 'gus_ipc_anual', nombre: 'Polonia — Índice de precios al consumidor (inflación), total, anual', categoria: 'Polonia', etiquetas: ['polonia', 'gus', 'inflacion', 'ipc'], adaptador: 'gus', args: {variable: 217230}, frecuencia: 'Anual',
  fuente_original: 'GUS — Bank Danych Lokalnych (variable 217230)', fuente_corto: 'GUS · BDL · IPC anual', licencia: 'Datos públicos del GUS', nota: 'Tema oficial BDL P2955 (inflación, COICOP 1999). BDL no declara la base del índice en sus metadatos; confírmala en la ficha antes de rotularla.'});
// Yahoo con cotizaciones de la bolsa de Varsovia (la historia de índices de Stooq/GPW no es descargable de forma automática)
E.push({id: 'yf_pkn_wa', nombre: 'PKN Orlen (Varsovia) — cierre diario', categoria: 'Polonia', etiquetas: ['polonia', 'gpw', 'orlen', 'yahoo'], adaptador: 'yahoo', args: {simbolo: 'PKN.WA'}, unidad: 'PLN por acción', frecuencia: 'Diaria',
  fuente_original: 'Yahoo Finance (API de gráficos, no oficial)', fuente_corto: 'Yahoo Finance · PKN.WA', licencia: 'Uso personal/investigación; no redistribuir'});
E.push({id: 'yf_pln_x', nombre: 'USD/PLN (Yahoo) — cierre diario', categoria: 'Polonia', etiquetas: ['polonia', 'zloty', 'yahoo'], adaptador: 'yahoo', args: {simbolo: 'PLN=X'}, unidad: 'PLN por US$', frecuencia: 'Diaria',
  fuente_original: 'Yahoo Finance (API de gráficos, no oficial)', fuente_corto: 'Yahoo Finance · PLN=X', licencia: 'Uso personal/investigación; no redistribuir'});

// ── Fuentes abiertas sin llave: Banco Mundial (WDI), FMI (WEO), Eurostat, Tesoro de EE. UU., TRM de Colombia ────────
const WB = [['NY.GDP.MKTP.CD', 'WLD', 'PIB mundial (US$ corrientes)', 'Crecimiento', 'US$ corrientes'], ['NY.GDP.MKTP.CD', 'USA', 'PIB de EE. UU. (US$ corrientes)', 'Crecimiento', 'US$ corrientes'],
  ['NY.GDP.MKTP.CD', 'COL', 'PIB de Colombia (US$ corrientes)', 'Crecimiento', 'US$ corrientes'], ['FP.CPI.TOTL.ZG', 'COL', 'Inflación de Colombia (IPC, variación anual)', 'Precios', '% anual'],
  ['FP.CPI.TOTL.ZG', 'WLD', 'Inflación mundial (IPC, variación anual)', 'Precios', '% anual']];
for (const [ind, pais, nombre, cat, unidad] of WB) E.push({id: `wb_${slug(ind)}_${pais.toLowerCase()}`, nombre, categoria: cat, etiquetas: ['banco mundial', 'wdi', ind.toLowerCase(), pais.toLowerCase()], adaptador: 'worldbank', args: {indicador: ind, pais}, unidad, frecuencia: 'Anual',
  fuente_original: 'Banco Mundial — World Development Indicators (API v2)', fuente_corto: `Banco Mundial · WDI · ${ind} · ${pais}`, licencia: 'CC BY 4.0 (Banco Mundial)', nota: 'Años sin dato omitidos, nunca interpolados. Fuente primaria de cada serie en la página del indicador.'});
const IMF = [['NGDP_RPCH', 'USA', 'Crecimiento real del PIB de EE. UU. (FMI)', 'Crecimiento', '% anual'], ['NGDP_RPCH', 'CHN', 'Crecimiento real del PIB de China (FMI)', 'Crecimiento', '% anual'],
  ['GGXWDG_NGDP', 'JPN', 'Deuda pública bruta de Japón / PIB (FMI)', 'Deuda', '% del PIB']];
for (const [ind, pais, nombre, cat, unidad] of IMF) E.push({id: `imf_${slug(ind)}_${pais.toLowerCase()}`, nombre, categoria: cat, etiquetas: ['fmi', 'imf', 'weo', ind.toLowerCase(), pais.toLowerCase()], adaptador: 'imf', args: {indicador: ind, pais}, unidad, frecuencia: 'Anual',
  fuente_original: 'FMI — World Economic Outlook, DataMapper', fuente_corto: `FMI · WEO · ${ind} · ${pais}`, licencia: 'Términos de uso del FMI: citar al FMI; confirmar reutilización comercial', nota: 'Se excluyen las proyecciones del WEO (años posteriores al año en curso menos uno); los últimos años incluidos pueden ser estimaciones del FMI.'});
for (const [geo, n] of [['EA', 'zona euro'], ['ES', 'España'], ['DE', 'Alemania']]) E.push({id: `eu_hicp_${geo.toLowerCase()}`, nombre: `Inflación armonizada (IPCA) de ${n} — variación anual`, categoria: 'Precios', etiquetas: ['eurostat', 'hicp', 'ipca', 'inflacion', geo.toLowerCase()],
  adaptador: 'eurostat', args: {dataset: 'prc_hicp_manr', filtros: {geo, coicop: 'CP00', unit: 'RCH_A'}}, unidad: '% anual', frecuencia: 'Mensual', fuente_original: 'Eurostat — HICP, tasa de variación anual (prc_hicp_manr)', fuente_corto: `Eurostat · prc_hicp_manr · ${geo}`,
  licencia: 'CC BY 4.0 (política de reutilización de Eurostat)', nota: 'Índice general (CP00). Los valores recientes pueden ser provisionales; la composición de la zona euro cambia con el tiempo (ver nota de la fuente).'});
E.push({id: 'ust_deuda_total', nombre: 'Deuda pública total de EE. UU. (al centavo)', categoria: 'Deuda', etiquetas: ['tesoro', 'treasury', 'deuda', 'fiscaldata', 'ee. uu.'], adaptador: 'tesoro', args: {campo: 'tot_pub_debt_out_amt'}, unidad: 'US$ corrientes', frecuencia: 'Diaria (días hábiles)',
  fuente_original: 'U.S. Department of the Treasury — FiscalData, Debt to the Penny', fuente_corto: 'Tesoro de EE. UU. · Debt to the Penny', licencia: 'Dominio público (obra del gobierno de EE. UU.; FiscalData)', nota: 'Desde 1993-04-01. Deuda total pendiente = en manos del público + intragubernamental.'});
E.push({id: 'co_trm', nombre: 'Colombia — dólar (TRM, pesos por US$)', categoria: 'Divisas', etiquetas: ['colombia', 'trm', 'dolar', 'cop', 'superfinanciera'], adaptador: 'trm', args: {}, unidad: 'COP por 1 US$', frecuencia: 'Diaria (vigencia; incluye fines de semana como rango)',
  fuente_original: 'Superintendencia Financiera de Colombia — TRM, vía datos.gov.co', fuente_corto: 'Superfinanciera · TRM · datos.gov.co', licencia: 'CC BY-SA 4.0 (datos.gov.co); atribución: Superintendencia Financiera de Colombia', nota: 'Fecha = inicio de vigencia; cada valor rige hasta su vigenciahasta. Desde 1991-12-02.'});

// ── Series por país (Banco Mundial / FMI): se generan en servidor/paises.mjs; scripts/construir-paises.mjs las refresca ──
E.push(...entradasPaises());

const fed = JSON.parse(fs.readFileSync(rutaCatalogo, 'utf8')).find((e) => e.id === 'fed_balance');
if (fed) E.unshift(fed);
const vistos = new Set(), out = E.filter((e) => !vistos.has(e.id) && vistos.add(e.id));
fs.mkdirSync(path.dirname(rutaCatalogo), {recursive: true});
fs.writeFileSync(rutaCatalogo, JSON.stringify(out, null, 2));
console.log(`catálogo: ${out.length} series → ${rutaCatalogo}`);
