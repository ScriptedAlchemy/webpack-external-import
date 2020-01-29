// eslint-disable-next-line import/prefer-default-export
export function addLocalVars(source, chunk, compilationHash) {
  return [
    source,
    "",
    "// object to store interleaved JavaScript chunks",
    "var interleaveMap = {};",
    "// object to store interleaved CSS chunks",
    "var interleavedCssChunks = {}",
    `var compilationHash = '${compilationHash}'`
  ].join("\n");
}
