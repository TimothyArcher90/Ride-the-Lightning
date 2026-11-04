// Vendored from d3-array v3.2.4 (src/max.js), unmodified except for this header.
// Source: https://github.com/d3/d3-array  ·  License: ISC (see ./LICENSE)
export default function max(values, valueof) {
  let max;
  if (valueof === undefined) {
    for (const value of values) {
      if (value != null
          && (max < value || (max === undefined && value >= value))) {
        max = value;
      }
    }
  } else {
    let index = -1;
    for (let value of values) {
      if ((value = valueof(value, ++index, values)) != null
          && (max < value || (max === undefined && value >= value))) {
        max = value;
      }
    }
  }
  return max;
}
