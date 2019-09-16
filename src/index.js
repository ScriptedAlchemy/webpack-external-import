import corsImport from './corsImport';
import ExternalComponent from './react';

export const getChunkPath = (basePath, nameSpace, module) => {
  console.log(window.entryManifest, nameSpace, module);
  if (!window.entryManifest) return;
  if (!nameSpace) return;
  if (!window.entryManifest[nameSpace]) return;
  let pathString = [];
  if (window?.entryManifest[nameSpace]
    && window?.entryManifest[nameSpace][module]
    && window?.entryManifest[nameSpace][module].path) {
    pathString = [basePath, window.entryManifest[nameSpace][module].path];
  } else if (window?.entryManifest[nameSpace]
    && window?.entryManifest[nameSpace][`${module}.js`]
    && window?.entryManifest[nameSpace][`${module}.js`].path) {
    pathString = [basePath, window.entryManifest[nameSpace][`${module}.js`].path];
  }

  return pathString.join('');
};


export const getChunkDependencies = (basePath, nameSpace, module) => {
  if (!window.entryManifest) return;
  if (!nameSpace) return;
  if (!window.entryManifest[nameSpace]) return;
  const pathString = [];
  if (window?.entryManifest[nameSpace]
      && window?.entryManifest[nameSpace][module]
      && window?.entryManifest[nameSpace][module].dependencies) {
    window.entryManifest[nameSpace][module].dependencies.forEach((file) => {
      if (!__webpack_modules__[file.id]) {
        pathString.concat(
          file.sourceFiles.map(chunkFile => basePath + window?.entryManifest[nameSpace][chunkFile].path),
        );
        console.log(pathString);
      }
    });
  } else if (window?.entryManifest[nameSpace]
      && window?.entryManifest[nameSpace][`${module}.js`]
      && window?.entryManifest[nameSpace][`${module}.js`].dependencies) {
    window.entryManifest[nameSpace][`${module}.js`].dependencies.forEach((file) => {
      if (!__webpack_modules__[file.id]) {
        pathString.concat(
          file.sourceFiles.map(path => basePath + path),
        );
      }
    });
  }
  return pathString;

  return pathString;
};
export {
  corsImport,
  ExternalComponent,
};
