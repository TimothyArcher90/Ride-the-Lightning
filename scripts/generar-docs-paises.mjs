// Genera docs/COUNTRIES.md (inglés) a partir de datos reales: servidor/paises.mjs (países e indicadores), datos/paises-ultimos.json (último año publicado por la
// fuente para cada país e indicador) y catalogo/verificado.json (_verificacion_paises). Uso: node scripts/generar-docs-paises.mjs
// Ejecutar después de `node scripts/construir-paises.mjs` y `node scripts/verificar-paises.mjs`.
import fs from 'node:fs';
import path from 'node:path';
import {PAISES, INDICADORES} from '../servidor/paises.mjs';
import {RAIZ} from '../servidor/compilar.mjs';

const cache = JSON.parse(fs.readFileSync(path.join(RAIZ, 'datos', 'paises-ultimos.json'), 'utf8')), ult = cache.ultimos;
const ver = JSON.parse(fs.readFileSync(path.join(RAIZ, 'catalogo', 'verificado.json'), 'utf8'))._verificacion_paises;
const sinDatos = JSON.parse(fs.readFileSync(path.join(RAIZ, 'catalogo', 'paises.json'), 'utf8')).sinDatos ?? {};

const EN = {pib: 'GDP (current US$)', pib_pc: 'GDP per capita (current US$)', crec_pib: 'Real GDP growth', inflacion: 'Inflation (CPI, annual change)', desempleo: 'Unemployment (ILO modelled estimate)', poblacion: 'Total population', esperanza_vida: 'Life expectancy at birth', gini: 'Gini index',
  cuenta_corriente: 'Current account balance', reservas: 'Total reserves (incl. gold)', exportaciones: 'Exports of goods and services', ied: 'Foreign direct investment, net inflows', energia_pc: 'Energy use per capita', electricidad_pc: 'Electric power consumption per capita',
  renovables_energia: 'Renewable energy share of final consumption', renovables_electricidad: 'Renewable share of electricity output', acceso_electricidad: 'Access to electricity', co2_total: 'CO2 emissions (excl. land use)', co2_pc: 'CO2 emissions per capita (excl. land use)', ghg_total: 'Total greenhouse gas emissions (excl. land use)',
  gasto_salud: 'Current health expenditure', gasto_salud_pc: 'Current health expenditure per capita', mortalidad_infantil: 'Infant mortality (under 1)', mortalidad_menores5: 'Under-5 mortality', medicos: 'Physicians', fertilidad: 'Fertility rate', crec_poblacion: 'Population growth', urbanizacion: 'Urban population share',
  gasto_educacion: 'Government expenditure on education', matricula_secundaria: 'Secondary school enrolment (gross)', matricula_terciaria: 'Tertiary school enrolment (gross)', alfabetismo: 'Adult literacy rate (15+)', importaciones: 'Imports of goods and services', apertura_comercial: 'Trade (exports + imports)',
  exp_mercancias: 'Merchandise exports', imp_mercancias: 'Merchandise imports', remesas: 'Personal remittances received', deuda_externa: 'External debt stocks, total', deuda_externa_ingreso: 'External debt stocks / gross national income', servicio_deuda: 'Total debt service (external)', tasa_real: 'Real interest rate',
  tasa_prestamos: 'Lending interest rate', tasa_depositos: 'Deposit interest rate', tipo_cambio: 'Official exchange rate (LCU per US$, period average)', tipo_cambio_real: 'Real effective exchange rate index', ppa: 'PPP conversion factor', part_laboral: 'Labour force participation (15+)',
  desempleo_juvenil: 'Youth unemployment (15-24, ILO modelled)', valor_industria: 'Industry value added', valor_agro: 'Agriculture value added', valor_servicios: 'Services value added', inversion: 'Gross fixed capital formation', ahorro: 'Gross savings', ingresos_gobierno: 'Central government revenue (excl. grants)',
  credito_privado: 'Domestic credit to private sector by banks', capitalizacion_bolsa: 'Market capitalisation of listed companies', internet: 'Individuals using the internet', deuda_pib: 'General government gross debt (IMF)', deficit_pib: 'General government net lending/borrowing (IMF)'};
