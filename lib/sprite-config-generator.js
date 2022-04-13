const Plugin = require('./utils/basic-plugin');
const path = require('path');
const fs = require('fs');
const recast = require('ember-template-recast');
const dasherize = require('./utils/dasherize');

function processFile(filePath, usedMap) {
  const file = fs.readFileSync(filePath, { encoding: 'utf-8' });
  const ast = recast.parse(file);
  recast.traverse(ast, {
    ElementNode(node) {
      if (node.tag.startsWith('Icon::')) {
        const tag = node.tag;
        const parts = node.tag.split('::');
        parts.shift();
        const fullName = parts.map(dasherize).join('/');
        usedMap.set(fullName, tag);
      }
    },
  });
}

module.exports = class SpriteConfigGenerator extends Plugin {
  constructor(inputNodes, config) {
    super(inputNodes, {
      name: 'SpriteConfigGenerator',
      annotation: 'compiles svg icon usage stats from template',
    });
    const used = (this.used = new Map());

    if (config.dynamicUsages) {
      config.dynamicUsages.forEach((key) => {
        used.set(key, '[[dynamic]]');
      });
    }
  }

  processFile(filePath) {
    processFile(filePath, this.used);
  }

  emit() {
    fs.writeFileSync(
      path.join(this.outputPath, 'svg-icon-usage-meta.json'),
      JSON.stringify(Object.fromEntries(this.used), null, 2),
      { encoding: 'utf-8' }
    );
  }
};
