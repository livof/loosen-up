// Checks every goal and every area combination fits each length, in each place.
// Run: node test.js
const { STRETCHES, AREAS, PLACES, POSITIONS, GOALS, TOLERANCE, lengthsFor, buildRoutine } = require('./routines.js');

let failures = 0;
function fail(msg) {
  failures++;
  console.log(`FAIL ${msg}`);
}

function check(label, options) {
  const r = buildRoutine(options);
  const target = options.minutes * 60;
  const where = `${label} ${options.place} ${options.minutes} min`;
  if (Math.abs(r.total - target) > TOLERANCE || !r.steps.every(s => s.secs >= 5)) {
    fail(`${where}: ${r.total}s (target ${target}s)`);
  }
  if (options.place === 'desk' && options.goal !== 'run' && r.stretches.some(s => s.pos === 'floor')) {
    fail(`${where} has a floor stretch at the desk`);
  }
  if (options.place === 'home' && r.stretches.some(s => s.deskOnly)) {
    fail(`${where} has a desk-only stretch at home`);
  }
  // At most one trip down to the floor, and you don't get up again (except to breathe).
  const pos = r.stretches.filter(s => s.kind !== 'breath').map(s => s.pos);
  if (pos.indexOf('floor') !== -1 && pos.slice(pos.indexOf('floor')).some(p => p !== 'floor')) {
    fail(`${where} gets up off the floor mid-routine: ${pos.join(', ')}`);
  }
  return r;
}

for (const place of PLACES.map(p => p.id)) {
  for (const g of GOALS) {
    for (const minutes of lengthsFor({ goal: g.id, place })) {
      const r = check(g.id, { goal: g.id, minutes, place });
      if (g.id === 'run' && r.stretches.some(s => s.kind === 'static')) fail(`run ${minutes} min contains static holds`);
    }
  }

  const ids = AREAS.map(a => a.id);
  for (let mask = 1; mask < 1 << ids.length; mask++) {
    const areas = ids.filter((_, i) => mask & (1 << i));
    for (const minutes of lengthsFor({ place })) check(areas.join('+'), { areas, minutes, place });
  }
}

// Every stretch id referenced by a goal must exist.
for (const g of GOALS) {
  for (const id of g.stretches.concat(g.filler)) {
    if (!STRETCHES.some(s => s.id === id)) fail(`goal ${g.id} references missing stretch ${id}`);
  }
}

// Positions and desk stand-ins.
const order = Object.keys(POSITIONS);
let last = 0;
for (const s of STRETCHES) {
  if (!POSITIONS[s.pos]) fail(`${s.id} has no valid pos`);
  if (s.kind !== 'warmup') {
    // The library (minus run warm-ups) must be grouped chair -> standing -> floor.
    if (order.indexOf(s.pos) < last) fail(`${s.id} is out of position order in STRETCHES`);
    last = Math.max(last, order.indexOf(s.pos));
  }
  if (s.desk) {
    const d = STRETCHES.find(x => x.id === s.desk);
    if (!d) fail(`${s.id} desk stand-in ${s.desk} is missing`);
    else if (d.pos === 'floor') fail(`${s.id} desk stand-in ${s.desk} is on the floor`);
  }
  if (s.desk && s.pos !== 'floor') fail(`${s.id} has a desk stand-in but isn't a floor stretch`);
}

// Every stretch must have both picture frames in img/ (only the end frame if it's a still).
const fs = require('fs');
for (const s of STRETCHES) {
  const ext = s.photo === 'drawing' ? 'svg' : 'jpg';
  for (const f of s.still ? [1] : [0, 1]) {
    if (!s.photo || !fs.existsSync(`${__dirname}/img/${s.id}-${f}.${ext}`)) fail(`missing img/${s.id}-${f}.${ext}`);
  }
}

console.log(failures ? `${failures} failure(s)` : 'All checks passed');
process.exit(failures ? 1 : 0);
