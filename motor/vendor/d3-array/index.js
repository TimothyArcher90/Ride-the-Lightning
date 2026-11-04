// Minimal entry point for the vendored d3-array pieces (min, max, sum, ticks). Not part of upstream d3-array; re-exports only what motor/ uses.
// Upstream: https://github.com/d3/d3-array v3.2.4 · License: ISC (see ./LICENSE)
export {default as min} from "./min.js";
export {default as max} from "./max.js";
export {default as sum} from "./sum.js";
export {default as ticks, tickIncrement, tickStep} from "./ticks.js";
