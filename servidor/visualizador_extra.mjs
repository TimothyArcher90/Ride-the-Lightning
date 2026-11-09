// Reglas de elección de los modelos del visualizador universal (radar, apilada, velas, histograma, dumbbell, calendario,
// agrupadas, bullet, bandas, pictograma, ranking). Se llaman desde candidatas() de visualizador.mjs. Heurísticas de
// docs/research/VISUALIZATION_RESEARCH.md (tabla de reglas): se mide la frecuencia y la unidad en el catálogo, no se adivina.
import fs from 'node:fs';
import path from 'node:path';
import {leerCatalogo} from './catalogo.mjs';
import {RAIZ} from './compilar.mjs';

/**
 * ¿La serie es una TENDENCIA sostenida (población, urbanización, PIB nominal…)? Si ≥ 85 % de sus cambios van en el mismo sentido,
 * un histograma de niveles o un medidor «¿alto o bajo?» no dicen nada (el último dato siempre es el máximo o el mínimo).
 * Se mide en los datos de la biblioteca; si no hay archivo (datos propios), no se asume nada (devuelve null).
 */
export function tendencia(serie) {
  try {
    if (serie.origen !== 'biblioteca') return null;
    const ruta = [path.join(RAIZ, 'datos', 'biblioteca', `${serie.id}.csv`), path.join(RAIZ, 'data', `${serie.id}.csv`)].find((r) => fs.existsSync(r)); if (!ruta) return null;
    const v = fs.readFileSync(ruta, 'utf8').split('\n').slice(1).map((l) => parseFloat(l.split(',')[1])).filter(Number.isFinite);
    if (v.length < 8) return null;
    let sube = 0, baja = 0; for (let k = 1; k < v.length; k++) { if (v[k] > v[k - 1]) sube++; else if (v[k] < v[k - 1]) baja++; }
    const dom = Math.max(sube, baja) / Math.max(1, sube + baja);
    return {dominante: dom, sentido: sube >= baja ? 'sube' : 'baja', puntos: v.length, sostenida: dom >= 0.85};
  } catch { return null; }
}

const frecDe = (f) => { const s = String(f ?? '').toLowerCase(); return ['diaria', 'semanal', 'mensual', 'trimestral', 'anual'].find((k) => s.includes(k.slice(0, 5))) ?? null; };
/** Unidad y frecuencia de cada dato elegido (biblioteca: del catálogo; archivo propio: lo que declaró). */
export function perfil(series) {
  let cat = []; try { cat = leerCatalogo(); } catch { cat = []; }
  return series.map((s) => {
    const e = s.origen === 'biblioteca' ? cat.find((x) => x.id === s.id) : null;
    return {unidad: String(e?.unidad ?? s.unidad ?? '').toLowerCase().trim(), frec: frecDe(e?.frecuencia ?? s.frecuencia)};
  });
}
// Unidades de CANTIDADES que se suman a un total (se pueden apilar). Un precio («US$ por barril», «US$/tonelada») o una tasa («%») no suman.
const EXTENSIVA = (u) => !!u && !/%|\/|\bpor\b|índice|indice|puntos|tasa|años/.test(u) && /twh|tonelada|persona|barril|us\$|usd|millones|miles|habitantes|kwh|\bmw\b|empleos|unidades|hect/.test(u);
const esTasa = (u) => /%|tasa|índice|indice|puntos/.test(u);

/**
 * Agrega a la lista las plantillas extra que encajan. `fase`: 'pre' (antes de «comparar»), 'mid' (después de «pendiente»),
 * 'una' (una sola serie), 'tabla' (tabla de categorías).
 */
