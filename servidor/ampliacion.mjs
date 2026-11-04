// Ampliación del catálogo (2026-11-04): series NO por país, de fuentes abiertas sin llave y con licencia clara.
//   FRED (empleo por sector, IPC por rubro, vivienda, tasas, divisas, macro, energía, fiscal) · Our World in Data (energía, clima, población) ·
//   Eurostat (desempleo, PIB, producción industrial, población, deuda, IPCA por rubro) · Tesoro de EE. UU. (FiscalData) · NASA GISTEMP · NOAA ·
//   USGS · datos.gov.co (crudo) · agregados mundiales y regionales del Banco Mundial.
// Pura (sin red): `entradasAmpliacion()` devuelve las entradas; `scripts/construir-ampliacion.mjs` las funde en catalogo/series.json sin tocar las previas.
// Las series por país (Banco Mundial/FMI) viven en servidor/paises.mjs.

const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

const PD = (org) => `Dominio público (obra del gobierno de EE. UU.: ${org}), redistribuida por FRED; citar la fuente`;
const VER = (org) => `Ver términos de la serie en FRED (fuente: ${org}); no se redistribuye en la instantánea`;

// ── FRED ────────────────────────────────────────────────────────────────────────────────────────────────────────
// [id, nombre, categoria, unidad, frecuencia, organización fuente, licencia ('pd' | 'ver'), nota]
const BLS = 'U.S. Bureau of Labor Statistics', BEA = 'U.S. Bureau of Economic Analysis', CEN = 'U.S. Census Bureau', FRB = 'Board of Governors of the Federal Reserve System', EIA = 'U.S. Energy Information Administration', TSY = 'U.S. Department of the Treasury';
const EMP = 'Miles de personas';
const FRED = [
  // Empleo por sector (nómina no agrícola, ajustada estacionalmente)
  ['USCONS', 'Empleo en construcción, EE. UU.', 'Empleo por sector', EMP, 'Mensual', BLS, 'pd'], ['MANEMP', 'Empleo en manufactura, EE. UU.', 'Empleo por sector', EMP, 'Mensual', BLS, 'pd'],
  ['USGOOD', 'Empleo en producción de bienes, EE. UU.', 'Empleo por sector', EMP, 'Mensual', BLS, 'pd'], ['USPRIV', 'Empleo total del sector privado, EE. UU.', 'Empleo por sector', EMP, 'Mensual', BLS, 'pd'],
  ['USTPU', 'Empleo en comercio, transporte y servicios públicos, EE. UU.', 'Empleo por sector', EMP, 'Mensual', BLS, 'pd'], ['USTRADE', 'Empleo en comercio minorista, EE. UU.', 'Empleo por sector', EMP, 'Mensual', BLS, 'pd'],
  ['USINFO', 'Empleo en información, EE. UU.', 'Empleo por sector', EMP, 'Mensual', BLS, 'pd'], ['USFIRE', 'Empleo en actividades financieras, EE. UU.', 'Empleo por sector', EMP, 'Mensual', BLS, 'pd'],
  ['USPBS', 'Empleo en servicios profesionales y empresariales, EE. UU.', 'Empleo por sector', EMP, 'Mensual', BLS, 'pd'], ['USEHS', 'Empleo en educación y salud, EE. UU.', 'Empleo por sector', EMP, 'Mensual', BLS, 'pd'],
  ['USLAH', 'Empleo en ocio y hotelería, EE. UU.', 'Empleo por sector', EMP, 'Mensual', BLS, 'pd'], ['USSERV', 'Empleo en otros servicios, EE. UU.', 'Empleo por sector', EMP, 'Mensual', BLS, 'pd'],
  ['USGOVT', 'Empleo en gobierno, EE. UU.', 'Empleo por sector', EMP, 'Mensual', BLS, 'pd'], ['USMINE', 'Empleo en minería y explotación forestal, EE. UU.', 'Empleo por sector', EMP, 'Mensual', BLS, 'pd'],
  // Mercado laboral
  ['CES0500000003', 'Salario promedio por hora, sector privado, EE. UU.', 'Empleo', 'US$ por hora', 'Mensual', BLS, 'pd'], ['AWHAETP', 'Horas semanales promedio, sector privado, EE. UU.', 'Empleo', 'Horas por semana', 'Mensual', BLS, 'pd'],
  ['ICSA', 'Solicitudes iniciales de subsidio de desempleo, EE. UU.', 'Empleo', 'Número de solicitudes', 'Semanal', 'U.S. Employment and Training Administration', 'pd'],
  ['JTSJOL', 'Vacantes de empleo (JOLTS), EE. UU.', 'Empleo', EMP, 'Mensual', BLS, 'pd'], ['JTSQUR', 'Tasa de renuncias voluntarias (JOLTS), EE. UU.', 'Empleo', '%', 'Mensual', BLS, 'pd'],
  ['CIVPART', 'Tasa de participación laboral, EE. UU.', 'Empleo', '%', 'Mensual', BLS, 'pd'], ['EMRATIO', 'Relación empleo/población, EE. UU.', 'Empleo', '%', 'Mensual', BLS, 'pd'],
  ['U6RATE', 'Desempleo ampliado U-6, EE. UU.', 'Empleo', '% de la fuerza laboral', 'Mensual', BLS, 'pd'], ['LNS14000024', 'Desempleo de 20 años o más, EE. UU.', 'Empleo', '%', 'Mensual', BLS, 'pd'],
  // IPC por rubro (BLS, ajustados estacionalmente salvo indicación)
  ['CPILFESL', 'IPC subyacente (sin alimentos ni energía), EE. UU.', 'IPC por rubro', 'Índice 1982-84=100', 'Mensual', BLS, 'pd'], ['CPIFABSL', 'IPC: alimentos y bebidas, EE. UU.', 'IPC por rubro', 'Índice 1982-84=100', 'Mensual', BLS, 'pd'],
  ['CUSR0000SAF11', 'IPC: alimentos en el hogar, EE. UU.', 'IPC por rubro', 'Índice 1982-84=100', 'Mensual', BLS, 'pd'], ['CUSR0000SEFV', 'IPC: alimentos fuera del hogar, EE. UU.', 'IPC por rubro', 'Índice 1982-84=100', 'Mensual', BLS, 'pd'],
  ['CPIHOSSL', 'IPC: vivienda, EE. UU.', 'IPC por rubro', 'Índice 1982-84=100', 'Mensual', BLS, 'pd'], ['CPIMEDSL', 'IPC: atención médica, EE. UU.', 'IPC por rubro', 'Índice 1982-84=100', 'Mensual', BLS, 'pd'],
  ['CPITRNSL', 'IPC: transporte, EE. UU.', 'IPC por rubro', 'Índice 1982-84=100', 'Mensual', BLS, 'pd'], ['CPIAPPSL', 'IPC: ropa, EE. UU.', 'IPC por rubro', 'Índice 1982-84=100', 'Mensual', BLS, 'pd'],
  ['CPIEDUSL', 'IPC: educación y comunicación, EE. UU.', 'IPC por rubro', 'Índice dic-1997=100', 'Mensual', BLS, 'pd'], ['CPIRECSL', 'IPC: recreación, EE. UU.', 'IPC por rubro', 'Índice dic-1997=100', 'Mensual', BLS, 'pd'],
  ['CUSR0000SAS', 'IPC: servicios, EE. UU.', 'IPC por rubro', 'Índice 1982-84=100', 'Mensual', BLS, 'pd'], ['CUSR0000SEHA', 'IPC: alquiler de la vivienda principal, EE. UU.', 'IPC por rubro', 'Índice dic-1982=100', 'Mensual', BLS, 'pd'],
  ['CUSR0000SEHF01', 'IPC: electricidad, EE. UU.', 'IPC por rubro', 'Índice 1982-84=100', 'Mensual', BLS, 'pd'], ['CUSR0000SETB01', 'IPC: gasolina (todos los tipos), EE. UU.', 'IPC por rubro', 'Índice 1982-84=100', 'Mensual', BLS, 'pd'],
  ['CUSR0000SAH21', 'IPC: energía del hogar, EE. UU.', 'IPC por rubro', 'Índice 1982-84=100', 'Mensual', BLS, 'pd'], ['CUUR0000SEHC01', 'IPC: alquiler equivalente del propietario (sin ajuste estacional), EE. UU.', 'IPC por rubro', 'Índice dic-1982=100', 'Mensual', BLS, 'pd'],
  ['CUSR0000SETA01', 'IPC: vehículos nuevos, EE. UU.', 'IPC por rubro', 'Índice 1982-84=100', 'Mensual', BLS, 'pd'], ['CUSR0000SETA02', 'IPC: vehículos usados, EE. UU.', 'IPC por rubro', 'Índice 1982-84=100', 'Mensual', BLS, 'pd'],
  // Vivienda
  ['PERMIT', 'Permisos de construcción de vivienda, EE. UU.', 'Vivienda', 'Miles de unidades (tasa anualizada)', 'Mensual', CEN, 'pd'], ['HSN1F', 'Ventas de vivienda nueva unifamiliar, EE. UU.', 'Vivienda', 'Miles de unidades (tasa anualizada)', 'Mensual', CEN, 'pd'],
  ['COMPUTSA', 'Viviendas terminadas, EE. UU.', 'Vivienda', 'Miles de unidades (tasa anualizada)', 'Mensual', CEN, 'pd'], ['TTLCONS', 'Gasto total en construcción, EE. UU.', 'Vivienda', 'Millones de US$ (tasa anualizada)', 'Mensual', CEN, 'pd'],
  ['MSPUS', 'Precio mediano de venta de viviendas, EE. UU.', 'Vivienda', 'US$', 'Trimestral', `${CEN} y U.S. Department of Housing and Urban Development`, 'pd'], ['MSACSR', 'Meses de inventario de vivienda nueva, EE. UU.', 'Vivienda', 'Meses', 'Mensual', CEN, 'pd'],
  ['RHORUSQ156N', 'Tasa de propiedad de vivienda, EE. UU.', 'Vivienda', '%', 'Trimestral', CEN, 'pd'], ['RRVRUSQ156N', 'Tasa de vacancia de alquiler, EE. UU.', 'Vivienda', '%', 'Trimestral', CEN, 'pd'],
  ['MORTGAGE15US', 'Hipoteca fija a 15 años, EE. UU.', 'Vivienda', '% anual', 'Semanal', 'Freddie Mac', 'ver'], ['USSTHPI', 'Índice de precios de vivienda FHFA (todo EE. UU.)', 'Vivienda', 'Índice 1980 T1=100', 'Trimestral', 'U.S. Federal Housing Finance Agency', 'ver'],
  // Tasas y curva del Tesoro
  ['DGS1', 'Bono del Tesoro 1 año (diario)', 'Tasas', '% anual', 'Diaria', FRB, 'pd'], ['DGS5', 'Bono del Tesoro 5 años (diario)', 'Tasas', '% anual', 'Diaria', FRB, 'pd'], ['DGS7', 'Bono del Tesoro 7 años (diario)', 'Tasas', '% anual', 'Diaria', FRB, 'pd'],
  ['DGS20', 'Bono del Tesoro 20 años (diario)', 'Tasas', '% anual', 'Diaria', FRB, 'pd'], ['DGS3MO', 'Letra del Tesoro 3 meses (diario)', 'Tasas', '% anual', 'Diaria', FRB, 'pd'], ['DGS1MO', 'Letra del Tesoro 1 mes (diario)', 'Tasas', '% anual', 'Diaria', FRB, 'pd'],
  ['DTB3', 'Letra del Tesoro 3 meses, mercado secundario (diario)', 'Tasas', '% anual', 'Diaria', FRB, 'pd'], ['DPRIME', 'Tasa preferencial bancaria (prime), EE. UU.', 'Tasas', '% anual', 'Diaria', FRB, 'pd'],
  ['DFII10', 'Rendimiento real del TIPS a 10 años', 'Tasas', '% anual', 'Diaria', FRB, 'pd'], ['T5YIE', 'Inflación implícita a 5 años (breakeven)', 'Tasas', '% anual', 'Diaria', FRB, 'pd'], ['T10YIE', 'Inflación implícita a 10 años (breakeven)', 'Tasas', '% anual', 'Diaria', FRB, 'pd'],
  ['SOFR', 'SOFR (tasa de financiamiento garantizada a un día)', 'Tasas', '% anual', 'Diaria', 'Federal Reserve Bank of New York', 'ver'],
  // Divisas (H.10 de la Reserva Federal)
  ['DEXCAUS', 'Dólar canadiense por US$', 'Divisas', 'CAD por US$', 'Diaria', FRB, 'pd'], ['DEXKOUS', 'Won surcoreano por US$', 'Divisas', 'KRW por US$', 'Diaria', FRB, 'pd'], ['DEXINUS', 'Rupia india por US$', 'Divisas', 'INR por US$', 'Diaria', FRB, 'pd'],
  ['DEXBZUS', 'Real brasileño por US$', 'Divisas', 'BRL por US$', 'Diaria', FRB, 'pd'], ['DEXSZUS', 'Franco suizo por US$', 'Divisas', 'CHF por US$', 'Diaria', FRB, 'pd'], ['DEXUSAL', 'US$ por dólar australiano', 'Divisas', 'US$ por AUD', 'Diaria', FRB, 'pd'],
  ['DEXTAUS', 'Nuevo dólar taiwanés por US$', 'Divisas', 'TWD por US$', 'Diaria', FRB, 'pd'], ['DEXSDUS', 'Corona sueca por US$', 'Divisas', 'SEK por US$', 'Diaria', FRB, 'pd'], ['DEXHKUS', 'Dólar de Hong Kong por US$', 'Divisas', 'HKD por US$', 'Diaria', FRB, 'pd'],
  ['DTWEXBGS', 'Índice amplio nominal del dólar (Reserva Federal)', 'Divisas', 'Índice ene-2006=100', 'Diaria', FRB, 'pd'],
  // Macro EE. UU.
  ['GDPC1', 'PIB real de EE. UU.', 'Crecimiento', 'Miles de millones de US$ encadenados', 'Trimestral', BEA, 'pd'], ['A191RL1Q225SBEA', 'Crecimiento real del PIB de EE. UU. (trimestral anualizado)', 'Crecimiento', '% anualizado', 'Trimestral', BEA, 'pd'],
  ['PCE', 'Gasto de consumo personal, EE. UU.', 'Crecimiento', 'Miles de millones de US$ (tasa anualizada)', 'Mensual', BEA, 'pd'], ['PCEPI', 'Índice de precios del gasto de consumo personal (PCE), EE. UU.', 'Precios', 'Índice (base en FRED)', 'Mensual', BEA, 'pd'],
  ['PCEPILFE', 'PCE subyacente (sin alimentos ni energía), EE. UU.', 'Precios', 'Índice (base en FRED)', 'Mensual', BEA, 'pd'], ['DSPIC96', 'Ingreso personal disponible real, EE. UU.', 'Crecimiento', 'Miles de millones de US$ encadenados (tasa anualizada)', 'Mensual', BEA, 'pd'],
  ['PSAVERT', 'Tasa de ahorro personal, EE. UU.', 'Crecimiento', '% del ingreso disponible', 'Mensual', BEA, 'pd'], ['TCU', 'Utilización de la capacidad instalada, EE. UU.', 'Crecimiento', '%', 'Mensual', FRB, 'pd'],
  ['RSAFS', 'Ventas minoristas, EE. UU.', 'Crecimiento', 'Millones de US$', 'Mensual', CEN, 'pd'], ['DGORDER', 'Pedidos de bienes durables, EE. UU.', 'Crecimiento', 'Millones de US$', 'Mensual', CEN, 'pd'],
  ['TOTALSA', 'Ventas de vehículos ligeros, EE. UU.', 'Crecimiento', 'Millones de unidades (tasa anualizada)', 'Mensual', BEA, 'pd'],
  // Energía (EIA y BLS vía FRED)
  ['GASDESW', 'Diésel al detal, EE. UU. — semanal', 'Energía', 'US$ por galón', 'Semanal', EIA, 'pd'], ['DHHNGSP', 'Gas natural Henry Hub (spot)', 'Energía', 'US$ por millón de BTU', 'Diaria', EIA, 'pd'],
  ['DJFUELUSGULF', 'Combustible de aviación, Costa del Golfo (spot)', 'Energía', 'US$ por galón', 'Diaria', EIA, 'pd'], ['MCOILWTICO', 'Petróleo WTI spot — mensual (EIA)', 'Energía', 'US$ por barril', 'Mensual', EIA, 'pd'],
  ['MCOILBRENTEU', 'Petróleo Brent spot — mensual (EIA)', 'Energía', 'US$ por barril', 'Mensual', EIA, 'pd'], ['APU000074714', 'Precio promedio de la gasolina regular sin plomo, EE. UU.', 'Energía', 'US$ por galón', 'Mensual', BLS, 'pd'],
  // Fiscal y banca central
  ['FYFSD', 'Superávit o déficit federal (año fiscal)', 'Deuda', 'Millones de US$', 'Anual', `${TSY} y U.S. Office of Management and Budget`, 'pd'], ['MTSDS133FMS', 'Superávit o déficit federal mensual', 'Deuda', 'Millones de US$', 'Mensual', TSY, 'pd'],
  ['FGEXPND', 'Gasto corriente del gobierno federal', 'Deuda', 'Miles de millones de US$ (tasa anualizada)', 'Trimestral', BEA, 'pd'], ['FGRECPT', 'Ingresos corrientes del gobierno federal', 'Deuda', 'Miles de millones de US$ (tasa anualizada)', 'Trimestral', BEA, 'pd'],
  ['TREAST', 'Valores del Tesoro en poder de la Reserva Federal', 'Banca central', 'Millones de US$', 'Semanal', FRB, 'pd'],
];

