// Escalas de color para mapas de calor y áreas (2026-11-04). Las paletas vienen de d3-scale-chromatic vendorizado (motor/vendor/): ColorBrewer BrBG
// (marrón–azul verdoso, seguro para daltónicos) y viridis (CC0). Todo es función pura de su entrada: el mismo valor da siempre el mismo color.
// Reglas: el centro NO es el color del fondo (tenía contraste ~1,1:1 y el «0 %» desaparecía), y los dos polos se separan en el eje azul–amarillo,
// que los tres tipos de daltonismo conservan (la prueba scripts/prueba-calidad.mjs lo mide con simulación de deuteranopía/protanopía/tritanopía).
import BrBG from './vendor/d3-scale-chromatic/diverging/BrBG.js';
import viridis from './vendor/d3-scale-chromatic/sequential-multi/viridis.js';
import {mezcla, clamp} from './nucleo.js';

const aHex = (s) => (s[0] === '#' ? s : '#' + /rgb\((\d+), (\d+), (\d+)\)/.exec(s).slice(1, 4).map((v) => (+v).toString(16).padStart(2, '0')).join(''));
/** Polos y centro de la escala divergente: ochre = valores negativos, verde azulado = positivos; centro gris cálido (claro sobre el fondo oscuro). */
export const DIV = {neg: aHex(BrBG(0.15)), centro: '#8A877F', pos: aHex(BrBG(0.85))};
/** k en [-1, 1] → color. Brillo casi constante: la magnitud va en la saturación, así que se lee igual en cualquier daltonismo del eje rojo–verde. */
export const colorDivergente = (k) => mezcla(DIV.centro, k >= 0 ? DIV.pos : DIV.neg, clamp(Math.abs(k)));
/** t en [0, 1] → viridis (azul → verde → amarillo). Se recorta a [0,42 … 1] para que ninguna celda se pierda contra el fondo oscuro. */
export const colorSecuencial = (t) => aHex(viridis(0.42 + 0.58 * clamp(t)));
