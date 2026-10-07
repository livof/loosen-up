// Stretch library + routine builder.
// Plain script: loaded by index.html, and by test.js in Node.

const PREP_SECS = 5;   // time to get into position before each stretch
const TOLERANCE = 30;  // routine total may be off by this many seconds
const MAX_ROUNDS = 3;  // max times a focus stretch repeats

// Order matters: routines play in this order
// (run warm-ups gentle -> active, then everything else top -> bottom).
// kind: "warmup" (dynamic, for runs) | "mobility" (moving) | "static" (hold) | "breath"
const STRETCHES = [
  { id: 'march', name: 'March in place', kind: 'warmup', areas: ['legs'], photo: 'drawing', secs: 30,
    how: 'March on the spot, lifting your knees and swinging your arms. Keep it easy.' },
  { id: 'arm-circles', name: 'Arm circles', kind: 'warmup', areas: ['shoulders'], photo: 'Arm_Circles', secs: 30,
    how: 'Arms out to the sides. Make circles, small to big, then reverse.' },
  { id: 'ankle-circles', name: 'Ankle circles', kind: 'warmup', areas: ['legs'], photo: 'Ankle_Circles', secs: 20, sides: true,
    how: 'Stand on one leg (hold a wall if needed). Circle the lifted ankle both ways.' },
  { id: 'hip-circles', name: 'Hip circles', kind: 'warmup', areas: ['hips', 'lowerBack'], photo: 'Standing_Hip_Circles', secs: 20, sides: true,
    how: 'Stand on one leg (hold a wall if needed). Lift the other knee and draw big circles with it, then reverse.' },
  { id: 'leg-swings', name: 'Leg swings (front to back)', kind: 'warmup', areas: ['hips', 'legs'], photo: 'Front_Leg_Raises', secs: 30, sides: true,
    how: 'Hold a chair or wall. Swing one leg forward and back, letting the range grow. Stay tall.' },
  { id: 'side-leg-swings', name: 'Leg swings (side to side)', kind: 'warmup', areas: ['hips', 'legs'], photo: 'Side_Leg_Raises', secs: 30, sides: true,
    how: 'Hold a chair or wall. Swing one leg out to the side, then across in front of the standing leg.' },
  { id: 'walking-lunges', name: 'Walking lunges', kind: 'warmup', areas: ['hips', 'legs'], photo: 'Bodyweight_Walking_Lunge', secs: 45,
    how: 'Step forward into a lunge, back knee towards the floor, then step through. Alternate legs.' },
  { id: 'butt-kicks', name: 'Butt kicks', kind: 'warmup', areas: ['legs'], photo: 'drawing', secs: 30,
    how: 'Jog on the spot, bringing your heels up towards your bum.' },
  { id: 'high-knees', name: 'High knees', kind: 'warmup', areas: ['hips', 'legs'], photo: 'drawing', secs: 30,
    how: 'Jog on the spot, driving your knees up to hip height. Light and quick.' },

  { id: 'breathing', name: 'Belly breathing', kind: 'breath', areas: [], photo: 'drawing', secs: 60,
    how: 'Sit or lie comfortably. Breathe in through your nose for 4, out slowly for 6. Let your belly rise.' },
  { id: 'shoulder-rolls', name: 'Shoulder rolls', kind: 'mobility', areas: ['shoulders', 'neck'], photo: 'Shoulder_Circles', secs: 30,
    how: 'Roll your shoulders up, back and down in slow big circles.' },
  { id: 'chin-tucks', name: 'Chin tucks', kind: 'mobility', areas: ['neck'], photo: 'drawing', still: true, secs: 30,
    how: 'Slide your chin straight back (make a double chin), hold 3 seconds, release. Repeat.' },
  { id: 'side-neck', name: 'Side neck stretch', kind: 'static', areas: ['neck', 'shoulders'], photo: 'Side_Neck_Stretch', secs: 30, sides: true,
    how: 'Tilt your ear towards your shoulder. Keep the other shoulder down. A hand on your head adds a light pull.' },
  { id: 'chest-opener', name: 'Chest opener', kind: 'mobility', areas: ['shoulders', 'upperBack'], photo: 'Dynamic_Chest_Stretch', secs: 30,
    how: 'Stand tall, arms straight out in front. Sweep them wide open and squeeze your shoulder blades together. Return slowly and repeat.' },
  { id: 'seated-twist', name: 'Seated twist', kind: 'static', areas: ['upperBack', 'lowerBack'], photo: 'Spinal_Stretch', secs: 30, sides: true,
    how: 'Sit tall, fingers behind your head, elbows wide. Turn your upper body to one side and hold. Grow taller as you breathe in.' },
  { id: 'open-book', name: 'Open book', kind: 'mobility', areas: ['upperBack', 'shoulders'], photo: 'drawing', secs: 40, sides: true,
    how: 'Lie on your side, knees bent, arms forward. Sweep the top arm open across your body, eyes follow. Return slowly.' },
  { id: 'back-extension', name: 'Standing back extension', kind: 'mobility', areas: ['lowerBack'], photo: 'Elbows_Back', secs: 30,
    how: 'Stand, hands on your lower back. Gently lean back, then return. Repeat slowly.' },
  { id: 'cat-cow', name: 'Cat–cow', kind: 'mobility', areas: ['upperBack', 'lowerBack'], photo: 'Cat_Stretch', secs: 45,
    how: 'On hands and knees. Breathe in and arch, breathe out and round your back. Move slowly.' },
  { id: 'childs-pose', name: "Child's pose", kind: 'static', areas: ['lowerBack', 'shoulders'], photo: 'Childs_Pose', secs: 60,
    how: 'Kneel, sit your hips back to your heels and reach your arms forward. Breathe into your back.' },
  { id: 'hip-flexor', name: 'Kneeling hip flexor stretch', kind: 'static', areas: ['hips', 'lowerBack'], photo: 'Kneeling_Hip_Flexor', secs: 30, sides: true,
    how: 'Kneel on one knee. Tuck your tailbone under and shift forward until you feel the front of the hip.' },
  { id: 'figure-4', name: 'Figure-4 stretch', kind: 'static', areas: ['hips', 'lowerBack'], photo: 'Ankle_On_The_Knee', secs: 30, sides: true,
    how: 'Lie on your back, knees bent. Cross one ankle over the other knee, hold the bottom thigh and pull both legs towards you.' },
  { id: 'lying-twist', name: 'Lying twist', kind: 'static', areas: ['lowerBack', 'hips'], photo: 'Knee_Across_The_Body', secs: 30, sides: true,
    how: 'Lie on your back, legs straight. Bend one knee and let it fall across your body, shoulders stay down. Look the other way.' },
  { id: 'hamstring', name: 'Lying hamstring stretch', kind: 'static', areas: ['legs', 'lowerBack'], photo: 'Leg-Up_Hamstring_Stretch', secs: 30, sides: true,
    how: 'Lie on your back. Hold behind one thigh and straighten that leg towards the ceiling. Keep the other leg relaxed on the floor.' },
  { id: 'calf', name: 'Wall calf stretch', kind: 'static', areas: ['legs'], photo: 'Calf_Stretch_Hands_Against_Wall', secs: 30, sides: true,
    how: 'Hands on a wall, one foot back, heel down, back leg straight. Lean in until you feel the calf.' },
  { id: 'legs-up-wall', name: 'Legs up the wall', kind: 'static', areas: ['legs', 'lowerBack'], photo: 'drawing', secs: 60,
    how: 'Lie with your bum near a wall and rest your legs up it. Arms relaxed. Slow your breathing.' },
];

