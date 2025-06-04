// scripts/copy-articulate-output.cjs
const path = require('path');
const fse = require('fs-extra');

// Path to the Client directory (where vite.config.ts and scripts/ are)
const clientDir = path.resolve(__dirname, '..'); 

// This is the directory Vite outputs everything to, as per vite.config.ts build.outDir
const viteActualOutDir = path.resolve(clientDir, '../wwwroot/App_Plugins/Articulate/BackOffice');

// Source of umbraco-package.json (after Vite build)
const builtPackageJsonSourceFile = path.join(viteActualOutDir, 'umbraco-package.json');

// Destination for umbraco-package.json in the main project (one level up from viteActualOutDir)
const mainProjectPackageJsonDestFile = path.resolve(viteActualOutDir, '../umbraco-package.json');

// --- Test Site Destinations ---
const testSiteWwwRoot = path.resolve(clientDir, '../../Articulate.Tests.Website/wwwroot');
const testSiteArticulateBaseDir = path.join(testSiteWwwRoot, 'App_Plugins/Articulate');
const testSiteBackOfficeDestDir = path.join(testSiteArticulateBaseDir, 'BackOffice');
const testSitePackageJsonDestFile = path.join(testSiteArticulateBaseDir, 'umbraco-package.json');

async function run() {
  try {
    console.log(`Vite actual output directory: ${viteActualOutDir}`);
    console.log(`Source umbraco-package.json (from Vite build): ${builtPackageJsonSourceFile}`);
    console.log(`Main project umbraco-package.json destination: ${mainProjectPackageJsonDestFile}`);
    console.log(`Test site BackOffice assets destination: ${testSiteBackOfficeDestDir}`);
    console.log(`Test site umbraco-package.json destination: ${testSitePackageJsonDestFile}`);

    // 1. Ensure destination directories exist for the test site
    await fse.ensureDir(testSiteArticulateBaseDir); 
    await fse.ensureDir(testSiteBackOfficeDestDir); 

    // 2. Move umbraco-package.json for the main project
    if (await fse.pathExists(builtPackageJsonSourceFile)) {
      await fse.move(builtPackageJsonSourceFile, mainProjectPackageJsonDestFile, { overwrite: true });
      console.log(`Moved ${builtPackageJsonSourceFile} to ${mainProjectPackageJsonDestFile}`);
    } else {
      console.error(`Error: Source file ${builtPackageJsonSourceFile} not found. Vite build might have failed or its output structure changed.`);
      process.exit(1); // Exit with error
      return;
    }

    // 3. Copy the entire Vite output directory (viteActualOutDir, which is .../BackOffice/)
    // to the test site's BackOffice directory.
    // At this point, viteActualOutDir no longer contains umbraco-package.json at its root,
    // as it was moved in step 2. This copies all JS, CSS, theme assets etc.
    await fse.copy(viteActualOutDir, testSiteBackOfficeDestDir, { overwrite: true });
    console.log(`Copied BackOffice assets from ${viteActualOutDir} to ${testSiteBackOfficeDestDir}`);

    // 4. Copy the (now correctly placed in main project) umbraco-package.json
    // to the test site's App_Plugins/Articulate/ directory.
    if (await fse.pathExists(mainProjectPackageJsonDestFile)) {
      await fse.copy(mainProjectPackageJsonDestFile, testSitePackageJsonDestFile, { overwrite: true });
      console.log(`Copied ${mainProjectPackageJsonDestFile} to ${testSitePackageJsonDestFile}`);
    } else {
       // This should not happen if step 2 succeeded
      console.error(`Error: Main project package file ${mainProjectPackageJsonDestFile} not found for copying to test site.`);
      process.exit(1); // Exit with error
      return;
    }

    console.log('Articulate output successfully processed and copied to test site.');

  } catch (err) {
    console.error('Error processing Articulate output:', err);
    process.exit(1); // Exit with error code
  }
}

run();
