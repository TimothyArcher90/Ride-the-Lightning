// Translation tables (es -> en) for the catalogue overlay catalogo/series.en.json. Used by scripts/construir-ingles.mjs (builder) and
// scripts/prueba-catalogo-ingles.mjs (checks). Country / indicator / region / theme names live next to the data in servidor/paises.mjs.
//
// Rule: a term whose meaning is unclear (ambiguous name, technical note) is NOT translated here. The builder keeps the original and lists it in
// docs/diagnosticos/2026-11-08-ingles-frente3-pendientes.md instead of guessing.
//
// Only the VISIBLE text is translated. ids, adapters, args and the original `unidad` never change (the English unit goes in `unidad_vis`).

// ── Categories (series.json `categoria`) ────────────────────────────────────────────────────────────────────────────────
export const CATEGORIAS = {
  'Países': 'Countries', 'Crecimiento': 'Growth', 'IPC por rubro': 'CPI by component', 'Energía': 'Energy', 'Agrícolas y alimentos': 'Agriculture and food',
  'Población': 'Population', 'Tasas': 'Interest rates', 'Divisas': 'Currencies', 'Empleo': 'Employment', 'Clima y energía': 'Climate and energy', 'Deuda': 'Debt',
  'Mercados': 'Markets', 'Empleo por sector': 'Employment by sector', 'Vivienda': 'Housing', 'Precios': 'Prices', 'Metales industriales': 'Industrial metals',
  'Polonia': 'Poland', 'Banca central': 'Central banking', 'Materiales': 'Materials', 'Metales preciosos': 'Precious metals', 'Mercados (historia larga)': 'Markets (long history)',
  'Fertilizantes': 'Fertilizers', 'Cripto': 'Crypto', 'Ciclo': 'Cycle', 'Sentimiento': 'Sentiment', 'Comercio': 'Trade', 'Tecnología': 'Technology', 'Educación': 'Education', 'Salud': 'Health',
};

// ── Frequency ───────────────────────────────────────────────────────────────────────────────────────────────────────────
export const FRECUENCIAS = {
  'Anual': 'Annual', 'Mensual': 'Monthly', 'Diaria': 'Daily', 'Trimestral': 'Quarterly', 'Trimestral (fin de trimestre)': 'Quarterly (end of quarter)',
  'Diaria (días hábiles)': 'Daily (business days)', 'Semanal': 'Weekly', 'Mensual (fin de mes)': 'Monthly (end of month)', 'Semanal (miércoles)': 'Weekly (Wednesday)',
  'Diaria (vigencia; incluye fines de semana como rango)': 'Daily (validity period; weekends included as a range)', 'Mensual (trimestres móviles)': 'Monthly (rolling quarters)',
};

// ── Units (visible `unidad_vis`; the original `unidad` is untouched). Units already valid in English are left out: they pass through unchanged. ──
export const UNIDADES = {
  '% del PIB': '% of GDP', '% anual': '% per year', 'US$ corrientes': 'Current US$', 'US$ corrientes por habitante': 'Current US$ per capita', '% de la población': '% of the population',
  'Por 1.000 nacidos vivos': 'Per 1,000 live births', '% bruto': '% gross', '% de la población de 15+': '% of the population aged 15+', '% de la población activa': '% of the active population', 'Personas': 'People',
  't de CO₂ por habitante': 't of CO₂ per capita', 'Años': 'Years', 'Hijos por mujer': 'Children per woman', '% de la fuerza laboral': '% of the labor force',
  'kg de petróleo equivalente por habitante': 'kg of oil equivalent per capita', '% del consumo final': '% of final consumption', 'Mt de CO₂': 'Mt of CO₂',
  '% de la población total': '% of the total population', 'kWh por habitante': 'kWh per capita', '% de la generación': '% of generation', 'Mt de CO₂ equivalente': 'Mt of CO₂ equivalent',
  'Por 1.000 habitantes': 'Per 1,000 people', 'Moneda local por US$': 'Local currency per US$', 'Moneda local por US$ internacional': 'Local currency per international US$',
  '% de la fuerza laboral de 15-24': '% of the labor force aged 15-24', 'Índice 0–100 (100 = máxima desigualdad)': 'Index 0–100 (100 = maximum inequality)',
  'Índice (base en la fuente)': 'Index (base set by the source)', '% del INB': '% of GNI', '% de las exportaciones de bienes, servicios e ingreso primario': '% of exports of goods, services and primary income',
  'Precio / nivel de cierre (moneda y unidad del instrumento)': 'Closing price / level (currency and unit of the instrument)', 'Índice 1982-84=100': 'Index 1982-84=100',
  'Miles de personas': 'Thousands of people', 'Índice 2021=100': 'Index 2021=100', '% respecto del trimestre anterior': '% change from the previous quarter', 'Millones de US$': 'Millions of US$',
  'Miles de millones de US$': 'Billions of US$', 'US$ por barril': 'US$ per barrel', 'Índice': 'Index', 'US$ por galón': 'US$ per gallon',
  'Miles de unidades (tasa anualizada)': 'Thousands of units (annualized rate)', 'Miles de millones de US$ (tasa anualizada)': 'Billions of US$ (annualized rate)', '% de la electricidad': '% of electricity',
  '°C (anomalía respecto de 1951-1980)': '°C (anomaly relative to 1951-1980)', 'Puntos de índice': 'Index points', 'Toneladas': 'Tonnes', 'Índice dic-1997=100': 'Index Dec-1997=100',
  'Índice dic-1982=100': 'Index Dec-1982=100', 'Índice (base en FRED)': 'Index (base set by FRED)', 'Índice 1982=100': 'Index 1982=100', 'Puntos porcentuales': 'Percentage points',
  'Miles de unidades': 'Thousands of units', 'Índice ene-2000=100': 'Index Jan-2000=100', 'US$ por EUR': 'US$ per EUR', 'US$ por GBP': 'US$ per GBP', '1 = recesión': '1 = recession',
  'Índice 2017=100': 'Index 2017=100', 'Índice (US$ constantes)': 'Index (constant US$)', 'US$ internacionales 2011': 'International US$ (2011)',
  '°C (ver página de la serie para la base)': '°C (see the series page for the base)', 'US$ por hora': 'US$ per hour', 'Horas por semana': 'Hours per week', 'Número de solicitudes': 'Number of claims',
  'Millones de US$ (tasa anualizada)': 'Millions of US$ (annualized rate)', 'Meses': 'Months', 'Índice 1980 T1=100': 'Index 1980 Q1=100', 'US$ por AUD': 'US$ per AUD',
  'Miles de millones de US$ encadenados': 'Billions of chained US$', '% anualizado': '% annualized', 'Miles de millones de US$ encadenados (tasa anualizada)': 'Billions of chained US$ (annualized rate)',
  '% del ingreso disponible': '% of disposable income', 'Millones de unidades (tasa anualizada)': 'Millions of units (annualized rate)', 'Índice ene-2006=100': 'Index Jan-2006=100',
  'US$ por millón de BTU': 'US$ per million BTU', 't de CO₂ equivalente': 't of CO₂ equivalent', 'Unidades': 'Units', 'US$ por vatio (precios constantes, ver la página)': 'US$ per watt (constant prices, see the page)',
  'Muertes por 100 nacidos vivos': 'Deaths per 100 live births', 'Muertes por 100 nacidos vivos (menores de 1 año)': 'Deaths per 100 live births (under 1 year)',
  'Muertes por 100.000 nacidos vivos': 'Deaths per 100,000 live births', 'US$ internacionales (precios constantes)': 'International US$ (constant prices)', 'kcal por persona por día': 'kcal per person per day',
  'Toneladas por hectárea': 'Tonnes per hectare', 'peso colombiano por 1 US$': 'Colombian peso per 1 US$', 'peso mexicano por 1 US$': 'Mexican peso per 1 US$', 'real brasileño por 1 US$': 'Brazilian real per 1 US$',
  'peso argentino por 1 US$': 'Argentine peso per 1 US$', 'peso chileno por 1 US$': 'Chilean peso per 1 US$', 'dólar canadiense por 1 US$': 'Canadian dollar per 1 US$',
  'yuan renminbi por 1 US$': 'Chinese yuan renminbi per 1 US$', 'yen por 1 US$': 'Japanese yen per 1 US$', 'euro por 1 US$': 'Euro per 1 US$', 'libra esterlina por 1 US$': 'Pound sterling per 1 US$',
  '°C (anomalía de TSM Niño 3.4)': '°C (Niño 3.4 sea-surface temperature anomaly)', 'Número por año': 'Number per year', 'Barriles por mes': 'Barrels per month',
  'PLN por gramo': 'PLN per gram', 'PLN por acción': 'PLN per share', 'PLN por US$': 'PLN per US$',
};

