// Decimación de una serie larga por COLUMNA DE PÍXEL: de cada columna de píxeles se conservan el primer, el mínimo, el máximo y el último
// dato REAL (en orden cronológico). Nunca se interpola ni se inventa un valor: todos los puntos devueltos son filas de los datos, así que
// ningún pico ni suelo se pierde. La idea (un mínimo y un máximo por columna de píxel) es la de uPlot (MIT, Leon Sorokin,
// https://github.com/leeoniya/uPlot); este código es propio, escrito desde cero. Pura y determinista: sin azar ni reloj.
//
// Antes, `linea` saltaba filas a paso fijo («bucket»): con series diarias muy largas eso borraba picos y dejaba una línea irregular.

/**
 * @param {ArrayLike<number>} x   eje X (ms o número), ascendente
 * @param {ArrayLike<number|null>} y   valores; null = hueco (parte la línea)
 * @param {number} a  primera fila a considerar (incluida)
 * @param {number} b  última fila a considerar (incluida)
 * @param {(x:number)=>number} px  proyección de X a píxel
 * @param {number} xMax  no se pasa de este X (la cabeza de la animación)
 * @returns {number[][]} segmentos (se parten en los huecos null) con los ÍNDICES de fila a dibujar, en orden cronológico
 */
export function decimarPorColumna(x, y, a, b, px, xMax = Infinity) {
  const segs = [];
  let seg = null, col = null, iPrimero = 0, iMin = 0, iMax = 0, iUltimo = 0;
  const volcar = () => {
    if (col === null) return;
    if (!seg) segs.push(seg = []);
    const idx = [...new Set([iPrimero, iMin, iMax, iUltimo])].sort((p, q) => p - q);
    for (const i of idx) seg.push(i);
    col = null;
  };
  for (let i = a; i <= b; i++) {
    if (x[i] > xMax) break;
    const v = y[i];
    if (v == null) { volcar(); seg = null; continue; }
    const c = Math.floor(px(x[i]));
    if (c !== col) { volcar(); col = c; iPrimero = iMin = iMax = iUltimo = i; }
    else { if (v < y[iMin]) iMin = i; if (v > y[iMax]) iMax = i; iUltimo = i; }
  }
  volcar();
  return segs;
}

/** Cuántas filas visibles hacen falta para decimar: por debajo de ~2 filas por píxel de ancho no se toca nada (se dibuja cada dato). */
export const decimaDesde = (anchoPx) => 2 * anchoPx;
