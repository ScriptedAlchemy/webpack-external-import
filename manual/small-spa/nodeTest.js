const { small_spa } = require('./dist/website2HostedRemotes');

(async () => {
	const { default: mod } = await small_spa.get('Test');
	const { default: mod2 } = await small_spa.get('themes/dark');

	console.log({
		mod,
		mod2
	});
})();