// ── Original source (`fuente_original`) ─────────────────────────────────────────────────────────────────────────────────
export const FUENTES = {
  'Board of Governors of the Federal Reserve System (US), vía FRED': 'Board of Governors of the Federal Reserve System (US), via FRED',
  'Yahoo Finance (API de gráficos, no oficial)': 'Yahoo Finance (charts API, unofficial)',
  'Banco Mundial — World Development Indicators (API v2)': 'World Bank — World Development Indicators (API v2)',
  'FMI — World Economic Outlook, DataMapper': 'IMF — World Economic Outlook, DataMapper',
  'Our World in Data (fuentes primarias en la página del gráfico)': 'Our World in Data (primary sources on the chart page)',
  'Narodowy Bank Polski — Tabla A de tipos de cambio medios': 'Narodowy Bank Polski — Table A of average exchange rates',
  'Narodowy Bank Polski — Precio del oro': 'Narodowy Bank Polski — Gold price',
  'Superintendencia Financiera de Colombia — TRM, vía datos.gov.co': 'Superintendencia Financiera de Colombia — TRM, via datos.gov.co',
  'Agencia Nacional de Hidrocarburos (ANH) — Producción fiscalizada de crudo, vía datos.gov.co': 'Agencia Nacional de Hidrocarburos (ANH) — Audited crude oil production, via datos.gov.co',
  'Eurostat — HICP, tasa de variación anual (prc_hicp_manr)': 'Eurostat — HICP, annual rate of change (prc_hicp_manr)',
};

// ── Short source label (`fuente_corto`): segment by segment, split on « · » ───────────────────────────────────────────────
export const FUENTE_CORTO_SEG = {
  'Banco Mundial': 'World Bank', 'FMI': 'IMF', 'Tesoro de EE. UU.': 'U.S. Treasury', 'tasas promedio': 'average rates', 'tabla A': 'table A',
  'precio del oro (PLN/g)': 'gold price (PLN/g)', 'IPC anual': 'annual CPI', 'crudo fiscalizado': 'audited crude oil',
  'Fed (Board of Governors) vía FRED': 'Fed (Board of Governors) via FRED', 'serie WALCL': 'series WALCL',
};

// ── Licences (`licencia`). Exact matches; the FRED / US-government family is handled by patterns in construir-ingles.mjs ─────────────
export const LICENCIAS = {
  'CC BY 4.0 (Banco Mundial)': 'CC BY 4.0 (World Bank)',
  'Términos del FMI: datos citando al IMF y sin alterarlos; descarga sistemática y uso comercial requieren permiso escrito (copyright@imf.org). Sin permiso, tratar como uso personal/investigación.':
    'IMF terms: data may be used citing the IMF and without alteration; systematic download and commercial use require written permission (copyright@imf.org). Without permission, treat as personal/research use.',
  'CC BY 4.0 (política de reutilización de Eurostat)': 'CC BY 4.0 (Eurostat reuse policy)',
  'Ver términos de la serie en FRED': 'See the series terms on FRED',
  'Uso personal/investigación; no redistribuir': 'Personal/research use; do not redistribute',
  'Dominio público (obra del gobierno de EE. UU.; FiscalData)': 'Public domain (U.S. government work; FiscalData)',
  'CC BY 4.0 (OWID); revisar licencia de la fuente primaria': 'CC BY 4.0 (OWID); check the primary source license',
  'Datos públicos del autor; citar a Shiller': 'Public data from the author; cite Shiller',
  'Datos públicos del NBP': 'Public data from the NBP',
  'Datos públicos del GUS': 'Public data from the GUS',
  'Dominio público (obra del gobierno de EE. UU.; NOAA); atribución solicitada por NOAA GML': 'Public domain (U.S. government work; NOAA); attribution requested by NOAA GML',
  'Términos de uso del FMI: citar al FMI; confirmar reutilización comercial': 'IMF terms of use: cite the IMF; confirm commercial reuse',
  'Dominio público (obra del gobierno de EE. UU.; NASA); citar GISTEMP Team y Lenssen et al. (2024)': 'Public domain (U.S. government work; NASA); cite GISTEMP Team and Lenssen et al. (2024)',
  'CC BY-NC 4.0 (datos comunitarios de Coin Metrics)': 'CC BY-NC 4.0 (Coin Metrics community data)',
  'Dominio público (FRED)': 'Public domain (FRED)',
  'CC BY-SA 4.0 (datos.gov.co); atribución: Superintendencia Financiera de Colombia': 'CC BY-SA 4.0 (datos.gov.co); attribution: Superintendencia Financiera de Colombia',
  'CC BY-SA 4.0 (datos.gov.co); atribución: Agencia Nacional de Hidrocarburos': 'CC BY-SA 4.0 (datos.gov.co); attribution: Agencia Nacional de Hidrocarburos',
  'Dominio público (obra del gobierno de EE. UU.; NOAA)': 'Public domain (U.S. government work; NOAA)',
  'Dominio público (obra del gobierno de EE. UU.; USGS)': 'Public domain (U.S. government work; USGS)',
};

