const { ContainerPlugin } = require('webpack-external-import');

module.exports = {
	entry: './src',
	cache: false,

	mode: 'production',

	optimization: {
		minimize: false,
	},

	output: {
		filename: '[name]-[contenthash].js',
		chunkFilename: 'chunks/[name]-[contenthash].js',
	},

	module: {
		rules: [
			{
				test: /\.css$/,
				use: [
					{ loader: require.resolve('style-loader') },
					{ loader: require.resolve('css-loader') },
				],
			},
		],
	},

	plugins: [
		new ContainerPlugin({
			name: 'small-spa',
			filename: 'website2HostedRemotes.js',
			libraryTarget: 'global',
			expose: {
				Test: './src/asyncThing',
				'themes/dark': './src/testing.css',
			},
		}),
	],
};
