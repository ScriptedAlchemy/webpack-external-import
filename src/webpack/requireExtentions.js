const Template = require("webpack/lib/Template");

/**
 * addInterleaveExtention - adds a function to webpack runtime which helps register interleaved chunks requirements
 * @param source - the _webpack_require_ source code, from webpack runtime
 * @returns {string}
 */
const chunkPromise = Template.asString([
  "function chunkPromise(chunkName){",
  Template.indent([
    "var resolver;",
    "var promise = new Promise(function (resolve, reject) {",
    Template.indent("resolver  = [resolve, reject];"),
    "});",
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
        'if(tag.rel === "stylesheet" && (dataHref === href || dataHref === fullhref)) return resolve();'
      ]),
      "}",
      'var existingStyleTags = document.getElementsByTagName("style");',
      "for(var i = 0; i < existingStyleTags.length; i++) {",
      Template.indent([
        "var tag = existingStyleTags[i];",
        'var dataHref = tag.getAttribute("data-href");',
        "if(dataHref === href || dataHref === fullhref) return interleaveDeferred[chunkId].resolver[0](interleaveDeferred);"
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

const scriptLoaderTemplate = Template.asString([
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
    "console.log('chunkID:',chunkId);",
    "// start chunk loading",
    "var script = document.createElement('script');",
    "var onScriptComplete;",
    "script.charset = 'utf-8';",
    "script.timeout = 120;",
    "if (__webpack_require__.nc) {",
    Template.indent('script.setAttribute("nonce", __webpack_require__.nc);'),
    "}",
    "isNested && console.log('foundChunk',foundChunk,namespaceObj,chunkId);",
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
]);

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
    chunkPromise,
    Template.indent([
      "console.log('chunkMap',chunkMap);",
      "var options = chunkMap[0];",
      "var chunkDependencyKeys = chunkMap[1];",
      "var chunkModuleHashMap = chunkMap[2];",
      // check if compilationHash (from webpack runtime) matches the hash the chunk is reporting, if it does then do nothing
      // because the chunk isnt being interleaved, its being consumed by the app it actually belongs to
      Template.indent([
        "if(compilationHash !== options.hash) {",
        // this still needs to be written, so its mostly logging at the moment - what goes here will be a mix of webpack functions instructing webpack to download urls
        Template.indent([
          "chunkDependencyKeys.forEach(function(chunkName){",
          Template.indent([
            // if its a stylesheet, immediately exit the loop and go to the next key
            "if(chunkName.indexOf('.css') !== -1) {",
            Template.indent("chunkPromise(chunkName)"),
            "}",
            "chunkModuleHashMap[chunkName].find(function(moduleId){",
            Template.indent([
              "if(!modules[moduleId]) {",
              Template.indent("return chunkPromise(chunkName)"),
              "}"
            ]),
            "})"
          ]),
          "})",
          // resolve the promise
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
    "",
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
      "console.log('found chunk',chunkId,foundChunk)",
      // improve css checking
      "var isCSS = chunkId.indexOf('.css') !== -1;",
      "if(!foundChunk) {return}",
      "if(!isNested){",
      Template.indent("initialRequestMap[moduleIdWithNamespace] = chunkId;"),
      "}",

      "var installedChunkData = installedChunks[chunkId];",
      'if (installedChunkData !== 0 && !isCSS) { // 0 means "already installed".',
      Template.indent(scriptLoaderTemplate),
      "}",
      "if(interleavedCssChunks[chunkId] !== 0 && isCSS) {",
      Template.indent(CssRequireTemplate),
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
