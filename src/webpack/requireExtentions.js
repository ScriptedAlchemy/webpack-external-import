const Template = require("webpack/lib/Template");

const detachedPromise = (promiseVar, resolverVar) =>
  Template.asString([
    `var ${promiseVar} = new Promise(function (resolve, reject) {`,
    Template.indent([resolverVar, " = [resolve, reject];"]),
    "});"
  ]);

const chunkPromise = Template.asString([
  "function chunkPromise(chunkName){",
  Template.indent([
    "var resolver;",
    detachedPromise("promise", "resolver"),
    // never overwrite existing promises
    "if(!interleaveDeferred[chunkName])interleaveDeferred[chunkName] = {promise:promise, resolver:resolver};",
    "return true"
  ]),
  "}"
]);

/**
 * addInterleaveExtension - adds a function to webpack runtime which helps register interleaved chunks requirements
 * @param source - the _webpack_require_ source code, from webpack runtime
 * @param options - the plugin options
 * @returns {string}
 */
export const addInterleaveExtension = (source, requireFn, { debug }) => {
  return Template.asString([
    // get the current source template that holds webpack require
    source,
    // add another function below webpack require, this function
    // has access to any and all functions and variables within the webpack bootstrap
    "// webpack chunk self registration",
    // TODO: use the interleave map added via localVars already within the runtime

    "var interleaveDeferred = {};",
    "var interleaveDeferredCopy = {};",
    "var registeredResolver;",
    detachedPromise("allChunksRegistered", "registeredResolver"),
    // this is called whenever registerLocals window.webpackRegister.push is executed
    // chunkMap is what the chunk pushes into the registration, containing the chunks build hash, chunk names and modules ids it needs
    "function registerLocals(chunkMap) {",
    chunkPromise,
    Template.indent([
      "var options = chunkMap[0];",
      "var chunkDependencyKeys = chunkMap[1];",
      "var chunkModuleHashMap = chunkMap[2];",
      debug
        ? Template.asString([
            "console.log({",
            Template.indent([
              "chunkBelongsToThisBuild: compilationHash === options.hash,",
              "chunkCompileHash: options.hash,",
              "chunkDependencyKeys: chunkDependencyKeys,",
              "chunkModuleHashMap: chunkModuleHashMap,",
              "webpackModules: modules"
            ]),
            "});"
          ])
        : "",
      // check if compilationHash (from webpack runtime) matches the hash the chunk is reporting, if it does then do nothing
      // because the chunk isnt being interleaved, its being consumed by the app it actually belongs to
      "if(compilationHash !== options.hash) {",
      // this still needs to be written, so its mostly logging at the moment - what goes here will be a mix of webpack functions instructing webpack to download urls
      Template.indent([
        debug ? "console.group('chunkDependencyKeys Loop');" : "",
        "chunkDependencyKeys.forEach(function(chunkName){",
        Template.indent([
          // get css for chunk, if there is any.
          "var cssChunks = chunkModuleHashMap[chunkName].css",
          debug
            ? Template.asString([
                "console.log({",
                Template.indent([
                  "chunkName: chunkName,",
                  "css: chunkModuleHashMap[chunkName].css,",
                  "js: chunkModuleHashMap[chunkName].js,"
                ]),
                "});"
              ])
            : "",
          // Loop over the modules a chunk depends on
          "chunkModuleHashMap[chunkName].js.find(function(moduleId){",
          Template.indent([
            "if(!modules[moduleId]) {",
            debug
              ? "console.log('Module', moduleId, 'is missing from host build. Needs', chunkName);"
              : "",
            // as soon as a missing module is found, get the chunk that contains it from the origin build
            Template.indent("return chunkPromise(chunkName)"),
            "}"
          ]),
          "});",
          // TODO: use CSS cache to determine if must re-download
          "if(cssChunks && cssChunks.length) {",
          Template.indent([
            // loop over css chunks attached to a chunk
            "cssChunks.forEach(function(styleChunk){",
            debug
              ? "console.log('CSS', styleChunk, 'is missing from host build. Will download');"
              : "",
            Template.indent(["chunkPromise(styleChunk)"]),
            "});"
          ]),
          "}"
        ]),
        "})",
        debug ? "console.groupEnd();" : "",
        // resolve the promise
        `registeredResolver[0]();`
      ]),
      "}"
    ]),
    "};"
  ]);
};

// setting up async require capabilities
export const addInterleaveRequire = (source, requireFn) => {
  return Template.asString([
    source,
    "",
    Template.getFunctionContent(
      require("./interleaveFn").requireInterleaveExtension
    ).replace("__webpack__require__", requireFn)
  ]);
};
