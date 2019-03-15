/* eslint-disable */

const { transform } = require('@babel/core');
const plugin = require('../dist/babel');
const { readFileSync } = require('fs');

const source = readFileSync('manual/source.js', 'utf8');


const result = transform(source, {
  plugins: [
    [plugin, {}],
  ],
});


console.log('######################');
console.log('######################');

console.log(result.code);
