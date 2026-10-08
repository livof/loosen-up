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
// Side view, sitting on a chair, facing right. spine: points from the hip up to the shoulder.
const CHAIR = '#b9b0a3';
const chair = `<rect x="106" y="128" width="64" height="7" rx="3" fill="${CHAIR}"/>` +
  `<rect x="106" y="70" width="7" height="112" rx="3" fill="${CHAIR}"/><rect x="163" y="128" width="7" height="54" rx="3" fill="${CHAIR}"/>`;
const hipS = [138, 122];
const sitLeg = [[182, 124], [184, 180]];
function sitter({ spine = [[140, 76]], headAt = [142, 54], farLeg = sitLeg, nearLeg = sitLeg, farArm, nearArm }) {
  const sh = spine[spine.length - 1];
  return chair + line([hipS, ...farLeg], true) + line([sh, ...farArm], true) +
    line([hipS, ...spine], false) + head(...headAt) + line([hipS, ...nearLeg], false) + line([sh, ...nearArm], false);
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
  // Ankle on the other knee, then lean forward from the hips with a long back.
  'seated-figure-4': [0, 1].map(f => {
    const crossed = [[176, 102], [190, 122]];
    return f
      ? sitter({ spine: [[166, 86]], headAt: [180, 68], nearLeg: crossed, farArm: [[176, 104], [184, 118]], nearArm: [[180, 102], [186, 112]] })
      : sitter({ nearLeg: crossed, farArm: [[156, 100], [176, 110]], nearArm: [[160, 98], [180, 104]] }) + arrow(160, 40, 186, 54);
  }),
  // One leg straight out, heel on the floor, toes up. Lean forward from the hips.
  'seated-hamstring': [0, 1].map(f => {
    const straight = [[180, 128], [232, 176], [238, 160]];
    return f
      ? sitter({ spine: [[168, 88]], headAt: [182, 70], nearLeg: straight, farArm: [[184, 112], [196, 132]], nearArm: [[188, 110], [202, 136]] })
      : sitter({ nearLeg: straight, farArm: [[150, 100], [168, 118]], nearArm: [[154, 98], [174, 120]] }) + arrow(160, 40, 186, 54);
  }),
  // Hands on knees. Arch and look up (cow), then round and look down (cat).
  'seated-cat-cow': [0, 1].map(f => f
    ? sitter({ spine: [[122, 100], [138, 74]], headAt: [160, 80], farArm: [[166, 104], [178, 122]], nearArm: [[170, 104], [182, 122]] })
    : sitter({ spine: [[134, 98], [146, 76]], headAt: [156, 54], farArm: [[164, 98], [178, 122]], nearArm: [[168, 98], [182, 122]] })),
  // Arms bent in front, then pull the elbows down and back to squeeze the shoulder blades.
  'w-squeeze': [0, 1].map(f => f
    ? sitter({ farArm: [[122, 104], [130, 72]], nearArm: [[118, 106], [124, 72]] })
    : sitter({ farArm: [[172, 88], [178, 56]], nearArm: [[178, 90], [186, 58]] }) + arrow(206, 30, 160, 30)),
  // Arm straight out. The other hand pulls the fingers down, then back.
  'wrist-stretch': [0, 1].map(f => f
    ? sitter({ farArm: [[168, 92], [198, 66]], nearArm: [[192, 80], [200, 62]] })
    : sitter({ farArm: [[166, 98], [196, 96]], nearArm: [[192, 80], [198, 98]] })),
  // Face down, then lift the chest onto the forearms. Hips stay on the floor.
  sphinx: [0, 1].map(f => f
    ? line([[112, 136], [112, 175], [78, 176]], true) + line([[262, 176], [178, 174], [112, 136]], false) + head(92, 118) +
      line([[112, 136], [116, 175], [82, 176]], false)
    : line([[262, 176], [178, 174], [104, 172]], false) + head(84, 160) + line([[104, 172], [100, 176], [70, 177]], false) +
      arrow(130, 150, 130, 118)),
  // Stand on one leg, hold the other foot behind you. Free arm out for balance.
  'quad-standing': [0, 1].map(f => f
    ? stander({ farLeg: standLeg, nearLeg: [[150, 148], [130, 122]], farArm: [[172, 80], [194, 74]], nearArm: [[140, 94], [130, 120]] })
    : stander({ farLeg: standLeg, nearLeg: [[152, 148], [138, 158]], farArm: [[172, 80], [194, 74]], nearArm: [[144, 92], [140, 116]] })),
  // From hands and knees, lift the hips up and back into an upside-down V.
  'downward-dog': [0, 1].map(f => f
    ? line([[124, 126], [88, 178]], true) + line([[170, 78], [214, 178]], true) + line([[124, 126], [170, 78]], false) +
      head(118, 146) + line([[170, 78], [212, 178]], false) + line([[124, 126], [92, 178]], false)
    : line([[110, 124], [104, 178]], true) + line([[190, 124], [190, 178], [236, 178]], true) + line([[110, 124], [190, 124]], false) +
      head(88, 116) + line([[190, 124], [194, 178], [240, 178]], false) + line([[110, 124], [108, 178]], false) + arrow(190, 104, 176, 76)),
  // Hands on the desk, walk back and hinge until your back is flat.
  'desk-dog': [0, 1].map(f => {
    const desk = `<rect x="222" y="104" width="78" height="8" rx="3" fill="${CHAIR}"/><rect x="226" y="112" width="7" height="70" fill="${CHAIR}"/>`;
    return desk + (f
      ? line([[118, 112], [118, 180]], true) + line([[118, 112], [186, 112]], false) + head(202, 130) +
        line([[118, 112], [120, 180]], false) + line([[186, 112], [228, 102]], false)
      : stander({ farLeg: standLeg, nearLeg: standLeg, farArm: [[188, 88], [226, 102]], nearArm: [[190, 90], [228, 102]] }) +
        arrow(130, 30, 96, 30));
  }),
  // Front view. Wide stance, front knee bent over the ankle, arms out long.
  'warrior-2': [0, 1].map(f => f
    ? line([[150, 122], [104, 152], [86, 180]], false) + line([[150, 122], [194, 140], [200, 180]], false) +
      line([[150, 122], [150, 74]], false) + head(150, 50) + line([[84, 74], [216, 74]], false)
    : line([[150, 112], [118, 180]], false) + line([[150, 112], [182, 180]], false) +
      line([[150, 112], [150, 66]], false) + head(150, 42) + line([[136, 108], [150, 66], [164, 108]], false)),
  // On your back. Hug the knees in, then open them wide and hold the feet, soles up.
  'happy-baby': [0, 1].map(f => {
    const body = line([[96, 168], [170, 168]], false) + head(70, 164);
    return f
      ? body + line([[170, 168], [196, 132], [190, 92]], true) + line([[96, 168], [140, 130], [188, 94]], true) +
        line([[170, 168], [146, 130], [176, 98]], false) + line([[96, 168], [134, 132], [174, 100]], false)
      : body + line([[170, 168], [146, 120], [180, 116]], false) + line([[96, 168], [124, 136], [148, 124]], false) + arrow(204, 150, 204, 112);
  }),
  // Lying flat on your back, arms relaxed. One still picture.
  savasana: [line([[92, 170], [130, 178]], true) + line([[92, 170], [176, 170], [262, 172]], false) + head(66, 164) +
    line([[92, 170], [136, 176]], false)],
  // Sitting, looking up and far away out of a window. One still picture.
  'eye-break': [(() => {
    const window = `<rect x="226" y="30" width="58" height="70" rx="4" fill="#cfe1dc" stroke="${CHAIR}" stroke-width="5"/>` +
      `<line x1="255" y1="30" x2="255" y2="100" stroke="${CHAIR}" stroke-width="4"/>`;
    const gaze = `<line x1="156" y1="50" x2="236" y2="60" stroke="${ACC}" stroke-width="3" stroke-dasharray="6 6"/>`;
    return window + gaze + sitter({ farArm: [[150, 100], [168, 116]], nearArm: [[154, 98], [174, 118]] });
  })()],
};

for (const [id, frames] of Object.entries(drawings)) {
  frames.forEach((body, f) => {
    const ground = id === 'chin-tucks' || id === 'open-book' ? '' : floor();
    const frame = frames.length === 1 ? 1 : f; // a single still picture is the end frame
    fs.writeFileSync(`${out}/${id}-${frame}.svg`, svg(body, defs + ground));
  });
}
console.log('wrote', Object.values(drawings).flat().length, 'svgs');
