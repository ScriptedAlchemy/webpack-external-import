const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
	entry: './src/index',
	cache: false,

	mode: 'development',

	optimization: {
		minimize: false,
	},

	output: {
		publicPath: 'http://localhost:3002/',
	},

	resolve: {
		extensions: ['.jsx', '.js', '.json'],
	},

	module: {
		rules: [
			{
				test: /\.jsx?$/,
				loader: require.resolve('babel-loader'),
				options: {
					rootMode: 'upward',
					presets: [require.resolve('@babel/preset-react')],
				},
			},
		],
	},

	plugins: [
		new ModuleFederationPlugin({
			name: 'website2',
			library: { type: 'var', name: 'website2' },
			filename: 'remoteEntry.js',
			exposes: {
				Title: './src/Title',
			},
			remotes: {
				website1: 'website1',
			},
			// shared: ['react'],
		}),
		new HtmlWebpackPlugin({
			template: './src/template.html',
		}),
	],
};
