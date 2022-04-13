'use strict';

const Funnel = require('broccoli-funnel');
const merge = require('broccoli-merge-trees');
const SVGOptimizer = require('./lib/svgo-optimizer');
const path = require('path');
const SpriteConfigGenerator = require('./lib/sprite-config-generator');
const SpriteAssembler = require('./lib/sprite-assembler');
const dasherize = require('./lib/utils/dasherize');
const BroccoliDebug = require('broccoli-debug');

function templatePrecompiler(env) {
  const b = env.syntax.builders;
  return {
    name: 'svg-component-rewrite',
    visitor: {
      ElementNode(node) {
        if (node.tag.startsWith('Icon::')) {
          const parts = node.tag.split('::');
          parts.shift();
          const fullName = parts.map(dasherize).join('/');
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
    const parentName =
      typeof this.parent.name === 'string'
        ? this.parent.name
        : this.parent.name();
    if (type === 'js') {
      // prevent the glimmer precompile from including js files for these
      return new Funnel(tree, {
        exclude: [`${parentName}/components/icon/**/*.js`],
      });
    }
    if (type === 'template') {
      return new BroccoliDebug(
        new Funnel(tree, {
          exclude: [`${parentName}/components/icon/**/*.hbs`],
        }),
        'html-next:hbs-sans-svg'
      );
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
    const treeForTemplates = new Funnel(this.pathForMainFilesRoot(), {
      include: ['**/*.hbs'],
      exclude: ['components/icon/**/*.hbs'],
      getDestinationPath(relativePath) {
        return relativePath.replace('.hbs', '.svg');
      },
    });
    const config = this.getConfig();
    console.log({ config });
    const configTree = new BroccoliDebug(
      new SpriteConfigGenerator(treeForTemplates, config),
      'html-next:sprite-config'
    );

    const TrulyRemoveComments = {
      name: 'Remove Comments Starting With !',
      type: 'visitor',
      fn: () => {
        return {
          comment: {
            enter: (node, parentNode) => {
              if (node.value.charAt(0) === '!') {
                parentNode.children = parentNode.children.filter(
                  (child) => child !== node
                );
              }
            },
          },
        };
      },
    };

    const compiled = new SVGOptimizer(treeForIcons, {
      persist: false,
      svgoConfig: {
        multipass: true,
        plugins: ['preset-default', TrulyRemoveComments],
      },
    });
    const spriteTree = new SpriteAssembler([configTree, compiled]);
    return tree
      ? merge([tree, spriteTree, compiled], { overwrite: true })
      : merge([spriteTree, compiled], { overwrite: true });
  },

  getConfig() {
    if (this.parentIsAddon()) {
      let options = this.parent.options || {};
      return options.svgIconOptimizer || {};
    } else {
      const app = this._findHost();

      let options = (app.options = app.options || {});
      options.svgIconOptimizer = options.svgIconOptimizer || {};

      return options.svgIconOptimizer;
    }
  },

  setupPreprocessorRegistry(type, registry) {
    if (type === 'parent') {
      registry.add('htmlbars-ast-plugin', {
        name: 'svg-component-rewrite',
        ext: 'hbs',
        plugin: templatePrecompiler,
        cacheKey: () => {
          return `${Date.now()}`; // use this to deactivate when deving
        },
        baseDir() {
          return __dirname;
        },
      });
    }
  },
};
