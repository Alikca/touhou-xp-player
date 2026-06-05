const fs = require('fs');

const width = 239;
const height = 1024;
const stepX = 24; 
const stepY = 32; 

let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" style="background:#222;">
  <image href="reimu_sprites.png" x="0" y="0" width="${width}" height="${height}" />
`;

// Draw vertical grid lines
for (let x = 0; x < width; x += stepX) {
    svg += `  <line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="rgba(255,0,0,0.5)" stroke-width="0.5" />\n`;
    svg += `  <text x="${x + 2}" y="10" fill="yellow" font-size="8">${x}</text>\n`;
}

// Draw horizontal grid lines
for (let y = 0; y < height; y += stepY) {
    svg += `  <line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="rgba(255,0,0,0.5)" stroke-width="0.5" />\n`;
    svg += `  <text x="2" y="${y - 2}" fill="yellow" font-size="8">${y}</text>\n`;
}

svg += `</svg>`;

fs.writeFileSync('grid.svg', svg);
console.log('grid.svg generated successfully.');
