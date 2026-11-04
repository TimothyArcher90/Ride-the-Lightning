// Plantillas del VISUALIZADOR UNIVERSAL: una por cada capa de motor/capas_extra.js (2026-11-04).
// Igual que plantillas.mjs: convierten «qué dato y cómo verlo» en capas con tiempos; no tocan cifras. Se enganchan desde
// plantillas.mjs (PLANTILLAS = [...base, ...PLANTILLAS_EXTRA]; generar() delega aquí con generarExtra).
// TODO(diseno): los tiempos de entrada/lectura ya respetan MOV.lectura (≥ 3 s con todo visible); si motor/diseno.js cambia MOV, ajustar `dur`.

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
    case 'radar': case 'radar_tabla': capa = {tipo: 'radar', ...base, ...(entrada.nota ? {nota: entrada.nota} : {})}; notas.push(plantilla === 'radar' ? 'Cada eje se normaliza dentro de la historia completa de su propia serie: 0 = su mínimo histórico, 100 = su máximo histórico. Dice DÓNDE está cada indicador dentro de su rango, no su nivel absoluto.' : 'Los ejes comparten una escala común de 0 a un máximo redondo; los valores de la tabla deben venir en la misma unidad o ya normalizados.'); break;
    case 'apilada': case 'apilada100': capa = {tipo: 'apilada', ...base, modo: plantilla === 'apilada100' ? 'pct' : 'abs'}; notas.push(plantilla === 'apilada100' ? 'Cada franja es su valor ÷ la suma de todas las series en ese momento. Solo se usan los momentos en que todas las series tienen dato.' : 'La altura total es la suma exacta de las franjas. Solo se usan los momentos en que todas las series tienen dato.'); break;
    case 'velas': {
      const ohlc = entrada.ohlc || tab.series.length >= 4;
      capa = {tipo: 'velas', ...base, ...(ohlc ? {ohlc: [0, 1, 2, 3], ...(tab.series.length >= 5 ? {volumen: 4} : {})} : {series: [0]})};
      notas.push(ohlc ? 'Velas con apertura, máximo, mínimo y cierre reales de la fuente.' : 'LIMITACIÓN: la fuente solo trae cierres diarios. Cada vela agrupa un periodo (abre = primer cierre, cierra = último cierre, mechas = mayor y menor cierre); NO son los extremos intradía. Con columnas OHLC reales las velas serían exactas.'); break;
    }
    case 'histograma': case 'retornos': capa = {tipo: 'histograma', ...base, sobre: plantilla === 'retornos' ? 'retornos' : 'niveles'}; notas.push(plantilla === 'retornos' ? 'Los retornos son v[t]/v[t−1] − 1 entre filas consecutivas; el rango mostrado va del percentil 0,5 al 99,5 y las colas se agrupan en las barras de los extremos.' : 'Cada barra es el % de las observaciones que caen en ese rango de valores.'); break;
    case 'dumbbell': case 'dumbbell_series': capa = {tipo: 'dumbbell', ...base, ...(entrada.etiquetaAntes ? {etiquetaAntes: entrada.etiquetaAntes} : {}), ...(entrada.etiquetaDespues ? {etiquetaDespues: entrada.etiquetaDespues} : {})}; notas.push('Dos puntos por fila en una misma escala; el cambio (%) es actual ÷ anterior − 1.'); break;
    case 'calendario': capa = {tipo: 'calendario', ...base, ...(entrada.modo === 'diario' ? {modo: 'diario'} : {})}; notas.push('Retorno mensual = último cierre del mes ÷ último cierre del mes anterior − 1 (o diario, si eliges ese modo). El color se satura en el percentil 95 de los retornos, y se declara.'); break;
    case 'agrupadas': capa = {tipo: 'agrupadas', ...base, nMomentos: entrada.nMomentos ?? (vert ? 4 : 3)}; notas.push('Los momentos se reparten de forma uniforme entre las filas en que todas las series tienen dato, incluyendo la primera y la última.'); break;
    case 'bullet': capa = {tipo: 'bullet', ...base, ...(entrada.meta ? {meta: entrada.meta} : {})}; notas.push('La meta por defecto es la mediana de la historia de cada serie (calculada de los datos). Una meta propia solo se acepta con fuente verificada.'); break;
    case 'bandas': capa = {tipo: 'bandas', ...base, ...(entrada.anio ? {anio: entrada.anio} : {})}; notas.push('Para cada mes, mínimo, máximo y percentiles 25 y 75 de los años anteriores; encima el año elegido (por defecto el último con datos). No se proyecta nada.'); break;
    case 'pictograma': capa = {tipo: 'pictograma', ...base}; notas.push('Cada cuadro vale una unidad redonda elegida para que la parte mayor quepa en una fila; se declara en pantalla y los cuadros incompletos son fracciones exactas.'); break;
    case 'ranking_pais': capa = {tipo: 'ranking', ...base, ...(entrada.resalta ? {resalta: entrada.resalta} : {})}; notas.push('Barras ordenadas de mayor a menor, proporcionales al valor y desde 0. El código sale del texto anterior a « · » en el concepto; no se usan banderas.'); break;
    default: throw new Error(`Plantilla extra desconocida: ${plantilla}`);
  }
  if (entrada.color) capa.color = entrada.color;
  return {duracion: dur, capas: [{tipo: 'titulo', texto: titulo, color: 'oro', t: [0.2, +(dur - 0.1).toFixed(2)]}, capa], notas};
}
