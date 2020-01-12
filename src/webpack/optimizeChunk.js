const ModuleFilenameHelpers = require("webpack/lib/ModuleFilenameHelpers");
const { ConcatSource } = require("webpack-sources");

function wrapFile(compilation, fileName, allModulesNeeded, chunkKeys) {
  const pushArguments = JSON.stringify([
    // pass the source compilation hash to figure out if a chunk is being required by its own build - if so, dont register anything
    compilation.hash,
    chunkKeys,
    allModulesNeeded
  ]);
  // write source to the top of the file
  compilation.assets[fileName] = new ConcatSource(
    String(
      `(window["webpackRegister"] = window["webpackRegister"] || []).push(${pushArguments});\n`
    ),
    compilation.assets[fileName]
  );
}

export function wrapChunks(compilation, chunks, moduleHashMap) {
  // create a maps
  const map = { ignoredChunk: new Set() };
  const orgs = {};
  // loop over each chunk
  chunks.forEach(chunk => {
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
    }

    // dont run if this has already been done on the chunk
    if (!chunk.rendered) {
      return;
    }
    // get all the modules in a chunk and loop over them
    chunk.getModules().forEach(module => {
      // add the chunk ID as a key and create an empty array if one isnt there already
      if (!Array.isArray(map[chunk.id])) {
        map[chunk.id] = [];
      }
      // push each module in a chunk into its array within the map
      map[chunk.id].push(`${module.id}`);

      // check the reason a chunk exists, this is an array which returns any and all modules that depend on the current module
      module.reasons.forEach(reason => {
        if (reason.module) {
          // if theres a module, loop over the chunks this module is in
          reason.module.chunksIterable.forEach(reasonChunk => {
            // add the chunkID of where this module exists
            if (!orgs[reasonChunk.id]) {
              orgs[reasonChunk.id] = new Set();
            }

            // orgs[chunk.id].add(`${module.id}-${module.rawRequest}`);
            // add the chunkID that depends on this module
            orgs[reasonChunk.id].add(chunk.id);
          });
        }
      });
    });

    // loop over everything and add the all other chunks a chunk depends on.
    // this creates a map telling us what a chunk needs and where to find it
    // chunks usually wont contain ALL the dependencies they need, so i need to make sure that i record what files contain dependencies
    // this chunk needs in order to be executed successfully
    Object.keys(orgs).forEach(key => {
      Array.from(orgs[key]).forEach(subSet => {
        if (orgs[subSet]) {
          orgs[subSet].delete(...map.ignoredChunk);
          // dont walk entry module
          if (!map.ignoredChunk.has(subSet)) {
            orgs[key].add(...orgs[subSet]);
          }
        }
      });
    });

    const chunkMap = Array.from(chunk.modulesIterable).reduce((acc, module) => {
      acc[module.id] =
        module.name || module.userRequest || module.rawRequest || module.id;
      return acc;
    }, {});
    moduleHashMap = { ...moduleHashMap, [chunk.id]: chunkMap };
    // delete this
    // for (const fileName of chunk.files) {
    //   if (
    //     ModuleFilenameHelpers.matchObject({}, fileName) &&
    //     fileName.indexOf(".js") !== -1
    //   ) {
    //     console.log(`#####${chunk.id}###`);
    //     wrapFile(compilation, fileName, map[chunk.id], orgs[chunk.id]);
    //   }
    // }
  });
  chunks.forEach(chunk => {
    if (!chunk.rendered || map.ignoredChunk.has(chunk.id)) {
      return;
    }

    for (const fileName of chunk.files) {
      if (
        ModuleFilenameHelpers.matchObject({}, fileName) &&
        fileName.indexOf(".js") !== -1
      ) {
        const AllChunksNeeded = Array.from(orgs[chunk.id]);
        const AllModulesNeeded = AllChunksNeeded.reduce(
          (allDependencies, dependentChunk) => {
            return {
              ...allDependencies,
              [dependentChunk]: [...new Set(map[dependentChunk])]
            };
          },
          {}
        );
        wrapFile(compilation, fileName, AllModulesNeeded, AllChunksNeeded);
      }
    }
  });
  // console.log(this.moduleHashMap);
}