// ── Our World in Data (CC BY 4.0; fuente primaria en la nota de cada serie) ─────────────────────────────────────
// [slug, columna|null, nombre, categoria, unidad, fuente primaria / licencia de esa fuente]
const OWID = [
  ['co2-emissions-per-capita', null, 'Emisiones de CO₂ por habitante, mundo', 'Clima y energía', 't de CO₂ por habitante', 'Global Carbon Project (CC BY 4.0)'],
  ['annual-ghg-emissions', null, 'Emisiones anuales de gases de efecto invernadero, mundo', 'Clima y energía', 't de CO₂ equivalente', 'Jones et al. (2024) / Our World in Data (CC BY 4.0)'],
  ['share-electricity-renewables', null, 'Participación de renovables en la electricidad mundial', 'Energía', '% de la electricidad', 'Ember y Energy Institute (CC BY 4.0)'],
  ['share-electricity-low-carbon', null, 'Participación de bajo carbono en la electricidad mundial', 'Energía', '% de la electricidad', 'Ember y Energy Institute (CC BY 4.0)'],
  ['share-electricity-fossil-fuels', null, 'Participación de fósiles en la electricidad mundial', 'Energía', '% de la electricidad', 'Ember y Energy Institute (CC BY 4.0)'],
  ['electricity-generation', null, 'Generación mundial de electricidad', 'Energía', 'TWh', 'Ember y Energy Institute (CC BY 4.0)'],
  ['solar-energy-consumption', null, 'Generación solar mundial', 'Energía', 'TWh', 'Ember y Energy Institute (CC BY 4.0)'],
  ['wind-generation', null, 'Generación eólica mundial', 'Energía', 'TWh', 'Ember y Energy Institute (CC BY 4.0)'],
  ['nuclear-energy-generation', null, 'Generación nuclear mundial', 'Energía', 'TWh', 'Ember y Energy Institute (CC BY 4.0)'],
  ['hydropower-consumption', null, 'Generación hidroeléctrica mundial', 'Energía', 'TWh', 'Ember y Energy Institute (CC BY 4.0)'],
  ['installed-solar-pv-capacity', null, 'Capacidad solar fotovoltaica instalada, mundo', 'Energía', 'GW', 'IRENA (CC BY 4.0 vía OWID)'],
  ['fossil-fuel-primary-energy', null, 'Consumo mundial de energía primaria de combustibles fósiles', 'Energía', 'TWh', 'Energy Institute y Smil (CC BY 4.0 vía OWID)'],
  ['gas-production-by-country', null, 'Producción mundial de gas natural', 'Energía', 'TWh', 'Energy Institute (CC BY 4.0 vía OWID)'],
  ['gas-consumption-by-country', null, 'Consumo mundial de gas natural', 'Energía', 'TWh', 'Energy Institute (CC BY 4.0 vía OWID)'],
  ['oil-consumption-by-country', null, 'Consumo mundial de petróleo', 'Energía', 'TWh', 'Energy Institute (CC BY 4.0 vía OWID)'],
  ['electric-car-sales', null, 'Ventas mundiales de autos eléctricos', 'Energía', 'Unidades', 'IEA (con permiso, vía OWID: revisar la licencia de la fuente primaria)'],
  ['solar-pv-prices-vs-cumulative-capacity', 'cost', 'Costo de los módulos solares fotovoltaicos, mundo', 'Energía', 'US$ por vatio (precios constantes, ver la página)', 'Nemet / Farmer y Lafond / IRENA (CC BY 4.0 vía OWID)'],
  ['child-mortality', null, 'Mortalidad de menores de 5 años, mundo', 'Población', 'Muertes por 100 nacidos vivos', 'UN IGME y Gapminder (CC BY 4.0 vía OWID)'],
  ['infant-mortality-rates', null, 'Mortalidad infantil, mundo (UN WPP)', 'Población', 'Muertes por 100 nacidos vivos (menores de 1 año)', 'UN World Population Prospects (CC BY 3.0 IGO)'],
  ['total-fertility-rate', null, 'Tasa de fertilidad mundial (UN WPP)', 'Población', 'Hijos por mujer', 'UN World Population Prospects (CC BY 3.0 IGO)'],
  ['maternal-mortality', 'mmr', 'Razón de mortalidad materna, mundo', 'Población', 'Muertes por 100.000 nacidos vivos', 'OMS / UNICEF / UNFPA / Banco Mundial (CC BY 3.0 IGO vía OWID)'],
  ['urbanization-last-500-years', null, 'Población urbana mundial (últimos 10.000 años)', 'Población', '% de la población', 'OWID con HYDE y UN WUP (CC BY 4.0)'],
  ['mean-years-of-schooling-long-run', null, 'Años medios de escolaridad, mundo (15-64)', 'Población', 'Años', 'Lee y Lee / Barro-Lee (CC BY 4.0 vía OWID)'],
  ['global-gdp-over-the-long-run', null, 'PIB mundial a muy largo plazo', 'Crecimiento', 'US$ internacionales (precios constantes)', 'Maddison Project Database (CC BY 4.0)'],
  ['daily-per-capita-caloric-supply', null, 'Suministro calórico diario por habitante, mundo', 'Población', 'kcal por persona por día', 'FAO (CC BY 4.0 vía OWID)'],
  ['cereal-production', null, 'Producción mundial de cereales', 'Agrícolas y alimentos', 'Toneladas', 'FAO (CC BY 4.0 vía OWID)'],
  ['wheat-yields', null, 'Rendimiento mundial del trigo', 'Agrícolas y alimentos', 'Toneladas por hectárea', 'FAO (CC BY 4.0 vía OWID)'],
  ['number-of-deaths-from-natural-disasters', 'total_dead_all_disasters_yearly', 'Muertes anuales por desastres naturales, mundo', 'Clima y energía', 'Personas', 'EM-DAT, CRED/UCLouvain (CC BY 4.0 vía OWID)'],
];

