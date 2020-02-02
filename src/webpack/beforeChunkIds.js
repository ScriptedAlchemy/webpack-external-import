import { getInterleaveConfig } from "./utils";

export const generateChunkIds = (chunks, namespace) => {
  const interleaveConfig = getInterleaveConfig();
  let count = 0;
  const interleaveGroupSet = interleaveConfig
    ? new Set(Object.values(interleaveConfig))
    : null;
  chunks.forEach(chunk => {
    console.log(chunk.name, chunk.id);
    const chunkId = count;
    if (
      interleaveGroupSet &&
      (interleaveGroupSet.has(chunk.id) || interleaveGroupSet.has(chunk.name))
    ) {
      chunk.id = module.id
      return;
    }

    chunk.id = `${namespace}-${chunkId}`;
    count++;
  });
};
