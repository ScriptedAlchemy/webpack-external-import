const webpack = require('webpack');
const webpackConfig = require('../webpack.config');
const WebpackDevServer = require('webpack-dev-server');

let server;

const port = 8080;

const options = {
    publicPath: webpackConfig.output.publicPath,
    hot: false,
    inline: false,
    contentBase: 'www',
    stats: { colors: true },
    watchOptions: {
        watch: false,
    },
};

function start() {
    console.log('Starting the dev web server...');
    
    const app = new WebpackDevServer(webpack(webpackConfig), options);

    return new Promise((resolve, reject) => {
        app.listen(port, 'localhost', function (err) {
            server = app.listeningApp;
            if (err) {
                console.log(err);
                reject();
            }
            console.log('WebpackDevServer listening at localhost:', port);
            resolve();
        });
    });
}

function stop() {
    server.close();
}

module.exports = {
    start,
    stop,
};