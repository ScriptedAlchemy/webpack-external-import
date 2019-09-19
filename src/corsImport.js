import loadjs from 'loadjs';

const corsImport = (url) => {
  if(url) {
    return new Promise.resolve();
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
