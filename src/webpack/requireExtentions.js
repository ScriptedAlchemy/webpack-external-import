/**
 * addInterleaveExtention - adds a function to webpack runtime which helps register interleaved chunks requirements
 * @param source - the _webpack_require_ source code, from webpack runtime
 * @returns {string}
 */
export const addInterleaveExtention = source => {
  return [
    // get the current source template that holds webpack require
    source,
    // add another function below webpack require, this function
    // has access to any and all functions and variables within the webpack bootstrap
    "// webpack chunk self registration",
    // TODO: use the interleave map added via localVars already within the runtime
    "var additionalChunksRequired = {}",
    // this is called whenever registerLocalswindow.webpackRegister.push is executed
    // chunkMap is what the chunk pushes into the registration, containing the chunks build hash, chunk names and modules ids it needs
    "function registerLocals(chunkMap) {",
    "var chunkCompileHash = chunkMap[0];",
    "var chunkDependencyKeys = chunkMap[1];",
    "var chunkModuleHashMap = chunkMap[2];",
    "console.log({chunkBelongsToThisBuild:compilationHash === chunkCompileHash, chunkCompileHash:chunkCompileHash, chunkDependencyKeys:chunkDependencyKeys,chunkModuleHashMap:chunkModuleHashMap,webpackModules: modules})",
    // check if compilationHash (from webpack runtime) matches the hash the chunk is reporting, if it does then do nothing
    // because the chunk isnt being interleaved, its being consumed by the app it actually belongs to
    "if(compilationHash !== chunkCompileHash) {",
    // this still needs to be written, so its mostly logging at the moment - what goes here will be a mix of webpack functions instructing webpack to download urls
    "chunkDependencyKeys.forEach(function(key){",
    "console.log('key',key,'modules',chunkModuleHashMap[key],'webpack modules',modules)",
    "chunkModuleHashMap[key].find(function(moduleId){",
    "if(!modules[moduleId]) {additionalChunksRequired[key] = true; return true}",
    "})",
    "console.log(additionalChunksRequired)",
    "})",
    "}",
    "};"
  ].join("\n");
};