// ── Eurostat (CC BY 4.0) ────────────────────────────────────────────────────────────────────────────────────
const GEO = {DE: 'Alemania', FR: 'Francia', IT: 'Italia', ES: 'España', NL: 'Países Bajos', PL: 'Polonia', SE: 'Suecia', IE: 'Irlanda', PT: 'Portugal', BE: 'Bélgica', AT: 'Austria', EL: 'Grecia'};
const EUR = [];
for (const [g, n] of Object.entries(GEO)) {
  const g1 = g.toLowerCase();
  EUR.push({id: `eu_une_rt_m_${g1}`, nombre: `Tasa de desempleo de ${n} (ajustada estacionalmente)`, categoria: 'Empleo', dataset: 'une_rt_m', filtros: {geo: g, s_adj: 'SA', age: 'TOTAL', sex: 'T', unit: 'PC_ACT'}, unidad: '% de la población activa', frecuencia: 'Mensual', cod: 'une_rt_m'});
  EUR.push({id: `eu_namq_10_gdp_${g1}`, nombre: `Crecimiento real del PIB de ${n} (trimestral, ajustado)`, categoria: 'Crecimiento', dataset: 'namq_10_gdp', filtros: {geo: g, s_adj: 'SCA', unit: 'CLV_PCH_PRE', na_item: 'B1GQ'}, unidad: '% respecto del trimestre anterior', frecuencia: 'Trimestral', cod: 'namq_10_gdp'});
  EUR.push({id: `eu_sts_inpr_m_${g1}`, nombre: `Producción industrial de ${n} (índice 2021=100, ajustado)`, categoria: 'Crecimiento', dataset: 'sts_inpr_m', filtros: {geo: g, s_adj: 'SCA', nace_r2: 'B-D', unit: 'I21'}, unidad: 'Índice 2021=100', frecuencia: 'Mensual', cod: 'sts_inpr_m'});
  EUR.push({id: `eu_demo_pjan_${g1}`, nombre: `Población de ${n} a 1 de enero`, categoria: 'Población', dataset: 'demo_pjan', filtros: {geo: g, freq: 'A', unit: 'NR', age: 'TOTAL', sex: 'T'}, unidad: 'Personas', frecuencia: 'Anual', cod: 'demo_pjan'});
  EUR.push({id: `eu_gov_debt_${g1}`, nombre: `Deuda de las administraciones públicas de ${n} / PIB`, categoria: 'Deuda', dataset: 'gov_10dd_edpt1', filtros: {geo: g, freq: 'A', unit: 'PC_GDP', sector: 'S13', na_item: 'GD'}, unidad: '% del PIB', frecuencia: 'Anual', cod: 'gov_10dd_edpt1'});
}
EUR.push({id: 'eu_une_rt_m_eu27', nombre: 'Tasa de desempleo de la UE-27 (ajustada estacionalmente)', categoria: 'Empleo', dataset: 'une_rt_m', filtros: {geo: 'EU27_2020', s_adj: 'SA', age: 'TOTAL', sex: 'T', unit: 'PC_ACT'}, unidad: '% de la población activa', frecuencia: 'Mensual', cod: 'une_rt_m'});
EUR.push({id: 'eu_namq_10_gdp_ea20', nombre: 'Crecimiento real del PIB de la zona euro (EA20, trimestral, ajustado)', categoria: 'Crecimiento', dataset: 'namq_10_gdp', filtros: {geo: 'EA20', s_adj: 'SCA', unit: 'CLV_PCH_PRE', na_item: 'B1GQ'}, unidad: '% respecto del trimestre anterior', frecuencia: 'Trimestral', cod: 'namq_10_gdp'});
EUR.push({id: 'eu_sts_inpr_m_ea20', nombre: 'Producción industrial de la zona euro (EA20, índice 2021=100, ajustado)', categoria: 'Crecimiento', dataset: 'sts_inpr_m', filtros: {geo: 'EA20', s_adj: 'SCA', nace_r2: 'B-D', unit: 'I21'}, unidad: 'Índice 2021=100', frecuencia: 'Mensual', cod: 'sts_inpr_m'});
EUR.push({id: 'eu_sts_trtu_m_ea20', nombre: 'Volumen de ventas minoristas de la zona euro (EA20, índice 2021=100, ajustado)', categoria: 'Crecimiento', dataset: 'sts_trtu_m', filtros: {geo: 'EA20', s_adj: 'SCA', nace_r2: 'G47', unit: 'I21', indic_bt: 'VOL_SLS'}, unidad: 'Índice 2021=100', frecuencia: 'Mensual', cod: 'sts_trtu_m'});
EUR.push({id: 'eu_irt_lt_mcby_m_de', nombre: 'Rendimiento del bono alemán a 10 años (criterio de convergencia de Maastricht)', categoria: 'Tasas', dataset: 'irt_lt_mcby_m', filtros: {geo: 'DE', int_rt: 'MCBY'}, unidad: '% anual', frecuencia: 'Mensual', cod: 'irt_lt_mcby_m'});
// IPCA por rubro (COICOP) de los cuatro grandes: variación anual
const COICOP = {CP01: 'alimentos y bebidas no alcohólicas', CP03: 'ropa y calzado', CP04: 'vivienda, agua, electricidad, gas y otros combustibles', CP05: 'muebles y mantenimiento del hogar', CP06: 'salud', CP07: 'transporte', CP09: 'recreación y cultura', CP11: 'restaurantes y hoteles'};
for (const g of ['DE', 'FR', 'ES', 'IT']) for (const [c, n] of Object.entries(COICOP))
  EUR.push({id: `eu_hicp_${c.toLowerCase()}_${g.toLowerCase()}`, nombre: `IPCA de ${GEO[g]}: ${n} — variación anual`, categoria: 'IPC por rubro', dataset: 'prc_hicp_manr', filtros: {geo: g, coicop: c, unit: 'RCH_A'}, unidad: '% anual', frecuencia: 'Mensual', cod: 'prc_hicp_manr'});

