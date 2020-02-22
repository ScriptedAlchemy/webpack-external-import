import RemoteModule from './RemoteModule';
import OverridablesPlugin from 'webpack/lib/container/OverridablesPlugin';

const UNSPECIFIED_EXTERNAL_TYPE_REGEXP = /^[a-z0-9]+ /;

class RemoteModuleFactoryPlugin {
	constructor(type, remotes) {
		this.remoteType = type;
		this.remotes = remotes;
	}

	apply(normalModuleFactory) {
		const globalType = this.remoteType;
		normalModuleFactory.hooks.factorize.tapAsync(
			'RemoteModuleFactoryPlugin',
			(data, callback) => {
				const { context } = data;
				const dependency = data.dependencies[0];

				const handleRemote = (value, type, callback) => {
					if (value === false) {
						// Not externals, fallback to original factory
						return callback();
					}
					/** @type {string} */
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
						new RemoteModule(
							externalConfig,
							type || globalType,
							dependency.request,
						),
					);
				};

				const handleExternals = (remotes, callback) => {
					if (typeof remotes === 'string') {
						const requestScope = data?.request?.split('/')?.shift?.();

						if (this.remotes?.includes(requestScope)) {
							return handleRemote(dependency.request, undefined, callback);
						}
					} else if (Array.isArray(remotes)) {
						let i = 0;
						const next = () => {
							let asyncFlag;
							const handleExternalsAndCallback = (err, module) => {
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
								if (i >= remotes.length) return callback();
								handleExternals(remotes[i++], handleExternalsAndCallback);
							} while (!asyncFlag);
							asyncFlag = false;
						};

						next();
						return;
					} else if (
						typeof remotes === 'object' &&
						Object.prototype.hasOwnProperty.call(remotes, dependency.request)
					) {
						return handleRemote(
							remotes[dependency.request],
							undefined,
							callback,
						);
					}
					callback();
				};

				handleExternals(this.remotes, callback);
			},
		);
	}
}

export default class ContainerReferencePlugin {
	static get name() {
		return ContainerReferencePlugin.constructor.name;
	}

	constructor(options) {
		this.options = {
			remoteType: options.remoteType ?? 'global',
			remotes: options.remotes ?? [],
			overridables: options.overridables ?? {},
		};

		// TODO: Apply some validation around what was passed in.
	}

	apply(compiler) {
		const { remotes, remoteType } = this.options;

		compiler.hooks.compile.tap(
			ContainerReferencePlugin.name,
			({ normalModuleFactory }) => {

				new RemoteModuleFactoryPlugin(remoteType, remotes).apply(
					normalModuleFactory,
				);
			},
		);
	}
}
