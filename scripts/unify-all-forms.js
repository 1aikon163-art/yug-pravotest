const fs = require('fs');
const path = require('path');

function getAllHtmlFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (file === 'node_modules' || file === '.git' || file === '.gemini') continue;
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      getAllHtmlFiles(filePath, fileList);
    } else if (file.endsWith('.html')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const allHtmls = getAllHtmlFiles('.');
console.log(`Found ${allHtmls.length} HTML files.`);

let updatedCount = 0;

allHtmls.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // 1. Replace all data-alias="..." with data-alias="info@yugpravo.ru"
  content = content.replace(/data-alias=["'][^"']*["']/gi, 'data-alias="info@yugpravo.ru"');

  // 2. Replace all hidden target_alias with info@yugpravo.ru
  content = content.replace(/<input[^>]*name=["']target_alias["'][^>]*>/gi, '<input type="hidden" name="target_alias" value="info@yugpravo.ru" />');

  // 3. Replace old select name="target_alias" if any remains
  content = content.replace(/name=["']target_alias["']/gi, 'name="direction"');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    updatedCount++;
    console.log(`✅ Updated: ${filePath}`);
  }
});

console.log(`✨ Successfully updated ${updatedCount} files to unified reception standard!`);
