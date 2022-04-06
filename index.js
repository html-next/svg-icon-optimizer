'use strict';

const Funnel = require('broccoli-funnel');
const merge = require('broccoli-merge-trees');
const path = require('path');

function dasherize(str) {
  return str.replace(/[A-Z]/g, function (char, index) {
    return (index !== 0 ? '-' : '') + char.toLowerCase();
  });
}

function templatePrecompiler(env, usedIcons) {
  const b = env.syntax.builders;
  return {
    name: 'svg-component-rewrite',
    visitor: {
      ElementNode(node) {
        if (node.tag.startsWith('Icon::')) {
          const tag = node.tag;
          const parts = node.tag.split('::');
          parts.shift();
          const fullName = dasherize(parts.join('/'));
          usedIcons.set(fullName, tag);
          node.tag = 'SVGIcon';
          const attr = b.attr('@name', b.text(fullName));
          node.attributes.push(attr);
        }
      },
    },
  };
}

module.exports = {
  name: require('./package').name,

  parentIsAddon() {
    return this.parent !== this.project;
  },

  pathForMainFilesRoot() {
    const projectPath =
      this.parent.root || require.resolve(this.parent.options.name);

    return path.join(projectPath, this.parentIsAddon() ? 'addon' : 'app');
  },

  preprocessTree(type, tree) {
    if (type === 'template') {
      return new Funnel(tree, {
        exclude: ['components/icon/**'],
      });
    }
    return tree;
  },

  treeForPublic(tree) {
    const treeForIcons = new Funnel(
      path.join(this.pathForMainFilesRoot(), './components/icon'),
      {
        destDir: 'assets/component-icons',
        getDestinationPath(relativePath) {
          return relativePath.replace('.hbs', '.svg');
        },
      }
    );
    return tree
      ? merge([tree, treeForIcons], { overwrite: true })
      : treeForIcons;
  },

  setupPreprocessorRegistry(type, registry) {
    const usedIcons = new Map();
    // TODO make this something in the file system
    this.usedIcons = usedIcons;

    if (type === 'parent') {
      registry.add('htmlbars-ast-plugin', {
        name: 'svg-component-rewrite',
        ext: 'hbs',
        plugin: (env) => {
          // TODO write config to file so that this can be safely parallelized
          return templatePrecompiler(env, usedIcons);
        },
        // cacheKey: () => {},
        baseDir() {
          return __dirname;
        },
      });
    }
  },
};
