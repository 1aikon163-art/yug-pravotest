/**
 * QR Code Generator Utility
 * Generates ASCII QR code in terminal and SVG/PNG QR codes for mobile testing.
 */

const qrcodeTerminal = require('qrcode-terminal');
const QRCode = require('qrcode');
const os = require('os');
const path = require('path');
const fs = require('fs');

function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

async function generateQr(url) {
  const localIp = getLocalIpAddress();
  const targetUrl = url || `http://${localIp}:8080/`;

  console.log('\n======================================================');
  console.log('📱 MOBILE PREVIEW & PORT FORWARDING QR CODE');
  console.log('======================================================');
  console.log(`🔗 Local URL:   http://localhost:8080/`);
  console.log(`📡 Network URL: ${targetUrl}`);
  console.log('------------------------------------------------------');
  console.log('📷 Scan with your smartphone camera on the same Wi-Fi:\n');

  qrcodeTerminal.generate(targetUrl, { small: true });

  console.log('------------------------------------------------------');
  console.log('💡 For Remote/Internet testing (Port Forwarding):');
  console.log('   - VS Code / Cursor: Ports tab -> Port 8080 -> Visibility: Public');
  console.log('   - Cloudflare Tunnel: npx cloudflared tunnel --url http://localhost:8080');
  console.log('   - Localtunnel:       npx localtunnel --port 8080');
  console.log('======================================================\n');

  // Also save a PNG in images/ for web-based QR viewing
  const qrImagePath = path.join(__dirname, '..', 'images', 'dev-qr.png');
  await QRCode.toFile(qrImagePath, targetUrl, {
    color: {
      dark: '#c5a059', // Gold
      light: '#0a0c10' // Dark background
    },
    width: 320,
    margin: 2
  });
}

if (require.main === module) {
  generateQr(process.argv[2]);
}

module.exports = { getLocalIpAddress, generateQr };
