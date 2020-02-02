const Template = require("webpack/lib/Template");
const { detachedPromise, chunkPromise } = require("./utils");
export const CssRequireTemplate = Template.asString([
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
      "linkTag.onload = function(){interleaveDeferred[chunkId].resolver[0](interleaveDeferred)}",
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
