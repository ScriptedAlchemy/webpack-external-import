const scout = require('scriptjs');

module.exports = async (url) => {
  const promise = await new Promise((resolve, reject) => {
    console.log('url to fetch', url);
    scout(url, url);
    scout.ready(url, function () {
       if (typeof document !== "undefined") { document.__webpack_modules__ = document.__webpack_modules__ || {};
                 Object.assign(document.__webpack_modules__,__webpack_modules__ )
                 Object.assign(__webpack_modules__,document.__webpack_modules__ )
                }
      resolve(__webpack_modules__);
    });
  });
  return promise;
};
