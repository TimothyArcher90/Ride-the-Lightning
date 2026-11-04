# Country data

Country-level indicators from the **World Bank (WDI, CC BY 4.0)** and the **IMF (World Economic Outlook, restricted terms)**. **72 countries × 59 indicators = 4248 possible series; 4002 exist** (the rest are not published by the source and are *not* created — never filled in).

Generated from live data on **2026-11-04** by `scripts/generar-docs-paises.mjs` (counts and years below come from `datos/paises-ultimos.json`, refreshed from the sources).

## How it works

- Each (country, indicator) pair is a catalogue series with id `pais_<ISO3>_<indicator>` (e.g. `pais_COL_pib`), full history downloaded on demand through the `worldbank` / `imf` adapters.
- `fichaPais(iso3)` (`servidor/paises.mjs`) returns the **latest** value of every indicator with its year, source URL and verification notes; `compararPaises([iso3…], indicator)` returns the series ids to compare countries and lists any country that lacks that series in `.omitidos`.
- A series that the source does not publish for a country has no catalogue entry; `fichaPais` returns `valor: null` plus the reason. Nothing is interpolated or estimated by us.
- **The latest year differs by country and indicator** (see the lag table). Never put two countries side by side without printing each value's year.
- IMF series (`deuda_pib`, `deficit_pib`) are **restricted**: the IMF terms require written permission for systematic download and commercial reuse. They are catalogued but never redistributed from this repository (see [DATA_SOURCES.md](DATA_SOURCES.md)). The latest IMF years can be estimates, and projections are excluded.

## Countries

