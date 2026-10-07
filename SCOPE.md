# Loosen Up — Scope (v1 / MVP)

A simple web app that guides you through a stretch routine with a timer.
Pick what you need, pick how long you have, press start, follow along.

## Who it's for

Me, plus colleagues and friends I share the link with. No login.

## Must work on

Phone, tablet and laptop, at any screen size, in any modern browser.

## User flow

1. **Choose what you need**, using one of two options:
   - **A goal**: Warm up for a run · Wind down · Sitting too much · Daily stretch
   - **Body areas** (pick one or more): Neck · Shoulders · Upper back · Lower back · Hips · Legs
2. **Choose how long**: 2 / 5 / 10 / 15 min
3. **Start**. The guided timer shows:
   - the current stretch name and a short text on how to do it
   - a countdown for the current step
   - what comes next
   - overall progress
4. **Controls**: Start/Pause · Skip · Back
5. A **beep** plays when switching to the next stretch or side.
6. A **done** screen appears at the end.

## Stretch content

- Text only (no images or videos in v1).
- Each stretch in the library is tagged with:
  - the **areas** it targets
  - its **type**: `dynamic` (moving, reps) or `static` (hold)
  - whether it's **per side** (the app splits it into left and right steps)
  - a **default duration**
- Initial library: the stretches from the researched routine (belly breathing, chin tucks,
  side neck, doorway chest, open book, cat–cow, child's pose, kneeling hip flexor,
  figure-4, lying twist, legs up the wall, shoulder rolls, seated twist, standing back
  extension), plus a few dynamic ones for the run warm-up (leg swings, hip circles,
  walking lunges, ankle circles, arm circles).

## How routines are built (rules, based on the research)

| Goal | Uses | Notes |
|---|---|---|
| Warm up for a run | **Dynamic only** | No long static holds before running, since they can briefly reduce strength |
| Wind down | Static + breathing | Gets calmer as it goes; ends lying down |
| Sitting too much | Static + gentle mobility | Hip flexors, chest, upper back, neck |
| Daily stretch | Mix | Balanced full body |
| Body areas | Stretches tagged with the chosen areas | Static, plus the occasional mobility move |

- Static holds last 20–30 s. When there's time, aim for about 60 s in total per muscle.
- Order runs top to bottom (neck → back → hips → legs), except the run warm-up, which goes
  from gentle to more active.
- To fit the chosen length, use **fewer stretches**, not holds shorter than 20 s.
- The total routine should land within about ±30 s of the chosen length.

## Safety note (shown in the app)

Stretch to mild tension, never pain. Don't bounce. Stop and see a professional
if you feel numbness, tingling, or pain that spreads or gets worse.

## Tech

- Plain HTML + CSS + JavaScript, with no framework, build step or dependencies.
- Public GitHub repo `loosen-up`, hosted free on **GitHub Pages**.
- Language: English.

## Out of scope for v1 (maybe later)

- History or streaks
- Break reminders
- Accounts or sync
- Voice, vibration, keeping the screen awake
- Illustrations or videos
- Building your own custom routine
- Other languages
- Tappable body map

## Done when

- Every goal, and every combination of areas, produces a routine for each length (2/5/10/15)
  that lands within about ±30 s of that length.
- The timer runs start to finish with pause, skip and back working, and with no console errors.
- The layout works at phone width (360 px) up to desktop.
- The app is live on GitHub Pages and the README contains the link.