// ── Notes (`nota`): exact matches. Notes with URLs or variable parts are handled by patterns in construir-ingles.mjs ─────────────────
export const NOTAS = {
  'Fecha = inicio de vigencia; cada valor rige hasta su vigenciahasta. Desde 1991-12-02.': 'Date = start of validity; each value applies until its vigenciahasta (end of validity) date. From 1991-12-02.',
  'Precios nominales en US$; la unidad es la de la hoja original.': 'Nominal prices in US$; the unit is the one in the original sheet.',
  'Futuro continuo: empalme de contratos sin ajustar por rolleo.': 'Continuous future: spliced contracts, not adjusted for roll.',
  'Valores mensuales; precios = promedio del mes.': 'Monthly values; prices = monthly average.',
  'La API oficial entrega desde 2002-01-02; el archivo anterior (1984-2001) no está en la API.': 'The official API provides data from 2002-01-02; the earlier archive (1984-2001) is not in the API.',
  'Años sin dato omitidos, nunca interpolados. Fuente primaria de cada serie en la página del indicador.': 'Years without data are omitted, never interpolated. The primary source of each series is on the indicator page.',
  'Se excluyen las proyecciones del WEO (años posteriores al año en curso menos uno); los últimos años incluidos pueden ser estimaciones del FMI.':
    'WEO projections are excluded (years after the current year minus one); the latest years included may be IMF estimates.',
  'Índice general (CP00). Los valores recientes pueden ser provisionales; la composición de la zona euro cambia con el tiempo (ver nota de la fuente).':
    'All-items index (CP00). Recent values may be provisional; the composition of the euro area changes over time (see the source note).',
  'Desde 1993-04-01. Deuda total pendiente = en manos del público + intragubernamental.': 'From 1993-04-01. Total debt outstanding = held by the public + intragovernmental.',
  'Años sin dato omitidos, nunca interpolados. El último año publicado varía por país y por indicador.': 'Years without data are omitted, never interpolated. The latest published year varies by country and by indicator.',
  'Los valores recientes pueden ser provisionales (marca «p») o estimados (marca «e»); el adaptador los incluye y la nota de la descarga lista las marcas presentes. Periodos sin dato omitidos.':
    'Recent values may be provisional (flag "p") or estimated (flag "e"); the adapter includes them and the download note lists the flags present. Periods without data are omitted.',
  'Agregado regional/mundial calculado por el Banco Mundial. Años sin dato omitidos, nunca interpolados.': 'Regional/world aggregate calculated by the World Bank. Years without data are omitted, never interpolated.',
  'Agregado mundial calculado por el Banco Mundial. Años sin dato omitidos, nunca interpolados.': 'World aggregate calculated by the World Bank. Years without data are omitted, never interpolated.',
  'Este campo está vacío en los primeros años de la serie (antes de 2001): esos días no se incluyen.': 'This field is empty in the first years of the series (before 2001): those days are not included.',
  'Tasa promedio ponderada de los títulos en circulación (no la tasa de emisión de hoy).': 'Weighted average rate of the securities outstanding (not today\'s issuance rate).',
  'Tasas de reporte para las agencias federales (fin de trimestre), no cotizaciones de mercado diarias; para el dato diario usar FRED/Banco central. Fecha = effective_date: cuando el Tesoro corrige una tasa a mitad de trimestre publica una segunda fila con el mismo record_date y otra effective_date, y ambas se conservan.':
    'Reporting rates for federal agencies (end of quarter), not daily market quotes; for daily data use FRED or the central bank. Date = effective_date: when the Treasury corrects a rate in the middle of a quarter it publishes a second row with the same record_date and a different effective_date, and both are kept.',
  'Desde 1880. La base 1951-1980 es la de la fuente; otras series (OWID, Copernicus) usan bases distintas y no son comparables sin reajuste.':
    'From 1880. The 1951-1980 base is the source\'s own; other series (OWID, Copernicus) use different bases and are not comparable without rebasing.',
  'Los meses interpolados por NOAA (sdev negativa) se omiten.': 'Months interpolated by NOAA (negative sdev) are omitted.',
  'Desde 1950. Fecha = mes central del trimestre móvil.': 'From 1950. Date = central month of the rolling quarter.',
  'Desde 1900, años completos. Descarga lenta (una petición por año).': 'From 1900, complete years. Slow download (one request per year).',
  'Suma de todos los campos y operadores por mes (centésimas enteras, sin error de coma flotante); desde 2014. Licencia con compartir igual: no entra a la instantánea data/.':
    'Sum of all fields and operators per month (whole hundredths, no floating-point error); from 2014. Share-alike license: not included in the data/ snapshot.',
};
// Not translated on purpose (ambiguous / technical): 'Tema oficial BDL P2955 (inflación, COICOP 1999). BDL no declara la base del índice...' is translated
// below only because every term in it is unambiguous; see construir-ingles.mjs.
export const NOTA_GUS = {
  'Tema oficial BDL P2955 (inflación, COICOP 1999). BDL no declara la base del índice en sus metadatos; confírmala en la ficha antes de rotularla.':
    'Official BDL theme P2955 (inflation, COICOP 1999). BDL does not state the index base in its metadata; confirm it on the series page before labeling.',
};

// ── Fragments used inside notes / licences (primary-source segments of the OWID family) ─────────────────────────────────────
export const FRAGMENTOS = [
  ['OMS / UNICEF / UNFPA / Banco Mundial', 'WHO / UNICEF / UNFPA / World Bank'],
  ['IEA (con permiso, vía OWID: revisar la licencia de la fuente primaria)', 'IEA (with permission, via OWID: check the primary source license)'],
  ['Ember y Energy Institute', 'Ember and Energy Institute'], ['Energy Institute y Smil', 'Energy Institute and Smil'], ['Lee y Lee / Barro-Lee', 'Lee and Lee / Barro-Lee'],
  ['Nemet / Farmer y Lafond / IRENA', 'Nemet / Farmer and Lafond / IRENA'], ['UN IGME y Gapminder', 'UN IGME and Gapminder'], ['OWID con HYDE y UN WUP', 'OWID with HYDE and UN WUP'],
  ['CC BY 4.0 vía OWID', 'CC BY 4.0 via OWID'], ['CC BY 3.0 IGO vía OWID', 'CC BY 3.0 IGO via OWID'],
];

