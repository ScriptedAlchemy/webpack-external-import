// eslint-disable-next-line import/prefer-default-export
export function addLocalVars(source, chunk, compilationHash) {
  return [
    source,
    "// interleaving map",
    "var interleaveMap = {};",
    `var compilationHash = '${compilationHash}'`
  ].join("\n");
}
