if ((typeof process !== 'undefined')) {
} else if (!window.import) {
  window.import = require('dimport/legacy');
}
