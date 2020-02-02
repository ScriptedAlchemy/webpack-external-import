const Template = require("webpack/lib/Template");

export const detachedPromise = (promiseVar, resolverVar) =>
  Template.asString([
    `var ${promiseVar} = new Promise(function (resolve, reject) {`,
    Template.indent([resolverVar, " = [resolve, reject];"]),
    "});"
  ]);

export const chunkPromise = Template.asString([
  "function chunkPromise(chunkName){",
  Template.indent([
    "var resolver;",
    detachedPromise("promise", "resolver"),
    "additionalChunksRequired.push(chunkName);",
    // never overwrite existing promises
    "if(!interleaveDeferred[chunkName])interleaveDeferred[chunkName] = {promise:promise, resolver:resolver};",
    "return true"
  ]),
  "}"
]);
