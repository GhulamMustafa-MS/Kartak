# icons/

Worker app icons (green card with a tick). Made from `icon.svg` by `scripts/make-icons.mjs` with background
`#0A6B4E`; never edit the PNGs by hand.

| File | Purpose |
|---|---|
| `icon.svg` | The source drawing (512 × 512) |
| `icon-512.png`, `icon-192.png` | App icons listed in `manifest.webmanifest` (Android, install) |
| `maskable-512.png` | Android adaptive icon: drawing at 80% so masks never cut it |
| `apple-touch-icon.png` | iPhone home-screen icon (180 × 180) |
| `favicon-32.png` | Browser tab icon |

After changing the drawing, re-run the script and bump `CACHE` in `sw.js` so phones fetch the new icons.
