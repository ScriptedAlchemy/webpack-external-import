export function hasExternalizedModule(module) {
  // check original module source
  const moduleSource = module?.originalSource?.()?.source?.() || "";
  // check if module contains magic comment
  if (moduleSource?.indexOf("externalize") > -1) {
    return moduleSource;
  }
  return false;
}

export function interleaveConfig(test) {
  return {
    test(module) {
      // check if module has a resource path (not virtual modules)
      if (module.resource) {
        return (
          module.resource.includes(test) && !!hasExternalizedModule(module)
        );
      }
    },
    // eslint-disable-next-line no-unused-vars
    name(module, chunks, cacheGroupKey) {
      // Check if module is externalized
      const moduleSource = hasExternalizedModule(module);
      if (moduleSource) {
        // get externalize name from module source
        return moduleSource.match(/\/\*\s*externalize\s*:\s*(\S+)\s*\*\//)[1];
      }
    },
    // force module into a chunk regardless of how its used
    enforce: true

    // might need for next.js
    // reuseExistingChunk: false,
  };
}

