const scout = require('scriptjs');

module.exports = async (url) => {
  const promise = await new Promise((resolve, reject) => {
    console.log('url to fetch', url);
    scout(url, url);
    scout.ready(url, function () {
      resolve(document.globalManifest);
    });
  });
  return promise;
};
