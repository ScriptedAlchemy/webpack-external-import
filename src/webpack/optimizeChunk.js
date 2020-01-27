const ModuleFilenameHelpers = require("webpack/lib/ModuleFilenameHelpers");
const { ConcatSource } = require("webpack-sources");

function wrapFile(compilation, fileName, allModulesNeeded, chunkKeys) {
  // create a stringified array
  const outputOptions = compilation.output;
  const pushArguments = JSON.stringify([
    // pass the source compilation hash to figure out if a chunk is being required by its own build - if so, dont register anything
    { hash: compilation.hash, publicPath: outputOptions?.publicPath || "/" },
    // array of keys to look up values in the allModulesNeeded hashmap
    chunkKeys,
    allModulesNeeded
  ]);

  // add chunk registration code that will push all chunk requirements into webpack
  compilation.assets[fileName] = new ConcatSource(
    String(
      `(window["webpackRegister"] = window["webpackRegister"] || []).push(${pushArguments});\n`
    ),
    compilation.assets[fileName]
  );
}

// eslint-disable-next-line import/prefer-default-export
export function wrapChunks(compilation, chunks) {
  // create a maps
  const map = { ignoredChunk: new Set() };
  const orgs = {};
  // loop over each chunk
  chunks.forEach(chunk => {
    console.log("chunk", chunk);
    // map weak maps and weak sets for better organization & perf
    // console.group(group)
    console.log(
      "chunk",
      chunk.id,
      chunk.canBeInitial(),
      chunk.isOnlyInitial(),
      chunk.hasEntryModule(),
      chunk.hasRuntime()
    );

    // check if this chunk is an entrypoint or has the webpack runtime
    // if it does, dont bother mapping registration data or include them in any other chunks registration maps
    if (chunk.hasEntryModule() || chunk.hasRuntime()) {
      map.ignoredChunk.add(chunk.id);
    } else {
      console.log("ignored chunk", chunk);
    }

    // dont run if this has already been done on the chunk
    if (!chunk.rendered) {
      return;
    }
    // get all the modules in a chunk and loop over them
    chunk.getModules().forEach(module => {
      // add the chunk ID as a key and create an empty array if one isnt there already
      if (!(map[chunk.id] instanceof Object)) {
        map[chunk.id] = { js: [], css: [] };
      }
      // push each module in a chunk into its array within the map
      if (module.id) map[chunk.id].js.push(`${module.id}`);
      chunk.files.forEach(file => {
        if (file.includes(".css")) {
          // convert these to sets
          map[chunk.id].css.push(file);
        }
      });

      // check the reason a chunk exists, this is an array which returns any and all modules that depend on the current module
      module.reasons.forEach(reason => {
        if (reason.module) {
          // if theres a module, loop over the chunks this module is in
          reason.module.chunksIterable.forEach(reasonChunk => {
            // add the chunkID of where this module exists
            if (!orgs[reasonChunk.id])
              orgs[reasonChunk.id] = { js: new Set(), css: new Set() };
            reasonChunk.files.forEach(file => {
              if (file.includes(".css")) {
                // convert these to sets
                orgs[reasonChunk.id].css.add(file);
              }
            });
            // console.log("reasonChunk", reasonChunk);
            // orgs[chunk.id].add(`${module.id}-${module.rawRequest}`);
            // add the chunkID that depends on this module
            if (chunk.id) orgs[reasonChunk.id].js.add(chunk.id);
          });
        }
      });
    });

    // loop over everything and add the all other chunks a chunk depends on.
    // this creates a map telling us what a chunk needs and where to find it
    // chunks usually wont contain ALL the dependencies they need, so i need to make sure that i record what files contain dependencies
    // this chunk needs in order to be executed successfully
    Object.keys(orgs).forEach(key => {
      orgs[key].js.forEach(subSet => {
        if (orgs[subSet]) {
          orgs[subSet].js.delete(...map.ignoredChunk);
          // dont walk entry or runtime chunks
          if (!map.ignoredChunk.has(subSet)) {
            if (orgs[subSet].js.size) orgs[key].js.add(...orgs[subSet].js);
            if (orgs[subSet].css.size) orgs[key].css.add(...orgs[subSet].css);
          }
        }
      });
    });
  });
  console.log("internal map", map);
  console.log("internal org", orgs);
  // to ensure the chunk maps are complete, i run another loop over the chunks - the previous loop creates a complete map
  // this loop uses the completed map to write the chunk registration data into each chunk file
  chunks.forEach(chunk => {
    if (!chunk.rendered || map.ignoredChunk.has(chunk.id)) {
      return;
    }
    // loop over all files that make up this chunk
    // eslint-disable-next-line no-restricted-syntax
    for (const fileName of chunk.files) {
      // check that its a javascript file (might be an image, html, css)
      if (
        ModuleFilenameHelpers.matchObject({}, fileName) &&
        fileName.indexOf(".js") !== -1
      ) {
        try {
          // get all the chunksID's the current chunk might need
          const AllChunksNeeded = Array.from(orgs[chunk.id].js);
          // create the final map which contains an array of chunkID as well as a object of chunk of what each chunk needs
          const AllModulesNeeded = AllChunksNeeded.reduce(
            (allDependencies, dependentChunk) => {
              return {
                ...allDependencies,
                [dependentChunk]: {
                  js: [...new Set(map[dependentChunk].js)],
                  css: [...new Set(map[dependentChunk].css)]
                } // {"vendors-main":[modules], "somechunk": [modules]}
              };
            },
            {}
          );

          console.log("AllModulesNeeded", AllModulesNeeded);
          // now that we have maps of what the current file being iterated needs, write additional code to the file
          wrapFile(compilation, fileName, AllModulesNeeded, AllChunksNeeded);
        } catch (e) {
          console.error(e);
        }
      }
    }
  });
  // console.log(this.moduleHashMap);
}