const UNI = {'US$ corrientes': 'current US$', 'US$ corrientes por habitante': 'current US$ per capita', '% anual': '% per year', '% de la fuerza laboral': '% of the labour force', Personas: 'persons', Años: 'years', 'Índice 0–100 (100 = máxima desigualdad)': 'index 0–100 (100 = maximum inequality)',
  '% del PIB': '% of GDP', 'kg de petróleo equivalente por habitante': 'kg of oil equivalent per capita', 'kWh por habitante': 'kWh per capita', '% del consumo final': '% of final consumption', '% de la generación': '% of generation', '% de la población': '% of the population', 'Mt de CO₂': 'Mt CO2',
  't de CO₂ por habitante': 't CO2 per capita', 'Mt de CO₂ equivalente': 'Mt CO2 equivalent', 'Por 1.000 nacidos vivos': 'per 1,000 live births', 'Por 1.000 habitantes': 'per 1,000 people', 'Hijos por mujer': 'children per woman', '% de la población total': '% of total population', '% bruto': '% gross',
  '% de la población de 15+': '% of population 15+', '% del INB': '% of GNI', '% de las exportaciones de bienes, servicios e ingreso primario': '% of exports of goods, services and primary income', 'Moneda local por US$': 'local currency per US$', 'Índice (base en la fuente)': 'index (base year per source)',
  'Moneda local por US$ internacional': 'local currency per international US$', '% de la fuerza laboral de 15-24': '% of the labour force aged 15-24'};
const TEMA = {Economía: 'Economy', Precios: 'Prices', Empleo: 'Labour', Población: 'Population', 'Sector externo': 'External sector', 'Finanzas públicas': 'Public finance', Energía: 'Energy', Clima: 'Climate', Salud: 'Health', Educación: 'Education', Comercio: 'Trade', 'Deuda externa': 'External debt',
  'Tasas de interés': 'Interest rates', 'Tipo de cambio': 'Exchange rates', 'Estructura económica': 'Economic structure', Finanzas: 'Finance', Tecnología: 'Technology'};
const REG = {Norteamérica: 'North America', 'Latinoamérica y Caribe': 'Latin America & Caribbean', Asia: 'Asia', Europa: 'Europe', 'Europa y Asia central': 'Europe & Central Asia', Oceanía: 'Oceania', 'Oriente Medio y norte de África': 'Middle East & North Africa', 'África subsahariana': 'Sub-Saharan Africa'};
const NOM = {USA: 'United States', CAN: 'Canada', MEX: 'Mexico', CHN: 'China', JPN: 'Japan', IND: 'India', KOR: 'South Korea', IDN: 'Indonesia', SGP: 'Singapore', VNM: 'Vietnam', THA: 'Thailand', PHL: 'Philippines', DEU: 'Germany', GBR: 'United Kingdom', FRA: 'France', ITA: 'Italy', ESP: 'Spain', RUS: 'Russia', POL: 'Poland', NLD: 'Netherlands',
  CHE: 'Switzerland', IRL: 'Ireland', SWE: 'Sweden', TUR: 'Turkey', AUS: 'Australia', SAU: 'Saudi Arabia', ISR: 'Israel', ARE: 'United Arab Emirates', EGY: 'Egypt', ZAF: 'South Africa', NGA: 'Nigeria', COL: 'Colombia', BRA: 'Brazil', ARG: 'Argentina', CHL: 'Chile', PER: 'Peru', ECU: 'Ecuador', URY: 'Uruguay', PAN: 'Panama',
  CRI: 'Costa Rica', VEN: 'Venezuela', BOL: 'Bolivia', PRY: 'Paraguay', DOM: 'Dominican Republic', GTM: 'Guatemala', HND: 'Honduras', SLV: 'El Salvador', NIC: 'Nicaragua', CUB: 'Cuba', JAM: 'Jamaica', PRT: 'Portugal', BEL: 'Belgium', AUT: 'Austria', DNK: 'Denmark', NOR: 'Norway', FIN: 'Finland', GRC: 'Greece', CZE: 'Czechia',
  HUN: 'Hungary', ROU: 'Romania', UKR: 'Ukraine', PAK: 'Pakistan', BGD: 'Bangladesh', MYS: 'Malaysia', IRN: 'Iran', IRQ: 'Iraq', QAT: 'Qatar', MAR: 'Morocco', KEN: 'Kenya', ETH: 'Ethiopia', GHA: 'Ghana', NZL: 'New Zealand'};
