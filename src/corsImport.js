import loadjs from 'loadjs';

const corsImport = (url) => {
  loadjs(url, url);

  return new Promise((resolve, reject) => {
    loadjs.ready(url, {
      success: resolve,
      error: reject,
    });
  });
};

export default corsImport;