// ── Agregados del Banco Mundial (mundo y regiones) ──────────────────────────────────────────────────────────────
const AGR = {WLD: 'Mundo', LCN: 'América Latina y el Caribe', EUU: 'Unión Europea', EAS: 'Asia oriental y Pacífico', SAS: 'Asia meridional', SSF: 'África subsahariana', MEA: 'Oriente Medio y norte de África', NAC: 'América del Norte'};
const WBG = [['SP.POP.TOTL', 'Población total', 'Población', 'Personas'], ['NY.GDP.MKTP.CD', 'PIB (US$ corrientes)', 'Crecimiento', 'US$ corrientes'], ['NY.GDP.PCAP.CD', 'PIB per cápita (US$ corrientes)', 'Crecimiento', 'US$ corrientes por habitante'], ['EN.GHG.CO2.PC.CE.AR5', 'Emisiones de CO₂ por habitante', 'Clima y energía', 't de CO₂ por habitante']];
const WBW = [['NY.GDP.MKTP.KD.ZG', 'Crecimiento real del PIB mundial', 'Crecimiento', '% anual'], ['SP.POP.GROW', 'Crecimiento de la población mundial', 'Población', '% anual'], ['SP.DYN.TFRT.IN', 'Tasa de fertilidad mundial', 'Población', 'Hijos por mujer'],
  ['SP.DYN.LE00.IN', 'Esperanza de vida mundial (Banco Mundial)', 'Población', 'Años'], ['SH.DYN.MORT', 'Mortalidad de menores de 5 años, mundo', 'Población', 'Por 1.000 nacidos vivos'], ['SP.URB.TOTL.IN.ZS', 'Población urbana mundial', 'Población', '% de la población total'],
  ['EG.ELC.ACCS.ZS', 'Acceso a la electricidad, mundo', 'Energía', '% de la población'], ['EG.FEC.RNEW.ZS', 'Energía renovable en el consumo final, mundo', 'Energía', '% del consumo final'], ['EG.USE.PCAP.KG.OE', 'Uso de energía por habitante, mundo', 'Energía', 'kg de petróleo equivalente por habitante'],
  ['EN.GHG.CO2.MT.CE.AR5', 'Emisiones mundiales de CO₂ (sin uso del suelo)', 'Clima y energía', 'Mt de CO₂'], ['NE.TRD.GNFS.ZS', 'Comercio mundial (% del PIB)', 'Comercio', '% del PIB'], ['IT.NET.USER.ZS', 'Usuarios de internet, mundo', 'Tecnología', '% de la población'],
  ['SE.SEC.ENRR', 'Matrícula en secundaria, mundo (tasa bruta)', 'Educación', '% bruto'], ['SH.XPD.CHEX.GD.ZS', 'Gasto en salud, mundo', 'Salud', '% del PIB']];

