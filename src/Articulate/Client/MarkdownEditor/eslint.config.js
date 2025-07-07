import eslintConfigPrettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

// This configuration is based on the user's provided working example.
// It is simplified to ensure parsing works correctly before adding more rules.
export default tseslint.config(
  {
    // Global ignores
    ignores: ["dist/**", "vite.config.ts", "src/api/**"],
  },

  // Apply the recommended configurations from typescript-eslint.
  // This includes the parser, plugins, and base rules.
  ...tseslint.configs.recommended,

  // Configuration block for TypeScript files.
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    languageOptions: {
      parserOptions: {
        // Pointing to the correct tsconfig is crucial for the parser
        // to understand the project's types and structure.
        project: "../tsconfig.base.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Starting with a clean slate. All strict rules are off by default.
      // We will only enable one rule as a test.
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  // The Prettier config must be last to override any formatting rules.
  eslintConfigPrettier,
);
