const fs = require('fs');
const path = require('path');
const babel = require("@babel/core");

function ensureDirectoryExistence(filePath) {
  var dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

describe('Babel Transform Integrity', () => {
  const casesDirectory = path.resolve(__dirname, 'cases');
  for (const directory of fs.readdirSync(casesDirectory)) {
    if (!/^(\.|_)/.test(directory)) {
      // eslint-disable-next-line no-loop-func
      it(`${directory} should compile to the expected result`, (done) => {
        const directoryForCase = path.resolve(casesDirectory, directory);
        const testCase = path.resolve(
          directoryForCase,
          'index.js'
        )

        const output = babel.transformFileSync(testCase,
          {
            "plugins": [
              require.resolve("../../babel"),
              "@babel/plugin-syntax-dynamic-import",
              "@babel/plugin-proposal-class-properties"
            ]
          }).code;

        expect(output).toMatchSnapshot();
        done();
        // });
      }, 10000);
    }
  }
});