| ISO3 | Country | Region | Indicators with data (of 59) | Latest-year median | Oldest latest year | Not published by the source |
|---|---|---|---:|---:|---:|---|
| USA | United States | North America | 54 | 2024 | 2021 | alfabetismo, deuda_externa, deuda_externa_ingreso, servicio_deuda, tasa_depositos |
| CAN | Canada | North America | 55 | 2025 | 2008 | alfabetismo, deuda_externa, deuda_externa_ingreso, servicio_deuda |
| MEX | Mexico | Latin America & Caribbean | 59 | 2025 | 2021 | — |
| CHN | China | Asia | 59 | 2024 | 2012 | — |
| JPN | Japan | Asia | 55 | 2024 | 1993 | alfabetismo, deuda_externa, deuda_externa_ingreso, servicio_deuda |
| IND | India | Asia | 57 | 2025 | 2020 | tasa_depositos, tipo_cambio_real |
| KOR | South Korea | Asia | 56 | 2025 | 2008 | deuda_externa, deuda_externa_ingreso, servicio_deuda |
| IDN | Indonesia | Asia | 58 | 2025 | 2009 | tipo_cambio_real |
| SGP | Singapore | Asia | 54 | 2025 | 2020 | gini, remesas, deuda_externa, deuda_externa_ingreso, servicio_deuda |
| VNM | Vietnam | Asia | 57 | 2024 | 2004 | tipo_cambio_real, ingresos_gobierno |
| THA | Thailand | Asia | 58 | 2025 | 2021 | tipo_cambio_real |
| PHL | Philippines | Asia | 59 | 2025 | 2019 | — |
| DEU | Germany | Europe | 52 | 2025 | 2021 | alfabetismo, deuda_externa, deuda_externa_ingreso, servicio_deuda, tasa_real, tasa_prestamos, tasa_depositos |
| GBR | United Kingdom | Europe | 55 | 2025 | 1998 | alfabetismo, deuda_externa, deuda_externa_ingreso, servicio_deuda |
| FRA | France | Europe | 53 | 2025 | 2017 | alfabetismo, deuda_externa, deuda_externa_ingreso, servicio_deuda, tasa_real, tasa_prestamos |
| ITA | Italy | Europe | 55 | 2025 | 2014 | deuda_externa, deuda_externa_ingreso, servicio_deuda, tasa_depositos |
| ESP | Spain | Europe | 53 | 2025 | 2021 | deuda_externa, deuda_externa_ingreso, servicio_deuda, tasa_real, tasa_prestamos, tasa_depositos |
| RUS | Russia | Europe | 59 | 2024 | 2021 | — |
| POL | Poland | Europe | 53 | 2025 | 1978 | deuda_externa, deuda_externa_ingreso, servicio_deuda, tasa_real, tasa_prestamos, tasa_depositos |
| NLD | Netherlands | Europe | 55 | 2025 | 2013 | alfabetismo, deuda_externa, deuda_externa_ingreso, servicio_deuda |
| CHE | Switzerland | Europe | 55 | 2025 | 2021 | alfabetismo, deuda_externa, deuda_externa_ingreso, servicio_deuda |
| IRL | Ireland | Europe | 52 | 2025 | 2018 | alfabetismo, deuda_externa, deuda_externa_ingreso, servicio_deuda, tasa_real, tasa_prestamos, tasa_depositos |
| SWE | Sweden | Europe | 55 | 2025 | 2003 | alfabetismo, deuda_externa, deuda_externa_ingreso, servicio_deuda |
| TUR | Turkey | Europe & Central Asia | 56 | 2025 | 2021 | tasa_real, tasa_prestamos, tipo_cambio_real |
| AUS | Australia | Oceania | 55 | 2025 | 2019 | alfabetismo, deuda_externa, deuda_externa_ingreso, servicio_deuda |
| SAU | Saudi Arabia | Middle East & North Africa | 52 | 2025 | 2017 | gini, deuda_externa, deuda_externa_ingreso, servicio_deuda, tasa_real, tasa_prestamos, tasa_depositos |
| ISR | Israel | Middle East & North Africa | 56 | 2025 | 1983 | deuda_externa, deuda_externa_ingreso, servicio_deuda |
| ARE | United Arab Emirates | Middle East & North Africa | 51 | 2024 | 2009 | remesas, deuda_externa, deuda_externa_ingreso, servicio_deuda, tasa_real, tasa_prestamos, tasa_depositos, tipo_cambio_real |
| EGY | Egypt | Middle East & North Africa | 58 | 2025 | 2008 | tipo_cambio_real |
| ZAF | South Africa | Sub-Saharan Africa | 59 | 2025 | 2021 | — |
| NGA | Nigeria | Sub-Saharan Africa | 56 | 2025 | 1960 | inversion, ahorro, ingresos_gobierno |
| COL | Colombia | Latin America & Caribbean | 59 | 2025 | 2020 | — |
| BRA | Brazil | Latin America & Caribbean | 59 | 2025 | 2021 | — |
| ARG | Argentina | Latin America & Caribbean | 58 | 2025 | 2020 | tipo_cambio_real |
| CHL | Chile | Latin America & Caribbean | 56 | 2025 | 2017 | deuda_externa, deuda_externa_ingreso, servicio_deuda |
| PER | Peru | Latin America & Caribbean | 58 | 2024 | 2017 | tipo_cambio_real |
| ECU | Ecuador | Latin America & Caribbean | 56 | 2025 | 2000 | tasa_real, tasa_prestamos, tipo_cambio_real |
| URY | Uruguay | Latin America & Caribbean | 56 | 2025 | 1996 | deuda_externa, deuda_externa_ingreso, servicio_deuda |
| PAN | Panama | Latin America & Caribbean | 55 | 2024 | 2006 | deuda_externa, deuda_externa_ingreso, servicio_deuda, tipo_cambio_real |
| CRI | Costa Rica | Latin America & Caribbean | 56 | 2025 | 2011 | deuda_externa, deuda_externa_ingreso, servicio_deuda |
| VEN | Venezuela | Latin America & Caribbean | 54 | 2024 | 2002 | deuda_externa, deuda_externa_ingreso, servicio_deuda, ingresos_gobierno, deuda_pib |
| BOL | Bolivia | Latin America & Caribbean | 57 | 2024 | 2007 | matricula_terciaria, capitalizacion_bolsa |
| PRY | Paraguay | Latin America & Caribbean | 59 | 2024 | 1999 | — |
| DOM | Dominican Republic | Latin America & Caribbean | 58 | 2025 | 2021 | capitalizacion_bolsa |
| GTM | Guatemala | Latin America & Caribbean | 57 | 2025 | 2020 | tipo_cambio_real, capitalizacion_bolsa |
| HND | Honduras | Latin America & Caribbean | 57 | 2025 | 2020 | tipo_cambio_real, capitalizacion_bolsa |
| SLV | El Salvador | Latin America & Caribbean | 54 | 2025 | 2021 | tasa_real, tasa_prestamos, tasa_depositos, tipo_cambio_real, capitalizacion_bolsa |
| NIC | Nicaragua | Latin America & Caribbean | 58 | 2025 | 2014 | capitalizacion_bolsa |
| CUB | Cuba | Latin America & Caribbean | 43 | 2024 | 1974 | inflacion, gini, cuenta_corriente, remesas, deuda_externa, deuda_externa_ingreso, servicio_deuda, tasa_real, tasa_prestamos, tasa_depositos, tipo_cambio_real, ingresos_gobierno, credito_privado, capitalizacion_bolsa, deuda_pib, deficit_pib |
| JAM | Jamaica | Latin America & Caribbean | 53 | 2025 | 1999 | exportaciones, importaciones, apertura_comercial, tipo_cambio_real, inversion, ahorro |
| PRT | Portugal | Europe | 53 | 2025 | 2011 | deuda_externa, deuda_externa_ingreso, servicio_deuda, tasa_real, tasa_prestamos, tasa_depositos |
| BEL | Belgium | Europe | 52 | 2025 | 2018 | alfabetismo, deuda_externa, deuda_externa_ingreso, servicio_deuda, tasa_real, tasa_prestamos, tasa_depositos |
| AUT | Austria | Europe | 52 | 2025 | 2021 | alfabetismo, deuda_externa, deuda_externa_ingreso, servicio_deuda, tasa_real, tasa_prestamos, tasa_depositos |
| DNK | Denmark | Europe | 52 | 2025 | 2004 | alfabetismo, deuda_externa, deuda_externa_ingreso, servicio_deuda, tasa_real, tasa_prestamos, tasa_depositos |
| NOR | Norway | Europe | 55 | 2025 | 2019 | alfabetismo, deuda_externa, deuda_externa_ingreso, servicio_deuda |
| FIN | Finland | Europe | 52 | 2025 | 2004 | alfabetismo, deuda_externa, deuda_externa_ingreso, servicio_deuda, tasa_real, tasa_prestamos, tasa_depositos |
| GRC | Greece | Europe | 53 | 2025 | 2009 | deuda_externa, deuda_externa_ingreso, servicio_deuda, tasa_real, tasa_prestamos, tasa_depositos |
| CZE | Czechia | Europe | 55 | 2025 | 2021 | alfabetismo, deuda_externa, deuda_externa_ingreso, servicio_deuda |
| HUN | Hungary | Europe | 56 | 2025 | 1980 | deuda_externa, deuda_externa_ingreso, servicio_deuda |
| ROU | Romania | Europe | 56 | 2025 | 2021 | deuda_externa, deuda_externa_ingreso, servicio_deuda |
| UKR | Ukraine | Europe | 59 | 2025 | 2001 | — |
| PAK | Pakistan | Asia | 58 | 2025 | 2021 | ingresos_gobierno |
| BGD | Bangladesh | Asia | 58 | 2025 | 2021 | tipo_cambio_real |
| MYS | Malaysia | Asia | 56 | 2025 | 2021 | deuda_externa, deuda_externa_ingreso, servicio_deuda |
| IRN | Iran | Middle East & North Africa | 58 | 2024 | 1982 | tipo_cambio_real |
| IRQ | Iraq | Middle East & North Africa | 57 | 2024 | 1989 | tipo_cambio_real, capitalizacion_bolsa |
| QAT | Qatar | Middle East & North Africa | 53 | 2025 | 2014 | deuda_externa, deuda_externa_ingreso, servicio_deuda, tipo_cambio_real, inversion, ingresos_gobierno |
| MAR | Morocco | Middle East & North Africa | 57 | 2025 | 2013 | tasa_real, tasa_prestamos |
| KEN | Kenya | Sub-Saharan Africa | 58 | 2025 | 2000 | tipo_cambio_real |
| ETH | Ethiopia | Sub-Saharan Africa | 57 | 2024 | 2008 | tipo_cambio_real, capitalizacion_bolsa |
| GHA | Ghana | Sub-Saharan Africa | 57 | 2024 | 2016 | tasa_real, tasa_prestamos |
| NZL | New Zealand | Oceania | 54 | 2024 | 2021 | gini, alfabetismo, deuda_externa, deuda_externa_ingreso, servicio_deuda |

