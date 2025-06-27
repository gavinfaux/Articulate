// Prettier config (modern JS format)
/** @type {import('prettier').Config} */
module.exports = {
  printWidth: 120,
  tabWidth: 2,
  singleQuote: false,
  trailingComma: "all",
  semi: true,
  arrowParens: "always",
  bracketSpacing: true,
  endOfLine: "lf",
  htmlWhitespaceSensitivity: "ignore",
  plugins: ["prettier-plugin-organize-imports"],
};