const falta = PAISES.filter((p) => !NOM[p.iso3]).map((p) => p.iso3); if (falta.length) throw new Error('Falta nombre en inglés para ' + falta.join(','));
const falta2 = INDICADORES.filter((i) => !EN[i.clave] || !TEMA[i.tema]).map((i) => i.clave); if (falta2.length) throw new Error('Falta traducción para ' + falta2.join(','));

const WBn = INDICADORES.filter((i) => i.ad === 'worldbank'), n = PAISES.length;
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };
const anios = (clave) => PAISES.map((p) => ult[clave]?.[p.iso3]?.anio).filter((x) => x != null);
const hoy = cache.actualizado;

const fila = [];
const cobertura = PAISES.map((p) => {
  const con = INDICADORES.filter((i) => ult[i.clave]?.[p.iso3]), sin = INDICADORES.filter((i) => !ult[i.clave]?.[p.iso3]), a = con.map((i) => ult[i.clave][p.iso3].anio);
  return {p, con: con.length, sin, mediana: med(a), minimo: Math.min(...a), maximo: Math.max(...a)};
});
const totalSeries = cobertura.reduce((a, c) => a + c.con, 0);

const md = [];
md.push('# Country data', '',
  `Country-level indicators from the **World Bank (WDI, CC BY 4.0)** and the **IMF (World Economic Outlook, restricted terms)**. **${n} countries × ${INDICADORES.length} indicators = ${n * INDICADORES.length} possible series; ${totalSeries} exist** (the rest are not published by the source and are *not* created — never filled in).`, '',
  `Generated from live data on **${hoy}** by \`scripts/generar-docs-paises.mjs\` (counts and years below come from \`datos/paises-ultimos.json\`, refreshed from the sources).`, '',
  '## How it works', '',
  '- Each (country, indicator) pair is a catalogue series with id `pais_<ISO3>_<indicator>` (e.g. `pais_COL_pib`), full history downloaded on demand through the `worldbank` / `imf` adapters.',
  '- `fichaPais(iso3)` (`servidor/paises.mjs`) returns the **latest** value of every indicator with its year, source URL and verification notes; `compararPaises([iso3…], indicator)` returns the series ids to compare countries and lists any country that lacks that series in `.omitidos`.',
  '- A series that the source does not publish for a country has no catalogue entry; `fichaPais` returns `valor: null` plus the reason. Nothing is interpolated or estimated by us.',
  '- **The latest year differs by country and indicator** (see the lag table). Never put two countries side by side without printing each value\'s year.',
  '- IMF series (`deuda_pib`, `deficit_pib`) are **restricted**: the IMF terms require written permission for systematic download and commercial reuse. They are catalogued but never redistributed from this repository (see [DATA_SOURCES.md](DATA_SOURCES.md)). The latest IMF years can be estimates, and projections are excluded.', '',
  '## Countries', '',
  `| ISO3 | Country | Region | Indicators with data (of ${INDICADORES.length}) | Latest-year median | Oldest latest year | Not published by the source |`, '|---|---|---|---:|---:|---:|---|');
