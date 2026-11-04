// Vendored from d3-array v3.2.4 (src/min.js), unmodified except for this header.
// Source: https://github.com/d3/d3-array  ·  License: ISC (see ./LICENSE)
export default function min(values, valueof) {
  let min;
  if (valueof === undefined) {
    for (const value of values) {
      if (value != null
          && (min > value || (min === undefined && value >= value))) {
        min = value;
      }
    }
  } else {
    let index = -1;
    for (let value of values) {
      if ((value = valueof(value, ++index, values)) != null
          && (min > value || (min === undefined && value >= value))) {
        min = value;
      }
    }
  }
  return min;
}
