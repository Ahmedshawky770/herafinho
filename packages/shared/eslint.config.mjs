import { defineConfig } from "eslint/config";
import ts from "typescript-eslint";

export default defineConfig([
  ...ts.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/no-explicit-any": "error",
      "prefer-const": "warn",
      "no-console": ["warn", { "allow": ["warn", "error"] }],
    },
  },
]);