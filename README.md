# Loosen Up

A guided stretch timer. Pick what you need (a goal or body areas), whether you can get down on the floor, pick 2 / 5 / 10 / 15 minutes, press start and follow along.

**Live:** https://livof.github.io/loosen-up/

Scope and decisions: [SCOPE.md](SCOPE.md)

## Files

- `index.html`: the page
- `style.css`: styles (light/dark follows your device)
- `routines.js`: stretch library, goals and the routine builder
- `img/`: start/end pictures per stretch: photos (.jpg) from [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (public domain), or our own drawings (.svg)
- `tools/draw-figures.js`: generates the .svg drawings (`node tools/draw-figures.js img`)
- `app.js`: screens and the timer
- `test.js`: checks every goal/area combination fits each length

## Run locally

Open `index.html` in a browser. No install or build needed.

## Test

```
node test.js
```

## Add or change a stretch

Edit `STRETCHES` in `routines.js`. The order of that list is the order stretches play in,
and it must stay grouped by position: chair, then standing, then floor.
Every stretch needs a `pos` (`chair`, `standing` or `floor`).
A floor stretch can name a `desk` stand-in (a chair or standing version used at the desk);
without one it's left out at the desk. Mark a stand-in `deskOnly: true` if it shouldn't show up at home.
To use it in a goal, add its `id` to that goal's `stretches` list (most important first).
Every stretch needs a picture: add `img/<id>-0.jpg` (start) and `img/<id>-1.jpg` (end) and set `photo` to the source name,
or draw it in `tools/draw-figures.js` and set `photo: 'drawing'`.
If the movement is too small to show as two pictures, set `still: true` and add only the `-1` picture.
Run `node test.js` afterwards.
