import { getInterleaveConfig } from "./utils";

export const generateChunkIds = (chunks, namespace) => {
  const interleaveConfig = getInterleaveConfig()
  let count = 0;
  const interleaveGroupSet = interleaveConfig ? new Set(...Object.values(interleaveConfig));

  chunks.forEach(chunk => {
    const chunkId = count;
    if (interleaveGroupSet.has(chunk.id) || interleaveGroupSet.has(chunk.name)) {
      return;
    }

    chunk.id = `${namespace}-${chunkId}`;
    count++;
  });
};
