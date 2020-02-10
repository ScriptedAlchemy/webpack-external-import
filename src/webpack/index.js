const path = require("path");
const fse = require("fs-extra");
const createHash = require("webpack/lib/util/createHash");
const fs = require("fs");
const ExternalModuleFactoryPlugin = require("./ExternalModuleFactory");
// const FunctionModuleTemplatePlugin = require("webpack/lib/FunctionModuleTemplatePlugin");
const { mergeDeep } = require("./utils");

const {
  addInterleaveExtension,
  addInterleaveRequire
} = require("./requireExtentions");
const { addWebpackRegister } = require("./beforeStartup");
const {
  interleaveStyleConfig,
  interleaveStyleJsConfig,
  interleaveConfig,
  hasExternalizedModuleViaJson
} = require("./chunkSplitting");
const { addLocalVars } = require("./localVars");
const { wrapChunks } = require("./optimizeChunk");
// use this
// class FunctionModulePlugin {
//   apply(compiler) {
//     compiler.hooks.compilation.tap("FunctionModulePlugin", compilation => {
//       new FunctionModuleTemplatePlugin().apply(
//         compilation.moduleTemplates.javascript
//       );
//     });
//   }
// }
// will likely remove this emit mapping
const emitCountMap = new Map();
console.clear();

class URLImportPlugin {
  constructor(opts) {
    const debug =
      typeof v8debug === "object" ||
      /--debug|--inspect/.test(process.execArgv.join(" "));
    if (!opts.manifestName) {
      throw new Error(
        "URLImportPlugin: You MUST specify a manifestName in your options. Something unique. Like {manifestName: my-special-build}"
      );
    }
    this.opts = {
      publicPath: null,
      debug: debug || false,
      testPath: "src",
      basePath: "",
      manifestName: "unknown-project",
      fileName: "importManifest.js",
      transformExtensions: /^(gz|map)$/i,
      writeToFileEmit: false,
      seed: null,
      filter: null,
      generate: null,
      hashDigest: "base64",
      hashDigestLength: 5,
      context: null,
      hashFunction: "md4",
      serialize: manifest =>
        `if(!window.entryManifest) {window.entryManifest = {}}; window.entryManifest["${
          opts.manifestName
        }"] = ${JSON.stringify(manifest)}`,
      ...(opts || {})
    };
  }

  getFileType(str) {
    const split = str.replace(/\?.*/, "").split(".");
    let ext = split.pop();
    if (this.opts.transformExtensions.test(ext)) {
      ext = `${split.pop()}.${ext}`;
    }
    return ext;
  }

