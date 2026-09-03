const fs = require('fs');
const path = require('path');

const OLD_ACC = '40703810600000751961';
const NEW_ACC = '40703810600000751961';

const ROOT_DIR = path.resolve(__dirname, '..');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const fullPath = path.join(dir, f);
    if (f === 'node_modules' || f === '.git' || f === '.system_generated') return;
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath, callback);
    } else {
      callback(fullPath);
    }
  });
}

let modifiedCount = 0;

walkDir(ROOT_DIR, (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  if (['.html', '.js', '.md', '.txt', '.json'].includes(ext)) {
    let content = fs.readFileSync(filePath, 'utf-8');
    if (content.includes(OLD_ACC)) {
      content = content.replaceAll(OLD_ACC, NEW_ACC);
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`[UPDATED] ${path.relative(ROOT_DIR, filePath)}`);
      modifiedCount++;
    }
  }
});

console.log(`\nRequisites updated in ${modifiedCount} files successfully!`);
