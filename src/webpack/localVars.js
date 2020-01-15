export function addLocalVars(source, chunk, compilationHash) {
  // console.log(source.replace("installedChunks", "originalInstalledChunks"));
// source.replace('var deferredModules = [];',['var installedChunks = Object.create(installedChunks).__proto__.set = function(value){console.log(this)};','var deferredModules = [];'])
  return [
    source,
    "// interleaving map",
    "var interleaveMap = {};",
    `var compilationHash = '${compilationHash}'`
  ].join("\n");
}
