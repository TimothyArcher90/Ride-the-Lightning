// Vendored from d3-sankey v0.12.3 (src/align.js). Import specifiers rewritten to relative paths; otherwise unmodified.
// Source: https://github.com/d3/d3-sankey  ·  npm: https://www.npmjs.com/package/d3-sankey/v/0.12.3  ·  License: BSD-3-Clause (see ./LICENSE)
import {min} from "../d3-array/index.js";

function targetDepth(d) {
  return d.target.depth;
}

export function left(node) {
  return node.depth;
}

export function right(node, n) {
  return n - 1 - node.height;
}

export function justify(node, n) {
  return node.sourceLinks.length ? node.depth : n - 1;
}

export function center(node) {
  return node.targetLinks.length ? node.depth
      : node.sourceLinks.length ? min(node.sourceLinks, targetDepth) - 1
      : 0;
}
