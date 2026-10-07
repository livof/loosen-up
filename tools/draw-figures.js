// Generates simple 2-frame (or 1 still) SVG figures for stretches without photos.
// Run: node tools/draw-figures.js img
const fs = require('fs');
const out = process.argv[2];
const NEAR = '#2b3431', FAR = '#98a39e', ACC = '#2f7d68';
const line = (pts, far) => `<polyline points="${pts.map(p => p.join(',')).join(' ')}" fill="none" stroke="${far ? FAR : NEAR}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>`;
const head = (x, y, far) => `<circle cx="${x}" cy="${y}" r="15" fill="${far ? FAR : NEAR}"/>`;
const svg = (body, extra = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200"><rect width="300" height="200" fill="#ece8e1"/>${extra}${body}</svg>\n`;
const floor = (y = 182) => `<rect y="${y}" width="300" height="${200 - y}" fill="#d6cfc3"/>`;
const arrow = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${ACC}" stroke-width="5" stroke-linecap="round" marker-end="url(#a)"/>`;
const defs = `<defs><marker id="a" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="${ACC}"/></marker></defs>`;

// Standing side-view figure facing right. legs: [farLeg, nearLeg], arms: [farArm, nearArm]
function stander({ farLeg, nearLeg, farArm, nearArm, lean = 0 }) {
  const hip = [150, 112], sh = [150 + lean, 66];
  return line([sh, ...farArm], true) + line([hip, ...farLeg], true) +
    line([hip, sh], false) + head(150 + lean * 1.3, 44) +
    line([hip, ...nearLeg], false) + line([sh, ...nearArm], false);
}
const standLeg = [[150, 148], [150, 180]];
const toeLeg = [[152, 148], [156, 178]];

const drawings = {
  march: [
    stander({ farLeg: standLeg, nearLeg: [[176, 124], [174, 160]], farArm: [[166, 86], [178, 74]], nearArm: [[138, 88], [132, 108]] }),
    stander({ farLeg: [[176, 124], [174, 160]], nearLeg: standLeg, farArm: [[138, 88], [132, 108]], nearArm: [[166, 86], [178, 74]] }),
  ],
  'high-knees': [
    stander({ lean: 4, farLeg: toeLeg, nearLeg: [[186, 104], [186, 142]], farArm: [[168, 84], [176, 64]], nearArm: [[136, 84], [126, 100]] }),
    stander({ lean: 4, farLeg: [[186, 104], [186, 142]], nearLeg: toeLeg, farArm: [[136, 84], [126, 100]], nearArm: [[168, 84], [176, 64]] }),
  ],
  'butt-kicks': [
    stander({ lean: 3, farLeg: toeLeg, nearLeg: [[154, 150], [126, 120]], farArm: [[164, 88], [172, 72]], nearArm: [[138, 88], [130, 104]] }),
    stander({ lean: 3, farLeg: [[154, 150], [126, 120]], nearLeg: toeLeg, farArm: [[138, 88], [130, 104]], nearArm: [[164, 88], [172, 72]] }),
  ],
  // Front view, sitting cross-legged, hands on belly. Belly grows on the in-breath.
  breathing: [0, 1].map(f => {
    const belly = `<ellipse cx="150" cy="112" rx="${f ? 26 : 13}" ry="${f ? 18 : 10}" fill="${ACC}" opacity=".75"/>`;
    return line([[150, 134], [108, 150], [158, 160]], true) + line([[150, 134], [192, 150], [142, 160]], false) +
      line([[150, 134], [150, 70]], false) + head(150, 46) +
      line([[150, 74], [118, 98], [140, 114]], false) + line([[150, 74], [182, 98], [160, 114]], false) + belly;
  }),
  // Side view of head and neck, one still picture: faded head forward, solid head with chin slid back.
  // The movement is too small to read as a flip, so this stretch has no start frame.
  'chin-tucks': [(() => {
    const guide = `<line x1="150" y1="20" x2="150" y2="180" stroke="${ACC}" stroke-width="3" stroke-dasharray="6 6" opacity=".6"/>`;
    const neck = (hx, far) => line([[150, 112], [hx, 66]], far) +
      `<circle cx="${hx}" cy="44" r="22" fill="${far ? FAR : NEAR}"/><circle cx="${hx + 22}" cy="46" r="5" fill="${far ? FAR : NEAR}"/>`;
    return guide + line([[150, 112], [150, 180]], false) + neck(176, true) + neck(150, false) + arrow(204, 12, 172, 12);
  })()],
  // Seen from above: lying on your side, knees bent. Top arm sweeps open.
  'open-book': [0, 1].map(f => {
    const legs = line([[190, 100], [222, 142], [262, 128]], true) + line([[190, 100], [226, 136], [266, 120]], false);
    const bottomArm = line([[100, 100], [104, 168]], true);
    const topArm = f ? line([[100, 100], [96, 30]], false) : line([[100, 100], [112, 164]], false);
    return legs + bottomArm + line([[100, 100], [190, 100]], false) + head(74, 100) + topArm +
      (f ? '' : arrow(130, 150, 130, 70));
  }),
  // Lying on your back, legs resting up a wall.
  'legs-up-wall': [0, 1].map(f => {
    const wall = `<rect x="232" y="0" width="68" height="200" fill="#d6cfc3"/>`;
    const arms = f
      ? line([[100, 168], [86, 140], [64, 132]], false)
      : line([[100, 168], [126, 144], [150, 158]], false);
    return wall + line([[214, 168], [224, 104], [226, 40]], false) + line([[100, 168], [214, 168]], false) +
      head(74, 166) + arms;
  }),
};

for (const [id, frames] of Object.entries(drawings)) {
  frames.forEach((body, f) => {
    const ground = id === 'chin-tucks' || id === 'open-book' ? '' : floor();
    const frame = frames.length === 1 ? 1 : f; // a single still picture is the end frame
    fs.writeFileSync(`${out}/${id}-${frame}.svg`, svg(body, defs + ground));
  });
}
console.log('wrote', Object.values(drawings).flat().length, 'svgs');
