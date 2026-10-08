// Stretch library + routine builder.
// Plain script: loaded by index.html, and by test.js in Node.

const PREP_SECS = 5;   // time to get into position before each stretch
const FLOOR_PREP = 10; // longer prep before the first floor stretch (getting down takes time)
const TOLERANCE = 30;  // routine total may be off by this many seconds
const MAX_ROUNDS = 3;  // max times a focus stretch repeats

// Order matters: routines play in this order. Run warm-ups come first (gentle -> active).
// The rest is grouped by position (chair -> standing -> floor) so you only change position
// once or twice, and goes roughly top -> bottom within each group.
// kind: "warmup" (dynamic, for runs) | "mobility" (moving) | "static" (hold) | "breath"
// pos:  "chair" | "standing" | "floor"
// desk: a floor stretch's stand-in when you're at your desk (no desk = left out at the desk)
// deskOnly: a stand-in that's left out at home, where the floor version is better
const STRETCHES = [
  { id: 'march', name: 'March in place', kind: 'warmup', pos: 'standing', areas: ['legs'], photo: 'drawing', secs: 30,
    how: 'March on the spot, lifting your knees and swinging your arms. Keep it easy.' },
  { id: 'arm-circles', name: 'Arm circles', kind: 'warmup', pos: 'standing', areas: ['shoulders'], photo: 'Arm_Circles', secs: 30,
    how: 'Arms out to the sides. Make circles, small to big, then reverse.' },
  { id: 'ankle-circles', name: 'Ankle circles', kind: 'warmup', pos: 'standing', areas: ['legs'], photo: 'Ankle_Circles', secs: 20, sides: true,
    how: 'Stand on one leg (hold a wall if needed). Circle the lifted ankle both ways.' },
  { id: 'hip-circles', name: 'Hip circles', kind: 'warmup', pos: 'standing', areas: ['hips', 'lowerBack'], photo: 'Standing_Hip_Circles', secs: 20, sides: true,
    how: 'Stand on one leg (hold a wall if needed). Lift the other knee and draw big circles with it, then reverse.' },
  { id: 'leg-swings', name: 'Leg swings (front to back)', kind: 'warmup', pos: 'standing', areas: ['hips', 'legs'], photo: 'Front_Leg_Raises', secs: 30, sides: true,
    how: 'Hold a wall or something steady (not a chair on wheels). Swing one leg forward and back, letting the range grow. Stay tall.' },
  { id: 'side-leg-swings', name: 'Leg swings (side to side)', kind: 'warmup', pos: 'standing', areas: ['hips', 'legs'], photo: 'Side_Leg_Raises', secs: 30, sides: true,
    how: 'Hold a wall or something steady (not a chair on wheels). Swing one leg out to the side, then across in front of the standing leg.' },
  { id: 'walking-lunges', name: 'Walking lunges', kind: 'warmup', pos: 'standing', areas: ['hips', 'legs'], photo: 'Bodyweight_Walking_Lunge', secs: 45,
    how: 'Step forward into a lunge, back knee towards the floor, then step through. Alternate legs.' },
  { id: 'butt-kicks', name: 'Butt kicks', kind: 'warmup', pos: 'standing', areas: ['legs'], photo: 'drawing', secs: 30,
    how: 'Jog on the spot, bringing your heels up towards your bum.' },
  { id: 'high-knees', name: 'High knees', kind: 'warmup', pos: 'standing', areas: ['hips', 'legs'], photo: 'drawing', secs: 30,
    how: 'Jog on the spot, driving your knees up to hip height. Light and quick.' },

  // Chair
  { id: 'breathing', name: 'Belly breathing', kind: 'breath', pos: 'chair', areas: [], photo: 'drawing', secs: 60,
    how: 'Sit or lie comfortably. Breathe in through your nose for 4, out slowly for 6. Let your belly rise.' },
  { id: 'shoulder-rolls', name: 'Shoulder rolls', kind: 'mobility', pos: 'chair', areas: ['shoulders', 'neck'], photo: 'Shoulder_Circles', secs: 30,
    how: 'Roll your shoulders up, back and down in slow big circles.' },
  { id: 'chin-tucks', name: 'Chin tucks', kind: 'mobility', pos: 'chair', areas: ['neck'], photo: 'drawing', still: true, secs: 30,
    how: 'Slide your chin straight back (make a double chin), hold 3 seconds, release. Repeat.' },
  { id: 'side-neck', name: 'Side neck stretch', kind: 'static', pos: 'chair', areas: ['neck', 'shoulders'], photo: 'Side_Neck_Stretch', secs: 30, sides: true,
    how: 'Sit tall and hold the edge of your seat with one hand. Tilt your other ear towards your shoulder. A hand on your head adds a light pull.' },
  { id: 'wrist-stretch', name: 'Wrist and forearm stretch', kind: 'static', pos: 'chair', areas: ['arms'], photo: 'drawing', secs: 30, sides: true,
    how: 'Arm straight out in front. With the other hand, gently pull the fingers down for a few breaths, then turn the palm up and pull them back.' },
  { id: 'w-squeeze', name: 'W squeeze', kind: 'mobility', pos: 'chair', areas: ['upperBack', 'shoulders'], photo: 'drawing', secs: 30,
    how: 'Sit tall, arms bent in front. Pull your elbows down and back into a W and squeeze your shoulder blades together. Hold 3 seconds, release. Repeat.' },
  { id: 'seated-cat-cow', name: 'Seated cat–cow', kind: 'mobility', pos: 'chair', areas: ['upperBack', 'lowerBack'], photo: 'drawing', deskOnly: true, secs: 30,
    how: 'Hands on your knees. Breathe in, arch your back and look up. Breathe out, round your back and look down. Move slowly.' },
  { id: 'seated-twist', name: 'Seated twist', kind: 'static', pos: 'chair', areas: ['upperBack', 'lowerBack'], photo: 'Spinal_Stretch', secs: 30, sides: true,
    how: 'Sit tall, fingers behind your head, elbows wide. Turn your upper body to one side and hold. Grow taller as you breathe in.' },
  { id: 'seated-side-bend', name: 'Seated side bend', kind: 'static', pos: 'chair', areas: ['lowerBack', 'upperBack'], photo: 'Chair_Lower_Back_Stretch', secs: 20, sides: true,
    how: 'Sit tall and hold the seat with one hand. Reach the other arm overhead and lean away from it. Keep both sit bones down.' },
  { id: 'seated-figure-4', name: 'Seated figure-4', kind: 'static', pos: 'chair', areas: ['hips', 'lowerBack'], photo: 'drawing', deskOnly: true, secs: 30, sides: true,
    how: 'Cross one ankle over the other knee. Keep your back long and lean forward from your hips until you feel it in your bum.' },
  { id: 'seated-hamstring', name: 'Seated hamstring stretch', kind: 'static', pos: 'chair', areas: ['legs', 'lowerBack'], photo: 'drawing', deskOnly: true, secs: 30, sides: true,
    how: 'Sit near the front of your chair. Straighten one leg, heel on the floor, toes up. Keep your back long and lean forward from your hips.' },

  // Standing
  { id: 'chair-squats', name: 'Chair squats', kind: 'mobility', pos: 'standing', areas: ['hips', 'legs'], photo: 'Sit_Squats', deskOnly: true, secs: 30,
    how: 'Stand in front of your chair, feet hip-width. Sit back until you just touch the seat, then stand up tall and squeeze your bum. Slow and steady.' },
  { id: 'chest-opener', name: 'Chest opener', kind: 'mobility', pos: 'standing', areas: ['shoulders', 'upperBack'], photo: 'Dynamic_Chest_Stretch', secs: 30,
    how: 'Stand tall, arms straight out in front. Sweep them wide open and squeeze your shoulder blades together. Return slowly and repeat.' },
  { id: 'back-extension', name: 'Standing back extension', kind: 'mobility', pos: 'standing', areas: ['lowerBack'], photo: 'Elbows_Back', secs: 30,
    how: 'Stand, hands on your lower back. Gently lean back, then return. Repeat slowly.' },
  { id: 'hip-flexor-standing', name: 'Standing hip flexor stretch', kind: 'static', pos: 'standing', areas: ['hips', 'lowerBack'], photo: 'Standing_Hip_Flexors', deskOnly: true, secs: 30, sides: true,
    how: 'Step one foot back, back heel up. Tuck your tailbone under, squeeze that bum cheek and bend your knees a little until you feel the front of the back hip.' },
  { id: 'calf', name: 'Calf stretch', kind: 'static', pos: 'standing', areas: ['legs'], photo: 'Calf_Stretch_Hands_Against_Wall', secs: 30, sides: true,
    how: 'Hands on a wall or your desk, one foot back, heel down, back leg straight. Lean in until you feel the calf.' },

  // Floor (kneeling -> face down -> on your side -> on your back)
  { id: 'cat-cow', name: 'Cat–cow', kind: 'mobility', pos: 'floor', desk: 'seated-cat-cow', areas: ['upperBack', 'lowerBack'], photo: 'Cat_Stretch', secs: 45,
    how: 'On hands and knees. Breathe in and arch, breathe out and round your back. Move slowly.' },
  { id: 'childs-pose', name: "Child's pose", kind: 'static', pos: 'floor', areas: ['lowerBack', 'shoulders'], photo: 'Childs_Pose', secs: 60,
    how: 'Kneel, sit your hips back to your heels and reach your arms forward. Breathe into your back.' },
  { id: 'hip-flexor', name: 'Kneeling hip flexor stretch', kind: 'static', pos: 'floor', desk: 'hip-flexor-standing', areas: ['hips', 'lowerBack'], photo: 'Kneeling_Hip_Flexor', secs: 30, sides: true,
    how: 'Kneel on one knee. Tuck your tailbone under and shift forward until you feel the front of the hip.' },
  { id: 'sphinx', name: 'Sphinx', kind: 'static', pos: 'floor', desk: 'back-extension', areas: ['lowerBack'], photo: 'drawing', secs: 30,
    how: 'Lie on your front. Prop yourself up on your forearms, elbows under your shoulders, hips on the floor. Relax your bum. If your lower back pinches, come lower.' },
  { id: 'open-book', name: 'Open book', kind: 'mobility', pos: 'floor', desk: 'seated-twist', areas: ['upperBack', 'shoulders'], photo: 'drawing', secs: 40, sides: true,
    how: 'Lie on your side, knees bent, arms forward. Sweep the top arm open across your body, eyes follow. Return slowly.' },
  { id: 'glute-bridge', name: 'Glute bridge', kind: 'mobility', pos: 'floor', desk: 'chair-squats', areas: ['hips', 'legs'], photo: 'Pelvic_Tilt_Into_Bridge', secs: 30,
    how: 'Lie on your back, knees bent, feet flat. Squeeze your bum and lift your hips until your body is a straight line. Lower slowly. Repeat.' },
  { id: 'figure-4', name: 'Figure-4 stretch', kind: 'static', pos: 'floor', desk: 'seated-figure-4', areas: ['hips', 'lowerBack'], photo: 'Ankle_On_The_Knee', secs: 30, sides: true,
    how: 'Lie on your back, knees bent. Cross one ankle over the other knee, hold the bottom thigh and pull both legs towards you.' },
  { id: 'lying-twist', name: 'Lying twist', kind: 'static', pos: 'floor', areas: ['lowerBack', 'hips'], photo: 'Knee_Across_The_Body', secs: 30, sides: true,
    how: 'Lie on your back, legs straight. Bend one knee and let it fall across your body, shoulders stay down. Look the other way.' },
  { id: 'hamstring', name: 'Lying hamstring stretch', kind: 'static', pos: 'floor', desk: 'seated-hamstring', areas: ['legs', 'lowerBack'], photo: 'Leg-Up_Hamstring_Stretch', secs: 30, sides: true,
    how: 'Lie on your back. Hold behind one thigh and straighten that leg towards the ceiling. Keep the other leg relaxed on the floor.' },
  { id: 'legs-up-wall', name: 'Legs up the wall', kind: 'static', pos: 'floor', areas: ['legs', 'lowerBack'], photo: 'drawing', secs: 60,
    how: 'Lie with your bum near a wall and rest your legs up it. Arms relaxed. Slow your breathing.' },
];

