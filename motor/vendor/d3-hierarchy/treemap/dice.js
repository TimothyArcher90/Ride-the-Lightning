// Vendored from d3-hierarchy v3.1.2 (src/treemap/dice.js), unmodified except for this header.
// Source: https://github.com/d3/d3-hierarchy  ·  npm: https://www.npmjs.com/package/d3-hierarchy/v/3.1.2  ·  License: ISC (see ../LICENSE)
export default function(parent, x0, y0, x1, y1) {
  var nodes = parent.children,
      node,
      i = -1,
      n = nodes.length,
      k = parent.value && (x1 - x0) / parent.value;

  while (++i < n) {
    node = nodes[i], node.y0 = y0, node.y1 = y1;
    node.x0 = x0, node.x1 = x0 += node.value * k;
  }
}