export function reglasExtra(series, {partes = null, haAnterior = false} = {}, add, fase) {
  const n = series.length, P = perfil(series), unidades = new Set(P.map((p) => p.unidad)), misma = unidades.size === 1 && [...unidades][0] !== '';
  if (fase === 'tabla') {
    if (haAnterior) add('dumbbell', 'Cada fila trae su valor anterior: un punto antes y otro ahora, unidos, muestran quién subió y cuánto sin comparar barras.');
    if (partes != null && partes <= 8) add('pictograma', 'Cada cuadro vale una cantidad declarada: hace tangible «cuánto es esto» y los cuadros incompletos son fracciones exactas.');
    if (partes != null && partes >= 4) add('ranking_pais', 'Barras ordenadas con el código (ISO o ticker) en una ficha: ideal para países o empresas, y puede resaltar uno aunque no esté entre los primeros.');
    return;
  }
  if (fase === 'una') {
    const {unidad, frec} = P[0], precio = !esTasa(unidad);
    if (frec === 'diaria' && precio) { add('velas', 'Es un precio con dato diario: las velas muestran apertura y cierre de cada periodo (con solo cierres, se declara la limitación).'); add('retornos', 'Cómo se distribuyen las subidas y caídas diarias: qué tan raras son las grandes.'); add('calendario', 'Una casilla por mes y año coloreada por el retorno: estacionalidad y años malos de un vistazo.'); }
    if (['mensual', 'semanal', 'diaria'].includes(frec) && esTasa(unidad)) add('bandas', 'Para cada mes, el rango histórico (mínimo–máximo y percentiles) y encima este año: se ve si está dentro de lo normal, sin proyecciones.');
    // Una tendencia sostenida (población, urbanización…) o una serie anual corta no se resume con un medidor ni con un histograma de niveles.
    const tend = tendencia(series[0]), oscila = !(tend?.sostenida), muchas = !tend || tend.puntos >= 24;
    if (frec === 'anual' && tend && tend.puntos >= 15) add('barras_decada', 'Serie anual con tendencia: una barra por década (más el último dato) desde cero. Se lee de un vistazo cuánto ha crecido o caído en cada década, sin ruido anual.');
    if (oscila && frec !== 'anual') add('bullet', 'El último dato frente a su rango histórico y a su mediana: un medidor que responde «¿está alto o bajo?».');
    if (oscila && muchas && frec !== 'anual') add('histograma', 'En qué valores ha pasado más tiempo la serie, con la mediana y el último dato marcados.');
    if (frec === 'diaria' && tend && tend.puntos >= 750 && !tend.sostenida) add('cordillera', 'Dato diario con 3 o más años: una cresta por año enseña cómo cambia la FORMA de la distribución (no solo el promedio) con el tiempo.');
    if (frec === 'diaria' && !precio) add('retornos', 'Cómo se distribuyen los cambios entre un dato y el siguiente.');
    return;
  }
  if (fase === 'pre') {
    if (n >= 2 && n <= 8 && misma && EXTENSIVA([...unidades][0])) { add('apilada', 'Son partes de un mismo total (misma unidad): el área apilada enseña cuánto aporta cada una y cómo cambia el total.'); add('apilada100', 'El mismo reparto como % del total: se ve qué fuente gana o pierde peso aunque el total crezca.'); if (n >= 3) add('corriente', 'Las mismas partes como una corriente con la línea base centrada: se ve cuándo gana o pierde peso cada una; el grosor es el valor y una barra de escala lo mide.'); }
    return;
  }
  if (fase === 'mid') {
    if (n >= 3 && n <= 8) add('radar', 'Perfil de varios indicadores: cada eje compara el último dato con el rango histórico de su propia serie (sirve con unidades distintas).');
    if (n >= 2 && n <= 8 && misma) add('dumbbell_series', 'Misma unidad: un punto en el primer momento y otro en el último por cada dato, en una escala común.');
    if (n >= 2 && n <= 6 && misma) add('agrupadas', 'Misma unidad: una barra por momento dentro de cada dato (por ejemplo 1990, 2005 y hoy), todas desde 0.');
    add('bullet', 'Un medidor por dato: el último valor sobre su rango histórico y su mediana.');
  }
}
