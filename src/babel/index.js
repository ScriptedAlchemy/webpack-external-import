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

const { addDefault } = require('@babel/helper-module-imports');

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

function getImport(p, { source, nameHint }) {
  return addDefault(p, source, { nameHint });
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
  const { leadingComments } = importArgNode;
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
  const { quasis, expressions } = importArgNode;
  if (!quasis) return trimChunkNameBaseDir(importArgNode.value);

  const baseDir = quasis[0].value.cooked;
  const hasExpressions = expressions.length > 0;
  const chunkName = baseDir + (hasExpressions ? '[request]' : '');
  return trimChunkNameBaseDir(chunkName);
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
    leadingComments &&
    leadingComments.length &&
    leadingComments[0].value.indexOf('webpackChunkName') !== -1
  ) {
    try {
      return leadingComments[0].value
        .split('webpackChunkName:')[1]
        .replace(/["']/g, '')
        .trim();
    } catch (e) {
      return null;
    }
  }
  return null;
}

function idOption(t, importArgNode) {
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
  console.log(otherValidMagicComments);
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

function pathOption(t, pathTemplate, p, importArgNode) {
  const path = pathTemplate({
    PATH: getImport(p, IMPORT_PATH_DEFAULT),
    MODULE: importArgNode
  }).expression;

  return t.objectProperty(t.identifier('path'), path);
}

function resolveOption(t, resolveTemplate, importArgNode) {
  const resolve = resolveTemplate({
    MODULE: importArgNode
  }).expression;

  return t.objectProperty(t.identifier('resolve'), resolve);
}

function chunkNameOption(t, chunkNameTemplate, importArgNode) {
  const existingChunkName = t.existingChunkName;
  const generatedChunk = createTrimmedChunkName(t, importArgNode);
  const trimmedChunkName = existingChunkName
    ? t.stringLiteral(existingChunkName)
    : generatedChunk;

  const chunkName = chunkNameTemplate({
    MODULE: trimmedChunkName
  }).expression;

  return t.objectProperty(t.identifier('chunkName'), chunkName);
}


module.exports = function universalImportPlugin(babel) {
  const t = babel.types;
  return {
    name: 'universal-import',
    visitor: {
      Program: {
        enter: function (node, parent) {
          const comments = node.parent.comments || [];
          comments.forEach((comment) => {
            if (comment && comment.value) {
              const splitComment = comment.value.split(':');


              if (splitComment[0] === 'externalize') {
                const functionToExport = splitComment[1].trim();
                const header = `if (typeof document !== "undefined") { document.globalManifest = document.globalManifest || {}; document.globalManifest["${functionToExport}"] = ${functionToExport} }`;
                node.pushContainer(
                  'body',
                  babel.parse(header).program.body[0]
                );
              }
            }
          });

        },
      },
      // Program(p) {
      //   enter: {}

      // },
      Import(p) {
        if (p[visited]) return;
        p[visited] = true;

        const importArgNode = getImportArgPath(p).node;
        t.existingChunkName = existingMagicCommentChunkName(importArgNode);
        // no existing chunkname, no problem - we will reuse that for fixing nested chunk names
        if (!isUrl(importArgNode.value)) {
          return;
        }
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
          return;
        }

        const options = idOption(t, importArgNode);


        const func = t.callExpression(universalImport, [options]);
        delete t.existingChunkName;
        p.parentPath.replaceWith(func);
      }
    }
  };
};
