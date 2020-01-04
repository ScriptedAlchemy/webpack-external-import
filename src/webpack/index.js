const path = require("path");
const fse = require("fs-extra");
const createHash = require("webpack/lib/util/createHash");
const { ConcatSource } = require("webpack-sources");
const ModuleFilenameHelpers = require("webpack/lib/ModuleFilenameHelpers");
const fs = require("fs");
const webpack = require("webpack");

function mergeDeep(...objects) {
  const isObject = obj => obj && typeof obj === "object";

  return objects.reduce((prev, obj) => {
    Object.keys(obj).forEach(key => {
      const pVal = prev[key];
      const oVal = obj[key];

      if (Array.isArray(pVal) && Array.isArray(oVal)) {
        prev[key] = pVal.concat(...oVal);
      } else if (isObject(pVal) && isObject(oVal)) {
        prev[key] = mergeDeep(pVal, oVal);
      } else {
        prev[key] = oVal;
      }
    });

    return prev;
  }, {});
}

const removeNull = function() {
  let nullCount = 0;
  let { length } = this;
  for (let i = 0, len = this.length; i < len; i++) {
    if (!this[i]) {
      nullCount++;
    }
  }
  // no item is null
  if (!nullCount) {
    return this;
  }
  // all items are null
  if (nullCount == length) {
    this.length = 0;
    return this;
  }
  // mix of null // non-null
  let idest = 0;
  let isrc = length - 1;
  length -= nullCount;
  while (true) {
    while (!this[isrc]) {
      isrc--;
      nullCount--;
    } // find a non null (source) slot on the right
    if (!nullCount) {
      break;
    } // break if found all null
    while (this[idest]) {
      idest++;
    } // find one null slot on the left (destination)
    // perform copy
    this[idest] = this[isrc];
    if (!--nullCount) {
      break;
    }
    idest++;
    isrc--;
  }
  this.length = length;
  return this;
};

// eslint-disable-next-line no-extend-native
Object.defineProperty(Array.prototype, "removeNull", {
  value: removeNull,
  writable: true,
  configurable: true
});

function hasExternalizedModule(module) {
  const moduleSource = module?.originalSource?.()?.source?.() || "";
  if (moduleSource?.indexOf("externalize") > -1 || false) {
    return moduleSource;
  }
  return false;
}

