// UI + timer. Data and routine building live in routines.js.

const $ = id => document.getElementById(id);

// ---------- Home: choices ----------
// The place is remembered on this device. Desk is the default: a desk routine works anywhere.
function savedPlace() {
  try { return localStorage.getItem('place') === 'home' ? 'home' : 'desk'; } catch (e) { return 'desk'; }
}
const choice = { goal: null, areas: [], minutes: 5, place: savedPlace() };

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

PLACES.forEach(p => {
  const b = makeButton(`${p.name}<small>${p.note}</small>`, () => {
    choice.place = p.id;
    try { localStorage.setItem('place', p.id); } catch (e) { /* not saved, still works */ }
    renderHome();
  });
  b.dataset.place = p.id;
  $('places').append(b);
});

LENGTHS.forEach(m => {
  const b = makeButton(`${m} min`, () => {
    choice.minutes = m;
    renderHome();
  });
  b.dataset.minutes = m;
  $('lengths').append(b);
});

// Pictures come in pairs: start (0) and end (1) position.
// Photos are .jpg; our own drawings (photo: 'drawing') are .svg.
function photoSrc(s, frame) {
  return `img/${s.id}-${frame}.${s.photo === 'drawing' ? 'svg' : 'jpg'}`;
}

function videoUrl(s) {
  const word = s.kind === 'static' ? 'stretch' : 'exercise';
  return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(`how to do ${s.name} ${word}`);
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
  document.querySelectorAll('[data-place]').forEach(b =>
    b.setAttribute('aria-pressed', b.dataset.place === choice.place));
  $('place-section').hidden = !usesPlace(choice.goal);

  // At the desk there's no 15-minute option; fall back to the longest one left.
  const lengths = lengthsFor(choice);
  if (!lengths.includes(choice.minutes)) choice.minutes = lengths[lengths.length - 1];
  document.querySelectorAll('[data-minutes]').forEach(b => {
    b.hidden = !lengths.includes(Number(b.dataset.minutes));
    b.setAttribute('aria-pressed', Number(b.dataset.minutes) === choice.minutes);
  });

  $('start').disabled = !hasChoice();
  if (!hasChoice()) {
    $('preview').innerHTML = '';
    return;
  }
  const r = buildRoutine(choice);
  const items = r.stretches.map(s => {
    const thumb = s.photo ? `<img src="${photoSrc(s, 1)}" alt="" loading="lazy">` : '<span class="no-photo"></span>';
    return `<li>${thumb}<span>${s.name}<small>${POSITIONS[s.pos]}</small></span></li>`;
  }).join('');
  $('preview').innerHTML =
    `<strong>${r.stretches.length} stretches · ${formatTime(r.total)}</strong><ol>${items}</ol>`;
}

// ---------- Beep ----------
let audio = null;

// Phones only allow sound after a tap, so this runs on Start and on every player button.
// Playing a silent sound inside the tap is what actually unlocks audio on iOS.
function unlockAudio() {
  if (!audio) {
    try { audio = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    const src = audio.createBufferSource();
    src.buffer = audio.createBuffer(1, 1, 22050);
    src.connect(audio.destination);
    src.start(0);
  }
  if (audio.state !== 'running') audio.resume().catch(() => {});
}

function beep() {
  if (navigator.vibrate) navigator.vibrate(200); // Android; iPhones ignore this
  if (!audio) return;
  if (audio.state !== 'running') audio.resume().catch(() => {});
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.frequency.value = 880;
  gain.gain.setValueAtTime(0.2, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.25);
  osc.connect(gain).connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + 0.25);
}

// ---------- Voice ----------
// Spoken cues, so you can follow along lying on the floor without looking at the screen.
// Off by default (it's a surprise in an open office); remembered on this device.
let voiceOn = false;
try { voiceOn = localStorage.getItem('voice') === 'on'; } catch (e) { /* stays off */ }

function say(text) {
  if (!voiceOn || !window.speechSynthesis) return;
  speechSynthesis.cancel();
  speechSynthesis.speak(new SpeechSynthesisUtterance(text));
}

function renderVoice() {
  $('voice').hidden = !window.speechSynthesis;
  $('voice').textContent = `Voice cues: ${voiceOn ? 'on' : 'off'}`;
  $('voice').setAttribute('aria-pressed', voiceOn);
}

function toggleVoice() {
  voiceOn = !voiceOn;
  try { localStorage.setItem('voice', voiceOn ? 'on' : 'off'); } catch (e) { /* not saved */ }
  renderVoice();
  say(voiceOn ? 'Voice on' : '');
}

