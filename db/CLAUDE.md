# db/

The database (Postgres on Neon: project `amigodb`, database `kartak`, role `kartak_app`; docs/architecture.md).

| File / folder | Purpose |
|---|---|
| `schema.sql` | The current full schema (safe to re-run). Loaded by the tests into an in-memory Postgres |
| [migrations/](migrations/CLAUDE.md) | Numbered changes, in the order they were run on the live database |

Rules: to change the database, add the next numbered file in `migrations/`, run it on the live `kartak`
database (Neon console or the Neon tool, as role `kartak_app`), then update `schema.sql` so it matches, and
note it in `docs/progress.md`. Never run destructive SQL on the live database without the user's OK.
