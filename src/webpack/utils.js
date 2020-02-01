export const getInterleaveConfig = () => {
  const pkgUp = require("pkg-up").sync();

  let packageJson;
  if (pkgUp) {
    // eslint-disable-next-line import/no-dynamic-require
    packageJson = require(pkgUp);
  }

  return packageJson.interleave || null;
};
/* eslint-disable no-param-reassign */
export function mergeDeep(...objects) {
  const isObject = obj => obj && typeof obj === "object";

  return objects.reduce((prev, obj) => {
    Object.keys(obj).forEach(key => {
      const pVal = prev[key];
      const oVal = obj[key];

      if (Array.isArray(pVal) && Array.isArray(oVal)) {
        prev[key] = pVal.concat(...oVal);
      } else if (isObject(pVal) && isObject(oVal)) {
        prev[key] = mergeDeep(pVal, oVal);
      } else {
        prev[key] = oVal;
      }
    });

    return prev;
  }, {});
}
/* eslint-enable no-param-reassign */

// TODO: delete this function in V2
export function removeNull() {
  let nullCount = 0;
  let { length } = this;
  for (let i = 0, len = this.length; i < len; i++) {
    if (!this[i]) {
      nullCount++;
    }
  }
  // no item is null
  if (!nullCount) {
    return this;
  }
  // all items are null
  if (nullCount === length) {
    this.length = 0;
    return this;
  }
  // mix of null // non-null
  let idest = 0;
  let isrc = length - 1;
  length -= nullCount;
  while (nullCount) {
    while (!this[isrc]) {
      isrc--;
      nullCount--;
    } // find a non null (source) slot on the right
    if (!nullCount) {
      break;
    } // break if found all null
    while (this[idest]) {
      idest++;
    } // find one null slot on the left (destination)
    // perform copy
    this[idest] = this[isrc];
    if (!--nullCount) {
      break;
    }
    idest++;
    isrc--;
  }
  this.length = length;
  return this;
}
// eslint-disable-next-line no-extend-native
Object.defineProperty(Array.prototype, "removeNull", {
  value: removeNull,
  writable: true,
  configurable: true
});
