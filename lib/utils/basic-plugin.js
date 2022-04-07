const Plugin = require('broccoli-plugin');
const walkTree = require('./walk-tree');

module.exports = class BasePlugin extends Plugin {
  constructor(inputNodes, options = {}) {
    super(Array.isArray(inputNodes) ? inputNodes : [inputNodes], options);

    this.options = options;
  }

  processFile() {}
  emit() {}

  build() {
    this.inputPaths.forEach((inputPath) => {
      walkTree(
        inputPath,
        { inputPath, fullPath: inputPath },
        (filePath, meta) => {
          this.processFile(filePath, meta);
        }
      );
    });
    this.emit();
  }
};
