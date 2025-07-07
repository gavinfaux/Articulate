import chalk from "chalk";
import fse from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

// --- Configuration & Path Definitions ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clientDir = path.resolve(__dirname, "..");
const viteOutDir = path.resolve(clientDir, "../../App_Plugins/Articulate/Assets");
const testSitePluginsDir = path.resolve(clientDir, "../../Articulate.Tests.Website/App_Plugins/Articulate/Assets");

const shouldCopy = process.argv.includes("--copy");

// --- Main Execution Logic ---

async function copyOutputToTestSite() {
  if (!shouldCopy) {
    console.log(chalk.yellow(`Skipping directory copy to test site (no --copy flag).`));
    return;
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
    console.log(chalk.green(`Successfully copied 'MarkdownEditor' directory.`));
  } catch (error) {
    throw new Error(`Error copying directory from ${viteOutDir} to ${testSitePluginsDir}: ${error.message}`);
  }
}

async function main() {
  try {
    await copyOutputToTestSite();
    console.log(chalk.bold.green("Post-build script finished successfully."));
  } catch (error) {
    console.error(chalk.bold.red("Post-build script failed:"));
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

main();
