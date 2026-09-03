const fs = require('fs');
const htmlFiles = fs.readdirSync('.').filter(f => f.endsWith('.html'));

htmlFiles.forEach(f => {
  const c = fs.readFileSync(f, 'utf8');
  const forms = c.match(/<form[\s\S]*?<\/form>/gi) || [];
  if (forms.length > 0) {
    console.log('=== File:', f, 'Forms:', forms.length);
    forms.forEach((form, idx) => {
      const idMatch = form.match(/id=["']([^"']+)["']/i);
      const sourceMatch = form.match(/data-source=["']([^"']+)["']/i);
      const aliasMatch = form.match(/data-alias=["']([^"']+)["']/i);
      const hasSelect = form.includes('<select');
      const selectNames = (form.match(/name=["']([^"']+)["']/gi) || []).join(', ');
      console.log(`  Form ${idx+1}: id=${idMatch ? idMatch[1] : 'none'}, source=${sourceMatch ? sourceMatch[1] : 'none'}, alias=${aliasMatch ? aliasMatch[1] : 'none'}, hasSelect=${hasSelect} (inputs: ${selectNames})`);
    });
  }
});
