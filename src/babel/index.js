import {
  doesReturnJSX,
  getTypesFromFilename,
  isWrappedComponentSet,
  makeWrappedComponent,
} from './helpers';
import { addDefault } from "@babel/helper-module-imports";


export default ({ types: t }) => ({
  visitor: {
    Program(path,{file,opts}) {
      addDefault(path, 'remixx', {nameHint:'Remixx'});
    },
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
})
