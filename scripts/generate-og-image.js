const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const W = 1200, H = 630;
const outPath = path.join(__dirname, '..', 'resources', 'images', 'og', 'default-og.png');

// Seeded random for reproducible pattern
Math.random = (() => { let s = 42; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })();

const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

// Background
ctx.fillStyle = '#0f0f23';
ctx.fillRect(0, 0, W, H);

// Geometric circles
const colors = ['#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51'];
for (let i = 0; i < 12; i++) {
  ctx.beginPath();
  ctx.arc(100 + Math.random() * 1000, 80 + Math.random() * 470, 30 + Math.random() * 60, 0, Math.PI * 2);
  ctx.fillStyle = colors[i % colors.length] + '40';
  ctx.fill();
  ctx.strokeStyle = colors[i % colors.length] + '80';
  ctx.lineWidth = 2;
  ctx.stroke();
}

// Lines
for (let i = 0; i < 6; i++) {
  ctx.beginPath();
  ctx.moveTo(Math.random() * W, Math.random() * H);
  ctx.lineTo(Math.random() * W, Math.random() * H);
  ctx.strokeStyle = '#2a9d8f30';
  ctx.lineWidth = 1;
  ctx.stroke();
}

// Text
ctx.fillStyle = '#f0f0f0';
ctx.font = 'bold 68px sans-serif';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('doong-jo', W / 2, H / 2 - 25);
ctx.fillStyle = '#aaa';
ctx.font = '26px sans-serif';
ctx.fillText('tech blog', W / 2, H / 2 + 35);

fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
console.log('Generated:', outPath);
