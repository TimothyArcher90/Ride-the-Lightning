// Vendored from d3-array v3.2.4 (src/sum.js), unmodified except for this header.
// Source: https://github.com/d3/d3-array  ·  License: ISC (see ./LICENSE)
export default function sum(values, valueof) {
  let sum = 0;
  if (valueof === undefined) {
    for (let value of values) {
      if (value = +value) {
        sum += value;
      }
    }
  } else {
    let index = -1;
    for (let value of values) {
      if (value = +valueof(value, ++index, values)) {
        sum += value;
      }
    }
  }
  return sum;
}
