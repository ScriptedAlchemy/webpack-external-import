import JavascriptModulesPlugin from 'webpack/lib/javascript/JavascriptModulesPlugin';
import Template from 'webpack/lib/Template';
import propertyAccess from 'webpack/lib/util/propertyAccess';
import validateOptions from 'schema-utils';
import ContainerExposedDependency from './ContainerExposedDependency';
import { ConcatSource } from 'webpack-sources';
import ContainerEntryDependency from './ContainerEntryDependency';
import ContainerEntryModuleFactory from './ContainerEntryModuleFactory';
import SharedModuleFactoryPlugin from './SharedModuleFactoryPlugin';

export default class ContainerPlugin {
	static get name() {
		return ContainerPlugin.constructor.name;
	}

	constructor(options) {
		const name = options.name ?? `remoteEntry`;

		validateOptions(
			{
				type: 'object',
				properties: {
					shared: {
						type: 'object',
					},
					expose: {
						type: ['object', 'array'],
					},
					name: {
						type: 'string',
						default: name,
					},
					library: {
						type: 'string',
						default: name,
					},
					libraryTarget: {
						type: 'string',
						default: 'global',
						enum: [
							'var',
							'this',
							'window',
							'self',
							'global',
							'commonjs',
							'commonjs2',
							'amd',
							'amd-require',
							'umd',
							'umd2',
							'system',
						],
					},
					filename: {
						anyOf: [{ type: 'string' }, { instanceof: 'Function' }],
					},
				},
				additionalProperties: false,
			},
			options,
			{ name: ContainerPlugin.name },
		);

		this.options = {
			shared: options.shared ?? null,
			name,
			library: options.library ?? name,
			libraryTarget: options.libraryTarget ?? 'global',
			filename: options.filename ?? undefined, // Undefined means, use the default behaviour
			expose: options.expose ?? {},
		};
	}

	apply(compiler) {
		if (compiler.options.optimization.runtimeChunk) {
			throw new Error(
				'This plugin cannot integrate with RuntimeChunk plugin, please remote `optimization.runtimeChunk`.',
			);
		}

		compiler.options.output.jsonpFunction = `${
			compiler.options.output.jsonpFunction
		}${compiler.name ?? ''}${this.options.name}`;

		compiler.hooks.make.tapAsync(
			ContainerPlugin.name,
			(compilation, callback) => {
				let exposedMap = this.options.expose;

				if (Array.isArray(this.options.expose)) {
					exposedMap = {};
					for (const exp of this.options.expose) {
						// TODO: Check if this regex handles all cases
						exposedMap[exp.replace(/(^(?:[^\w])+)/, '')] = exp;
					}
				}

				compilation.addEntry(
					compilation.context,
					new ContainerEntryDependency(
						Object.entries(exposedMap).map(([name, request], idx) => {
							const dep = new ContainerExposedDependency(name, request);
							dep.loc = {
								name,
								index: idx,
							};
							return dep;
						}),
						this.options.name,
					),
					this.options.name,
					callback,
				);
			},
		);

		// compiler.hooks.compile.tap(
		// 	ContainerPlugin.name,
		// 	({ normalModuleFactory }) => {
		// 		new SharedModuleFactoryPlugin(
		// 			compiler.options.libraryTarget,
		// 			this.options.shared,
		// 		).apply(normalModuleFactory);
		// 	},
		// );

		compiler.hooks.compilation.tap(ContainerPlugin.name, ({ mainTemplate }) => {
			mainTemplate.hooks.requireExtensions.tap('URLImportPlugin', source => {
				return Template.asString([
					source,
					'__webpack_require__.shared = __webpack_require__',
				]);
			});
		});

		compiler.hooks.thisCompilation.tap(
			ContainerPlugin.name,
			(compilation, { normalModuleFactory }) => {
				compilation.dependencyFactories.set(
					ContainerEntryDependency,
					new ContainerEntryModuleFactory(),
				);

				compilation.dependencyFactories.set(
					ContainerExposedDependency,
					normalModuleFactory,
				);

				const renderHooks = JavascriptModulesPlugin.getCompilationHooks(
					compilation,
				);

				renderHooks.render.tap(ContainerPlugin.name, (source, { chunk }) => {
					if (chunk.name === this.options.name) {
						const libName = Template.toIdentifier(
							compilation.getPath(this.options.library, {
								chunk,
							}),
						);

						switch (this.options.libraryTarget) {
							case 'var': {
								return new ConcatSource(`var ${libName} =`, source);
							}
							case 'this':
							case 'window':
							case 'self':
								return new ConcatSource(
									`${this.options.libraryTarget}${propertyAccess([libName])} =`,
									source,
								);
							case 'global':
								return new ConcatSource(
									`${compiler.options.output.globalObject}${propertyAccess([
										libName,
									])} =`,
									source,
								);
							case 'commonjs':
							case 'commonjs2': {
								return new ConcatSource(
									`exports${propertyAccess([libName])} =`,
									source,
								);
							}
							case 'amd': // TODO: Solve this?
							case 'amd-require': // TODO: Solve this?
							case 'umd': // TODO: Solve this?
							case 'umd2': // TODO: Solve this?
							case 'system': // TODO: Solve this?
							default:
								throw new Error(
									`${this.options.libraryTarget} is not a valid Library target`,
								);
						}
					}
				});

				compilation.hooks.afterChunks.tap(ContainerPlugin.name, chunks => {
					for (const chunk of chunks) {
						if (chunk.name === this.options.name) {
							chunk.preventIntegration = true; // TODO: Check that this is actually needed
							chunk.filenameTemplate = this.options.filename;
						}
					}
				});
			},
		);
	}
}
