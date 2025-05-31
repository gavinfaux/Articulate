import { includeIgnoreFile } from "@eslint/compat";
import pluginJs from "@eslint/js";
import * as litPlugin from "eslint-plugin-lit";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import * as wcPlugin from "eslint-plugin-wc";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tseslint from "typescript-eslint";
import * as localRules from "./eslint-local-rules.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, "../../../.gitignore");
const typescript = tseslint;
const typescriptParser = tseslint.parser;
const lit = litPlugin;
const prettier = eslintPluginPrettierRecommended;

export default [
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  wcPlugin.configs["flat/recommended"],
  litPlugin.configs["flat/recommended"],
  eslintPluginPrettierRecommended,
  includeIgnoreFile(gitignorePath),
  {
    ignores: [
      "scripts/**/*",
      "src/api/**/*",
      "*.config.*",
      "*.cjs",
      "*.mjs",
      ".prettierrc.*",
      "eslint-local-rules.*",
    ],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: "./tsconfig.json",
      },
      globals: {
        fetch: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        UmbExtensionManifest: "readonly",
      },
    },
    plugins: {
      "local-rules": localRules,
    },
    rules: {
      ...lit.configs.recommended.rules,
      "local-rules/prefer-static-styles-last": "warn",
      semi: ["warn", "always"],
      ...typescript.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-unsafe-function-type": "warn",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-inferrable-types": "off",
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },

  prettier,
];
