const Dependency = require("webpack/lib/Dependency");
const Module = require("webpack/lib/Module");
const ModuleDependency = require("webpack/lib/dependencies/ModuleDependency");
const RuntimeGlobals = require("webpack/lib/RuntimeGlobals");
const normalModuleFactory = require("webpack/lib/NormalModuleFactory");
const { RawSource } = require("webpack-sources");

const PLUGIN_NAME = "ContainerPlugin";

class ContainerExposedDependency extends ModuleDependency {
  constructor(name, request) {
    super(request);
    this._name = name;
  }

  getResourceIdentifier() {
    return `exposed dependency ${this._name}`;
  }
}

class ContainerEntryDependency extends Dependency {
  constructor(dependencies) {
    super();
    this.exposedDependencies = dependencies;
  }
}

class ContainerEntryModule extends Module {
  constructor(dependency) {
    super("javascript/dynamic", null);
    this.expose = dependency.exposedDependencies;
  }

  getSourceTypes() {
    return new Set(["javascript"]);
  }

  identifier() {
    return `container entry ${JSON.stringify(Object.keys(this.expose))}`;
  }

  readableIdentifier() {
    return "container entry";
  }

  needBuild(context, callback) {
    debugger;
    return callback(null, !this.buildMeta);
  }

  build(options, compilation, resolver, fs, callback) {
    this.buildMeta = {};
    this.buildInfo = {
      strict: true,
      builtTime: Date.now()
    };

    debugger;

    callback();
  }

  codeGeneration({ runtimeTemplate, moduleGraph, chunkGraph }) {
    debugger;
    return {
      sources: new Map([
        "javascript",
        new RawSource("console.log('hello world')")
      ]),
      runtimeRequirements: new Set([RuntimeGlobals.module])
    };
  }

  size(type) {
    return 42;
  }
}

class ContainerEntryModuleFactory {
  create({ dependencies: [dependencie] }, callback) {
    callback(null, new ContainerEntryModule(dependencie));
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
    compiler.hooks.compilation.tap(PLUGIN_NAME, compilation => {
      compilation.dependencyFactories.set(
        ContainerEntryDependency,
        new ContainerEntryModuleFactory()
      );
      compilation.dependencyFactories.set(
        ContainerExposedDependency,
        normalModuleFactory
      );

      // TODO: DEBUGGERS - REMOVE BELOW
      compilation.hooks.finishAssets.tap(PLUGIN_NAME, assets => {
        debugger;
      });

      compilation.hooks.finishModules.tap(PLUGIN_NAME, x => {
        debugger;
      });

      compilation.hooks.buildModule.tap(PLUGIN_NAME, module => {
        debugger;
      });
    });

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
          })
        ),
        this.options.name,
        callback
      );
    });
  }
}

module.exports = ContainerPlugin;
