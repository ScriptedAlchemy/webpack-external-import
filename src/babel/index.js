import {
  doesReturnJSX,
  getTypesFromFilename,
  isWrappedComponentSet,
  makeWrappedComponent,
  resolveImport,
  encipherImport
} from './helpers';
import { addDefault } from '@babel/helper-module-imports';

const util = require('util');


const hasImports = {};
const visitedNodes = new Map();
const importMap = new Set();

const templateOptions = {
  placeholderPattern: /^([A-Z0-9]+)([A-Z0-9_]+)$/,
};

export default ({ types: t, template }) => {

  return {
    visitor: {
      // Program: {
      //   enter(programPath, { file }) {
      //
      //     programPath.traverse({
      //
      //       ImportDeclaration(path) {
      //         const { parentPath } = path;
      //         if (visitedNodes.has(parentPath.node)) {
      //           return;
      //         }
      //         const localFile = file.opts.filename;
      //         const newImport = path.node;
      //         const importName = path.node.source.value;
      //
      //
      //         if (!importName) {
      //           return;
      //         }
      //         const requiredFileHash = encipherImport(resolveImport(importName, localFile));
      //         let replace = null;
      //
      //         // hasImports[localFile] = true;
      //         visitedNodes.set(newImport, true);
      //         importMap.add(resolveImport(importName));
      //       }
      //     });
      //   },
      //
      //   exit({ node }, { file }) {
      //     console.log(importMap);
      //
      //     if (!hasImports[file.opts.filename]) return;
      //     node.body.unshift(t.expressionStatement(
      //       t.assignmentExpression(
      //         '=',
      //         t.identifier(`const fileMap`),
      //         t.identifier(`{[__filename]:map}`),
      //       )));
      //   }
      // },

      ExportDefaultDeclaration(
        path,
        { file: { opts } },
      ) {
        const node = path.get('declaration');
        const arrow = node.isArrowFunctionExpression();

        if (
          !node.isArrowFunctionExpression() &&
          !node.isFunctionDeclaration()
        ) {
          return;
        }

        if (!doesReturnJSX(node.get('body'))) {
          return;
        }

        const { name: functionName } = node.node.id || {};
        const { identifier, name } = arrow ?
          getTypesFromFilename(t, opts) :
          ({
            identifier: t.identifier(functionName),
            name: functionName,
          });

        // sets display name
        node.node.id = identifier;

        const { body, id, params } = node.node;
        // checks to see if we need to convert `export default function () {}`
        const init = arrow ?
          node.node :
          t.functionExpression(id, params, body);

        const variable = t.variableDeclaration('const', [
          t.variableDeclarator(identifier, init),
        ]);
        const assignment = isDisplayNameSet(path.getStatementParent(), name) ?
          undefined :
          makeDisplayName(t, name);
        const exporter = t.exportDefaultDeclaration(identifier);

        path.replaceWithMultiple([
          variable,
          assignment,
          exporter,
          // filter out possibly undefined assignment
        ].filter((replacement) => !!replacement));
      },
      JSXElement(path) {
        const { parentPath: parent } = path;

        // avoids traversing assigning jsx to variable
        if (!(parent.isReturnStatement() || parent.isArrowFunctionExpression())) {
          return;
        }

        const variable = path.find((node) =>
          node.isVariableDeclarator() || node.isExportDefaultDeclaration() ||
          node.isJSXExpressionContainer(),
        );

        // Ignore JSX elements inside JSX expression blocks
        if (t.isJSXExpressionContainer(variable)) {
          return;
        }

        const name = (() => {
          try {
            return variable.get('id.name').node;
          } catch (errr) {
            return undefined;
          }
        })();

        if (name) {
          variable.node.id.name = `Wrapped${name}`;
        }

        if (name == null) {
          return;
        }

        const statement = variable.getStatementParent();


        // check to make sure we don't set displayName when already set
        if (isWrappedComponentSet(statement, name)) {
          return;
        }

        statement.insertAfter(makeWrappedComponent(t, name));
      },
    },
  };
}