// ── Names of non-country series ──────────────────────────────────────────────────────────────────────────────────────────
// World Bank Pink Sheet: «<base> — precio nominal mensual». Bases written in English in the source stay as they are.
export const BM_BASE = {
  'Petróleo crudo (promedio)': 'Crude oil (average)', 'Petróleo Brent': 'Brent crude oil', 'Petróleo Dubái': 'Dubai crude oil', 'Petróleo WTI': 'WTI crude oil',
  'Carbón australiano': 'Australian coal', 'Carbón sudafricano': 'South African coal', 'Gas natural EE. UU.': 'U.S. natural gas', 'Gas natural Europa': 'European natural gas',
  'GNL Japón': 'LNG Japan', 'Cacao': 'Cocoa', 'Café arábica': 'Arabica coffee', 'Café robusta': 'Robusta coffee', 'Aceite de palma': 'Palm oil', 'Soya': 'Soybeans', 'Cebada': 'Barley',
  'Maíz': 'Maize', 'Arroz tailandés 5 %': 'Rice, Thai 5%', 'Trigo SRW (EE. UU.)': 'Wheat, US SRW', 'Trigo HRW (EE. UU.)': 'Wheat, US HRW', 'Naranja': 'Orange', 'Azúcar (mundial)': 'Sugar, world',
  'Caucho RSS3': 'Rubber, RSS3', 'Roca fosfórica': 'Phosphate rock', 'Fosfato diamónico (DAP)': 'Diammonium phosphate (DAP)', 'Cloruro de potasio': 'Potassium chloride', 'Aluminio': 'Aluminum',
  'Mineral de hierro': 'Iron ore', 'Cobre': 'Copper', 'Plomo': 'Lead', 'Estaño': 'Tin', 'Níquel': 'Nickel', 'Oro': 'Gold', 'Platino': 'Platinum', 'Plata': 'Silver',
};
// Yahoo Finance: «<base> — cierre diario» and «<base> — futuro continuo <bolsa> — cierre diario»
export const YF_BASE = {
  'IPC México': 'S&P/BMV IPC (Mexico)', 'Rendimiento bono 10 años (Yahoo)': '10-year bond yield (Yahoo)', 'Índice dólar (DXY)': 'US dollar index (DXY)', 'Oro': 'Gold', 'Plata': 'Silver', 'Cobre': 'Copper',
  'Platino': 'Platinum', 'Paladio': 'Palladium', 'Petróleo WTI': 'WTI crude oil', 'Petróleo Brent': 'Brent crude oil', 'Gas natural': 'Natural gas', 'Trigo': 'Wheat', 'Maíz': 'Maize', 'Soya': 'Soybeans',
  'Café': 'Coffee', 'Cacao': 'Cocoa', 'Azúcar': 'Sugar', 'Algodón': 'Cotton', 'Bitcoin (Yahoo)': 'Bitcoin (Yahoo)', 'Ether (Yahoo)': 'Ether (Yahoo)',
};
export const YF_PARTE = {'cierre diario': 'daily close', 'futuro continuo': 'continuous futures', 'futuro continuo COMEX': 'continuous futures (COMEX)', 'futuro continuo NYMEX': 'continuous futures (NYMEX)',
  'futuro continuo CBOT': 'continuous futures (CBOT)', 'futuro continuo ICE': 'continuous futures (ICE)'};

// HICP rubrics (Eurostat COICOP) used in «IPCA de <país>: <rubro> — variación anual»
export const RUBROS_IPCA = {
  'alimentos y bebidas no alcohólicas': 'food and non-alcoholic beverages', 'ropa y calzado': 'clothing and footwear',
  'vivienda, agua, electricidad, gas y otros combustibles': 'housing, water, electricity, gas and other fuels', 'muebles y mantenimiento del hogar': 'furniture and home maintenance',
  'salud': 'health', 'transporte': 'transport', 'recreación y cultura': 'recreation and culture', 'restaurantes y hoteles': 'restaurants and hotels',
};
// Aggregates (World Bank) used in «<indicador> — <región>»
export const REGIONES_AGREGADO = {
  'Mundo': 'World', 'América Latina y el Caribe': 'Latin America and the Caribbean', 'Unión Europea': 'European Union', 'Asia oriental y Pacífico': 'East Asia and Pacific',
  'Asia meridional': 'South Asia', 'África subsahariana': 'Sub-Saharan Africa', 'Oriente Medio y norte de África': 'Middle East and North Africa', 'América del Norte': 'North America',
};
export const IND_AGREGADO = {
  'Población total': 'Total population', 'PIB per cápita (US$ corrientes)': 'GDP per capita (current US$)', 'Emisiones de CO₂ por habitante': 'CO₂ emissions per capita', 'PIB (US$ corrientes)': 'GDP (current US$)',
};
// Euro-area / EU aggregates that appear as «de <X>» in Eurostat names
export const AGREGADOS_UE = {'la UE-27': 'the EU-27', 'la zona euro': 'the euro area'};

