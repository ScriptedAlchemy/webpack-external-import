const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');

const webpackConfig1 = require('./Website1/webpack.config');
const webpackConfig2 = require('./Website2/webpack.config');

let app; let
  app2;

const options = {
  publicPath: webpackConfig1.output.publicPath,
  hot: false,
  hotOnly: false,
  inline: true,
  contentBase: 'www',
  stats: { colors: true },
  watchOptions: {
    watch: false,
  },
  open: false,
  noInfo: true,
};
const options2 = Object.assign({}, options, {
  publicPath: webpackConfig2.output.publicPath,
});

function start() {
  console.log('Starting the dev web server...');
  app = new WebpackDevServer(webpack(webpackConfig1), options);
  app2 = new WebpackDevServer(webpack(webpackConfig2), options2);

  return Promise.all([
    new Promise((resolve, reject) => {
      app.middleware.waitUntilValid(() => {
        console.log('MFE #1 compilation valid');
        resolve();
      });
    })
      .then(() => new Promise((resolve, reject) => {
        app.listen(3001, 'localhost', (err) => {
          if (err) {
            console.log(err);
            reject();
          }

          console.log('WebpackDevServer for MFE #2 listening at localhost:', 3001);
          resolve();
        });
      })),
    new Promise((resolve, reject) => {
      app2.middleware.waitUntilValid(() => {
        console.log('MFE #2 compilation valid');
        resolve();
      });
    })
      .then(() => new Promise((resolve, reject) => {
        app2.listen(3002, 'localhost', (err) => {
          if (err) {
            console.log(err);
            reject();
          }

          console.log('WebpackDevServer for MFE #2 listening at localhost:', 3002);
          resolve();
        });
      })),
  ]);
}

function stop() {
  app.listeningApp.close();
  app2.listeningApp.close();

  return Promise.all([
    new Promise(resolve => app.middleware.close(resolve)),
    new Promise(resolve => app2.middleware.close(resolve)),
  ]);
}

module.exports = {
  start,
  stop,
};
