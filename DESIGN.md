# GridCast AI — visual direction

The landing page at `/` established the direction; this note extends it to the
application under `/dashboard`. It records decisions, not aspirations.

## Composition

The application is an **operations tool**, not a marketing surface. Every screen
answers one question and is laid out around that question:

| Route | Task | Structure |
|---|---|---|
| `/dashboard` | What is demand doing, and what does the model say next? | Figure row → dominant forecast chart |
| `/dashboard/forecast` | Why does the forecast look like that? | Decomposition + distribution, then heatmap, then regional table |
| `/dashboard/model-insights` | Which model is live, how good is it, and why? | Spec list → leaderboard table → drivers → explanation |
| `/dashboard/grid-map` | Where is demand concentrated? | Map + region detail (list/detail), then ranking table |
| `/dashboard/scenarios` | What happens if I change an assumption? | Controls rail + result chart + deltas |
| `/dashboard/schedules` | What ran, what is next? | Status row → job table → cadence + timeline |
| `/dashboard/about` | What is this, and what are its limits? | Definition lists |

Page titles name the **task**, not the product. No 40px headings inside the app.

## Surfaces

| Token | Value | Role |
|---|---|---|
| `--gc-paper` | `#F5F4F0` | app canvas |
| `--gc-surface` | `#FCFCFB` | panels, chart grounds, table stripes |
| `--gc-surface-sunk` | `#EFEEE8` | inset wells, disabled tracks |
| `--gc-rule` | `#E2E0D8` | hairline separators (the default divider) |
| `--gc-rule-strong` | `#C9C6BB` | panel borders, table head/foot rules |

Separators do most of the work. A contained panel is used only when a block is
an independently meaningful object. Shadow is reserved for floating layers
(popovers, tooltips, the mobile nav drawer).

Radius: 6px controls, 8px panels. One radius per role, never one radius for
everything.

## Type

Geist for reading and controls, Geist Mono for labels, identifiers, timestamps
and comparable values. Loaded once in the root layout.

| Role | Size / weight |
|---|---|
| Page title | 20px / 500 |
| Section title | 14px / 500 |
| Body, controls | 13px / 400 |
| Secondary | 12.5px / 400, `--gc-ink-2` |
| Metadata, eyebrows | 10.5px mono, uppercase, `0.08em`, `--gc-ink-3` |
| Figure | 26–30px / 400, proportional numerals |
| Table numerals | 12.5px mono, `tabular-nums`, right aligned |

## Colour

**Two data series colours, fixed in meaning everywhere:**

- `--gc-observed` `#1C57B0` — measured reality: historical demand, observations.
- `--gc-model` `#E0590C` — anything the model produced: forecasts, predictions,
  scenario results, residuals, feature importance.

Validated with the dataviz palette checker against surface `#FCFCFB`:
lightness band PASS, chroma floor PASS, CVD separation 25.9 protan /
34.4 tritan, normal-vision 35.9, contrast PASS.

`--gc-model` doubles as the interface accent for **selection and active state
only** (a nav indicator, a selected row marker, a section number). Primary
buttons are ink-filled so an action is never mistaken for a model output.

**Status is a separate, reserved system** and never reuses the series colours:

- `--gc-ok` `#136F3F` — operational, completed, stable
- `--gc-warn` `#8A5200` — elevated, needs attention (deliberately a dark amber,
  far enough from `--gc-model` to read as a different system)
- `--gc-bad` `#B42318` — failed, unavailable, stressed

Every status colour ships with a text label. Provisional or illustrative values
carry a neutral mono tag (`MOCK OPS`, `ILLUSTRATIVE`) rather than a colour, so
the palette stays two hues wide.

## Data honesty rules

These are product requirements, not styling:

1. **No live feed.** The app reads a frozen NESO 2024 file and a saved model
   artifact. Chrome must say `Artifact data` / `Backend unavailable`, never
   "Live".
2. **1.36% MAPE is one-step-ahead.** Wherever accuracy appears, it is labelled
   as one-step-ahead held-out error. It is never presented as verified accuracy
   for the recursive 48-hour horizon.
3. **The grid map is a national forecast split by fixed regional shares.** The
   model is not regional; regional views say so once, near the numbers.
4. **Unavailable is not zero.** A value that cannot be sourced renders as
   `Unavailable` with a neutral, not a healthy, status.
5. **Simulated ≠ measured.** Scenario output is labelled as simulation from
   documented sensitivity assumptions.

## Density

Nav rail 208px expanded / 60px collapsed. Nav row 32px. Topbar 48px.
Spacing scale 4 / 8 / 12 / 16 / 24 / 32. Table rows 40px single-line.
Charts keep their own local horizontal scroll on narrow screens rather than
shrinking axis type below 10px.


## Rolling back after release

The redesign lands as a merge commit on `main`. Roll back by **adding** a commit,
never by rewriting published history — `main` is deployed from, and a force-push
would break every clone and confuse the hosting integrations.

### 1. Revert the merge (preferred)

```bash
git checkout main
git pull --ff-only origin main

# -m 1 keeps main's first parent, undoing everything the redesign brought in
git revert -m 1 <merge-sha> --no-commit
git revert --continue          # or: git commit
git push origin main
```

Find the merge with `git log --oneline --merges -5`. Reverting a merge is a
normal forward commit: the deployment redeploys the previous UI, history stays
intact, and nothing anyone has cloned is invalidated.

### 2. Restore a single file or directory

When only part of the redesign is at fault, take the old copy without reverting
the rest:

```bash
git checkout backup/pre-redesign-main -- src/app/dashboard/page.tsx
git commit -m "Restore the previous overview page"
git push origin main
```

### 3. Re-applying later

`git revert` of a merge records that the merge's changes were undone, so simply
re-merging the same branch will bring in nothing. To re-apply, revert the revert:

```bash
git revert <revert-sha>
```

### Reference points

| Ref | Points at | Purpose |
|---|---|---|
| `backup/pre-redesign-main` (tag) | `c8cfda9` | The last pre-redesign commit |
| `backup/pre-redesign-main-branch` | `c8cfda9` | Same, as a branch for checkout |
| `landing-redesign` | the redesign work | Kept until the release is confirmed |

Push the backup refs alongside `main` so they exist off this machine:

```bash
git push origin backup/pre-redesign-main            # the tag
git push origin backup/pre-redesign-main-branch     # the branch
```

**Do not** use `git reset --hard` + `--force-with-lease` on `main`. It rewrites
published history, breaks other clones, and can leave the deployment platform
pointing at a commit that no longer exists.
