import { includeIgnoreFile } from "@eslint/compat";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tseslint from "typescript-eslint";
import * as localRules from "./eslint-local-rules.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, "../../../.gitignore");

export default [
  {
    files: ["**/*.ts", "**/*.tsx"],
    ignores: ["vite.config.ts"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      "local-rules": localRules,
    },
    rules: {
      "local-rules/prefer-static-styles-last": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
  includeIgnoreFile(gitignorePath),
];
