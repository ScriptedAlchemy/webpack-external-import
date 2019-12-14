import urljoin from 'url-join';
import corsImport from './corsImport';
import ExternalComponent from './react';

export const getChunkPath = (basePath, nameSpace, module) => {
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
  return urljoin(pathString);
};


export const getChunkDependencies = (basePath, nameSpace, module) => {
  if (!window.entryManifest) return;
  if (!nameSpace) return;
  if (!window.entryManifest[nameSpace]) return;
  const dependencyPaths = [];
  if (window?.entryManifest[nameSpace]
      && window?.entryManifest[nameSpace][module]
      && window?.entryManifest[nameSpace][module].dependencies) {
    window.entryManifest[nameSpace][module].dependencies.forEach((file) => {
      if (!__webpack_modules__[file.id]) {
        file.sourceFiles.forEach((chunkFile) => dependencyPaths.push(basePath + chunkFile));
      }
    });
  } else if (window?.entryManifest[nameSpace]
      && window?.entryManifest[nameSpace][`${module}.js`]
      && window?.entryManifest[nameSpace][`${module}.js`].dependencies) {
    window.entryManifest[nameSpace][`${module}.js`].dependencies.forEach((file) => {
      if (!__webpack_modules__[file.id]) {
        file.sourceFiles.forEach((chunkFile) => dependencyPaths.push(urljoin(basePath, chunkFile)));
      }
    });
  }
  return Array.from(new Set(dependencyPaths));
};

function getInSequence(array, asyncFunc) {
  return array.reduce((previous, current) => (
    previous.then((accumulator) => (
      asyncFunc(current).then((result) => accumulator.concat(result))
    ))
  ), Promise.resolve([]));
}

export const importWithDependencies = (basePath, nameSpace, module) => {
  if (!window.entryManifest) return;
  if (!nameSpace) return;
  if (!window.entryManifest[nameSpace]) return;


  return getInSequence(getChunkDependencies(basePath, nameSpace, module), corsImport).then(() => corsImport(getChunkPath(basePath, nameSpace, module)));

  // window.entryManifest[nameSpace][module]
  // console.log('import with deps:')
};


export const importDependenciesOf = (basePath, nameSpace, module) => {
  if (!window.entryManifest) return;
  if (!nameSpace) return;
  if (!window.entryManifest[nameSpace]) return;


  return getInSequence(getChunkDependencies(basePath, nameSpace, module), corsImport).then(() => getChunkPath(basePath, nameSpace, module));

  // window.entryManifest[nameSpace][module]
  // console.log('import with deps:')
};

export {
  corsImport,
  ExternalComponent,
};
