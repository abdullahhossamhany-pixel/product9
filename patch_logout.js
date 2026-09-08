const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

walkDir('./src', function(filePath) {
  if (filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('logout') || content.includes('Sign Out') || content.includes('signOut')) {
      console.log('Patching logout in:', filePath);
      
      // Replace common logout function bodies with native SDK call
      let updated = content.replace(
        /const\s+handleLogout\s*=\s*(async\s*)?\(\s*\)\s*=>\s*\{[\s\S]*?\};/g,
        `const handleLogout = async () => {
  localStorage.clear();
  sessionStorage.clear();
  if (window.base44?.auth?.logout) {
    await window.base44.auth.logout('/');
  }
  window.location.href = '/';
};`
      );

      if (updated !== content) {
        fs.writeFileSync(filePath, updated, 'utf8');
        console.log('Successfully updated:', filePath);
      }
    }
  }
});
