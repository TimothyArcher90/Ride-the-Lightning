// Vendored from d3-scale-chromatic v3.0.0 (src/colors.js). Import specifiers rewritten to relative paths; otherwise unmodified.
// Source: https://github.com/d3/d3-scale-chromatic  ·  License: ISC + ColorBrewer Apache-style license (see ./LICENSE).
// Palette data: ColorBrewer (Cynthia Brewer, Mark Harrower, PSU) / viridis (van der Walt, Smith, Firing; CC0).
export default function(specifier) {
  var n = specifier.length / 6 | 0, colors = new Array(n), i = 0;
  while (i < n) colors[i] = "#" + specifier.slice(i * 6, ++i * 6);
  return colors;
}
