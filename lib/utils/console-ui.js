'use strict';

const UI = require('console-ui');

const ui = new UI({
  inputStream: process.stdin,
  outputStream: process.stderr,
  errorStream: process.stderr,
});

const prefix = '[ember-svg-jar]';

module.exports = {
  log: (message) => {
    ui.write('\n');
    ui.writeLine(JSON.stringify(message, null, 2));
  },

  warn: (message) => {
    ui.write('\n');
    ui.writeWarnLine(`${prefix} ${message}`);
  },

  error: (message) => {
    throw new Error(`${prefix} ${message}`);
  },
};