## Indicators

| Key | Indicator | Theme | Source / code | Unit | Countries with data (of 72) | Latest year: min / median / max |
|---|---|---|---|---|---:|---|
| `pib` | GDP (current US$) | Economy | World Bank `NY.GDP.MKTP.CD` | current US$ | 72 | 2020 / 2025 / 2025 |
| `pib_pc` | GDP per capita (current US$) | Economy | World Bank `NY.GDP.PCAP.CD` | current US$ per capita | 72 | 2020 / 2025 / 2025 |
| `crec_pib` | Real GDP growth | Economy | World Bank `NY.GDP.MKTP.KD.ZG` | % per year | 72 | 2024 / 2025 / 2025 |
| `inflacion` | Inflation (CPI, annual change) | Prices | World Bank `FP.CPI.TOTL.ZG` | % per year | 71 | 2016 / 2025 / 2025 |
| `desempleo` | Unemployment (ILO modelled estimate) | Labour | World Bank `SL.UEM.TOTL.ZS` | % of the labour force | 72 | 2021 / 2025 / 2025 |
| `poblacion` | Total population | Population | World Bank `SP.POP.TOTL` | persons | 72 | 2025 / 2025 / 2025 |
| `esperanza_vida` | Life expectancy at birth | Population | World Bank `SP.DYN.LE00.IN` | years | 72 | 2024 / 2024 / 2024 |
| `gini` | Gini index | Population | World Bank `SI.POV.GINI` | index 0–100 (100 = maximum inequality) | 68 | 2006 / 2023 / 2025 |
| `cuenta_corriente` | Current account balance | External sector | World Bank `BN.CAB.XOKA.GD.ZS` | % of GDP | 71 | 2000 / 2025 / 2025 |
| `reservas` | Total reserves (incl. gold) | External sector | World Bank `FI.RES.TOTL.CD` | current US$ | 72 | 1974 / 2025 / 2025 |
| `exportaciones` | Exports of goods and services | External sector | World Bank `NE.EXP.GNFS.ZS` | % of GDP | 71 | 1960 / 2025 / 2025 |
| `ied` | Foreign direct investment, net inflows | External sector | World Bank `BX.KLT.DINV.WD.GD.ZS` | % of GDP | 72 | 2020 / 2025 / 2025 |
| `energia_pc` | Energy use per capita | Energy | World Bank `EG.USE.PCAP.KG.OE` | kg of oil equivalent per capita | 72 | 2024 / 2024 / 2024 |
| `electricidad_pc` | Electric power consumption per capita | Energy | World Bank `EG.USE.ELEC.KH.PC` | kWh per capita | 72 | 2024 / 2024 / 2025 |
| `renovables_energia` | Renewable energy share of final consumption | Energy | World Bank `EG.FEC.RNEW.ZS` | % of final consumption | 72 | 2021 / 2021 / 2021 |
| `renovables_electricidad` | Renewable share of electricity output | Energy | World Bank `EG.ELC.RNEW.ZS` | % of generation | 72 | 2012 / 2021 / 2021 |
| `acceso_electricidad` | Access to electricity | Energy | World Bank `EG.ELC.ACCS.ZS` | % of the population | 72 | 2024 / 2024 / 2024 |
| `co2_total` | CO2 emissions (excl. land use) | Climate | World Bank `EN.GHG.CO2.MT.CE.AR5` | Mt CO2 | 72 | 2024 / 2024 / 2024 |
| `co2_pc` | CO2 emissions per capita (excl. land use) | Climate | World Bank `EN.GHG.CO2.PC.CE.AR5` | t CO2 per capita | 72 | 2024 / 2024 / 2024 |
| `ghg_total` | Total greenhouse gas emissions (excl. land use) | Climate | World Bank `EN.GHG.ALL.MT.CE.AR5` | Mt CO2 equivalent | 72 | 2024 / 2024 / 2024 |
| `gasto_salud` | Current health expenditure | Health | World Bank `SH.XPD.CHEX.GD.ZS` | % of GDP | 72 | 2021 / 2023 / 2024 |
| `gasto_salud_pc` | Current health expenditure per capita | Health | World Bank `SH.XPD.CHEX.PC.CD` | current US$ per capita | 72 | 2020 / 2023 / 2024 |
| `mortalidad_infantil` | Infant mortality (under 1) | Health | World Bank `SP.DYN.IMRT.IN` | per 1,000 live births | 72 | 2024 / 2024 / 2024 |
| `mortalidad_menores5` | Under-5 mortality | Health | World Bank `SH.DYN.MORT` | per 1,000 live births | 72 | 2024 / 2024 / 2024 |
| `medicos` | Physicians | Health | World Bank `SH.MED.PHYS.ZS` | per 1,000 people | 72 | 2017 / 2022 / 2023 |
| `fertilidad` | Fertility rate | Population | World Bank `SP.DYN.TFRT.IN` | children per woman | 72 | 2024 / 2024 / 2024 |
| `crec_poblacion` | Population growth | Population | World Bank `SP.POP.GROW` | % per year | 72 | 2025 / 2025 / 2025 |
| `urbanizacion` | Urban population share | Population | World Bank `SP.URB.TOTL.IN.ZS` | % of total population | 72 | 2025 / 2025 / 2025 |
| `gasto_educacion` | Government expenditure on education | Education | World Bank `SE.XPD.TOTL.GD.ZS` | % of GDP | 72 | 1989 / 2022 / 2025 |
| `matricula_secundaria` | Secondary school enrolment (gross) | Education | World Bank `SE.SEC.ENRR` | % gross | 72 | 2007 / 2024 / 2025 |
| `matricula_terciaria` | Tertiary school enrolment (gross) | Education | World Bank `SE.TER.ENRR` | % gross | 71 | 2005 / 2024 / 2025 |
| `alfabetismo` | Adult literacy rate (15+) | Education | World Bank `SE.ADT.LITR.ZS` | % of population 15+ | 54 | 1978 / 2021 / 2024 |
| `importaciones` | Imports of goods and services | Trade | World Bank `NE.IMP.GNFS.ZS` | % of GDP | 71 | 1960 / 2025 / 2025 |
| `apertura_comercial` | Trade (exports + imports) | Trade | World Bank `NE.TRD.GNFS.ZS` | % of GDP | 71 | 1960 / 2025 / 2025 |
| `exp_mercancias` | Merchandise exports | Trade | World Bank `TX.VAL.MRCH.CD.WT` | current US$ | 72 | 2025 / 2025 / 2025 |
| `imp_mercancias` | Merchandise imports | Trade | World Bank `TM.VAL.MRCH.CD.WT` | current US$ | 72 | 2025 / 2025 / 2025 |
| `remesas` | Personal remittances received | External sector | World Bank `BX.TRF.PWKR.DT.GD.ZS` | % of GDP | 69 | 2004 / 2025 / 2025 |
| `deuda_externa` | External debt stocks, total | External debt | World Bank `DT.DOD.DECT.CD` | current US$ | 34 | 2022 / 2024 / 2024 |
| `deuda_externa_ingreso` | External debt stocks / gross national income | External debt | World Bank `DT.DOD.DECT.GN.ZS` | % of GNI | 34 | 2022 / 2024 / 2024 |
| `servicio_deuda` | Total debt service (external) | External debt | World Bank `DT.TDS.DECT.EX.ZS` | % of exports of goods, services and primary income | 34 | 2024 / 2024 / 2024 |
| `tasa_real` | Real interest rate | Interest rates | World Bank `FR.INR.RINR` | % per year | 53 | 2006 / 2024 / 2025 |
| `tasa_prestamos` | Lending interest rate | Interest rates | World Bank `FR.INR.LEND` | % per year | 53 | 2006 / 2024 / 2025 |
| `tasa_depositos` | Deposit interest rate | Interest rates | World Bank `FR.INR.DPST` | % per year | 55 | 1998 / 2025 / 2025 |
| `tipo_cambio` | Official exchange rate (LCU per US$, period average) | Exchange rates | World Bank `PA.NUS.FCRF` | local currency per US$ | 72 | 1974 / 2025 / 2025 |
| `tipo_cambio_real` | Real effective exchange rate index | Exchange rates | World Bank `PX.REX.REER` | index (base year per source) | 50 | 2016 / 2025 / 2025 |
| `ppa` | PPP conversion factor | Exchange rates | World Bank `PA.NUS.PPP` | local currency per international US$ | 72 | 2011 / 2025 / 2025 |
| `part_laboral` | Labour force participation (15+) | Labour | World Bank `SL.TLF.CACT.ZS` | % of population 15+ | 72 | 2021 / 2025 / 2025 |
| `desempleo_juvenil` | Youth unemployment (15-24, ILO modelled) | Labour | World Bank `SL.UEM.1524.ZS` | % of the labour force aged 15-24 | 72 | 2021 / 2025 / 2025 |
| `valor_industria` | Industry value added | Economic structure | World Bank `NV.IND.TOTL.ZS` | % of GDP | 72 | 2011 / 2025 / 2025 |
| `valor_agro` | Agriculture value added | Economic structure | World Bank `NV.AGR.TOTL.ZS` | % of GDP | 72 | 2011 / 2025 / 2025 |
| `valor_servicios` | Services value added | Economic structure | World Bank `NV.SRV.TOTL.ZS` | % of GDP | 72 | 2011 / 2025 / 2025 |
| `inversion` | Gross fixed capital formation | Economic structure | World Bank `NE.GDI.FTOT.ZS` | % of GDP | 69 | 2009 / 2025 / 2025 |
| `ahorro` | Gross savings | Economic structure | World Bank `NY.GDS.TOTL.ZS` | % of GDP | 70 | 2022 / 2025 / 2025 |
| `ingresos_gobierno` | Central government revenue (excl. grants) | Public finance | World Bank `GC.REV.XGRT.GD.ZS` | % of GDP | 66 | 1993 / 2024 / 2024 |
| `credito_privado` | Domestic credit to private sector by banks | Finance | World Bank `FS.AST.PRVT.GD.ZS` | % of GDP | 71 | 2008 / 2025 / 2025 |
| `capitalizacion_bolsa` | Market capitalisation of listed companies | Finance | World Bank `CM.MKT.LCAP.GD.ZS` | % of GDP | 63 | 1996 / 2025 / 2025 |
| `internet` | Individuals using the internet | Technology | World Bank `IT.NET.USER.ZS` | % of the population | 72 | 2024 / 2024 / 2025 |
| `deuda_pib` | General government gross debt (IMF) | Public finance | IMF (restricted) `GGXWDG_NGDP` | % of GDP | 70 | 2025 / 2025 / 2025 |
| `deficit_pib` | General government net lending/borrowing (IMF) | Public finance | IMF (restricted) `GGXCNL_NGDP` | % of GDP | 71 | 2025 / 2025 / 2025 |

