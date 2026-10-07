// Checks every goal and every area combination fits each length.
// Run: node test.js
const { STRETCHES, AREAS, GOALS, LENGTHS, TOLERANCE, buildRoutine } = require('./routines.js');

let failures = 0;
function check(label, options) {
  const r = buildRoutine(options);
  const target = options.minutes * 60;
  const ok = Math.abs(r.total - target) <= TOLERANCE && r.steps.every(s => s.secs >= 5);
  if (!ok) {
    failures++;
    console.log(`FAIL ${label} ${options.minutes} min: ${r.total}s (target ${target}s)`);
  }
  return r;
}

for (const g of GOALS) {
  for (const minutes of LENGTHS) {
    const r = check(g.id, { goal: g.id, minutes });
    if (g.id === 'run' && r.stretches.some(s => s.kind === 'static')) {
      failures++;
      console.log(`FAIL run ${minutes} min contains static holds`);
    }
  }
}

const ids = AREAS.map(a => a.id);
for (let mask = 1; mask < 1 << ids.length; mask++) {
  const areas = ids.filter((_, i) => mask & (1 << i));
  for (const minutes of LENGTHS) check(areas.join('+'), { areas, minutes });
}

// Every stretch id referenced by a goal must exist.
for (const g of GOALS) {
  for (const id of g.stretches.concat(g.filler)) {
    if (!STRETCHES.some(s => s.id === id)) {
      failures++;
      console.log(`FAIL goal ${g.id} references missing stretch ${id}`);
    }
  }
}

console.log(failures ? `${failures} failure(s)` : 'All checks passed');
process.exit(failures ? 1 : 0);
