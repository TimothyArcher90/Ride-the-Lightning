// Vendored from d3-scale-chromatic v3.0.0 (src/diverging/BrBG.js). Import specifiers rewritten to relative paths; otherwise unmodified.
// Source: https://github.com/d3/d3-scale-chromatic  ·  License: ISC + ColorBrewer Apache-style license (see ./LICENSE).
// Palette data: ColorBrewer (Cynthia Brewer, Mark Harrower, PSU) / viridis (van der Walt, Smith, Firing; CC0).
import colors from "../colors.js";
import ramp from "../ramp.js";

export var scheme = new Array(3).concat(
  "d8b365f5f5f55ab4ac",
  "a6611adfc27d80cdc1018571",
  "a6611adfc27df5f5f580cdc1018571",
  "8c510ad8b365f6e8c3c7eae55ab4ac01665e",
  "8c510ad8b365f6e8c3f5f5f5c7eae55ab4ac01665e",
  "8c510abf812ddfc27df6e8c3c7eae580cdc135978f01665e",
  "8c510abf812ddfc27df6e8c3f5f5f5c7eae580cdc135978f01665e",
  "5430058c510abf812ddfc27df6e8c3c7eae580cdc135978f01665e003c30",
  "5430058c510abf812ddfc27df6e8c3f5f5f5c7eae580cdc135978f01665e003c30"
).map(colors);

export default ramp(scheme);
