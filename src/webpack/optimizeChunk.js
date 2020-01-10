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
  const map = { ignoredChunk: new Set() };
  const orgs = {};
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

    if (chunk.hasEntryModule() || chunk.hasRuntime()) {
      map.ignoredChunk.add(chunk.id);
    }

    if (!chunk.rendered) {
      return;
    }
    chunk.getModules().forEach(module => {
      if (!Array.isArray(map[chunk.id])) {
        map[chunk.id] = [];
      }
      map[chunk.id].push(`${module.id}`);

      module.reasons.forEach(reason => {
        if (reason.module) {
          reason.module.chunksIterable.forEach(reasonChunk => {
            if (!orgs[reasonChunk.id]) {
              orgs[reasonChunk.id] = new Set();
            }

            // orgs[chunk.id].add(`${module.id}-${module.rawRequest}`);
            orgs[reasonChunk.id].add(chunk.id);
          });
        }
      });
    });

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
