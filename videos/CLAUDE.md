# videos/

Short cartoon clips the worker app shows: the "Key words" card and the right-or-wrong video questions (D27, D31).
Served as they are; not saved for offline use (big, and phones fetch them in parts), so tests started offline
leave the clip questions out. Drawing code and what each clip shows: `scripts/clips/CLAUDE.md`.

| File | Purpose |
|---|---|
| `cross-contamination.mp4` | 13 s cartoon (1280x720, H.264, no sound): a carrot cut on a green board, the slices moved into a bowl, then raw chicken cut on the same board without cleaning it. Used by the "Key words" card w06 (`data/words.json`, D27) and question k313 (wrong) |
| `handwash-right.mp4` | 14 s, right: proper hand washing (k310) |
| `handwash-wrong.mp4` | 9 s, wrong: no soap, hands dried on the apron (k311) |
| `boards-right.mp4` | 12.5 s, right: red board for raw chicken, clean green board for the carrot (k312) |
| `taste-wrong.mp4` | 9.5 s, wrong: tasting with a finger (k314) |
| `taste-right.mp4` | 10.5 s, right: tasting with a clean spoon used once (k315) |
| `fridge-wrong.mp4` | 10.5 s, wrong: uncovered raw chicken above a cake, dripping (k316) |
| `fridge-right.mp4` | 10 s, right: covered raw chicken on the bottom shelf (k317) |
| `probe-right.mp4` | 13 s, right: clean probe in the thickest part, 76°C (k318) |
| `sneeze-wrong.mp4` | 10 s, wrong: sneezing over an open salad (k319) |
| `plaster-right.mp4` | 13 s, right: blue plaster and a glove on a cut finger (k320) |
| `phone-gloves-wrong.mp4` | 10.5 s, wrong: phone then food with the same gloves (k321) |

Rules: keep clips short (under 1 MB) and without sound or words, so they work in every language. Made by drawing
each frame with code and joining them with ffmpeg (the method is in docs/plan.md "Make a clip").
