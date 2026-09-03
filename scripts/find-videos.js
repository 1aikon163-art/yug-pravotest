const { execSync } = require('child_process');

const pages = [
  'index.html',
  'about.html',
  'calculator.html',
  'events.html',
  'initiatives.html',
  'knowledge.html',
  'disclosure.html'
];

pages.forEach(p => {
  try {
    const log = execSync(`git log -p -n 10 -- ${p}`, { encoding: 'utf8' });
    const matches = [...log.matchAll(/src=["']([^"']+\.mp4)["']/gi)].map(m => m[1]);
    console.log(p, '->', [...new Set(matches)]);
  } catch (e) {
    console.error(p, e.message);
  }
});
