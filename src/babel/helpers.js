const doesReturnJSX = (node) => {
  if (node.isJSXElement()) {
    return true;
  }

  if (node.isReturnStatement()) {
    return doesReturnJSX(node.get('argument'));
  }

  if (node.isBlockStatement()) {
    const block = [...node.get('body')].pop();

    if (block.isReturnStatement()) {
      return doesReturnJSX(block.get('argument'));
    }

    if (block.isIfStatement()) {
      const alternate = block.get('alternate');
      const consequent = block.get('consequent');

      return [alternate, consequent].reduce(
        (jsx, branch) => {
          if (jsx) {
            return jsx;
          }

          return doesReturnJSX(branch);
        },
        false,
      );
    }
  }

  return false;
};

export default doesReturnJSX;
