// Vendored from d3-interpolate v3.0.1 (src/color.js). Import specifiers rewritten to relative paths; otherwise unmodified.
// Source: https://github.com/d3/d3-interpolate  ·  npm: https://www.npmjs.com/package/d3-interpolate/v/3.0.1  ·  License: ISC (see ./LICENSE)
import constant from "./constant.js";

function linear(a, d) {
  return function(t) {
    return a + t * d;
  };
}

function exponential(a, b, y) {
  return a = Math.pow(a, y), b = Math.pow(b, y) - a, y = 1 / y, function(t) {
    return Math.pow(a + t * b, y);
  };
}

export function hue(a, b) {
  var d = b - a;
  return d ? linear(a, d > 180 || d < -180 ? d - 360 * Math.round(d / 360) : d) : constant(isNaN(a) ? b : a);
}

export function gamma(y) {
  return (y = +y) === 1 ? nogamma : function(a, b) {
    return b - a ? exponential(a, b, y) : constant(isNaN(a) ? b : a);
  };
}

export default function nogamma(a, b) {
  var d = b - a;
  return d ? linear(a, d) : constant(isNaN(a) ? b : a);
}
