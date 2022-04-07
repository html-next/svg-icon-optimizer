const Plugin = require('./utils/basic-plugin');
const path = require('path');
const fs = require('fs');
const formatAttrs = require('./utils/format-attrs');
const consoleUI = require('./utils/console-ui');
const cheerio = require('cheerio');

function processSVG(svgContent, symbolName, filePath) {
  let $svg = cheerio.load(svgContent, { xmlMode: true })('svg');
  let [svgAttrs, svgHTML] = [$svg.attr(), $svg.html()];

  if (!svgHTML || !svgAttrs) {
    consoleUI.warn(`invalid SVG found ${filePath}`);
    return '';
  }

  let symbolAttrs = {
    id: symbolName,
    viewBox: svgAttrs.viewBox,
  };
  let symbolContent = `<symbol ${formatAttrs(symbolAttrs)}></symbol>`;
  let $symbolWrapper = cheerio.load(symbolContent, { xmlMode: true });
  let $symbol = $symbolWrapper('symbol');

  $symbol.html(svgHTML);
  return $symbolWrapper.html();
}

/**
 * Roughly how it works:
 * - find all elements that are referenced by `#id`, e.g. `fill="url(#gradient)"`
 * - now we have referenced elements (targets), e.g. `<linearGradient ... id="gradient">...`
 * - change target's id to make it unique
 * - change all references to target inside symbol to have new id
 * - remove target from the symbol
 * - add target to the sprite's defs
 * - add updated symbol to the sprite
 */
function extractDefs(svgContent) {
  let $svg = cheerio.load(svgContent, { xmlMode: true });
  let $newSvg = cheerio.load(
    `<svg ${formatAttrs($svg('svg').attr())}><defs /></svg>`,
    { xmlMode: true }
  );
  let $defs = $newSvg('defs');

  $svg('symbol').each((_, element) => {
    const $symbol = $svg(element);
    const extractedRefIds = $svg('[id]', $symbol)
      .filter((_, elementWithId) =>
        $symbol.html().includes(`#${$svg(elementWithId).attr('id')}`)
      )
      .map((_, referencedEl) => {
        const $referencedEl = $svg(referencedEl);
        const refId = $referencedEl.attr('id');
        $referencedEl.attr('id', `${$symbol.attr('id')}-${refId}`);
        $referencedEl.remove();
        $defs.append($referencedEl);
        return refId;
      });
    $svg('defs', $symbol).remove();
    let symbolHtml = `<symbol ${formatAttrs(
      $symbol.attr()
    )}>${$symbol.html()}</symbol>`;
    extractedRefIds.each((_, refId) => {
      symbolHtml = symbolHtml.replace(
        `#${refId}`,
        `#${$symbol.attr('id')}-${refId}`
      );
    });
    $defs.after(symbolHtml);
  });

  return $defs.children().length ? $newSvg.html() : svgContent;
}

module.exports = class SpriteGenerator extends Plugin {
  constructor(inputNodes, options = {}) {
    super(inputNodes, {
      name: 'SpriteAssembler',
      annotation: 'compiles svg icon sprite from stats',
    });
    this.symbols = new Map();
    this.fileMap = new Map();
    this.usageMeta = null;

    let config = Object.assign({}, { persist: true, svgAttrs: {} }, options);
    Object.assign(
      config.svgAttrs,
      {
        style: 'position: absolute; width: 0; height: 0;',
        width: '0',
        height: '0',
        version: '1.1',
        xmlns: 'http://www.w3.org/2000/svg',
        'xmlns:xlink': 'http://www.w3.org/1999/xlink',
      },
      options.svgAttrs
    );

    this.config = config;
  }

  processFile(filePath, meta) {
    if (filePath.endsWith('.svg')) {
      let symbolName = filePath.replace(meta.inputPath, ''); // to-do definitely not this
      symbolName = symbolName.replace('.svg', '');
      symbolName = symbolName.replace('/assets/component-icons/', '');
      this.fileMap.set(symbolName, filePath);
    } else if (filePath.endsWith('svg-icon-usage-meta.json')) {
      this.usageMeta = JSON.parse(
        fs.readFileSync(filePath, { encoding: 'utf-8' })
      );
      // ignore indexing by default
    } else if (!filePath.endsWith('.DS_Store')) {
      consoleUI.warn(
        `Unexpected file ${filePath} in sprite-assembler tree for @html-next/svg-icon-optimizer`
      );
    }
  }

  emit() {
    if (!this.usageMeta) {
      throw new Error(
        `unable to build sprite-assembler tree for @html-next/svg-icon-optimizer, expected usage meta file but found none.`
      );
    }
    const contents = [`<svg ${formatAttrs(this.config.svgAttrs)}>`];
    Object.keys(this.usageMeta).forEach((symbolName) => {
      const filePath = this.fileMap.get(symbolName);
      if (filePath) {
        const file = fs.readFileSync(filePath, { encoding: 'utf-8' });
        contents.push(processSVG(file, symbolName, filePath));
      } else {
        consoleUI.warn(
          `missing icon for ${symbolName} (${this.usageMeta[symbolName]})`
        );
      }
    });
    contents.push('</svg>');
    const spriteFile = contents.join('');

    fs.mkdirSync(path.join(this.outputPath, 'assets/images'), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(this.outputPath, 'assets/images/component-icon-sprite.svg'),
      extractDefs(spriteFile),
      { encoding: 'utf-8' }
    );
  }
};