const AREAS = [
  { id: 'neck', name: 'Neck' },
  { id: 'shoulders', name: 'Shoulders' },
  { id: 'upperBack', name: 'Upper back' },
  { id: 'lowerBack', name: 'Lower back' },
  { id: 'hips', name: 'Hips' },
  { id: 'legs', name: 'Legs' },
];

// Each goal lists stretches by priority (most important first).
// "filler" pads the routine to the chosen length and always plays first.
const GOALS = [
  { id: 'run', name: 'Warm up for a run', note: 'Moving stretches only', filler: 'march',
    stretches: ['leg-swings', 'hip-circles', 'walking-lunges', 'side-leg-swings', 'ankle-circles', 'high-knees', 'butt-kicks', 'arm-circles'] },
  { id: 'winddown', name: 'Wind down', note: 'Slow holds, ends lying down', filler: 'breathing',
    stretches: ['childs-pose', 'lying-twist', 'figure-4', 'side-neck', 'legs-up-wall', 'cat-cow', 'hamstring', 'chest-opener', 'open-book'] },
  { id: 'sitting', name: 'Sitting too much', note: 'Hips, chest, upper back, neck', filler: 'breathing',
    stretches: ['hip-flexor', 'chest-opener', 'chin-tucks', 'open-book', 'side-neck', 'back-extension', 'figure-4', 'cat-cow', 'seated-twist', 'shoulder-rolls', 'hamstring'] },
  { id: 'daily', name: 'Daily stretch', note: 'Balanced full body', filler: 'breathing',
    stretches: ['cat-cow', 'hip-flexor', 'side-neck', 'chest-opener', 'hamstring', 'figure-4', 'open-book', 'childs-pose', 'calf', 'lying-twist', 'shoulder-rolls', 'chin-tucks'] },
];

