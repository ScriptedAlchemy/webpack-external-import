export const addInterleaveExtention = (source, chunk, hash) => {
  return [
    source,
    "// webpack chunk self registration",
    `function registerLocals(chunkMap) { //chunkMap[0].forEach(function(key){`,
    "var chunkCompileHash = chunkMap[0];",
    "var chunkDependencyKeys = chunkMap[1];",
    "var chunkModuleHashMap = chunkMap[2];",
    "console.log({chunkBelongsToThisBuild:compilationHash === chunkCompileHash, chunkCompileHash:chunkCompileHash, chunkDependencyKeys:chunkDependencyKeys,chunkModuleHashMap:chunkModuleHashMap})",
    "if(compilationHash !== chunkCompileHash) {",
    "chunkDependencyKeys.forEach(function(key){",
    "console.log('key',key,'modules',chunkModuleHashMap[key],'webpack modules',modules)",
    "//console.log(chunkMap[1][key].filter((neededModule)=>{return !modules[neededModule]}));//modules.filter((module)=>{console.log(module)})",
    // "Object.keys(chunkMap).forEach(function(key){",
    // "interleaveMap[key] = chunkMap[key]",
    "})",
    "}",
    "};"
  ].join("\n");
};
