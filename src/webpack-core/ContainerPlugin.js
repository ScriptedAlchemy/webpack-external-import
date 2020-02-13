const Dependency = require("webpack/lib/Dependency");
const Module = require("webpack/lib/Module");
const { ConcatSource } = require("webpack-sources");

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

    this._source = new ConcatSource();

    // --- get

    /*
   export function get(module) {
      switch(module) {
        case "themes/dark":
          return __webpack_require__.e(12).then(() => __webpack_require__(34));
        case "Dashboard":
          return Promise.all([__webpack_require__.e(23), __webpack_require__.e(24)]).then(() => __webpack_require__(56));
        default:
          return Promise.resolve().then(() => { throw new Error(...); });
      }
    };
     */

    compilation.hooks.seal.tap(PLUGIN_NAME, () => {
      for (const mod of compilation.modules) {

      }

      callback();
    });

    this._source.add("console.log('hello world');");

    // --- override

    /*
    export function override(module, getter) {
      __webpack_require__.overrides[module] = getter;
      // foreach child container, call override too
    };
     */
  }

  getSourceTypes() {
    return new Set(["javascript/dynamic"]);
  }

  source() {
    return this._source;
  }

  codeGeneration() {
    return {
      sources: new Map(["javascript/dynamic", this._source]),
      runtimeRequirements: new Set()
    };
  }

  size() {
    return this._source.length;
  }
}

class ContainerEntryModuleFactory {
  create({ dependencies: [dependency] }, callback) {
    callback(null, new ContainerEntryModule(dependency));
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
      const { mainTemplate, normalModuleFactory } = compilation;
      const containerEntryModuleFactory = new ContainerEntryModuleFactory();
      compilation.dependencyFactories.set(
        ContainerEntryDependency,
        containerEntryModuleFactory
      );

      compilation.addEntry(
        compilation.options.context ?? "./src/", // TODO: Figure out what the fallback is. Maybe webpack can give us a hint here
        new ContainerEntryDependency(),
        this.options.name,
        () => {}
      );
    });
  }
}

module.exports = ContainerPlugin;
