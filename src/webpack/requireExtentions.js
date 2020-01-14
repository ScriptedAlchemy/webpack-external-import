const Template = require("webpack/lib/Template");
const { ConcatSource } = require("webpack-sources");

/**
 * addInterleaveExtention - adds a function to webpack runtime which helps register interleaved chunks requirements
 * @param source - the _webpack_require_ source code, from webpack runtime
 * @returns {string}
 */
export const addInterleaveExtention = source => {
  return Template.asString([
    // get the current source template that holds webpack require
    source,
    // add another function below webpack require, this function
    // has access to any and all functions and variables within the webpack bootstrap
    "// webpack chunk self registration",
    // TODO: use the interleave map added via localVars already within the runtime
    "var additionalChunksRequired = []",
    "var intreleaveDeferred = []",
    // this is called whenever registerLocalswindow.webpackRegister.push is executed
    // chunkMap is what the chunk pushes into the registration, containing the chunks build hash, chunk names and modules ids it needs
    "function registerLocals(chunkMap) {",
    Template.indent([
      "var options = chunkMap[0];",
      "var chunkDependencyKeys = chunkMap[1];",
      "var chunkModuleHashMap = chunkMap[2];",
      "console.log({chunkBelongsToThisBuild:compilationHash === options.hash, chunkCompileHash:options.hash, chunkDependencyKeys:chunkDependencyKeys,chunkModuleHashMap:chunkModuleHashMap,webpackModules: modules})",
      // check if compilationHash (from webpack runtime) matches the hash the chunk is reporting, if it does then do nothing
      // because the chunk isnt being interleaved, its being consumed by the app it actually belongs to
      "if(compilationHash !== options.hash) {",
      // this still needs to be written, so its mostly logging at the moment - what goes here will be a mix of webpack functions instructing webpack to download urls
      "chunkDependencyKeys.forEach(function(key){",
      "console.log('key',key,'modules',chunkModuleHashMap[key],'webpack modules',modules)",
      "chunkModuleHashMap[key].find(function(moduleId){",
      "if(!modules[moduleId]) {additionalChunksRequired.push(key);console.log('pushing keys',key);intreleaveDeferred.push(key); return true}",
      "})",
      "})",
      "}"
    ]),
    "};"
  ]);
};

// setting up async require capabilities
export const addInterleaveRequire = source => {
  const webpackInterleaved = Template.asString([
    source,
    `var interleavePromises = [];

    // registerLocals chunk loading for javascript
    __webpack_require__['interleaved'] = function (moduleIdWithNamespace) {
    var chunkId = moduleIdWithNamespace.substring(moduleIdWithNamespace.indexOf('/')+1)
    var namespace = moduleIdWithNamespace.split('/')[0]
    var namespaceObj = window.entryManifest[namespace]
    var foundChunk = namespaceObj[chunkId] || namespaceObj[chunkId + '.js'];
    console.log('interleave require',{
      chunkId:chunkId,
      namespace:namespace,
      namespaceObj:namespaceObj,
      foundChunk:foundChunk,
    })

        var installedChunkData = installedChunks[chunkId];
        if (installedChunkData !== 0) { // 0 means "already installed".
            // Object.defineProperty(installedChunks,chunkId,{set: function(value){ this[chunkId]=value}})

            // a Promise means "currently loading".
            if (installedChunkData) {
                interleavePromises.push(installedChunkData[2]);
            } else {
                // setup Promise in chunk cache
                var promise = new Promise(function (resolve, reject) {
                    installedChunkData = installedChunks[chunkId] = [resolve, reject];
                });
                interleavePromises.push(installedChunkData[2] = promise);

                // start chunk loading
                var script = document.createElement('script');
                var onScriptComplete;

                script.charset = 'utf-8';
                script.timeout = 120;
                if (__webpack_require__.nc) {
                    script.setAttribute("nonce", __webpack_require__.nc);
                }
                script.src = foundChunk.path;

                // create error before stack unwound to get useful stacktrace later
                var error = new Error();
                onScriptComplete = function (event) {
                    // avoid mem leaks in IE.
                    script.onerror = script.onload = null;
                    clearTimeout(timeout);
                    var chunk = installedChunks[chunkId];
                    console.log('interleave require:installedChunks',installedChunks)

                    var additionalChunkPromises = additionalChunksRequired.map((extraChunk)=>{console.log('extra chunk',extraChunk);  delete additionalChunksRequired[extraChunk];return __webpack_require__['interleaved'](namespace + '/' + extraChunk);  })
                    // console.log('additionalChunkPromises',additionalChunkPromises)
                    // if(modules[chunkId] || event.type === 'load') {
                    // console.log('chunk',chunk)
                    //   chunk[0]()
                    // }
                  
                    if (chunk !== 0) {
                        if (chunk) {
                            var errorType = event && (event.type === 'load' ? 'missing' : event.type);
                            var realSrc = event && event.target && event.target.src;
                            error.message = 'Loading chunk ' + chunkId + ' failed. (' + errorType + ': ' + realSrc + ')';
                            error.name = 'ChunkLoadError';
                            error.type = errorType;
                            error.request = realSrc;
                            chunk[1](error);
                        }
                        installedChunks[chunkId] = undefined;
                    }
                };
                var timeout = setTimeout(function () {
                    onScriptComplete({type: 'timeout', target: script});
                }, 120000);
                script.onerror = script.onload = onScriptComplete;
                document.head.appendChild(script);
            }
        }
        
        console.log('interleavePromises',interleavePromises)
        return Promise.all(interleavePromises).then(()=>{
         return new Promise(resolve =>{
           var pollInstalled = setInterval(()=>{
          var chunkProgress =  intreleaveDeferred.every(function(chunk) {
           return installedChunks.hasOwnProperty(chunkId)  === true
           })
            if(chunkProgress ) {clearInterval(pollInstalled);console.log('installedChunks',Object.create(installedChunks)); resolve()}
            
            },10)
          })
        });
    }`
  ]);
  return webpackInterleaved;
};
