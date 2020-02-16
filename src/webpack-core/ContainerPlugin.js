const Dependency = require("webpack/lib/Dependency");
const Module = require("webpack/lib/Module");
const ModuleDependency = require("webpack/lib/dependencies/ModuleDependency");
const AsyncDependenciesBlock = require("webpack/lib/AsyncDependenciesBlock");
const RuntimeGlobals = require("webpack/lib/RuntimeGlobals");
const ModuleFactory = require("webpack/lib/ModuleFactory");
const { ConcatSource } = require("webpack-sources");

const PLUGIN_NAME = "ContainerPlugin";

class ContainerExposedDependency extends ModuleDependency {
  constructor(name, request) {
    super(request);
    this._name = name;
  }

  get exposedName() {
    return this._name;
  }

  getResourceIdentifier() {
    return `exposed dependency ${this._name}`;
  }
}

class ContainerEntryDependency extends Dependency {
  constructor(dependencies, name) {
    super();
    this.exposedDependencies = dependencies;
    this.optional = true;
    this.loc = { name };
  }
}

const CONTAINER_ENTRY_MODULE_TYPES = new Set(["javascript"]);

class ContainerEntryModule extends Module {
  constructor(dependency) {
    super("javascript/dynamic", null);
    this.expose = dependency.exposedDependencies;
  }

  getSourceTypes() {
    return CONTAINER_ENTRY_MODULE_TYPES;
  }

  identifier() {
    return `container entry ${JSON.stringify(
      this.expose.map(item => item.getResourceIdentifier())
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
      strict: true
    };

    this.clearDependenciesAndBlocks();

    for (const dep of this.expose) {
      const block = new AsyncDependenciesBlock(
        undefined,
        dep.loc,
        dep.userRequest
      );
      block.addDependency(dep);
      this.addBlock(block);
    }

    callback();
  }

  codeGeneration({ moduleGraph, chunkGraph, runtimeTemplate }) {
    const sources = new Map();
    const runtimeRequirements = new Set([
      RuntimeGlobals.exports,
      RuntimeGlobals.require
    ]);

    const source = new ConcatSource();
    sources.set("javascript", source);

    const getters = [];

    for (const block of this.blocks) {
      const {
        dependencies: [dep]
      } = block;
      const name = dep.exposedName;
      const mod = moduleGraph.getModule(dep);

      if (!mod) continue; // TODO: Perhaps we log something in non production builds?

      const moduleId = JSON.stringify(mod.id); // TODO: This is temp, `.id` will be gone in v6?

      const require_statement = runtimeTemplate.blockPromise({
        block,
        message: `${dep.userRequest}`, // TODO: Should we use the request here?
        chunkGraph,
        runtimeRequirements
      });

      getters.push(
        `case "${name}":\nreturn ${require_statement}.then(() => ${RuntimeGlobals.require}(${moduleId}));`
      );
    }

    source.add(`
      exports["get"] = function get(module) {
        switch(module) {
            ${getters.join("\n")}
          default:
            return Promise.resolve().then(() => { throw new Error('Module ' + module + ' does not exist!'); });
        }
      }
    `);

    return {
      sources,
      runtimeRequirements
    };
  }

  size(type) {
    return 42;
  }
}

class ContainerEntryModuleFactory extends ModuleFactory {
  create({ dependencies: [dependency] }, callback) {
    callback(null, {
      module: new ContainerEntryModule(dependency)
    });
  }
}

class ContainerPlugin {
  constructor(options) {
    const name = options.name ?? "remoteEntry"; // TODO: Can we assume this, or mark it as required?

    this.options = {
      overridable: options.overridable ?? null,
      name,
      library: options.library ?? name,
      libraryTarget: options.libraryTarget ?? "var",
      expose: options.expose ?? {}
    };

    // TODO: Apply some validation around what was passed in.
  }

  apply(compiler) {
    const { name } = this.options;
    // set jsonpFunction to namespace of plugin
    compiler.options.output.jsonpFunction = name;

    compiler.hooks.compilation.tap(
      PLUGIN_NAME,
      (compilation, { normalModuleFactory }) => {
        compilation.dependencyFactories.set(
          ContainerEntryDependency,
          new ContainerEntryModuleFactory()
        );

        compilation.dependencyFactories.set(
          ContainerExposedDependency,
          normalModuleFactory
        );
      }
    );

    compiler.hooks.make.tapAsync(PLUGIN_NAME, (compilation, callback) => {
      compilation.addEntry(
        compilation.context,
        new ContainerEntryDependency(
          Object.entries(this.options.expose).map(([name, request], idx) => {
            const dep = new ContainerExposedDependency(name, request);
            dep.loc = {
              name,
              index: idx
            };
            return dep;
          }),
          this.options.name
        ),
        this.options.name,
        callback
      );
    });
  }
}

module.exports = ContainerPlugin;
