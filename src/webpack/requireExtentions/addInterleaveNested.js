const Template = require("webpack/lib/Template");
const { detachedPromise, chunkPromise } = require("./utils");
const { CssRequireTemplate } = require("./CssRequireTemplate");

export const scriptLoaderTemplate = debug =>
  Template.asString([
    '// a Promise means "currently loading".',
    "if (installedChunkData) {",
    Template.indent("interleavePromises.push(installedChunkData[2]);"),
    "} else {",
    Template.indent([
      "if (!interleaveDeferred[chunkId]) {",
      Template.indent([
        "// current main chunk",
        "var resolver;",
        detachedPromise("promise", "resolver"),
        "interleaveDeferred[chunkId] = {",
        Template.indent(["promise: promise,", "resolver: resolver"]),
        "};"
      ]),
      "}",
      "// setup Promise in chunk cache",
      detachedPromise(
        "promise",
        "installedChunkData = installedChunks[chunkId]"
      ),
      "interleavePromises.push(installedChunkData[2] = promise);",
      debug ? "console.log('Chunk ID to be loaded:', chunkId);" : "",
      debug ? "console.log('interleaveDeferred:', interleaveDeferred);" : "",
      "// start chunk loading",
      "var script = document.createElement('script');",
      "var onScriptComplete;",
      "script.charset = 'utf-8';",
      "script.timeout = 120;",
      "if (__webpack_require__.nc) {",
      Template.indent('script.setAttribute("nonce", __webpack_require__.nc);'),
      "}",
      debug ? "console.log('foundChunk',foundChunk);" : "",
      "script.src = foundChunk.path;",
      "// create error before stack unwound to get useful stacktrace later",
      "var error = new Error();",
      "onScriptComplete = function (event) {",
      Template.indent([
        "// avoid mem leaks in IE.",
        "",
        "script.onerror = script.onload = null;",
        "clearTimeout(timeout);",
        "var chunk = installedChunks[chunkId];",
        debug
          ? "console.log('onScriptComplete:installedChunks',installedChunks)"
          : "",
        "if (chunk !== 0) {",
        Template.indent([
          "if (chunk) {",
          debug ? "console.log('Failed to Load Chunk', chunkId)" : "",
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
        "nestedChunkPromiseResolve[0]();"

        // "additionalChunksPromise = additionalChunksRequired.reduce(function(additionalPromises, extraChunk) {",
        // Template.indent([
        //   Template.indent(
        //     "additionalChunksRequired = additionalChunksRequired.filter(function(i){return i !== extraChunk});"
        //   ),
        //   "if(extraChunk instanceof Promise) return additionalPromises;",
        //   // "nestedInterleave(namespace + '/' + extraChunk);",
        //   // Template.indent(
        //   //   "additionalChunksRequired.push(__webpack_require__['interleaved'](namespace + '/' + extraChunk, true));"
        //   // ),
        //   "additionalPromises.push(namespace + '/' + extraChunk)",
        //   "return additionalPromises"
        // ]),
        // "}, [])",
        // "console.log('additionalChunksPromise',additionalChunksPromise);",
        // "nestedInterleave(additionalChunksPromise)"
      ]),
      "};",
      "",
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
  ]);

export const addInterleaveNested = (source, requireFn, { debug }) => {
  return Template.asString([
    source,
    "",

    // "// registerLocals chunk loading for javascript",

    `function nestedInterleave(nestedModules) {`,
    "var interleavePromises = [];",
    "var finalResolve;",
    "var finalPromise;",
    "var initialRequestMap = {}",

    detachedPromise("finalPromise", "finalResolve"),

    debug ? `console.group("Nested Modules Needed:",  nestedModules );` : "",
    Template.indent([
      "const allNested = nestedModules.map(function(moduleIdWithNamespace){",
      Template.indent([
        "var nestedChunkPromiseResolve;",
        detachedPromise("nestedChunkPromise", "nestedChunkPromiseResolve"),
        'var chunkId = moduleIdWithNamespace.substring(moduleIdWithNamespace.indexOf("/") + 1)',
        'var namespace = moduleIdWithNamespace.split("/")[0]',
        "var namespaceObj = window.entryManifest[namespace]",
        "var foundChunk = namespaceObj[chunkId] || namespaceObj[chunkId + '.js'];",

        debug
          ? Template.asString([
              "console.log({",
              Template.indent([
                "chunkId:chunkId,",
                "namespace:namespace,",
                "namespaceObj:namespaceObj,",
                "foundChunk:foundChunk,"
              ]),
              "});"
            ])
          : "",

        "if (!foundChunk) {",
        Template.indent([
          'finalResolve[1]("webpack-external-import: unable to find " + chunkId);',
          "return finalPromise"
        ]),
        "}"
      ]),
      // TODO: improve how css files are determined
      "var isCSS = chunkId.indexOf('.css') !== -1;",
      Template.indent("initialRequestMap[moduleIdWithNamespace] = chunkId;"),
      "var installedChunkData = installedChunks[chunkId];",
      "if (installedChunkData !== 0 && !isCSS) { // 0 means 'already installed'.",
      Template.indent(scriptLoaderTemplate(debug)),
      "}",
      "if(interleavedCssChunks[chunkId] !== 0 && isCSS) { // 0 means 'already installed'",
      Template.indent(CssRequireTemplate),
      "}",
      // end of loop
      "});",
      "return Promise.all(allNested);"
      // "allChunksRegistered.then(function () {",
      // Template.indent([
      //   // "var allPromises = [];",
      //   "var allPromises = Object.keys(interleaveDeferred).map(function(key) {",
      //   "return interleaveDeferred[key].promise",
      //   "})",
      //   // "for (var key of Object.keys(interleaveDeferred)) {",
      //   // Template.indent("allPromises.push(interleaveDeferred[key].promise);"),
      //   // "}",
      //   "",
      //   "Promise.all(allPromises).then(finalResolve[0]).then(function(){",
      //   "});"
      // ]),
      // "})",
      // "return finalPromise;"
    ]),
    debug ? "console.endGroup();" : "",
    "}"
  ]);
};
