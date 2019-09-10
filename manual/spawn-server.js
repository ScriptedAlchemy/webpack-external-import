const path = require('path');
const { spawn } = require('child_process');

const binPath = path.resolve(__dirname, './node_modules/.bin');
const crossEnvPath = path.resolve(binPath, 'cross-env');
const webpackDevServerPath = path.resolve(binPath, 'webpack-dev-server');
const path1 = path.resolve(__dirname, './Website1/webpack.config.js');
const path2 = path.resolve(__dirname, './Website2/webpack.config.js');

let mfe1;
let mfe2;

async function start() {
  process.stdout.write('Starting MFE #1...\n');
  process.stdout.write('Starting MFE #2...\n');
  mfe1 = spawn(crossEnvPath, ['NODE_ENV=production', webpackDevServerPath, '--config', path1]);
  mfe2 = spawn(crossEnvPath, ['NODE_ENV=production', webpackDevServerPath, '--config', path2]);

  return Promise.all([
    new Promise((resolve, reject) => {
      mfe1.stdout.on('data', (data) => {
        if (data.indexOf('Compiled with warnings.') >= -1) {
          resolve();
        }
      });
      mfe1.on('error', (err) => {
        process.stdout.write(`ERROR ${err}\n`);
        reject(err);
      });
      mfe1.on('exit', (code) => {
        process.stdout.write(`process exited with code ${code}\n`);
        reject(code);
      });
    }),
    new Promise((resolve, reject) => {
      mfe2.stdout.on('data', (data) => {
        if (data.indexOf('Compiled with warnings.') >= -1) {
          resolve();
        }
      });
      mfe2.on('error', (err) => {
        process.stdout.write(`ERROR ${err}\n`);
        reject(err);
      });
      mfe2.on('exit', (code) => {
        process.stdout.write(`process exited with code ${code}\n`);
        reject(code);
      });
    }),
  ]).then(() => process.stdout.write('MFE\'s ready.\n'));
}

function stop() {
  mfe1.kill();
  mfe2.kill();
}

module.exports = {
  start,
  stop,
};
