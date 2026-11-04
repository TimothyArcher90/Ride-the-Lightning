// Utilidades de la biblioteca de series: listar el Pink Sheet vigente y descargar series ad hoc (cualquier ticker o id).
import {ADAPTADORES, cache, descargar} from './catalogo.mjs';

/** Lista las columnas (nombre y unidad) del Pink Sheet vigente: el catálogo se genera de aquí, no se teclea. */
export async function listarPinkSheet() {
  await ADAPTADORES.bancomundial({columna: 'Gold'});
  const wb = await cache.pink, ws = wb.libro.Sheets['Monthly Prices'], X = wb.XLSX, rg = X.utils.decode_range(ws['!ref']);
  const out = [];
  for (let C = 1; C <= rg.e.c; C++) {
    const n = ws[X.utils.encode_cell({r: 4, c: C})]?.v;
    if (!n) continue;
    out.push({columna: String(n).replace(/\s*\*+\s*$/, '').replace(/\s+/g, ' ').trim(), unidad: String(ws[X.utils.encode_cell({r: 5, c: C})]?.v ?? '').replace(/^\(|\)$/g, '')});
  }
  return out;
}

const NOMBRES = {fred: 'FRED (Federal Reserve Bank of St. Louis)', yahoo: 'Yahoo Finance (API de gráficos, no oficial)', coinmetrics: 'Coin Metrics Community Network Data', owid: 'Our World in Data',
  worldbank: 'Banco Mundial — World Development Indicators (API v2)', imf: 'FMI — World Economic Outlook, DataMapper', eurostat: 'Eurostat (Comisión Europea)', tesoro: 'U.S. Department of the Treasury — FiscalData, Debt to the Penny', trm: 'Superintendencia Financiera de Colombia — TRM, vía datos.gov.co'};
// Licencia por defecto de los adaptadores abiertos cuando la llamada ad hoc no trae una (la procedencia nunca queda sin licencia).
const LICENCIAS = {worldbank: 'CC BY 4.0 (Banco Mundial)', imf: 'Términos de uso del FMI (imf.org/en/About/copyright-and-terms): citar al FMI; confirmar reutilización comercial', eurostat: 'CC BY 4.0 (política de reutilización de Eurostat)', tesoro: 'Dominio público (obra del gobierno de EE. UU.; FiscalData)', trm: 'CC BY-SA 4.0 (datos.gov.co); atribución: Superintendencia Financiera de Colombia'};

/** Descarga ad hoc (fuera del catálogo): cualquier ticker de Yahoo, serie FRED, etc. Mismas garantías de procedencia. */
export async function descargarAdHoc({id, nombre, adaptador, args, categoria = 'Ad hoc', unidad, frecuencia, licencia}) {
  return descargar({id, nombre, categoria, adaptador, args, unidad, frecuencia, fuente_original: NOMBRES[adaptador] ?? adaptador, licencia: licencia ?? LICENCIAS[adaptador]});
}

// ── Combinar series de la biblioteca en una tabla ancha (unión por fecha EXACTA; no remuestrea ni interpola) ──
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {RAIZ} from './compilar.mjs';

/** Último dato de cada periodo (mes, trimestre o año), fechado el primer día del periodo. Método declarado; no interpola ni inventa. */
function alPeriodo(mapa, tipo) {
  const out = new Map();
  for (const f of [...mapa.keys()].sort()) {
    const m = f.match(/^(-?\d+)-(\d{2})-(\d{2})/); if (!m) continue;
    const mes = +m[2], clave = tipo === 'anual' ? `${m[1]}-01-01` : tipo === 'trimestral' ? `${m[1]}-${String(Math.floor((mes - 1) / 3) * 3 + 1).padStart(2, '0')}-01` : `${m[1]}-${m[2]}-01`;
    out.set(clave, mapa.get(f));
  }
  return out;
}

export function combinar({ids, nombre, id, remuestreo = null, desde = null}) {
  const dir = path.join(RAIZ, 'datos', 'biblioteca');
  const comp = ids.map((i) => {
    const f = path.join(dir, `${i}.csv`);
    if (!fs.existsSync(f)) throw new Error(`"${i}" no está descargada. Usa descargar_serie primero.`);
    const filas = fs.readFileSync(f, 'utf8').trim().split('\n').slice(1).map((l) => l.split(','));
    const mapa0 = new Map(filas.map((r) => [r[0], r[1]]));
    return {id: i, mapa: remuestreo ? alPeriodo(mapa0, remuestreo) : mapa0, meta: JSON.parse(fs.readFileSync(f + '.meta.json', 'utf8')), n: filas.length};
  });
  const fechas = [...new Set(comp.flatMap((c) => [...c.mapa.keys()]))].sort((a, b) => (a.startsWith('-') !== b.startsWith('-') ? (a.startsWith('-') ? -1 : 1) : a.localeCompare(b)));
  const filas = fechas.filter((d) => (desde ? comp.every((c) => c.mapa.has(d)) && d >= desde : comp.some((c) => c.mapa.has(d))));
  const comunes = filas.filter((d) => comp.every((c) => c.mapa.has(d))).length;
  const csv = ['fecha,' + ids.join(','), ...filas.map((d) => d + ',' + comp.map((c) => c.mapa.get(d) ?? '').join(','))].join('\n') + '\n';
  const out = path.join(RAIZ, 'datos', 'derivados'); fs.mkdirSync(out, {recursive: true});
  const archivo = path.join(out, `${id}.csv`);
  fs.writeFileSync(archivo, csv);
  const hoy = new Date().toISOString().slice(0, 10), sha = crypto.createHash('sha256').update(csv).digest('hex');
  const meta = {id, receta: {ids, nombre, id, remuestreo, desde}, remuestreo, sha256: sha, descargado: hoy, filas: filas.length, inicio: filas[0], fin: filas[filas.length - 1], filasConTodas: comunes,
    fuente: {nombre: `${nombre} — combinación ${remuestreo ? `remuestreada a ${remuestreo} (último dato de cada periodo)` : 'por fecha exacta'} de: ${comp.map((c) => c.meta.fuente.corto ?? c.meta.fuente.nombre).join(' + ')}`, corto: `${[...new Set(comp.map((c) => String(c.meta.fuente.nombre).split(' — ')[0].replace(/, vía FRED$/, '')))].join(' + ')} · ${comp.length} series`,
      url: [...new Set(comp.map((c) => c.meta.fuente.url))].join(' · '), obtenido: hoy},
    componentes: comp.map((c) => ({id: c.id, sha256: c.meta.sha256, inicio: c.meta.inicio, fin: c.meta.fin, filas: c.n, fuente: c.meta.fuente.nombre}))};
  fs.writeFileSync(archivo + '.meta.json', JSON.stringify(meta, null, 2));
  return {archivo, ...meta};
}
