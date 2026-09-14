import { transform } from "sucrase";

const REACT_HOOKS = [
  "useState",
  "useEffect",
  "useMemo",
  "useCallback",
  "useRef",
  "useReducer",
  "useContext",
  "useLayoutEffect",
  "useTransition",
  "useDeferredValue",
  "useId",
  "useOptimistic",
  "useActionState",
  "useSyncExternalStore",
  "useInsertionEffect",
  "use",
  "Fragment",
  "createContext",
  "memo",
  "startTransition",
];

const BANNED = [
  { re: /\bfetch\s*\(/, message: "fetch is not allowed in notes examples." },
  { re: /\blocalStorage\b/, message: "localStorage is not allowed in notes examples." },
  { re: /\bsessionStorage\b/, message: "sessionStorage is not allowed in notes examples." },
  { re: /document\.cookie/, message: "document.cookie is not allowed in notes examples." },
  { re: /\bindexedDB\b/, message: "indexedDB is not allowed in notes examples." },
  { re: /\bXMLHttpRequest\b/, message: "XMLHttpRequest is not allowed in notes examples." },
  { re: /\beval\s*\(/, message: "eval is not allowed in notes examples." },
  { re: /\bFunction\s*\(/, message: "the Function constructor is not allowed in notes examples." },
  { re: /\bimport\s*\(/, message: "dynamic import() is not allowed in notes examples." },
];

function injectReactImport(source: string) {
  if (/from\s+['"]react['"]/.test(source) || /require\(\s*['"]react['"]\s*\)/.test(source)) {
    if (!/import\s+React[\s,{]/.test(source) && !/import\s+\*\s+as\s+React/.test(source)) {
      return `import React from "react";\n${source}`;
    }
    return source;
  }
  return `import React, { ${REACT_HOOKS.join(", ")} } from "react";\n${source}`;
}

function ensureDefaultExport(source: string) {
  if (/export\s+default\b/.test(source)) return source;
  const names: string[] = [];
  const re = /(?:export\s+)?(?:function|const|let|var)\s+([A-Z][A-Za-z0-9]*)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(source))) names.push(match[1]);
  const last = names.at(-1);
  if (!last) return source;
  return `${source}\nexport default ${last};\n`;
}

export function compileExample(source: string): string {
  for (const rule of BANNED) {
    if (rule.re.test(source)) throw new Error(rule.message);
  }

  const prepared = injectReactImport(ensureDefaultExport(source.trim()));
  const { code } = transform(prepared, {
    transforms: ["jsx", "imports"],
    jsxRuntime: "classic",
    production: true,
  });

  return `
var module = { exports: {} };
var exports = module.exports;
function require(name) {
  if (name === "react") return __React;
  throw new Error("Only the react package is available in notes examples.");
}
${code}
var __Comp = module.exports.default || module.exports.App || module.exports.Example || module.exports.Demo;
if (typeof __Comp !== "function") {
  var keys = Object.keys(module.exports);
  for (var i = 0; i < keys.length; i++) {
    if (typeof module.exports[keys[i]] === "function" && /^[A-Z]/.test(keys[i])) {
      __Comp = module.exports[keys[i]];
      break;
    }
  }
}
if (typeof __Comp !== "function") {
  throw new Error("Export a default component, or define a PascalCase function component.");
}
return __Comp;
`;
}
