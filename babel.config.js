module.exports = {
	presets: [
		[
			require.resolve('@babel/preset-env'),
			{
				targets: {
					node: true,
				},
			},
		],
	],
	plugins: [
		require.resolve('@babel/plugin-proposal-optional-chaining'),
		require.resolve('@babel/plugin-proposal-nullish-coalescing-operator'),
	],
};
