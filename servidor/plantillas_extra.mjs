// Plantillas del VISUALIZADOR UNIVERSAL: una por cada capa de motor/capas_extra.js (2026-11-04).
// Igual que plantillas.mjs: convierten «qué dato y cómo verlo» en capas con tiempos; no tocan cifras. Se enganchan desde
// plantillas.mjs (PLANTILLAS = [...base, ...PLANTILLAS_EXTRA]; generar() delega aquí con generarExtra).
// TODO(diseno): los tiempos de entrada/lectura ya respetan MOV.lectura (≥ 3 s con todo visible); si motor/diseno.js cambia MOV, ajustar `dur`.

import {t, registrar} from '../motor/idioma.js';

registrar('pe', {
  radar: {es: 'Cada eje se normaliza dentro de la historia completa de su propia serie: 0 = su mínimo histórico, 100 = su máximo histórico. Dice DÓNDE está cada indicador dentro de su rango, no su nivel absoluto.', en: "Each axis is normalized within the full history of its own series: 0 = its historical low, 100 = its historical high. It tells you WHERE each indicator sits within its range, not its absolute level."},
  radar_tabla: {es: 'Los ejes comparten una escala común de 0 a un máximo redondo; los valores de la tabla deben venir en la misma unidad o ya normalizados.', en: 'The axes share a common scale from 0 to a round maximum; the table values must come in the same unit or already normalized.'},
  apilada100: {es: 'Cada franja es su valor ÷ la suma de todas las series en ese momento. Solo se usan los momentos en que todas las series tienen dato.', en: 'Each band is its value ÷ the sum of all series at that point. Only the points at which every series has data are used.'},
  apilada: {es: 'La altura total es la suma exacta de las franjas. Solo se usan los momentos en que todas las series tienen dato.', en: 'The total height is the exact sum of the bands. Only the points at which every series has data are used.'},
  velas_ohlc: {es: 'Velas con apertura, máximo, mínimo y cierre reales de la fuente.', en: "Candlesticks with the source's actual open, high, low and close."},
  velas_cierres: {es: 'LIMITACIÓN: la fuente solo trae cierres diarios. Cada vela agrupa un periodo (abre = primer cierre, cierra = último cierre, mechas = mayor y menor cierre); NO son los extremos intradía. Con columnas OHLC reales las velas serían exactas.', en: 'LIMITATION: the source only provides daily closes. Each candle groups a period (open = first close, close = last close, wicks = highest and lowest close); they are NOT intraday extremes. With real OHLC columns the candles would be exact.'},
  retornos: {es: 'Los retornos son v[t]/v[t−1] − 1 entre filas consecutivas; el rango mostrado va del percentil 0,5 al 99,5 y las colas se agrupan en las barras de los extremos.', en: 'Returns are v[t]/v[t−1] − 1 between consecutive rows; the range shown runs from the 0.5th to the 99.5th percentile and the tails are grouped into the bars at the ends.'},
  histograma: {es: 'Cada barra es el % de las observaciones que caen en ese rango de valores.', en: 'Each bar is the % of observations that fall in that range of values.'},
  dumbbell: {es: 'Dos puntos por fila en una misma escala; el cambio (%) es actual ÷ anterior − 1.', en: 'Two dots per row on a single scale; the change (%) is current ÷ previous − 1.'},
  calendario: {es: 'Retorno mensual = último cierre del mes ÷ último cierre del mes anterior − 1 (o diario, si eliges ese modo). El color se satura en el percentil 95 de los retornos, y se declara.', en: "Monthly return = month's last close ÷ previous month's last close − 1 (or daily, if you pick that mode). The color saturates at the 95th percentile of returns, and this is stated."},
  agrupadas: {es: 'Los momentos se reparten de forma uniforme entre las filas en que todas las series tienen dato, incluyendo la primera y la última.', en: 'The points are spread evenly across the rows in which every series has data, including the first and the last.'},
  barras_decada: {es: 'Una barra por década (año múltiplo de 10) más el primer y el último dato de la serie, todas con valores reales de la fuente; las barras parten de cero y no se interpola ningún año.', en: 'One bar per decade (year divisible by 10) plus the first and last data point of the series, all with actual values from the source; bars start at zero and no year is interpolated.'},
  bullet: {es: 'La meta por defecto es la mediana de la historia de cada serie (calculada de los datos). Una meta propia solo se acepta con fuente verificada.', en: "The default target is the median of each series' history (calculated from the data). A custom target is only accepted with a verified source."},
  bandas: {es: 'Para cada mes, mínimo, máximo y percentiles 25 y 75 de los años anteriores; encima el año elegido (por defecto el último con datos). No se proyecta nada.', en: 'For each month, the minimum, maximum and 25th and 75th percentiles of the previous years; on top, the chosen year (by default the latest with data). Nothing is projected.'},
  pictograma: {es: 'Cada cuadro vale una unidad redonda elegida para que la parte mayor quepa en una fila; se declara en pantalla y los cuadros incompletos son fracciones exactas.', en: 'Each square is worth a round unit chosen so the largest part fits in one row; this is stated on screen and partial squares are exact fractions.'},
  ranking: {es: 'Barras ordenadas de mayor a menor, proporcionales al valor y desde 0. El código sale del texto anterior a « · » en el concepto; no se usan banderas.', en: 'Bars sorted from largest to smallest, proportional to the value and starting at 0. The code comes from the text before " · " in the concept; no flags are used.'},
  e_desconocida: {es: 'Plantilla extra desconocida: {p}', en: 'Unknown extra template: {p}'},
});

