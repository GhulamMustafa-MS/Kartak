# db/migrations/

Every change made to the live database, in order. Never edit a file after it has been run; add a new one.

| File | Run on | What it does |
|---|---|---|
| `001_initial.sql` | 28 Oct 2026 | Tables `kartak_codes` and `kartak_settings` |
| `002_transfer_token.sql` | 28 Oct 2026 | `transfer_token`, `transfer_expires` on `kartak_codes` (iPhone hand-over, D13) |
| `003_time_limit.sql` | 28 Oct 2026 | `valid_days` on `kartak_codes`: optional time limit counted from the first use (D25) |

| `004_results.sql` | 28 Oct 2026 | Table `kartak_results`: one row per finished test, for the seller's analytics (D26) |

Next file: `005_<what>.sql`, with a header line saying what it does, the decision it belongs to and the date run.
