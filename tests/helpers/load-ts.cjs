/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node test runner. */
const fs = require("node:fs");
const path = require("node:path");
const { createRequire } = require("node:module");
const vm = require("node:vm");
const ts = require("typescript");

const root = path.resolve(__dirname, "../..");
function loadTs(relativePath, mocks = {}) {
  const filename = path.join(root, relativePath);
  const isTsx = filename.endsWith(".tsx");
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
      jsx: isTsx ? ts.JsxEmit.ReactJSX : ts.JsxEmit.None,
    },
    fileName: filename,
  }).outputText;
  const nativeRequire = createRequire(filename);
  const localRequire = (id) => {
    if (Object.hasOwn(mocks, id)) return mocks[id];
    if (id.startsWith("@/")) {
      const rel = id.slice(2);
      const targetRel = fs.existsSync(path.join(root, `${rel}.tsx`)) ? `${rel}.tsx` : `${rel}.ts`;
      return loadTs(targetRel, mocks);
    }
    return nativeRequire(id);
  };
  const loaded = { exports: {} };
  vm.runInThisContext(`(function(require, module, exports) { ${source}\n})`, { filename })(localRequire, loaded, loaded.exports);
  return loaded.exports;
}
module.exports = { loadTs };
