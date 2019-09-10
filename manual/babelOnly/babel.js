const { transform } = require('@babel/core');
const fs = require('fs');
const { readFileSync } = require('fs');
const plugin = require('../../babel');

const source = readFileSync('manual/source.js', 'utf8');


const result = transform(source, {
  presets: [
    '@babel/preset-react',
  ],
  plugins: [
    [plugin, {}],
  ],
});

fs.writeFile('manual/result.js', result.code, (err) => {
  if (err) {
    return console.log(err);
  }
});
