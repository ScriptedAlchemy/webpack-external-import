const { ContainerPlugin } = require('webpack-external-import');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
	entry: './src/index',
	cache: false,

	mode: 'production',

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
		new ContainerPlugin({
			name: 'website2',
			library: 'website2',
			filename: 'remoteEntry.js',
			libraryTarget: 'global',
			expose: {
				Title: './src/Title',
			},
		}),
		new HtmlWebpackPlugin({
			template: './src/template.html',
		}),
	],
};
