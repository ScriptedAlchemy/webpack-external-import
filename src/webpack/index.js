const path = require('path');
const fse = require('fs-extra');

function mergeDeep(...objects) {
  const isObject = obj => obj && typeof obj === 'object';

  return objects.reduce((prev, obj) => {
    Object.keys(obj).forEach((key) => {
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

function hasExternalizedModule(module) {
  const moduleSource = module?.originalSource?.()?.source?.() || '';
  if (moduleSource?.indexOf('externalize') > -1 || false) {
    return moduleSource;
  }
  return false;
}
const emitCountMap = new Map();

class URLImportPlugin {
  constructor(opts) {
    if (!opts.manifestName) {
      throw new Error('URLImportPlugin: You MUST specify a manifestName in your options. Something unique. Like {manifestName: my-special-build}');
    }
    this.opts = Object.assign({
      publicPath: null,
      basePath: '',
      manifestName: 'unknown-project',
      fileName: 'importManifest.js',
      transformExtensions: /^(gz|map)$/i,
      writeToFileEmit: false,
      seed: null,
      filter: null,
      map: null,
      generate: null,
      sort: null,
      serialize: manifest => `if(!window.entryManifest) {window.entryManifest = {}}; window.entryManifest["${opts.manifestName}"] = ${JSON.stringify(
        manifest,
        null,
        2,
      )}`,
    }, opts || {});
  }

  getFileType(str) {
    str = str.replace(/\?.*/, '');
    const split = str.split('.');
    let ext = split.pop();
    if (this.opts.transformExtensions.test(ext)) {
      ext = `${split.pop()}.${ext}`;
    }
    return ext;
  }

  apply(compiler) {
    const options = compiler?.options;
    const chunkSplitting = options?.optimization?.splitChunks?.cacheGroups || {};
    chunkSplitting.interleave = {
      test(module) {
        if (module.resource) {
          return module.resource.includes('src') && !!hasExternalizedModule(module);
        }
      },
      name(module, chunks, cacheGroupKey) {
        // dont chunk unless we are sure you can

        const moduleSource = hasExternalizedModule(module);
        if (moduleSource) {
          // module.originalSource().source((dependencyTemplates, runtimeTemplate, type = "javascript") =>{
          // return NormalModule
          //   return
          // })
          return moduleSource.match(/\/\*\s*externalize\s*:\s*(\S+)\s*\*\//)[1];
        }
        // returning a chunk name causes problems with mini-css popping chunks off
        // return 'main';
      },
      enforce: true,
    };
    compiler.hooks.thisCompilation.tap('URLImportPlugin', (compilation) => {
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

    mergeDeep(options, {
      optimization: { namedModules: true, splitChunks: { cacheGroups: chunkSplitting } },
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
          path.basename(userRequest),
        );
      }
    };

    function getMeta(module) {
      console.log(module);
    }

    const emit = (compilation, compileCallback) => {
      const emitCount = emitCountMap.get(outputFile) - 1;
      emitCountMap.set(outputFile, emitCount);

      const seed = this.opts.seed || {};

      const publicPath = this.opts.publicPath != null ? this.opts.publicPath : compilation.options.output.publicPath;
      const stats = compilation.getStats()
        .toJson();
      // console.log('Webpack Plugin Debugging');

      let files = compilation.chunks.reduce((files, chunk) => chunk.files.reduce((files, path) => {
        let name = chunk.name ? chunk.name : null;

        if (name) {
          name = `${name}.${this.getFileType(path)}`;
        } else {
          // For nameless chunks, just map the files directly.
          name = path;
        }

        // console.log('stats', stats);

        if (externalModules[chunk.id]) {
          // TODO: swap forEachModle out with const of
          // const module of chunk.modulesIterable
          chunk.forEachModule((module) => {
            if (module.dependencies) {
              module.dependencies.forEach((dependency) => {
                // console.group();
                // console.log('dependencies foreach: dependency.module', dependency.module);
                // console.log('dependencies foreach:  dependency.module.entry', dependency?.module?.entry?.());
                // console.group();
                // console.log("Level 3");
                // console.warn("More of level 3");
                // console.groupEnd();
                // console.log("Back to level 2");
                // console.groupEnd();
                const dependencyModuleSet = dependency.getReference?.()?.module;
                if (!dependencyModuleSet) return null;
                // console.log('getReference chunks', dependencyModuleSet);
                // console.log('dependencyModuleSet', dependencyModuleSet);
                // console.log('dependencyModuleSet entryModule', dependencyModuleSet?.entryModule?.());
                // for (const module of dependencyModuleSet.chunksIterable) {
                //   console.log('iterated dependency module', module);
                //   console.log(module.block);
                // }
              });
            }
          });
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
          isInitial: chunk.isOnlyInitial ? chunk.isOnlyInitial() : (chunk.isInitial ? chunk.isInitial() : chunk.initial),
          isChunk: true,
          isAsset: false,
          isModuleAsset: false,
        });
      }, files), []);

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
            isModuleAsset: true,
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
          isModuleAsset: false,
        });
      }, files);

      files = files.filter((file) => {
        // Don't add hot updates to manifest
        const isUpdateChunk = file.path.includes('hot-update');
        // Don't add manifest from another instance
        const isManifest = emitCountMap.get(path.join(outputFolder, file.name)) !== undefined;

        return !isUpdateChunk && !isManifest;
      });


      // Append optional basepath onto all references.
      // This allows output path to be reflected in the manifest.
      if (this.opts.basePath) {
        files = files.map((file) => {
          file.name = this.opts.basePath + file.name;
          return file;
        });
      }

      if (publicPath) {
        // Similar to basePath but only affects the value (similar to how
        // output.publicPath turns require('foo/bar') into '/public/foo/bar', see
        // https://github.com/webpack/docs/wiki/configuration#outputpublicpath
        files = files.map((file) => {
          file.path = publicPath + file.path;
          return file;
        });
      }

      files = files.map((file) => {
        file.name = file.name.replace(/\\/g, '/');
        file.path = file.path.replace(/\\/g, '/');
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

      let manifest;
      if (this.opts.generate) {
        manifest = this.opts.generate(seed, files);
      } else {
        manifest = files.reduce((manifest, file) => {
          manifest[file.name] = file.path;
          return manifest;
        }, seed);
      }

      const isLastEmit = emitCount === 0;
      if (isLastEmit) {
        const cleanedManifest = Object.entries(manifest)
          .reduce((acc, [key, asset]) => {
            if (!asset.includes('.map')) {
              return Object.assign(acc, { [key]: asset });
            }
            return acc;
          }, {});

        const output = this.opts.serialize(cleanedManifest);

        compilation.assets[outputName] = {
          source() {
            return output;
          },
          size() {
            return output.length;
          },
        };

        if (this.opts.writeToFileEmit) {
          fse.outputFileSync(outputFile, output);
        }
      }

      if (compiler.hooks) {
        compiler.hooks.webpackURLImportPluginAfterEmit.call(manifest);
      } else {
        compilation.applyPluginsAsync('webpack-manifest-plugin-after-emit', manifest, compileCallback);
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
      const { SyncWaterfallHook } = require('tapable');
      const pluginOptions = {
        name: 'URLImportPlugin',
        stage: Infinity,
      };
      compiler.hooks.webpackURLImportPluginAfterEmit = new SyncWaterfallHook(['manifest']);

      compiler.hooks.compilation.tap('URLImportPlugin', (compilation) => {
        compilation.hooks.beforeModuleIds.tap(
          'URLImportPlugin',
          (modules) => {
            for (const module of modules) {
              const moduleSource = module?.originalSource?.().source?.() || '';
              if (moduleSource?.indexOf('externalize') > -1 || false) {
                module.buildMeta = mergeDeep(module.buildMeta, { isExternalized: true });
                try {
                  // look at refactoring this to use buildMeta not mutate id
                  module.id = moduleSource.match(/\/\*\s*externalize\s*:\s*(\S+)\s*\*\//)[1];
                } catch (error) {
                }
                externalModules[module.id] = {};
              }
            }
          },
        );
      });

      compiler.hooks.compilation.tap(pluginOptions, ({ hooks }) => {
        hooks.moduleAsset.tap(pluginOptions, moduleAsset);
      });

      compiler.hooks.emit.tap(pluginOptions, emit);

      compiler.hooks.run.tap(pluginOptions, beforeRun);
      compiler.hooks.watchRun.tap(pluginOptions, beforeRun);
    } else {
      compiler.plugin('compilation', (compilation) => {
        compilation.plugin('module-asset', moduleAsset);
      });
      compiler.plugin('emit', emit);

      compiler.plugin('before-run', beforeRun);
      compiler.plugin('watch-run', beforeRun);
    }
  }
}

module.exports = URLImportPlugin;