/** Entradas nuevas (sin red). Cada una lleva id estable, fuente, licencia, frecuencia, unidad y nota, como las previas. */
export function entradasAmpliacion() {
  const E = [];
  const nada = (e) => E.push(e);

  for (const [id, nombre, cat, unidad, frec, org, lic] of FRED) nada({id: 'fred_' + id.toLowerCase(), nombre, categoria: cat, etiquetas: ['fred', id.toLowerCase(), 'ee. uu.'], adaptador: 'fred', args: {id}, unidad, frecuencia: frec,
    fuente_original: 'FRED (Federal Reserve Bank of St. Louis)', fuente_corto: `FRED · ${id}`, licencia: lic === 'pd' ? PD(org) : VER(org),
    nota: `Fuente original: ${org}. Página de la serie: https://fred.stlouisfed.org/series/${id}. Los valores se guardan tal como los publica FRED (ajuste estacional y base del índice según la serie); las revisiones posteriores de la fuente pueden cambiar cifras ya publicadas.`});

  for (const [sl, col, nombre, cat, unidad, prim] of OWID) nada({id: 'ow_' + slug(sl) + (col ? '_' + slug(col) : ''), nombre, categoria: cat, etiquetas: ['our world in data', 'mundo', sl], adaptador: 'owid', args: {slug: sl, entidad: 'World', ...(col ? {columna: col} : {})}, unidad, frecuencia: 'Anual',
    fuente_original: 'Our World in Data (fuentes primarias en la página del gráfico)', fuente_corto: `Our World in Data · ${sl}`, licencia: 'CC BY 4.0 (OWID); fuente primaria: ' + prim, nota: `Entidad «World» de la página https://ourworldindata.org/grapher/${sl}. Fuente primaria: ${prim}. Años sin valor omitidos, nunca interpolados.`});

  for (const e of EUR) nada({id: e.id, nombre: e.nombre, categoria: e.categoria, etiquetas: ['eurostat', e.cod, (e.filtros.geo ?? '').toLowerCase()], adaptador: 'eurostat', args: {dataset: e.dataset, filtros: e.filtros}, unidad: e.unidad, frecuencia: e.frecuencia,
    fuente_original: `Eurostat (${e.cod})`, fuente_corto: `Eurostat · ${e.cod} · ${e.filtros.geo}`, licencia: 'CC BY 4.0 (política de reutilización de Eurostat)',
    nota: 'Los valores recientes pueden ser provisionales (marca «p») o estimados (marca «e»); el adaptador los incluye y la nota de la descarga lista las marcas presentes. Periodos sin dato omitidos.'});

  for (const [c, n] of Object.entries(AGR)) for (const [ind, nm, cat, unidad] of WBG) nada({id: `wb_${slug(ind)}_${c.toLowerCase()}`, nombre: `${nm} — ${n}`, categoria: cat, etiquetas: ['banco mundial', 'wdi', ind.toLowerCase(), c.toLowerCase(), 'agregado'], adaptador: 'worldbank', args: {indicador: ind, pais: c}, unidad, frecuencia: 'Anual',
    fuente_original: 'Banco Mundial — World Development Indicators (API v2)', fuente_corto: `Banco Mundial · WDI · ${ind} · ${c}`, licencia: 'CC BY 4.0 (Banco Mundial)', nota: 'Agregado regional/mundial calculado por el Banco Mundial. Años sin dato omitidos, nunca interpolados.'});
  for (const [ind, nm, cat, unidad] of WBW) nada({id: `wb_${slug(ind)}_wld`, nombre: nm, categoria: cat, etiquetas: ['banco mundial', 'wdi', ind.toLowerCase(), 'wld', 'mundo'], adaptador: 'worldbank', args: {indicador: ind, pais: 'WLD'}, unidad, frecuencia: 'Anual',
    fuente_original: 'Banco Mundial — World Development Indicators (API v2)', fuente_corto: `Banco Mundial · WDI · ${ind} · WLD`, licencia: 'CC BY 4.0 (Banco Mundial)', nota: 'Agregado mundial calculado por el Banco Mundial. Años sin dato omitidos, nunca interpolados.'});

  // Tesoro de EE. UU. (dominio público)
  const TS = 'Dominio público (obra del gobierno de EE. UU.; FiscalData)', TF = 'U.S. Department of the Treasury — FiscalData';
  for (const [campo, nombre] of [['debt_held_public_amt', 'Deuda de EE. UU. en poder del público (al centavo)'], ['intragov_hold_amt', 'Deuda de EE. UU. en poder de cuentas intragubernamentales (al centavo)']])
    nada({id: 'ust_' + campo.replace(/_amt$/, ''), nombre, categoria: 'Deuda', etiquetas: ['tesoro', 'treasury', 'deuda', 'fiscaldata'], adaptador: 'tesoro', args: {campo}, unidad: 'US$ corrientes', frecuencia: 'Diaria (días hábiles)', fuente_original: `${TF}, Debt to the Penny`, fuente_corto: `Tesoro de EE. UU. · Debt to the Penny · ${campo}`, licencia: TS,
      nota: 'Este campo está vacío en los primeros años de la serie (antes de 2001): esos días no se incluyen.'});
  for (const [sec, n, idc] of [['Total Interest-bearing Debt', 'toda la deuda que paga intereses', 'total'], ['Treasury Bills', 'letras del Tesoro (T-bills)', 'bills'], ['Treasury Notes', 'notas del Tesoro', 'notes'], ['Treasury Bonds', 'bonos del Tesoro', 'bonds'], ['Treasury Inflation-Protected Securities (TIPS)', 'TIPS', 'tips'], ['Federal Financing Bank', 'Federal Financing Bank', 'ffb']])
    nada({id: `ust_tasa_promedio_${idc}`, nombre: `Tasa de interés promedio sobre la deuda de EE. UU.: ${n}`, categoria: 'Tasas', etiquetas: ['tesoro', 'treasury', 'tasa promedio', 'fiscaldata'], adaptador: 'fiscaldata', args: {endpoint: 'v2/accounting/od/avg_interest_rates', campo: 'avg_interest_rate_amt', filtro: `security_desc:eq:${sec}`},
      unidad: '% anual', frecuencia: 'Mensual (fin de mes)', fuente_original: `${TF}, Average Interest Rates on U.S. Treasury Securities`, fuente_corto: `Tesoro de EE. UU. · tasas promedio · ${sec}`, licencia: TS, nota: 'Tasa promedio ponderada de los títulos en circulación (no la tasa de emisión de hoy).'});
  for (const [d, n, idc] of [['Colombia-Peso', 'peso colombiano', 'cop'], ['Mexico-Peso', 'peso mexicano', 'mxn'], ['Brazil-Real', 'real brasileño', 'brl'], ['Argentina-Peso', 'peso argentino', 'ars'], ['Chile-Peso', 'peso chileno', 'clp'], ['Canada-Dollar', 'dólar canadiense', 'cad'], ['China-Renminbi', 'yuan renminbi', 'cny'], ['Japan-Yen', 'yen', 'jpy'], ['Euro Zone-Euro', 'euro', 'eur'], ['United Kingdom-Pound', 'libra esterlina', 'gbp']])
    nada({id: `ust_cambio_${idc}`, nombre: `Tipo de cambio oficial del Tesoro de EE. UU. (reporte trimestral): ${n} por US$`, categoria: 'Divisas', etiquetas: ['tesoro', 'treasury', 'tipo de cambio', idc, 'fiscaldata'], adaptador: 'fiscaldata', args: {endpoint: 'v1/accounting/od/rates_of_exchange', campo: 'exchange_rate', campoFecha: 'effective_date', filtro: `country_currency_desc:eq:${d}`},
      unidad: `${n} por 1 US$`, frecuencia: 'Trimestral (fin de trimestre)', fuente_original: `${TF}, Treasury Reporting Rates of Exchange`, fuente_corto: `Tesoro de EE. UU. · Reporting Rates of Exchange · ${d}`, licencia: TS, nota: 'Tasas de reporte para las agencias federales (fin de trimestre), no cotizaciones de mercado diarias; para el dato diario usar FRED/Banco central. Fecha = effective_date: cuando el Tesoro corrige una tasa a mitad de trimestre publica una segunda fila con el mismo record_date y otra effective_date, y ambas se conservan.'});

  // Clima, Tierra y energía (NASA, NOAA, USGS: dominio público)
  const NA = 'Dominio público (obra del gobierno de EE. UU.; NASA)', NO = 'Dominio público (obra del gobierno de EE. UU.; NOAA)';
  for (const [r, n] of [['GLB', 'global'], ['NH', 'del hemisferio norte'], ['SH', 'del hemisferio sur']]) nada({id: `nasa_gistemp_${r.toLowerCase()}`, nombre: `Anomalía mensual de temperatura ${n} (NASA GISTEMP)`, categoria: 'Clima y energía', etiquetas: ['nasa', 'gistemp', 'temperatura', 'clima', r.toLowerCase()], adaptador: 'nasa_giss', args: {region: r}, unidad: '°C (anomalía respecto de 1951-1980)', frecuencia: 'Mensual',
    fuente_original: 'NASA Goddard Institute for Space Studies — GISTEMP v4', fuente_corto: `NASA GISTEMP v4 · ${r}`, licencia: NA + '; citar GISTEMP Team y Lenssen et al. (2024)', nota: 'Desde 1880. La base 1951-1980 es la de la fuente; otras series (OWID, Copernicus) usan bases distintas y no son comparables sin reajuste.'});
  for (const [arch, n, idc, col] of [['co2/co2_mm_mlo.csv', 'CO₂ atmosférico en Mauna Loa (media mensual)', 'co2_mlo', 'average'], ['co2/co2_mm_gl.csv', 'CO₂ atmosférico, media mundial mensual', 'co2_global', 'average'], ['ch4/ch4_mm_gl.csv', 'Metano (CH₄) atmosférico, media mundial mensual', 'ch4_global', 'average'], ['n2o/n2o_mm_gl.csv', 'Óxido nitroso (N₂O) atmosférico, media mundial mensual', 'n2o_global', 'average']])
    nada({id: `noaa_${idc}`, nombre: n, categoria: 'Clima y energía', etiquetas: ['noaa', 'gml', 'atmósfera', 'gases de efecto invernadero', idc], adaptador: 'noaa_gml', args: {archivo: arch, columna: col}, unidad: /co2/.test(arch) ? 'ppm' : 'ppb', frecuencia: 'Mensual',
      fuente_original: 'NOAA Global Monitoring Laboratory', fuente_corto: `NOAA GML · ${arch}`, licencia: NO + '; atribución solicitada por NOAA GML', nota: 'Los meses interpolados por NOAA (sdev negativa) se omiten.'});
  nada({id: 'noaa_oni', nombre: 'Índice Oceánico de El Niño (ONI)', categoria: 'Clima y energía', etiquetas: ['noaa', 'el niño', 'la niña', 'enso', 'oni'], adaptador: 'noaa_oni', args: {}, unidad: '°C (anomalía de TSM Niño 3.4)', frecuencia: 'Mensual (trimestres móviles)', fuente_original: 'NOAA Climate Prediction Center', fuente_corto: 'NOAA CPC · ONI', licencia: NO, nota: 'Desde 1950. Fecha = mes central del trimestre móvil.'});
  nada({id: 'usgs_sismos_m7_anual', nombre: 'Terremotos de magnitud 7 o más por año (mundo)', categoria: 'Clima y energía', etiquetas: ['usgs', 'terremotos', 'sismos', 'magnitud 7'], adaptador: 'usgs_sismos', args: {minmag: 7, desde: 1900}, unidad: 'Número por año', frecuencia: 'Anual', fuente_original: 'USGS — Earthquake Catalog (ComCat)', fuente_corto: 'USGS · ComCat · M ≥ 7', licencia: 'Dominio público (obra del gobierno de EE. UU.; USGS)', nota: 'Desde 1900, años completos. Descarga lenta (una petición por año).'});
  nada({id: 'co_crudo_produccion', nombre: 'Colombia — producción fiscalizada de petróleo crudo (mensual, nacional)', categoria: 'Energía', etiquetas: ['colombia', 'petróleo', 'crudo', 'anh', 'datos.gov.co'], adaptador: 'socrata_suma', args: {dataset: 'fdvb-hsrf', anio: 'vigencia', mes: 'mes', valor: 'produccion_bls'}, unidad: 'Barriles por mes', frecuencia: 'Mensual',
    fuente_original: 'Agencia Nacional de Hidrocarburos (ANH) — Producción fiscalizada de crudo, vía datos.gov.co', fuente_corto: 'ANH · crudo fiscalizado · datos.gov.co', licencia: 'CC BY-SA 4.0 (datos.gov.co); atribución: Agencia Nacional de Hidrocarburos', nota: 'Suma de todos los campos y operadores por mes (centésimas enteras, sin error de coma flotante); desde 2014. Licencia con compartir igual: no entra a la instantánea data/.'});
  return E;
}
