# css/

Styles for the worker app.

| File | Purpose |
|---|---|
| `app.css` | Every style of `index.html`: colour tokens (light/dark), per-language fonts, components in screen order, phone tap fixes, install card, code gate |

Rules: colours only through the tokens on `:root` (and their dark-mode copies); hover effects only inside
`@media (hover: hover)`; tap targets at least 44 px; check Arabic and Urdu (right-to-left; Urdu's
Nastaliq lines are tall), Malayalam and Tamil (long words, must not widen the page) and the Bangla/Hindi/Nepali
line heights whenever text styles change; the browser test checks every language fits 390 px.
