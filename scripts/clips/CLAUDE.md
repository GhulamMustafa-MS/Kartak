# scripts/clips/

The drawing code of every cartoon clip (D27, D31). Each `<name>.html` draws one clip frame by frame on a
1280x720 canvas (`window.render(t)`, t in seconds); `scripts/make-clip.mjs` turns it into `videos/<name>.mp4`.
No images, no words, no sound, so a clip can be changed and re-rendered, and works in every language.

| File | Purpose | Seconds | Used by |
|---|---|---|---|
| `lib.js` | Shared drawing code: wall, counter, worker in white jacket and hair cover, arms, hands (optional glove colour), boards in four colours, knife, carrot, chicken, bowl, tray, and the helpers `ph`, `ease`, `lerp`, `L`, `rr` | - | every clip below except cross-contamination |
| `handwash-scene.js` | Hand-wash sink scene (sink, tap and water, liquid soap, paper towels, pedal bin, clock, bigger hands), loaded after `lib.js` | - | the two hand-washing clips |
| `cross-contamination.html` | WRONG: a carrot cut on the green board, then raw chicken cut on the same board (has its own copy of the drawing code) | 13 | Key words w06, question k313 |
| `handwash-right.html` | RIGHT: water, liquid soap, long rubbing with lather, rinse, paper towel, tap off with the towel, towel in the pedal bin | 14 | k310 |
| `handwash-wrong.html` | WRONG: a quick splash with no soap, hands wiped on the apron, back to the board | 9 | k311 |
| `boards-right.html` | RIGHT: raw chicken on the red board, board and knife into the sink, carrot on a clean green board with a green knife | 12.5 | k312 |
| `taste-wrong.html` | WRONG: tastes the sauce with a finger, then puts the finger back in the pot | 9.5 | k314 |
| `taste-right.html` | RIGHT: tastes with a clean teaspoon, used once, then put in the used-spoon bowl | 10.5 | k315 |
| `fridge-wrong.html` | WRONG: uncovered raw chicken on the top shelf drips onto a cake below | 10.5 | k316 |
| `fridge-right.html` | RIGHT: covered raw chicken on the bottom shelf, ready-to-eat food above, door closed | 10 | k317 |
| `probe-right.html` | RIGHT: probe wiped, pushed into the thickest part, display settles at 76°C, wiped again | 13 | k318 |
| `sneeze-wrong.html` | WRONG: sneezes over an open salad and carries on without washing | 10 | k319 |
| `plaster-right.html` | RIGHT: cut finger moved away from the food, blue plaster, glove over it, back to cutting | 13 | k320 |
| `phone-gloves-wrong.html` | WRONG: answers the phone in food gloves, then touches the bread with the same gloves | 10.5 | k321 |

Rules: a RIGHT clip contains no mistake at all; a WRONG clip exactly one, big and slow enough for a phone screen.
No ticks, crosses or faces that give the answer away. Keep each MP4 under 1 MB. Render with
`node scripts/make-clip.mjs <name> <seconds>` from the repo root, then add the clip to `videos/CLAUDE.md`.
