const Dependency = require("webpack/lib/Dependency");
const Module = require("webpack/lib/Module");
const { RawSource } = require("webpack-sources");

const PLUGIN_NAME = "ContainerPlugin";

class ContainerEntryDependency extends Dependency {
  /**
   * @param {string} request request path which needs resolving
   */
  constructor(request) {
    super();
    this.request = request;
    this.userRequest = request;
  }

  getResourceIdentifier() {
    return `module${this.request}`;
  }
}

class ContainerEntryModule extends Module {
  constructor(request, type, userRequest) {
    super("container entry");
    // Info from Factory
    this.request = request;
    this.userRequest = userRequest;
  }

  identifier() {
    return "container";
  }

  readableIdentifier() {
    return "container";
  }

  build(options, compilation, resolver, fs, callback) {
    this.buildInfo = {};
    this.buildMeta = {};
    callback();
  }

  getSourceTypes() {
    return new Set(["javascript"]);
  }

  codeGeneration() {
    return {
      sources: new Map([
        "javascript",
        new RawSource("console.log('hello world')")
      ]),
      runtimeRequirements: new Set()
    };
  }

  size() {
    return 42;
  }
}

class ContainerEntryModuleFactory {
  create({ dependencies: [dependency] }, callback) {
    callback(null, new ContainerEntryModule(dependency));
  }
}

class ContainerPlugin {
  constructor(options) {
    const name = options.name ?? "defualt"; // TODO: Can we assume this, or mark it as required?

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
    // TODO: _body_ of the plugin to come from ./webpack/X

    compiler.hooks.compilation.tap(PLUGIN_NAME, compilation => {
      const { mainTemplate, normalModuleFactory } = compilation;
      const containerEntryModuleFactory = new ContainerEntryModuleFactory();
      compilation.dependencyFactories.set(
        ContainerEntryDependency,
        containerEntryModuleFactory
      );

      compilation.addEntry(
        "./src",
        new ContainerEntryDependency(),
        // this.entries.map((e, idx) => {
        //   const dep = new SingleEntryDependency(e);
        //   dep.loc = {
        //     name: this.name,
        //     index: idx
        //   };
        //   return dep;
        // }),
        // this.name
        "remoteEntry",
        () => {
          return new ContainerEntryModule();
        }
      );
    });
  }
}

module.exports = ContainerPlugin;
