const scout = require('scriptjs');

const diff = (obj,obj2)=> Object.keys(obj).reduce((diff, key) => {
  if (obj[key] === obj2[key]) return diff
  return {
    ...diff,
    [key]: obj2[key]
  }
}, {})

const initialModules = new Set()

module.exports = async (url) => {
  const promise = await new Promise((resolve, reject) => {
    scout(url, url);

    scout.ready(url, function () {
      console.log('url to fetch', url);
      if (typeof document !== "undefined") {
        document.__webpack_modules__ = document.__webpack_modules__ || {};
        Object.assign(document.__webpack_modules__, __webpack_modules__)
        Object.assign(__webpack_modules__, document.__webpack_modules__)
      }
      resolve(__webpack_modules__);
    });
  });
  return promise;
};
