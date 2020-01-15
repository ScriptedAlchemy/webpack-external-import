const Template = require("webpack/lib/Template");
const { ConcatSource } = require("webpack-sources");

/**
 * addInterleaveExtention - adds a function to webpack runtime which helps register interleaved chunks requirements
 * @param source - the _webpack_require_ source code, from webpack runtime
 * @returns {string}
 */
export const addInterleaveExtention = source => {
  return Template.asString([
    // get the current source template that holds webpack require
    source,
    // add another function below webpack require, this function
    // has access to any and all functions and variables within the webpack bootstrap
    "// webpack chunk self registration",
    // TODO: use the interleave map added via localVars already within the runtime
    "var additionalChunksRequired = [];",
    "var interleaveDeferred = {};",
    "var registeredResolver;",
    "var allChunksRegistered = new Promise(function (resolve, reject) {",
    Template.indent("registeredResolver  = [resolve, reject];"),
    "});",
    // this is called whenever registerLocals window.webpackRegister.push is executed
    // chunkMap is what the chunk pushes into the registration, containing the chunks build hash, chunk names and modules ids it needs
    "function registerLocals(chunkMap) {",
    Template.indent([
      "var options = chunkMap[0];",
      "var chunkDependencyKeys = chunkMap[1];",
      "var chunkModuleHashMap = chunkMap[2];",
      "console.log({chunkBelongsToThisBuild:compilationHash === options.hash, chunkCompileHash:options.hash, chunkDependencyKeys:chunkDependencyKeys,chunkModuleHashMap:chunkModuleHashMap,webpackModules: modules})",
      // check if compilationHash (from webpack runtime) matches the hash the chunk is reporting, if it does then do nothing
      // because the chunk isnt being interleaved, its being consumed by the app it actually belongs to
      Template.indent([
        "if(compilationHash !== options.hash) {",
        // this still needs to be written, so its mostly logging at the moment - what goes here will be a mix of webpack functions instructing webpack to download urls
        Template.indent([
          "chunkDependencyKeys.forEach(function(key){",
          Template.indent([
            "chunkModuleHashMap[key].find(function(moduleId){",
            Template.indent([
              "if(!modules[moduleId]) {",
              Template.indent([
                "var resolver;",
                "var promise = new Promise(function (resolve, reject) {",
                Template.indent("resolver  = [resolve, reject];"),
                "});",
                "additionalChunksRequired.push(key);",
                "interleaveDeferred[key] = {promise:promise, resolver:resolver};",
                "return true"
              ]),
              "}"
            ]),
            "})"
          ]),
          "})",
          `registeredResolver[0]()`
        ]),
        "}"
      ])
    ]),
    "};"
  ]);
};

// setting up async require capabilities
export const addInterleaveRequire = (source, requireFn) => {
  const webpackInterleaved = Template.asString([
    source,
    "var interleavePromises = [];",
    "var finalResolve;",
    "var finalPromise;",

    "finalPromise = new Promise(function(resolve, reject) {",
    Template.indent("finalResolve = resolve"),
    "});",

    "var initialRequestMap = {}",
    "// registerLocals chunk loading for javascript",

    `${requireFn}.interleaved = function(moduleIdWithNamespace, isNested) {`,
    Template.indent([
      'var chunkId = moduleIdWithNamespace.substring(moduleIdWithNamespace.indexOf("/") + 1)',
      'var namespace = moduleIdWithNamespace.split("/")[0]',
      "var namespaceObj = window.entryManifest[namespace]",
      "var foundChunk = namespaceObj[chunkId] || namespaceObj[chunkId + '.js'];",
      "console.log('chunk id', chunkId)",

      "if(!isNested){",
      Template.indent("initialRequestMap[moduleIdWithNamespace] = chunkId;"),
      "}",

      `console.log('interleave require', {  chunkId: chunkId,  namespace: namespace, namespaceObj: namespaceObj, foundChunk: foundChunk,   })`,
      "var installedChunkData = installedChunks[chunkId];",
      'if (installedChunkData !== 0) { // 0 means "already installed".',
      Template.indent([
        '// a Promise means "currently loading".',
        "if (installedChunkData) {",
        Template.indent("interleavePromises.push(installedChunkData[2]);"),
        "} else {",
        Template.indent([
          "if (!interleaveDeferred[chunkId]) {",
          Template.indent([
            "// current main chunk",
            "var resolver;",
            "var promise = new Promise(function (resolve, reject) {",
            Template.indent("resolver = [resolve, reject];"),
            "});",
            "interleaveDeferred[chunkId] = {",
            Template.indent(["promise: promise,", "resolver: resolver"]),
            "};"
          ]),
          "}",

          "// setup Promise in chunk cache",
          "var promise = new Promise(function (resolve, reject) {",
          Template.indent(
            "installedChunkData = installedChunks[chunkId] = [resolve, reject];"
          ),
          "});",
          "interleavePromises.push(installedChunkData[2] = promise);",

          "// start chunk loading",
          "var script = document.createElement('script');",
          "var onScriptComplete;",
          "script.charset = 'utf-8';",
          "script.timeout = 120;",
          "if (__webpack_require__.nc) {",
          Template.indent(
            'script.setAttribute("nonce", __webpack_require__.nc);'
          ),
          "}",
          "script.src = foundChunk.path;",
          "// create error before stack unwound to get useful stacktrace later",
          "var error = new Error();",
          "onScriptComplete = function (event) {",
          Template.indent([
            "// avoid mem leaks in IE.",
            "script.onerror = script.onload = null;",
            "clearTimeout(timeout);",
            "var chunk = installedChunks[chunkId];",
            "console.log('interleave require:installedChunks', installedChunks)",
            "if (chunk !== 0) {",
            Template.indent([
              "if (chunk) {",
              Template.indent([
                "var errorType = event && (event.type === 'load' ? 'missing' : event.type);",
                "var realSrc = event && event.target && event.target.src;",
                "error.message = 'Loading chunk ' + chunkId + ' failed. (' + errorType + ': ' + realSrc + ')';",
                "error.name = 'ChunkLoadError';",
                "error.type = errorType;",
                "error.request = realSrc;",
                "chunk[1](error);"
              ]),
              "}",
              "installedChunks[chunkId] = undefined;"
            ]),
            "}",

            "var additionalChunksPromise = additionalChunksRequired.map((extraChunk) => {",
            Template.indent([
              "additionalChunksRequired.shift();",
              " return __webpack_require__['interleaved'](namespace + '/' + extraChunk, true);"
            ]),
            "})"
          ]),
          "};",
          "var timeout = setTimeout(function () {",
          Template.indent([
            "onScriptComplete({",
            Template.indent(["type: 'timeout',", "target: script"]),
            "});"
          ]),
          "}, 120000);",
          "script.onerror = script.onload = onScriptComplete;",
          "document.head.appendChild(script);"
        ]),
        "}"
      ]),
      "}",

      "allChunksRegistered.then(function () {",
      Template.indent([
        "var allPromises = Object.keys(interleaveDeferred).map(function (key) {",
        Template.indent("return interleaveDeferred[key].promise"),
        "})",

        "Promise.all(allPromises).then(function () {",
        Template.indent(" finalResolve()"),
        "})"
      ]),
      "})",

      "return finalPromise;"
    ]),
    "}"
  ]);
  return webpackInterleaved;
};
