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
  constructor() {
    super("container entry");
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

    callback();
  }

  source() {
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

    this._source.add("console.log('hello world');");

    // --- override

    /*
		export function override(module, getter) {
		  __webpack_require__.overrides[module] = getter;
		  // foreach child container, call override too
		};
	    */

    return this._source;
  }

  size() {
    return this._source.length;
  }
}

class ContainerEntryModuleFactory {
  create({ dependencies }, callback) {
    callback(null, new ContainerEntryModule(dependencies[0]));
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
      const containerEntryModuleFactory = new ContainerEntryModuleFactory();
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