function cueFor(step) {
  const s = step.stretch;
  if (step.phase === 'prep') return `${s.name}. ${step.toFloor ? 'Down to the floor.' : 'Get ready.'}`;
  if (step.phase === 'Right side') return 'Switch sides';
  if (step.phase === 'Left side') return 'Left side';
  return s.kind === 'breath' ? 'Breathe in' : 'Go';
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

// ---------- Keep the screen on ----------
// If the phone screen locks, the browser freezes the timer, so it never moves on.
let wakeLock = null;

async function keepAwake() {
  if (!('wakeLock' in navigator) || wakeLock) return;
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLock.addEventListener('release', () => { wakeLock = null; });
    if ($('player').hidden) allowSleep(); // session ended while we were waiting
  } catch (e) { wakeLock = null; }
}

function allowSleep() {
  if (wakeLock) wakeLock.release();
  wakeLock = null;
}

// The phone drops the wake lock when you switch apps; take it back on return.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && !$('player').hidden) keepAwake();
});

function startSession() {
  unlockAudio();
  keepAwake();
  routine = buildRoutine(choice);
  paused = false;
  show('player');
  goToStep(0);
}

function goToStep(n) {
  stepIndex = n;
  remainingMs = routine.steps[n].secs * 1000;
  renderStep();
  say(cueFor(routine.steps[n]));
  if (!paused) run();
}

function run() {
  endsAt = performance.now() + remainingMs;
  clearInterval(timer);
  timer = setInterval(tick, 200);
}

function tick() {
  remainingMs = endsAt - performance.now();
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
    remainingMs = endsAt - performance.now();
  }
  $('pause').textContent = paused ? 'Resume' : 'Pause';
}

function renderStep() {
  const step = routine.steps[stepIndex];
  const s = step.stretch;
  $('count').textContent = `Stretch ${step.index + 1} of ${routine.stretches.length}`;
  $('phase').textContent = step.phase !== 'prep' ? (s.kind === 'breath' ? '' : step.phase)
    : step.toFloor ? 'Get ready: down to the floor' : 'Get ready';
  $('name').textContent = s.name;
  $('how').textContent = s.how;
  $('video').href = videoUrl(s);
  $('photo').hidden = !s.photo;
  $('photo').classList.toggle('mirror', step.phase === 'Right side');
  if (s.photo) {
    // Only reset the images when the stretch changes, so the flip animation doesn't restart.
    // A still (s.still) has only one picture, the end frame, so nothing flips.
    const a = photoSrc(s, s.still ? 1 : 0);
    if (!$('photo-a').src.endsWith(a)) {
      $('photo-a').src = a;
      $('photo-a').alt = s.still ? s.name : `${s.name}: start position`;
      $('photo-b').hidden = !!s.still;
      if (!s.still) {
        $('photo-b').src = photoSrc(s, 1);
        $('photo-b').alt = `${s.name}: end position`;
      }
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
    (nextStretch.stretch.still ? [1] : [0, 1]).forEach(f => { new Image().src = photoSrc(nextStretch.stretch, f); });
  }

  renderClock();
}

// Breathing steps pace you: in for 4, out for 6.
function breathPhase(step) {
  const elapsed = step.secs - remainingMs / 1000;
  return elapsed % 10 < 4 ? 'Breathe in' : 'Breathe out';
}

function renderClock() {
  $('clock').textContent = formatTime(remainingMs / 1000);
  const step = routine.steps[stepIndex];
  if (step.stretch.kind === 'breath' && step.phase !== 'prep') {
    const text = breathPhase(step);
    if ($('phase').textContent !== text) {
      if (!paused && $('phase').textContent && remainingMs > 1000) say(text === 'Breathe in' ? 'In' : 'Out');
      $('phase').textContent = text;
    }
  }
  const done = routine.steps.slice(0, stepIndex).reduce((sum, st) => sum + st.secs, 0)
    + routine.steps[stepIndex].secs - remainingMs / 1000;
  $('bar-fill').style.width = `${Math.min(100, (done / routine.total) * 100)}%`;
}

function stopTimer() {
  clearInterval(timer);
  timer = null;
  allowSleep();
}

function finish() {
  stopTimer();
  beep();
  say('Done. Nice work.');
  $('done-text').textContent =
    `You did ${routine.stretches.length} stretches in ${formatTime(routine.total)}.`;
  show('done');
}

$('start').addEventListener('click', startSession);
$('pause').addEventListener('click', togglePause);
$('skip').addEventListener('click', nextStep);
$('back').addEventListener('click', () => { if (stepIndex > 0) goToStep(stepIndex - 1); });
$('quit').addEventListener('click', () => { stopTimer(); say(''); show('home'); });
$('voice').addEventListener('click', toggleVoice);
['pause', 'skip', 'back'].forEach(id => $(id).addEventListener('click', unlockAudio));
$('again').addEventListener('click', () => show('home'));
// Opening the video leaves the page; pause so you don't miss stretches while watching.
$('video').addEventListener('click', () => { if (!paused) togglePause(); });

// Space bar pauses/resumes on a laptop.
document.addEventListener('keydown', e => {
  if (e.code === 'Space' && !$('player').hidden && e.target === document.body) {
    e.preventDefault();
    togglePause();
  }
});

renderVoice();
renderHome();
