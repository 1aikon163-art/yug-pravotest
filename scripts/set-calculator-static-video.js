const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const rootDir = __dirname + '/..';

// 1. Set calculator.html to data-video-mode="pingpong"
const calcPath = path.join(rootDir, 'calculator.html');
let calcHtml = fs.readFileSync(calcPath, 'utf8');
calcHtml = calcHtml.replace(/id=["']calc-hero-video["'][^>]*data-video-mode=["'][^"']*["']/i, 'id="calc-hero-video" src="ves.mp4" data-video-mode="pingpong"');
fs.writeFileSync(calcPath, calcHtml, 'utf8');
console.log('calculator.html set to pingpong (static ambient background)');

// 2. Update js/main.js to support pingpong for calculator & about
const mainJsPath = path.join(rootDir, 'js/main.js');
let mainJs = fs.readFileSync(mainJsPath, 'utf8');

// Ensure isPingPong checks calc-hero-video as well
mainJs = mainJs.replace(
  /const isPingPong = \(activeVideo\.id === 'about-hero-video'\) \|\| \(activeVideo\.dataset\.videoMode === 'pingpong'\);/i,
  `const isPingPong = (activeVideo.id === 'about-hero-video') || (activeVideo.id === 'calc-hero-video') || (activeVideo.dataset.videoMode === 'pingpong');`
);

fs.writeFileSync(mainJsPath, mainJs, 'utf8');
console.log('js/main.js updated: calculator is now static ambient background without scroll!');

// 3. Upload to VPS
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected. Uploading static calculator video setup...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    sftp.fastPut(calcPath, '/var/www/yug-pravo/calculator.html', () => {
      sftp.fastPut(mainJsPath, '/var/www/yug-pravo/js/main.js', () => {
        conn.exec('systemctl reload nginx', () => {
          console.log('CALCULATOR_STATIC_AMBIENT_DEPLOYED_SUCCESSFULLY');
          conn.end();
        });
      });
    });
  });
}).connect({
  host: '82.202.129.126',
  port: 22,
  username: 'root',
  password: process.env.SERVER_PASS || '4EuSRg&!W525'
});