export const PLANTILLAS_EXTRA = [
  {id: 'radar', nombre: 'Perfil en un radar', descripcion: 'Varios indicadores en un solo polígono: cada eje va de su mínimo histórico (0) a su máximo histórico (100) y el punto es el último dato. Muestra dónde está fuerte o débil un país o una empresa respecto a su propia historia.', necesita: {min: 3, max: 8}, ayuda: 'Elige de 3 a 8 datos distintos de la misma entidad.'},
  {id: 'radar_tabla', datos: 'categorias', nombre: 'Radar de una tabla', descripcion: 'Un radar con las filas de una tabla (concepto, valor y, si quieres, anterior) en una escala común que se declara en pantalla.', necesita: {min: 1, max: 1}, ayuda: 'Necesita una tabla de categorías (concepto, valor, y opcional «anterior»).'},
  {id: 'apilada', nombre: 'Composición en el tiempo (área apilada)', descripcion: 'Franjas apiladas: cuánto aporta cada parte al total y cómo cambia con los años. La altura es la suma exacta.', necesita: {min: 2, max: 8}, ayuda: 'Elige de 2 a 8 datos de la misma unidad (partes de un total).'},
  {id: 'apilada100', nombre: 'Peso de cada parte en el tiempo (100 %)', descripcion: 'Área apilada al 100 %: qué porcentaje del total representa cada parte en cada momento.', necesita: {min: 2, max: 8}, ayuda: 'Elige de 2 a 8 datos de la misma unidad (partes de un total).'},
  {id: 'velas', nombre: 'Velas (precio)', descripcion: 'Velas japonesas verdes y rojas. Con columnas de apertura, máximo, mínimo y cierre son exactas (y con volumen, se dibuja abajo); con solo cierres diarios, cada vela agrupa un periodo y se declara.', necesita: {min: 1, max: 5}, ayuda: 'Elige 1 serie diaria de precios (solo cierres) o 4–5 columnas: apertura, máximo, mínimo, cierre y volumen.'},
  {id: 'histograma', nombre: '¿Cómo se distribuye? (valores)', descripcion: 'Un histograma de los valores de la serie: en qué rango pasó más tiempo, con la mediana y el último valor marcados.', necesita: {min: 1, max: 1}, ayuda: 'Elige 1 serie con al menos 30 datos.'},
  {id: 'retornos', nombre: '¿Cómo se distribuyen los retornos?', descripcion: 'Un histograma de los cambios porcentuales entre un dato y el siguiente: qué tan comunes son las subidas y caídas grandes, con la mediana y el último retorno marcados.', necesita: {min: 1, max: 1}, ayuda: 'Elige 1 serie de precios o niveles con al menos 30 datos.'},
  {id: 'dumbbell', datos: 'categorias', nombre: 'Antes y después por categoría', descripcion: 'Dos puntos unidos por una línea en cada fila: el valor anterior y el actual, con el cambio calculado.', necesita: {min: 1, max: 1}, ayuda: 'Necesita una tabla de categorías con columnas concepto, valor y anterior.'},
  {id: 'dumbbell_series', nombre: 'Antes y después de cada dato', descripcion: 'Una fila por dato, con un punto en el primer momento y otro en el último, en una escala común. Verde si subió, rojo si bajó.', necesita: {min: 2, max: 8}, ayuda: 'Elige de 2 a 8 datos de la misma unidad.'},
  {id: 'calendario', nombre: 'Calendario de calor', descripcion: 'Una casilla por mes (o por día) y año, coloreada por el retorno: verde sube, rojo baja. Se ve la estacionalidad y los años malos de un vistazo.', necesita: {min: 1, max: 1}, ayuda: 'Elige 1 serie diaria de precios.'},
  {id: 'agrupadas', nombre: 'Barras agrupadas por año', descripcion: 'Un grupo por dato con una barra por momento (por ejemplo 1990, 2005, 2020), todas en la misma escala desde 0.', necesita: {min: 2, max: 8}, ayuda: 'Elige de 2 a 8 datos de la misma unidad.'},
  {id: 'barras_decada', nombre: 'Una barra por década', descripcion: 'Serie anual como barras desde cero: una por década (1960, 1970, 1980…) más el último dato. Solo se usan filas reales de la fuente; no se interpola nada.', necesita: {min: 1, max: 1}, ayuda: 'Elige 1 serie anual (población, urbanización…) con al menos 15 años.'},
  {id: 'bullet', nombre: 'Medidor contra la historia', descripcion: 'El último dato sobre su rango histórico (mínimo, percentiles 25 y 75, máximo) y una raya con la meta (la mediana por defecto). Una fila por dato.', necesita: {min: 1, max: 5}, ayuda: 'Elige de 1 a 5 datos.'},
  {id: 'bandas', nombre: 'Este año contra el rango histórico', descripcion: 'Para cada mes, una banda con el mínimo–máximo y los percentiles 25–75 de los años anteriores, y encima la línea del año. Sin proyecciones.', necesita: {min: 1, max: 1}, ayuda: 'Elige 1 serie mensual (o diaria) con al menos 5 años.'},
  {id: 'pictograma', datos: 'categorias', nombre: 'Cada cuadro = una cantidad', descripcion: 'Filas de cuadros donde cada cuadro vale una cantidad declarada; los incompletos son fracciones exactas. Para «cuánto es esto» de forma concreta.', necesita: {min: 1, max: 1}, ayuda: 'Necesita una tabla de categorías (concepto, valor).'},
  {id: 'ranking_pais', datos: 'categorias', nombre: 'Ranking con códigos (países o empresas)', descripcion: 'Barras ordenadas de mayor a menor con el código ISO o ticker en una ficha (sin banderas). Si resaltas uno que no está en los primeros, aparece abajo con su puesto real.', necesita: {min: 1, max: 1}, ayuda: 'Necesita una tabla de categorías; escribe el concepto como «COL · Colombia» para mostrar el código.'},
];

