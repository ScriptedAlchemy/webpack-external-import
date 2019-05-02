const webpack = require('webpack');
const webpackConfig = require('../webpack.config');
const WebpackDevServer = require('webpack-dev-server');

let server;

console.log('Starting the dev web server...');
const port = 8080;

const options = {
    publicPath: webpackConfig.output.publicPath,
    hot: true,
    inline: true,
    contentBase: 'www',
    stats: { colors: true }
};

function start() {
    const app = new WebpackDevServer(webpack(webpackConfig), options);

    return new Promise((resolve, reject) => {
        server = app.listen(port, 'localhost', function (err) {
            if (err) {
                console.log(err);
                reject();
            }
            console.log('WebpackDevServer listening at localhost:', port);
            resolve();
        });
    });
}

function stop() {}

module.exports = {
    start,
    stop,
};