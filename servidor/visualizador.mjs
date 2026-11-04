// El «gran visualizador»: dado un dato, decide QUÉ gráficas lo cuentan bien, construye varias opciones realmente distintas
// y descarta las que no pasan el control de exactitud ni el de textos pisados. Quien lo usa no tiene que saber de gráficas.
// Reglas de elección: "From Data to Viz", FT Visual Vocabulary y Cleveland-McGill (ver docs/INVESTIGACION_VISUALIZACION.md).
import {generar, PLANTILLAS} from './plantillas.mjs';
import {compilar} from './compilar.mjs';
import {auditarColisiones} from './render.mjs';
import {reglasExtra} from './visualizador_extra.mjs';   // reglas de los modelos del visualizador universal

const TEMAS = ['oscuro', 'harris', 'carbon'];
const nombreDe = (id) => PLANTILLAS.find((p) => p.id === id)?.nombre ?? id;

/** Qué plantillas encajan con este dato y por qué, de la mejor a la menos buena. No genera nada todavía. */
export function candidatas(series, {partes = null, haySignos = false, haAnterior = false} = {}) {
  const n = series.length, tabla = series.find((s) => s.tabla)?.tabla ?? null, C = [];
  const add = (plantilla, porque) => { const d = PLANTILLAS.find((p) => p.id === plantilla); if (d && n >= d.necesita.min && n <= d.necesita.max) C.push({plantilla, porque}); };
  if (tabla === 'flujos') { add('resultados', 'Es una tabla de flujos (de dónde a dónde): un Sankey muestra el reparto sin que el ojo tenga que comparar áreas.'); return C; }
  if (tabla === 'categorias') {
    if (haySignos) { add('puente', 'Hay sumas y restas (o subtotales): la cascada es la única que enseña cómo se llega del inicio al resultado.'); return C; }
    const p = partes ?? 6;
    if (p <= 5) { add('composicion', `Son ${p} partes de un todo: el anillo es claro y rápido de leer.`); add('waffle', 'Cien cuadros de 1 %: la forma más fácil de decir «de cada 100, cuántos son…».'); add('lollipop', 'Ranking con palos desde cero y letra grande: el más legible en el celular.'); add('treemap', 'Áreas proporcionales: da otro ritmo visual y sirve de contraste.'); }
    else { add('lollipop', `Son ${p} partes: un ranking con palos desde cero se lee fácil y la letra puede ser grande.`); add('treemap', 'Áreas proporcionales: muestra el peso relativo de golpe.'); add('waffle', 'Cien cuadros de 1 %: simple y exacto aunque haya muchas partes.'); if (p <= 8) add('composicion', 'Anillo con leyenda: sirve hasta ~8 partes.'); }
    reglasExtra(series, {partes, haAnterior}, add, 'tabla');
    return C;
  }
  if (n === 1) { add('historia', 'Una sola serie en el tiempo: una línea que se dibuja y se detiene en los momentos que importan.'); reglasExtra(series, {}, add, 'una'); return C; }
  reglasExtra(series, {}, add, 'pre');
  add('comparar', 'Varias series: como índice base 100 son comparables aunque tengan unidades distintas, con una protagonista.');
  add('divergente', 'El cambio en % de cada serie en una sola escala: ganadores a la derecha, perdedores a la izquierda. Comparable aunque las unidades difieran.');
  add('pendiente', 'Compara el primer y el último momento: quién subió, quién bajó y cuánto, en una sola imagen.');
  reglasExtra(series, {}, add, 'mid');
  add('bump', 'Si lo que importa es el orden (quién va primero), las curvas de posición muestran los adelantamientos.');
  add('carrera', 'Barras que compiten y se reordenan en el tiempo: el formato de «ranking en carrera».');
  add('panel', 'Pequeños múltiplos: cada serie en su propia gráfica con la misma escala de tiempo.');
  add('correlacion', 'Mapa de colores: qué series se mueven juntas y cuáles al revés.');
  return C;
}

/**
 * Construye varias opciones distintas para un dato y las verifica. `entrada` = lo que recibe generar() (series, formato, camara…).
 * Cada opción: {plantilla, nombre, porque, tema, spec, ok, problemas[]}. Solo `ok` se debe entregar.
 */
/** Solo la recomendación (rápida, no dibuja nada): las plantillas que encajan, de la mejor a la menos buena, cada una con su porqué. */
export function recomendar(entrada) {
  const series = entrada.series ?? [], formato = entrada.formato ?? 'vertical';
  let partes = null, haySignos = false, haAnterior = false;
  if (series.some((s) => s.tabla === 'categorias')) {
    try { partes = (generar({...entrada, plantilla: 'composicion', formato}).plano?.tablas?.d?.items ?? []).length; } catch { partes = null; }
    try { const pr = generar({...entrada, plantilla: 'puente', formato}); haySignos = !pr.informe.errores.length && (pr.plano?.tablas?.d?.items ?? []).some((x) => x.valor < 0 || x.tipo === 'total'); } catch { haySignos = false; }
    try { haAnterior = !generar({...entrada, plantilla: 'dumbbell', formato}).informe.errores.length; } catch { haAnterior = false; }
  }
  return candidatas(series, {partes, haySignos, haAnterior});
}

export async function proponer(entrada, {max = 4, auditar = true, paso = 0.6} = {}) {
  const series = entrada.series ?? [], formato = entrada.formato ?? 'vertical';
  let partes = null, haySignos = false, haAnterior = false;
  if (series.some((s) => s.tabla === 'categorias')) {
    const probe = generar({...entrada, plantilla: 'composicion', formato});
    const items = probe.plano?.tablas?.d?.items ?? [];
    partes = items.length;
  }
  if (series.some((s) => s.tabla === 'categorias')) {
    try { const pr = generar({...entrada, plantilla: 'puente', formato}); haySignos = !pr.informe.errores.length && (pr.plano?.tablas?.d?.items ?? []).some((x) => x.valor < 0 || x.tipo === 'total'); } catch { haySignos = false; }
  }
  if (series.some((s) => s.tabla === 'categorias')) { try { haAnterior = !generar({...entrada, plantilla: 'dumbbell', formato}).informe.errores.length; } catch { haAnterior = false; } }
  const cand = candidatas(series, {partes, haySignos, haAnterior}).slice(0, max), salida = [];
  for (let i = 0; i < cand.length; i++) {
    const c = cand[i], tema = TEMAS[i % TEMAS.length], problemas = [];
    try {
      const camara = entrada.camara ?? (formato === 'vertical' ? 'dinamico' : 'documental');
      const r = generar({...entrada, plantilla: c.plantilla, formato, camara, tema});
      problemas.push(...r.informe.errores);
      let ok = problemas.length === 0;
      if (ok && auditar) { const a = await auditarColisiones(compilar(r.spec).spec, {paso}); if (!a.ok) { ok = false; problemas.push(...a.problemas.slice(0, 3).map((p) => JSON.stringify(p))); } }
      salida.push({plantilla: c.plantilla, nombre: nombreDe(c.plantilla), porque: c.porque, tema, camara, ok, problemas, avisos: r.informe.avisos, notas: r.notas, spec: r.spec});
    } catch (e) { salida.push({plantilla: c.plantilla, nombre: nombreDe(c.plantilla), porque: c.porque, tema, ok: false, problemas: [e.message]}); }
  }
  return salida;
}
