# FS-13 admin ticket detail smoke test

On November 27, 2026, the production Next.js build at `fdc2ef2` ran against a disposable local Supabase database with the PR and `dev` migrations applied. The test used an admin session and synthetic ticket `TCK-2026-00002`. After each change, a fresh admin GET and an independent read of the stored ticket agreed on all three fields.

| Request | HTTP result | Status | Category (`service`) | Priority |
| --- | --- | --- | --- | --- |
| Initial GET | 200 | new | General Inquiry | low |
| PATCH category and priority, then GET | 200 / 200 | new | Technical Support | urgent |
| PATCH only `{"status":"closed"}`, then GET | 200 / 200 | closed | Technical Support | urgent |
| PATCH only `{"status":"open"}`, then GET | 200 / 200 | open | Technical Support | urgent |

The live detail endpoint returned all 1,001 distinct replies and their 1,001 associated files. The replies shared a timestamp and appeared in ID order. After a backdated reply committed, a fresh GET returned 1,002 distinct replies, with that reply first. A missing ticket returned 404, and an anonymous call to the database function returned 401. The synthetic ticket and its thread were removed after the run.

The automated regression separately simulates a backdated reply becoming visible between database requests. Running it against the previous reader reproduced the duplicate `message-999` at the page boundary. The single-statement reader passed. The combined branch passed all 146 tests and the production build. Lint reported zero errors and 14 existing warnings.
