'use-strict';

const validMagicStrings = [
  'webpackMode',
  // 'webpackMagicChunkName' gets dealt with current implementation & naming/renaming strategy
  'webpackInclude',
  'webpackExclude',
  'webpackIgnore',
  'webpackPreload',
  'webpackPrefetch'
];

import traverse from 'babel-traverse';

var protocolAndDomainRE = /^(?:\w+:)?\/\/(\S+)$/;

var localhostDomainRE = /^localhost[\:?\d]*(?:[^\:?\d]\S*)?$/;
var nonLocalhostDomainRE = /^[^\s\.]+\.\S{2,}$/;

function isUrl(string) {
  if (typeof string !== 'string') {
    return false;
  }

  var match = string.match(protocolAndDomainRE);
  if (!match) {
    return false;
  }

  var everythingAfterProtocol = match[1];
  if (!everythingAfterProtocol) {
    return false;
  }

  if (localhostDomainRE.test(everythingAfterProtocol) ||
    nonLocalhostDomainRE.test(everythingAfterProtocol)) {
    return true;
  }

  return false;
}

const {addDefault} = require('@babel/helper-module-imports');

const path = require('path');

const visited = Symbol('visited');

const IMPORT_UNIVERSAL_DEFAULT = {
  id: Symbol('scout'),
  source: 'webpack-external-import',
};

const IMPORT_PATH_DEFAULT = {
  id: Symbol('pathId'),
  source: 'path',
  nameHint: 'path'
};

function getImportArgPath(p) {
  return p.parentPath.get('arguments')[0];
}

function trimChunkNameBaseDir(baseDir) {
  return baseDir.replace(/^[./]+|(\.js$)/g, '');
}

function getImport(p, {source, nameHint}) {
  return addDefault(p, source, {nameHint});
}

function createTrimmedChunkName(t, importArgNode) {

  if (importArgNode.quasis) {
    let quasis = importArgNode.quasis.slice(0);
    const baseDir = trimChunkNameBaseDir(quasis[0].value.cooked);
    quasis[0] = Object.assign({}, quasis[0], {
      value: {
        raw: baseDir,
        cooked: baseDir
      }
    });

    quasis = quasis.map((quasi, i) => (i > 0 ? prepareQuasi(quasi) : quasi));

    return Object.assign({}, importArgNode, {
      quasis
    });
  }

  const moduleName = trimChunkNameBaseDir(importArgNode.value);
  return t.stringLiteral(moduleName);
}

function prepareQuasi(quasi) {
  return Object.assign({}, quasi, {
    value: {
      raw: quasi.value.cooked,
      cooked: quasi.value.cooked
    }
  });
}

function getMagicWebpackComments(importArgNode) {
  const {leadingComments} = importArgNode;
  const results = [];
  if (leadingComments && leadingComments.length) {
    leadingComments.forEach(comment => {
      try {
        const validMagicString = validMagicStrings.filter(str =>
          new RegExp(`${str}\\w*:`).test(comment.value)
        );
        // keep this comment if we found a match
        if (validMagicString && validMagicString.length === 1) {
          results.push(comment);
        }
      } catch (e) {
        // eat the error, but don't give up
      }
    });
  }
  return results;
}

function getMagicCommentChunkName(importArgNode) {
  const {quasis, expressions} = importArgNode;
  if (!quasis) return trimChunkNameBaseDir(importArgNode.value);

  const baseDir = quasis[0].value.cooked;
  const hasExpressions = expressions.length > 0;
  const chunkName = baseDir + (hasExpressions ? '[request]' : '');
  return trimChunkNameBaseDir(chunkName);
}

function getComponentId(t, importArgNode) {
  const {quasis, expressions} = importArgNode;
  if (!quasis) return importArgNode.value;

  return quasis.reduce((str, quasi, i) => {
    const q = quasi.value.cooked;
    const id = expressions[i] && expressions[i].name;
    str += id ? `${q}\${${id}}` : q;
    return str;
  }, '');
}

