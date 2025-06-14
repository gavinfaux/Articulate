import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file's directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Goes up from scripts folder, so Client folder
const clientDir = path.resolve(__dirname, '..'); 
// Goes up to Articulate folder
const projectRoot = path.resolve(clientDir, '..'); 

// Client\dist
const sourceDir = path.resolve(clientDir,'dist');

// Articulate\App_Plugins\Articulate\BackOffice
const destDir = path.resolve(projectRoot, 'App_Plugins/Articulate/BackOffice');

const packageJsonFileName = "umbraco-package.json";
const packageJsonSourcePath = path.join(destDir, packageJsonFileName)
const packageJsonDestPath = path.resolve(destDir, "..", packageJsonFileName);

console.log(`Copying build output from ${sourceDir} to ${destDir}...`);

// Ensure the destination exists
await fs.ensureDir(destDir);

// Copy files from the 'dist' folder to the destination
await fs.copy(sourceDir, destDir, { overwrite: true });

// Move the package.json file to the root of the destination folder
await fs.move(packageJsonSourcePath, packageJsonDestPath, { overwrite: true });

console.log('Copy complete!');