  apply(compiler) {
    if (this.opts.debug) {
      console.group("Webpack Plugin Debugging: webpack-external-import");
      console.info("To disable this, set plugin options {debug:false}");
    }

    const options = compiler?.options;
    if (options.externals) {
      throw new Error(
        "URLImportPlugin: Externals must be applied via the plugin, not via webpack config object. Please see useExternals on the plugin documentation"
      );
    }
    // add to the existing webpack config
    // adding a new splitChunks cache group called interleave
    const chunkSplitting =
      options?.optimization?.splitChunks?.cacheGroups || {};
    chunkSplitting.stylejs = interleaveStyleJsConfig(this.opts);
    chunkSplitting.style = interleaveStyleConfig(this.opts);
    // interleaveConfig figures out if a file meets the paramaters for interleaving
    chunkSplitting.interleave = interleaveConfig(this.opts);

    if (options.mode === "production") {
      chunkSplitting.vendors = {
        name: `${this.opts.manifestName}-vendors`,
        test: /node_modules/,
        priority: -10,
        enforce: true,
        maxSize: 50000
      };
      Object.assign(chunkSplitting.default, { maxSize: 50000 });
    }

    Object.assign(options.optimization || {}, {
      namedChunks: true,
      // dont rename exports when hoisting and tree shaking
      providedExports: false
    });

    // likely will be refactored or removed, used for entryManifest.js to map chunks (this is V1 where its outside the runtime still)
    if (this.opts.debug) {
      console.groupCollapsed("interleaveConfig");
      console.log(chunkSplitting.interleave);
      console.groupEnd();
      console.groupCollapsed("New webpack optimization config");
    }
    // merge my added splitChunks config into the webpack config object passed in
    Object.assign(options.optimization.splitChunks, {
      chunks: "all"
    });
    mergeDeep(options, {
      optimization: {
        splitChunks: {
          chunks: "all",
          cacheGroups: chunkSplitting
        }
      }
    });

    Object.keys(chunkSplitting).forEach(key => {
      if (key === "interleave") {
        return;
      }
      chunkSplitting[key].automaticNamePrefix = `${
        this.opts.manifestName
      }~${chunkSplitting?.[key]?.automaticNamePrefix || ""}`;
    });

    Object.assign(options.optimization, {
      // node debugger breaks with TerserPlugin
      minimizer: this.opts.debug ? [] : options.optimization.minimizer,
      splitChunks: options.optimization?.splitChunks || {}
    });

    // forcefully mutate it
    Object.assign(options.optimization.splitChunks, {
      chunks: "all",
      cacheGroups: chunkSplitting
    });
    if (this.opts.debug) {
      console.log(options);
      console.groupEnd();
    }
    // eslint-disable-next-line no-unused-vars
    compiler.hooks.thisCompilation.tap("URLImportPlugin", compilation => {
      // TODO: throw warning when changing module ID type
      // if (options.ignoreOrder) {
      //   compilation.warnings.push(
      //     new Error(
      //       `chunk ${chunk.name || chunk.id} [${pluginName}]\n`
      //           + 'Conflicting order between:\n'
      //           + ` * ${fallbackModule.readableIdentifier(
      //             requestShortener,
      //           )}\n`
      //           + `${bestMatchDeps
      //             .map(m => ` * ${m.readableIdentifier(requestShortener)}`)
      //             .join('\n')}`,
      //     ),
      //   );
      // }
    });

    const moduleAssets = {};
    const outputFolder = compiler.options.output.path;
    const outputFile = path.resolve(outputFolder, this.opts.fileName);
    const outputName = path.relative(outputFolder, outputFile);

    const moduleAsset = ({ userRequest }, file) => {
      if (userRequest) {
        moduleAssets[file] = path.join(
          path.dirname(file),
          path.basename(userRequest)
        );
      }
    };

    const emit = (compilation, compileCallback) => {
      const emitCount = emitCountMap.get(outputFile) - 1;
      emitCountMap.set(outputFile, emitCount);

      const seed = this.opts.seed || {};

      const publicPath =
        this.opts.publicPath != null
          ? this.opts.publicPath
          : compilation.options.output.publicPath;
      const stats = compilation.getStats().toJson();

      if (this.opts.debug) {
        console.groupCollapsed("Initial webpack stats");
        console.log(stats);
        console.groupEnd();
        console.group("Files");
      }

      let files = compilation.chunks.reduce(
        (f, chunk) =>
          chunk.files.reduce((fx, filePath) => {
            let name = chunk.id ? chunk.id : null;
            if (name) {
              name = `${name}.${this.getFileType(filePath)}`;
            } else {
              // For nameless chunks, just map the files directly.
              name = filePath;
            }

            return fx.concat({
              path: filePath,
              chunk,
              name,
              isChunk: true,
              isAsset: false,
              isModuleAsset: false
            });
          }, f),
        []
      );

      // module assets don't show up in assetsByChunkName.
      // we're getting them this way;
      files = stats.assets.reduce((fx, asset) => {
        const name = moduleAssets[asset.name];
        if (name) {
          return fx.concat({
            path: asset.name,
            name
          });
        }

        const isEntryAsset = asset.chunks.length > 0;
        if (isEntryAsset) {
          return fx;
        }

        return fx.concat({
          path: asset.name,
          name: asset.name
        });
      }, files);

      files = files.filter(file => {
        // Don't add hot updates to manifest
        const isUpdateChunk = file.path.includes("hot-update");
        // Don't add manifest from another instance
        const isManifest =
          emitCountMap.get(path.join(outputFolder, file.name)) !== undefined;

        return !isUpdateChunk && !isManifest;
      });

      if (this.opts.debug) {
        console.log("Unprocessed Files:", files);
      }

      // Append optional basepath onto all references.
      // This allows output path to be reflected in the manifest.
      if (this.opts.basePath) {
        files = files.map(file => ({
          ...file,
          name: this.opts.basePath + file.name
        }));
      }

      if (publicPath) {
        // Similar to basePath but only affects the value (similar to how
        // output.publicPath turns require('foo/bar') into '/public/foo/bar', see
        // https://github.com/webpack/docs/wiki/configuration#outputpublicpath
        files = files.map(file => ({
          ...file,
          path: publicPath + file.path
        }));
      }

      files = files.map(file => ({
        ...file,
        name: file.name.replace(/\\/g, "/"),
        path: file.path.replace(/\\/g, "/")
      }));

      if (this.opts.filter) {
        files = files.filter(this.opts.filter);
      }

      if (this.opts.debug) {
        console.log("Processed Files:", files);
        console.groupEnd();

        console.groupEnd();
      }
      let manifest;
      if (this.opts.generate) {
        manifest = this.opts.generate(seed, files);
      } else {
        manifest = files.reduce(
          (m, file) => ({
            ...m,
            [file.name]: {
              path: file.path
            }
          }),
          seed
        );
      }
      if (this.opts.debug) {
        console.log("Manifest:", manifest);
      }

      const isLastEmit = emitCount === 0;
      if (isLastEmit) {
        const cleanedManifest = Object.entries(manifest).reduce(
          (acc, [key, asset]) => {
            if (!asset?.path?.includes(".map")) {
              return Object.assign(acc, { [key]: asset });
            }
            return acc;
          },
          {}
        );

        const output = this.opts.serialize(cleanedManifest);
        if (this.opts.debug) {
          console.log("Output:", output);
        }

        // eslint-disable-next-line no-param-reassign
        compilation.assets[outputName] = {
          source() {
            return output;
          },
          size() {
            return output.length;
          }
        };

        if (this.opts.writeToFileEmit) {
          fse.outputFileSync(outputFile, output);
        }
      }

      if (compiler.hooks) {
        compiler.hooks.webpackURLImportPluginAfterEmit.call(manifest);
      } else {
        compilation.applyPluginsAsync(
          "webpack-manifest-plugin-after-emit",
          manifest,
          compileCallback
        );
      }
    };

    function beforeRun(comp, callback) {
      const emitCount = emitCountMap.get(outputFile) || 0;
      emitCountMap.set(outputFile, emitCount + 1);

      if (callback) {
        callback();
      }
    }

    if (compiler.hooks) {
      const { SyncWaterfallHook } = require("tapable");
      const pluginOptions = {
        name: "URLImportPlugin",
        stage: Infinity
      };

      // eslint-disable-next-line no-param-reassign
      compiler.hooks.webpackURLImportPluginAfterEmit = new SyncWaterfallHook([
        "manifest"
      ]);

      compiler.hooks.compile.tap(
        "ExternalsPlugin",
        ({ normalModuleFactory }) => {
          new ExternalModuleFactoryPlugin(
            options.output.libraryTarget,
            this.opts.useExternals
          ).apply(normalModuleFactory);
        }
      );
      compiler.hooks.compilation.tap("URLImportPlugin", compilation => {
        const { mainTemplate } = compilation;

        // Add another webpack__require method to the webpack runtime
        // this new method will allow a interleaved component to be required and automatically download its dependencies
        // it returns a promise so the actual interleaved module is not executed until any missing dependencies are loaded
        mainTemplate.hooks.requireExtensions.tap("URLImportPlugin", source => {
          return [addInterleaveExtension, addInterleaveRequire].reduce(
            (sourceCode, extension) => {
              return extension(sourceCode, mainTemplate.requireFn, this.opts);
            },
            source
          );
        });
        // TODO add an option for this
        if (this.afterOptimizations) {
          // before chunk files are optimized
          compilation.hooks.beforeOptimizeChunkAssets.tap(
            "URLImportPlugin",
            chunks => {
              // access all chunks webpack created, then add some code to each chunk file, which is run when a chunk is
              // loaded on a page as <script>
              wrapChunks(compilation, chunks);
            }
          );
        } else {
          // adfter chunk files are optimized
          compilation.hooks.optimizeChunkAssets.tapAsync(
            "URLImportPlugin",
            (chunks, done) => {
              wrapChunks(compilation, chunks);
              done();
            }
          );
        }

        // Expose chunk registration functions and bindings from webpack runtime to the window
        // webpack does this and its how code splitting works. It exposes window.webpackJsonP
        // This registration system works just like webpacks, it exposes a function that allows information to be passed
        // into webpack runtime, because the function is in webpack runtime, i have access to all of webpacks internals
        mainTemplate.hooks.beforeStartup.tap("URLImportPlugin", source => {
          return addWebpackRegister(source, options.output.jsonpFunction);
        });

        // add variables to webpack runtime which are available throughout all functions and closures within the runtime
        // localVars are like global variables for webpack, anything can access them.
        mainTemplate.hooks.localVars.tap("URLImportPlugin", addLocalVars);
      });

      compiler.hooks.compilation.tap("URLImportPlugin", compilation => {
        const usedIds = new Set();
        // creates hashed module IDs based on the contents of the file - works like [contenthash] but for each module
        compilation.hooks.beforeModuleIds.tap("URLImportPlugin", modules => {
          // eslint-disable-next-line no-restricted-syntax
          for (const module of modules) {
            if (this.opts?.provideExternals?.includes(module.rawRequest)) {
              module.id = module.rawRequest;
            }
            if (module.id === null && module.resource) {
              const hash = createHash(this.opts.hashFunction);

              let resourcePath = module.resource;
              if (resourcePath.indexOf("?") > -1) {
                [resourcePath] = resourcePath.split("?");
              }

              try {
                let exports = "";
                if (Array.isArray(module.usedExports)) {
                  exports = module.usedExports.join(".");
                }
                hash.update(fs.readFileSync(resourcePath) + exports);
              } catch (ex) {
                console.error("failed on", module.context, module.resource);
                throw ex;
              }

              const hashId = hash.digest(this.opts.hashDigest);
              let len = this.opts.hashDigestLength;
              while (usedIds.has(hashId.substr(0, len))) {
                len++;
              }
              module.id = hashId.substr(0, len);
              usedIds.add(module.id);
            } else if (this.opts.debug) {
              // console.log("Module with no ID", module);
            }
            const externalModule = hasExternalizedModuleViaJson(
              module.resource
            );

            if (externalModule || false) {
              // add exports back to usedExports, prevents tree shaking on module
              Object.assign(module, {
                usedExports: module?.buildMeta?.providedExports || true
              });
              if (externalModule) {
                module.id = externalModule;
              }
            }
          }
        });
      });

      compiler.hooks.compilation.tap(pluginOptions, ({ hooks }) => {
        // TODO: remove in ^2.2
        hooks.moduleAsset.tap(pluginOptions, moduleAsset);
      });

      // writes the importManifest file containing a map of Chunk IDs to the cache busted JS files
      compiler.hooks.emit.tap(pluginOptions, emit);

      compiler.hooks.run.tap(pluginOptions, beforeRun);
      compiler.hooks.watchRun.tap(pluginOptions, beforeRun);
    } else {
      compiler.plugin("compilation", compilation => {
        compilation.plugin("module-asset", moduleAsset);
      });
      compiler.plugin("emit", emit);

      compiler.plugin("before-run", beforeRun);
      compiler.plugin("watch-run", beforeRun);
    }
  }
}

module.exports = URLImportPlugin;
