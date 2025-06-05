const path = require('path');
const fse = require('fs-extra');

const clientDir = path.resolve(__dirname, '..'); 
const viteOutDir = path.resolve(clientDir, '../App_Plugins/Articulate/BackOffice');
const packageJsonSource = path.join(viteOutDir, 'umbraco-package.json');
const packageJsonDest = path.resolve(viteOutDir, '../umbraco-package.json');

async function run() {
  try {
    if (await fse.pathExists(packageJsonSource)) {
      await fse.move(packageJsonSource, packageJsonDest, { overwrite: true });
      console.log(`Moved ${packageJsonSource} to ${packageJsonDest}`);
    } else {
      console.error(`Source file not found: ${packageJsonSource}`);
    }
  } catch (error) {
    console.error('Error moving umbraco-package.json:', error);
  }
}

run();
