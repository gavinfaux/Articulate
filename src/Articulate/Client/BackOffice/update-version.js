import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Recreate __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get version from nbgv
const version = execSync("dotnet nbgv get-version -v SemVer2", { encoding: "utf8", cwd: path.resolve(__dirname, "..", "..") }).trim();

// Update package.json
const pkgPath = path.join(__dirname, "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
pkg.version = version;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
console.log(`Set package.json version to ${version}`);

// Update umbraco-package.json
const umbracoPkgPath = path.join(__dirname, "public", "umbraco-package.json");
const umbracoPkg = JSON.parse(fs.readFileSync(umbracoPkgPath, "utf8"));
umbracoPkg.version = version;
fs.writeFileSync(umbracoPkgPath, JSON.stringify(umbracoPkg, null, 2) + "\n");
console.log(`Set umbraco-package.json version to ${version}`);
