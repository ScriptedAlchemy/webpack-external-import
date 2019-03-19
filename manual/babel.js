/* eslint-disable */

const { transform } = require('@babel/core');
const fs = require('fs');
const plugin = require('../dist/babel');
const { readFileSync } = require('fs');

const source = readFileSync('manual/source.js', 'utf8');


const result = transform(source, {
  presets: [
    '@babel/preset-react'
  ],
  plugins: [
    [plugin, {}],
  ],
});

fs.writeFile('manual/result.js', result.code, function (err) {
  if (err) {
    return console.log(err);
  }
});
