import { getInterleaveConfig } from "./utils";

export const generateChunkIds = (chunks, namespace) => {
  const interleaveConfig = getInterleaveConfig();
  let count = 0;
  const interleaveGroupSet = interleaveConfig
    ? new Set(Object.values(interleaveConfig))
    : null;
  console.log("generateChunkIds", chunks);
  chunks.forEach(chunk => {
    const chunkId = count;
    if (
      interleaveGroupSet &&
      (interleaveGroupSet.has(chunk.id) || interleaveGroupSet.has(chunk.name))
    ) {
      if (
        interleaveGroupSet.has(`${chunk.id}-stylejs`) ||
        interleaveGroupSet.has(`${chunk.name}-stylejs`)
      ) {
        chunk.id = `${chunk.name}-stylejs`;
        return;
      }
      console.log("generateChunkIds", chunk);
      chunk.id = chunk.name;
    }
    chunk.id = `${namespace}-${chunk.name || chunk.id}`;
    count++;
  });
  return false;
};
