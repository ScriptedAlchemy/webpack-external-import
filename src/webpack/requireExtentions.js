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
    "additionalChunksRequired.push(chunkName);",
    "interleaveDeferred[chunkName] = {promise:promise, resolver:resolver};",
    "return true"
  ]),
  "}"
]);

const CssRequireTemplate = Template.asString([
  "",
  `// Interleaved CSS loading`,
  // "if(interleavedCssChunks[chunkId]) additionalChunksRequired.push(interleavedCssChunks[chunkId]);",
  " if(interleavedCssChunks[chunkId] !== 0) {",
  Template.indent([
    "additionalChunksRequired.push(interleavedCssChunks[chunkId] = new Promise(function(resolve, reject) {",
    Template.indent([
      `var fullhref = foundChunk.path;`,
      'var existingLinkTags = document.getElementsByTagName("link");',
      "for(var i = 0; i < existingLinkTags.length; i++) {",
      Template.indent([
        "var tag = existingLinkTags[i];",
        'var dataHref = tag.getAttribute("data-href") || tag.getAttribute("href");',
        // 'if(tag.rel === "stylesheet" && (dataHref === href || dataHref === fullhref)) return resolve();'
        'if(tag.rel === "stylesheet" && (dataHref === fullhref)) return resolve();'
      ]),
      "}",
      'var existingStyleTags = document.getElementsByTagName("style");',
      "for(var i = 0; i < existingStyleTags.length; i++) {",
      Template.indent([
        "var tag = existingStyleTags[i];",
        'var dataHref = tag.getAttribute("data-href");',
        // "if(dataHref === href || dataHref === fullhref) return interleaveDeferred[chunkId].resolver[0](interleaveDeferred);"
        "if(dataHref === fullhref) return interleaveDeferred[chunkId].resolver[0](interleaveDeferred);"
      ]),
      "}",
      'var linkTag = document.createElement("link");',
      'linkTag.rel = "stylesheet";',
      'linkTag.type = "text/css";',
      "linkTag.onload = interleaveDeferred[chunkId].resolver[0];",
      "linkTag.onerror = function(event) {",
      Template.indent([
        "var request = event && event.target && event.target.src || fullhref;",
        'var err = new Error("Loading CSS chunk " + chunkId + " failed.\\n(" + request + ")");',
        'err.code = "CSS_CHUNK_LOAD_FAILED";',
        "err.request = request;",
        "delete interleavedCssChunks[chunkId]",
        "linkTag.parentNode.removeChild(linkTag)",
        "reject(err);"
      ]),
      "};",
      "linkTag.href = fullhref;",
      Template.asString([
        `if (linkTag.href.indexOf(window.location.origin + '/') !== 0) {`,
        Template.indent(`linkTag.crossOrigin = true;`),
        "}"
      ]),
      // using performance modification currently open in webpack PR
      // https://github.com/webpack-contrib/mini-css-extract-plugin/pull/495
      "var target = document.querySelector('body')",
      "target.insertBefore(linkTag,target.firstChild)"
    ]),
    "}).then(function() {",
    Template.indent(["interleavedCssChunks[chunkId] = 0;"]),
    "}));"
  ]),
  "}"
]);

const scriptLoaderTemplate = debug =>
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
      "// start chunk loading",
      "var script = document.createElement('script');",
      "var onScriptComplete;",
      "script.charset = 'utf-8';",
      "script.timeout = 120;",
      "if (__webpack_require__.nc) {",
      Template.indent('script.setAttribute("nonce", __webpack_require__.nc);'),
      "}",
      debug ? "isNested && console.log('foundChunk',foundChunk);" : "",
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

        "var additionalChunksPromise = additionalChunksRequired.reduce(function(additionalPromises, extraChunk) {",
        Template.indent([
          "additionalChunksRequired.shift();",
          "if(extraChunk instanceof Promise) return additionalPromises;",
          Template.indent(
            "additionalPromises.push(__webpack_require__['interleaved'](namespace + '/' + extraChunk, true));"
          ),
          "return additionalPromises"
        ]),
        "}, [])"
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
      "document.head.appendChild(script);",
    ]),
    "}"
  ]);

/**
 * addInterleaveExtention - adds a function to webpack runtime which helps register interleaved chunks requirements
 * @param source - the _webpack_require_ source code, from webpack runtime
 * @param options - the plugin options
 * @returns {string}
 */
export const addInterleaveExtention = (source, { debug }) => {
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
              "chunkBelongsToThisBuild: compilationHash === options.hash",
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
              ? "console.log('CSS', styleChunk, 'is missing from host build. Will download);"
              : "",
            Template.indent(["chunkPromise(styleChunk)"]),
            "});"
          ]),
          "}"
        ]),
        "})",
        debug ? "console.endGroup();" : "",
        // resolve the promise
        `registeredResolver[0]();`
      ]),
      "}"
    ]),
    "};"
  ]);
};

// setting up async require capabilities
export const addInterleaveRequire = (source, requireFn, { debug }) => {
  const webpackInterleaved = Template.asString([
    source,
    "",
    "var interleavePromises = [];",
    "var finalResolve;",
    "var finalPromise;",
    detachedPromise("finalPromise", "finalResolve"),

    "var initialRequestMap = {}",
    "// registerLocals chunk loading for javascript",

    `${requireFn}.interleaved = function(moduleIdWithNamespace, isNested) {`,
    debug
      ? `if(!isNested) console.group("Main:", "${requireFn}.interleaved(moduleIdWithNamespace)");`
      : "",
    debug
      ? `if(isNested) console.group("Nested:", "${requireFn}.interleaved(" + moduleIdWithNamespace + ")");`
      : "",
    Template.indent([
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
      "if(!foundChunk) {return}",
      // TODO: improve how css files are determined
      "var isCSS = chunkId.indexOf('.css') !== -1;",
      "if(!isNested){",
      Template.indent("initialRequestMap[moduleIdWithNamespace] = chunkId;"),
      "}",

      "var installedChunkData = installedChunks[chunkId];",
      "if (installedChunkData !== 0 && !isCSS) { // 0 means 'already installed'.",
      Template.indent(scriptLoaderTemplate(debug)),
      "}",
      "if(interleavedCssChunks[chunkId] !== 0 && isCSS) { // 0 means 'already installed'",
      Template.indent(CssRequireTemplate),
      "}",
      "allChunksRegistered.then(function () {",
      Template.indent([
        "var allPromises = [];",
        "for (var key of Object.keys(interleaveDeferred)) {",
        Template.indent("allPromises.push(interleaveDeferred[key].promise);"),
        "}",
        "",
        "Promise.all(allPromises).then(finalResolve[0]);"
      ]),
      "})",

      "return finalPromise;"
    ]),
    debug ? "if(isNested) console.endGroup();" : "",
    debug ? "if(!isNested) console.endGroup();" : "",
    "}"
  ]);
  return webpackInterleaved;
};
