// webpack chunk self registration
let additionalChunksRequired = [];
let additionalChunksPromise;
const interleaveDeferred = {};
let registeredResolver;
const allChunksRegistered = new Promise(function(resolve, reject) {
  registeredResolver = [resolve, reject];
});
function registerLocals(chunkMap) {
  function chunkPromise(chunkName) {
    let resolver;
    const promise = new Promise(function(resolve, reject) {
      resolver = [resolve, reject];
    });
    additionalChunksRequired.push(chunkName);
    if (!interleaveDeferred[chunkName])
      interleaveDeferred[chunkName] = { promise, resolver };
    return true;
  }
  const options = chunkMap[0];
  const chunkDependencyKeys = chunkMap[1];
  const chunkModuleHashMap = chunkMap[2];

  if (compilationHash !== options.hash) {
    chunkDependencyKeys.forEach(function(chunkName) {
      const cssChunks = chunkModuleHashMap[chunkName].css;

      chunkModuleHashMap[chunkName].js.find(function(moduleId) {
        if (!modules[moduleId]) {
          return chunkPromise(chunkName);
        }
      });
      if (cssChunks && cssChunks.length) {
        cssChunks.forEach(function(styleChunk) {
          chunkPromise(styleChunk);
        });
      }
    });

    registeredResolver[0]();
  }
}

function nestedInterleave(nestedModules) {
  const interleavePromises = [];
  let finalResolve;
  let finalPromise;
  const initialRequestMap = {};

  console.group("Nested Modules Needed:", nestedModules);
  const allNested = nestedModules.map(function(moduleIdWithNamespace) {
    let nestedChunkPromiseResolve;
    const nestedChunkPromise = new Promise(function(resolve, reject) {
      nestedChunkPromiseResolve = [resolve, reject];
    });
    const chunkId = moduleIdWithNamespace.substring(
      moduleIdWithNamespace.indexOf("/") + 1
    );
    const namespace = moduleIdWithNamespace.split("/")[0];
    const namespaceObj = window.entryManifest[namespace];
    const foundChunk = namespaceObj[chunkId] || namespaceObj[`${chunkId}.js`];
    console.log({
      chunkId,
      namespace,
      namespaceObj,
      foundChunk
    });
    if (!foundChunk) {
      finalResolve[1](`webpack-external-import: unable to find ${chunkId}`);
      return finalPromise;
    }
    const isCSS = chunkId.indexOf(".css") !== -1;
    initialRequestMap[moduleIdWithNamespace] = chunkId;
    let installedChunkData = installedChunks[chunkId];
    if (installedChunkData !== 0 && !isCSS) {
      // 0 means 'already installed'.
      // a Promise means "currently loading".
      if (installedChunkData) {
        interleavePromises.push(installedChunkData[2]);
      } else {
        if (!interleaveDeferred[chunkId]) {
          // current main chunk
          let resolver;
          var promise = new Promise(function(resolve, reject) {
            resolver = [resolve, reject];
          });
          interleaveDeferred[chunkId] = {
            promise,
            resolver
          };
        }
        // setup Promise in chunk cache
        var promise = new Promise(function(resolve, reject) {
          installedChunkData = installedChunks[chunkId] = [resolve, reject];
        });

        interleavePromises.push((installedChunkData[2] = promise));
        console.log("Chunk ID to be loaded:", chunkId);
        // start chunk loading
        const script = document.createElement("script");
        let onScriptComplete;
        script.charset = "utf-8";
        script.timeout = 120;
        if (__webpack_require__.nc) {
          script.setAttribute("nonce", __webpack_require__.nc);
        }
        console.log("foundChunk", foundChunk);
        script.src = foundChunk.path;
        // create error before stack unwound to get useful stacktrace later
        const error = new Error();
        onScriptComplete = function(event) {
          // avoid mem leaks in IE.

          script.onerror = script.onload = null;
          clearTimeout(timeout);
          const chunk = installedChunks[chunkId];
          console.log("onScriptComplete:installedChunks", installedChunks);
          if (chunk !== 0) {
            if (chunk) {
              console.log("Failed to Load Chunk", chunkId);
              const errorType =
                event && (event.type === "load" ? "missing" : event.type);
              const realSrc = event && event.target && event.target.src;
              error.message = `Loading chunk ${chunkId} failed. (${errorType}: ${realSrc})`;
              error.name = "ChunkLoadError";
              error.type = errorType;
              error.request = realSrc;
              chunk[1](error);
            }

            installedChunks[chunkId] = undefined;
          }
          interleaveDeferred[chunkId].resolver[0](
            interleaveDeferred
          );
          nestedChunkPromiseResolve[0]();
        };

        var timeout = setTimeout(function() {
          onScriptComplete({
            type: "timeout",
            target: script
          });
        }, 120000);
        script.onerror = script.onload = onScriptComplete;
        document.head.appendChild(script);
      }
    }
    if (interleavedCssChunks[chunkId] !== 0 && isCSS) {
      // 0 means 'already installed'

      // Interleaved CSS loading
      if (interleavedCssChunks[chunkId] !== 0) {
        additionalChunksRequired.push(
          (interleavedCssChunks[chunkId] = new Promise(function(
            resolve,
            reject
          ) {
            const fullhref = foundChunk.path;
            const existingLinkTags = document.getElementsByTagName("link");
            for (var i = 0; i < existingLinkTags.length; i++) {
              var tag = existingLinkTags[i];
              var dataHref =
                tag.getAttribute("data-href") || tag.getAttribute("href");
              if (tag.rel === "stylesheet" && dataHref === fullhref)
                return resolve();
            }
            const existingStyleTags = document.getElementsByTagName("style");
            for (var i = 0; i < existingStyleTags.length; i++) {
              var tag = existingStyleTags[i];
              var dataHref = tag.getAttribute("data-href");
              if (dataHref === fullhref)
                return interleaveDeferred[chunkId].resolver[0](
                  interleaveDeferred
                );
            }
            const linkTag = document.createElement("link");
            linkTag.rel = "stylesheet";
            linkTag.type = "text/css";
            linkTag.onload = function() {
              nestedChunkPromiseResolve[0]();
              interleaveDeferred[chunkId].resolver[0](interleaveDeferred);
            };
            linkTag.onerror = function(event) {
              const request =
                (event && event.target && event.target.src) || fullhref;
              const err = new Error(
                `Loading CSS chunk ${chunkId} failed.\n(${request})`
              );
              err.code = "CSS_CHUNK_LOAD_FAILED";
              err.request = request;
              delete interleavedCssChunks[chunkId];
              linkTag.parentNode.removeChild(linkTag);
              reject(err);
            };
            linkTag.href = fullhref;
            if (linkTag.href.indexOf(`${window.location.origin}/`) !== 0) {
              linkTag.crossOrigin = true;
            }
            const target = document.querySelector("body");
            target.insertBefore(linkTag, target.firstChild);
          }).then(function() {
            interleavedCssChunks[chunkId] = 0;
          }))
        );
      }
    }
    return nestedChunkPromise;
  });

  return Promise.all(allNested);
  // allChunksRegistered.then(function () {
  //   var allPromises = Object.keys(interleaveDeferred).map(function(key) {
  //     return interleaveDeferred[key].promise
  //   })
  //
  //   Promise.all(allPromises).then(finalResolve[0]).then(function(){
  //   });
  // })
  // return finalPromise;
  console.endGroup();
}

