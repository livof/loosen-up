# Loosen Up

A guided stretch timer. Pick what you need (a goal or body areas), pick 2 / 5 / 10 / 15 minutes, press start and follow along.

**Live:** https://livof.github.io/loosen-up/

Scope and decisions: [SCOPE.md](SCOPE.md)

## Files

- `index.html`: the page
- `style.css`: styles (light/dark follows your device)
- `routines.js`: stretch library, goals and the routine builder
- `app.js`: screens and the timer
- `test.js`: checks every goal/area combination fits each length

## Run locally

Open `index.html` in a browser. No install or build needed.

## Test

```
node test.js
```

## Add or change a stretch

Edit `STRETCHES` in `routines.js`. The order of that list is the order stretches play in.
To use it in a goal, add its `id` to that goal's `stretches` list (most important first).
Run `node test.js` afterwards.
