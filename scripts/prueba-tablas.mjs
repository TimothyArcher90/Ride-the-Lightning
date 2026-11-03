// Reglas de exactitud de las tablas (flujos y categorías): lo que no cuadra NO se dibuja, con un mensaje que dice por qué y dónde.
import fs from 'node:fs';
import path from 'node:path';
import {compilar, RAIZ} from '../servidor/compilar.mjs';
import {detectarTabla} from '../servidor/tablas.mjs';

let fallos = 0;
const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fallos++; };
const dir = path.join(RAIZ, '.tmp', 'prueba-tablas'); fs.mkdirSync(dir, {recursive: true});
const caso = (nombre, csv, d) => { const rel = `.tmp/prueba-tablas/${nombre}.csv`; fs.writeFileSync(path.join(RAIZ, rel), csv); return compilar({version: 1, datos: {d: {archivo: rel, fuente: {nombre: 'prueba'}, ...d}}, capas: []}).informe; };
const hay = (inf, re) => inf.errores.some((e) => re.test(e));

console.log('\n1) Flujos');
ok(caso('f_ok', 'origen,destino,valor,tipo\nA,Total,60,\nB,Total,40,\nTotal,Ganancia,70,beneficio\nTotal,Costo,30,costo\n', {tipo: 'flujos'}).errores.length === 0, 'una tabla que cuadra compila');
ok(hay(caso('f_nocuadra', 'origen,destino,valor\nA,Total,100\nTotal,X,60\nTotal,Y,10\n', {tipo: 'flujos'}), /no cuadra/), 'un nodo que no cuadra se rechaza y dice cuánto entra y cuánto sale');
ok(hay(caso('f_neg', 'origen,destino,valor\nA,B,-5\nB,C,3\n', {tipo: 'flujos'}), /mayor que 0/), 'un flujo negativo se rechaza');
ok(hay(caso('f_ciclo', 'origen,destino,valor\nA,B,5\nB,C,5\nC,B,5\n', {tipo: 'flujos'}), /ciclo/), 'un ciclo se rechaza');
ok(hay(caso('f_tipo', 'origen,destino,valor,tipo\nA,B,5,colorido\nB,C,5,\n', {tipo: 'flujos'}), /no existe/), 'un tipo inventado se rechaza');
ok(hay(caso('f_texto', 'origen,destino,valor\nA,B,cinco\nB,C,5\n', {tipo: 'flujos'}), /texto donde se esperaba/), 'texto en la columna de valores se rechaza');
const lev = caso('f_redondeo', 'origen,destino,valor\nA,Total,100\nTotal,X,60\nTotal,Y,39\n', {tipo: 'flujos'});
ok(lev.errores.length === 0 && lev.avisos.some((a) => /redondeo/.test(a)), 'una diferencia pequeña (1 %, redondeo de la fuente) pasa pero se avisa');
ok(hay(compilar({version: 1, datos: {d: {archivo: '.tmp/prueba-tablas/f_ok.csv', tipo: 'flujos'}}, capas: []}).informe, /sin fuente/), 'sin fuente no compila');

console.log('\n2) Categorías (anillo y cascada)');
ok(hay(caso('c_neg', 'concepto,valor\nA,10\nB,-3\n', {tipo: 'categorias', uso: 'donut'}), /negativos/), 'un anillo no admite valores negativos');
ok(caso('c_cas', 'concepto,valor,tipo\nIngresos,100,inicio\nCosto,-40,\nBruta,60,total\nGastos,-20,\nNeta,40,total\n', {tipo: 'categorias', uso: 'cascada'}).errores.length === 0, 'una cascada con subtotales correctos compila');
ok(hay(caso('c_mal', 'concepto,valor,tipo\nIngresos,100,inicio\nCosto,-40,\nBruta,90,total\n', {tipo: 'categorias', uso: 'cascada'}), /no cuadra con la suma/), 'un subtotal que no suma se rechaza');
ok(caso('c_perd', 'concepto,valor,tipo\nIngresos,100,inicio\nGastos,-130,\nOperativa,-30,total\n', {tipo: 'categorias', uso: 'cascada'}).errores.length === 0, 'la cascada admite pérdidas');
ok(caso('c_acentos', 'Concepto,Valor\n"Ventas, generales",12\nOtros,3\n', {tipo: 'categorias', uso: 'donut'}).errores.length === 0, 'nombres de columna con mayúsculas y celdas con comas entre comillas');

console.log('\n3) Detección automática');
ok(detectarTabla(['Origen', 'Destino', 'Valor']) === 'flujos' && detectarTabla(['concepto', 'valor']) === 'categorias' && detectarTabla(['fecha', 'precio']) === null, 'reconoce flujos, categorías y series de tiempo');
console.log(fallos ? `\n✗ ${fallos} prueba(s) fallaron` : '\n✓ reglas de tablas OK');
process.exit(fallos ? 1 : 0);
