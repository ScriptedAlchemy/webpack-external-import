const ContainerReferencePlugin = require('webpack/lib/container/ContainerReferencePlugin');
const ContainerPlugin = require('webpack/lib/container/ContainerPlugin');
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
		new ContainerPlugin({
			overridables: ["react"],
			name: "website1",
			filename: "remoteEntry.js"
		}),

		// both these doesnt work.
		// new ContainerReferencePlugin({
		// 	remoteType: "var",
		// 	remotes: {
		// 		website2: "website2",
		// 	},
		// 	// overrides: ['somethingrandom']
		// }),
		// throws:
// 		bootstrap:18 Uncaught TypeError: __webpack_modules__[moduleId] is not a function
// at __webpack_require__ (bootstrap:18)
// at Object../src/index.jsx (main.js:37)
// at __webpack_require__ (bootstrap:18)
// at startup:4
// at startup:4

		// new ModuleFederationPlugin({
		// 	name: 'website1',
		// 	library: { type: 'var', name: 'website1' },
		// 	filename: 'remoteEntry.js',
		// 	remotes: {
		// 		website2: 'website2',
		// 	},
		// 	shared: ['react'],
		// }),
		new HtmlWebpackPlugin({
			template: './src/template.html',
		}),
	],
};
