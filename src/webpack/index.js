const path = require('path');
const fse = require('fs-extra');

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
    const moduleAssets = {};

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

    const emit = (compilation, compileCallback) => {
      const emitCount = emitCountMap.get(outputFile) - 1;
      emitCountMap.set(outputFile, emitCount);

      const seed = this.opts.seed || {};

      const publicPath = this.opts.publicPath != null ? this.opts.publicPath : compilation.options.output.publicPath;
      const stats = compilation.getStats()
        .toJson();

      let files = compilation.chunks.reduce((files, chunk) => chunk.files.reduce((files, path) => {
        let name = chunk.name ? chunk.name : null;

        if (name) {
          name = `${name}.${this.getFileType(path)}`;
        } else {
          // For nameless chunks, just map the files directly.
          name = path;
        }

        // Webpack 4: .isOnlyInitial()
        // Webpack 3: .isInitial()
        // Webpack 1/2: .initial
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
        const usedIds = new Set();
        compilation.hooks.beforeModuleIds.tap(
          'URLImportPlugin',
          (modules) => {
            for (const module of modules) {
              if (module._source && module._source._value.includes('externalize')) {
                try {
                  module.id = module._source._value.match(/\/\*\s*externalize\s*:\s*(\S+)\s*\*\//)[1];
                } catch (error) {

                }
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