for (const c of cobertura) md.push(`| ${c.p.iso3} | ${NOM[c.p.iso3]} | ${REG[c.p.region]} | ${c.con} | ${c.mediana} | ${c.minimo} | ${c.sin.length ? c.sin.map((i) => i.clave).join(', ') : '—'} |`);
md.push('', '## Indicators', '', `| Key | Indicator | Theme | Source / code | Unit | Countries with data (of ${n}) | Latest year: min / median / max |`, '|---|---|---|---|---|---:|---|');
for (const i of INDICADORES) {
  const a = anios(i.clave), u = UNI[i.unidad] ?? i.unidad;
  md.push(`| \`${i.clave}\` | ${EN[i.clave]} | ${TEMA[i.tema]} | ${i.ad === 'worldbank' ? 'World Bank' : 'IMF (restricted)'} \`${i.cod}\` | ${u} | ${a.length} | ${a.length ? `${Math.min(...a)} / ${med(a)} / ${Math.max(...a)}` : '—'} |`);
}
md.push('', '## Coverage by theme', '', `Number of (country, indicator) series that exist, per theme (maximum = countries × indicators in the theme).`, '', '| Theme | Indicators | Series that exist | Possible | Coverage |', '|---|---:|---:|---:|---:|');
for (const t of [...new Set(INDICADORES.map((i) => i.tema))]) {
  const ii = INDICADORES.filter((i) => i.tema === t), ok = ii.reduce((a, i) => a + PAISES.filter((p) => ult[i.clave]?.[p.iso3]).length, 0), pos = ii.length * n;
  md.push(`| ${TEMA[t]} | ${ii.length} | ${ok} | ${pos} | ${(ok / pos * 100).toFixed(0)}% |`);
}
const disc = (ver?.comparaciones ?? []).filter((c) => c.veredicto === 'discrepancia'), res = ver?.resumen ?? {};
md.push('', '## Cross-checks between sources (World Bank vs IMF vs Eurostat)', '',
  `\`scripts/verificar-paises.mjs\` compares, at the same reference year, GDP, inflation and population between the World Bank and the IMF for every country, and against Eurostat for the eight EU members in the list; debt is compared against Eurostat / the U.S. Treasury where the definition is the same. Last run: **${ver?.fecha ?? 'n/a'}**.`, '',
  '| Indicator | ' + ['coincide', 'diferencia_menor', 'discrepancia', 'otra_definicion', 'sin_comparacion'].map((k) => ({coincide: 'Match', diferencia_menor: 'Minor difference', discrepancia: 'Discrepancy', otra_definicion: 'Different definition (informational)', sin_comparacion: 'No comparison'}[k])).join(' | ') + ' |', '|---|---:|---:|---:|---:|---:|');
for (const k of ['pib', 'inflacion', 'poblacion', 'deuda_pib']) md.push(`| ${EN[k]} | ${['coincide', 'diferencia_menor', 'discrepancia', 'otra_definicion', 'sin_comparacion'].map((v) => res[k]?.[v] ?? 0).join(' | ')} |`);
md.push('', `Thresholds: GDP and population ≤1% match, ≤3–5% minor, above that discrepancy; inflation ≤0.3 pp / ≤1 pp; debt ≤2 pp / ≤5 pp. Genuine discrepancies found (${disc.length}) are not errors in our pipeline: they are real differences between publishers' definitions or vintages, and the country sheet shows the World Bank value with a note:`, '',
  '| Country | Indicator | Year | World Bank | IMF | Other source | Difference |', '|---|---|---:|---:|---:|---|---:|');
for (const d of disc) md.push(`| ${NOM[d.iso3] ?? d.iso3} | ${EN[d.indicador]} | ${d.anio} | ${d.bancoMundial ?? '—'} | ${d.fmi ?? '—'} | ${d.otraFuente != null ? `${d.otraFuente} (${d.otraFuenteNombre?.replace(/Eurostat.*?\(/, 'Eurostat (') ?? ''})` : '—'} | ${d.diferencia} ${d.diferenciaEn === '% relativo' ? '%' : 'pp'} |`);
md.push('', '## Gotchas', '',
  '- **Latest year is not comparable across countries**: macro indicators are usually the last 1–2 years, but survey- or registry-based ones can be much older for some countries (see the min column: e.g. education spending, literacy and Gini). The lag table gives min / median / max.',
  '- **IMF "latest" years can still be estimates**; projections (years after the current year minus one) are excluded by the adapter.',
  '- **Gini / poverty** are survey-based and published irregularly; several countries have no value at all (e.g. Singapore, Saudi Arabia).',
  '- **External-debt indicators exist only for low- and middle-income countries** (World Bank International Debt Statistics); high-income countries are absent by design.',
  '- **Interest-rate and exchange-rate series come from the IMF International Financial Statistics, republished by the World Bank**: they are in the catalogue but are not part of the redistributable snapshot in `data/`.',
  '- **Definitions differ**: World Bank "central government debt" (`GC.DOD.TOTL.GD.ZS`) is not the IMF "general government gross debt"; US federal debt from the Treasury is not either of them.',
  '- The World Bank API accepts a list of countries per request; we batch 40 at a time with `mrnev=1` (most recent non-empty value) so the whole sheet costs ~120 requests.', '');
fs.writeFileSync(path.join(RAIZ, 'docs', 'COUNTRIES.md'), md.join('\n'));
console.log(`docs/COUNTRIES.md: ${n} países, ${INDICADORES.length} indicadores, ${totalSeries} series existentes, ${disc.length} discrepancias`);
