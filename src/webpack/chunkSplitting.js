export const hasExternalizedModuleViaJson = (
  moduleResource,
  manifestName,
  interleave
) => {
  if (!moduleResource || !interleave) return;

  const interleaveKeys = Object.keys(interleave);

  if (interleaveKeys) {
    const foundMatch = interleaveKeys.find(item =>
      moduleResource.includes(item)
    );
    return interleave[foundMatch] || false;
  }
};

export const hasExternalizedModuleViaJson2 = (
  moduleResource,
  manifestName,
  interleave
) => {
  if (!moduleResource || !interleave) return;
  const interleaveKeys = Object.keys(interleave);

  if (interleaveKeys) {
    const foundMatch = interleaveKeys.find(item => {
      return moduleResource.includes(item);
    });
    return interleave[foundMatch] || false;
  }
};

export function interleaveConfig({ testPath, manifestName, interleave }) {
  return {
    test(module) {
      // check if module has a resource path (not virtual modules)
      if (module.resource) {
        return (
          module.resource.includes(testPath) &&
          !!hasExternalizedModuleViaJson2(
            module.resource,
            manifestName,
            interleave
          )
        );
      }
    },
    name(module) {
      // Check if module is listed in the interleave interface
      const foundValue = hasExternalizedModuleViaJson2(
        module.resource,
        manifestName,
        interleave
      );

      if (foundValue) return foundValue;
      return false;
    },
    // force module into a chunk regardless of how its used
    enforce: true

    // might need for next.js
    // reuseExistingChunk: false,
  };
}

export function interleaveStyleConfig({ manifestName, interleave }) {
  return {
    test(module) {
      // check if module has a resource path (not virtual modules)
      if (module.constructor.name === "CssModule") {
        console.log("HAS MODULE CSS");
        return !!hasExternalizedModuleViaJson2(
          module.identifier(),
          manifestName,
          interleave
        );
      }
      // if (module.resource) {
      //   if (module.resource.includes(".css")) {
      //     console.log(
      //       "CSS",
      //       module.resource.includes(testPath),
      //       !!hasExternalizedModuleViaJson2(module.resource, manifestName),
      //       module.resource
      //     );
      //     return (
      //       module.resource.includes(testPath) &&
      //       !!hasExternalizedModuleViaJson2(module.resource, manifestName)
      //     );
      //   }
      // }
    },
    // eslint-disable-next-line no-unused-vars
    name(module, chunks, cacheGroupKey) {
      // Check if module is listed in the interleave interface
      if (!module.resource) {
        const foundValue = hasExternalizedModuleViaJson2(
          module.resource || module.identifier(),
          manifestName,
          interleave
        );

        if (foundValue) return `${foundValue}-style`;
      }

      return "styles";
    },
    // force module into a chunk regardless of how its used
    enforce: true,
    chunks: "all",
    // might need for next.js
    reuseExistingChunk: false
  };
}
export function interleaveStyleJsConfig({ manifestName }) {
  return {
    test(module) {
      if (module.constructor.name === "CssModule") {
        return false;
      }
      if (module.resource && module.resource.match(/\.(scss|css)$/)) {
        return true;
      }
      return false;
    },
    name() {
      return `${manifestName}-stylejs`;
    },
    chunks: "all",
    enforce: false
  };
}
