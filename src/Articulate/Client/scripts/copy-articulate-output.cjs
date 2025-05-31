// scripts/copy-articulate-output.cjs
const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');

const srcDir = path.resolve(__dirname, '../../wwwroot/App_Plugins/Articulate');
const destDir = path.resolve(__dirname, '../../../Articulate.Tests.Website/wwwroot/App_Plugins/Articulate');

fse.ensureDirSync(destDir);

fse.copy(srcDir, destDir, { overwrite: true }, err => {
  if (err) {
    console.error('❌ Copy failed:', err);
    process.exit(1);
  } else {
    console.log('✅ Copied build output.');
  }
});
