import Module from 'webpack/lib/Module';
import AsyncDependenciesBlock from 'webpack/lib/AsyncDependenciesBlock';
import RuntimeGlobals from 'webpack/lib/RuntimeGlobals';
import Template from 'webpack/lib/Template';
import { ConcatSource } from 'webpack-sources';

const SOURCE_TYPES = new Set(['javascript']);
const RUNTIME_REQUIREMENTS = new Set([
	RuntimeGlobals.definePropertyGetters,
	RuntimeGlobals.exports,
	RuntimeGlobals.returnExportsFromRuntime,
]);

export default class ContainerEntryModule extends Module {
	constructor(dependency) {
		super('javascript/dynamic', null);
		this.expose = dependency.exposedDependencies;
	}

	getSourceTypes() {
		return SOURCE_TYPES;
	}

	identifier() {
		return `container entry ${JSON.stringify(
			this.expose.map(item => item.exposedName),
		)}`;
	}

	readableIdentifier() {
		return `container entry`;
	}

	needBuild(context, callback) {
		return callback(null, !this.buildMeta);
	}

	build(options, compilation, resolver, fs, callback) {
		this.buildMeta = {};
		this.buildInfo = {
			strict: true,
		};

		this.clearDependenciesAndBlocks();

		for (const dep of this.expose) {
			const block = new AsyncDependenciesBlock(
				undefined,
				dep.loc,
				dep.userRequest,
			);
			block.addDependency(dep);
			this.addBlock(block);
		}

		callback();
	}

	codeGeneration({ moduleGraph, chunkGraph, runtimeTemplate }) {
		const sources = new Map();
		const runtimeRequirements = RUNTIME_REQUIREMENTS;
		const getters = [];

		for (const block of this.blocks) {
			const {
				dependencies: [dep],
			} = block;
			const name = dep.exposedName;
			const mod = moduleGraph.getModule(dep);
			const request = dep.userRequest;

			let str;

			if (!mod) {
				str = runtimeTemplate.throwMissingModuleErrorBlock({
					request: dep.userRequest,
				});
			} else {
				str = `return ${runtimeTemplate.blockPromise({
					block,
					message: request,
					chunkGraph,
					runtimeRequirements,
				})}.then(${runtimeTemplate.basicFunction(
					'',
					`return ${runtimeTemplate.moduleRaw({
						module: mod,
						chunkGraph,
						request,
						weak: false,
						runtimeRequirements,
					})}`,
				)});`;
			}

			getters.push(
				`${Template.toNormalComment(
					`[${name}] => ${request}`,
				)}"${name}": ${runtimeTemplate.basicFunction('', str)}`,
			);
		}

		sources.set(
			'javascript',
			new ConcatSource(
				`\n${runtimeTemplate.supportsConst() ? "const" : "var"} __MODULE_MAP__ = {${getters.join(',')}};`,
				`\n${runtimeTemplate.supportsConst() ? "const" : "var"} __GET_MODULE__ = ${runtimeTemplate.basicFunction(
					['module'],
					`return typeof __MODULE_MAP__[module] ==='function' ? __\) : Promise.reject(new Error('Module ' + module + ' does not exist.'))`,
				)};`,
				`\n\n${RuntimeGlobals.definePropertyGetters}(exports, {\n`,
				Template.indent([
					`get: ${runtimeTemplate.basicFunction(
						'',
						'return __GET_MODULE__',
					)},`,
					`shared: ${runtimeTemplate.basicFunction(
						['module', 'getter'],
						'__webpack_require__.shared[module] = getter;',
					)}`,
				]),
				`});`,
			),
		);

		website2.get('title').then(module.default)

		return {
			sources,
			runtimeRequirements,
		};
	}

	size(type) {
		return 42;
	}
}