## Coverage by theme

Number of (country, indicator) series that exist, per theme (maximum = countries × indicators in the theme).

| Theme | Indicators | Series that exist | Possible | Coverage |
|---|---:|---:|---:|---:|
| Economy | 3 | 216 | 216 | 100% |
| Prices | 1 | 71 | 72 | 99% |
| Labour | 3 | 216 | 216 | 100% |
| Population | 6 | 428 | 432 | 99% |
| External sector | 5 | 355 | 360 | 99% |
| Energy | 5 | 360 | 360 | 100% |
| Climate | 3 | 216 | 216 | 100% |
| Health | 5 | 360 | 360 | 100% |
| Education | 4 | 269 | 288 | 93% |
| Trade | 4 | 286 | 288 | 99% |
| External debt | 3 | 102 | 216 | 47% |
| Interest rates | 3 | 161 | 216 | 75% |
| Exchange rates | 3 | 194 | 216 | 90% |
| Economic structure | 5 | 355 | 360 | 99% |
| Public finance | 3 | 207 | 216 | 96% |
| Finance | 2 | 134 | 144 | 93% |
| Technology | 1 | 72 | 72 | 100% |

## Cross-checks between sources (World Bank vs IMF vs Eurostat)

`scripts/verificar-paises.mjs` compares, at the same reference year, GDP, inflation and population between the World Bank and the IMF for every country, and against Eurostat for the eight EU members in the list; debt is compared against Eurostat / the U.S. Treasury where the definition is the same. Last run: **2026-11-04**.

