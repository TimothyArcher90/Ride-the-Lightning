// Traducción de los «porque» del visualizador (la razón por la que recomienda cada gráfica). El original en español vive en
// servidor/visualizador.mjs y servidor/visualizador_extra.mjs y no cambia; `candidatas(..., idioma = 'en')` pasa cada texto por aquí.
const EXACTOS = new Map([
  ['Es una tabla de flujos (de dónde a dónde): un Sankey muestra el reparto sin que el ojo tenga que comparar áreas.', 'This is a flows table (from where to where): a Sankey shows the split without the eye having to compare areas.'],
  ['Hay sumas y restas (o subtotales): la cascada es la única que enseña cómo se llega del inicio al resultado.', 'There are additions and subtractions (or subtotals): the waterfall is the only one that shows how you get from the start to the result.'],
  ['Cien cuadros de 1 %: la forma más fácil de decir «de cada 100, cuántos son…».', 'One hundred squares of 1%: the easiest way to say "out of every 100, how many are…".'],
  ['Ranking con palos desde cero y letra grande: el más legible en el celular.', 'A ranking with sticks from zero and large type: the most legible on a phone.'],
  ['Áreas proporcionales: da otro ritmo visual y sirve de contraste.', 'Proportional areas: gives another visual rhythm and works as a contrast.'],
  ['Áreas proporcionales: muestra el peso relativo de golpe.', 'Proportional areas: shows the relative weight at a glance.'],
  ['Cien cuadros de 1 %: simple y exacto aunque haya muchas partes.', 'One hundred squares of 1%: simple and exact even with many parts.'],
  ['Anillo con leyenda: sirve hasta ~8 partes.', 'A ring with a legend: works for up to ~8 parts.'],
  ['Una sola serie en el tiempo: una línea que se dibuja y se detiene en los momentos que importan.', 'A single series over time: a line that draws itself and stops at the moments that matter.'],
  ['Varias series: como índice base 100 son comparables aunque tengan unidades distintas, con una protagonista.', 'Several series: as an index with base 100 they are comparable even with different units, with one as the protagonist.'],
  ['El cambio en % de cada serie en una sola escala: ganadores a la derecha, perdedores a la izquierda. Comparable aunque las unidades difieran.', 'The % change of each series on a single scale: winners to the right, losers to the left. Comparable even if the units differ.'],
  ['Compara el primer y el último momento: quién subió, quién bajó y cuánto, en una sola imagen.', 'Compares the first and the last moment: who rose, who fell and by how much, in a single image.'],
  ['Si lo que importa es el orden (quién va primero), las curvas de posición muestran los adelantamientos.', 'If what matters is the order (who leads), the position curves show the overtakes.'],
  ['Barras que compiten y se reordenan en el tiempo: el formato de «ranking en carrera».', 'Bars that compete and reorder over time: the "race ranking" format.'],
  ['Pequeños múltiplos: cada serie en su propia gráfica con la misma escala de tiempo.', 'Small multiples: each series in its own chart on the same time scale.'],
  ['Mapa de colores: qué series se mueven juntas y cuáles al revés.', 'Color map: which series move together and which move opposite.'],
  // visualizador_extra.mjs
  ['Cada fila trae su valor anterior: un punto antes y otro ahora, unidos, muestran quién subió y cuánto sin comparar barras.', 'Each row has its previous value: one dot before and one now, joined, show who rose and by how much without comparing bars.'],
  ['Cada cuadro vale una cantidad declarada: hace tangible «cuánto es esto» y los cuadros incompletos son fracciones exactas.', 'Each square is worth a stated quantity: it makes "how much is this" tangible, and partial squares are exact fractions.'],
  ['Barras ordenadas con el código (ISO o ticker) en una ficha: ideal para países o empresas, y puede resaltar uno aunque no esté entre los primeros.', 'Sorted bars with the code (ISO or ticker) on a tag: ideal for countries or companies, and it can highlight one even if it is not among the first.'],
  ['Es un precio con dato diario: las velas muestran apertura y cierre de cada periodo (con solo cierres, se declara la limitación).', 'This is a price with daily data: candlesticks show the open and close of each period (with closes only, the limitation is stated).'],
  ['Cómo se distribuyen las subidas y caídas diarias: qué tan raras son las grandes.', 'How the daily rises and drops are distributed: how rare the big ones are.'],
  ['Una casilla por mes y año coloreada por el retorno: estacionalidad y años malos de un vistazo.', 'One cell per month and year colored by return: seasonality and bad years at a glance.'],
  ['Para cada mes, el rango histórico (mínimo–máximo y percentiles) y encima este año: se ve si está dentro de lo normal, sin proyecciones.', 'For each month, the historical range (min–max and percentiles) with this year on top: you can see whether it is within the normal range, with no projections.'],
  ['Serie anual con tendencia: una barra por década (más el último dato) desde cero. Se lee de un vistazo cuánto ha crecido o caído en cada década, sin ruido anual.', 'A yearly series with a trend: one bar per decade (plus the latest data point) from zero. You see at a glance how much it grew or fell in each decade, without yearly noise.'],
  ['El último dato frente a su rango histórico y a su mediana: un medidor que responde «¿está alto o bajo?».', 'The latest data point against its historical range and its median: a gauge that answers "is it high or low?".'],
  ['En qué valores ha pasado más tiempo la serie, con la mediana y el último dato marcados.', 'At which values the series has spent the most time, with the median and the latest data point marked.'],
  ['Cómo se distribuyen los cambios entre un dato y el siguiente.', 'How the changes between one data point and the next are distributed.'],
  ['Son partes de un mismo total (misma unidad): el área apilada enseña cuánto aporta cada una y cómo cambia el total.', 'These are parts of the same total (same unit): the stacked area shows how much each contributes and how the total changes.'],
  ['El mismo reparto como % del total: se ve qué fuente gana o pierde peso aunque el total crezca.', 'The same split as a % of the total: you see which source gains or loses weight even as the total grows.'],
  ['Perfil de varios indicadores: cada eje compara el último dato con el rango histórico de su propia serie (sirve con unidades distintas).', 'A profile of several indicators: each axis compares the latest data point with the historical range of its own series (works with different units).'],
  ['Misma unidad: un punto en el primer momento y otro en el último por cada dato, en una escala común.', 'Same unit: one dot at the first moment and another at the last for each series, on a common scale.'],
  ['Misma unidad: una barra por momento dentro de cada dato (por ejemplo 1990, 2005 y hoy), todas desde 0.', 'Same unit: one bar per moment within each series (for example 1990, 2005 and today), all from 0.'],
  ['Un medidor por dato: el último valor sobre su rango histórico y su mediana.', 'One gauge per series: the latest value over its historical range and its median.'],
]);
const PATRONES = [
  [/^Son (\d+) partes de un todo: el anillo es claro y rápido de leer\.$/, 'These are $1 parts of a whole: the ring is clear and quick to read.'],
  [/^Son (\d+) partes: un ranking con palos desde cero es lo único que se lee\.$/, 'There are $1 parts: a ranking with sticks from zero is the only thing that reads well.'],
  [/^Son (\d+) partes: un ranking con palos desde cero se lee fácil y la letra puede ser grande\.$/, 'There are $1 parts: a ranking with sticks from zero is easy to read and the type can be large.'],
];
/** «Porque» del visualizador en inglés; lo que no tiene traducción se devuelve igual. */
export function traducirPorque(s) {
  if (EXACTOS.has(s)) return EXACTOS.get(s);
  for (const [re, r] of PATRONES) if (re.test(s)) return s.replace(re, r);
  return s;
}
