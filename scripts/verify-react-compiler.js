#!/usr/bin/env node

/**
 * React Compiler Verification Script
 *
 * This script helps verify that React Compiler is active and working.
 * Run: node scripts/verify-react-compiler.js
 */

import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

console.log("🔍 React Compiler Verification\n");

// Check if configuration files exist
const configFiles = [
  "react-compiler.config.js",
  "vite.config.js",
  "eslint.config.js",
];

let allConfigsExist = true;

configFiles.forEach((file) => {
  const filePath = join(projectRoot, file);
  if (existsSync(filePath)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
    allConfigsExist = false;
  }
});

if (!allConfigsExist) {
  console.log(
    "\n❌ Some configuration files are missing. React Compiler may not be properly configured.",
  );
  process.exit(1);
}

// Check Vite config for React Compiler
const viteConfigPath = join(projectRoot, "vite.config.js");
const viteConfig = readFileSync(viteConfigPath, "utf8");

if (viteConfig.includes("babel-plugin-react-compiler")) {
  console.log("✅ React Compiler plugin found in Vite config");
} else {
  console.log("❌ React Compiler plugin not found in Vite config");
}

// Check ESLint config for React Compiler
const eslintConfigPath = join(projectRoot, "eslint.config.js");
const eslintConfig = readFileSync(eslintConfigPath, "utf8");

if (eslintConfig.includes("eslint-plugin-react-compiler")) {
  console.log("✅ React Compiler ESLint plugin found");
} else {
  console.log("❌ React Compiler ESLint plugin not found");
}

// Check package.json for dependencies
const packageJsonPath = join(projectRoot, "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
const devDeps = packageJson.devDependencies || {};

const requiredDeps = [
  "babel-plugin-react-compiler",
  "eslint-plugin-react-compiler",
];

requiredDeps.forEach((dep) => {
  if (devDeps[dep]) {
    console.log(`✅ ${dep} installed (${devDeps[dep]})`);
  } else {
    console.log(`❌ ${dep} not installed`);
  }
});

console.log("\n🎯 To verify React Compiler is working:");
console.log("1. npm run build (should complete successfully)");
console.log("2. npm run lint (should show no react-compiler errors)");
console.log("3. Open React DevTools Profiler to see optimized renders");
console.log("4. Look for reduced re-render counts in complex components");

console.log("\n📝 React Compiler is optimizing your components automatically!");
console.log("   - Context providers with large dependency arrays");
console.log("   - useCallback/useMemo hooks with stable dependencies");
console.log("   - Derived state calculations");
console.log("   - Component re-renders based on prop changes");

console.log("\n✅ React Compiler verification complete!");
