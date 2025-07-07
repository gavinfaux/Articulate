import chalk from "chalk";
import path from "path";
import fse from "fs-extra";
import { fileURLToPath } from "url";

// --- Configuration & Path Definitions ---

// Replicate __dirname functionality in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve paths from the new script location
const clientDir = path.resolve(__dirname, "..", ".."); // Go up two levels from BackOffice/scripts to Client
const viteOutDir = path.resolve(clientDir, `../App_Plugins/Articulate/BackOffice`); // Correct path from Client to App_Plugins
const testSitePluginsDir = path.resolve(clientDir, `../../Articulate.Tests.Website/App_Plugins/Articulate/BackOffice`);

// --- umbraco-package.json specific logic (only for BackOffice) ---
const packageJsonFileName = "umbraco-package.json";
const packageJsonSourcePath = path.join(viteOutDir, packageJsonFileName);
const packageJsonDestPath = path.resolve(viteOutDir, "..", packageJsonFileName);
const testSitePackageJsonDestPath = path.resolve(testSitePluginsDir, "..", packageJsonFileName);

// process.argv works the same way in ES Modules
const shouldCopy = process.argv.includes("--copy");

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

/**
 * Copies the Vite output directory to the test site's App_Plugins directory.
 * Deletes the destination directory if it already exists.
 */
async function copyOutputToTestSite() {
  if (!shouldCopy) {
    console.log(chalk.yellow(`Skipping directory copy to test site (no --copy flag).`));
    return; // Exit this function early if no copy is needed
  }

  console.log(chalk.green(`Attempting to copy output to test site...`));
  console.log(`  Source: ${chalk.yellow(viteOutDir)}`);
  console.log(`  Destination: ${chalk.yellow(testSitePluginsDir)}`);

  if (!(await fse.pathExists(viteOutDir))) {
    throw new Error(`Source directory for copy operation not found: ${viteOutDir}`);
  }

  if (await fse.pathExists(testSitePluginsDir)) {
    console.log(`  Deleting existing directory: ${chalk.yellow(testSitePluginsDir)}`);
    try {
      await fse.remove(testSitePluginsDir);
      console.log(chalk.green(`  Successfully deleted existing directory.`));
    } catch (error) {
      throw new Error(`Error deleting existing directory ${testSitePluginsDir}: ${error.message}`);
    }
  }

  try {
    await fse.copy(viteOutDir, testSitePluginsDir);
    console.log(chalk.green(`Successfully copied 'BackOffice' directory.`));

    // Also copy the umbraco-package.json if it's the BackOffice project
    if (await fse.pathExists(packageJsonDestPath)) {
      await fse.copy(packageJsonDestPath, testSitePackageJsonDestPath, { overwrite: true });
      console.log(chalk.green(`Successfully copied package.json.`));
    }
  } catch (error) {
    throw new Error(`Error copying directory from ${viteOutDir} to ${testSitePluginsDir}: ${error.message}`);
  }
}

// --- Main Execution Logic ---

async function main() {
  try {
    // The movePackageJson function is specific to BackOffice, so we call it directly.
    await movePackageJson();
    await copyOutputToTestSite();
    console.log(chalk.bold.green("Post-build script finished successfully."));
  } catch (error) {
    console.error(chalk.bold.red("Post-build script failed:"));
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

main();
