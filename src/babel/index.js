function babelPlugin() {
  return {
    visitor: {
      // eslint-disable-next-line
      Program: function Program(path, { opts }) {
        // remixx magic
      },
    },
  };
}

export default babelPlugin;
