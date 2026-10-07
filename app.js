// UI + timer. Data and routine building live in routines.js.

const $ = id => document.getElementById(id);

// ---------- Home: choices ----------
const choice = { goal: null, areas: [], minutes: 5 };

function makeButton(html, onClick) {
  const b = document.createElement('button');
  b.innerHTML = html;
  b.addEventListener('click', onClick);
  return b;
}

GOALS.forEach(g => {
  const b = makeButton(`${g.name}<small>${g.note}</small>`, () => {
    choice.goal = choice.goal === g.id ? null : g.id;
    choice.areas = [];
    renderHome();
  });
  b.dataset.goal = g.id;
  $('goals').append(b);
});

AREAS.forEach(a => {
  const b = makeButton(a.name, () => {
    choice.goal = null;
    choice.areas = choice.areas.includes(a.id)
      ? choice.areas.filter(x => x !== a.id)
      : choice.areas.concat(a.id);
    renderHome();
  });
  b.dataset.area = a.id;
  $('areas').append(b);
});

LENGTHS.forEach(m => {
  const b = makeButton(`${m} min`, () => {
    choice.minutes = m;
    renderHome();
  });
  b.dataset.minutes = m;
  $('lengths').append(b);
});

// Photos come in pairs: start (0) and end (1) position.
function photoSrc(s, frame) {
  return `img/${s.id}-${frame}.jpg`;
}

function videoUrl(s) {
  return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(`how to do ${s.name} stretch`);
}

function hasChoice() {
  return choice.goal || choice.areas.length > 0;
}

function formatTime(secs) {
  const s = Math.max(0, Math.ceil(secs));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function renderHome() {
  document.querySelectorAll('[data-goal]').forEach(b =>
    b.setAttribute('aria-pressed', b.dataset.goal === choice.goal));
  document.querySelectorAll('[data-area]').forEach(b =>
    b.setAttribute('aria-pressed', choice.areas.includes(b.dataset.area)));
  document.querySelectorAll('[data-minutes]').forEach(b =>
    b.setAttribute('aria-pressed', Number(b.dataset.minutes) === choice.minutes));

  $('start').disabled = !hasChoice();
  if (!hasChoice()) {
    $('preview').innerHTML = '';
    return;
  }
  const r = buildRoutine(choice);
  const items = r.stretches.map(s => {
    const thumb = s.photo ? `<img src="${photoSrc(s, 1)}" alt="" loading="lazy">` : '<span class="no-photo"></span>';
    return `<li>${thumb}<span>${s.name}</span></li>`;
  }).join('');
  $('preview').innerHTML =
    `<strong>${r.stretches.length} stretches · ${formatTime(r.total)}</strong><ol>${items}</ol>`;
}

// ---------- Beep ----------
let audio = null;

function beep() {
  if (!audio) return;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.frequency.value = 880;
  gain.gain.setValueAtTime(0.2, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.25);
  osc.connect(gain).connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + 0.25);
}

// ---------- Player ----------
let routine = null;
let stepIndex = 0;
let remainingMs = 0;
let endsAt = 0;
let timer = null;
let paused = false;

function show(id) {
  ['home', 'player', 'done'].forEach(s => ($(s).hidden = s !== id));
  window.scrollTo(0, 0);
}

function startSession() {
  // Audio must be created on a tap (browser rule, especially iOS).
  if (!audio) {
    try { audio = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { audio = null; }
  }
  routine = buildRoutine(choice);
  paused = false;
  show('player');
  goToStep(0);
}

function goToStep(n) {
  stepIndex = n;
  remainingMs = routine.steps[n].secs * 1000;
  renderStep();
  if (!paused) run();
}

function run() {
  endsAt = Date.now() + remainingMs;
  clearInterval(timer);
  timer = setInterval(tick, 200);
}

function tick() {
  remainingMs = endsAt - Date.now();
  if (remainingMs <= 0) {
    nextStep();
    return;
  }
  renderClock();
}

function nextStep() {
  if (stepIndex + 1 >= routine.steps.length) {
    finish();
    return;
  }
  beep();
  goToStep(stepIndex + 1);
}

function togglePause() {
  if (paused) {
    paused = false;
    run();
  } else {
    paused = true;
    clearInterval(timer);
    remainingMs = endsAt - Date.now();
  }
  $('pause').textContent = paused ? 'Resume' : 'Pause';
}

function renderStep() {
  const step = routine.steps[stepIndex];
  const s = step.stretch;
  $('count').textContent = `Stretch ${step.index + 1} of ${routine.stretches.length}`;
  $('phase').textContent = step.phase === 'prep' ? 'Get ready' : step.phase;
  $('name').textContent = s.name;
  $('how').textContent = s.how;
  $('video').href = videoUrl(s);
  $('photo').hidden = !s.photo;
  $('photo').classList.toggle('mirror', step.phase === 'Right side');
  if (s.photo) {
    // Only reset the images when the stretch changes, so the flip animation doesn't restart.
    const a = photoSrc(s, 0);
    if (!$('photo-a').src.endsWith(a)) {
      $('photo-a').src = a;
      $('photo-b').src = photoSrc(s, 1);
      $('photo-a').alt = `${s.name}: start position`;
      $('photo-b').alt = `${s.name}: end position`;
    }
  }
  $('pause').textContent = paused ? 'Resume' : 'Pause';
  $('back').disabled = stepIndex === 0;

  const following = routine.steps[stepIndex + 1];
  const nextStretch = routine.steps.slice(stepIndex + 1).find(st => st.index !== step.index);
  if (following && following.index === step.index && step.phase === 'Left side') $('next').textContent = 'Next: Right side';
  else if (nextStretch) $('next').textContent = `Up next: ${nextStretch.stretch.name}`;
  else $('next').textContent = 'Last one';

  if (nextStretch && nextStretch.stretch.photo) {
    [0, 1].forEach(f => { new Image().src = photoSrc(nextStretch.stretch, f); });
  }

  renderClock();
}

function renderClock() {
  $('clock').textContent = formatTime(remainingMs / 1000);
  const done = routine.steps.slice(0, stepIndex).reduce((sum, st) => sum + st.secs, 0)
    + routine.steps[stepIndex].secs - remainingMs / 1000;
  $('bar-fill').style.width = `${Math.min(100, (done / routine.total) * 100)}%`;
}

function stopTimer() {
  clearInterval(timer);
  timer = null;
}

function finish() {
  stopTimer();
  beep();
  $('done-text').textContent =
    `You did ${routine.stretches.length} stretches in ${formatTime(routine.total)}.`;
  show('done');
}

$('start').addEventListener('click', startSession);
$('pause').addEventListener('click', togglePause);
$('skip').addEventListener('click', nextStep);
$('back').addEventListener('click', () => { if (stepIndex > 0) goToStep(stepIndex - 1); });
$('quit').addEventListener('click', () => { stopTimer(); show('home'); });
$('again').addEventListener('click', () => show('home'));

// Space bar pauses/resumes on a laptop.
document.addEventListener('keydown', e => {
  if (e.code === 'Space' && !$('player').hidden && e.target === document.body) {
    e.preventDefault();
    togglePause();
  }
});

renderHome();
