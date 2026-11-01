# Experiments

The gallery and standalone projects at https://experiments.fazleyrabbi.xyz.

## Gallery

Edit `gallery/projects.json`, then run `python3 scripts/build-gallery.py`.
Preview images live in `gallery/previews/`; the landing page uses lightweight static images instead of running many WebGL scenes at once.

## Projects

The 13 projects moved from `../threejs/` retain their source, installed dependencies, local artifacts and any Git history. `scripts/project-paths.json` maps their folder names to public URL paths. Existing experiments retain their URLs.

Run `python3 scripts/build-projects.py` to rebuild the migrated projects, or pass a slug to rebuild one, such as `python3 scripts/build-projects.py simforge`.

Run `python3 scripts/serve-experiments.py` for the integrated preview at http://127.0.0.1:4180. Run `python3 scripts/check-projects.py` to validate gallery entries and entry-point assets.

Deploy from this root directory with `vercel deploy --prod`. The root `.vercel` link points to **experiments**. The root routes serve each project's `dist` folder under its public path; `.vercelignore` keeps local sources, histories, dependencies, recordings and environment files out of the deployment.

SimForge uses `/simforge/` as its router base and supports direct simulation links. Boatride and SimForge load their models relative to the configured project base.