export const IDS_EXTRA = new Set(PLANTILLAS_EXTRA.map((p) => p.id));
/** Qué `uso` declarar en la tabla de categorías de cada plantilla (evita las reglas del anillo, p. ej. «sin negativos» en el dumbbell). */
export const USO_EXTRA = {radar_tabla: 'radar', dumbbell: 'dumbbell', pictograma: 'pictograma', ranking_pais: 'ranking'};
/** Plantillas que comparan series entre sí: se alinean desde la primera fecha en que todas tienen dato. */
export const COMUN_EXTRA = ['apilada', 'apilada100', 'agrupadas', 'dumbbell_series'];

/** Genera {duracion, capas, notas} para una plantilla extra. `c`: {datos, tab, titulo, camara, formato, entrada, CAMARAS}. */
export function generarExtra(plantilla, c) {
  const {titulo, camara, formato, entrada = {}, tab, CAMARAS} = c, P = CAMARAS[camara] ?? CAMARAS.documental, vert = formato === 'vertical';
  const dib = Math.max(4, Math.min(8, P.dibujo + (['apilada', 'apilada100', 'velas', 'calendario', 'bandas'].includes(plantilla) ? 1 : 0))), dur = +(1 + dib + 3.2).toFixed(1);
  const base = {datos: 'd', id: 'g1', t: [0.9, +(0.9 + dib).toFixed(2)]}, notas = [];
  let capa;
  switch (plantilla) {
    case 'radar': case 'radar_tabla': capa = {tipo: 'radar', ...base, ...(entrada.nota ? {nota: entrada.nota} : {})}; notas.push(t(plantilla === 'radar' ? 'pe.radar' : 'pe.radar_tabla')); break;
    case 'apilada': case 'apilada100': capa = {tipo: 'apilada', ...base, modo: plantilla === 'apilada100' ? 'pct' : 'abs'}; notas.push(t(plantilla === 'apilada100' ? 'pe.apilada100' : 'pe.apilada')); break;
    case 'velas': {
      const ohlc = entrada.ohlc || tab.series.length >= 4;
      capa = {tipo: 'velas', ...base, ...(ohlc ? {ohlc: [0, 1, 2, 3], ...(tab.series.length >= 5 ? {volumen: 4} : {})} : {series: [0]})};
      notas.push(t(ohlc ? 'pe.velas_ohlc' : 'pe.velas_cierres')); break;
    }
    case 'histograma': case 'retornos': capa = {tipo: 'histograma', ...base, sobre: plantilla === 'retornos' ? 'retornos' : 'niveles'}; notas.push(t(plantilla === 'retornos' ? 'pe.retornos' : 'pe.histograma')); break;
    case 'dumbbell': case 'dumbbell_series': capa = {tipo: 'dumbbell', ...base, ...(entrada.etiquetaAntes ? {etiquetaAntes: entrada.etiquetaAntes} : {}), ...(entrada.etiquetaDespues ? {etiquetaDespues: entrada.etiquetaDespues} : {})}; notas.push(t('pe.dumbbell')); break;
    case 'calendario': capa = {tipo: 'calendario', ...base, ...(entrada.modo === 'diario' ? {modo: 'diario'} : {})}; notas.push(t('pe.calendario')); break;
    case 'agrupadas': capa = {tipo: 'agrupadas', ...base, nMomentos: entrada.nMomentos ?? (vert ? 4 : 3)}; notas.push(t('pe.agrupadas')); break;
    case 'barras_decada': capa = {tipo: 'barras', ...base, series: [0], cadaAnios: entrada.cadaAnios ?? 10, ...(vert ? {orientacion: 'h'} : {orientacion: 'v'})}; notas.push(t('pe.barras_decada')); break;
    case 'bullet': capa = {tipo: 'bullet', ...base, ...(entrada.meta ? {meta: entrada.meta} : {})}; notas.push(t('pe.bullet')); break;
    case 'bandas': capa = {tipo: 'bandas', ...base, ...(entrada.anio ? {anio: entrada.anio} : {})}; notas.push(t('pe.bandas')); break;
    case 'pictograma': capa = {tipo: 'pictograma', ...base}; notas.push(t('pe.pictograma')); break;
    case 'ranking_pais': capa = {tipo: 'ranking', ...base, ...(entrada.resalta ? {resalta: entrada.resalta} : {})}; notas.push(t('pe.ranking')); break;
    default: throw new Error(t('pe.e_desconocida', {p: plantilla}));
  }
  if (entrada.color) capa.color = entrada.color;
  return {duracion: dur, capas: [{tipo: 'titulo', texto: titulo, color: 'oro', t: [0.2, +(dur - 0.1).toFixed(2)]}, capa], notas};
}
