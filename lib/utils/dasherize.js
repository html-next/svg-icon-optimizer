module.exports = function dasherize(str) {
  return str.replace(/[A-Z]/g, function (char, index) {
    return (index !== 0 ? '-' : '') + char.toLowerCase();
  });
};
