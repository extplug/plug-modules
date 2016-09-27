const fs = require('fs');
const p = require('path');
const parse = require('babylon').parse;
const generate = require('babel-generator').default;
const traverse = require('babel-traverse').default;
const t = require('babel-types');
const mkdirp = require('mkdirp').sync;

const inputPath = require.resolve('../src/plugModules.js');
const contextPath = require.resolve('../src/plug/_contextRequire');
const basePath = p.dirname(inputPath);

function addJSExt(name) {
  return /\.js$/.test(name) ? name : `${name}.js`;
}

function read() {
  return fs.readFileSync(inputPath, 'utf8');
}

/**
 * Get matcher dependencies, if any.
 * Rewrite `depends()` calls to imports.
 */
function getDependencies(matcher, importingPath) {
  const deps = [];
  const imported = {};
  matcher.traverse({
    Identifier(path) {
      const binding = path.scope.getBinding(path.node.name);
      if (!binding || !binding.path || imported[path.node.name]) {
        return;
      }
      const importDecl = binding.path.parentPath;
      if (importDecl.isImportDeclaration()) {
        const importPath = p.relative(
          importingPath,
          p.join(basePath, importDecl.get('source').node.value)
        );
        deps.push(t.importDeclaration(
          [binding.path.node],
          t.stringLiteral(importPath)
        ));
        imported[path.node.name] = true;
      }
    }
  });
  // Rewrite `depends()` calls to ES6 imports
  if (matcher.get('callee').isIdentifier({ name: 'depends' })) {
    const params = [];
    matcher.get('arguments.0.elements').forEach((path, i) => {
      const importPath = p.relative(
        importingPath,
        p.join(basePath, path.node.value)
      );
      const depId = path.scope.generateUidIdentifier();
      deps.push(t.importDeclaration(
        [t.importDefaultSpecifier(depId)],
        t.stringLiteral(importPath)
      ));
      params.push(depId);
    });
    matcher.replaceWith(t.callExpression(
      matcher.get('arguments.1').node,
      params
    ));
  }
  return deps;
}

/**
 * Extract every module matcher from plugModules.js into its own file. Each file
 * will return its module from the default context (`require.s.contexts._`).
 */
function extract() {
  const ast = parse(read(), {
    sourceType: 'module',
  });
  const files = {};
  traverse(ast, {
    ExportDeclaration(path) {
      const properties = path.get('declaration.properties');
      properties.forEach((property) => {
        const plugModuleName = property.get('key').node.value;
        const pathname = addJSExt(plugModuleName);
        const currentDir = p.dirname(p.join(basePath, pathname));
        const matcher = property.get('value');
        const deps = getDependencies(matcher, currentDir);
        files[pathname] = t.program(deps.concat([
          t.importDeclaration(
            [t.importDefaultSpecifier(t.identifier('contextRequire'))],
            t.stringLiteral(p.relative(currentDir, contextPath))
          ),
          t.exportDefaultDeclaration(t.callExpression(
            t.identifier('contextRequire'),
            [t.stringLiteral(plugModuleName), matcher.node]
          ))
        ]));
      });
      path.stop();
    },
  });
  for (const pathname in files) {
    const code = generate(files[pathname]).code;
    const fullPath = p.join(basePath, pathname);
    mkdirp(p.dirname(fullPath));
    fs.writeFileSync(fullPath, code);
  }
  return files;
}

module.exports = extract;
