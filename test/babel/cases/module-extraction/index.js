import(/* importUrl */'http://localhost:3002/' + window.entryManifest['website-two']['hello-world.js']).then(({exportedModule}) => {
  exportedModule.externalFunction()
});
