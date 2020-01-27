const path = require("path");
const fse = require("fs-extra");
const createHash = require("webpack/lib/util/createHash");
// const FunctionModuleTemplatePlugin = require("webpack/lib/FunctionModuleTemplatePlugin");
const fs = require("fs");
const { mergeDeep } = require("./utils");
const {
  addInterleaveExtention,
  addInterleaveRequire
} = require("./requireExtentions");
const { addWebpackRegister } = require("./beforeStartup");
const {
  interleaveStyleConfig,
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
      map: null,
      generate: null,
      hashDigest: "base64",
      hashDigestLength: 10,
      context: null,
      sort: null,
      hashFunction: "md4",
      serialize: manifest =>
        `if(!window.entryManifest) {window.entryManifest = {}}; window.entryManifest["${
          opts.manifestName
        }"] = ${JSON.stringify(manifest, null, 2)}`,
      ...(opts || {})
    };
  }

  getFileType(str) {
    str = str.replace(/\?.*/, "");
    const split = str.split(".");
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
    // add to the existing webpack config
    // adding a new splitChunks cache group called interleave
    const chunkSplitting =
      options?.optimization?.splitChunks?.cacheGroups || {};
    let count = 0;
    chunkSplitting.styles = {
      test: /\.css$/,
      // test: module => {
      //   // check if module has a resource path (not virtual modules)
      //   if (module.resource) {
      //     return (
      //       module.resource.includes(".css") &&
      //       module.resource.includes(this.opts.testPath) &&
      //       !!hasExternalizedModuleViaJson(
      //         module.resource,
      //         this.opts.manifestName
      //       )
      //     );
      //   }
      // },
      name: module => {
        const foundValue = hasExternalizedModuleViaJson(
          module.resource,
          this.opts.manifestName
        );
        console.log(foundValue);

        // if (foundValue) return `thing`;
        return `styles-${foundValue}`;
      },
      chunks: "all",
      enforce: true
    };
    // chunkSplitting.style = interleaveStyleConfig(this.opts);
    // interleaveConfig figures out if a file meets the paramaters for interleaving
    chunkSplitting.interleave = interleaveConfig(this.opts);
    // dont rename exports when hoisting and tree shaking
    Object.assign(options.optimization, {
      providedExports: false
    });
    // likely will be refactored or removed, used for entryManifest.js to map chunks (this is V1 where its outside the runtime still)
    this.moduleHashMap = {};
    if (this.opts.debug) {
      console.groupCollapsed("interleaveConfig");
      console.log(chunkSplitting.interleave);
      console.groupEnd();
      console.groupCollapsed("New webpack optimization config");
    }
    // merge my added splitChunks config into the webpack config object passed in
    mergeDeep(options, {
      optimization: {
        runtimeChunk: "multiple",
        namedModules: true,
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
      chunkSplitting[
        key
      ].automaticNamePrefix = `${this.opts.manifestName}~${chunkSplitting[key].automaticNamePrefix}`;
    });

    Object.assign(options.optimization, {
      // node debugger breaks with TerserPlugin
      minimizer: this.opts.debug ? [] : options.optimization.minimizer,
      splitChunks: options.optimization?.splitChunks || {}
    });

    // forcefully mutate it
    Object.assign(options.optimization.splitChunks, {
      chunks: "all",
      cacheGroups: chunkSplitting,
      namedModules: true
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
    const externalModules = {};
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
        (files, chunk) =>
          chunk.files.reduce((files, path) => {
            let name = chunk.name ? chunk.name : null;
            const dependencyChains = {};
            if (name) {
              name = `${name}.${this.getFileType(path)}`;
            } else {
              // For nameless chunks, just map the files directly.
              name = path;
            }

            if (externalModules[chunk.id] || externalModules[chunk.name]) {
              if (this.opts.debug) {
                console.groupCollapsed(chunk.id, chunk.name);
              }
              // TODO: swap forEachModle out with const of
              // for(const module of chunk.modulesIterable){
              chunk.forEachModule(module => {
                if (module.dependencies) {
                  if (this.opts.debug) {
                    console.log(module);
                    console.group("Dependencies");
                  }
                  module.dependencies.forEach(dependency => {
                    if (
                      this.opts.debug &&
                      (dependency.request || dependency.userRequest)
                    ) {
                      console.groupCollapsed(
                        "Dependency",
                        dependency.userRequest,
                        `(${dependency.request})`
                      );
                      console.log(dependency);
                    }
                    const dependencyModuleSet = dependency.getReference?.()
                      ?.module;
                    if (!dependencyModuleSet) return null;

                    if (this.opts.debug) {
                      console.groupCollapsed("Dependency Reference");
                      console.log(dependencyModuleSet);
                      console.groupEnd();
                    }

                    if (!dependencyChains[chunk.id]) {
                      Object.assign(dependencyChains, { [chunk.id]: [] });
                    }
                    const dependencyChainMap = (dependencyChains[chunk.id][
                      dependency.sourceOrder
                    ] = {});

                    Object.assign(dependencyChainMap, {
                      order: dependency.sourceOrder,
                      name: dependencyModuleSet.rawRequest,
                      id: dependencyModuleSet.id,
                      sourceFiles: []
                    });

                    // eslint-disable-next-line no-restricted-syntax
                    for (const module of dependencyModuleSet.chunksIterable) {
                      if (this.opts.debug) {
                        console.groupCollapsed(
                          "Dependency Reference Iterable",
                          dependency.request
                        );
                        console.groupEnd();
                      }

                      if (module && module.files) {
                        if (dependencyChains[chunk.id]) {
                          dependencyChainMap.sourceFiles =
                            dependencyChainMap?.sourceFiles?.concat?.(
                              module.files
                            ) || null;
                        } else {
                          // Object.assign(dependencyChains, { [chunk.id]: module.files });
                        }
                      }
                    }
                    if (this.opts.debug) {
                      console.groupEnd();
                    }
                  });
                  if (this.opts.debug) {
                    console.groupEnd();
                  }
                }
              });
              if (this.opts.debug && !dependencyChains[chunk.id]) {
                console.groupEnd();
              }
            }
            let currentDependencyChain = [];
            if (dependencyChains[chunk.id]) {
              if (this.opts.debug) {
                console.group("Computed Dependency Chain For:", chunk.id);
                currentDependencyChain =
                  dependencyChains?.[chunk.id]?.removeNull?.().reverse?.() ||
                  [];
                console.log(currentDependencyChain);
                console.groupEnd();
                console.groupEnd();
              }
            }

            // Webpack 4: .isOnlyInitial()
            // Webpack 3: .isInitial()
            // Webpack 1/2: .initial
            // const modules = chunk.modulesIterable;
            // let i = 0;
            // while (i < modules.length) {
            //   getMeta(modules[i]);
            //   i++;
            // }
            return files.concat({
              path,
              chunk,
              name,
              dependencies: dependencyChains?.[chunk.id]
                ?.removeNull?.()
                .reverse?.(),
              isInitial: chunk.isOnlyInitial
                ? chunk.isOnlyInitial()
                : chunk.isInitial
                ? chunk.isInitial()
                : chunk.initial,
              isChunk: true,
              isAsset: false,
              isModuleAsset: false
            });
          }, files),
        []
      );

      // module assets don't show up in assetsByChunkName.
      // we're getting them this way;
      files = stats.assets.reduce((files, asset) => {
        const name = moduleAssets[asset.name];
        if (name) {
          return files.concat({
            path: asset.name,
            name,
            isInitial: false,
            isChunk: false,
            isAsset: true,
            isModuleAsset: true
          });
        }

        const isEntryAsset = asset.chunks.length > 0;
        if (isEntryAsset) {
          return files;
        }

        return files.concat({
          path: asset.name,
          name: asset.name,
          isInitial: false,
          isChunk: false,
          isAsset: true,
          isModuleAsset: false
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
        files = files.map(file => {
          file.name = this.opts.basePath + file.name;
          return file;
        });
      }

      if (publicPath) {
        // Similar to basePath but only affects the value (similar to how
        // output.publicPath turns require('foo/bar') into '/public/foo/bar', see
        // https://github.com/webpack/docs/wiki/configuration#outputpublicpath
        files = files.map(file => {
          file.path = publicPath + file.path;
          return file;
        });
      }

      files = files.map(file => {
        file.name = file.name.replace(/\\/g, "/");
        file.path = file.path.replace(/\\/g, "/");
        return file;
      });

      if (this.opts.filter) {
        files = files.filter(this.opts.filter);
      }

      if (this.opts.map) {
        files = files.map(this.opts.map);
      }

      if (this.opts.sort) {
        files = files.sort(this.opts.sort);
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
        manifest = files.reduce((manifest, file) => {
          manifest[file.name] = {
            path: file.path,
            dependencies: file?.dependencies || null,
            isInitial: file?.isInitial || null
          };
          return manifest;
        }, seed);
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

    function beforeRun(compiler, callback) {
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
      compiler.hooks.webpackURLImportPluginAfterEmit = new SyncWaterfallHook([
        "manifest"
      ]);
      compiler.hooks.compilation.tap("URLImportPlugin", compilation => {
        const { mainTemplate } = compilation;
        // work in progress to add another webpack__require method to the webpack runtime
        // this new method will allow a interleaved component to be required and automatically download its dependencies
        // it returns a promise so the actual interleaved module is not executed until any missing dependencies are loaded
        mainTemplate.hooks.requireExtensions.tap("URLImportPlugin", source => {
          return [addInterleaveExtention, addInterleaveRequire].reduce(
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
              wrapChunks(compilation, chunks, this.moduleHashMap);
            }
          );
        } else {
          // adfter chunk files are optimized
          compilation.hooks.optimizeChunkAssets.tapAsync(
            "URLImportPlugin",
            (chunks, done) => {
              wrapChunks(compilation, chunks, this.moduleHashMap);
              done();
            }
          );
        }

        // Expose chunk registration functions and bindings from webpack runtime to the window
        // webpack does this and its how code splitting works. It exposes window.webpackJsonP
        // This registration system works just like webpacks, it exposes a function that allows information to be passed
        // into webpack runtime, because the function is in webpack runtime, i have access to all of webpacks internals
        mainTemplate.hooks.beforeStartup.tap(
          "URLImportPlugin",
          addWebpackRegister
        );

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
            if (module.id === null && module.resource) {
              const hash = createHash(this.opts.hashFunction);

              let resourcePath = module.resource;
              if (resourcePath.indexOf("?") > -1) {
                resourcePath = resourcePath.split("?")[0];
              }

              try {
                hash.update(fs.readFileSync(resourcePath));
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
            } else {
              console.log("Module with no ID", module);
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
        // TODO: remove in V2
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