const AREAS = [
  { id: 'neck', name: 'Neck' },
  { id: 'shoulders', name: 'Shoulders' },
  { id: 'upperBack', name: 'Upper back' },
  { id: 'lowerBack', name: 'Lower back' },
  { id: 'arms', name: 'Wrists & arms' },
  { id: 'hips', name: 'Hips' },
  { id: 'legs', name: 'Legs' },
];

const PLACES = [
  { id: 'desk', name: 'At my desk', note: 'Chair and standing, no floor' },
  { id: 'home', name: 'At home', note: 'Floor is fine' },
];

const POSITIONS = { chair: 'Chair', standing: 'Standing', floor: 'Floor' };

// Each goal lists stretches by priority (most important first).
// At the desk, floor stretches turn into their stand-ins (see forPlace).
// "filler" pads the routine to the chosen length.
// anyPlace: the goal is the same wherever you are (no place choice).
const GOALS = [
  { id: 'run', name: 'Warm up for a run', note: 'Moving stretches only', filler: 'march', anyPlace: true,
    stretches: ['leg-swings', 'hip-circles', 'walking-lunges', 'side-leg-swings', 'ankle-circles', 'high-knees', 'butt-kicks', 'arm-circles'] },
  { id: 'winddown', name: 'Wind down', note: 'Slow holds and breathing', filler: 'breathing',
    stretches: ['childs-pose', 'lying-twist', 'figure-4', 'side-neck', 'legs-up-wall', 'cat-cow', 'hamstring', 'chest-opener', 'open-book'] },
  // Movement first: breaking up sitting matters more than any single stretch.
  { id: 'sitting', name: 'Sitting too much', note: 'Get moving, open hips and chest', filler: 'breathing',
    stretches: ['glute-bridge', 'hip-flexor', 'chin-tucks', 'w-squeeze', 'chest-opener', 'open-book', 'sphinx', 'cat-cow', 'side-neck', 'figure-4', 'wrist-stretch', 'hamstring', 'shoulder-rolls'] },
  { id: 'daily', name: 'Daily stretch', note: 'Balanced full body', filler: 'breathing',
    stretches: ['cat-cow', 'hip-flexor', 'side-neck', 'chest-opener', 'hamstring', 'figure-4', 'open-book', 'childs-pose', 'calf', 'lying-twist', 'shoulder-rolls', 'chin-tucks'] },
];

