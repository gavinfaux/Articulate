import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Recreate __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the target package.json path from the command line arguments
const targetPackageJsonPath = process.argv[2];
if (!targetPackageJsonPath) {
  console.error("ERROR: Missing path to target package.json");
  process.exit(1);
}

// Resolve path from the script's location (BackOffice/scripts)
const fullPkgPath = path.resolve(__dirname, "..", targetPackageJsonPath);

// Get version from nbgv, running from the solution root
const version = execSync("dotnet nbgv get-version -v SemVer2", {
  encoding: "utf8",
  cwd: path.resolve(__dirname, "..", "..", ".."), // Go up three levels to the Articulate project root
}).trim();

// Update package.json
const pkg = JSON.parse(fs.readFileSync(fullPkgPath, "utf8"));
pkg.version = version;
fs.writeFileSync(fullPkgPath, JSON.stringify(pkg, null, 2) + "\n");
console.log(`Set ${path.basename(fullPkgPath)} version to ${version}`);

// Special case: also update umbraco-package.json for the BackOffice project
const umbracoPkgPath = path.resolve(path.dirname(fullPkgPath), "public", "umbraco-package.json");
if (fs.existsSync(umbracoPkgPath)) {
  const umbracoPkg = JSON.parse(fs.readFileSync(umbracoPkgPath, "utf8"));
  umbracoPkg.version = version;
  fs.writeFileSync(umbracoPkgPath, JSON.stringify(umbracoPkg, null, 2) + "\n");
  console.log(`Set umbraco-package.json version to ${version}`);
}
