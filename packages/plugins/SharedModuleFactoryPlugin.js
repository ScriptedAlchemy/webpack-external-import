import SharedModule from './SharedModule';
const UNSPECIFIED_EXTERNAL_TYPE_REGEXP = /^[a-z0-9]+ /;

export default class SharedModuleFactoryPlugin {
	constructor(type, sharedModules) {
		this.shared = sharedModules;
	}

	apply(normalModuleFactory) {
		const globalType = this.remoteType;
		normalModuleFactory.hooks.factorize.tapAsync(
			'SharedModuleFactoryPlugin',
			(data, callback) => {
				const { context } = data;
				const dependency = data.dependencies[0];

				const handleShared = (value, type, callback) => {
					console.log({ value, type, callback });

					if (value === false) {
						// Not externals, fallback to original factory
						return callback();
					}

					let externalConfig;
					if (value === true) {
						externalConfig = dependency.request;
					} else {
						externalConfig = value;
					}

					// When no explicit type is specified, extract it from the externalConfig
					if (
						type === undefined &&
						UNSPECIFIED_EXTERNAL_TYPE_REGEXP.test(externalConfig)
					) {
						const idx = externalConfig.indexOf(' ');
						type = externalConfig.substr(0, idx);
						externalConfig = externalConfig.substr(idx + 1);
					}

					callback(
						null,
						new SharedModule(
							externalConfig,
							type || globalType,
							dependency.request,
						),
					);
				};

				const handleExternals = (shared, callback) => {
					if (typeof shared === 'string') {
						if (shared[dependency.request]) {
							return handleShared(
								dependency.request,
								undefined,
								callback,
							);
						}
					} else if (Array.isArray(shared)) {
						let i = 0;
						const next = () => {
							let asyncFlag;
							const handleExternalsAndCallback = (
								err,
								module,
							) => {
								if (err) return callback(err);
								if (!module) {
									if (asyncFlag) {
										asyncFlag = false;
										return;
									}
									return next();
								}
								callback(null, module);
							};

							do {
								asyncFlag = true;
								if (i >= shared.length) return callback();
								handleExternals(
									shared[i++],
									handleExternalsAndCallback,
								);
							} while (!asyncFlag);
							asyncFlag = false;
						};

						next();
						return;
					} else if (
						typeof shared === 'object' &&
						Object.prototype.hasOwnProperty.call(
							shared,
							dependency.request,
						)
					) {
						if (shared[dependency.request]) {
							return handleShared(
								shared[dependency.request],
								undefined,
								callback,
							);
						}
					}
					callback();
				};
				handleExternals(this.shared, callback);
			},
		);
	}
}
