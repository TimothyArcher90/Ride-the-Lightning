// Vendored from d3-scale-chromatic v3.0.0 (src/ramp.js). Import specifiers rewritten to relative paths; otherwise unmodified.
// Source: https://github.com/d3/d3-scale-chromatic  ·  License: ISC + ColorBrewer Apache-style license (see ./LICENSE).
// Palette data: ColorBrewer (Cynthia Brewer, Mark Harrower, PSU) / viridis (van der Walt, Smith, Firing; CC0).
import {rgbBasis as interpolateRgbBasis} from "../d3-interpolate/rgb.js";

export default scheme => interpolateRgbBasis(scheme[scheme.length - 1]);
