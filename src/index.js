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
  console.log(pathString, pathString.concat(''));
  return pathString.concat('');
};

export {
  corsImport,
  ExternalComponent,
};
