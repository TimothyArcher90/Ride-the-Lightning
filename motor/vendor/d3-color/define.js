// Vendored from d3-color v3.1.0 (src/define.js). Import specifiers rewritten to relative paths; otherwise unmodified.
// Source: https://github.com/d3/d3-color  ·  npm: https://www.npmjs.com/package/d3-color/v/3.1.0  ·  License: ISC (see ./LICENSE)
export default function(constructor, factory, prototype) {
  constructor.prototype = factory.prototype = prototype;
  prototype.constructor = constructor;
}

export function extend(parent, definition) {
  var prototype = Object.create(parent.prototype);
  for (var key in definition) prototype[key] = definition[key];
  return prototype;
}
