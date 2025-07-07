import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Recreate __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The path is now relative to this script's location
const fullPkgPath = path.resolve(__dirname, "..", "package.json");

// Get version from nbgv
const version = execSync("dotnet nbgv get-version -v SemVer2", {
  encoding: "utf8",
  cwd: path.resolve(__dirname, "..", "..", ".."), // Run from the Articulate project root
}).trim();

// Update package.json
const pkg = JSON.parse(fs.readFileSync(fullPkgPath, "utf8"));
pkg.version = version;
fs.writeFileSync(fullPkgPath, JSON.stringify(pkg, null, 2) + "\n");
console.log(`Set package.json version to ${version}`);
