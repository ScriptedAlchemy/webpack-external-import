/* eslint-disable no-underscore-dangle */
const scout = require('scriptjs');

// scriptjs is a quick and dirty solution to loading a script.
// I need to dig back into webpack to locate the internal async loading functions
// this should leverage the same mechanism import() and require.ensure depend on

module.exports = url => new Promise((resolve, reject) => {
  scout(url, url);

  scout.ready(url, () => {
    if (typeof document !== 'undefined') {
      document.__webpack_modules__ = document.__webpack_modules__ || {};
      Object.assign(document.__webpack_modules__, __webpack_modules__);
      Object.assign(__webpack_modules__, document.__webpack_modules__);
    }
    resolve(__webpack_modules__);
  });
});
