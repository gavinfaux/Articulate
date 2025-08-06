import chalk from "chalk";
import path from "path";
import fse from "fs-extra";
import { fileURLToPath } from "url";

// --- Configuration & Path Definitions ---

// Replicate __dirname functionality in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve paths from the new script location
const clientDir = path.resolve(__dirname, ".."); // Go up one level from scripts to Client
const viteOutDir = path.resolve(clientDir, `../wwwroot/App_Plugins/Articulate/BackOffice`); // Correct path from Client to App_Plugins

// --- umbraco-package.json specific logic (only for BackOffice) ---
const packageJsonFileName = "umbraco-package.json";
const packageJsonSourcePath = path.join(viteOutDir, packageJsonFileName);
const packageJsonDestPath = path.resolve(viteOutDir, "..", packageJsonFileName);

// --- Helper Functions for Core Operations ---

/**
 * Moves the umbraco-package.json file from the Vite output directory
 * to its parent directory. This is specific to the BackOffice project.
 */
async function movePackageJson() {
  // This logic is only for the BackOffice project, which is guaranteed here.
  console.log(chalk.green(`Attempting to move package.json...`));
  console.log(`  Source: ${chalk.yellow(packageJsonSourcePath)}`);
  console.log(`  Destination: ${chalk.yellow(packageJsonDestPath)}`);

  if (!(await fse.pathExists(packageJsonSourcePath))) {
    console.log(chalk.cyan(`  Source file not found, assuming it was already moved. Skipping.`));
    return;
  }

  try {
    await fse.move(packageJsonSourcePath, packageJsonDestPath, { overwrite: true });
    console.log(chalk.green(`Successfully moved package.json.`));
  } catch (error) {
    throw new Error(`Error moving package.json: ${error.message}`);
  }
}

// --- Main Execution Logic ---

async function main() {
  try {
    // The movePackageJson function is specific to BackOffice, so we call it directly.
    await movePackageJson();
    console.log(chalk.bold.green("Post-build script finished successfully."));
  } catch (error) {
    console.error(chalk.bold.red("Post-build script failed:"));
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

main();
