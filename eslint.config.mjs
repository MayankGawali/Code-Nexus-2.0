import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import ts from "typescript-eslint";
export default defineConfig([
  js.configs.recommended,
  ...ts.configs.recommended,
  globalIgnores([
    ".next/**",
    "node_modules/**",
    "test-results/**",
    "test-results-alternate/**",
    "playwright-report/**",
    "data/**",
    "next-env.d.ts",
  ]),
]);
