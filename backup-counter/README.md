# Experiment visit backup

Live service: https://experiments-visit-backup.fazley111.workers.dev

## Active VPS synchronization

Installed on 2026-10-10 at
`/home/fazley/apps/view-counter/backup-sync/sync-vps.py`.
The VPS crontab runs it every minute with `flock` to prevent overlapping imports.
It uses the inspected database `/home/fazley/apps/view-counter/data/views.db`,
table `project_views`, key `visitors`. The first run made a SQLite backup under
`data/backups/`. The database transaction adds only unimported backup visits and
stores its checkpoint in `experiment_backup_imports`.

After committing, the job updates the Cloudflare baseline to the VPS total minus
the already imported backup total. This includes any additional legacy VPS visits
without counting the backup twice. Cloudflare remains the visit collector for the
ten experiments, and counters show the combined totals. Public baselines may
increase; older sync requests cannot reduce them.

Status: `backup-sync/last-sync.json`. Latest job output: `backup-sync/last-run.log`.
If the VPS goes down again, Cloudflare keeps counting; the cron job catches up
after boot. If Cloudflare is unavailable, imports wait for the next successful
run. The frontend refreshes totals every 30 seconds on visible pages and when
the page becomes visible, without adding another visit.

All ten experiments send visits to this service while the VPS is offline. The
Cloudflare SQLite Durable Object is persistent storage. The public API returns
backup visits only until the original VPS totals are entered as baselines.
Browser sessions generate UUIDs; repeat requests with the same UUID do not add
another visit. Previews and known bots only read totals. Counters remain approximate
browser-session counts, not unique people. Origin checks and rate limiting reduce
casual abuse, but this public counter is not fraud-proof.

Since 2026-10-11 the VPS is the primary collector again. `visit-counter.js`
sends each visit to the VPS first and to Cloudflare only if the VPS request
fails, so a visit lands in one store, never both. Pages read both totals and
show the higher one. The sync job below folds Cloudflare-only visits into the
VPS and raises the Cloudflare baseline to match, so both stores converge on the
same (highest) total within a minute.
Do not reset the source ID, delete the Durable Object, or clear its totals after
an import. Its cumulative totals and the VPS import ledger make future imports
safe to repeat.

## Export now or later

Run `python3 backup-counter/export.py` from the Experiments folder. It downloads
a private JSON snapshot into `backup-counter/exports/`. No totals are reset.
Authentication uses `.admin-token` locally, or `COUNTER_ADMIN_TOKEN` from the
environment. Keep the token private; it is excluded from Vercel hosting.

Snapshots contain `source`, `exportedAt`, and cumulative `total` for each project.
Only backup visits are exported; old VPS baselines are never exported.

## When the VPS returns

1. Inspect the actual counter implementation, database type, and schema. Back up
   that database and record its original per-project totals before importing.
2. Download a fresh snapshot. Import each project with one database transaction:
   read the previously imported total for `(source, project)`, add only
   `snapshot.total - imported_total` to the existing counter, and update the
   import ledger in the same transaction. Reject a snapshot whose total is older
   than the ledger. A repeated snapshot adds zero.
3. If the service uses SQLite, `import-sqlite.py` implements that transaction.
   Supply its real database path, table name, project column and count column;
   optionally supply a key column/value if the service stores multiple keys.
   The script requires an existing database and exactly one matching counter
   row for each nonzero delta. Missing or ambiguous rows abort the entire import.
   Initialize missing counters through the VPS service before importing.
   If the service uses another database, implement the same transaction there
   after inspecting its schema. Never replay anonymous `/api/hit` calls: an
   interrupted replay can add the same visits again.
4. Authenticated POST `/admin/baseline` with JSON containing `project` and
   `baseline` sets the Cloudflare displayed total to the original VPS total plus
   all backup visits. Use the original total recorded BEFORE the first import,
   not the new merged VPS total. Repeated values and increases are accepted;
   lower baselines are rejected to protect against stale sync requests.
5. Keep collecting on Cloudflare and repeat snapshot imports as needed. Automatic
   VPS synchronization is now configured as described above.

Example SQLite invocation (replace arguments with the inspected schema):

```
python3 backup-counter/import-sqlite.py SNAPSHOT.json \
  --database /actual/path/to/counter.sqlite \
  --table ACTUAL_TABLE --project-column ACTUAL_PROJECT_COLUMN \
  --count-column ACTUAL_COUNT_COLUMN
```

The import ledger table is `experiment_backup_imports`. Back it up with the
counter table: restoring only one could cause future imports to lose or duplicate
visits. Baseline updates and snapshot exports require the administrator token.

## Adding an experiment

`little-spider` was added to both deployed project lists on 2026-10-16 for Pip’s Little World. Its browser counter uses the same VPS-first collection and Cloudflare fallback.

The project name must be added in two places, and both must go live together,
because the sync job aborts while the two lists differ:

1. `PROJECTS` in `worker.js`, then deploy the worker with Wrangler.
2. `PROJECTS` in `sync-vps.py`, then copy it to the VPS path above.

Totals are not lost while the lists differ; the next successful run catches up.

## Deploy

Wrangler config: `wrangler.jsonc`. Worker: `worker.js`.
Keep the existing Durable Object namespace and `v1` migration.
Deploy with Wrangler, then set the `ADMIN_TOKEN` secret if provisioning afresh.
The entire backup-counter folder is excluded from the public static deployment.

Visits missed before this backup was enabled cannot be reconstructed reliably.

The `experiments` key was added on 2026-10-17 for the gallery landing page. Its counter uses the shared session-based frontend, and the Cloudflare and VPS sync project lists were updated together without resetting existing totals.