const interleavePromises = [];
let finalResolve;
var finalPromise;
const nestedQueue = {};
var finalPromise = new Promise(function(resolve, reject) {
  finalResolve = [resolve, reject];
});
const initialRequestMap = {};
// registerLocals chunk loading for javascript
__webpack_require__.interleaved = function(moduleIdWithNamespace, isNested) {
  console.group(
    "Main:",
    "__webpack_require__.interleaved(moduleIdWithNamespace)"
  );
  let nestedResolve;
  const nestedPromise = new Promise(function(resolve, reject) {
    nestedResolve = [resolve, reject];
  });
  const chunkId = moduleIdWithNamespace.substring(
    moduleIdWithNamespace.indexOf("/") + 1
  );
  const namespace = moduleIdWithNamespace.split("/")[0];
  const namespaceObj = window.entryManifest[namespace];
  const foundChunk = namespaceObj[chunkId] || namespaceObj[`${chunkId}.js`];

  if (!foundChunk) {
    finalResolve[1](`webpack-external-import: unable to find ${chunkId}`);
    return finalPromise;
  }
  const isCSS = chunkId.indexOf(".css") !== -1;
  initialRequestMap[moduleIdWithNamespace] = chunkId;
  let installedChunkData = installedChunks[chunkId];
  if (installedChunkData !== 0 && !isCSS) {
    // 0 means 'already installed'.
    // a Promise means "currently loading".
    if (installedChunkData) {
      interleavePromises.push(installedChunkData[2]);
    } else {
      if (!interleaveDeferred[chunkId]) {
        // current main chunk
        let resolver;
        var promise = new Promise(function(resolve, reject) {
          resolver = [resolve, reject];
        });
        interleaveDeferred[chunkId] = {
          promise,
          resolver
        };
      }
      // setup Promise in chunk cache
      var promise = new Promise(function(resolve, reject) {
        installedChunkData = installedChunks[chunkId] = [resolve, reject];
      });
      interleavePromises.push((installedChunkData[2] = promise));
      console.log("Chunk ID to be loaded:", chunkId);
      console.log("interleaveDeferred:", interleaveDeferred);
      // start chunk loading
      const script = document.createElement("script");
      let onScriptComplete;
      script.charset = "utf-8";
      script.timeout = 120;
      if (__webpack_require__.nc) {
        script.setAttribute("nonce", __webpack_require__.nc);
      }
      isNested && console.log("foundChunk", foundChunk);
      script.src = foundChunk.path;
      // create error before stack unwound to get useful stacktrace later
      const error = new Error();
      onScriptComplete = function(event) {
        // avoid mem leaks in IE.

        script.onerror = script.onload = null;
        clearTimeout(timeout);
        const chunk = installedChunks[chunkId];
        console.log("onScriptComplete:installedChunks", installedChunks);
        if (chunk !== 0) {
          if (chunk) {
            console.log("Failed to Load Chunk", chunkId);
            const errorType =
              event && (event.type === "load" ? "missing" : event.type);
            const realSrc = event && event.target && event.target.src;
            error.message = `Loading chunk ${chunkId} failed. (${errorType}: ${realSrc})`;
            error.name = "ChunkLoadError";
            error.type = errorType;
            error.request = realSrc;
            chunk[1](error);
          }
          installedChunks[chunkId] = undefined;
        }
        additionalChunksPromise = additionalChunksRequired.reduce(function(
          additionalPromises,
          extraChunk
        ) {
          additionalChunksRequired = additionalChunksRequired.filter(function(
            i
          ) {
            return i !== extraChunk;
          });
          if (extraChunk instanceof Promise) return additionalPromises;
          additionalPromises.push(`${namespace}/${extraChunk}`);
          return additionalPromises;
        },
        []);
        console.log("nestedInterleave(additionalChunksPromise))",nestedInterleave(additionalChunksPromise));
        nestedResolve[0](nestedInterleave(additionalChunksPromise));
        interleaveDeferred[chunkId].resolver[0](
          interleaveDeferred
        );
      };

      var timeout = setTimeout(function() {
        onScriptComplete({
          type: "timeout",
          target: script
        });
      }, 120000);
      script.onerror = script.onload = onScriptComplete;
      document.head.appendChild(script);
    }
  }

  if (interleavedCssChunks[chunkId] !== 0 && isCSS) {
    // 0 means 'already installed'

    // Interleaved CSS loading
    if (interleavedCssChunks[chunkId] !== 0) {
      additionalChunksRequired.push(
        (interleavedCssChunks[chunkId] = new Promise(function(resolve, reject) {
          const fullhref = foundChunk.path;
          const existingLinkTags = document.getElementsByTagName("link");
          for (var i = 0; i < existingLinkTags.length; i++) {
            var tag = existingLinkTags[i];
            var dataHref =
              tag.getAttribute("data-href") || tag.getAttribute("href");
            if (tag.rel === "stylesheet" && dataHref === fullhref)
              return resolve();
          }
          const existingStyleTags = document.getElementsByTagName("style");
          for (var i = 0; i < existingStyleTags.length; i++) {
            var tag = existingStyleTags[i];
            var dataHref = tag.getAttribute("data-href");
            if (dataHref === fullhref)
              return interleaveDeferred[chunkId].resolver[0](
                interleaveDeferred
              );
          }
          const linkTag = document.createElement("link");
          linkTag.rel = "stylesheet";
          linkTag.type = "text/css";
          linkTag.onload = function() {
            interleaveDeferred[chunkId].resolver[0](interleaveDeferred);
          };
          linkTag.onerror = function(event) {
            const request =
              (event && event.target && event.target.src) || fullhref;
            const err = new Error(
              `Loading CSS chunk ${chunkId} failed.\n(${request})`
            );
            err.code = "CSS_CHUNK_LOAD_FAILED";
            err.request = request;
            delete interleavedCssChunks[chunkId];
            linkTag.parentNode.removeChild(linkTag);
            reject(err);
          };
          linkTag.href = fullhref;
          if (linkTag.href.indexOf(`${window.location.origin}/`) !== 0) {
            linkTag.crossOrigin = true;
          }
          const target = document.querySelector("body");
          target.insertBefore(linkTag, target.firstChild);
        }).then(function() {
          interleavedCssChunks[chunkId] = 0;
        }))
      );
    }
  }
    console.log('ALL TESTED RESOLVED')
  allChunksRegistered.then(function() {
    const allPromises = Object.keys(interleaveDeferred).map(function(key) {
      return interleaveDeferred[key].promise;
    });

    Promise.all(allPromises)
      .then(nestedPromise)
      .then(function() {finalResolve[0]()});
  });

  return finalPromise;
  console.endGroup();
};