const interleaveConfig = test => ({
  test(module) {
    if (module.resource) {
      return module.resource.includes(test) && !!hasExternalizedModule(module);
    }
  },
  // eslint-disable-next-line no-unused-vars
  name(module, chunks, cacheGroupKey) {
    // dont chunk unless we are sure you can

    const moduleSource = hasExternalizedModule(module);
    if (moduleSource) {
      return moduleSource.match(/\/\*\s*externalize\s*:\s*(\S+)\s*\*\//)[1];
    }
    // returning a chunk name causes problems with mini-css popping chunks off
    // return 'main';
  },
  enforce: true
  // might need for next.js
  // reuseExistingChunk: false,
});

const emitCountMap = new Map();

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
    const chunkSplitting =
      options?.optimization?.splitChunks?.cacheGroups || {};
    chunkSplitting.interleave = interleaveConfig(this.opts.testPath);
    chunkSplitting.rselect = {
      test: /[\\/]node_modules[\\/]react-select/,
      enforce: true
    };
    // dont rename exports when hoisting and tree shaking
    Object.assign(options.optimization, {
      providedExports: false
    });
    this.moduleHashMap = {};
    if (this.opts.debug) {
      console.groupCollapsed("interleaveConfig");
      console.log(chunkSplitting.interleave);
      console.groupEnd();
      console.groupCollapsed("New webpack optimization config");
    }

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

    Object.assign(options.optimization, {
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

    compiler.hooks.compilation.tap("URLImportPlugin", compilation => {
      const thing = {};
      if (this.afterOptimizations) {
        compilation.hooks.afterOptimizeChunkAssets.tap(
          "URLImportPlugin",
          chunks => {
            wrapChunks(compilation, chunks);
          }
        );
      } else {
        compilation.hooks.optimizeChunkAssets.tapAsync(
          "URLImportPlugin",
          (chunks, done) => {
            console.log(thing);

            wrapChunks(compilation, chunks);
            done();
          }
        );
      }
    });

    function wrapFile(compilation, fileName, chunkMap) {
      // const headerContent =
      //   typeof header === "function" ? header(fileName, chunkHash) : header;
      // const footerContent =
      //   typeof footer === "function" ? footer(fileName, chunkHash) : footer;
      //
      compilation.assets[fileName] = new ConcatSource(
        String(
          `__webpack_require__.registerLocals(${JSON.stringify(chunkMap)})`
        ),
        compilation.assets[fileName]
        // String(footerContent)
      );
    }

    console.clear();

    const wrapChunks = (compilation, chunks) => {
      const map = {};
      const orgs = {};

      chunks.forEach(chunk => {
        console.log(
          "chunk",
          chunk.canBeInitial(),
          chunk.isOnlyInitial(),
          chunk.hasEntryModule(),
          chunk.hasRuntime()
        );
        if (!chunk.rendered) {
          return;
        }
        chunk.getModules().forEach(module => {
          if (!Array.isArray(map[chunk.id])) {
            map[chunk.id] = [];
          }
          map[chunk.id].push(`${module.id}-${module.rawRequest}`);

          module.reasons.forEach(reason => {
            if (reason.module) {
              reason.module.chunksIterable.forEach(reasonChunk => {
                if (!orgs[reasonChunk.id]) {
                  orgs[reasonChunk.id] = new Set();
                }

                // orgs[chunk.id].add(`${module.id}-${module.rawRequest}`);
                orgs[reasonChunk.id].add(chunk.id);
              });
            }
          });
        });

        Object.keys(orgs).forEach(key => {
          Array.from(orgs[key]).forEach(subSet => {
            if (orgs[subSet]) {
              orgs[key].add(...orgs[subSet]);
            }
          });
        });
        console.log(map);
        console.log(orgs);
        Array.from(chunk.groupsIterable).forEach(group => {
          // console.log("group", group);
          // console.log("group parents", group.getParents());
          // console.log([...group.blocksIterable][0]);
          // [...group.blocksIterable][0]?.module?.dependencies.forEach((moduleDep)=>{
          // console.log(moduleDep.getReference());
          // if(moduleDep.constructor.name === 'HarmonyImportSideEffectDependency') {
          //   console.log('module name:',[...group.blocksIterable][0].request)
          //   console.log('module', moduleDep)
          //   console.log('module ref',moduleDep.getReference())
          // }
          // })
        });
        const chunkMap = Array.from(chunk.modulesIterable).reduce(
          (acc, module) => {
            acc[module.id] =
              module.name ||
              module.userRequest ||
              module.rawRequest ||
              module.id;
            return acc;
          },
          {}
        );

        this.moduleHashMap = { ...this.moduleHashMap, [chunk.id]: chunkMap };
        for (const fileName of chunk.files) {
          if (
            ModuleFilenameHelpers.matchObject({}, fileName) &&
            fileName.indexOf(".js") !== -1
          ) {
            wrapFile(compilation, fileName, chunkMap);
          }
        }
      });
      // console.log(this.moduleHashMap);
    }; // wrapChunks

    if (compiler.hooks) {
      const { SyncWaterfallHook } = require("tapable");
      const pluginOptions = {
        name: "URLImportPlugin",
        stage: Infinity
      };
      compiler.hooks.webpackURLImportPluginAfterEmit = new SyncWaterfallHook([
        "manifest"
      ]);

      const addLocalVars = (source, chunk, hash) => {
        return [
          source,
          "// interleaving map",
          "var interleaveMap = {};",
          "// adding local registration function",
          "__webpack_require__['registerLocals'] = function(chunkMap) {",
          "if(chunkMap && chunkMap instanceof Object) {",
          "Object.keys(chunkMap).forEach(function(key){",
          "interleaveMap[key] = chunkMap[key]",
          "})",
          "}",
          "};"
        ].join("\n");
      };
      compiler.hooks.compilation.tap("URLImportPlugin", function(compilation) {
        const { mainTemplate } = compilation;

        mainTemplate.hooks.localVars.tap("URLImportPlugin", addLocalVars);

        if (webpack.JavascriptModulesPlugin) {
          // // Webpack 5
          // webpack.JavascriptModulesPlugin.getCompilationHooks(
          //   compilation
          // ).renderRequire.tap("URLImportPlugin", performanceMeasure);
        } else {
          // mainTemplate.hooks.require.tap("URLImportPlugin", performanceMeasure);
        }
      });

      compiler.hooks.compilation.tap("URLImportPlugin", compilation => {
        const usedIds = new Set();
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
              console.log(module);
            }
            const moduleSource = module?.originalSource?.().source?.() || "";
            if (moduleSource?.indexOf("externalize") > -1 || false) {
              module.buildMeta = mergeDeep(module.buildMeta, {
                isExternalized: true
              });

              // add exports back to usedExports, prevents tree shaking on module
              Object.assign(module, {
                usedExports: module?.buildMeta?.providedExports || true
              });

              try {
                // look at refactoring this to use buildMeta not mutate id
                module.id = moduleSource.match(
                  /\/\*\s*externalize\s*:\s*(\S+)\s*\*\//
                )[1];
                externalModules[module.id] = {};
              } catch (error) {
                throw new Error("external-import", error.message);
              }
            }
            if (module.rawRequest) {
              // this.moduleHashMap[module.id] = module.rawRequest;
            } else {
              console.log(module);
            }
          }
        });
      });

      compiler.hooks.compilation.tap(pluginOptions, ({ hooks }) => {
        hooks.moduleAsset.tap(pluginOptions, moduleAsset);
      });

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