| Indicator | Match | Minor difference | Discrepancy | Different definition (informational) | No comparison |
|---|---:|---:|---:|---:|---:|
| GDP (current US$) | 57 | 12 | 2 | 0 | 1 |
| Inflation (CPI, annual change) | 60 | 5 | 6 | 0 | 0 |
| Total population | 47 | 10 | 14 | 0 | 1 |
| General government gross debt (IMF) | 8 | 0 | 0 | 42 | 0 |

Thresholds: GDP and population ≤1% match, ≤3–5% minor, above that discrepancy; inflation ≤0.3 pp / ≤1 pp; debt ≤2 pp / ≤5 pp. Genuine discrepancies found (22) are not errors in our pipeline: they are real differences between publishers' definitions or vintages, and the country sheet shows the World Bank value with a note:

| Country | Indicator | Year | World Bank | IMF | Other source | Difference |
|---|---|---:|---:|---:|---|---:|
| Ireland | GDP (current US$) | 2025 | 721701359046.313 | 680362000000 | — | 5.728 % |
| Sweden | Inflation (CPI, annual change) | 2025 | 0.679015259300199 | 2.6 | 2.6 (Eurostat (media anual, CP00)) | 1.921 pp |
| United Arab Emirates | GDP (current US$) | 2024 | 552324919095.872 | 580959000000 | — | 5.184 % |
| Egypt | Inflation (CPI, annual change) | 2025 | 14.0735136645933 | 20.4 | — | 6.326 pp |
| Egypt | Total population | 2025 | 118365995 | 107900000 | — | 8.842 % |
| Argentina | Total population | 2025 | 45851378 | 47474000 | — | 3.539 % |
| Costa Rica | Total population | 2025 | 5152950 | 5370000 | — | 4.212 % |
| Paraguay | Total population | 2025 | 7013078 | 6417000 | — | 8.5 % |
| Dominican Republic | Total population | 2025 | 11520487 | 10885000 | — | 5.516 % |
| Nicaragua | Total population | 2025 | 7007502 | 6664000 | — | 4.902 % |
| Finland | Inflation (CPI, annual change) | 2025 | 0.332787049734142 | 1.8 | — | 1.467 pp |
| Ukraine | Total population | 2025 | 38980376 | 32863000 | — | 15.693 % |
| Pakistan | Total population | 2025 | 255219554 | 240490000 | — | 5.771 % |
| Bangladesh | Inflation (CPI, annual change) | 2025 | 8.7687628116114 | 10 | — | 1.231 pp |
| Malaysia | Total population | 2025 | 35977838 | 33852000 | — | 5.909 % |
| Iran | Inflation (CPI, annual change) | 2025 | 42.1712244965444 | 50.6 | — | 8.429 pp |
| Iran | Total population | 2025 | 92417681 | 87057000 | — | 5.8 % |
| Iraq | Total population | 2025 | 47020774 | 45521000 | — | 3.19 % |
| Qatar | Total population | 2025 | 2972215 | 3175000 | — | 6.823 % |
| Kenya | Total population | 2025 | 57532493 | 53354000 | — | 7.263 % |
| Ethiopia | Inflation (CPI, annual change) | 2025 | 13.2296432836808 | 16 | — | 2.77 pp |
| Ethiopia | Total population | 2025 | 135472051 | 110600000 | — | 18.36 % |

## Gotchas

- **Latest year is not comparable across countries**: macro indicators are usually the last 1–2 years, but survey- or registry-based ones can be much older for some countries (see the min column: e.g. education spending, literacy and Gini). The lag table gives min / median / max.
- **IMF "latest" years can still be estimates**; projections (years after the current year minus one) are excluded by the adapter.
- **Gini / poverty** are survey-based and published irregularly; several countries have no value at all (e.g. Singapore, Saudi Arabia).
- **External-debt indicators exist only for low- and middle-income countries** (World Bank International Debt Statistics); high-income countries are absent by design.
- **Interest-rate and exchange-rate series come from the IMF International Financial Statistics, republished by the World Bank**: they are in the catalogue but are not part of the redistributable snapshot in `data/`.
- **Definitions differ**: World Bank "central government debt" (`GC.DOD.TOTL.GD.ZS`) is not the IMF "general government gross debt"; US federal debt from the Treasury is not either of them.
- The World Bank API accepts a list of countries per request; we batch 40 at a time with `mrnev=1` (most recent non-empty value) so the whole sheet costs ~120 requests.
