// --- START OF FILE copy-articulate-output.cjs ---

const path = require("path");
const fse = require("fs-extra");

// --- Configuration & Path Definitions ---
// It's good practice to clearly define all paths at the top.
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

const shouldCopy = process.argv.includes("--copy");

// --- Helper Functions for Core Operations ---

/**
 * Moves the umbraco-package.json file from the Vite output directory
 * to its parent directory.
 */
async function movePackageJson() {
  console.log(`Attempting to move package.json...`);
  console.log(`  Source: ${packageJsonSourcePath}`);
  console.log(`  Destination: ${packageJsonDestPath}`);

  if (!(await fse.pathExists(packageJsonSourcePath))) {
    throw new Error(`Source file not found: ${packageJsonSourcePath}`);
  }

  try {
    await fse.move(packageJsonSourcePath, packageJsonDestPath, { overwrite: true });
    console.log(`Successfully moved package.json.`);
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
    console.log("Skipping directory copy to test site (no --copy flag).");
    return; // Exit this function early if no copy is needed
  }

  console.log(`Attempting to copy output to test site...`);
  console.log(`  Source: ${viteOutDir}`);
  console.log(`  Destination: ${testSitePluginsDir}`);

  // Ensure the source directory for copy exists
  if (!(await fse.pathExists(viteOutDir))) {
    throw new Error(`Source directory for copy operation not found: ${viteOutDir}`);
  }

  // Delete target directory if it exists
  if (await fse.pathExists(testSitePluginsDir)) {
    console.log(`  Deleting existing directory: ${testSitePluginsDir}`);
    try {
      await fse.remove(testSitePluginsDir);
      console.log(`  Successfully deleted existing directory.`);
    } catch (error) {
      throw new Error(`Error deleting existing directory ${testSitePluginsDir}: ${error.message}`);
    }
  }

  // Copy directory
  try {
    // fse.copy will create the destination directory if it doesn't exist.
    await fse.copy(viteOutDir, testSitePluginsDir);
    console.log(`Successfully copied directory.`);
  } catch (error) {
    throw new Error(
      `Error copying directory from ${viteOutDir} to ${testSitePluginsDir}: ${error.message}`,
    );
  }
}

// --- Main Script Execution ---

async function main() {
  console.log("Starting build output processing...");

  await movePackageJson();
  await copyOutputToTestSite();

  console.log("Build output processing completed successfully!");
}

// Execute main and handle any unhandled promise rejections or synchronous errors.
main().catch((error) => {
  console.error("\n--- SCRIPT EXECUTION FAILED ---");
  console.error("Error:", error.message); // Display the specific error message
  // Optionally, log the stack for more detailed debugging,
  // especially if the error message itself isn't very informative.
  if (error.stack && process.env.DEBUG) {
    // Only show stack in debug mode or if desired
    console.error("Stacktrace:", error.stack);
  }
  console.error("-------------------------------\n");
  process.exit(1); // Exit with an error code
});

// --- END OF FILE copy-articulate-output.cjs ---