// Explicit names by id (everything that is not covered by a pattern)
export const NOMBRES_ID = {
  fed_balance: 'Federal Reserve balance sheet (total assets)',
  fred_wtisplc: 'WTI crude oil spot — monthly', fred_dcoilwtico: 'WTI crude oil spot — daily', fred_dcoilbrenteu: 'Brent crude oil spot — daily', fred_gasregw: 'U.S. regular gasoline — weekly',
  fred_ppiaco: 'Producer price index: all commodities', fred_cpiaucns: 'U.S. CPI (not seasonally adjusted)', fred_cpiaucsl: 'U.S. CPI (seasonally adjusted)',
  fred_m2sl: 'U.S. M2 money supply', fred_m1sl: 'U.S. M1 money supply', fred_bogmbase: 'U.S. monetary base', fred_fedfunds: 'Federal funds rate (monthly)', fred_dff: 'Federal funds rate (daily)',
  fred_gs10: '10-year Treasury bond (monthly)', fred_dgs10: '10-year Treasury bond (daily)', fred_dgs2: '2-year Treasury bond (daily)', fred_dgs30: '30-year Treasury bond (daily)',
  fred_t10y2y: '10-year minus 2-year Treasury spread', fred_aaa: 'AAA corporate bond yield (Moody\'s)', fred_baa: 'BAA corporate bond yield (Moody\'s)', fred_mortgage30us: '30-year fixed mortgage rate, U.S.',
  fred_unrate: 'U.S. unemployment rate', fred_payems: 'U.S. nonfarm payrolls', fred_gdp: 'U.S. nominal GDP (quarterly)', fred_gdpa: 'U.S. nominal GDP (annual)',
  fred_gfdebtn: 'Gross federal public debt', fred_gfdegdq188s: 'Federal public debt / GDP', fred_houst: 'U.S. housing starts', fred_csushpinsa: 'Case-Shiller home price index',
  fred_dexuseu: 'Exchange rate: US$ per euro', fred_dexjpus: 'Exchange rate: yen per US$', fred_dexusuk: 'Exchange rate: US$ per pound', fred_dexchus: 'Exchange rate: yuan per US$', fred_dexmxus: 'Exchange rate: Mexican peso per US$',
  fred_vixcls: 'VIX volatility index', fred_nasdaqcom: 'Nasdaq Composite', fred_usrec: 'U.S. recessions (NBER)', fred_indpro: 'U.S. industrial production',
  fred_umcsent: 'Consumer confidence (University of Michigan)', fred_rrpontsyd: 'Fed overnight reverse repos', fred_wtregen: 'Treasury General Account at the Fed',
  fred_uscons: 'Employment in construction, U.S.', fred_manemp: 'Employment in manufacturing, U.S.', fred_usgood: 'Employment in goods-producing industries, U.S.', fred_uspriv: 'Total private-sector employment, U.S.',
  fred_ustpu: 'Employment in trade, transportation and utilities, U.S.', fred_ustrade: 'Employment in retail trade, U.S.', fred_usinfo: 'Employment in information, U.S.',
  fred_usfire: 'Employment in financial activities, U.S.', fred_uspbs: 'Employment in professional and business services, U.S.', fred_usehs: 'Employment in education and health services, U.S.',
  fred_uslah: 'Employment in leisure and hospitality, U.S.', fred_usserv: 'Employment in other services, U.S.', fred_usgovt: 'Employment in government, U.S.', fred_usmine: 'Employment in mining and logging, U.S.',
  fred_ces0500000003: 'Average hourly earnings, private sector, U.S.', fred_awhaetp: 'Average weekly hours, private sector, U.S.', fred_icsa: 'Initial claims for unemployment insurance, U.S.',
  fred_jtsjol: 'Job openings (JOLTS), U.S.', fred_jtsqur: 'Quits rate (JOLTS), U.S.', fred_civpart: 'Labor force participation rate, U.S.', fred_emratio: 'Employment-population ratio, U.S.',
  fred_u6rate: 'Broad unemployment U-6, U.S.', fred_lns14000024: 'Unemployment, 20 years and older, U.S.',
  fred_cpilfesl: 'Core CPI (excluding food and energy), U.S.', fred_cpifabsl: 'CPI: food and beverages, U.S.', fred_cusr0000saf11: 'CPI: food at home, U.S.', fred_cusr0000sefv: 'CPI: food away from home, U.S.',
  fred_cpihossl: 'CPI: housing, U.S.', fred_cpimedsl: 'CPI: medical care, U.S.', fred_cpitrnsl: 'CPI: transportation, U.S.', fred_cpiappsl: 'CPI: apparel, U.S.',
  fred_cpiedusl: 'CPI: education and communication, U.S.', fred_cpirecsl: 'CPI: recreation, U.S.', fred_cusr0000sas: 'CPI: services, U.S.', fred_cusr0000seha: 'CPI: rent of primary residence, U.S.',
  fred_cusr0000sehf01: 'CPI: electricity, U.S.', fred_cusr0000setb01: 'CPI: gasoline (all types), U.S.', fred_cusr0000sah21: 'CPI: household energy, U.S.',
  fred_cuur0000sehc01: 'CPI: owners\' equivalent rent of residences (not seasonally adjusted), U.S.', fred_cusr0000seta01: 'CPI: new vehicles, U.S.', fred_cusr0000seta02: 'CPI: used vehicles, U.S.',
  fred_permit: 'Housing building permits, U.S.', fred_hsn1f: 'New single-family home sales, U.S.', fred_computsa: 'Housing completions, U.S.', fred_ttlcons: 'Total construction spending, U.S.',
  fred_mspus: 'Median sales price of houses sold, U.S.', fred_msacsr: 'Months of new-home supply, U.S.', fred_rhorusq156n: 'Homeownership rate, U.S.', fred_rrvrusq156n: 'Rental vacancy rate, U.S.',
  fred_mortgage15us: '15-year fixed mortgage rate, U.S.', fred_ussthpi: 'FHFA house price index (U.S. total)',
  fred_dgs1: '1-year Treasury bond (daily)', fred_dgs5: '5-year Treasury bond (daily)', fred_dgs7: '7-year Treasury bond (daily)', fred_dgs20: '20-year Treasury bond (daily)',
  fred_dgs3mo: '3-month Treasury bill (daily)', fred_dgs1mo: '1-month Treasury bill (daily)', fred_dtb3: '3-month Treasury bill, secondary market (daily)', fred_dprime: 'Bank prime rate, U.S.',
  fred_dfii10: '10-year TIPS real yield', fred_t5yie: '5-year breakeven inflation', fred_t10yie: '10-year breakeven inflation', fred_sofr: 'SOFR (secured overnight financing rate)',
  fred_dexcaus: 'Canadian dollar per US$', fred_dexkous: 'South Korean won per US$', fred_dexinus: 'Indian rupee per US$', fred_dexbzus: 'Brazilian real per US$', fred_dexszus: 'Swiss franc per US$',
  fred_dexusal: 'US$ per Australian dollar', fred_dextaus: 'New Taiwan dollar per US$', fred_dexsdus: 'Swedish krona per US$', fred_dexhkus: 'Hong Kong dollar per US$',
  fred_dtwexbgs: 'Nominal broad US dollar index (Federal Reserve)', fred_gdpc1: 'U.S. real GDP', fred_a191rl1q225sbea: 'U.S. real GDP growth (quarterly, annualized)',
  fred_pce: 'Personal consumption expenditures, U.S.', fred_pcepi: 'Personal consumption expenditures price index (PCE), U.S.', fred_pcepilfe: 'Core PCE (excluding food and energy), U.S.',
  fred_dspic96: 'Real disposable personal income, U.S.', fred_psavert: 'Personal saving rate, U.S.', fred_tcu: 'Capacity utilization, U.S.', fred_rsafs: 'Retail sales, U.S.',
  fred_dgorder: 'Durable goods orders, U.S.', fred_totalsa: 'Light vehicle sales, U.S.', fred_gasdesw: 'Retail diesel, U.S. — weekly', fred_dhhngsp: 'Henry Hub natural gas (spot)',
  fred_djfuelusgulf: 'Jet fuel, U.S. Gulf Coast (spot)', fred_mcoilwtico: 'WTI crude oil spot — monthly (EIA)', fred_mcoilbrenteu: 'Brent crude oil spot — monthly (EIA)',
  fred_apu000074714: 'Average price of regular unleaded gasoline, U.S.', fred_fyfsd: 'Federal surplus or deficit (fiscal year)', fred_mtsds133fms: 'Federal surplus or deficit, monthly',
  fred_fgexpnd: 'Federal government current expenditures', fred_fgrecpt: 'Federal government current receipts', fred_treast: 'Treasury securities held by the Federal Reserve',
  cm_btc_precio: 'Bitcoin — daily reference price (since the first price)', cm_eth_precio: 'Ether — daily reference price (since the first price)',
  sh_p: 'S&P Composite — nominal price (since 1871)', sh_d: 'S&P Composite — nominal dividends (since 1871)', sh_e: 'S&P Composite — nominal earnings (since 1871)',
  sh_cpi: 'U.S. CPI (Shiller splice) (since 1871)', sh_gs10: 'U.S. 10-year bond yield (Shiller splice) (since 1871)', sh_real_price: 'S&P Composite — real price (since 1871)',
  ow_population: 'World population (since 10,000 BC)', ow_gdp_per_capita_maddison_project_database_gdp_per_capita: 'World GDP per capita (Maddison Project)', ow_life_expectancy: 'World life expectancy',
  ow_annual_co2_emissions_per_country: 'World annual CO₂ emissions', ow_coal_production_by_country: 'World coal production', ow_oil_production_by_country: 'World oil production',
  ow_primary_energy_cons: 'World primary energy consumption', ow_global_energy_substitution_coal_twh: 'World coal consumption (energy substitution)',
  ow_global_energy_substitution_oil_twh: 'World oil consumption (energy substitution)', ow_global_energy_substitution_gas_twh: 'World gas consumption (energy substitution)',
  ow_global_energy_substitution_hydro_twh: 'World hydropower consumption', ow_global_energy_substitution_nuclear_twh: 'World nuclear consumption',
  ow_temperature_anomaly_northern_hemisphere: 'Temperature anomaly, Northern Hemisphere', ow_co2_emissions_per_capita: 'CO₂ emissions per capita, world',
  ow_annual_ghg_emissions: 'Annual greenhouse gas emissions, world', ow_share_electricity_renewables: 'Renewables share of world electricity',
  ow_share_electricity_low_carbon: 'Low-carbon share of world electricity', ow_share_electricity_fossil_fuels: 'Fossil fuels share of world electricity',
  ow_electricity_generation: 'World electricity generation', ow_solar_energy_consumption: 'World solar generation', ow_wind_generation: 'World wind generation',
  ow_nuclear_energy_generation: 'World nuclear generation', ow_hydropower_consumption: 'World hydropower generation', ow_installed_solar_pv_capacity: 'Installed solar PV capacity, world',
  ow_fossil_fuel_primary_energy: 'World fossil-fuel primary energy consumption', ow_gas_production_by_country: 'World natural gas production', ow_gas_consumption_by_country: 'World natural gas consumption',
  ow_oil_consumption_by_country: 'World oil consumption', ow_electric_car_sales: 'World electric car sales', ow_solar_pv_prices_vs_cumulative_capacity_cost: 'Cost of solar photovoltaic modules, world',
  ow_child_mortality: 'Under-5 mortality, world', ow_infant_mortality_rates: 'Infant mortality, world (UN WPP)', ow_total_fertility_rate: 'World fertility rate (UN WPP)',
  ow_maternal_mortality_mmr: 'Maternal mortality ratio, world', ow_urbanization_last_500_years: 'World urban population (last 10,000 years)',
  ow_mean_years_of_schooling_long_run: 'Mean years of schooling, world (15-64)', ow_global_gdp_over_the_long_run: 'World GDP over the very long run',
  ow_daily_per_capita_caloric_supply: 'Daily calorie supply per capita, world', ow_cereal_production: 'World cereal production', ow_wheat_yields: 'World wheat yields',
  ow_number_of_deaths_from_natural_disasters_total_dead_all_disasters_yearly: 'Annual deaths from natural disasters, world',
  nbp_pln_usd: 'Zloty per US dollar — official NBP average exchange rate', nbp_pln_eur: 'Zloty per euro — official NBP average exchange rate',
  nbp_pln_chf: 'Zloty per Swiss franc — official NBP average exchange rate', nbp_pln_gbp: 'Zloty per pound sterling — official NBP average exchange rate',
  nbp_oro_pln_gramo: 'Gold price (1 g, 1000 fineness) — NBP', gus_ipc_anual: 'Poland — Consumer price index (inflation), total, annual',
  yf_pkn_wa: 'PKN Orlen (Warsaw) — daily close', yf_pln_x: 'USD/PLN (Yahoo) — daily close',
  wb_ny_gdp_mktp_cd_wld: 'World GDP (current US$)', wb_ny_gdp_mktp_cd_usa: 'GDP of the U.S. (current US$)', wb_ny_gdp_mktp_cd_col: 'GDP of Colombia (current US$)',
  wb_fp_cpi_totl_zg_col: 'Inflation of Colombia (CPI, annual change)', wb_fp_cpi_totl_zg_wld: 'World inflation (CPI, annual change)',
  imf_ngdp_rpch_usa: 'Real GDP growth of the U.S. (IMF)', imf_ngdp_rpch_chn: 'Real GDP growth of China (IMF)', imf_ggxwdg_ngdp_jpn: 'Gross public debt of Japan / GDP (IMF)',
  eu_hicp_ea: 'Harmonized inflation (HICP) of the euro area — annual change', eu_hicp_es: 'Harmonized inflation (HICP) of Spain — annual change', eu_hicp_de: 'Harmonized inflation (HICP) of Germany — annual change',
  eu_une_rt_m_eu27: 'Unemployment rate of the EU-27 (seasonally adjusted)', eu_namq_10_gdp_ea20: 'Real GDP growth of the euro area (EA20, quarterly, adjusted)',
  eu_sts_inpr_m_ea20: 'Industrial production of the euro area (EA20, index 2021=100, adjusted)', eu_sts_trtu_m_ea20: 'Retail trade volume of the euro area (EA20, index 2021=100, adjusted)',
  eu_irt_lt_mcby_m_de: 'German 10-year bond yield (Maastricht convergence criterion)',
  ust_deuda_total: 'Total U.S. public debt (to the penny)', ust_debt_held_public: 'U.S. debt held by the public (to the penny)',
  ust_intragov_hold: 'U.S. debt held by intragovernmental accounts (to the penny)',
  ust_tasa_promedio_total: 'Average interest rate on U.S. debt: all interest-bearing debt', ust_tasa_promedio_bills: 'Average interest rate on U.S. debt: Treasury bills (T-bills)',
  ust_tasa_promedio_notes: 'Average interest rate on U.S. debt: Treasury notes', ust_tasa_promedio_bonds: 'Average interest rate on U.S. debt: Treasury bonds',
  ust_tasa_promedio_tips: 'Average interest rate on U.S. debt: TIPS', ust_tasa_promedio_ffb: 'Average interest rate on U.S. debt: Federal Financing Bank',
  ust_cambio_cop: 'Official U.S. Treasury exchange rate (quarterly report): Colombian peso per US$', ust_cambio_mxn: 'Official U.S. Treasury exchange rate (quarterly report): Mexican peso per US$',
  ust_cambio_brl: 'Official U.S. Treasury exchange rate (quarterly report): Brazilian real per US$', ust_cambio_ars: 'Official U.S. Treasury exchange rate (quarterly report): Argentine peso per US$',
  ust_cambio_clp: 'Official U.S. Treasury exchange rate (quarterly report): Chilean peso per US$', ust_cambio_cad: 'Official U.S. Treasury exchange rate (quarterly report): Canadian dollar per US$',
  ust_cambio_cny: 'Official U.S. Treasury exchange rate (quarterly report): Chinese yuan renminbi per US$', ust_cambio_jpy: 'Official U.S. Treasury exchange rate (quarterly report): Japanese yen per US$',
  ust_cambio_eur: 'Official U.S. Treasury exchange rate (quarterly report): euro per US$', ust_cambio_gbp: 'Official U.S. Treasury exchange rate (quarterly report): pound sterling per US$',
  co_trm: 'Colombia — US dollar (TRM, pesos per US$)',
  nasa_gistemp_glb: 'Monthly global temperature anomaly (NASA GISTEMP)', nasa_gistemp_nh: 'Monthly Northern Hemisphere temperature anomaly (NASA GISTEMP)',
  nasa_gistemp_sh: 'Monthly Southern Hemisphere temperature anomaly (NASA GISTEMP)',
  noaa_co2_mlo: 'Atmospheric CO₂ at Mauna Loa (monthly mean)', noaa_co2_global: 'Atmospheric CO₂, global monthly mean', noaa_ch4_global: 'Atmospheric methane (CH₄), global monthly mean',
  noaa_n2o_global: 'Atmospheric nitrous oxide (N₂O), global monthly mean', noaa_oni: 'Oceanic Niño Index (ONI)', usgs_sismos_m7_anual: 'Earthquakes of magnitude 7 or greater per year (world)',
  co_crudo_produccion: 'Colombia — audited crude oil production (monthly, national)',
  wb_ny_gdp_mktp_kd_zg_wld: 'World real GDP growth', wb_sp_pop_grow_wld: 'World population growth', wb_sp_dyn_tfrt_in_wld: 'World fertility rate',
  wb_sp_dyn_le00_in_wld: 'World life expectancy (World Bank)', wb_sh_dyn_mort_wld: 'Under-5 mortality, world', wb_sp_urb_totl_in_zs_wld: 'World urban population',
  wb_eg_elc_accs_zs_wld: 'Access to electricity, world', wb_eg_fec_rnew_zs_wld: 'Renewable energy in final consumption, world', wb_eg_use_pcap_kg_oe_wld: 'Energy use per capita, world',
  wb_en_ghg_co2_mt_ce_ar5_wld: 'World CO₂ emissions (excluding land use)', wb_ne_trd_gnfs_zs_wld: 'World trade (% of GDP)', wb_it_net_user_zs_wld: 'Internet users, world',
  wb_se_sec_enrr_wld: 'Secondary school enrollment, world (gross rate)', wb_sh_xpd_chex_gd_zs_wld: 'Health expenditure, world',
};

