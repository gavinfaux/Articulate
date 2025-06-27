import chalk from "chalk";
import path from "path";
import fse from "fs-extra";
import { fileURLToPath } from "url";

// --- Configuration & Path Definitions ---

// Replicate __dirname functionality in ES Modules
// import.meta.url gives the file URL of the current module.
// fileURLToPath converts it to an absolute file path.
// path.dirname gets the directory name from that path.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clientDir = path.resolve(__dirname, "..");
const viteOutDir = path.resolve(clientDir, "../App_Plugins/Articulate/BackOffice"); // This is the source for the copy operation

const packageJsonFileName = "umbraco-package.json";
const packageJsonSourcePath = path.join(viteOutDir, packageJsonFileName);
// Destination for package.json is one level up from viteOutDir
const packageJsonDestPath = path.resolve(viteOutDir, "..", packageJsonFileName);

const testSitePluginsDir = path.resolve(
  clientDir,
  "../../Articulate.Tests.Website/App_Plugins/Articulate/BackOffice", // This is the destination for the copy operation
);

const testSitePackageJsonDestPath = path.resolve(
  clientDir,
  "../../Articulate.Tests.Website/App_Plugins/Articulate/umbraco-package.json", // This is the destination for the copy operation
);

// process.argv works the same way in ES Modules
const shouldCopy = process.argv.includes("--copy");

// --- Helper Functions for Core Operations ---

/**
 * Moves the umbraco-package.json file from the Vite output directory
 * to its parent directory.
 */
async function movePackageJson() {
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
    // Add more context to the error before re-throwing
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

  // Ensure the source directory for copy exists
  if (!(await fse.pathExists(viteOutDir))) {
    throw new Error(`Source directory for copy operation not found: ${viteOutDir}`);
  }

  // Delete target directory if it exists
  if (await fse.pathExists(testSitePluginsDir)) {
    console.log(`  Deleting existing directory: ${chalk.yellow(testSitePluginsDir)}`);
    try {
      await fse.remove(testSitePluginsDir);
      console.log(chalk.green(`  Successfully deleted existing directory.`));
    } catch (error) {
      throw new Error(`Error deleting existing directory ${testSitePluginsDir}: ${error.message}`);
    }
  }

  // Copy directory
  try {
    // fse.copy will create the destination directory if it doesn't exist.
    await fse.copy(viteOutDir, testSitePluginsDir);
    await fse.copy(packageJsonDestPath, testSitePackageJsonDestPath);
    console.log(chalk.green(`Successfully copied directory and package.json.`));
  } catch (error) {
    throw new Error(`Error copying directory from ${viteOutDir} to ${testSitePluginsDir}: ${error.message}`);
  }
}

// --- Main Script Execution ---

async function main() {
  console.log(chalk.green("Starting build output processing..."));

  await movePackageJson();
  await copyOutputToTestSite();

  console.log(chalk.green("Build output processing completed successfully!"));
}

// Execute main and handle any unhandled promise rejections or synchronous errors.
main().catch((error) => {
  console.error(chalk.red("\n--- SCRIPT EXECUTION FAILED ---"));
  console.error(chalk.red("Error:"), error.message); // Display the specific error message
  // Optionally, log the stack for more detailed debugging,
  // especially if the error message itself isn't very informative.
  if (error.stack && process.env.DEBUG) {
    // Only show stack in debug mode or if desired
    console.error(chalk.red("Stacktrace:"), error.stack);
  }
  console.error(chalk.red("-------------------------------\n"));
  process.exit(1); // Exit with an error code
});