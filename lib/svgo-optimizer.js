'use strict';

const PersistentFilter = require('broccoli-persistent-filter');
const stringify = require('safe-stable-stringify');
const { optimize } = require('svgo');

class SVGOFilter extends PersistentFilter {
  constructor(inputNode, options) {
    options = options || {};

    super(inputNode, {
      name: 'SVGOFilter',
      extensions: ['svg'],
      // async: true,
      targetExtension: 'svg',
      persist: typeof options.persist === 'undefined' ? true : options.persist,
      annotation: options.annotation,
    });

    this.options = options;
    this.optionsHash = stringify(options);
  }

  processString(svg, relativePath) {
    const options = Object.assign({}, this.options.svgoConfig, {
      path: relativePath,
    });
    const result = svg ? optimize(svg, options).data : '';

    return result;
  }

  cacheKeyProcessString(string, relativePath) {
    return super.cacheKeyProcessString(string + this.optionsHash, relativePath);
  }

  baseDir() {
    return __dirname;
  }
}

module.exports = SVGOFilter;
