import traverse from 'babel-traverse';
import { addDefault } from '@babel/helper-module-imports';
import path from 'path';

const protocolAndDomainRE = /^(?:\w+:)?\/\/(\S+)$/;

const localhostDomainRE = /^localhost[\:?\d]*(?:[^\:?\d]\S*)?$/;
const nonLocalhostDomainRE = /^[^\s\.]+\.\S{2,}$/;

function isUrl(string) {
  if (typeof string !== 'string') {
    return false;
  }

  const match = string.match(protocolAndDomainRE);
  if (!match) {
    return false;
  }

  const everythingAfterProtocol = match[1];
  if (!everythingAfterProtocol) {
    return false;
  }

  if (localhostDomainRE.test(everythingAfterProtocol)
    || nonLocalhostDomainRE.test(everythingAfterProtocol)) {
    return true;
  }

  return false;
}

const visited = Symbol('visited');

const IMPORT_SCOUT_DEFAULT = {
  id: Symbol('scout'),
  source: 'webpack-external-import',
};


function getImportArgPath(p) {
  return p.parentPath.get('arguments')[0];
}

function getImport(p, { source, nameHint }) {
  return addDefault(p, source, { nameHint });
}

function getComponentId(t, importArgNode) {
  const { quasis, expressions } = importArgNode;
  if (!quasis) return importArgNode.value;

  return quasis.reduce((str, quasi, i) => {
    const q = quasi.value.cooked;
    const id = expressions[i] && expressions[i].name;
    str += id ? `${q}\${${id}}` : q;
    return str;
  }, '');
}

function existingMagicCommentChunkName(importArgNode) {
  const { leadingComments } = importArgNode;
  if (
    leadingComments
    && leadingComments.length
    && leadingComments[0].value.indexOf('importUrl') !== -1
  ) {
    try {
      return leadingComments[0].value.trim();
    } catch (e) {
      return null;
    }
  }
  return null;
}

function idOption(t, importArgNode) {
  // if its an expression, then pass it through
  if (t.isIdentifier(importArgNode)) {
    return importArgNode;
  }
  if (t.isBinaryExpression(importArgNode)) {
    return importArgNode;
  }

  const id = getComponentId(t, importArgNode);

  return t.stringLiteral(id);
}

// keeping this around for now. Might be useful for internal file mappings.
// eslint-disable-next-line no-unused-vars
function fileOption(t, p) {
  return t.objectProperty(
    t.identifier('file'),
    t.stringLiteral(
      path.relative(__dirname, p.hub.file.opts.filename || '') || '',
    ),
  );
}


module.exports = function dynamicUrlImportPlugin(babel) {
  const t = babel.types;
  const importWhitelist = {};
  return {
    name: 'dynamic-url-imports',
    visitor: {
      Identifier(p) {
        // only care about promise callbacks
        if (!p.isIdentifier({ name: 'then' })) {
          return;
        }
        if (!p.parent || !p.parent.object || !p.parent.object.isDynamic) {
          return;
        }

        const parentPath = p.findParent(path => path.isCallExpression());
        traverse(parentPath.node, {
          ArrowFunctionExpression(path) {
            const moduleMaps = new Set();
            if (path.isArrowFunctionExpression()) {
              if (path.node.params) {
                path.node.params.forEach((node) => {
                  if (node.type === 'ObjectPattern') {
                    node.properties.forEach((property) => {
                      if (!moduleMaps.has(property.key.name)) moduleMaps.add(property.key.name);
                    });
                    node.properties.length = 0;
                  }
                });
              }

              const injectedDepencency = Array.from(moduleMaps)
                .map(moduleName => t.assignmentExpression(
                  '=',
                  t.identifier(`const ${moduleName}`),
                  t.identifier(`__webpack_require__("${moduleName}")`),
                ));
              try {
                path.get('body')
                  .node
                  .body
                  .unshift(...injectedDepencency);
              } catch (e) {
                // something is going wrong here. We need to make sure bad promises are not transformed
              }
            }
          },
        }, parentPath.scope);
      },

      Import(p) {
        if (p[visited]) return;
        p[visited] = true;

        const importArgNode = getImportArgPath(p).node;
        t.existingChunkName = existingMagicCommentChunkName(importArgNode);
        // no existing chunkname, no problem - we will reuse that for fixing nested chunk names


        if (importArgNode.value && !isUrl(importArgNode.value)) return;
        if (!importArgNode.value && t.existingChunkName !== 'importUrl') return;

        if (importArgNode.value) Object.assign(importWhitelist, { [importArgNode.value]: null });


        const universalImport = getImport(p, IMPORT_SCOUT_DEFAULT);
        // if being used in an await statement, return load() promise
        if (
          p.parentPath.parentPath.isYieldExpression() // await transformed already
          || t.isAwaitExpression(p.parentPath.parentPath.node) // await not transformed already
        ) {
          // need to verify async/await works
          // eslint-disable-next-line no-param-reassign
          p.parentPath.node.isDynamic = true;
          return;
        }

        const options = idOption(t, importArgNode);

        // add scout to the Program
        const func = t.callExpression(universalImport, [options]);
        delete t.existingChunkName;
        p.parentPath.replaceWith(func);
        p.parentPath.node.isDynamic = true;
      },
    },
  };
};