const LENGTHS = [2, 5, 10, 15]; // minutes
const DESK_LENGTHS = [2, 5, 10]; // nobody does 15 minutes at their desk

function byId(id) {
  return STRETCHES.find(s => s.id === id);
}

function goalById(id) {
  return GOALS.find(g => g.id === id);
}

// The place only matters when the goal isn't the same everywhere.
function usesPlace(goal) {
  const g = goalById(goal);
  return !(g && g.anyPlace);
}

function lengthsFor({ goal, place }) {
  return place === 'desk' && usesPlace(goal) ? DESK_LENGTHS : LENGTHS;
}

// At the desk: floor stretches become their stand-in (or drop out).
// At home: the desk stand-ins drop out, since the floor version is there.
function forPlace(list, place) {
  const out = place === 'desk'
    ? list.map(s => (s.pos === 'floor' ? (s.desk ? byId(s.desk) : null) : s))
    : list.filter(s => !s.deskOnly);
  return [...new Set(out.filter(Boolean))];
}

// Seconds a stretch takes, including prep time.
function stretchSecs(s) {
  return PREP_SECS + s.secs * (s.sides ? 2 : 1);
}

// Pick stretches until the target is reached.
// Primary stretches can repeat (rounds); secondary ones only fill in on round 1.
function buildRoutine({ goal, areas = [], minutes, place = 'home' }) {
  const target = minutes * 60;
  if (!usesPlace(goal)) place = 'home';
  let primary, secondary, filler;

  if (goal) {
    const g = goalById(goal);
    primary = forPlace(g.stretches.map(byId), place);
    secondary = [];
    filler = byId(g.filler);
  } else {
    const matches = s => s.kind !== 'warmup' && s.kind !== 'breath' && s.areas.some(a => areas.includes(a));
    primary = forPlace(STRETCHES.filter(matches), place);
    const daily = forPlace(goalById('daily').stretches.map(byId), place);
    secondary = daily.filter(s => !primary.includes(s));
    filler = byId('breathing');
  }

  const picked = []; // { stretch, round }
  let total = 0;
  let floorPicked = false; // the first floor stretch gets a longer prep
  for (let round = 1; round <= MAX_ROUNDS && total < target - TOLERANCE; round++) {
    const pool = round === 1 ? primary.concat(secondary) : primary;
    for (const s of pool) {
      const extra = s.pos === 'floor' && !floorPicked ? FLOOR_PREP - PREP_SECS : 0;
      const secs = stretchSecs(s) + extra;
      if (total + secs <= target + TOLERANCE) {
        picked.push({ stretch: s, round });
        total += secs;
        if (s.pos === 'floor') floorPicked = true;
      }
    }
  }

  // Play in library order: grouped by position, repeats back to back.
  picked.sort((a, b) => STRETCHES.indexOf(a.stretch) - STRETCHES.indexOf(b.stretch));

  // Pad with the filler if we're still short. It opens the routine, except breathing at home,
  // which makes a calm finish (lying down, if you ended on the floor).
  const gap = target - total;
  if (gap > TOLERANCE) {
    const pad = { stretch: filler, round: 1, secs: gap - PREP_SECS };
    if (place === 'home' && filler.kind === 'breath') picked.push(pad);
    else picked.unshift(pad);
  }

  // Expand into timer steps: a prep step, then one hold per side.
  const steps = [];
  let onFloor = false;
  picked.forEach((item, index) => {
    const s = item.stretch;
    const secs = item.secs || s.secs;
    const toFloor = s.pos === 'floor' && !onFloor;
    if (s.pos === 'floor') onFloor = true;
    steps.push({ stretch: s, index, phase: 'prep', toFloor, secs: toFloor ? FLOOR_PREP : PREP_SECS });
    if (s.sides) {
      steps.push({ stretch: s, index, phase: 'Left side', secs });
      steps.push({ stretch: s, index, phase: 'Right side', secs });
    } else {
      steps.push({ stretch: s, index, phase: s.kind === 'static' ? 'Hold' : 'Move', secs });
    }
  });

  return {
    stretches: picked.map(p => p.stretch),
    steps,
    total: steps.reduce((sum, st) => sum + st.secs, 0),
  };
}

if (typeof module !== 'undefined') {
  module.exports = { STRETCHES, AREAS, PLACES, POSITIONS, GOALS, LENGTHS, TOLERANCE, usesPlace, lengthsFor, buildRoutine };
}