// ── Tags (`etiquetas`): lowercase search keywords. Spanish words -> English; codes and English words pass through. ──────────────────
export const TAGS = {
  'banco mundial': 'world bank', 'liquidez': 'liquidity', 'cripto': 'crypto', 'historia larga': 'long history', 'polonia': 'poland', 'oro': 'gold', 'inflacion': 'inflation',
  'ipc': 'cpi', 'agregado': 'aggregate', 'mundo': 'world', 'fmi': 'imf', 'ipca': 'hicp', 'tesoro': 'treasury', 'deuda': 'debt', 'ee. uu.': 'u.s.', 'tasa promedio': 'average rate',
  'tipo de cambio': 'exchange rate', 'temperatura': 'temperature', 'clima': 'climate', 'atmósfera': 'atmosphere', 'gases de efecto invernadero': 'greenhouse gases',
  'terremotos': 'earthquakes', 'sismos': 'seismic events', 'magnitud 7': 'magnitude 7', 'dolar': 'dollar', 'petróleo': 'oil', 'crudo': 'crude oil', 'balance': 'balance sheet',
  'colombia': 'colombia', 'superfinanciera': 'superfinanciera', 'el niño': 'el niño', 'la niña': 'la niña',
};

// ── Spanish-detection (builder + test) ────────────────────────────────────────────────────────────────────────────────────
// Whitelist: proper names and loan phrases that legitimately keep Spanish spelling in the English catalogue (each one justified).
export const LISTA_BLANCA = [
  'Superintendencia Financiera de Colombia',   // legal name of the Colombian regulator (publisher of the TRM); official name in Spanish
  'Agencia Nacional de Hidrocarburos',          // legal name of the Colombian hydrocarbons agency (ANH)
  'Narodowy Bank Polski', 'Bank Danych Lokalnych', // Polish institution names
  'datos.gov.co',                               // domain of the Colombian open-data portal
  'Superfinanciera',                            // common short name of the regulator, used as a search tag
  'El Niño', 'La Niña', 'Niño 3.4', 'Niño',      // ENSO phenomena: English texts use the Spanish names with the tilde
  'et al.',                                     // Latin abbreviation ("and others") in the citations; also the Spanish word «al» to a naive check
  'El Salvador',                                // country name spelled identically in English and Spanish
  'vigenciahasta',                              // column name of the datos.gov.co TRM dataset ("valid until"), quoted as-is
];
const DIACRITICOS = /[áéíóúüñÁÉÍÓÚÜÑ¿¡«»]/;
export const tieneDiacriticos = (s) => DIACRITICOS.test(quitarListaBlanca(String(s)));
export function quitarListaBlanca(s) {
  let t = String(s);
  for (const w of LISTA_BLANCA) t = t.replace(new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), ' ');   // case-insensitive: tags are lowercase
  return t;
}
// Distinctively Spanish words (not valid English). Short or ambiguous words ("real", "total", "gas", "index") are NOT in this list on purpose.
const PALABRAS_ES = new Set(`de del la las los el un una unos unas por con sin para al como y en entre desde hasta sobre según ante tras es son se su sus que más menos
precio precios tasa tasas índice indice deuda población poblacion mundial mundo anual anuales mensual mensuales diario diaria diarios semanal trimestral trimestre año años
petróleo petroleo carbón carbon oro plata cobre estaño niquel níquel trigo maíz maiz azúcar azucar café algodón soya cebada arroz naranja aceite hierro plomo aluminio fosfato potasio cloruro roca
ventas venta empleo desempleo vivienda viviendas alquiler gasolina electricidad energía energia emisiones producción produccion consumo generación generacion capacidad mortalidad esperanza vida
escolaridad inflación inflacion crecimiento salud educación educacion gasto gastos ingresos superávit superavit déficit deficit bono bonos letra letras tesoro reserva banca oferta monetaria
cuenta corriente fuente fuentes licencia datos dato uso investigación investigacion redistribuir citar descarga requiere requieren permiso escrito términos terminos página pagina unidad
catálogo catalogo confírmala antes rotular valores guardan tal publica ajuste estacional estacionalmente revisiones posteriores pueden cambiar cifras ya publicadas omitidos nunca interpolados
último ultimo publicado varía varia país pais países paises indicador estimaciones excluyen proyecciones curso incluidos nacidos vivos habitante habitantes personas hijos mujer fuerza laboral
consumo final generación bruto bruta neto neta exportaciones importaciones bienes servicios comercio apertura remesas externa externo tipo cambio moneda local internacional entre
cierre diaria futuro continuo mercado bolsa acciones acción dólar dolar libra euro yen yuan peso real brasileño colombiano mexicano argentino chileno canadiense esterlina franco suizo
sueco sueca coreano coreana indio india indio nuevo taiwanés viviendas hogar hogares vehículos vehiculos nuevos usados ropa calzado muebles mantenimiento transporte recreación recreacion cultura
restaurantes hoteles alimentos bebidas alcohólicas alcoholicas agua combustibles medios mediano mediana promedio ponderada título títulos circulación emisión hoy tasas
terremotos sismos magnitud temperatura anomalía anomalia respecto hemisferio norte sur atmósfera atmosfera metano óxido oxido nitroso medio mensuales mes meses semana semanas día dias días
primeros primero primera tiempo plazo largo corto cortos largos historia desde cada todo toda todos todas solo sólo también pero aunque donde cuando mientras cuyo cuya nota notas
fiscalizada fiscalizado crudo barriles administraciones públicas publicas público publico gobierno federal pública economía economia sector privado empresas empresariales profesionales
información informacion minería mineria explotación forestal construcción construccion manufactura comercio minorista servicios ocio hotelería hoteleria otros otras
solicitudes subsidio renuncias voluntarias vacantes participación participacion relación relacion ampliado menor mayor mayores menores
inicios permisos terminadas terminados inventario propiedad vacancia preferencial bancaria implícita implicita rendimiento letra bono tipo vigencia incluye fines rango
sentimiento confianza consumidor ciclo recesión recesion recesiones cripto aviación aviacion costa golfo detal diésel diesel ahorro disponible utilización utilizacion instalada pedidos durables ligeros
anualizada anualizado encadenados encadenado superávit déficit año corrientes constantes sustitución sustitucion hidroeléctrica hidroelectrica eólica eolica solar nuclear
módulos modulos fotovoltaicos fotovoltaica fotovoltaicos costo autos eléctricos electricos suministro calórico calorico muertes desastres naturales cereales rendimiento hectárea hectarea
razón razon materna escolaridad medios urbana urbanización urbanizacion últimos ultimos zona unión union oriental pacífico pacifico meridional subsahariana norte caribe latina américa america
`.split(/\s+/).filter(Boolean));
// Words that are Spanish AND valid English (or part of English names) must not be in PALABRAS_ES: remove the few that slipped in above.
for (const w of ['real', 'solar', 'nuclear', 'federal', 'final', 'local', 'central', 'hoteles', 'diesel', 'cripto', 'oro', 'india', 'euro', 'yen', 'yuan', 'peso', 'sur', 'norte', 'union', 'america', 'latina', 'sector', 'costa', 'norte', 'ciclo', 'nuclear', 'moneda', 'internacional', 'personal', 'uso', 'metano', 'media', 'son', 'solo', 'sólo', 'ya', 'carbon', 'deficit', 'fiscal', 'mayor', 'menor', 'mayores', 'menores', 'tal', 'primera', 'primero', 'primeros', 'plazo']) PALABRAS_ES.delete(w);
// "oro" (Spanish for gold) and "peso/euro/yen/yuan" can legitimately appear in English; they are caught by the translation tables, not by this list.
PALABRAS_ES.add('oro');
export function palabrasEspanolas(s) {
  const t = quitarListaBlanca(String(s)).replace(/https?:\/\/\S+/g, ' ').replace(/[A-Za-z0-9.-]+@[A-Za-z0-9.-]+/g, ' ').replace(/\b[\w.-]+\.(co|com|org|gov|mjs|json)\b/gi, ' ');
  const palabras = [];
  for (const trozo of t.split(/\s+/)) {
    const w = trozo.replace(/^[^A-Za-záéíóúüñÁÉÍÓÚÜÑ]+|[^A-Za-záéíóúüñÁÉÍÓÚÜÑ]+$/g, '');
    if (!w || /[0-9_.=^\/-]/.test(w) || (w.length <= 5 && w === w.toUpperCase())) continue;   // codes, slugs, URLs, acronyms
    palabras.push(w.toLowerCase());
  }
  return palabras.filter((w) => PALABRAS_ES.has(w));
}
export const pareceEspanol = (s) => tieneDiacriticos(s) || palabrasEspanolas(s).length > 0;
