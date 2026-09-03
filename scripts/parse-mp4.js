const fs = require('fs');

const buf = fs.readFileSync('hands.mp4');

function findBox(buf, name, offset = 0) {
  while (offset < buf.length - 8) {
    const size = buf.readUInt32BE(offset);
    const type = buf.toString('ascii', offset + 4, offset + 8);
    if (type === name) {
      return { offset, size };
    }
    if (size === 0) break;
    offset += size;
  }
  return null;
}

// Find moov
const moov = findBox(buf, 'moov');
console.log('moov box:', moov);

// Find mvhd inside moov
if (moov) {
  let off = moov.offset + 8;
  const mvhd = findBox(buf, 'mvhd', off);
  if (mvhd) {
    const version = buf[mvhd.offset + 8];
    const timeScale = buf.readUInt32BE(mvhd.offset + (version === 1 ? 28 : 20));
    const duration = version === 1 ? Number(buf.readBigUInt64BE(mvhd.offset + 32)) : buf.readUInt32BE(mvhd.offset + 24);
    console.log('TimeScale:', timeScale, 'Duration:', duration, 'Sec:', duration / timeScale);
  }
}
