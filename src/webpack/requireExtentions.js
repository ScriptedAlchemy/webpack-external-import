export const addInterleaveExtention = (source, chunk, webpackHash) => {
  return [
    source,
    "// adding local registration function",
    "function registerLocals(chunkMap) { console.log(webpackHash,chunkMap);//chunkMap[0].forEach(function(key){",
    "//keys 0 map 1",
    "//console.log(chunkMap[1][key].filter((neededModule)=>{return !modules[neededModule]}));//modules.filter((module)=>{console.log(module)})",
    // "Object.keys(chunkMap).forEach(function(key){",
    // "interleaveMap[key] = chunkMap[key]",
    "//})",
    "};"
  ].join("\n");
};
