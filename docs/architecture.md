# Architecture

**The one home for how the system fits together**: pieces, addresses, IDs and data flow. Endpoints are in
[api.md](api.md); why it is built this way is in [design_decisions.md](design_decisions.md) (D8, D12, D16).

## Pieces

```
 Worker's phone                         Seller's phone
 kartak-app.vercel.app                  kartak-seller.vercel.app
 index.html + css/ + js/ + data/        seller/index.html + seller/css/ + seller/js/
 sw.js (offline), manifest              seller/sw.js, seller/manifest
        |  POST /api/activate, /api/transfer        |  POST https://kartak-app.vercel.app/api/admin (CORS)
        v                                            v
 Vercel project "kartak": api/*.js (Node serverless functions, region lhr1)
        |  SQL over HTTPS (@neondatabase/serverless), env DATABASE_URL
        v
 Neon Postgres: project "amigodb" (aws-eu-west-2), database "kartak", role "kartak_app"
 tables kartak_codes, kartak_settings (db/schema.sql)
```

## Addresses and IDs (not secrets)

| What | Value |
|---|---|
| GitHub repo | `GhulamMustafa-MS/Kartak` (public), branch `main`; every push deploys both Vercel projects |
| Vercel team | `ghulam-mustafas-projects-95532a5c` (`team_Uownncm500CsZvKlhqzUN73N`) |
| Vercel project `kartak` | `prj_t8sMnZWt9TSjEzx5kFXIMCU7NSsn`; root = repo root; domains kartak-app.vercel.app (main), kartak-test.vercel.app, kartak-ten.vercel.app; functions region lhr1; env `DATABASE_URL`; `.vercelignore` keeps seller/, tests/, docs/, scripts/, db/ out |
| Vercel project `kartak-seller` | `prj_kzAP1RXbTQBCzuq8ecIh9pptePM6`; root directory `seller/`; domain kartak-seller.vercel.app |
| Deployment protection | Vercel login only on preview deployments; production is public (workers must not see a login) |
| Neon | project `amigodb` (`tiny-feather-54250543`), branch `main` (`br-green-wind-za4mff7b`), database `kartak`, role `kartak_app`. The same project also holds the Amigos app's `neondb`; Kartak never touches it |
| Old address | `ghulammustafa-ms.github.io/Kartak/` (GitHub Pages) forwards to kartak-app.vercel.app (one-line script in index.html) |

**Secrets** (never in the repo): the Neon password is inside `DATABASE_URL` in the Vercel project settings;
the seller password is known to Mustafa and Wessam and stored only as a SHA-256 hash in `kartak_settings`.

## Data flow

1. **First visit:** the worker picks a language (localStorage `jahiz-lang`), sees the code screen, types the
   code; `js/app.js` sends `{code, device}` to `/api/activate`. On OK it stores `kartak-code`.
2. **Every launch:** the app shows straight away and re-checks the code in the background; if the server says
   the code is used elsewhere, turned off or deleted, it forgets it and shows the code screen.
3. **Questions:** `data/questions.json` is fetched once per launch; `sw.js` keeps a copy for offline use
   (network first, so updates arrive on the next launch with internet).
4. **Tests** run entirely on the phone; no answers or scores are sent anywhere (only the best full-mock
   percentage is kept on the phone, `kartak-best-full`).
5. **iPhone home screen:** Safari asks `/api/transfer` for a one-time token and puts it in the address; the
   home-screen copy redeems it on first launch (D13).
6. **Seller:** every action posts to `/api/admin` with the password; the response is the full code list.

## Limits of this design

See [summary.md](summary.md) section 2 (public repo means questions are readable; codes are checked per
device id, which clearing browser data resets; no record of test results; one seller password).
