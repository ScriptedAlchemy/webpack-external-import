const Template = require("webpack/lib/Template");
const { detachedPromise, chunkPromise } = require("./utils");
const { CssRequireTemplate } = require("./CssRequireTemplate");
const { scriptLoaderTemplate } = require("./ScriptLoaderTemplate");

export const addInterleaveRequire = (source, requireFn, { debug }) => {
  const webpackInterleaved = Template.asString([
    source,
    "",
    "var interleavePromises = [];",
    "var finalResolve;",
    "var finalPromise;",
    "var nestedQueue = {}",
    detachedPromise("finalPromise", "finalResolve"),

    "var initialRequestMap = {}",
    "// registerLocals chunk loading for javascript",

    `${requireFn}.interleaved = function(moduleIdWithNamespace, isNested) {`,
    debug
      ? `console.group("Main:", "${requireFn}.interleaved(moduleIdWithNamespace)");`
      : "",
    Template.indent([
      "",
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
      "}",
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
      "allChunksRegistered.then(function () {",
      Template.indent([
        // "var allPromises = [];",
        "var allPromises = Object.keys(interleaveDeferred).map(function(key) {",
        "return interleaveDeferred[key].promise",
        "})",
        // "for (var key of Object.keys(interleaveDeferred)) {",
        // Template.indent("allPromises.push(interleaveDeferred[key].promise);"),
        // "}",
        "",
        "Promise.all(allPromises).then(finalResolve[0]).then(function(){",
        "});"
      ]),
      "})",
      "return finalPromise;"
    ]),
    debug ? "console.endGroup();" : "",
    "}"
  ]);
  return webpackInterleaved;
};
