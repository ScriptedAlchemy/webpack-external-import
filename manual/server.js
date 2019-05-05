const webpack = require('webpack');
const webpackConfig1 = require('./Website1/webpack.config');
const webpackConfig2 = require('./Website2/webpack.config');
const WebpackDevServer = require('webpack-dev-server');

let server, server2;


const options = {
  publicPath: webpackConfig1.output.publicPath,
  hot: false,
  inline: false,
  contentBase: 'www',
  stats: {colors: true},
  watchOptions: {
    watch: false,
  },
};

const options2 = Object.assign({}, options, {
  publicPath: webpackConfig2.output.publicPath,
})

function start() {
  console.log('Starting the dev web server...');
  const app = new WebpackDevServer(webpack(webpackConfig1), options);

  const app2 = new WebpackDevServer(webpack(webpackConfig2), options2);

  return new Promise((resolve, reject) => {
    app.listen(3001, 'localhost', function (err) {
      server = app.listeningApp;
      if (err) {
        console.log(err);
        reject();
      }
      console.log('WebpackDevServer listening at localhost:', 3001);


      app2.listen(3002, 'localhost', function (err) {
        server2 = app2.listeningApp;
        if (err) {
          console.log(err);
          reject();
        }
        console.log('WebpackDevServer listening at localhost:', 3002);
        resolve();
      });
    });
  });
}

function stop() {
  server.close();
  server2.close();
}

module.exports = {
  start,
  stop,
};
