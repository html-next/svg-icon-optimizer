module.exports = function formatAttrs(attrs = {}) {
  return Object.keys(attrs)
    .filter((key) => attrs[key] !== undefined)
    .map((key) => `${key}="${String(attrs[key]).replace(/"/g, '\\"')}"`)
    .join(' ');
};
