import pluginJs from "@eslint/js";
import noBarrelFiles from "eslint-plugin-no-barrel-files";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";
import tseslint from "typescript-eslint";

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"] },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      // ===========================
      // TYPESCRIPT CONFIGURATION
      // ===========================
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          vars: "all",
          args: "after-used",
          ignoreRestSiblings: true,
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],

      // ===========================
      // TYPESCRIPT TYPE SAFETY
      // ===========================
      "@typescript-eslint/no-non-null-assertion": "error", // Prevent ! operator misuse
      "@typescript-eslint/prefer-nullish-coalescing": "error", // Use ?? instead of ||
      "@typescript-eslint/no-floating-promises": "error", // Require awaiting/handling promises
      "@typescript-eslint/await-thenable": "error", // Only await thenable values
      "@typescript-eslint/no-misused-promises": "error", // Prevent async in wrong contexts
      "@typescript-eslint/require-await": "error", // Ensure async functions use await

      // ===========================
      // TYPESCRIPT CODE STYLE
      // ===========================
      "@typescript-eslint/no-unnecessary-type-assertion": "warn",
      "@typescript-eslint/prefer-optional-chain": "warn", // Use ?. operator
      "@typescript-eslint/prefer-string-starts-ends-with": "warn",
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports" },
      ],
      "@typescript-eslint/consistent-type-definitions": ["warn", "interface"],

      // ===========================
      // REACT CONFIGURATION
      // ===========================
      "react/react-in-jsx-scope": "off",

      // ===========================
      // REACT HOOKS
      // ===========================
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn", // Ensure useEffect dependencies are correct

      // ===========================
      // REACT BEST PRACTICES
      // ===========================
      "react/jsx-no-leaked-render": "warn", // Prevent {condition && <Component />} bugs
      "react/self-closing-comp": "warn", // Use self-closing tags when possible
      "react/jsx-boolean-value": "warn", // Consistent boolean prop syntax
      "react/no-array-index-key": "warn", // Discourage array index as key
      "react/jsx-no-bind": ["warn", { ignoreDOMComponents: false }], // Avoid inline functions
      "react/jsx-no-constructed-context-values": "warn", // Avoid recreating context values

      // ===========================
      // IMPORT/EXPORT MANAGEMENT
      // ===========================
      "simple-import-sort/imports": "warn",
      "simple-import-sort/exports": "warn",
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/components/ui",
              message:
                "Use absolute imports for '@/components/ui' instead of relative imports.",
            },
          ],
          patterns: [
            {
              group: [
                "**/ui/*",
                "!@/components/ui/*",
                "!**/argo-workflows/ui/*",
              ],
              message:
                "Only '@/components/ui/*' is allowed for importing from the ui folder.",
            },
          ],
        },
      ],
      "no-barrel-files/no-barrel-files": "warn", // barrel files are considered legacy

      // ===========================
      // SECURITY & SAFETY
      // ===========================
      "no-eval": "error", // Prevent eval() usage
      "no-implied-eval": "error", // Prevent setTimeout/setInterval with strings
      "no-new-func": "error", // Prevent Function constructor

      // ===========================
      // CODE QUALITY & MAINTAINABILITY
      // ===========================
      "no-constant-condition": "error", // Prevent if(true) type conditions
      "no-dupe-keys": "error", // Prevent duplicate object keys
      "prefer-const": "error", // Use const when variable isn't reassigned
      complexity: ["warn", { max: 15 }], // Limit cyclomatic complexity
      "max-depth": ["warn", 4], // Limit nesting depth
      "max-lines-per-function": ["warn", { max: 100 }], // Limit function length

      // ===========================
      // CODE STYLE & CONSISTENCY
      // ===========================
      "prefer-template": "warn", // Use template literals over concatenation
      "object-shorthand": "warn", // Use shorthand object properties

      // ===========================
      // CUSTOM RESTRICTIONS
      // ===========================
      "no-restricted-syntax": [
        "error",
        {
          selector: 'NewExpression[callee.name="Error"]',
          message:
            "Only derived error classes should be used, not new Error().",
        },
      ],
    },
    plugins: {
      "simple-import-sort": simpleImportSort,
      "react-hooks": pluginReactHooks,
      "no-barrel-files": noBarrelFiles,
    },
  },
  {
    ignores: ["src/api/**/*"],
  },
];
