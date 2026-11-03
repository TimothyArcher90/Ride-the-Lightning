// Universo de empresas: toda la bolsa de EE. UU. (Nasdaq, NYSE, CBOE) según la lista oficial de la SEC. Las 16 «destacadas»
// (catalogo/empresas.json) tienen la historia completa desde 2009; las demás se bajan al elegirlas (o de noche) con los últimos trimestres.
import fs from 'node:fs';
import path from 'node:path';
import {RAIZ} from './compilar.mjs';

const DIR = path.join(RAIZ, 'datos', 'trimestres'), ARCHIVO = path.join(DIR, '_universo.json');
const CONTACTO = process.env.RTL_SEC_CONTACTO ?? 'david@macrowise.co';
const UA = `RideTheLightning/1.0 (herramienta local de graficas; contacto: ${CONTACTO})`;
const BOLSAS = new Set(['Nasdaq', 'NYSE', 'CBOE']);

const bonito = (n) => String(n).toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase()).replace(/\b(Inc|Corp|Co|Ltd|Llc|Plc|Lp|Sa|Nv|Ag|Adr|Etf|Usa|Us|Ii|Iii|Iv)\b/g, (m) => (['Inc', 'Corp', 'Co', 'Ltd', 'Plc'].includes(m) ? m : m.toUpperCase())).replace(/\s+/g, ' ').trim();

/** Descarga la lista oficial (una vez al día) y la guarda ordenada como la entrega la SEC (de las más grandes a las más pequeñas). */
export async function actualizarUniverso({forzar = false} = {}) {
  fs.mkdirSync(DIR, {recursive: true});
  if (!forzar && fs.existsSync(ARCHIVO) && Date.now() - fs.statSync(ARCHIVO).mtimeMs < 24 * 3600e3) return leerUniverso();
  const r = await fetch('https://www.sec.gov/files/company_tickers_exchange.json', {headers: {'User-Agent': UA}, signal: AbortSignal.timeout(60000)});
  if (!r.ok) { if (fs.existsSync(ARCHIVO)) return leerUniverso(); throw new Error(`La SEC respondió ${r.status} al pedir la lista de empresas.`); }
  const j = await r.json(), idx = Object.fromEntries(j.fields.map((f, i) => [f, i])), vistos = new Set(), lista = [];
  for (const f of j.data) {
    const ticker = String(f[idx.ticker]).toUpperCase(), bolsa = f[idx.exchange];
    if (!BOLSAS.has(bolsa) || vistos.has(ticker) || /[-.]/.test(ticker) && /-(WT|W|U|R|P[A-Z]?)$/.test(ticker)) continue;   // sin warrants, unidades ni acciones preferentes
    if (/\b(fund|etf|etn|acquisition (corp|co)\w*|spac)\b/i.test(String(f[idx.name]))) continue;   // fondos cerrados, ETF y SPAC no tienen estado de resultados de empresa
    vistos.add(ticker); lista.push({ticker, cik: f[idx.cik], nombre: bonito(f[idx.name]), bolsa});
  }
  fs.writeFileSync(ARCHIVO, JSON.stringify({obtenido: new Date().toISOString(), total: lista.length, empresas: lista}));
  return lista;
}
export function leerUniverso() { return fs.existsSync(ARCHIVO) ? JSON.parse(fs.readFileSync(ARCHIVO, 'utf8')).empresas : []; }

/** Busca por ticker o nombre. Primero ticker exacto, luego empieza por…, luego contiene. */
export function buscarUniverso(q, limite = 40) {
  const t = String(q).trim().toLowerCase(); if (!t) return [];
  const pts = (e) => { const tk = e.ticker.toLowerCase(), n = e.nombre.toLowerCase(); return tk === t ? 0 : tk.startsWith(t) ? 1 : n.startsWith(t) ? 2 : n.split(' ').some((p) => p.startsWith(t)) ? 3 : n.includes(t) ? 4 : 9; };
  return leerUniverso().map((e, i) => ({e, p: pts(e), i})).filter((x) => x.p < 9).sort((a, b) => a.p - b.p || a.i - b.i).slice(0, limite).map((x) => x.e);
}