function existingMagicCommentChunkName(importArgNode) {
  const {leadingComments} = importArgNode;
  if (
    leadingComments &&
    leadingComments.length &&
    leadingComments[0].value.indexOf('importUrl') !== -1
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
  if (t.isBinaryExpression(importArgNode)) {
    return importArgNode;
  }

  const id = getComponentId(t, importArgNode);

  return t.stringLiteral(id);
}

function fileOption(t, p) {
  return t.objectProperty(
    t.identifier('file'),
    t.stringLiteral(
      path.relative(__dirname, p.hub.file.opts.filename || '') || ''
    )
  );
}

function loadOption(t, loadTemplate, p, importArgNode) {
  const argPath = getImportArgPath(p);
  const generatedChunkName = getMagicCommentChunkName(importArgNode);
  const otherValidMagicComments = getMagicWebpackComments(importArgNode);
  const existingChunkName = t.existingChunkName;
  const chunkName = existingChunkName || generatedChunkName;

  delete argPath.node.leadingComments;
  argPath.addComment('leading', ` webpackChunkName: '${chunkName}' `);
  otherValidMagicComments.forEach(validLeadingComment =>
    argPath.addComment('leading', validLeadingComment.value)
  );

  const load = loadTemplate({
    IMPORT: argPath.parent
  }).expression;

  return t.objectProperty(t.identifier('load'), load);
}

module.exports = function dynamicUrlImportPlugin(babel) {
  const t = babel.types;
  const importWhitelist = {};
  return {
    name: 'dynamic-url-imports',
    visitor: {
      Program: {
        enter: function (node, parent) {
          const comments = node.parent.comments || [];
          comments.forEach((comment) => {
            if (comment && comment.value) {
              const splitComment = comment.value.split(':');


              if (splitComment[0] === 'externalize') {
                const functionToExport = splitComment[1].trim();
                // props use this instead of module proto to actually export out the one single function
                const header =
                  `
                 
 
                `;


                node.pushContainer(
                  'body',
                  babel.parse(header).program.body[0]
                );
              }
            }
          });

        },
      },
      Identifier(p) {
        // only care about promise callbacks
        if (!p.isIdentifier({name: 'then'})) {
          return;
        }

        const parentPath = p.findParent((path) => path.isCallExpression());
        traverse(parentPath.node, {
          ArrowFunctionExpression(path) {
            const moduleMaps = new Set()
            if (path.isArrowFunctionExpression()) {
              if (path.node.params) {
                path.node.params.forEach(node => {
                  if (node.type === 'ObjectPattern') {
                    node.properties.forEach(property => {
                      if (!moduleMaps.has(property.key.name)) moduleMaps.add(property.key.name);
                    });
                    node.properties.length = 0;
                  }
                });
              }

              const injectedDepencency = Array.from(moduleMaps)
                .map(moduleName => {
                  return t.assignmentExpression(
                    '=',
                    t.identifier(`const ${moduleName}`),
                    t.identifier(`'lol'`),
                  );
                });
              path.get('body')
                .node
                .body
                .unshift(...injectedDepencency);

            }


          }
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

        if (importArgNode.value) Object.assign(importWhitelist, {[importArgNode.value]: null});


        const universalImport = getImport(p, IMPORT_UNIVERSAL_DEFAULT);
        // if being used in an await statement, return load() promise
        if (
          p.parentPath.parentPath.isYieldExpression() || // await transformed already
          t.isAwaitExpression(p.parentPath.parentPath.node) // await not transformed already
        ) {
          const func = t.callExpression(universalImport, [
            loadOption(t, loadTemplate, p, importArgNode).value,
            t.booleanLiteral(false)
          ]);

          p.parentPath.replaceWith(func);
          p.parentPath.node.isDynamic = true
          return;
        }

        const options = idOption(t, importArgNode);


        const func = t.callExpression(universalImport, [options]);
        delete t.existingChunkName;
        p.parentPath.replaceWith(func);
        p.parentPath.node.isDynamic = true
      }
    }
  };
};


