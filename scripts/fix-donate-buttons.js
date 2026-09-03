const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

function getAllHtmlFiles(dir) {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.agents') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(getAllHtmlFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(full);
    }
  }
  return files;
}

const files = getAllHtmlFiles(rootDir);
let updatedCount = 0;

files.forEach(file => {
  let html = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Replace any button containing "Поддержать проект" that doesn't have onclick="openModal('modal-donate')"
  html = html.replace(/<button\b([^>]*?)>([\s\S]*?Поддержать проект[\s\S]*?)<\/button>/gi, (match, attrs, innerText) => {
    if (!attrs.includes("openModal('modal-donate')") && !attrs.includes('openModal("modal-donate")')) {
      changed = true;
      // Remove any disabled or pointer-events:none
      attrs = attrs.replace(/\bdisabled\b/gi, '').replace(/pointer-events:\s*none;?/gi, '');
      return `<button onclick="openModal('modal-donate')"` + attrs + '>' + innerText + '</button>';
    }
    return match;
  });

  // Also ensure openModal('modal-donate') is available and closeModal works
  if (changed) {
    fs.writeFileSync(file, html, 'utf8');
    console.log(`✅ Fixed donate buttons in: ${path.relative(rootDir, file)}`);
    updatedCount++;
  }
});

console.log(`Finished: ${updatedCount} files updated.`);
