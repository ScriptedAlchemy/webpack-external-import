module.exports.requireInterleaveExtension = function() {
  /* global interleaveDeferredCopy, interleaveDeferred,installedChunks */

  // interleaveDeferredCopy, interleaveDeferred, installedChunks are globals inside the webpack runtime scope

  function interleaveCss(args) {
    // Interleaved CSS loading

    const { installedChunks, chunkId, foundChunk, finalResolve } = args;

    // 0 means 'already installed'
    if (installedChunks[chunkId] !== 0) {
      installedChunks[chunkId] = new Promise(function(resolve, reject) {
        const fullhref = foundChunk.path;
        const existingLinkTags = document.getElementsByTagName("link");
        for (let i = 0; i < existingLinkTags.length; i++) {
          const tag = existingLinkTags[i];
          const linkDataHref =
            tag.getAttribute("data-href") || tag.getAttribute("href");
          if (tag.rel === "stylesheet" && linkDataHref === fullhref) resolve();

          return finalResolve[0]();
        }
        const existingStyleTags = document.getElementsByTagName("style");
        for (let i = 0; i < existingStyleTags.length; i++) {
          const tag = existingStyleTags[i];
          const styleDataHref = tag.getAttribute("data-href");
          if (styleDataHref === fullhref)
            interleaveDeferred[chunkId].resolver[0]();
          interleaveDeferredCopy[chunkId] = interleaveDeferred[chunkId];
          delete interleaveDeferred[chunkId];
          finalResolve[0]();
          return;
        }
        const linkTag = document.createElement("link");
        linkTag.rel = "stylesheet";
        linkTag.type = "text/css";
        linkTag.onload = function() {
          // trigger a promise resolution for anything else waiting
          interleaveDeferred[chunkId].resolver[0]();
          // remove from object after resolving it
          delete interleaveDeferred[chunkId];

          // resolve the promise chain in this function scope
          finalResolve[0]();
        };
        linkTag.onerror = function(event) {
          const request =
            (event && event.target && event.target.src) || fullhref;
          const err = new Error(
            `Loading CSS chunk ${chunkId} failed.\n(${request})`
          );
          err.code = "CSS_CHUNK_LOAD_FAILED";
          err.request = request;
          linkTag.parentNode.removeChild(linkTag);
          reject(err);
          interleaveDeferred[chunkId].resolver[1](err);
          delete interleaveDeferred[chunkId];
          finalResolve[1](err);
        };
        linkTag.href = fullhref;
        if (linkTag.href.indexOf(`${window.location.origin}/`) !== 0) {
          linkTag.crossOrigin = true;
        }
        const target = document.querySelector("body");
        target.insertBefore(linkTag, target.firstChild);
      }).then(function() {
        installedChunks[chunkId] = 0;
      });
    }
  }
  // registerLocals chunk loading for javascript
  __webpack_require__.interleaved = function(moduleIdWithNamespace, isNested) {
    const initialRequestMap = {};
    const interleavePromises = [];
    let finalResolve;

    const finalPromise = new Promise(function(resolve, reject) {
      finalResolve = [resolve, reject];
    });

    if (!isNested)
      console.group(
        "Main:",
        `__webpack_require__.interleaved(${moduleIdWithNamespace})`
      );
    if (isNested)
      console.group(
        "Nested:",
        `__webpack_require__.interleaved(${moduleIdWithNamespace})`
      );
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
    if (!isNested) {
      initialRequestMap[moduleIdWithNamespace] = chunkId;
    }
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
          const promise = new Promise(function(resolve, reject) {
            resolver = [resolve, reject];
          });
          interleaveDeferred[chunkId] = {
            promise,
            resolver
          };
        }
        // setup Promise in chunk cache
        const promise = new Promise(function(resolve, reject) {
          installedChunkData = installedChunks[chunkId] = [resolve, reject];
        });
        interleavePromises.push((installedChunkData[2] = promise));
        console.log("Chunk ID to be loaded:", chunkId);
        console.log("interleaveDeferred:", interleaveDeferred);
        // start chunk loading
        const script = document.createElement("script");
        script.charset = "utf-8";
        script.timeout = 120;
        if (__webpack_require__.nc) {
          script.setAttribute("nonce", __webpack_require__.nc);
        }

        script.src = foundChunk.path;

        // create error before stack unwound to get useful stacktrace later
        const error = new Error();
        const onScriptComplete = function(event) {
          // avoid mem leaks in IE.

          script.onerror = script.onload = null;
          // eslint-disable-next-line no-use-before-define
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
              delete interleaveDeferred[chunkId];
              finalResolve[1](error);
            }
            installedChunks[chunkId] = undefined;
          }
          console.log(chunkId, "installed");

          const interleaveDeferredKeys = Object.keys(interleaveDeferred);
          console.log("interleaveDeferredKeys", interleaveDeferredKeys);
          interleaveDeferredCopy[chunkId] = interleaveDeferred[chunkId];
          delete interleaveDeferred[chunkId];
          const chunksToInstall = interleaveDeferredKeys.filter(function(item) {
            return installedChunks[item] === undefined;
          });
          console.log("chunksToInstall", chunksToInstall, true);
          if (!chunksToInstall.length) {
            finalResolve[0]();
          }
          // recursively find more chunks to install and push them into the interleave function
          // once all nested calls are done, resolve the current functions promise
          Promise.all(
            chunksToInstall.map(function(chunk) {
              return __webpack_require__.interleaved(
                `${namespace}/${chunk}`,
                true
              );
            })
          ).then(finalResolve[0]);
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
    if (installedChunks[chunkId] !== 0 && isCSS) {
      interleaveCss({
        installedChunks,
        chunkId,
        foundChunk,
        finalResolve
      });
    }
    if (console.endGroup) console.endGroup();
    return finalPromise.then(function() {
      if (!isNested) return __webpack_require__(chunkId);
    });
  };
};
