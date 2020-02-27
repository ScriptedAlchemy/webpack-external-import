const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
	entry: './src/index',
	cache: false,

	mode: 'development',
	devtool: 'source-map',

	optimization: {
		minimize: false,
	},

	output: {
		publicPath: 'http://localhost:3001/',
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
			name: 'website1',
			library: { type: 'var', name: 'website1' },
			filename: 'remoteEntry.js',
			remotes: {
				website2: 'website2',
			},
			shared: ['react'],
		}),
		new HtmlWebpackPlugin({
			template: './src/template.html',
		}),
	],
};