const LENGTHS = [2, 5, 10, 15]; // minutes

function byId(id) {
  return STRETCHES.find(s => s.id === id);
}

// Seconds a stretch takes, including prep time.
function stretchSecs(s) {
  return PREP_SECS + s.secs * (s.sides ? 2 : 1);
}

// Pick stretches until the target is reached.
// Primary stretches can repeat (rounds); secondary ones only fill in on round 1.
function buildRoutine({ goal, areas = [], minutes }) {
  const target = minutes * 60;
  let primary, secondary, filler;

  if (goal) {
    const g = GOALS.find(x => x.id === goal);
    primary = g.stretches.map(byId);
    secondary = [];
    filler = byId(g.filler);
  } else {
    const matches = s => s.kind !== 'warmup' && s.kind !== 'breath' && s.areas.some(a => areas.includes(a));
    primary = STRETCHES.filter(matches);
    const daily = GOALS.find(x => x.id === 'daily').stretches.map(byId);
    secondary = daily.filter(s => !primary.includes(s));
    filler = byId('breathing');
  }

  const picked = []; // { stretch, round }
  let total = 0;
  for (let round = 1; round <= MAX_ROUNDS && total < target - TOLERANCE; round++) {
    const pool = round === 1 ? primary.concat(secondary) : primary;
    for (const s of pool) {
      const secs = stretchSecs(s);
      if (total + secs <= target + TOLERANCE) {
        picked.push({ stretch: s, round });
        total += secs;
      }
    }
  }

  // Play in library order (repeats end up back to back).
  picked.sort((a, b) => STRETCHES.indexOf(a.stretch) - STRETCHES.indexOf(b.stretch));

  // Pad with the filler (played first) if we're still short.
  const gap = target - total;
  if (gap > TOLERANCE) {
    picked.unshift({ stretch: filler, round: 1, secs: gap - PREP_SECS });
  }

  // Expand into timer steps: a prep step, then one hold per side.
  const steps = [];
  picked.forEach((item, index) => {
    const s = item.stretch;
    const secs = item.secs || s.secs;
    steps.push({ stretch: s, index, phase: 'prep', secs: PREP_SECS });
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
  module.exports = { STRETCHES, AREAS, GOALS, LENGTHS, TOLERANCE, buildRoutine };
}
