import loadjs from 'loadjs';

const corsImport = (url) => {
  if (!url) {
    return new Promise((resolve, reject) => reject('no url in corsImport'));
  }
  loadjs(url, url);

  return new Promise((resolve, reject) => {
    loadjs.ready(url, {
      success: resolve,
      error: reject,
    });
  });
};

export default corsImport;
