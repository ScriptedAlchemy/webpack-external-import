import template from 'babel-template';

const util = require('util');

function generateTemplate(className) {
  return template(`
    const state = useReduxState();
    const dispatch = useReduxDispatch();
`)();
}

function testPlugin(babel) {
  return {
    visitor: {
      JSXElement(path, opts) {
        if (!path.findParent((path) => path.isClassMethod())) {
          const returnParent = path.findParent((path) => path.isBlockStatement());
          if (returnParent) {
            returnParent.getFunctionParent()
              .get('body')
              .unshiftContainer('body', generateTemplate());
          }
        }
      },
      ClassMethod(path, opts) {
        //console.log(util.inspect(opts))
        if (opts.filename && !!~opts.filename.indexOf('node_modules')) {
          return;
        }

        if (path.node.key && path.node.key.name === 'render') {
          const classPath = path.findParent(path => path.isClassDeclaration());
          if (
            classPath.node.superClass &&
            classPath.node.superClass.type === 'Identifier' &&
            classPath.node.superClass.name === 'Component'
          ) {

            path
              .get('body')
              .unshiftContainer('body', generateTemplate());
          }
        }
      },
      FunctionExpression(path, opts) {
        if (opts.filename && !!~opts.filename.indexOf('node_modules')) {
          return;
        }

        if (path.node.id && path.node.id.name === 'render') {
          const pathLocation = path.getPathLocation();
          const callExpressionPath = path.findParent(path =>
            path.isCallExpression()
          );
          if (!callExpressionPath) {
            return;
          }

          path
            .get('body')
            .unshiftContainer('body', generateTemplate());
        }
      }
    }
  };
};

export default testPlugin;
