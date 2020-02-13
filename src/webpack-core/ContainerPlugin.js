const Dependency = require("webpack/lib/Dependency");
const Module = require("webpack/lib/Module");
const { RawSource, ConcatSource } = require("webpack-sources");

const PLUGIN_NAME = "ContainerPlugin";

class ContainerExposedDependency extends Dependency {
  constructor(name, request) {
    super();
    this.request = request;
    this.userRequest = request;
  }
}

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
  constructor(dependencies, expose) {
    super("container entry");
    this.expose = expose;
  }

  identifier() {
    return "container";
  }

  readableIdentifier() {
    return "container";
  }

  build(options, compilation, resolver, fs, callback) {
    this.built = true;
    this.buildMeta = {};
    this.buildInfo = {
      builtTime: Date.now()
    };

    Object.entries(this.expose).forEach((name, request) => {
      this.addDependency(new ContainerExposedDependency(name, request));
    });

    callback();
  }

  getSourceTypes() {
    return new Set(["javascript"]);
  }

  codeGeneration() {
    console.log(this)
    return {
      sources: new Map([
        "javascript",
        new RawSource("console.log('hello world')")
      ]),
      runtimeRequirements: new Set("RuntimeGlobals.require")
    };
  }

  size() {
    return 42;
  }
}

class ContainerEntryModuleFactory {
  constructor(expose) {
    this.expose = expose;
  }

  create({ dependencies }, callback) {
    callback(null, new ContainerEntryModule(dependencies[0], this.expose));
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
      const containerEntryModuleFactory = new ContainerEntryModuleFactory(
        this.options.expose
      );
      compilation.dependencyFactories.set(
        ContainerEntryDependency,
        containerEntryModuleFactory
      );

      compilation.addEntry(
        compilation.options.context ?? "./src/", // TODO: Figure out what the fallback is. Maybe webpack can give us a hint here
        new ContainerEntryDependency(),
        this.options.name,
        (error, entryModule) => {}
      );
    });
  }
}

module.exports = ContainerPlugin;
