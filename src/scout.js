const scout = require('scriptjs');

module.exports = url => new Promise((resolve, reject) => {
  scout(url, url);

  scout.ready(url, () => {
    console.log('url to fetch', url);
    if (typeof document !== 'undefined') {
      document.__webpack_modules__ = document.__webpack_modules__ || {};
      Object.assign(document.__webpack_modules__, __webpack_modules__);
      Object.assign(__webpack_modules__, document.__webpack_modules__);
    }
    resolve(__webpack_modules__);
  });
});
