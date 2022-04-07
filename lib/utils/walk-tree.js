const path = require('path');
const fs = require('fs');

module.exports = function walkTree(dirPath, meta, callback) {
  const dir = fs.readdirSync(dirPath);
  dir.forEach((entry) => {
    const f = path.join(dirPath, entry);
    const stat = fs.statSync(f);

    if (stat && stat.isDirectory()) {
      const newMeta = Object.assign({}, meta);
      newMeta.fullPath = f;
      walkTree(f, newMeta, callback);
    } else {
      callback(f, meta);
    }
  });
};
