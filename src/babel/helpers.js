import path from 'path';
import crc32 from 'crc-32';

export const doesReturnJSX = (node) => {
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


export const getTypesFromFilename = (
  t,
  { basename, filename },
) => {
  // ./{module name}/index.js
  const name = t.toBindingIdentifierName(
    basename === 'index' ?
      path.basename(path.dirname(filename)) :
      basename,
  );

  return {
    identifier: t.identifier(name),
    name,
  };
};


export const isWrappedComponentSet = (
  statement,
  displayName,
) => {
  const displayNameSetInExpr = (sibling) => {
    const expression = sibling.get('expression');
    const member = sibling.get('expression.left');
    return !!((
      expression.isAssignmentExpression() &&
      member.get('object')
        .isIdentifier({ name: `const ${displayName}` })
    ) || member.get('object')
      .isIdentifier({ name: `const ${displayName}` }));
  };

  for (let i = statement.container.length; i > -1; i -= 1) {
    const sibling = statement.getSibling(i);
    if (sibling.isExpressionStatement() && displayNameSetInExpr(sibling)) {
      return true;
    }
  }

  return false;
};


export const makeWrappedComponent = (t, displayName) =>
  t.expressionStatement(
    t.assignmentExpression(
      '=',
      t.identifier(`const ${displayName}`),
      t.identifier(`(props) => {
      const dispatch = _Remixx.useReduxDispatch();
       const { state, actions } = _Remixx.useRespond('__respond_pending_chunk_id__')
      return Wrapped${displayName}(props, state, _Remixx.bindActionCreators(dispatch, actions))
}`),
    ),
  );

export const resolveImport = (importName, file = '') => {
  if (importName.charAt(0) === '.') {
    return path.relative(process.cwd(), path.resolve(path.dirname(file), importName));
  }
  return importName;
};
