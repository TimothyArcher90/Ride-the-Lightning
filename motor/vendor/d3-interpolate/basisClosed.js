// Vendored from d3-interpolate v3.0.1 (src/basisClosed.js). Import specifiers rewritten to relative paths; otherwise unmodified.
// Source: https://github.com/d3/d3-interpolate  ·  npm: https://www.npmjs.com/package/d3-interpolate/v/3.0.1  ·  License: ISC (see ./LICENSE)
import {basis} from "./basis.js";

export default function(values) {
  var n = values.length;
  return function(t) {
    var i = Math.floor(((t %= 1) < 0 ? ++t : t) * n),
        v0 = values[(i + n - 1) % n],
        v1 = values[i % n],
        v2 = values[(i + 1) % n],
        v3 = values[(i + 2) % n];
    return basis((t - i / n) * n, v0, v1, v2, v3);
  };
}
